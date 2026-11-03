import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, chmodSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { CAPABILITY_IDS } from '../../packages/cli/src/mcp/contracts/capabilities.ts'
import { PRODUCT_BOUNDARIES } from '../../packages/cli/src/mcp/contracts/boundaries.ts'
import { renderHuman } from '../../packages/cli/src/agent/human.ts'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild } from './native-inputs.mjs'

const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/xplat${process.platform === 'win32' ? '.exe' : ''}`)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/build.json'))), readFileSync(binary))
const reference = join(root, 'packages/cli/src/cli.ts')
const scratch = scratchRun(root, 'status')
after(() => rmSync(scratch, { recursive: true, force: true }))
const macOnly = { skip: process.platform !== 'darwin' }
let sequence = 0
function file(path, value) {
 mkdirSync(resolve(path, '..'), { recursive: true })
 writeFileSync(path, value)
}
function project(manager = 'bun') {
 const dir = join(scratch, String(++sequence))
 file(join(dir, 'package.json'), JSON.stringify({ name: 'fixture-workspace', private: true, packageManager: `${manager}@1.0.0`, workspaces: ['apps/*'] }))
 const bin = join(dir, 'bin'), calls = join(dir, 'calls.jsonl')
 for (const command of ['node', manager, 'git', 'xcodebuild', 'adb']) {
  const path = join(bin, command)
  file(path, `#!${process.execPath}\nimport fs from 'node:fs';
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(calls)}, JSON.stringify({ command: ${JSON.stringify(command)}, args, cwd: process.cwd() }) + '\\n');
if (args[0] === '-C') process.exitCode = 1;
else process.stdout.write(${JSON.stringify(command === 'node' ? process.version + '\n' : `${command} fixture\n`)});
`)
  chmodSync(path, 0o755)
 }
 return { dir, bin, calls, env: { ...process.env, PATH: bin, XPLAT_AGENT_CLIENT: '', XPLAT_PERMISSIONS: '', XPLAT_MCP_CACHE: join(dir, 'docs-cache') } }
}
function app(project, id, name = id, platforms = ['web']) {
 const dir = join(project.dir, id)
 file(join(dir, 'package.json'), JSON.stringify({ name, dependencies: { '@octane-xplat/ui': '1.2.3' },
  xplat: { targets: platforms.includes('macos') ? { macos: { runtime: 'appkit-node-api' } } : {} } }))
 if (platforms.includes('web')) {file(join(dir, 'vite.config.ts'), 'throw new Error("status must never execute project config")\n')}
 if (platforms.includes('ios')) {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json')))
  manifest.dependencies['@nativescript/ios'] = '9.0.0'
  file(join(dir, 'package.json'), JSON.stringify(manifest))
  file(join(dir, 'nativescript.config.ts'), 'throw new Error("status must never execute project config")\n')
 }
 file(join(dir, 'src/index.ts'), 'export const answer = 42\n')
 file(join(dir, 'node_modules/@octane-xplat/ui/package.json'), JSON.stringify({ name: '@octane-xplat/ui', version: '1.2.3', type: 'module', exports: './trap.js' }))
 file(join(dir, 'node_modules/@octane-xplat/ui/trap.js'), 'throw new Error("status must never execute installed package code")\n')
 return dir
}
function invoke(native, project, command = 'status', args = [], extra = {}) {
 return spawnSync(native ? binary : process.execPath, native ? [...command.split(' '), '--project', project.dir, ...args] : [reference, ...command.split(' '), '--project', project.dir, ...args],
  { cwd: root, env: { ...project.env, ...extra }, encoding: 'utf8', timeout: 45000, maxBuffer: 16 * 1024 * 1024 })
}
function json(native, project, command = 'status', args = [], extra = {}) {
 const result = invoke(native, project, command, [...args, '--json'], extra)
 assert.equal(result.status, 0, result.stderr || result.stdout)
 assert.equal(result.stderr, '')
 const value = JSON.parse(result.stdout)
 assert.equal(value.ok, true)
 return value
}
function normalize(value) {
 if (Array.isArray(value)) {return value.map(normalize)}
 if (value && typeof value === 'object') {return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'requestId').map(([key, val]) => {
  if (key === 'grantedAt') {
   assert.ok(Math.abs(Date.parse(val) - Date.now()) < 60000)
   return [key, '<current-utc>']
  }
  return [key, normalize(val)]
 }))}
 return value
}
function compareReport(project, args = [], extra = {}) {
 const actual = json(true, project, 'status', args, extra), expected = json(false, project, 'status', args, extra)
 if (expected.data.docs.binding) {expected.data.docs.binding.cacheDir = join(expected.data.docs.binding.cacheDir, 'nim-v1')}
 assert.deepEqual(normalize(actual.context), normalize(expected.context))
 for (const key of ['identity', 'guidance', 'docs', 'permissions', 'boundaries', 'prerequisites']) {
  assert.deepEqual(normalize(actual.data[key]), normalize(expected.data[key]), key)
 }
 const code = { ...actual.data.codeIndex, detail: expected.data.codeIndex.detail }
 assert.deepEqual(code, expected.data.codeIndex, 'Keep actual corpora, freshness, file counts and index state')
 assert.equal(actual.data.server.name, expected.data.server.name)
 assert.match(actual.data.server.version, /^\d+\.\d+\.\d+-nim\.\d+$/)
 if (actual.data.identity.selection.state !== 'bound') {assert.deepEqual(actual.data.nextSteps, expected.data.nextSteps)}
 assert.deepEqual(actual.data.boundaries, PRODUCT_BOUNDARIES)
 return actual
}
function verifyCapabilities(matrices, bound) {
 for (const matrix of matrices) {
  assert.equal(matrix.declared, bound)
  assert.deepEqual(matrix.capabilities.map(row => row.capability), CAPABILITY_IDS)
  for (const row of matrix.capabilities) {
   const wanted = row.capability === 'project_status' || (bound && (row.capability === 'guidance' || (process.platform==='darwin' && process.arch==='arm64' && row.capability==='docs'))) ? 'supported'
    : bound && (['docs', 'code_search'].includes(row.capability) || (process.platform==='darwin' && ['web','macos'].includes(matrix.platform) && ['build','logs','job_control'].includes(row.capability)) || (process.platform==='darwin' && matrix.platform==='macos' && ['target_discovery','launch','attach','session_end'].includes(row.capability))) ? 'partial' : 'unavailable'
   assert.equal(row.status, wanted, row.capability)
   if (row.capability === 'screenshot') {assert.equal(row.requiresPermission, 'visual-capture')}
  }
 }
}

test('status preserves empty, sole-app, ambiguous and explicit selection contracts', macOnly, () => {
 const fixture = project()
 for (const source of ['AGENTS.md', 'CLAUDE.md', '.devin', 'docs']) {file(join(fixture.dir, source), '# guidance\n')}
 const empty = compareReport(fixture)
 assert.equal(empty.data.identity.selection.state, 'none')
 assert.equal(empty.data.docs.state, 'unavailable')
 assert.deepEqual(empty.data.capabilities, [])
 const first = app(fixture, 'apps/alpha', 'alpha', ['web', 'macos', 'ios'])
 file(join(first, 'AGENTS.md'), '# app instructions\n')
 const sole = compareReport(fixture)
 assert.equal(sole.data.identity.selection.reason, 'sole-app')
 assert.equal(sole.context.projectId, null)
 assert.equal(sole.data.docs.state, 'ready')
 assert.ok(sole.data.codeIndex.files > 0)
 verifyCapabilities(sole.data.capabilities, true)
 app(fixture, 'apps/beta', 'beta', ['web'])
 const ambiguous = compareReport(fixture)
 assert.equal(ambiguous.data.identity.selection.state, 'ambiguous')
 verifyCapabilities(ambiguous.data.capabilities, false)
 for (const selector of ['alpha', 'apps/beta', 'missing']) {compareReport(fixture, ['--app', selector])}
})

test('preferences, client scopes and fresh installation changes affect the next report', macOnly, () => {
 const fixture = project(), first = app(fixture, 'apps/alpha'), second = app(fixture, 'apps/beta')
 json(true, fixture, 'app select', ['apps/alpha', '--client', 'status_fixture'])
 const preferred = compareReport(fixture, ['--client', 'status_fixture'], { XPLAT_PERMISSIONS: 'visual-capture' })
 assert.equal(preferred.context.selection.reason, 'preference')
 assert.equal(preferred.data.permissions.find(row => row.scope === 'visual-capture').state, 'granted')
 compareReport(fixture, ['--client', 'status_fixture', '--app', 'apps/beta'])
 assert.equal(compareReport(fixture, ['--client', 'another']).data.identity.selection.state, 'ambiguous')
 file(join(first, 'node_modules/@octane-xplat/ui/package.json'), JSON.stringify({ name: '@octane-xplat/ui', version: '1.2.4' }))
 const refreshed = compareReport(fixture, ['--client', 'status_fixture', '--refresh'])
 assert.equal(refreshed.data.identity.framework.packages[0].version, '1.2.4')
 assert.equal(refreshed.data.docs.binding.identity.packages[0].version, '1.2.4')
 rmSync(second, { recursive: true })
 assert.equal(compareReport(fixture).data.identity.selection.reason, 'sole-app')
})

test('status works without a runtime and checks the selected package manager only', macOnly, () => {
 const fixture = project('pnpm')
 app(fixture, 'apps/alpha')
 const native = json(true, fixture)
 assert.deepEqual(native.data.prerequisites.map(row => row.id), ['node', 'pnpm', 'git', 'chromium'])
 const calls = readFileSync(fixture.calls, 'utf8').trim().split('\n').map(line => JSON.parse(line))
 assert.ok(calls.every(call => call.command !== 'bun' && call.command !== 'chromium'))
 assert.equal(calls.filter(call => call.command === 'git' && call.args[0] === '--version').length, 1)
 const standalone = json(true, fixture, 'status', [], { PATH: '' })
 for (const id of ['node', 'pnpm', 'git']) {assert.equal(standalone.data.prerequisites.find(row => row.id === id).status, 'missing')}
 assert.equal(standalone.data.docs.binding.git, 'unavailable')
 assert.equal(standalone.data.prerequisites.find(row => row.id === 'chromium').status, 'unknown')
 verifyCapabilities(standalone.data.capabilities, true)
})

test('capabilities filter declared platforms without claiming unfinished runtime support', macOnly, () => {
 const fixture = project()
 app(fixture, 'apps/alpha', 'alpha', ['web', 'macos'])
 const all = json(true, fixture, 'capabilities')
 assert.deepEqual(all.data.capabilities.map(row => row.platform), ['web', 'macos'])
 verifyCapabilities(all.data.capabilities, true)
 const filtered = json(true, fixture, 'capabilities', ['--platform', 'macos'])
 assert.deepEqual(filtered.data.capabilities, all.data.capabilities.filter(row => row.platform === 'macos'))
 assert.deepEqual(json(true, fixture, 'capabilities', ['--platform', 'android']).data.capabilities, [])
 for (const command of ['status', 'capabilities']) {
  const result = json(true, fixture, command)
  const human = invoke(true, fixture, command)
  assert.equal(human.status, 0, human.stderr)
  assert.equal(human.stdout, renderHuman({ name: command }, result) + '\n')
 }
})

test('real repository app status retains installed bindings, source coverage and freshness', macOnly, () => {
 const fixture = project()
 const real = { ...fixture, dir: root, env: { ...fixture.env, PATH: process.env.PATH } }
 for (const id of ['apps/macos', 'apps/web']) {
  const report = compareReport(real, ['--app', id])
  assert.equal(report.data.identity.selection.state, 'bound', 'The selected real fixture must actually bind')
  assert.ok(report.data.identity.framework.packages.length > 0)
  assert.ok(report.data.codeIndex.files > 0)
  assert.match(report.data.codeIndex.freshness, /^HEAD [0-9a-f]{12},/)
 }
})

test('status cancellation reports cancelled and reaps an observed uncooperative probe tree', macOnly, async () => {
 const fixture = project()
 app(fixture, 'apps/alpha')
 const marker = join(fixture.dir, 'pids.json')
 file(join(fixture.bin, 'git'), `#!${process.execPath}\nimport fs from 'node:fs'; import { spawn } from 'node:child_process';
const child = spawn(${JSON.stringify(process.execPath)}, ['-e', 'process.on("SIGTERM",()=>{});process.stdout.write("ready");setInterval(()=>{},1000)'], { stdio: ['ignore','pipe','ignore'] });
process.on('SIGTERM',()=>{}); child.stdout.once('data',()=>fs.writeFileSync(${JSON.stringify(marker)}, JSON.stringify([process.pid, child.pid]))); setInterval(()=>{},1000);\n`)
 chmodSync(join(fixture.bin, 'git'), 0o755)
 const child = spawn(binary, ['status', '--project', fixture.dir, '--json'], { cwd: root, env: fixture.env })
 let stdout = '', stderr = ''
 child.stdout.on('data', bytes => { stdout += bytes })
 child.stderr.on('data', bytes => { stderr += bytes })
 const closed = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => resolve({ code, signal })) })
 const deadline = Date.now() + 10000
 try {
  while (!existsSync(marker) && Date.now() < deadline && child.exitCode === null) {await delay(10)}
  assert.ok(existsSync(marker), 'Observe the version probe running before cancellation')
  child.kill('SIGTERM')
  const result = await Promise.race([closed, delay(5000).then(() => { throw Error('Cancelled status did not exit') })])
  assert.deepEqual(result, { code: 8, signal: null })
  assert.equal(stderr, '')
  assert.equal(JSON.parse(stdout).error.code, 'cancelled')
  for (const pid of JSON.parse(readFileSync(marker))) {assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })}
 } finally {
  if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await closed }
 }
})
