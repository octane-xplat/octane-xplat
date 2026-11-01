// Explicit real-model qualification. Never included in the ordinary offline gate.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, symlinkSync, rmSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { gzipSync } from 'node:zlib'
import { localEmbedder, MODEL, modelId } from '../../packages/docs-search/src/model.ts'
import { prepareIndex, searchIndex } from '../../packages/docs-search/src/index.ts'
import { poolEmbedding } from '../../packages/docs-search/src/inference.ts'
import { modelFixtureDir, modelFiles } from './model-fixtures.mjs'
import { runtimeDir, runtimeTarget } from './ort-fixtures.mjs'
import { assertCurrentNativeBuild, artifactFingerprint } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/nim-cli')
const binary = join(work, 'native/model-probe')
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(work, 'native/model-build.json'))), readFileSync(binary))
const library = join(runtimeDir, runtimeTarget.library)
const fixtures = []
const artifact = path => { const bytes = readFileSync(path); return { ...artifactFingerprint(bytes), gzipBytes: gzipSync(bytes).length } }
const evidence = { host: `${process.platform}-${process.arch}`, probe: artifact(binary), runtime: artifact(library),
 weights: artifact(join(modelFixtureDir, 'onnx/model_quantized.onnx')), comparisons: [], rankings: [] }
after(() => {
 writeFileSync(join(work, 'model-qualification.json'), JSON.stringify(evidence))
 for (const path of fixtures) rmSync(path, { recursive: true, force: true })
})
function fixture() {
 mkdirSync(join(work, 'model-cases'), { recursive: true })
 const path = mkdtempSync(join(work, 'model-cases/case-')); fixtures.push(path)
 const link = join(path, 'models', MODEL.name, MODEL.revision)
 mkdirSync(dirname(link), { recursive: true }); symlinkSync(modelFixtureDir, link, 'dir')
 return path
}
function native(requests, { allowStderr = false } = {}) {
 const run = spawnSync('/usr/bin/sandbox-exec', ['-p', '(version 1)(allow default)(deny network*)', binary], { input: requests.map(request => JSON.stringify({ directory: modelFixtureDir, library, ...request })).join('\n') + '\n',
  encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PATH: '' } })
 assert.equal(run.status, 0, run.stderr || run.error?.message)
 if (!allowStderr) assert.equal(run.stderr, '')
 const replies = run.stdout.trim().split('\n').map(line => JSON.parse(line))
 assert.equal(replies.length, requests.length)
 return replies
}
function successful(requests) {
 return native(requests).map(reply => { assert.equal(reply.ok, true, reply.message); return reply.value })
}
function compareNumbers(actual, expected, tolerance = 1e-14) {
 assert.equal(actual.length, expected.length)
 for (let at = 0; at < actual.length; at++) assert.ok(Math.abs(actual[at] - expected[at]) <= tolerance, `component ${at}: ${actual[at]} versus ${expected[at]}`)
}
function metrics(actual, expected) {
 return { cosine: actual.reduce((sum, value, at) => sum + value * expected[at], 0),
  maxAbsolute: Math.max(...actual.map((value, at) => Math.abs(value - expected[at]))) }
}

test('native Float32 mean pooling matches the reference values and errors', () => {
 const cases = [
  { values: [2, 0, 0, 2, 100, 100], mask: [1, 1, 0], dimensions: 2 },
  { values: [1], mask: [1], dimensions: 2 }, { values: [1, 1], mask: [0], dimensions: 2 },
  { values: [0, 0], mask: [1], dimensions: 2 }, { values: ['NaN', 1], mask: [1], dimensions: 2 },
  { values: ['NaN', 1, 1, 1], mask: [0, 1], dimensions: 2 }, { values: ['Infinity', 1], mask: [1], dimensions: 2 },
  { values: [-0, -1], mask: [-3], dimensions: 2 }, { values: [], mask: [], dimensions: 384 },
  { values: [], mask: [1], dimensions: 0 }, { values: [1e-45, -1e-45], mask: [1], dimensions: 2 },
  { values: [3.4e38, 3.4e38], mask: [1], dimensions: 2 },
 ]
 let seed = 0x6d6c6173
 const random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 2 ** 32 }
 for (let at = 0; at < 40; at++) {
  const dimensions = at % 2 ? 384 : 3, tokens = at % 9 + 1
  cases.push({ values: Array.from({ length: tokens * dimensions }, () => (random() - 0.5) * 20),
   mask: Array.from({ length: tokens }, (_, i) => i === 0 || random() > 0.5 ? 1 : 0), dimensions })
 }
 const replies = native(cases.map(request => ({ operation: 'pool', ...request })))
 for (const [at, request] of cases.entries()) {
  let expected
  try { expected = poolEmbedding(Float32Array.from(request.values, Number), request.mask, request.dimensions) }
  catch (error) { assert.equal(replies[at].ok, false); assert.equal(replies[at].message, error.message); continue }
  assert.equal(replies[at].ok, true, replies[at].message)
  compareNumbers(replies[at].value, expected)
 }
})

test('model/runtime checksums and empty-input laziness protect the real C API boundary', () => {
 const bad = fixture()
 const path = join(bad, 'bad-library'); writeFileSync(path, 'altered')
 const replies = native([
  { operation: 'embed', directory: join(bad, 'missing'), library: path, texts: [] },
  { operation: 'prepare', library: path },
  { operation: 'prepare', directory: bad },
  { operation: 'prepare' },
 ])
 assert.deepEqual(replies[0], { ok: true, value: [] })
 assert.equal(replies[1].ok, false); assert.match(replies[1].message, /runtime checksum mismatch/)
 assert.equal(replies[2].ok, false)
 assert.deepEqual(replies[3], { ok: true, value: null })
})

test('all four reference model assets are required even when encoding does not consume them', async () => {
 const requests = []
 const message = 'Pinned model file is absent or invalid; run docs index'
 for (const altered of Object.keys(modelFiles)) {
  const cacheDir = fixture(), directory = join(cacheDir, 'altered-model')
  for (const file of Object.keys(modelFiles)) {
   const target = join(directory, file); mkdirSync(dirname(target), { recursive: true })
   if (file === altered) writeFileSync(target, 'altered')
   else symlinkSync(join(modelFixtureDir, file), target)
  }
  const link = join(cacheDir, 'models', MODEL.name, MODEL.revision)
  rmSync(link); symlinkSync(directory, link, 'dir')
  const reference = localEmbedder(cacheDir)
  try { await assert.rejects(reference.prepare(), { message }) } finally { await reference.dispose() }
  requests.push({ operation: 'prepare', directory })
 }
 for (const reply of native(requests)) assert.deepEqual(reply, { ok: false, message })
})

test('real CPU inference is deterministic across batch companions and explicit disposal', () => {
 const texts = ['', 'Café 中文 🚀', 'navigation '.repeat(800), '[CLS]hello[MASK]world[SEP]']
 const requests = [{ operation: 'embed', texts }, ...texts.map(text => ({ operation: 'embed', texts: [text] })),
  { operation: 'dispose' }, { operation: 'embed', texts }]
 const results = successful(requests)
 for (const [at, vector] of results[0].entries()) {
  assert.equal(vector.length, 384); assert.ok(vector.every(Number.isFinite))
  assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-12)
  assert.deepEqual(results[at + 1][0], vector)
 }
 assert.deepEqual(results.at(-1), results[0])
})

test('invalid inference inputs return diagnostics and later sessions remain usable', () => {
 const inputs = { model: join(modelFixtureDir, 'onnx/model_quantized.onnx'), ids: [101, 7592, 102], mask: [1, 1, 1], types: [0, 0, 0] }
 const replies = native([
  { operation: 'run', ...inputs, ids: [-1, 7592, 102] },
  { operation: 'run', ...inputs, mask: [] },
  { operation: 'run', ...inputs, types: [99, 99, 99] },
  { operation: 'closed-session', ...inputs },
  { operation: 'run', ...inputs },
  { operation: 'embed', texts: ['hello'] },
 ], { allowStderr: true })
 assert.equal(replies[0].message, 'Invalid MiniLM token ID')
 assert.equal(replies[1].message, 'Invalid MiniLM input shape')
 assert.equal(replies[2].ok, false)
 assert.match(replies[2].message, /indices|index|bounds/i)
 assert.equal(replies[3].message, 'Native ONNX session is closed')
 assert.equal(replies[4].ok, true)
 assert.equal(replies[5].ok, true)
 assert.deepEqual(replies[4].value, replies[5].value[0])
})

test('graph choices expose native/WASM drift and use distinct native cache identities', async () => {
 const texts = ['hello world', '', 'Café 中文 🚀', 'navigation '.repeat(800), 'remember form input when switching pages']
 const embedder = localEmbedder(fixture())
 let reference
 try { reference = await embedder.embed(texts) } finally { await embedder.dispose() }
 const levels = [0, 1, 2, 99]
 const requests = levels.flatMap(optimization => [{ operation: 'id', optimization }, { operation: 'embed', optimization, texts }])
 const outputs = successful(requests)
 const identities = levels.map((_, at) => outputs[at * 2])
 assert.equal(new Set(identities).size, levels.length)
 assert.ok(identities.every(identity => identity !== modelId && identity.includes(':native-1.31.1:') && identity.includes(`:library-${runtimeTarget.librarySha256}:`)))
 for (const [index, optimization] of levels.entries()) {
  const comparisons = outputs[index * 2 + 1].map((vector, at) => ({ text: texts[at].slice(0, 70), ...metrics(vector, reference[at]) }))
  evidence.comparisons.push({ optimization, identity: identities[index], comparisons })
  // Basic and disabled graphs closely match short reference sequences. The
  // remaining long-sequence drift is recorded, not relabeled exact parity.
  if (optimization === 0 || optimization === 1) for (const at of [0, 1, 2, 4]) assert.ok(comparisons[at].maxAbsolute < 1e-5)
 }
 const [defaultId] = successful([{ operation: 'id' }])
 assert.equal(defaultId, identities[1])
 console.log(JSON.stringify(evidence.comparisons))
})

test('cold hybrid lookup stays lexical with missing local model and runtime assets', () => {
 const cacheDir = fixture()
 const documents = [{ path: 'docs/navigation.md', corpus: 'guide', content: '# Navigation\n\nRemember screen state.' }]
 const [results] = successful([{ operation: 'index', directory: join(cacheDir, 'absent'), library: join(cacheDir, 'absent-runtime'),
  documents, cacheDir, binding: 'cold', actions: [{ operation: 'search', query: 'navigation' }] }])
 assert.equal(results[0].retrieval.used, 'lexical')
 assert.equal(results[0].retrieval.reason, 'index-not-ready')
 assert.equal(results[0].results.length, 1)
})

test('real maintained-guide retrieval matches Node rankings with separate engine caches', async () => {
 const cacheDir = fixture()
 const documents = ['docs/app/navigation.md', 'docs/app/local-storage.md', 'docs/platform/media-services.md', 'docs/testing/test-identifiers.md']
  .map(path => ({ path, corpus: 'guide', content: readFileSync(join(root, path), 'utf8') }))
 const queries = [
  'ask for confirmation before throwing away unfinished form changes',
  'keep saved records after closing and reopening the database',
  'get query results as positional arrays instead of objects',
  'capture a voice memo from the microphone',
  'make speech faster while keeping its pitch',
  'stable automation selectors after the interface is translated',
 ]
 const options = { documents, binding: 'maintained-guides', cacheDir }
 const prepared = await prepareIndex(options)
 const reference = []
 for (const query of queries) reference.push(await searchIndex({ ...options, query, limit: 3 }))
 const [actual] = successful([{ operation: 'index', ...options, actions: [{ operation: 'prepare' },
  ...queries.map(query => ({ operation: 'search', query, limit: 3 })), { operation: 'prepare' }] }])
 const nativeId = actual[0].model
 assert.notEqual(nativeId, prepared.model)
 assert.deepEqual({ ...actual[0], model: prepared.model }, prepared)
 assert.equal(actual.at(-1).embedded, 0)
 const mismatches = []
 for (const [at, expected] of reference.entries()) {
  const result = actual[at + 1]
  evidence.rankings.push({ query: queries[at], node: expected, native: result })
  assert.equal(result.retrieval.used, 'hybrid')
  try { assert.deepEqual({ ...result, retrieval: { ...result.retrieval, model: expected.retrieval.model } }, expected) }
  catch { mismatches.push({ query: queries[at], node: expected.results.map(hit => hit.key), native: result.results.map(hit => hit.key) }) }
 }
 const db = new DatabaseSync(join(cacheDir, 'search-v1.sqlite'))
 try {
  const rows = db.prepare('SELECT model,COUNT(*) AS count FROM embeddings GROUP BY model').all()
  assert.deepEqual(new Set(rows.map(row => row.model)), new Set([modelId, nativeId]))
  assert.equal(rows[0].count, rows[1].count)
 } finally { db.close() }
 assert.deepEqual(mismatches, [], 'Actual native/WASM ranking differences require investigation')
})
