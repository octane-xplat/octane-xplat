import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  cpSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs'

import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { assertProducerInputs } from './check-producer-inputs.mjs'

// Reserve the exact simulator and one resident slot around this command.
const directory = process.env.XPLAT_PRERENDER_IOS_SDK_HOME_BUILD

if (!directory) {
  throw new Error('Set XPLAT_PRERENDER_IOS_SDK_HOME_BUILD to the SDK Home build directory')
}

const work = resolve(directory)
const build = JSON.parse(readFileSync(join(work, 'build.json')))

assert.equal(build.fixture, 'stock-sdk-home')
assert.equal(build.id, 'org.octanexplat.prerender.sdkhomeios')
assert.equal(build.cliVersion, '9.1.1')

const project = join(work, 'SDKHomeStartupGate')
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const inventory = (directory) =>
  Object.fromEntries(
    readdirSync(directory, { recursive: true })
      .sort()
      .filter((name) => statSync(join(directory, name)).isFile())
      .map((name) => [name, hash(join(directory, name))]),
  )

for (const [file, digest] of Object.entries(build.sourceHashes)) {
  assert.equal(hash(file), digest, 'Source changed; rebuild: ' + file)
}

for (const { archive, sha256 } of Object.values(build.packed)) {
  assert.equal(hash(archive), sha256)
}

assert.equal(hash(join(work, 'builder.mjs')), build.builderHash)
assert.equal(hash(join(build.app, build.executable)), build.executableHash)
assert.equal(
  hash(join(build.app, 'Frameworks/NativeScript.framework/NativeScript')),
  build.runtimeHash,
)

assert.deepEqual(inventory(join(project, 'native')), build.nativeSources)
assert.deepEqual(inventory(join(build.app, 'app')), build.bundleFiles)

const producer = JSON.parse(readFileSync(join(work, 'producer/build.json')))

assertProducerInputs(producer)
assert.equal(hash(join(build.app, 'app/home.bin')), producer.startupArtifactHash)
assert.equal(build.buildHash, producer.buildHash)

const products = resolve(build.app, '..')

assert.equal(hash(join(products, 'metadata-arm64.bin')), build.metadataHash)
assert.equal(
  hash(join(products, 'metadata-generation-stderr-arm64.txt')),
  build.metadataDiagnosticsHash,
)

const parent = join(homedir(), 'dev/reports/octane-xplat/native-prerender-sdk-home-ios')

mkdirSync(parent, { recursive: true })

const report = mkdtempSync(join(parent, 'run-'))

for (const name of ['build.json', 'builder.mjs']) {
  cpSync(join(work, name), join(report, name))
}

cpSync(import.meta.filename, join(report, 'runner.mjs'))
cpSync(join(project, 'native'), join(report, 'native'), { recursive: true })
for (const name of [
  'package.json',
  'bun.lock',
  'nativescript.config.ts',
  'vite.config.mts',
  'startup.config.json',
]) {
  cpSync(join(project, name), join(report, name))
}

cpSync(join(project, 'src'), join(report, 'src'), { recursive: true })
cpSync(join(project, 'App_Resources'), join(report, 'App_Resources'), { recursive: true })
cpSync(join(work, 'producer'), join(report, 'producer'), { recursive: true })
for (const name of ['metadata-arm64.bin', 'metadata-generation-stderr-arm64.txt']) {
  cpSync(join(products, name), join(report, name))
}

for (const path of [
  'SDKHomeStartupGate.xcworkspace',
  'SDKHomeStartupGate.xcodeproj/project.xcworkspace',
]) {
  const lock = join(project, 'platforms/ios', path, 'xcshareddata/swiftpm/Package.resolved')

  if (existsSync(lock)) {
    cpSync(lock, join(report, 'Package.resolved'))
    break
  }
}

for (const name of ['Podfile', 'Podfile.lock']) {
  const file = join(project, 'platforms/ios', name)

  if (existsSync(file)) {
    cpSync(file, join(report, name))
  }
}

const udid = '91D40099-A056-497D-A572-ADDDFD6A8F23'
function call(args) {
  const result = spawnSync('xcrun', args, {
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 16 * 1024 * 1024,
  })

  assert.equal(result.status, 0, args.join(' ') + ': ' + (result.error?.message ?? result.stderr))
  return result.stdout.trim()
}

let installed,
  passed = false,
  interrupted = false

const stop = () => {
  interrupted = true
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
try {
  call(['simctl', 'bootstatus', udid, '-b'])
  // This fixed qualification app owns its data; no previous receipt may survive.
  spawnSync('xcrun', ['simctl', 'uninstall', udid, build.id], { encoding: 'utf8' })
  call(['simctl', 'install', udid, build.app])
  installed = call(['simctl', 'get_app_container', udid, build.id, 'data'])

  const documents = join(installed, 'Documents')

  mkdirSync(documents, { recursive: true })

  const stdout = join(documents, 'sdkhome-stdout.log'),
    stderr = join(documents, 'sdkhome-stderr.log')

  writeFileSync(stdout, '')
  writeFileSync(stderr, '')
  call(['simctl', 'launch', '--stdout=' + stdout, '--stderr=' + stderr, udid, build.id])

  let events

  for (let attempt = 0; attempt < 120; attempt++) {
    assert.ok(!interrupted, 'Interrupted')
    await new Promise((done) => setTimeout(done, 500))

    const evidence = join(documents, 'result.json')

    if (!existsSync(evidence)) {
      continue
    }

    events = JSON.parse(readFileSync(evidence))
    cpSync(evidence, join(report, 'events.json'))
    if (existsSync(join(documents, 'entry-error.txt'))) {
      throw new Error(readFileSync(join(documents, 'entry-error.txt'), 'utf8'))
    }

    if (events.some((event) => event.event === 'passed')) {
      break
    }
  }

  assert.ok(events, 'No Home evidence')

  const stages = [
    'native-launch',
    'native-binary-decoded',
    'native-mounted',
    'display-link-before-runtime',
    'engine-init-begin',
    'engine-init-end',
    'js-entry-end',
    'passed',
  ]

  const positions = stages.map((stage) => {
    assert.equal(events.filter((event) => event.event === stage).length, 1, 'Expected one ' + stage)
    return events.findIndex((event) => event.event === stage)
  })

  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
  )

  for (const stage of stages.slice(0, 5)) {
    assert.equal(events.find((event) => event.event === stage).runtimeStarted, false)
  }

  assert.equal(events.find((event) => event.event === 'native-mounted').visualNodes, 19)
  assert.equal(events.find((event) => event.event === 'passed').homeAdoptionQualified, true)

  const entry = JSON.parse(readFileSync(join(documents, 'entry-details.json')))

  for (const field of [
    'passed',
    'sameNativeViews',
    'sameMasonNodes',
    'initialGeometryPreserved',
    'layoutConstraintParity',
    'nativeFramesMatchMason',
    'viewportGeometryRestored',
    'nativePaintParity',
    'rootScopedClaims',
    'siblingRootIsolation',
    'ordinarySiblingDisposal',
    'homeCssRemovalParity',
    'nativeDefaultJournal',
    'undefinedFactoryFallback',
    'invalidFactoryRejected',
    'liveOwnershipRejected',
    'sharedButtonUpdates',
    'sharedResetUpdates',
    'pageIntegrationQualified',
  ]) {
    assert.equal(entry[field], true, field)
  }

  assert.equal(entry.visualNodes, 19)
  assert.equal(entry.logicalNodes, 27)
  assert.equal(entry.presentations, 1)
  assert.equal(entry.rootSetups, 1)
  assert.equal(entry.osInputQualified, false)
  passed = true
} finally {
  try {
    if (installed) {
      const documents = join(installed, 'Documents')

      for (const name of readdirSync(documents)) {
        const file = join(documents, name)

        if (statSync(file).isFile()) {
          cpSync(file, join(report, name))
        }
      }
    }
  } catch (error) {
    passed = false
    throw error
  } finally {
    spawnSync('xcrun', ['simctl', 'terminate', udid, build.id], { encoding: 'utf8' })

    const shutdown = spawnSync('xcrun', ['simctl', 'shutdown', udid], { encoding: 'utf8' })

    writeFileSync(
      join(report, 'status.json'),
      JSON.stringify(
        {
          passed,
          normalSDK: true,
          simulatorShutdown: shutdown.status === 0,
          osInputQualified: false,
          presentationQualified: false,
          performanceQualified: false,
        },
        null,
        2,
      ),
    )

    console.log('SDK Home report: ' + report)
    assert.equal(shutdown.status, 0, shutdown.stderr)
  }
}
