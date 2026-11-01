import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync, utimesSync, symlinkSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { codeTokens, createCodeIndex } from '../../packages/cli/src/mcp/code-index.ts'
import { readCodeFile, searchCodeFiles } from '../../packages/cli/src/mcp/code-retrieval.ts'
import { createCodeService } from '../../packages/cli/src/mcp/code-service.ts'
import { listCorpusFiles } from '../../packages/cli/src/mcp/code-scope.ts'
import { jsonBoundarySources } from './json-cases.mjs'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/code-probe${process.platform === 'win32' ? '.exe' : ''}`)
const fixtures = []
function fixture() { const dir = mkdtempSync(join(tmpdir(), 'xplat-native-code-')); fixtures.push(dir); return dir }
after(() => { for (const dir of fixtures) rmSync(dir, { recursive: true, force: true }) })
function file(path, contents = 'export const CameraView = useCameraCapture()\n') {
 mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, contents)
}
function json(path, value) { file(path, JSON.stringify(value)) }
function tagged(path, rel, corpus) { const { mtimeMs, size } = statSync(path); return { abs: path, rel, mtimeMs, size, corpus } }
function mutate(step) {
 if (step.operation === 'write') { file(step.path, step.text); if (step.mtime !== undefined) utimesSync(step.path, step.mtime, step.mtime); return true }
 if (step.operation === 'remove') { rmSync(step.path); return true }
 return false
}
function filesFor(r) {
 if (!r.root) return r.files
 return listCorpusFiles(r.root).files.map(file => ({ ...file, corpus: { corpus: 'app', package: null, root: r.root } }))
}
function canonical(value) { return JSON.parse(JSON.stringify(value, (_, v) => v instanceof Map ? Object.fromEntries(v) : v)) }
function jsonSemantics(value) {
 if (value === null) return { kind: 'null' }
 if (Array.isArray(value)) return { kind: 'array', items: value.map(jsonSemantics) }
 if (typeof value === 'object') return { kind: 'object', fields: Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, jsonSemantics(entry)])) }
 if (typeof value === 'string') return { kind: 'string', units: Array.from({ length: value.length }, (_, at) => value.charCodeAt(at)), utf8: [...Buffer.from(value, 'utf8')] }
 if (typeof value === 'number') return { kind: 'number', text: String(value), negativeZero: Object.is(value, -0) }
 return { kind: 'boolean', value }
}
async function expected(r) {
 try {
  let value
  switch (r.operation) {
   case 'tokens': value = codeTokens(r.text); break
   case 'lower': value = r.text.toLowerCase(); break
   case 'decode': value = Buffer.from(r.bytes).toString('utf8'); break
   case 'slice': value = r.text.slice(r.first, r.last); break
   case 'wire': value = JSON.parse(r.source); break
   case 'json-semantics': value = jsonSemantics(JSON.parse(r.source)); break
   case 'read-json': case 'read-json-semantics': {
    try { value = JSON.parse(readFileSync(r.path, 'utf8')) } catch { value = null }
    if (r.operation === 'read-json-semantics') value = jsonSemantics(value)
    break
   }
   case 'read': value = readCodeFile(r.path, { offset: r.offset, limit: r.limit }); break
   case 'search': value = searchCodeFiles(r.files, { query: r.query, limit: r.limit }); break
   case 'capture': {
    const reply = spawnSync(r.command, r.args, { cwd: r.cwd, encoding: 'utf8', timeout: r.timeout ?? 5000,
     maxBuffer: r.maxBytes ?? 1024 * 1024, env: { ...process.env, PATH: '' } })
    if (reply.error) throw reply.error
    value = { output: reply.stdout, error: reply.stderr, exitCode: reply.status, timedOut: false }
    break
   }
   case 'index': {
    const index = createCodeIndex(); value = []
    for (const step of r.steps) {
     if (mutate(step)) continue
     const collect = () => { if (step.fail) throw Error('fixture enumeration failed'); return filesFor(r) }
     if (step.operation === 'ensure') value.push(index.ensure(collect))
     else if (step.operation === 'ready') value.push(await index.whenReady(collect))
     else if (step.operation === 'status') value.push(index.status())
     else if (step.operation === 'preparing') value.push(index.preparing)
     else if (step.operation === 'search') value.push(index.search(step.query, { limit: step.limit, accept: step.accept ? file => step.accept.includes(file.rel) : undefined }))
     else throw Error('Unknown index step')
    }
    break
   }
   case 'service': {
    const service = createCodeService({ workspaceRoot: r.root, workspaceKind: r.kind,
     execFile: r.git ? (command, args) => { if (r.git.fail) throw Error('fixture git unavailable'); return args.includes('rev-parse') ? r.git.head ?? '' : r.git.dirty ?? '' } : undefined })
    value = []
    for (const step of r.steps) {
     if (mutate(step)) continue
     const options = { ...step, app: step.app === undefined ? r.app : step.app }
     if (step.operation === 'search') value.push(service.search(options))
     else if (step.operation === 'read') value.push(service.read(options))
     else if (step.operation === 'status') value.push(service.status(options.app, options.workspaceKind))
     else if (step.operation === 'prepare') value.push(await service.prepareIndex(options.app, options.workspaceKind))
     else throw Error('Unknown service step')
    }
    break
   }
   default: throw Error('Unknown operation')
  }
  return canonical({ ok: true, value: value ?? null })
 } catch (error) { return { ok: false, message: error.message } }
}
function equal(actual, expected, path = '') {
 if (typeof expected === 'number' && typeof actual === 'number' && /(?:score|norm|vector)(?:\.|$)/.test(path)) {
  assert.ok(Math.abs(actual - expected) <= 1e-12 * Math.max(1, Math.abs(expected)), `${path}: ${actual} != ${expected}`)
 } else if (expected && typeof expected === 'object') {
  assert.equal(Array.isArray(actual), Array.isArray(expected), path)
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), path)
  for (const key of Object.keys(expected)) equal(actual[key], expected[key], `${path}.${key}`)
 } else assert.deepEqual(actual, expected, path)
}
async function compare(requests, group, verifyReference = () => {}) {
 const reference = []
 for (const r of requests) {
  const value = await expected(r)
  assert.equal(value.ok, !r.invalid, `Invalid reference fixture in ${group}: ${value.message}`)
  reference.push(value)
 }
 verifyReference(reference)
 const child = spawnSync(binary, [], { encoding: 'utf8', input: requests.map(r => JSON.stringify(r)).join('\n') + '\n',
  maxBuffer: 48 * 1024 * 1024, timeout: 60000, env: { ...process.env, PATH: '' } })
 assert.equal(child.status, 0, child.stderr)
 const actual = child.stdout.trim().split('\n').map(JSON.parse)
 assert.equal(actual.length, requests.length)
 const mismatches = []
 for (let i = 0; i < requests.length; i++) {
  try {
   if (requests[i].invalid) assert.equal(actual[i].ok, false)
   else equal(actual[i], reference[i])
  }
  catch (error) { mismatches.push({ request: requests[i], expected: reference[i], actual: actual[i], difference: error.message }) }
 }
 if (mismatches.length) writeFileSync(join(root, `research/nim-cli/mismatches-code-${group}.json`), JSON.stringify(mismatches, null, 2))
 console.log(`${requests.length} code differential cases checked (${group})`)
 assert.deepEqual(mismatches.map(m => ({ operation: m.request.operation, difference: m.difference })), [])
}

test('UTF-8 replacement decoding, full lowercase, tokens and UTF-16 slices match Node', async () => {
 const requests = []
 for (let byte = 0; byte < 256; byte++) requests.push({ operation: 'decode', bytes: [byte] })
 for (const first of [0xc0, 0xc2, 0xdf, 0xe0, 0xe1, 0xed, 0xef, 0xf0, 0xf1, 0xf4, 0xf5])
  for (const second of [0, 0x7f, 0x80, 0x8f, 0x90, 0x9f, 0xa0, 0xbf, 0xc0, 0xff])
   for (const tail of [[], [0x80], [0xbf, 0x80], [0xff, 0x80]]) requests.push({ operation: 'decode', bytes: [first, second, ...tail] })
 for (const bytes of [[0xef, 0xbb, 0xbf], [0xff, 0xff, 0xff], [0xed, 0xa0, 0xbd], [0xf0, 0x9f, 0x98, 0x80], [0xf4, 0x8f, 0xbf, 0xbf]]) requests.push({ operation: 'decode', bytes })
 const samples = ['', 'useCameraCapture', 'ABCDef a1BC foo__BAR $$ $a __', 'İ ß ẞ ᾈ 𐐀', 'AΣ AΣB AΣ: AΣ.Α Σ\u0345 AΣ\u0345', 'AΣ\u0301 AΣ\u0301B', 'café 中文 １２３ Ⅻ 😀', '\u1c89\ua7cb\u{10d50}', 'line1\r\nline2', '\ufeffFile\u00a0Name']
 for (const source of ['1e400', '-1e400', '[1e400,-1e400,0,-0,1e-10000]', '{"inf":1e400,"literal":"inf"}']) requests.push({ operation: 'wire', source })
 for (const text of samples) requests.push({ operation: 'lower', text }, { operation: 'tokens', text })
 for (const text of ['a😀b\ncafé', '😀😀\r\nİ', 'ascii', ''])
  for (const first of [-100, -3, -1, 0, 1, 2, 3, 4, 100, 1e308, -1e308, 1.5])
   for (const last of [-2, 0, 1, 2, 3, 5, 100, 1e308]) requests.push({ operation: 'slice', text, first, last })
 await compare(requests, 'text')
})

test('exact search preserves identifier boundaries, ranking, duplicate tokens, excerpts and live hashes', async () => {
 const dir = fixture(), corpus = { corpus: 'app', root: dir, package: null }
 const sources = {
  'CameraView.ts': 'export const CameraView = useCameraCapture()\nconst $token = "value"; const foo$ = 1\n',
  'src/camera.ts': 'camera camera foo$bar a$token\nfirst phrase\na b\n',
  'src/unicode.ts': 'İ'.repeat(12) + '\nAΣ café 中文\n😀 '.repeat(15) + '\n' + 'CameraView'.repeat(100),
  'src/late.ts': '\n'.repeat(51) + 'CameraView and camera\n' + 'after\n'.repeat(10),
  'src/nul.ts': 'CameraView\0useCameraCapture',
 }
 const files = []
 for (const [rel, content] of Object.entries(sources)) { const path = join(dir, rel); file(path, content); files.push(tagged(path, rel, corpus)) }
 files.push({ abs: join(dir, 'missing.ts'), rel: 'missing.ts', corpus })
 const requests = []
 for (const query of ['CameraView', 'camera', 'Camera', 'useCameraCapture', '$token', 'foo$', 'a b', 'café', 'İ', 'AΣ', '中文', '😀', 'missing', '_', '$', ' ', 'camera camera', 'phrase token', 'CameraView.ts'])
  for (const limit of [0, 1, 10, 50, -1]) requests.push({ operation: 'search', files, query, limit })
 await compare(requests, 'exact')
})

test('bounded reads preserve UTF-16 continuation, split surrogates, malformed UTF-8 and binary refusal', async () => {
 const dir = fixture(), requests = []
 const contents = ['ascii\nsecond\n', 'a😀b\ncafé\r\nİ', '\ufeffBOM 😀\n', '', 'binary\0source', Buffer.from([0x61, 0xff, 0xe1, 0x80, 0x0a, 0xf0, 0x9f, 0x98, 0x80])]
 for (let i = 0; i < contents.length; i++) {
  const path = join(dir, `${i}.ts`); file(path, contents[i])
  for (const offset of [-5, -1, 0, 1, 2, 3, 4, 10, 100, 1e308]) for (const limit of [0, 1, 2, 4, 24000]) requests.push({ operation: 'read', path, offset, limit })
 }
 requests.push({ operation: 'read', path: join(dir, 'missing.ts') }, { operation: 'read', path: dir })
 await compare(requests, 'read')
})

test('strict JSON preserves UTF-16, duplicate-key order, negative zero and wire normalization', async () => {
 const requests = []
 for (const { source, invalid } of jsonBoundarySources())
  requests.push({ operation: 'wire', source, invalid }, { operation: 'json-semantics', source, invalid })
 const dir = fixture()
 const sources = [Buffer.from('{"name":"raw �"}'), Buffer.from([123, 34, 118, 34, 58, 34, 0xff, 0xed, 0xa0, 0xbd, 34, 125]),
  Buffer.from('{"version":"\\ud800","negative":-0}'), Buffer.from('{"value":1e400}'), Buffer.from('\ufeff{}'), Buffer.from('{"value":,}')]
 for (let at = 0; at < sources.length; at++) {
  const path = join(dir, `${at}.json`); file(path, sources[at])
  requests.push({ operation: 'read-json', path }, { operation: 'read-json-semantics', path })
 }
 await compare(requests, 'json-boundary')
})

test('control-probe capture drains both pipes, preserves argv/exit, decodes output and closes stdin', async () => {
 await compare([
  { operation: 'capture', command: process.execPath, args: ['-e', 'process.stdout.write("o".repeat(200000)); process.stderr.write("e".repeat(200000)); process.exitCode=23'] },
  { operation: 'capture', command: process.execPath, args: ['-e', 'process.stdout.write(Buffer.from([97,255,237,160,189])); process.stderr.write("café 😀")'] },
  { operation: 'capture', command: process.execPath, args: ['-e', 'process.stdout.write(JSON.stringify(process.argv.slice(1)))', '--', 'space value', 'quote"value', '$literal', '😀'] },
  { operation: 'capture', command: process.execPath, args: ['-e', 'process.stdin.on("end",()=>process.stdout.write("eof"));process.stdin.resume()'] },
 ], 'capture')
})

test('control-probe deadlines kill and reap the direct child, and output caps fail explicitly', () => {
 const dir = fixture(), pidFile = join(dir, 'child.pid')
 const request = { operation: 'capture', command: process.execPath,
  args: ['-e', 'require("node:fs").writeFileSync(process.argv[1],String(process.pid));setInterval(()=>{},1000)', pidFile], timeout: 500 }
 const started = performance.now()
 const child = spawnSync(binary, [], { input: JSON.stringify(request) + '\n', encoding: 'utf8', timeout: 5000, env: { ...process.env, PATH: '' } })
 assert.equal(child.status, 0, child.stderr)
 const reply = JSON.parse(child.stdout)
 assert.equal(reply.ok, true); assert.equal(reply.value.timedOut, true)
 assert.ok(performance.now() - started < 4000)
 const pid = Number(readFileSync(pidFile, 'utf8'))
 assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
 const capped = spawnSync(binary, [], { input: JSON.stringify({ operation: 'capture', command: process.execPath,
  args: ['-e', 'process.stdout.write("x".repeat(1024))'], maxBytes: 64 }) + '\n', encoding: 'utf8', timeout: 5000 })
 assert.equal(capped.status, 0, capped.stderr)
 const rejected = JSON.parse(capped.stdout)
 assert.equal(rejected.ok, false); assert.match(rejected.message, /output exceeds limit/)
})

test('local index preserves immediate readiness, vectors, scope filters and fresh rebuilds', async () => {
 const dir = fixture(), files = ['CameraView.ts', 'storage.ts', 'native/Button.tsrx'].map(rel => ({ rel, path: join(dir, rel) }))
 const writes = files.map(({ path }, i) => ({ operation: 'write', path, text: ['const useCameraCapture = () => camera.capturePhoto()\n', 'const savePhoto = () => localStorage.persistImage()\n', 'export function NativeButton() { return platformButton() }\n'][i], mtime: 1700000000 }))
 await compare([{ operation: 'index', root: dir, steps: [...writes,
  { operation: 'status' }, { operation: 'search', query: 'camera' }, { operation: 'ensure' }, { operation: 'preparing' },
  ...['capture camera', 'save photo', 'NativeButton', 'unknown-token', 'İ AΣ', ''].map(query => ({ operation: 'search', query })),
  { operation: 'search', query: 'camera capture', accept: ['storage.ts'] }, { operation: 'ready' }, { operation: 'preparing' },
  { operation: 'write', path: files[0].path, text: 'const useMicrophone = () => recordVoice()\n', mtime: 1700000002 },
  { operation: 'ensure' }, { operation: 'search', query: 'microphone record' }, { operation: 'ready' },
  { operation: 'remove', path: files[1].path }, { operation: 'ready' }, { operation: 'status' },
 ] }], 'index-small')
 await compare([{ operation: 'index', files: [], steps: [{ operation: 'ensure', fail: true }, { operation: 'status' }, { operation: 'ready' }, { operation: 'status' }] }], 'index-error')
})

test('larger local builds yield, report stale snapshots and drop changed or vanished chunks', async () => {
 const dir = fixture(), writes = []
 for (let i = 0; i < 45; i++) writes.push({ operation: 'write', path: join(dir, `f${String(i).padStart(2, '0')}.ts`), text: `export const cameraCapture${i} = () => photographScene()\n`, mtime: 1700000000 })
 await compare([{ operation: 'index', root: dir, steps: [...writes,
  { operation: 'ensure' }, { operation: 'status' }, { operation: 'preparing' }, { operation: 'search', query: 'camera capture' },
  { operation: 'ready' }, { operation: 'preparing' }, { operation: 'search', query: 'camera capture', limit: 2 },
  { operation: 'write', path: writes[0].path, text: 'export const recordMicrophone = () => audioVoice()\n', mtime: 1700000002 },
  { operation: 'remove', path: writes[1].path }, { operation: 'ensure' }, { operation: 'status' },
  { operation: 'search', query: 'camera capture', limit: 2 }, { operation: 'ready' },
  { operation: 'search', query: 'record microphone', limit: 2 }, { operation: 'status' },
 ] }], 'index-stale', reference => assert.ok(reference[0].value.some(value => value?.droppedStale > 0), 'Fixture must exercise stale-candidate rejection'))
})

test('index bounds count files, UTF-16 input length and chunk coverage like the reference', async () => {
 const dir = fixture(), path = join(dir, 'shared.ts'), corpus = { corpus: 'app', package: null }
 file(path, 'export const cameraCapture = () => photographScene()\n')
 const base = tagged(path, 'shared.ts', corpus)
 const files = Array.from({ length: 4001 }, (_, i) => ({ ...base, rel: `file-${i}.ts` }))
 await compare([{ operation: 'index', files, steps: [{ operation: 'ready' }, { operation: 'ensure' }, { operation: 'status' }] }], 'index-file-bound', reference => {
  assert.equal(reference[0].value[0].files, 4000); assert.equal(reference[0].value[0].truncated, true)
 })
 const big = join(dir, 'big.ts'), text = ('x'.repeat(79) + '\n').repeat(26214) + 'x'.repeat(32)
 assert.equal(text.length, 2 * 1024 * 1024)
 const byteFiles = Array.from({ length: 8 }, (_, i) => ({ ...base, abs: big, rel: `big-${i}.ts` }))
 await compare([{ operation: 'index', files: byteFiles, steps: [{ operation: 'write', path: big, text, mtime: 1700000000 }, { operation: 'ready' }] }], 'index-byte-bound', reference => {
  assert.equal(reference[0].value[0].files, 5); assert.equal(reference[0].value[0].truncated, true)
 })
 await compare([{ operation: 'index', files: [{ ...base, abs: big }], steps: [{ operation: 'write', path: big, text: 'x\n'.repeat(600081), mtime: 1700000000 }, { operation: 'ready' }] }], 'index-chunk-bound', reference => {
  assert.equal(reference[0].value[0].chunks, 15000); assert.equal(reference[0].value[0].truncated, true)
 })
})

test('service reads and search preserve selection, corpora, provenance, freshness and index status', async () => {
 const dir = fixture(), appRoot = join(dir, 'apps/demo'), app = { root: appRoot, relativeRoot: 'apps/demo', name: 'demo' }
 json(join(appRoot, 'package.json'), { name: 'demo', dependencies: { '@octane-xplat/ui': 'workspace:*' } })
 file(join(appRoot, 'src/CameraView.tsrx'), 'export const CameraView = () => useCameraCapture()\n😀 camera\n')
 file(join(appRoot, 'src/late.ts'), '\n'.repeat(51) + 'useCameraCapture()\n')
 file(join(appRoot, 'private/hidden.ts'), 'fixture-private-value')
 file(join(dir, 'outside.ts'), 'fixture-outside-value')
 symlinkSync(join(appRoot, 'src/CameraView.tsrx'), join(appRoot, 'alias.ts'))
 symlinkSync(join(appRoot, 'private/hidden.ts'), join(appRoot, 'hidden-alias.ts'))
 symlinkSync(join(dir, 'outside.ts'), join(appRoot, 'outside-alias.ts'))
 const framework = join(dir, 'node_modules/@octane-xplat/ui')
 json(join(framework, 'package.json'), { name: '@octane-xplat/ui', version: '0.20.0' }); file(join(framework, 'src/CameraView.tsrx'))
 const steps = [{ operation: 'status' }, { operation: 'search', query: 'CameraView', mode: 'exact' },
  { operation: 'search', query: 'capture camera', mode: 'auto' }, { operation: 'prepare' },
  { operation: 'search', query: 'capture camera', mode: 'semantic' },
  ...['app', 'framework', 'all'].map(corpus => ({ operation: 'search', query: 'CameraView', corpus, platform: 'ios', mode: 'auto' })),
  { operation: 'search', query: 'camera', mode: 'bad' }, { operation: 'search', query: '  ' },
  { operation: 'search', query: 'camera', package: '@octane-xplat/ui' },
  ...['apps/demo/src/CameraView.tsrx', 'apps/demo/alias.ts', 'apps/demo/hidden-alias.ts', 'apps/demo/outside-alias.ts', 'outside.ts', '../outside.ts', 'apps/demo/missing.ts'].map(path => ({ operation: 'read', path, offset: 1, limit: 2 })),
  { operation: 'read' }, { operation: 'read', ref: 'bad-ref' },
  { operation: 'read', corpus: 'framework', package: '@octane-xplat/ui', path: 'CameraView.tsrx' },
  { operation: 'read', ref: 'xplat-code://app/apps/demo/src/CameraView.tsrx', offset: 48, limit: 2 },
  { operation: 'status' }]
 await compare([{ operation: 'service', root: dir, kind: 'consumer', app, git: { head: '0123456789abcdef\n', dirty: ' M source.ts\n M other.ts\n' }, steps }], 'service')
 const requests = []
 for (const kind of ['consumer', 'empty', 'framework-repo']) requests.push({ operation: 'service', root: dir, kind, git: { fail: true }, steps: [{ operation: 'status' }, { operation: 'read', path: 'src/index.ts' }, { operation: 'search', query: 'camera' }] })
 await compare(requests, 'service-selection')
})

test('real CLI source search and reads match the live TypeScript providers', async () => {
 const appRoot = join(root, 'packages/cli/src'), app = { root: appRoot, relativeRoot: 'packages/cli/src' }
 await compare([{ operation: 'service', root, kind: 'consumer', app, git: { fail: true }, steps: [
  { operation: 'search', query: 'createCodeService', mode: 'exact', corpus: 'app', limit: 3 },
  { operation: 'read', path: 'packages/cli/src/mcp/code-retrieval.ts', offset: 12, limit: 1000 },
 ] }], 'real-source')
})
