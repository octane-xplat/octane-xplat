import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

// Run inside the host runner's exclusive reservation. This uses HID input only;
// it neither reads the screen nor takes screenshots.
const udid = '91D40099-A056-497D-A572-ADDDFD6A8F23'
const [bundleId, reportPath] = process.argv.slice(2)
assert.ok(bundleId?.startsWith('org.octanexplat.prerenderbootstrap.controls-'))
assert.ok(reportPath, 'Supply the qualification report directory')
const report = resolve(reportPath)
mkdirSync(report, { recursive: true })
const container = spawnSync('xcrun', ['simctl', 'get_app_container', udid, bundleId, 'data'], {
  encoding: 'utf8',
  timeout: 30000,
})
assert.equal(container.status, 0, container.stderr)
const documents = join(container.stdout.trim(), 'Documents')
const marker = join(documents, 'home-os-input')
const readyFile = join(documents, 'input-ready.json')
const completion = join(documents, 'entry-details.json')
const driverReady = join(report, 'input-driver-ready.json')
const resultPath = join(report, 'os-input.json')
const socketDirectory = mkdtempSync(join(tmpdir(), 'home-hid-'))
const socket = join(socketDirectory, 'idb.sock')
const actions = []
const driverSourceHash = createHash('sha256')
  .update(readFileSync(import.meta.filename))
  .digest('hex')
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let stopping = false
let companion, companionError, command
process.on('SIGTERM', () => {
  stopping = true
  command?.kill('SIGTERM')
})
process.on('SIGINT', () => {
  stopping = true
  command?.kill('SIGTERM')
})
function readJSON(path) {
  if (!existsSync(path)) return undefined
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
  }
}
async function tap(point) {
  await new Promise((resolve, reject) => {
    command = spawn(
      'idb',
      [
        '--companion',
        socket,
        'ui',
        'tap',
        String(point.x),
        String(point.y),
        '--api',
        'hid',
        '--udid',
        udid,
        '--reason',
        'Verify touch delivery through the adopted native Home',
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, AI_AGENT: process.env.AI_AGENT ?? 'Codex/NativeHomePrerender' },
      },
    )
    let output = ''
    const timer = setTimeout(() => {
      const timedOut = command
      timedOut?.kill('SIGTERM')
      setTimeout(() => {
        if (timedOut?.exitCode === null && timedOut?.signalCode === null) timedOut.kill('SIGKILL')
      }, 2000).unref()
    }, 30000)
    command.stdout.on('data', (chunk) => {
      output = (output + chunk).slice(-8192)
    })
    command.stderr.on('data', (chunk) => {
      output = (output + chunk).slice(-8192)
    })
    command.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    command.once('exit', (code, signal) => {
      clearTimeout(timer)
      command = undefined
      if (code === 0) resolve()
      else reject(new Error('HID tap failed: ' + (signal ?? code) + '\n' + output))
    })
  })
}
try {
  for (const path of [readyFile, driverReady, resultPath]) rmSync(path, { force: true })
  writeFileSync(marker, '')
  companion = spawn(
    'idb_companion',
    [
      '--udid',
      udid,
      '--grpc-domain-sock',
      socket,
      '--log-level',
      'info',
      '--log-file-path',
      join(report, 'idb-companion.log'),
      '--terminate-offline',
      '1',
    ],
    { stdio: 'ignore' },
  )
  companion.on('error', (error) => {
    companionError = error
  })
  const startupDeadline = Date.now() + 30000
  while (!existsSync(socket)) {
    if (companionError) throw companionError
    assert.ok(
      !stopping &&
        companion.exitCode === null &&
        companion.signalCode === null &&
        Date.now() < startupDeadline,
      'HID companion did not start',
    )
    await pause(100)
  }
  writeFileSync(driverReady, JSON.stringify({ ready: true, udid, bundleId }))
  const deadline = Date.now() + 120000
  const steps = [
    { id: 'home-complete', count: '4' },
    { id: 'home-reset', count: '3' },
  ]
  while (!stopping && Date.now() < deadline) {
    if (companionError) throw companionError
    assert.ok(companion.exitCode === null && companion.signalCode === null, 'HID companion exited')
    const errorFile = join(documents, 'entry-error.txt')
    assert.ok(!existsSync(errorFile), 'Home fixture reported an error')
    const done = readJSON(completion)
    if (done?.passed) {
      assert.equal(done.osInputQualified, true)
      assert.equal(actions.length, 2, 'Home completed without both HID inputs')
      assert.equal(done.sameNativeViews, true)
      writeFileSync(
        resultPath,
        JSON.stringify(
          { passed: true, udid, bundleId, transport: 'idb-hid', driverSourceHash, actions },
          null,
          2,
        ),
      )
      break
    }
    const ready = readJSON(readyFile)
    if (ready && ready.step > actions.length) {
      const expected = steps[actions.length]
      assert.ok(expected, 'Unexpected extra input request')
      assert.equal(ready.version, 1)
      assert.equal(ready.step, actions.length + 1)
      assert.equal(ready.id, expected.id)
      assert.equal(ready.expectedCount, expected.count)
      const { point, window } = ready
      assert.ok([point?.x, point?.y, window?.width, window?.height].every(Number.isFinite))
      assert.ok(point.x >= 0 && point.y >= 0 && point.x < window.width && point.y < window.height)
      await tap(point)
      actions.push({ step: ready.step, id: ready.id, point, expectedCount: ready.expectedCount })
    }
    await pause(50)
  }
  assert.ok(existsSync(resultPath), stopping ? 'Input driver cancelled' : 'Home input timed out')
} catch (error) {
  writeFileSync(
    resultPath,
    JSON.stringify({ passed: false, error: String(error), actions }, null, 2),
  )
  process.exitCode = 1
} finally {
  command?.kill('SIGTERM')
  if (companion && companion.exitCode === null && companion.signalCode === null) {
    companion.kill('SIGTERM')
    const deadline = Date.now() + 2000
    while (companion.exitCode === null && companion.signalCode === null && Date.now() < deadline)
      await pause(50)
    if (companion.exitCode === null && companion.signalCode === null) companion.kill('SIGKILL')
  }
  rmSync(marker, { force: true })
  rmSync(socketDirectory, { recursive: true, force: true })
}
