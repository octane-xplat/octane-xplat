import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, 'research/nim-cli/native/env-probe')
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/env-build.json'))), readFileSync(binary), envProbeInputs)
const scratch = scratchRun(root, 'build-worker')
after(() => rmSync(scratch, { recursive: true, force: true }))
const macOnly = { skip: process.platform !== 'darwin' }
let sequence = 0
function project(installed = true) {
 const dir = join(scratch, String(++sequence))
 mkdirSync(dir, { recursive: true })
 writeFileSync(join(dir, 'package.json'), '{"private":true,"type":"module"}')
 if (installed) {
  mkdirSync(join(dir, 'node_modules/@octane-xplat'), { recursive: true })
  symlinkSync(join(root, 'packages/cli'), join(dir, 'node_modules/@octane-xplat/cli'), 'dir')
 }
 return dir
}
function call(dir, operation, payload = {}, extra = {}) {
 const run = spawnSync(binary, [], { input: JSON.stringify({ operation: 'build-worker', dir, call: operation, payload, ...extra }) + '\n',
  encoding: 'utf8', env: { ...process.env, PATH: dirname(process.execPath) }, timeout: 12000, maxBuffer: 4*1024*1024 })
 assert.equal(run.status, 0, run.stderr)
 return { ...JSON.parse(run.stdout), stderr: run.stderr }
}
function fake(dir, body) {
 const packageDir = join(dir, 'node_modules/@octane-xplat/cli')
 mkdirSync(packageDir, { recursive: true })
 writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name: '@octane-xplat/cli', type: 'module', exports: { './worker': './worker.js' } }))
 writeFileSync(join(packageDir, 'worker.js'), `import fs from 'node:fs';\nconst request = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));\nconst result = data => fs.writeFileSync(process.argv[3], JSON.stringify({ protocol: request.protocol, version: request.version, id: request.id, ok: true, data }));\n${body}\n`)
}

test('project worker analyzes actual source without executing route modules', macOnly, () => {
 const dir = project()
 const sources = [
  ['app/index.tsx', 'throw new Error("source must not execute"); export const loader = () => 1; export const beforeLoad = () => {}; export const validateSearch = () => {}; export const head = {}; export const group = {}; export const ErrorBoundary = () => null'],
  ['app/view.tsrx', 'const mode = "baked" as const; export { mode as dataMode }; export default function View() @{ return <label>Hello</label> }'],
  ['app/live.tsx', 'export const dataMode = "live"; export { loader as renamed } from "./unused"'],
 ]
 const response = call(dir, 'route-analyze', { files: sources.map(([file, source]) => ({ file, source })), protocol: 'overridden', version: 99, project: '/wrong' })
 assert.equal(response.ok, true, JSON.stringify(response))
 assert.equal(response.stderr, '')
 assert.deepEqual(response.value.map(entry => entry.sha256), sources.map(([, source]) => createHash('sha256').update(source).digest('hex')))
 assert.deepEqual(response.value[0].metadata, { loader: true, guard: true, group: true, validateSearch: true, head: true, errorBoundary: true })
 assert.equal(response.value[1].metadata.dataMode, 'baked')
 assert.equal(response.value[2].metadata.dataMode, 'live')
 for (const source of ['export * from "./hidden"', 'export const dataMode = unknownMode']) {
  const failed = call(dir, 'route-analyze', { files: [{ file: 'bad.tsx', source }] })
  assert.equal(failed.ok, false)
  assert.match(failed.message, /bad\.tsx/)
  assert.match(failed.stderr, /bad\.tsx/)
 }
})

test('baking uses selected-project Vite, strict route JSON and separate diagnostics', macOnly, () => {
 const dir = project()
 const markdown = [{ name: '__proto__', file: 'app/readme.md', source: '# Hello\n\nNative worker baking.' }]
 const md = call(dir, 'route-bake', { markdown, loaders: [] })
 assert.equal(md.ok, true, JSON.stringify(md))
 assert.equal(md.value.__proto__.kind, 'octane-xplat/md')
 writeFileSync(join(dir, 'data.ts'), 'console.log("loader diagnostic"); export const loader = async () => ({ answer: 42, nested: [true, null, "ok"] })')
 const payload = { markdown: [], loaders: [{ name: 'index', file: 'data.ts' }] }
 const missing = call(dir, 'route-bake', payload)
 assert.equal(missing.ok, false)
 assert.match(missing.message, /Install vite in the selected project/)
 symlinkSync(join(root, 'packages/cli/node_modules/vite'), join(dir, 'node_modules/vite'), 'dir')
 const baked = call(dir, 'route-bake', payload)
 assert.equal(baked.ok, true, JSON.stringify(baked))
 assert.deepEqual(baked.value, { index: { answer: 42, nested: [true, null, 'ok'] } })
 assert.match(baked.stderr, /loader diagnostic/)
 writeFileSync(join(dir, 'data.ts'), 'export const loader = () => ({ unsafe: 1n })')
 const bad = call(dir, 'route-bake', payload)
 assert.equal(bad.ok, false)
 assert.match(bad.message, /data\.ts/)
 assert.match(bad.message, /JSON|bigint/i)
})

test('native worker boundary rejects absent tools, malformed responses and failed exits', macOnly, () => {
 const missing = call(project(false), 'route-analyze', { files: [] })
 assert.equal(missing.ok, false)
 assert.match(missing.message, /Install @octane-xplat\/cli/)
 const dir = project(false)
 fake(dir, 'result({ env: [process.env.NODE_PATH, process.env.NODE_OPTIONS], cwd: process.cwd(), operation: request.operation });')
 const environment = call(dir, 'echo', {}, { env: { NODE_PATH: '/unwanted', NODE_OPTIONS: '--invalid-option' } })
 assert.equal(environment.ok, true)
 assert.deepEqual(environment.value, { env: ['', ''], cwd: dir, operation: 'echo' })
 assert.match(call(dir, 'echo', {}, { env: { PATH: '' } }).message, /Node >=22\.22\.2/)
 for (const body of [
  'fs.writeFileSync(process.argv[3], JSON.stringify({ protocol: request.protocol, version: 2, id: request.id, ok: true, data: {} }));',
  'fs.writeFileSync(process.argv[3], JSON.stringify({ protocol: request.protocol, version: 1, id: "other", ok: true, data: {} }));',
  'fs.writeFileSync(process.argv[3], "{");',
  'result({}); process.exitCode = 7;',
  'process.stderr.write("fixture failure"); process.exitCode = 3;',
 ]) {
  fake(dir, body)
  const result = call(dir, 'echo')
  assert.equal(result.ok, false, body)
  assert.ok(result.message.length)
 }
 fake(dir, 'fs.writeFileSync(process.argv[3], JSON.stringify({ protocol: request.protocol, version: 1, id: request.id, ok: false, error: { message: "Unsupported build operation: " + request.operation } }));')
 assert.match(call(dir, 'route-plan', { bake: false }).message, /Update @octane-xplat\/cli in the selected project/)
})

test('timeouts and observed cancellation clean up the worker process group', macOnly, () => {
 for (const cancellation of [false, true]) {
  const dir = project(false)
  fake(dir, `const { spawn } = await import('node:child_process');
const child = spawn(process.execPath, ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)'], { stdio: 'ignore' });
fs.writeFileSync('pids.json', JSON.stringify([process.pid, child.pid]));
process.on('SIGTERM', () => {});
console.error('worker-ready');
setInterval(() => {}, 1000);`)
  const response = call(dir, 'hang', {}, cancellation ? { cancelOnDiagnostic: 'worker-ready', timeoutMs: 6000 } : { timeoutMs: 1500 })
  assert.equal(response.ok, false)
  assert.match(response.message, cancellation ? /cancelled/ : /timed out/)
  assert.ok(existsSync(join(dir, 'pids.json')), 'Worker must actually start before cleanup is qualified')
  for (const pid of JSON.parse(readFileSync(join(dir, 'pids.json')))) {
   assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' }, `owned PID ${pid} survived`)
  }
 }
 const pre = call(project(), 'route-analyze', { files: [] }, { preabort: true })
 assert.equal(pre.ok, false)
 assert.match(pre.message, /cancelled/)
})

test('nearer broken CLI installs and escaping worker symlinks never fall back',macOnly,()=>{
 const parent=project(false)
 fake(parent,'result({ selected: true });')
 const child=join(parent,'child');mkdirSync(child)
 assert.equal(call(child,'echo').value.selected,true)
 fake(child,'result({ incorrect: true });')
 const packageDir=join(child,'node_modules/@octane-xplat/cli')
 writeFileSync(join(packageDir,'package.json'),'{"name":"wrong-package"}')
 assert.match(call(child,'echo').message,/manifest is missing or invalid/)
 writeFileSync(join(packageDir,'package.json'),JSON.stringify({name:'@octane-xplat/cli',exports:{'./worker':'./worker.js'}}))
 rmSync(join(packageDir,'worker.js'))
 symlinkSync(join(parent,'node_modules/@octane-xplat/cli/worker.js'),join(packageDir,'worker.js'))
 assert.match(call(child,'echo').message,/does not provide/)
})
