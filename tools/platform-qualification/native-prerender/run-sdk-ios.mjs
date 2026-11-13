import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

// Reserve the specified iOS simulator and resident_devices before this task.
const directory = process.env.XPLAT_PRERENDER_IOS_SDK_BUILD
if (!directory)
  throw new Error('Set XPLAT_PRERENDER_IOS_SDK_BUILD to the stock SDK build directory')
const root = resolve(directory)
const build = JSON.parse(readFileSync(join(root, 'build.json'), 'utf8'))
assert.equal(build.fixture, 'stock-sdk-late-js')
assert.equal(build.id, 'org.octanexplat.prerender.sdkios')
assert.equal(build.cliVersion, '9.1.1')
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
for (const [path, expected] of Object.entries(build.sourceHashes))
  assert.equal(hash(path), expected, 'Source changed; rebuild: ' + path)
assert.equal(hash(join(build.app, build.executable)), build.executableHash)
assert.equal(hash(join(build.app, 'app/bundle.mjs')), build.bundleHash)
assert.deepEqual(
  Object.fromEntries(
    readdirSync(join(build.app, 'app'), { recursive: true })
      .sort()
      .filter((name) => statSync(join(build.app, 'app', name)).isFile())
      .map((name) => [name, hash(join(build.app, 'app', name))]),
  ),
  build.bundleFiles,
)
assert.equal(
  hash(join(build.app, 'Frameworks/NativeScript.framework/NativeScript')),
  build.runtimeHash,
)
assert.equal(hash(join(root, 'builder.mjs')), build.builderHash)
const products = join(build.app, '..')
assert.equal(hash(join(products, 'metadata-arm64.bin')), build.metadataHash)
assert.equal(
  hash(join(products, 'metadata-generation-stderr-arm64.txt')),
  build.metadataDiagnosticsHash,
)
const parent = join(homedir(), 'dev/reports/octane-xplat/native-prerender-sdk-ios')
mkdirSync(parent, { recursive: true })
const report = mkdtempSync(join(parent, 'run-'))
cpSync(join(root, 'build.json'), join(report, 'build.json'))
cpSync(join(root, 'builder.mjs'), join(report, 'builder.mjs'))
cpSync(import.meta.filename, join(report, 'runner.mjs'))
for (const name of readdirSync(root).filter((name) => name.endsWith('-command.log')))
  cpSync(join(root, name), join(report, name))
for (const name of ['metadata-arm64.bin', 'metadata-generation-stderr-arm64.txt'])
  cpSync(join(products, name), join(report, name))
cpSync(
  join(
    root,
    'SDKStartupGate/platforms/ios/SDKStartupGate.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved',
  ),
  join(report, 'Package.resolved'),
)
cpSync(join(root, 'SDKStartupGate/native'), join(report, 'native'), { recursive: true })
for (const name of ['package.json', 'bun.lock', 'nativescript.config.ts', 'vite.config.mts'])
  cpSync(join(root, 'SDKStartupGate', name), join(report, name))
cpSync(join(root, 'SDKStartupGate/src'), join(report, 'src'), { recursive: true })
cpSync(join(root, 'SDKStartupGate/App_Resources'), join(report, 'App_Resources'), {
  recursive: true,
})
cpSync(join(build.app, 'app'), join(report, 'bundle'), { recursive: true })
const udid = '91D40099-A056-497D-A572-ADDDFD6A8F23'
let interrupted
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    interrupted = signal
  })
function run(args) {
  const result = spawnSync('xcrun', args, {
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 16 * 1024 * 1024,
  })
  if (result.status !== 0)
    throw new Error(args.join(' ') + ': ' + (result.error?.message ?? result.stderr))
  return result.stdout.trim()
}
let installed
let passed = false
try {
  run(['simctl', 'bootstatus', udid, '-b'])
  run(['simctl', 'install', udid, build.app])
  installed = run(['simctl', 'get_app_container', udid, build.id, 'data'])
  const evidence = join(installed, 'Documents/sdk-startup.json')
  if (existsSync(evidence)) unlinkSync(evidence)
  const stdout = join(installed, 'Documents/sdk-stdout.log')
  const stderr = join(installed, 'Documents/sdk-stderr.log')
  writeFileSync(stdout, '')
  writeFileSync(stderr, '')
  run(['simctl', 'launch', '--stdout=' + stdout, '--stderr=' + stderr, udid, build.id])
  let events
  for (let i = 0; i < 70; i++) {
    if (interrupted) throw new Error('Interrupted: ' + interrupted)
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (!existsSync(evidence)) continue
    events = JSON.parse(readFileSync(evidence, 'utf8'))
    cpSync(evidence, join(report, 'events.json'))
    if (events.some((event) => event.event === 'failed')) throw new Error(JSON.stringify(events))
    if (events.some((event) => event.event === 'passed')) break
  }
  assert.ok(events, 'No native evidence')
  const names = events.map((event) => event.event)
  for (const event of [
    'native-mounted',
    'native-layout',
    'sdk-setup-begin',
    'sdk-setup-end',
    'sdk-boot-returned',
    'passed',
  ])
    assert.equal(names.filter((name) => name === event).length, 1, 'Expected exactly one ' + event)
  assert.ok(names.indexOf('native-layout') < names.indexOf('sdk-setup-begin'))
  assert.ok(names.indexOf('sdk-setup-end') < names.indexOf('sdk-boot-returned'))
  assert.ok(names.indexOf('sdk-boot-returned') < names.indexOf('passed'))
  assert.equal(events.find((event) => event.event === 'native-layout').beforeSDKSetup, true)
  const result = events.find((event) => event.event === 'passed')
  assert.equal(result.sameNativeLabel, true)
  assert.equal(result.sceneCount, 1)
  assert.equal(result.windowCount, 1)
  passed = true
} finally {
  if (installed)
    for (const [name, output] of [
      ['sdk-startup.json', 'events.json'],
      ['sdk-stdout.log', 'stdout.log'],
      ['sdk-stderr.log', 'stderr.log'],
    ]) {
      const path = join(installed, 'Documents', name)
      if (existsSync(path)) cpSync(path, join(report, output))
    }
  spawnSync('xcrun', ['simctl', 'terminate', udid, build.id], { encoding: 'utf8' })
  const shutdown = spawnSync('xcrun', ['simctl', 'shutdown', udid], { encoding: 'utf8' })
  writeFileSync(
    join(report, 'status.json'),
    JSON.stringify(
      {
        passed,
        simulatorShutdown: shutdown.status === 0,
        normalSDK: true,
        homeHydrationQualified: false,
        osInputQualified: false,
        presentationQualified: false,
      },
      null,
      2,
    ),
  )
  console.log('SDK startup report: ' + report)
  if (shutdown.status !== 0) throw new Error('Simulator shutdown failed: ' + shutdown.stderr)
}
