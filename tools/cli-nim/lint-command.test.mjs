import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { once } from 'node:events'
import { createHash } from 'node:crypto'
import { stripVTControlCharacters } from 'node:util'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/xplat${process.platform === 'win32' ? '.exe' : ''}`)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/build.json'))), readFileSync(binary))
const scratch = scratchRun(root, 'native-lint')
const macOnly = { skip: process.platform !== 'darwin' }
const environment = { ...process.env, NODE_PATH: '', NODE_OPTIONS: '', NO_COLOR: '1' }
const handles = new Set()
let installed, sequence = 0
function write(directory, path, value) {
 const file = join(directory, path)
 mkdirSync(dirname(file), { recursive: true })
 writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value))
 return file
}
function checked(command, args, cwd) {
 const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: environment, timeout: 120000, maxBuffer: 4*1024*1024 })
 assert.equal(result.status, 0, result.stdout + result.stderr)
 return result
}
before(() => {
 if (process.platform !== 'darwin') {return}
 const packs = join(scratch, 'packs'), consumer = join(scratch, 'consumer')
 mkdirSync(packs); mkdirSync(consumer)
 assert.equal(checked('bun', ['--version'], root).stdout.trim(), '1.4.4')
 checked('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], join(root, 'packages/lint'))
 const manifest = JSON.parse(readFileSync(join(root, 'packages/lint/package.json')))
 const archive = join(packs, `octane-xplat-lint-${manifest.version}.tgz`)
 const bytes = readFileSync(archive)
 write(root, 'research/nim-cli/lint-packed-native.json', {
  platform: process.platform, arch: process.arch, node: process.version,
  bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
  scope: 'Lint leaf only; excludes Node and dependencies',
 })
 write(consumer, 'package.json', { private: true, type: 'module', packageManager: 'bun@1.4.4', devDependencies: { '@octane-xplat/lint': `file:${archive}` } })
 checked('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], consumer)
 installed = join(consumer, 'node_modules/@octane-xplat/lint')
 assert.ok(existsSync(join(installed, 'dist/runner.js')))
})
after(async () => {
 await Promise.all([...handles].map(async child => {
  const closed = once(child, 'close')
  child.kill('SIGTERM')
  let timer
  try {
   await Promise.race([closed, new Promise(resolve => {timer = setTimeout(resolve, 8000)})])
   if (child.exitCode === null && child.signalCode === null) {child.kill('SIGKILL')}
   await closed
  } finally {clearTimeout(timer)}
 }))
 rmSync(scratch, { recursive: true, force: true })
})
function project(files = {}, tools = true) {
 const directory = join(scratch, `project ${++sequence} [雪]`)
 write(directory, 'package.json', { private: true, type: 'module' })
 for (const [path, value] of Object.entries(files)) {write(directory, path, value)}
 if (tools) {
  const path = join(directory, 'node_modules/@octane-xplat/lint')
  mkdirSync(dirname(path), { recursive: true }); symlinkSync(installed, path, 'dir')
 }
 return directory
}
function run(directory, args = [], native = true, env = {}) {
 return spawnSync(native ? binary : process.execPath,
  native ? ['lint', ...args] : [join(root, 'packages/cli/src/cli.ts'), 'lint', ...args],
  { cwd: directory, env: { ...environment, ...env }, encoding: 'utf8', timeout: 30000, maxBuffer: 4*1024*1024 })
}
function stable(text) {
 return stripVTControlCharacters(text.replace(/Finished in .*?(?=\r?\n|$)/g, 'Finished in <elapsed>'))
}
function compare(directory, args, expected) {
 const reference = run(directory, args, false), native = run(directory, args)
 assert.equal(reference.status, expected, reference.stdout + reference.stderr)
 assert.equal(native.status, reference.status, native.stdout + native.stderr)
 assert.equal(stable(native.stdout), stable(reference.stdout))
 assert.equal(stable(native.stderr), stable(reference.stderr))
 return native
}
const bad = 'console.debug("fixture")\n'
const fixable = 'export function f(n: number) { if (n > 0) return true; return false }\n'

test('native lint help and catalog need neither Node nor a project engine', () => {
 const directory = project({}, false)
 for (const args of [['--help'], ['-h'], ['src', '--fix', '--help']]) {
  const result = run(directory, args, true, { PATH: '' })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, run(directory, args, false).stdout)
 }
 const catalog = spawnSync(binary, ['catalog', '--json'], { encoding: 'utf8' })
 assert.equal(JSON.parse(catalog.stdout).data.orchestration.find(item => item.name === 'lint').status, 'implemented')
})

test('real packed lint reports regular and TSRX findings without writing source', macOnly, () => {
 const directory = project({ 'a.ts': bad, 'b.tsrx': bad })
 const result = compare(directory, [], 1)
 assert.match(result.stdout + result.stderr, /a\.ts/)
 assert.match(result.stdout + result.stderr, /b\.tsrx/)
 for (const file of ['a.ts', 'b.tsrx']) {assert.equal(readFileSync(join(directory, file), 'utf8'), bad)}
})

test('real engine owns path selection, option termination, config ignores and failures', macOnly, () => {
 const directory = project({
  'selected/a.ts': 'export const value = 1\n', 'selected/b.tsrx': bad,
  'other/a.ts': bad, 'other/b.tsrx': bad, '-literal.tsrx': bad,
  '.gitignore': 'ignored/\n', 'ignored/a.ts': bad, 'ignored/a.tsrx': bad,
 })
 compare(directory, ['selected/a.ts'], 0)
 const selected = compare(directory, ['selected', 'selected/b.tsrx'], 1)
 assert.doesNotMatch(selected.stdout + selected.stderr, /other\/|ignored\//)
 compare(directory, ['--', '-literal.tsrx'], 1)
 for (const args of [['--wat'], ['missing.ts'], ['--fix', 'selected/a.ts', 'missing.ts']]) {compare(directory, args, 2)}
 write(directory, '.oxlintrc.json', { rules: {} })
 compare(directory, [], 0)
 write(directory, '.oxlintrc.json', '{')
 compare(directory, ['--fix'], 2)
})

test('real safe fixes match Node and preserve unrelated formatting and remaining TSRX errors', macOnly, () => {
 const source = fixable + 'export const   untouched=1\n'
 const directory = project({ 'fix.ts': source, 'bad.tsrx': bad })
 const reference = run(directory, ['--fix'], false)
 assert.equal(reference.status, 1, reference.stdout + reference.stderr)
 const expected = readFileSync(join(directory, 'fix.ts'), 'utf8')
 assert.notEqual(expected, source)
 write(directory, 'fix.ts', source)
 const native = run(directory, ['--fix'])
 assert.equal(native.status, 1, native.stdout + native.stderr)
 assert.equal(readFileSync(join(directory, 'fix.ts'), 'utf8'), expected)
 assert.match(expected, /const   untouched=1/)
 assert.equal(readFileSync(join(directory, 'bad.tsrx'), 'utf8'), bad)
})

test('packed configuration extends the preset and applies warning severity and file overrides in both passes', macOnly, () => {
 const directory = project({
  'a.ts': bad, 'a.tsrx': bad, 'src/allowed.ts': bad, 'src/allowed.tsrx': bad,
  '.oxlintrc.json': {
   extends: [join(installed, 'config.json')],
   rules: { 'xplat/no-console-debug': 'warn' },
   overrides: [{ files: ['**/allowed.*'], rules: { 'xplat/no-console-debug': 'off' } }],
  },
 })
 const result = compare(directory, [], 0)
 assert.match(result.stdout + result.stderr, /warn.*xplat[/([]no-console-debug/)
 assert.doesNotMatch(result.stdout + result.stderr, /allowed\./)
 const alias = spawnSync(process.execPath, [join(installed, 'bin/lint.mjs'), 'a.ts'], {
  cwd: directory, env: { ...environment, PATH: '' }, encoding: 'utf8', timeout: 10000,
 })
 assert.equal(alias.status, 0, alias.stderr)
})

test('real inventory respects nested ignores, output folders, symlinks and nested repositories', macOnly, () => {
 const directory = project({
  'src/.gitignore': 'ignored/\n', 'src/ignored/a.ts': bad, 'src/ignored/a.tsrx': bad,
  '.eslintignore': 'eslint/\n', 'eslint/a.ts': bad, 'eslint/a.tsrx': bad,
  'dist/a.ts': bad, 'dist/a.tsrx': bad,
  'nested/.git': 'gitdir: fixture\n', 'nested/a.ts': bad, 'nested/a.tsrx': bad,
  'src/a.ts': 'export const n = 1\n',
 })
 const outside = project({ 'a.ts': bad, 'a.tsrx': bad }, false)
 symlinkSync(outside, join(directory, 'linked'), 'dir')
 symlinkSync(join(outside, 'a.ts'), join(directory, 'linked.ts'))
 compare(directory, [], 0)
 compare(directory, ['linked.ts'], 2)
})

test('project tools resolve from ancestors but missing or broken local packages never use globals', macOnly, () => {
 const directory = project({ 'child/a.ts': 'export const n = 1\n' })
 assert.equal(run(join(directory, 'child'), []).status, 0)
 const missing = project({}, false)
 const global = join(scratch, 'global')
 write(global, 'node_modules/@octane-xplat/lint/package.json', { name: '@octane-xplat/lint', exports: { './bin': './bin.mjs' } })
 write(global, 'node_modules/@octane-xplat/lint/bin.mjs', 'throw Error("GLOBAL_FALLBACK_WAS_EXECUTED")')
 const absent = run(missing, [], true, { NODE_PATH: join(global, 'node_modules') })
 assert.equal(absent.status, 2)
 assert.match(absent.stderr, /bun add --dev @octane-xplat\/lint/)
 assert.doesNotMatch(absent.stderr, /GLOBAL_FALLBACK_WAS_EXECUTED/)
 write(directory, 'child/node_modules/@octane-xplat/lint/package.json', { name: '@octane-xplat/lint', exports: { './bin': '../../escape.mjs' } })
 const broken = run(join(directory, 'child'), [])
 assert.equal(broken.status, 2)
 assert.match(broken.stderr, /valid \.\/bin entry/)
 const noNode = run(directory, [], true, { PATH: '' })
 assert.equal(noNode.status, 2)
 assert.match(noNode.stderr, /Node >=22\.22\.2/)
})

function fake(body) {
 const directory = project({}, false)
 write(directory, 'node_modules/@octane-xplat/lint/package.json', { name: '@octane-xplat/lint', exports: { './bin': './bin.mjs' } })
 write(directory, 'node_modules/@octane-xplat/lint/bin.mjs', body)
 return directory
}
test('argv, cwd, clean Node environment, exit code and both byte streams cross the boundary intact', macOnly, () => {
 const directory = fake(`process.stdout.write(Buffer.from([255,0,195,169])); process.stderr.write('diagnostic\\n'); process.stderr.write(JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), options: process.env.NODE_OPTIONS, path: process.env.NODE_PATH, sentinel: process.env.XPLAT_LINT_SENTINEL })); process.exitCode=7`)
 const args = ['a space.ts', '$(touch SHOULD_NOT_EXIST)', '`touch SHOULD_NOT_EXIST`', 'é😀.ts', '--', '--help']
 const result = spawnSync(binary, ['lint', ...args], { cwd: directory, env: { ...environment, NODE_OPTIONS: '--invalid-preload', NODE_PATH: 'GLOBAL', XPLAT_LINT_SENTINEL: 'selected' }, timeout: 10000 })
 assert.equal(result.status, 7, result.stderr.toString())
 assert.deepEqual(result.stdout, Buffer.from([255,0,195,169]))
 assert.deepEqual(JSON.parse(result.stderr.toString().split('\n')[1]), { argv: args, cwd: directory, options: '', path: '', sentinel: 'selected' })
 assert.ok(!existsSync(join(directory, 'SHOULD_NOT_EXIST')))
 const signalled = fake(`process.kill(process.pid,'SIGTERM')`)
 const failure = run(signalled)
 assert.equal(failure.status, 2)
 assert.match(failure.stderr, /lint stopped by SIGTERM/)
})

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
function alive(pid) { try {process.kill(pid, 0); return true} catch (error) {if (error.code === 'ESRCH') {return false} throw error} }
async function until(check) { for (let i = 0; i < 100; i++) {if (check()) {return} await delay(25)} assert.fail('Owned fixture did not settle') }
function launch(directory) {
 const child = spawn(binary, ['lint'], { cwd: directory, env: environment, stdio: ['ignore', 'pipe', 'pipe'] })
 handles.add(child)
 child.once('close', () => handles.delete(child))
 return child
}
async function ready(child) {
 let output = '', errors = ''
 child.stderr.on('data', bytes => {errors += bytes})
 child.stdout.on('data', bytes => {output += bytes})
 await until(() => output.includes('\n') || child.exitCode !== null || child.signalCode !== null)
 assert.equal(child.exitCode, null, errors)
 return JSON.parse(output.split('\n')[0])
}
function stubborn() {
 return fake(`import { spawn } from 'node:child_process'; process.on('SIGTERM',()=>{}); const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>process.stdout.write('tick'),10)"],{stdio:['ignore','pipe','pipe']}); child.stdout.on('data',bytes=>process.stdout.write(bytes));child.stderr.on('data',bytes=>process.stderr.write(bytes));process.stdout.write(JSON.stringify({pid:process.pid,descendant:child.pid})+'\\n');setInterval(()=>{},1000)`)
}
test('SIGTERM cancels and reaps the owned lint process group including a stubborn descendant', macOnly, async () => {
 const child = launch(stubborn())
 const closed = once(child, 'close')
 const owned = await ready(child)
 child.kill('SIGTERM')
 const [code, signal] = await closed
 assert.equal(signal, null)
 assert.equal(code, 143)
 await until(() => !alive(owned.pid) && !alive(owned.descendant))
})

test('a closed stdout consumer releases the owned lint engine and descendant', macOnly, async () => {
 const child = launch(stubborn())
 const closed = once(child, 'close')
 const owned = await ready(child)
 child.stdout.destroy()
 await closed
 await until(() => !alive(owned.pid) && !alive(owned.descendant))
})
