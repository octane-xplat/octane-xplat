import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { decodeStartupArtifact } from '@octane-xplat/native-prerender/codec'

// Private fixed Home control, using an explicitly prebuilt simulator host.
// Reserve ios:<UDID> + resident_devices before invoking this Turbo task.
const directory = process.env.XPLAT_PRERENDER_IOS_HOME_BUILD
if (!directory)
  throw new Error('Set XPLAT_PRERENDER_IOS_HOME_BUILD to the Home host build directory')
const scratch = resolve(directory)
const app = join(scratch, 'PrerenderProbe.app')
const source = import.meta.dirname
const id = 'org.octanexplat.prerenderbootstrap.controls-shared-home-xpi'
const udid = '91D40099-A056-497D-A572-ADDDFD6A8F23'
let interrupted
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    interrupted ??= new Error('iOS Home qualification interrupted: ' + signal)
  })
function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 16 * 1024 * 1024,
  })
  if (result.status !== 0)
    throw new Error(command + ': ' + (result.error?.message ?? result.stderr))
  return result.stdout.trim()
}
const build = JSON.parse(readFileSync(join(scratch, 'build.json'), 'utf8'))
const fallback = build.fallback ?? ''
assert.ok(['', 'build'].includes(fallback), 'Unknown iOS Home fault control')
const preflight = () =>
  decodeStartupArtifact(readFileSync(join(app, 'home.bin')), {
    build: build.binaryBuildHash,
    platform: 'ios',
  })
if (fallback === 'build') assert.throws(preflight, /binary build identity/)
else preflight()
if (build.fixture !== 'actual-shared-home-root-scoped-native-claims' || !build.binaryBuildHash)
  throw new Error('Expected binary Home fixture manifest')
if (run('plutil', ['-extract', 'CFBundleIdentifier', 'raw', join(app, 'Info.plist')]) !== id)
  throw new Error('Fixture app identifier mismatch')
for (const hashes of [
  build.producerSourceHashes,
  build.homeNativeHashes,
  build.candidateDriverHashes,
  build.fontLoweringHashes,
])
  for (const [path, expected] of Object.entries(hashes))
    if (createHash('sha256').update(readFileSync(path)).digest('hex') !== expected)
      throw new Error('Binary Home input changed; rebuild: ' + path)
if (
  createHash('sha256')
    .update(readFileSync(join(app, 'app/main.js')))
    .digest('hex') !== build.fixtureEntryHash
)
  throw new Error('Binary Home JS entry changed')

for (const [name, expected] of Object.entries(build.sourceHashes)) {
  const actual = createHash('sha256')
    .update(readFileSync(join(source, name)))
    .digest('hex')
  if (actual !== expected) throw new Error('Source changed; rebuild before running: ' + name)
}
for (const [path, expected] of [
  [join(app, 'PrerenderProbe'), build.executableHash],
  [join(app, 'Frameworks/NativeScript.framework/NativeScript'), build.runtimeHash],
]) {
  if (createHash('sha256').update(readFileSync(path)).digest('hex') !== expected)
    throw new Error('Built artifact changed; rebuild before running: ' + path)
}
const reports = join(homedir(), 'dev/reports/octane-xplat/native-prerender-ios-home')
mkdirSync(reports, { recursive: true })
const report = mkdtempSync(join(reports, 'run-'))
cpSync(join(scratch, 'build.json'), join(report, 'build.json'))
cpSync(import.meta.filename, join(report, 'runner.mjs'))
const driverHash = createHash('sha256')
  .update(readFileSync(import.meta.filename))
  .digest('hex')
writeFileSync(join(report, 'result.json'), '[]')
writeFileSync(
  join(report, 'status.json'),
  JSON.stringify({ passed: false, state: 'running', driverHash }),
)
let installed
let probeFailed = false
try {
  run('xcrun', ['simctl', 'bootstatus', udid, '-b'])
  run('xcrun', ['simctl', 'install', udid, app])
  installed = run('xcrun', ['simctl', 'get_app_container', udid, id, 'data'])
  const prior = join(installed, 'Documents/result.json')
  for (const name of [
    'result.json',
    'entry-stage.txt',
    'entry-error.txt',
    'selector-parity.json',
    'entry-details.json',
    'native-home.json',
  ]) {
    const path = join(installed, 'Documents', name)
    if (existsSync(path)) unlinkSync(path)
  }
  const stdout = join(installed, 'Documents/stdout.log')
  const stderr = join(installed, 'Documents/stderr.log')
  writeFileSync(stdout, '')
  writeFileSync(stderr, '')
  const launch = run('xcrun', [
    'simctl',
    'launch',
    '--stdout=' + stdout,
    '--stderr=' + stderr,
    udid,
    id,
  ])
  const pid = Number(launch.match(/:\s*(\d+)\s*$/)?.[1])
  if (!pid) throw new Error('Missing launched PID: ' + launch)
  cpSync(stdout, join(report, 'stdout.log'))
  cpSync(stderr, join(report, 'stderr.log'))
  let result
  for (let i = 0; i < 60; i++) {
    if (interrupted) throw interrupted
    await new Promise((r) => setTimeout(r, 500))
    const errorFile = join(installed, 'Documents/entry-error.txt')
    if (existsSync(errorFile)) throw new Error(readFileSync(errorFile, 'utf8'))
    const file = prior
    if (existsSync(file)) {
      result = JSON.parse(readFileSync(file, 'utf8'))
      writeFileSync(join(report, 'result.json'), JSON.stringify(result, null, 2))
      cpSync(stdout, join(report, 'stdout.log'))
      cpSync(stderr, join(report, 'stderr.log'))
      if (result.some((e) => e.event === 'passed')) break
    }
    try {
      process.kill(pid, 0)
    } catch (error) {
      if (error.code === 'ESRCH')
        throw new Error('Probe exited before completion: ' + JSON.stringify(result))
      throw error
    }
  }
  if (!result?.some((e) => e.event === 'passed'))
    throw new Error('Probe did not finish: ' + JSON.stringify(result))
  if (fallback === 'build') {
    assert.ok(
      result.some(
        (event) =>
          event.event === 'native-artifact-rejected' &&
          event.reason === 'binary build identity' &&
          event.beforeEngineInit === true &&
          event.artifactViews === 0,
      ),
      'Wrong-build artifact was not rejected before Home allocation/JS',
    )
    assert.ok(result.some((event) => event.event === 'passed' && event.ordinaryFallbackQualified))
    assert.ok(!result.some((event) => event.event === 'native-binary-decoded'))
  } else if (
    !result.some(
      (e) =>
        e.event === 'native-binary-decoded' &&
        e.nodes === 19 &&
        e.beforeEngineInit === true &&
        e.buildHash === build.binaryBuildHash,
    )
  )
    throw new Error('Expected 19-node binary decode before engine init')
  const details = JSON.parse(readFileSync(join(installed, 'Documents/entry-details.json'), 'utf8'))
  if (!details.passed || details.visualNodes !== 19 || details.logicalNodes !== 27)
    throw new Error('Home hydration details did not pass')
  assert.equal(result.filter((event) => event.event === 'engine-init-begin').length, 1)
  if (fallback === 'build') {
    assert.ok(details.artifactRejectedBeforeRuntime && details.normalRenderFallback)
    assert.equal(details.claimsBeforeReject, 0)
    assert.ok(details.sharedButtonUpdates && details.sharedResetUpdates)
  } else assert.ok(details.rootScopedClaims && details.sameNativeViews && details.sameMasonNodes)
  writeFileSync(join(report, 'result.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify({ report, passed: true, presentationQualified: false }, null, 2))
  writeFileSync(join(report, 'status.json'), JSON.stringify({ passed: true, driverHash }))
} catch (error) {
  probeFailed = true
  writeFileSync(
    join(report, 'status.json'),
    JSON.stringify({ passed: false, error: String(error), driverHash }),
  )
  throw error
} finally {
  const cleanupErrors = []
  if (installed) {
    for (const name of [
      'stdout.log',
      'stderr.log',
      'entry-stage.txt',
      'entry-error.txt',
      'selector-parity.json',
      'entry-details.json',
      'native-home.json',
    ]) {
      try {
        const path = join(installed, 'Documents', name)
        if (existsSync(path)) cpSync(path, join(report, name))
      } catch (error) {
        cleanupErrors.push(error)
      }
    }
  }
  spawnSync('xcrun', ['simctl', 'terminate', udid, id], { timeout: 10000 })
  try {
    run('xcrun', ['simctl', 'shutdown', udid])
  } catch (error) {
    // simctl exits 149 when a failed boot already left the device shut down.
    if (!String(error).includes('Unable to shutdown device in current state: Shutdown'))
      cleanupErrors.push(error)
  }
  if (cleanupErrors.length) {
    writeFileSync(join(report, 'cleanup-errors.json'), JSON.stringify(cleanupErrors.map(String)))
    if (!probeFailed) {
      writeFileSync(
        join(report, 'status.json'),
        JSON.stringify({ passed: false, cleanupFailed: true }),
      )
      throw new AggregateError(cleanupErrors, 'Native probe cleanup failed')
    }
    console.error('Native probe cleanup also failed: ' + cleanupErrors.map(String).join('; '))
  }
}
