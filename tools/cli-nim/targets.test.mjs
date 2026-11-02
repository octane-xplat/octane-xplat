import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, chmodSync, rmSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, envProbeInputs } from './native-inputs.mjs'
const root = resolve(import.meta.dirname, '../..')
const binary = join(root, `research/nim-cli/native/env-probe${process.platform === 'win32' ? '.exe' : ''}`)
assertCurrentNativeBuild(root, JSON.parse(readFileSync(join(root, 'research/nim-cli/native/env-build.json'))), readFileSync(binary), envProbeInputs)
const scratch = scratchRun(root, 'targets')
after(() => rmSync(scratch, { recursive: true, force: true }))
const macOnly = { skip: process.platform !== 'darwin' }
let sequence = 0
function query(request, native = true) {
 const result = spawnSync(native ? binary : process.execPath, native ? [] : [join(import.meta.dirname, 'targets-reference.mjs')],
  { input: JSON.stringify({ dir: scratch, ...request }) + '\n', encoding: 'utf8', timeout: 20000, maxBuffer: 4 * 1024 * 1024 })
 assert.equal(result.status, 0, result.stderr)
 assert.equal(result.stderr, '')
 return JSON.parse(result.stdout)
}
const simulator = (udid, name, state = 'Shutdown', isAvailable = true) => ({ udid, name, state, isAvailable })
const snapshot = JSON.stringify({ devices: {
 'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [simulator('one', 'iPhone 🛰️'), simulator('two', 'iPad', 'Booted'), simulator('no', 'Unavailable', 'Shutdown', false)],
 'com.apple.CoreSimulator.SimRuntime.iOS-18-5': [simulator('three', 'Old phone', 'Booted'), simulator('four', 'Old tablet')],
} })
function fixture(command, output, code = 0) {
 const dir = join(scratch, String(++sequence)), bin = join(dir, 'bin'), calls = join(dir, 'calls.json')
 mkdirSync(bin, { recursive: true })
 const path = join(bin, command)
 writeFileSync(path, `#!${process.execPath}\nimport fs from 'node:fs';
fs.writeFileSync(${JSON.stringify(calls)},JSON.stringify({args:process.argv.slice(2),cwd:process.cwd(),sentinel:process.env.XPLAT_TARGET_FIXTURE}));
process.stderr.write('query diagnostic'); process.stdout.write(Buffer.from(${JSON.stringify(Buffer.from(output).toString('base64'))},'base64')); process.exitCode=${code};\n`)
 chmodSync(path, 0o755)
 return { dir, env: { PATH: bin, XPLAT_TARGET_FIXTURE: 'selected-project' }, calls }
}

test('host eligibility matches all six platform contracts without executing another host', () => {
 for (const platform of ['web', 'ios', 'android', 'macos', 'linux', 'windows']) {
  for (const host of ['darwin', 'linux', 'win32', 'freebsd']) {
   const request = { operation: 'host-block', platform, host }
   assert.deepEqual(query(request), query(request, false))
  }
 }
})

test('simctl inventory retains runtime labels, Unicode names and stable booted-first ordering', () => {
 const documents = [snapshot, '{}', '{"devices":null}', '{"devices":{}}', ' {"devices":{"iOS 26-1":[{"udid":"new","name":"Name","state":"Booting","isAvailable":true}]}} ',
  ...[null, '', ' ', '{', 'null', '{"devices":{"bad":null}}', '{"devices":{"bad":[null]}}']]
 for (const output of documents) {
  const request = { operation: 'target-parse', platform: 'ios', output }
  assert.deepEqual(query(request), query(request, false), output)
 }
 const actual = query({ operation: 'target-parse', platform: 'ios', output: snapshot }).value.targets
 assert.deepEqual(actual.map(row => row.targetId), ['two', 'three', 'one', 'four'])
 assert.match(actual[0].name, /iOS 26\.0 \(booted\)/)
})

test('malformed available simulator identities fail instead of offering phantom-ready targets', () => {
 for (const device of [{ isAvailable: true }, simulator('', 'name'), simulator('id', ''), simulator(123, 'name'), simulator('id', 'name', 'Shutdown', 'false')]) {
  const request = { operation: 'target-parse', platform: 'ios', output: JSON.stringify({ devices: { 'iOS-26': [device] } }) }
  const actual = query(request).value
  assert.deepEqual(actual.targets, [])
  assert.match(actual.reason, /could not be parsed/)
  assert.equal(query(request, false).value.targets.length, 1, 'Document stricter native identity validation')
 }
})

test('adb inventory includes connected emulators/devices and excludes offline, unauthorized and daemon text', () => {
 for (const output of [null, '', 'List of devices attached\n', 'header\r\nemulator-5554\tdevice\r\nphone-α\tdevice\nphone-2\toffline\nphone-3\tunauthorized\n',
  'header\n\ufeffphone\tdevice\u00a0\n\tdevice\nnoise\n', 'header\n* daemon started successfully *\n']) {
  const request = { operation: 'target-parse', platform: 'android', output }
  assert.deepEqual(query(request), query(request, false), output)
 }
})

test('native inventory queries use explicit argv/cwd/environment and degrade on missing/failing tools', macOnly, () => {
 for (const [platform, command, output, args] of [['ios', 'xcrun', snapshot, ['simctl', 'list', 'devices', 'available', '-j']],
  ['android', 'adb', 'List of devices attached\nemulator-5554\tdevice\n', ['devices']]]) {
  const selected = fixture(command, output)
  const result = query({ operation: 'target-query', platform, ...selected })
  assert.deepEqual(result, query({ operation: 'target-parse', platform, output }, false))
  assert.deepEqual(JSON.parse(readFileSync(selected.calls)), { args, cwd: selected.dir, sentinel: 'selected-project' })
  const failed = query({ operation: 'target-query', platform, ...fixture(command, output, 9) }).value
  assert.equal(failed.targets.length, 0)
  assert.match(failed.reason, /unavailable/)
  const absent = query({ operation: 'target-query', platform, dir: scratch, env: { PATH: '' } }).value
  assert.equal(absent.targets.length, 0)
  assert.match(absent.reason, /unavailable/)
  const aborted = fixture(command, output)
  const cancel = query({ operation: 'target-query', platform, ...aborted, preabort: true })
  assert.equal(cancel.ok, false)
  assert.match(cancel.message, /cancelled/)
  assert.equal(existsSync(aborted.calls), false)
 }
})

test('actual macOS simulator inventory parses without booting or launching a device', macOnly, () => {
 const result = spawnSync('xcrun', ['simctl', 'list', 'devices', 'available', '-j'], { cwd: scratch, encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024 })
 const output = result.status === 0 ? result.stdout : null
 const parsed = query({ operation: 'target-parse', platform: 'ios', output })
 assert.deepEqual(parsed, query({ operation: 'target-parse', platform: 'ios', output }, false))
 const live = query({ operation: 'target-query', platform: 'ios', env: { PATH: process.env.PATH } })
 assert.deepEqual(live, parsed, 'Compare two read-only inventories; a concurrent device change requires a fresh observation')
 console.info(`Observed ${parsed.value.targets.length} available simulator inventory entries; no simulator was booted or launched`)
})
