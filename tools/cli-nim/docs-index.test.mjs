import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { DatabaseSync } from 'node:sqlite'
import { chunkMarkdown, hash } from '../../packages/docs-search/src/chunks.ts'
import { prepareIndex, searchIndex } from '../../packages/docs-search/src/index.ts'
import { listDocs } from '../../packages/cli/src/mcp/docs-retrieval.ts'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/docs-index-probe${process.platform === 'win32' ? '.exe' : ''}`)
const fixtures = []
after(() => { for (const path of fixtures) rmSync(path, { recursive: true, force: true }) })
function fixture() { const path = mkdtempSync(join(tmpdir(), 'xplat-nim-index-')); fixtures.push(path); return path }
const embeddingText = chunk => `${chunk.title}\n${chunk.heading}\n${chunk.content}`
function vectorFor(text) {
 const lower = text.toLowerCase()
 return [lower.includes('camera') ? 4 : 1, lower.includes('navigation') ? 4 : 1, 1 + text.length % 7]
}
function config(documents, queries = [], extra = {}) {
 const texts = [...documents.flatMap(chunkMarkdown).map(embeddingText), ...queries]
 return { id: 'fixture-embeddings-v1', vectors: Object.fromEntries(texts.map(text => [text, vectorFor(text)])), ...extra }
}
const docs = [
 { path: 'docs/camera.md', corpus: 'guide', content: '# Camera guide\n\nCapture a scene with CameraView.\n\n## Web\nuseCameraCapture works on web. 😀\n' },
 { path: 'docs/navigation.md', corpus: 'guide', content: '# Navigation\n\nRouteOutlet selects the current route.\n' },
 { path: 'CHANGELOG.md', corpus: 'changelog', content: '# Changes\n## Octane Xplat 0.19.0 2026-10-01\nCameraView now supports macos.\n## v0.20.0 2026-11-01\nNavigation fix.\n' },
]
async function reference(request) {
 const replies = []
 for (const action of request.actions) {
  const current = action.embedder ?? request.embedder
  const batches = []; let prepared = 0, disposed = 0
  const embedder = {
   id: current.id,
   async prepare() { prepared++; if (current.prepareError) throw Error('fixture prepare failure') },
   async dispose() { disposed++; if (current.disposeError) throw Error('fixture dispose failure') },
   async embed(texts) {
    batches.push(texts)
    if (current.failBatch === batches.length) throw Error('fixture embed failure')
    const values = texts.map(text => {
     if (current.invalidVector === 'empty') return []
     if (current.invalidVector === 'zero') return [0, 0]
     if (current.invalidVector === 'nonfinite') return [Infinity]
     if (!(text in current.vectors)) throw Error('fixture vector is missing')
     return current.vectors[text]
    })
    return current.countMismatch ? values.slice(0, -1) : values
   },
  }
  try {
   let value
   if (action.operation === 'inventory') {
    const chunks = request.documents.flatMap(chunkMarkdown)
    value = { chunks, snapshot: hash(`sections-v1:${request.binding}:${JSON.stringify(chunks)}`) }
   } else if (action.operation === 'prepare') value = await prepareIndex({ ...request, embedder })
   else if (action.operation === 'search') value = await searchIndex({ ...request, ...action, embedder })
   else if (action.operation === 'exec' || action.operation === 'query') {
    const db = new DatabaseSync(join(request.cacheDir, 'search-v1.sqlite'))
    try { if (action.operation === 'exec') { db.exec(action.sql); value = null } else value = db.prepare(action.sql).all() }
    finally { db.close() }
   } else throw Error(action.operation)
   replies.push({ ok: true, value, batches, prepared, disposed })
  } catch (error) {
   replies.push({ ok: false, ...(error instanceof SyntaxError ? { kind: 'invalid-json' } : { message: error.message }), batches, prepared, disposed })
  }
 }
 return JSON.parse(JSON.stringify(replies))
}
function native(request) {
 const result = spawnSync(binary, [], { input: JSON.stringify(request) + '\n', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  timeout: 30000, env: { ...process.env, PATH: '' } })
 assert.equal(result.status, 0, result.stderr || result.error?.message || 'index probe failed')
 assert.equal(result.stderr, '')
 return JSON.parse(result.stdout)
}
function equal(actual, expected, path = '') {
 if (Array.isArray(expected)) {
  assert.ok(Array.isArray(actual), path); assert.equal(actual.length, expected.length, path)
  for (let at = 0; at < expected.length; at++) equal(actual[at], expected[at], `${path}.${at}`)
 } else if (expected && typeof expected === 'object') {
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), path)
  for (const key of Object.keys(expected)) {
   if (key === 'vector' && typeof expected[key] === 'string') {
    const a = JSON.parse(actual[key]), e = JSON.parse(expected[key])
    assert.equal(a.length, e.length, path)
    for (let at = 0; at < e.length; at++) assert.ok(Math.abs(a[at] - e[at]) <= 1e-14 * Math.max(1, Math.abs(e[at])), `${path}.vector[${at}]: ${a[at]} != ${e[at]}`)
   } else equal(actual[key], expected[key], `${path}.${key}`)
  }
 } else assert.deepEqual(actual, expected, path)
}
async function compare(request, label) {
 const base = fixture()
 const expected = await reference({ ...request, cacheDir: join(base, 'node') })
 const actual = native({ ...request, cacheDir: join(base, 'native') })
 try { equal(actual, expected) }
 catch (error) {
  const { writeFileSync } = await import('node:fs')
  writeFileSync(join(root, `research/nim-cli/mismatches-docs-index-${label}.json`), JSON.stringify({ request, actual, expected }, null, 2))
  throw error
 }
 return actual
}
const macOnly = { skip: process.platform === 'darwin' ? false : 'native SQLite/locale delivery is qualified only on macOS' }

test('chunk inventory hashes preserve exact JSON bytes, controls, literal escapes and release fields', macOnly, async () => {
 const documents = [...docs, { path: 'docs/control.md', corpus: 'guide', content: '# Escapes\n' + Array.from({ length: 32 }, (_, at) => String.fromCharCode(at)).join('') + '\\u001B\n😀\ud800\n' }]
 const [actual] = await compare({ documents, binding: 'fixture:unicode', embedder: config(documents), actions: [{ operation: 'inventory' }] }, 'inventory')
 assert.equal(actual.ok, true); assert.ok(actual.value.chunks.length > 5)
})

test('cold hybrid search uses FTS5 without embedding or preparation', macOnly, async () => {
 const queries = ['CameraView', 'camera capture', 'navigation', 'useCameraCapture', '😀', '\ud83d', '\ude00', '_', '$', '', 'absent']
 const actions = []
 for (const query of queries) for (const mode of ['lexical', 'hybrid']) for (const limit of [0, 1, 10, -1]) actions.push({ operation: 'search', query, mode, limit })
 const actual = await compare({ documents: docs, binding: 'fixture:cold', embedder: config(docs, queries), actions }, 'cold')
 assert.ok(actual.every(reply => reply.ok && reply.batches.length === 0 && reply.prepared === 0 && reply.disposed === 1))
 assert.ok(actual.some(reply => reply.value.results.length > 0))
})

test('prepared hybrid retrieval reuses embeddings and preserves ranking, model identity and disposal', macOnly, async () => {
 const queries = ['camera', 'navigation', 'RouteOutlet', '😀', 'absent', '']
 const actions = [{ operation: 'prepare' }, { operation: 'prepare' }, ...queries.map(query => ({ operation: 'search', query }))]
 const actual = await compare({ documents: docs, binding: 'fixture:ready', embedder: config(docs, queries), actions }, 'prepared')
 assert.ok(actual.every(reply => reply.ok))
 assert.ok(actual[0].value.embedded > 0); assert.equal(actual[1].value.embedded, 0)
 assert.ok(actual.slice(2).every(reply => reply.value.retrieval.used === 'hybrid'))
})

test('failed preparation preserves completed batches for a later resume', macOnly, async () => {
 const documents = Array.from({ length: 70 }, (_, at) => ({ path: `docs/file-${at}.md`, corpus: 'guide', content: `# Camera ${at}\nUnique content ${at}\n` }))
 const regular = config(documents, ['camera'])
 const actual = await compare({ documents, binding: 'fixture:batches', embedder: regular, actions: [
  { operation: 'prepare', embedder: { ...regular, failBatch: 2 } },
  { operation: 'query', sql: 'SELECT count(*) AS count FROM embeddings' },
  { operation: 'prepare' }, { operation: 'prepare' }, { operation: 'search', query: 'camera' },
 ] }, 'batches')
 assert.equal(actual[0].ok, false)
 assert.equal(actual[1].value[0].count, 32)
 assert.equal(actual[2].value.embedded, 38)
 assert.equal(actual[3].value.embedded, 0)
})

test('embedding deduplication follows UTF-8 hashes and last-value Map ownership', macOnly, async () => {
 const documents = [{ path: 'docs/first.md', corpus: 'guide', content: '# Same\n\ud800' },
  { path: 'docs/second.md', corpus: 'guide', content: '# Same\n\ufffd' }]
 const [actual] = await compare({ documents, binding: 'fixture:dedup', embedder: config(documents), actions: [{ operation: 'prepare' }] }, 'dedup')
 assert.equal(actual.ok, true); assert.equal(actual.value.chunks, 2); assert.equal(actual.value.embedded, 1)
 assert.deepEqual(actual.batches[0], [embeddingText(chunkMarkdown(documents[1])[0])])
})

test('preparation errors, invalid vectors and finalizer failures preserve durable state', macOnly, async () => {
 for (const extra of [{ prepareError: true }, { countMismatch: true }, { invalidVector: 'empty' }, { invalidVector: 'zero' }, { invalidVector: 'nonfinite' }, { disposeError: true }]) {
  const current = config(docs, [], extra)
  const [actual] = await compare({ documents: docs, binding: 'fixture:failure', embedder: current, actions: [{ operation: 'prepare' }] }, 'failure-' + Object.keys(extra)[0] + String(Object.values(extra)[0]))
  assert.equal(actual.ok, false)
  assert.equal(actual.disposed, 1)
 }
})

test('cached malformed, empty and dimension-mismatched vectors report the same fallback state', macOnly, async () => {
 for (const vector of ['not json', 'null', '[]', '[1e999]', '["1"]', '[1,0,0,0]']) {
  const regular = config(docs, ['camera'])
  const actual = await compare({ documents: docs, binding: 'fixture:cache-errors', embedder: regular, actions: [
   { operation: 'prepare' }, { operation: 'exec', sql: `UPDATE embeddings SET vector='${vector}'` },
   { operation: 'search', query: 'camera' },
  ] }, 'cache-' + vector.replace(/[^a-z0-9]/g, ''))
  if (vector === 'not json') assert.equal(actual[2].kind, 'invalid-json')
  else assert.ok(['index-not-ready', 'model-unavailable'].includes(actual[2].value.retrieval.reason))
 }
})

test('model identities isolate cached embeddings without changing the document snapshot', macOnly, async () => {
 const first = config(docs, ['camera'], { id: 'fixture-v1' }), second = { ...first, id: 'fixture-v2' }
 const actual = await compare({ documents: docs, binding: 'fixture:models', embedder: first, actions: [
  { operation: 'prepare' }, { operation: 'search', query: 'camera', embedder: second },
  { operation: 'prepare', embedder: second }, { operation: 'search', query: 'camera', embedder: second },
  { operation: 'query', sql: 'SELECT model, count(*) AS count FROM embeddings GROUP BY model ORDER BY model' },
 ] }, 'models')
 assert.equal(actual[1].value.retrieval.reason, 'index-not-ready')
 assert.equal(actual[0].value.snapshot, actual[2].value.snapshot)
 assert.equal(actual[0].value.embedded, actual[2].value.embedded)
 assert.equal(actual[3].value.retrieval.used, 'hybrid')
 assert.equal(actual[4].value.length, 2)
})

test('empty inventories skip model preparation, and failed snapshot writes roll back all index rows', macOnly, async () => {
 const empty = await compare({ documents: [], binding: 'fixture:empty', embedder: config([], ['camera'], { prepareError: true }), actions: [
  { operation: 'prepare' }, { operation: 'search', query: 'camera' },
 ] }, 'empty')
 assert.equal(empty[0].ok, true); assert.equal(empty[0].prepared, 0); assert.equal(empty[0].value.chunks, 0)
 const documents = [docs[0], docs[0]]
 const failed = await compare({ documents, binding: 'fixture:duplicates', embedder: config(documents), actions: [
  { operation: 'prepare' }, { operation: 'query', sql: 'SELECT count(*) AS count FROM chunks' },
  { operation: 'query', sql: 'SELECT count(*) AS count FROM fulltext' },
  { operation: 'query', sql: 'SELECT count(*) AS count FROM snapshots' },
 ] }, 'duplicates')
 assert.equal(failed[0].ok, false)
 assert.ok(failed.slice(1).every(reply => reply.value[0].count === 0))
})

test('normalization handles extreme finite vectors through actual prepared cache rows', macOnly, async () => {
 const documents = [{ path: 'docs/extreme.md', corpus: 'guide', content: '# Extreme\nvector' }]
 const text = embeddingText(chunkMarkdown(documents[0])[0])
 for (const values of [[3, 4], [1e308, 1e308], [1e-300, 1e-300], [5e-324, 5e-324], [1e308, -1e308, 1e308, 1e308]]) {
  const actual = await compare({ documents, binding: 'fixture:extreme', embedder: { id: 'extreme', vectors: { [text]: values } }, actions: [
   { operation: 'prepare' }, { operation: 'query', sql: 'SELECT vector FROM embeddings' },
  ] }, 'extreme-' + values.length + String(values[0]))
  assert.equal(actual[0].ok, true)
  assert.ok(JSON.parse(actual[1].value[0].vector).every(Number.isFinite))
 }
})

test('Node and native prepared indexes serve each other without rebuilding cached embeddings', macOnly, async () => {
 for (const owner of ['node', 'native']) {
  const request = { documents: docs, binding: 'fixture:interop', cacheDir: fixture(), embedder: config(docs, ['camera']), actions: [{ operation: 'prepare' }] }
  const prepared = owner === 'node' ? await reference(request) : native(request)
  assert.equal(prepared[0].ok, true); assert.ok(prepared[0].value.embedded > 0)
  const search = { ...request, actions: [{ operation: 'search', query: 'camera' }, { operation: 'prepare' }] }
  const expected = await reference(search), actual = native(search)
  equal(actual, expected)
  assert.equal(actual[0].value.retrieval.used, 'hybrid')
  assert.equal(actual[0].batches.length, 1)
  assert.equal(actual[1].value.embedded, 0)
 }
})

test('real repository Markdown inventory, snapshots and lexical results match Node', macOnly, async () => {
 const documents = listDocs(root).filter(doc => doc.path.startsWith('docs/') && doc.corpus === 'guide').slice(0, 24)
  .map(doc => ({ path: doc.path, corpus: doc.corpus, content: readFileSync(doc.file, 'utf8') }))
 assert.equal(documents.length, 24)
 const queries = ['navigation', 'signals', 'install', 'keyboard']
 const actual = await compare({ documents, binding: 'fixture:real-docs', embedder: config(documents, queries), actions: [
  { operation: 'inventory' }, ...queries.map(query => ({ operation: 'search', query })),
 ] }, 'real')
 assert.ok(actual.every(reply => reply.ok))
 assert.ok(actual.slice(1).some(reply => reply.value.results.length > 0))
})
