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
const directory = process.env.XPLAT_PRERENDER_IOS_SDK_STARTUP_BUILD

if (!directory) {
  throw new Error(
    'Set XPLAT_PRERENDER_IOS_SDK_STARTUP_BUILD to the SDK startup build directory',
  )
}

const work = resolve(directory)
const build = JSON.parse(readFileSync(join(work, 'build.json')))

assert.equal(build.fixture, 'stock-sdk-startup')
assert.equal(build.id, 'org.octanexplat.prerender.sdkstartupios')
assert.equal(build.cliVersion, '9.1.1')
assert.ok(
  ['home', 'keyed', 'custom'].includes(build.startupFixture),
  'Unknown startup fixture',
)
assert.ok(
  ['adopt', 'seed-mismatch', 'attach-failure'].includes(build.startupMode),
  'Unknown startup mode',
)
assert.ok(
  build.startupMode === 'adopt' || build.startupFixture === 'keyed',
  'Recovery modes require the keyed fixture',
)

const fixture = build.startupFixture
const mode = build.startupMode

const project = join(work, 'SDKStartupGate')
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
assert.equal(hash(join(build.app, 'app/startup.bin')), producer.startupArtifactHash)
assert.equal(build.buildHash, producer.buildHash)

const products = resolve(build.app, '..')

assert.equal(hash(join(products, 'metadata-arm64.bin')), build.metadataHash)
assert.equal(
  hash(join(products, 'metadata-generation-stderr-arm64.txt')),
  build.metadataDiagnosticsHash,
)

const parent = join(homedir(), 'dev/reports/octane-xplat/native-prerender-sdk-startup-ios')

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
  'SDKStartupGate.xcworkspace',
  'SDKStartupGate.xcodeproj/project.xcworkspace',
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

  const stdout = join(documents, 'sdkstartup-stdout.log'),
    stderr = join(documents, 'sdkstartup-stderr.log')

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

    if (events.some((event) => event.event === 'passed' || event.event === 'failed')) {
      break
    }
  }

  assert.ok(events, 'No startup evidence')

  const stages = [
    'native-launch',
    'native-binary-decoded',
    'native-mounted',
    'display-link-before-runtime',
    'engine-init-begin',
    'engine-init-end',
    'js-entry-end',
    ...(fixture !== 'home' ? ['mount-disposed'] : []),
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

  assert.ok(!events.some((event) => event.event === 'failed'), 'Native mount control failed')

  const expected = JSON.parse(readFileSync(join(work, 'producer/resolved.json')))

  assert.equal(
    events.find((event) => event.event === 'native-mounted').visualNodes,
    expected.nodes.length,
  )

  if (fixture === 'home') {
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
    assert.equal(events.find((event) => event.event === 'passed').homeAdoptionQualified, true)
  } else {
    assert.equal(events.find((event) => event.event === 'passed').adoptionQualified, true)

    const disposed = events.find((event) => event.event === 'mount-disposed')
    assert.equal(disposed.nativeChildren, 0)
    assert.equal(disposed.masonChildren, 0)
    assert.equal(disposed.nativeViewsDetached, true)

    const packet = JSON.parse(readFileSync(join(work, 'producer/startup.json')))
    const proofs = JSON.parse(readFileSync(join(documents, 'artifact-proofs.json')))

    assert.ok(!proofs.some((proof) => proof.phase === 'failed'), JSON.stringify(proofs))

    if (mode === 'adopt' && fixture === 'custom') {
      assert.deepEqual(
        proofs.map((proof) => proof.phase),
        ['hydrated', 'disposed'],
      )

      const [initial, cleanup] = proofs

      assert.ok(
        initial.coldLiveParity &&
          initial.nativeIdentityRetained &&
          initial.masonIdentityRetained,
      )

      assert.equal(initial.logicalNodes, packet.nodes.length)
      assert.equal(initial.initialClaims, expected.nodes.length)
      assert.equal(initial.factoryCalls, expected.nodes.length)
      assert.ok(
        cleanup.nativeHandlesCleared &&
          cleanup.contextsCleared &&
          cleanup.logicalParentsCleared &&
          cleanup.viewportSubviews === 0 &&
          cleanup.claimPhase === 'retired',
        'Custom disposal did not release the adopted state',
      )
    } else if (mode === 'adopt') {
      assert.deepEqual(
        proofs.map((proof) => proof.phase),
        ['hydrated', 'reordered-added', 'removed', 'recreated', 'disposed'],
      )

      const [initial, added, removed, recreated, cleanup] = proofs

      assert.ok(
        initial.coldLiveParity &&
          initial.ordinaryInitialParity &&
          initial.nativeIdentityRetained &&
          initial.masonIdentityRetained &&
          initial.prepareAbortMutationFree,
      )

      assert.equal(initial.logicalNodes, packet.nodes.length)
      assert.equal(initial.initialClaims, expected.nodes.length)
      assert.equal(initial.factoryCalls, expected.nodes.length)
      assert.deepEqual(initial.labels, ['One', 'Two'])
      assert.deepEqual(added.labels, ['Two', 'One', 'Three'])
      assert.deepEqual(removed.labels, ['Three', 'Two'])
      assert.deepEqual(recreated.labels, ['One', 'Three', 'Two'])

      const sameOwner = (a, b) => assert.equal(a.owner, b.owner, 'Keyed logical owner differs')
      sameOwner(initial.children[2], added.children[1])
      sameOwner(initial.children[1], added.children[2])
      sameOwner(added.children[3], removed.children[1])
      sameOwner(initial.children[2], removed.children[2])
      sameOwner(added.children[3], recreated.children[2])
      sameOwner(initial.children[2], recreated.children[3])
      for (const proof of [added, removed, recreated]) {
        assert.equal(proof.ordinaryMoveParity, true)
        assert.ok(proof.transitions.length > 0)
        assert.ok(
          proof.transitions.every((row) =>
            ['native', 'mason', 'handle'].every((key) => typeof row.retained[key] === 'boolean'),
          ),
        )
      }
      assert.notEqual(initial.children[1].owner, recreated.children[1].owner)
      assert.notEqual(initial.children[1].native, recreated.children[1].native)
      assert.equal(added.factoryCalls, expected.nodes.length + 1)
      assert.equal(removed.factoryCalls, expected.nodes.length + 1)
      assert.equal(recreated.factoryCalls, expected.nodes.length + 2)
      assert.ok(
        added.adoptedOwnersRetained &&
          added.ordinaryCreation &&
          removed.removedOwnerReleased &&
          recreated.removedKeyCreatedOrdinarily,
      )

      // Observed iOS move retention, pinned after the first qualified run.
      // Moving a keyed child earlier in sibling order recreates its native
      // objects; moving later or staying put retains them. Adopted and
      // ordinary trees agree on every transition (ordinaryMoveParity).
      // Android reference: reordered-added One native:true Two native:false.
      const PINNED_TRANSITIONS = {
        'reordered-added': {
          One: { native: true, mason: true, handle: true },
          Two: { native: false, mason: false, handle: false },
        },
        removed: {
          Two: { native: true, mason: true, handle: true },
          Three: { native: false, mason: false, handle: false },
        },
        recreated: {
          Three: { native: true, mason: true, handle: true },
          Two: { native: true, mason: true, handle: true },
        },
      }
      for (const proof of [added, removed, recreated]) {
        const pinned = PINNED_TRANSITIONS[proof.phase]
        assert.ok(pinned, 'No pinned transitions for ' + proof.phase)
        for (const row of proof.transitions) {
          assert.deepEqual(
            row.retained,
            pinned[row.label],
            proof.phase + '/' + row.label + ' retention changed',
          )
        }
      }

      assert.ok(
        cleanup.nativeHandlesCleared &&
          cleanup.contextsCleared &&
          cleanup.logicalParentsCleared &&
          cleanup.claimPhase === 'retired',
      )
    } else if (mode === 'seed-mismatch') {
      assert.deepEqual(
        proofs.map((proof) => proof.phase),
        ['plan-rejected', 'recovered', 'disposed'],
      )
      const [rejected, recovered, cleanup] = proofs
      assert.equal(rejected.claimsPhase, 'retired')
      assert.equal(rejected.factoryCalls, 0)
      assert.equal(rejected.attachedNatives, 0)
      assert.equal(recovered.ordinaryRender, true)
      assert.equal(recovered.originalDetached, true)
      assert.equal(cleanup.claimPhase, 'retired')
      assert.equal(cleanup.viewportSubviews, 0)
    } else {
      assert.deepEqual(
        proofs.map((proof) => proof.phase),
        ['claim-failure', 'failed-adoption-disposed', 'recovered', 'disposed'],
      )
      const [failure, scope, recovered, cleanup] = proofs
      assert.equal(failure.attachmentCalls, 3)
      assert.equal(failure.claimsPhase, 'failed')
      assert.equal(scope.pendingAddsCleared, true)
      assert.equal(scope.claimPhase, 'retired')
      assert.equal(recovered.ordinaryRender, true)
      assert.equal(recovered.originalDetached, true)
      assert.equal(cleanup.claimPhase, 'retired')
      assert.equal(cleanup.viewportSubviews, 0)
    }
  }

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

    // The device is kept booted by default so a rerun skips the boot;
    // XPLAT_PRERENDER_KEEP_DEVICE=0 restores shutdown-and-verify.
    const keepDevice = process.env.XPLAT_PRERENDER_KEEP_DEVICE !== '0'
    let shutdownOk = false
    let shutdownError = ''
    if (!keepDevice) {
      const shutdown = spawnSync('xcrun', ['simctl', 'shutdown', udid], { encoding: 'utf8' })

      // An in-flight or already-finished shutdown exits nonzero (SimError 405);
      // the goal is the end state, so verify the device state itself.
      shutdownOk = shutdown.status === 0
      shutdownError = shutdown.stderr ?? 'state check'
      if (!shutdownOk) {
        const list = spawnSync('xcrun', ['simctl', 'list', 'devices', '-j'], {
          encoding: 'utf8',
          maxBuffer: 16 * 1024 * 1024,
        })
        if (list.status === 0) {
          const devices = Object.values(JSON.parse(list.stdout).devices).flat()
          shutdownOk = devices.some(
            (device) => device.udid === udid && device.state === 'Shutdown',
          )
        }
      }
    }

    writeFileSync(
      join(report, 'status.json'),
      JSON.stringify(
        {
          passed,
          normalSDK: true,
          fixture,
          mode,
          simulatorShutdown: shutdownOk,
          deviceKeptBooted: keepDevice,
          osInputQualified: false,
          presentationQualified: false,
          performanceQualified: false,
        },
        null,
        2,
      ),
    )

    console.log('SDK startup report: ' + report)
    if (!keepDevice && !shutdownOk) {
      assert.fail('simulator shutdown failed: ' + shutdownError)
    }
  }
}
