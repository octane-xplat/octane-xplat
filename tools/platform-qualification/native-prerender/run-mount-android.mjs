import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { readAndroidBuild } from './read-android-build.mjs'

// Own device:<explicit serial>; this control never starts an emulator or JS.
const directory = process.env.XPLAT_PRERENDER_ANDROID_BUILD
const build = readAndroidBuild(directory)
assert.ok(build.home && !build.home.adopt && !build.home.startup && build.variant === 'debug',
  'Mount control requires a debug Home artifact build without adoption/startup modes')
const serial = process.env.XPLAT_PRERENDER_ANDROID_DEVICE_SERIAL
assert.ok(serial && !serial.startsWith('emulator-'), 'Mount control requires an explicit physical serial')
const adb = join(build.sdk, 'platform-tools/adb')
const expected = JSON.parse(readFileSync(join(resolve(directory), 'producer/resolved.json')))
const root = join(homedir(), 'dev/reports/octane-xplat/native-prerender-mount-android')
mkdirSync(root, { recursive: true })
const report = mkdtempSync(join(root, 'run-'))
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
writeFileSync(join(report, 'build.json'), JSON.stringify(build, null, 2))
writeFileSync(join(report, 'driver.json'), JSON.stringify({
  inputs: Object.fromEntries([import.meta.filename, join(import.meta.dirname, 'read-android-build.mjs')].map((file) => [file, hash(file)])),
  scope: 'Physical Android variable-topology native mount/draw/disposal; no JS, hydration, reference style parity, compositor presentation or performance qualification',
}, null, 2))
function device(args, required = true) {
  const result = spawnSync(adb, ['-s', serial, ...args], { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 })
  if (required && result.status !== 0) throw new Error('adb failed: ' + (result.error?.message ?? result.stderr))
  return result
}
const property = (name) => device(['shell', 'getprop', name]).stdout.trim()
let installed = false
try {
  assert.equal(device(['get-state']).stdout.trim(), 'device')
  const identity = { serial, model: property('ro.product.model'), api: Number(property('ro.build.version.sdk')), abi: property('ro.product.cpu.abi'), qemu: property('ro.kernel.qemu') }
  assert.ok(identity.api >= 35 && identity.abi === 'arm64-v8a' && identity.qemu !== '1', 'Expected Android35+ ARM64 physical hardware')
  writeFileSync(join(report, 'device.json'), JSON.stringify(identity, null, 2))
  device(['shell', 'am', 'force-stop', build.id])
  device(['install', '-r', build.apk])
  installed = true
  device(['shell', 'run-as', build.id, 'rm', '-f', 'files/probe-result.json'])
  const launch = device(['shell', 'am', 'start', '-W', '-n', build.id + '/org.octanexplat.prerenderandroid.MasonMountActivity'])
  writeFileSync(join(report, 'launch.txt'), launch.stdout + launch.stderr)
  const deadline = Date.now() + 30000
  let events = []
  while (Date.now() < deadline) {
    const receipt = device(['shell', 'run-as', build.id, 'cat', 'files/probe-result.json'], false)
    if (receipt.status === 0) {
      events = JSON.parse(receipt.stdout)
      writeFileSync(join(report, 'result.json'), JSON.stringify(events, null, 2))
      assert.ok(!events.some((event) => event.event === 'failed'), 'Native mount control failed: ' + JSON.stringify(events))
      if (events.some((event) => event.event === 'mount-disposed')) break
    }
    await new Promise((done) => setTimeout(done, 100))
  }
  const passed = events.find((event) => event.event === 'mount-passed')
  const disposed = events.find((event) => event.event === 'mount-disposed')
  assert.ok(passed && passed.draws > 0 && disposed && disposed.nativeChildren === 0 && disposed.masonChildren === 0, 'Native mount/draw/disposal proof missing')
  assert.ok(events.filter((event) => event.event.startsWith('mount-')).every((event) => event.runtimeStarted === false && event.runtimeLibraryLoaded === false && event.runtimeStarts === 0), 'Native mount started JS')
  assert.equal(passed.visualNodes, expected.nodes.length)
  assert.equal(passed.nodes.length, expected.nodes.length)
  const packet = JSON.parse(readFileSync(join(resolve(directory), 'producer/startup.json')))
  assert.equal(passed.logicalNodes, packet.nodes.length)
  passed.nodes.forEach((node, index) => {
    const row = expected.nodes[index]
    assert.equal(node.kind, row.kind)
    assert.equal(node.parent, row.parent ?? -1)
    assert.equal(node.index, index)
    assert.ok(node.attached && node.width > 0 && node.height > 0)
    if (node.kind === 'label') assert.equal(node.text, row.text)
  })
  writeFileSync(join(report, 'status.json'), JSON.stringify({ passed: true, visualNodes: passed.visualNodes, logicalNodes: passed.logicalNodes, hydrationQualified: false, presentationQualified: false }, null, 2))
  console.log(JSON.stringify({ report, passed: true, visualNodes: passed.visualNodes }, null, 2))
} catch (error) {
  writeFileSync(join(report, 'status.json'), JSON.stringify({ passed: false, error: String(error) }, null, 2))
  throw error
} finally {
  if (installed) {
    const pid = device(['shell', 'pidof', build.id], false).stdout.trim()
    if (/^\d+$/.test(pid)) {
      const logs = device(['logcat', '-d', '-t', '200', '--pid=' + pid], false)
      writeFileSync(join(report, 'logcat.txt'), logs.stdout + logs.stderr)
    }
    device(['shell', 'am', 'force-stop', build.id], false)
  }
}
