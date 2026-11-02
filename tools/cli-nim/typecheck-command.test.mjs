import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, symlinkSync, chmodSync, existsSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { once } from 'node:events'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, 'research/nim-cli/native/xplat')
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/build.json'))), readFileSync(binary))
const scratch = scratchRun(root, 'native-typecheck')
const macOnly = { skip: process.platform !== 'darwin' }
after(() => rmSync(scratch, { recursive: true, force: true }))
let sequence = 0
function write(dir, file, value) {
 mkdirSync(dirname(join(dir, file)), { recursive: true })
 writeFileSync(join(dir, file), typeof value === 'string' ? value : JSON.stringify(value))
}
function project(files = {}) {
 const dir = join(scratch, String(++sequence))
 mkdirSync(dir, { recursive: true })
 write(dir, 'package.json', { private: true, type: 'module', packageManager: 'bun@1.4.4' })
 for (const [file, value] of Object.entries(files)) write(dir, file, value)
 return dir
}
function link(dir, packageName, source = join(root, 'node_modules', packageName)) {
 const target = join(dir, 'node_modules', packageName)
 mkdirSync(dirname(target), { recursive: true })
 symlinkSync(source, target, 'dir')
}
function buildTools(dir) { link(dir, '@octane-xplat/build', join(root, 'packages/build')) }
function checker(dir, body = '') {
 write(dir, 'node_modules/.bin/tsrx-tsc', `#!${process.execPath}\nimport fs from 'node:fs';\nfs.appendFileSync('checker-calls.jsonl', JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), sentinel: process.env.XPLAT_TYPECHECK_SENTINEL }) + '\\n');\n${body}\n`)
 chmodSync(join(dir, 'node_modules/.bin/tsrx-tsc'), 0o755)
}
function calls(dir) { return readFileSync(join(dir, 'checker-calls.jsonl'), 'utf8').trim().split('\n').map(JSON.parse) }
function run(dir, { native = true, args = [], environment = {} } = {}) {
 const result = spawnSync(native ? binary : process.execPath, native ? ['typecheck', ...args] : [join(root, 'packages/cli/src/cli.ts'), 'typecheck', ...args],
  { cwd: dir, encoding: 'utf8', env: { ...process.env, XPLAT_TYPECHECK_SENTINEL: 'selected-project', ...environment }, timeout: 30000, maxBuffer: 4*1024*1024 })
 assert.equal(result.signal, null, result.stderr)
 return result
}

test('public typecheck help and empty-project success need no toolchain', macOnly, () => {
 const dir = project()
 assert.equal(run(dir, { args: ['--help'] }).stdout, run(dir, { native: false, args: ['--help'] }).stdout)
 const empty = run(dir, { environment: { PATH: '' } })
 assert.equal(empty.status, 0, empty.stderr)
 assert.equal(empty.stdout, 'Typecheck clean\n')
 assert.equal(run(dir, { args: ['--invalid'] }).status, 2)
 const catalog = spawnSync(binary, ['catalog', '--json'], { encoding: 'utf8' })
 assert.equal(JSON.parse(catalog.stdout).data.orchestration.find(item => item.name === 'typecheck').status, 'implemented')
})

test('default and legacy programs run in order with explicit cwd and environment', macOnly, () => {
 for (const native of [false, true]) {
  const dir = project({ 'tsconfig.json': {}, 'tsconfig.native.json': {} })
  checker(dir)
  const result = run(dir, { native })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Typecheck clean/)
  assert.deepEqual(calls(dir), ['tsconfig.json', 'tsconfig.native.json'].map(file => ({ argv: ['--noEmit', '-p', file], cwd: dir, sentinel: 'selected-project' })))
 }
})

test('pnpm projects invoke the installed checker through pnpm exec', macOnly, t => {
 const version = spawnSync('pnpm', ['--version'], { cwd: scratch, encoding: 'utf8', timeout: 10000 })
 if (version.error?.code === 'ENOENT') { t.skip('pnpm is optional; this host has none installed'); return }
 assert.equal(version.status, 0, version.stderr)
 console.info(`pnpm ${version.stdout.trim()} selected-project checker launch`)
 for (const native of [false, true]) {
  const dir = project({ 'tsconfig.json': {} })
  write(dir, 'package.json', { private: true, type: 'module', packageManager: `pnpm@${version.stdout.trim()}` })
  checker(dir)
  const result = run(dir, { native })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.deepEqual(calls(dir), [{ argv: ['--noEmit', '-p', 'tsconfig.json'], cwd: dir, sentinel: 'selected-project' }])
 }
})

test('compiler diagnostics retain every byte and stop subsequent programs on failure', macOnly, () => {
 const dir = project({ 'tsconfig.json': {}, 'tsconfig.native.json': {} })
 checker(dir, 'process.stdout.write(Buffer.from([0xf0,0x9f])); setTimeout(() => { process.stdout.write(Buffer.from([0x9a,0x80,10])); process.stderr.write("diagnostic without newline"); process.exitCode = 19 }, 20)')
 const failed = run(dir)
 assert.equal(failed.status, 1)
 assert.equal(failed.stdout, '[tsc] 🚀\n')
 assert.match(failed.stderr, /\[tsc\] diagnostic without newline/)
 assert.match(failed.stderr, /compiler exit 19/)
 assert.equal(calls(dir).length, 1)
})

test('route generation never executes loaders during typecheck and retains baked data', macOnly, () => {
 const dir = project({ 'tsconfig.json': {}, 'app/index.tsx': 'throw new Error("must not execute"); export const dataMode = "baked"; export default () => null',
  'app/index.loader.ts': 'throw new Error("must not bake")', 'routes.gen.data.ts': 'preserved baked data\n' })
 buildTools(dir); checker(dir)
 const result = run(dir)
 assert.equal(result.status, 0, result.stderr)
 assert.equal(calls(dir).length, 1)
 assert.ok(existsSync(join(dir, 'routes.gen.catalog.macos.ts')))
 assert.equal(readFileSync(join(dir, 'routes.gen.data.ts'), 'utf8'), 'preserved baked data\n')
 assert.equal(JSON.parse(readFileSync(join(dir, 'routes.gen.manifest.json'))).routes.length, 1)
})

test('invalid manifests and missing project checker fail before compiler execution', macOnly, () => {
 const invalid = project({ 'tsconfig.json': {}, 'tsconfig.envs.json': { environments: { web: { files: ['missing.ts'] } } } })
 checker(invalid)
 const rejected = run(invalid)
 assert.equal(rejected.status, 1)
 assert.match(rejected.stderr, /missing|no files/)
 assert.equal(existsSync(join(invalid, 'checker-calls.jsonl')), false)
 const missing = run(project({ 'tsconfig.json': {} }))
 assert.equal(missing.status, 1)
 assert.match(missing.stderr, /Install the project's TSRX checker/)
})

test('actual project TSRX checker validates default and combined native programs', macOnly, () => {
 const dir = project({
  'tsconfig.json': { compilerOptions: { noEmit: true, strict: true, types: [], target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler' }, files: ['src/index.ts', 'src/view.tsrx'] },
  'tsconfig.envs.json': { compilerOptions: { noEmit: true, strict: true, types: [], target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler' }, environments: { native: { files: ['src/index.ts', 'src/view.tsrx', 'src/host.native.ts'] } } },
  'src/index.ts': 'export const answer: number = 42',
  'src/view.tsrx': 'export function answer(): number @{ return 42 }',
  'src/host.native.ts': 'console.log(process.env.NODE_ENV); queueMicrotask(() => {})',
 })
 buildTools(dir)
 link(dir, '@tsrx/typescript-plugin'); link(dir, 'typescript')
 mkdirSync(join(dir, 'node_modules/.bin'), { recursive: true })
 symlinkSync(join(dir, 'node_modules/@tsrx/typescript-plugin/dist/tsc.js'), join(dir, 'node_modules/.bin/tsrx-tsc'))
 const result = run(dir)
 assert.equal(result.status, 0, result.stdout + result.stderr)
 assert.match(result.stdout, /Typecheck clean/)
 const config = JSON.parse(readFileSync(join(dir, 'node_modules/.cache/xplat-typecheck/all.json')))
 assert.match(config.files[0], /build\/dist\/typecheck-globals\/native\.d\.ts$/)
 write(dir, 'src/view.tsrx', 'export function answer(): number @{ return "wrong" }')
 const badTsrx = run(dir)
 assert.equal(badTsrx.status, 1)
 assert.match(badTsrx.stdout + badTsrx.stderr, /view\.tsrx.*TS2322/)
 write(dir, 'src/view.tsrx', 'export function answer(): number @{ return 42 }')
 write(dir, 'src/index.ts', 'export const answer: number = "wrong"')
 const failed = run(dir)
 assert.equal(failed.status, 1)
 assert.match(failed.stdout + failed.stderr, /TS2322/)
})

test('cancelling public typecheck releases the compiler process group', macOnly, async () => {
 const dir = project({ 'tsconfig.json': {} })
 checker(dir, `const { spawn } = await import('node:child_process');
const child = spawn(process.execPath, ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {},1000)'], { stdio: 'ignore' });
fs.writeFileSync('pids.json', JSON.stringify([process.pid,child.pid]));
process.on('SIGTERM', () => {}); process.stderr.write('checker-ready\\n'); setInterval(() => {},1000);`)
 const owner = spawn(binary, ['typecheck'], { cwd: dir, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
 let output = ''
 const timer = setTimeout(() => owner.kill('SIGKILL'), 12000)
 owner.stderr.on('data', chunk => { output += chunk; if (output.includes('checker-ready')) owner.kill('SIGTERM') })
 try {
  const [code, signal] = await once(owner, 'exit')
  assert.equal(signal, null, output)
  assert.equal(code, 143, output)
  assert.ok(existsSync(join(dir, 'pids.json')))
  for (const pid of JSON.parse(readFileSync(join(dir, 'pids.json')))) assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
 } finally {
  clearTimeout(timer)
  if (existsSync(join(dir, 'pids.json'))) for (const pid of JSON.parse(readFileSync(join(dir, 'pids.json')))) {
   try { process.kill(pid, 'SIGKILL') } catch {}
  }
 }
})
