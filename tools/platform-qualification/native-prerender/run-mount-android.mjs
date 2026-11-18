import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { readAndroidBuild } from './read-android-build.mjs'

// Own device:<serial> or the already-booted android:elegant-fir-probe.
// The caller owns emulator startup/shutdown; this driver never changes device settings.
const directory = process.env.XPLAT_PRERENDER_ANDROID_BUILD
const build = readAndroidBuild(directory)

assert.ok(
  build.home && !build.home.adopt && !build.home.startup && build.variant === 'debug',
  'Mount control requires a debug Home artifact build without adoption/startup modes',
)

const serial = process.env.XPLAT_PRERENDER_ANDROID_DEVICE_SERIAL

assert.ok(serial, 'Mount control requires an explicit, already-booted target serial')

const physical = !serial.startsWith('emulator-')
const adoption = Boolean(build.home.artifactAdopt || build.home.customAdopt)
const customAdoption = Boolean(build.home.customAdopt)
// The fixture app is left running by default so a rerun skips app/device
// startup and the presented screen stays visible for evaluation;
// XPLAT_PRERENDER_KEEP_DEVICE=0 restores force-stop cleanup.
const keepDevice = process.env.XPLAT_PRERENDER_KEEP_DEVICE !== '0'
const adb = join(build.sdk, 'platform-tools/adb')
const expected = JSON.parse(readFileSync(join(resolve(directory), 'producer/resolved.json')))
const root = join(homedir(), 'dev/reports/octane-xplat/native-prerender-mount-android')

mkdirSync(root, { recursive: true })

const report = mkdtempSync(join(root, 'run-'))
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')

writeFileSync(join(report, 'build.json'), JSON.stringify(build, null, 2))
writeFileSync(
  join(report, 'driver.json'),
  JSON.stringify(
    {
      inputs: Object.fromEntries(
        [import.meta.filename, join(import.meta.dirname, 'read-android-build.mjs')].map((file) => [
          file,
          hash(file),
        ]),
      ),
      scope: `${physical ? 'Physical' : 'Emulator'} Android variable-topology native mount/draw/disposal${adoption ? ', configured JSX hydration and keyed updates' : '; no JS or hydration'}; no normal app/window integration, OS input, compositor presentation or performance qualification`,
    },
    null,
    2,
  ),
)

function device(args, required = true) {
  const result = spawnSync(adb, ['-s', serial, ...args], {
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 8 * 1024 * 1024,
  })

  if (required && result.status !== 0) {
    throw new Error('adb failed: ' + (result.error?.message ?? result.stderr))
  }

  return result
}

const property = (name) => device(['shell', 'getprop', name]).stdout.trim()
let installed = false,
  uid

try {
  assert.equal(device(['get-state']).stdout.trim(), 'device')

  const identity = {
    serial,
    model: property('ro.product.model'),
    api: Number(property('ro.build.version.sdk')),
    abi: property('ro.product.cpu.abi'),
    qemu: property('ro.kernel.qemu'),
  }

  assert.ok(
    identity.api >= 35 &&
      identity.abi === 'arm64-v8a' &&
      (physical ? identity.qemu !== '1' : identity.qemu === '1'),
    'Expected Android35+ ARM64 target',
  )

  if (!physical) {
    assert.equal(
      device(['emu', 'avd', 'name']).stdout.trim().split(/\r?\n/)[0],
      'elegant-fir-probe',
    )

    const devices = spawnSync(adb, ['devices'], { encoding: 'utf8', timeout: 5000 })

    assert.equal(devices.status, 0)
    assert.equal(
      devices.stdout.split(/\r?\n/).filter((line) => line.startsWith('emulator-')).length,
      1,
      'Only one emulator may run',
    )
  }

  writeFileSync(join(report, 'device.json'), JSON.stringify(identity, null, 2))
  device(['shell', 'am', 'force-stop', build.id])
  device(['install', '-r', build.apk])
  installed = true

  const packages = device(['shell', 'pm', 'list', 'packages', '-U', build.id]).stdout
  const ownPackage = packages
    .split(/\r?\n/)
    .find((line) => line.startsWith('package:' + build.id + ' uid:'))

  uid = ownPackage?.match(/ uid:(\d+)/)?.[1]
  assert.ok(uid, 'Fixture app UID missing')
  device(['shell', 'run-as', build.id, 'rm', '-f', 'files/probe-result.json'])

  const launch = device([
    'shell',
    'am',
    'start',
    '-W',
    '-n',
    build.id + '/org.octanexplat.prerenderandroid.MasonMountActivity',
  ])

  writeFileSync(join(report, 'launch.txt'), launch.stdout + launch.stderr)

  const deadline = Date.now() + 120000
  let events = []

  while (Date.now() < deadline) {
    const receipt = device(['shell', 'run-as', build.id, 'cat', 'files/probe-result.json'], false)

    if (receipt.status === 0) {
      events = JSON.parse(receipt.stdout)
      writeFileSync(join(report, 'result.json'), JSON.stringify(events, null, 2))
      assert.ok(
        !events.some((event) => event.event === 'failed' || event.phase === 'failed'),
        'Native mount control failed: ' + JSON.stringify(events),
      )

      const mounted = events.findLast((event) => event.event === 'mount-passed')

      if (
        mounted &&
        events.some(
          (event) =>
            event.event === (customAdoption ? 'mount-held' : 'mount-disposed') &&
            event.epoch === mounted.epoch,
        )
      ) {
        break
      }
    }

    await new Promise((done) => setTimeout(done, 100))
  }

  const passed = events.findLast((event) => event.event === 'mount-passed')
  const teardown = events.find(
    (event) =>
      event.event === (customAdoption ? 'mount-held' : 'mount-disposed') &&
      event.epoch === passed?.epoch,
  )

  assert.ok(
    passed &&
      passed.draws > 0 &&
      teardown &&
      (customAdoption
        ? teardown.nativeChildren > 0
        : teardown.nativeChildren === 0 && teardown.masonChildren === 0),
    customAdoption
      ? 'Native mount/draw/presentation proof missing'
      : 'Native mount/draw/disposal proof missing',
  )

  assert.ok(
    events
      .filter((event) =>
        ['mount-preflight', 'mount-passed', ...(!adoption ? ['mount-disposed'] : [])].includes(
          event.event,
        ),
      )
      .every(
        (event) =>
          event.runtimeStarted === false &&
          event.runtimeLibraryLoaded === false &&
          event.runtimeStarts === 0,
      ),
    'Native mount started JS',
  )

  const canonicalBind = (bind) =>
    JSON.stringify(
      Object.keys(bind ?? {})
        .sort()
        .map((name) => [name, bind[name]]),
    )
  const resolvedTrees = expected.trees ?? [{ bind: {}, nodes: expected.nodes }]
  const expectedTree =
    resolvedTrees.find((tree) => canonicalBind(tree.bind) === canonicalBind(passed.bind)) ??
    assert.fail('Mounted bind ' + canonicalBind(passed.bind) + ' matches no resolved tree')

  assert.equal(passed.visualNodes, expectedTree.nodes.length)
  assert.equal(passed.nodes.length, expectedTree.nodes.length)

  const packet = JSON.parse(readFileSync(join(resolve(directory), 'producer/startup.json')))
  const packetTrees = packet.trees ?? [{ bind: {}, nodes: packet.nodes }]
  const packetTree =
    packetTrees.find((tree) => canonicalBind(tree.bind) === canonicalBind(passed.bind)) ??
    assert.fail('Mounted bind matches no artifact tree')

  assert.equal(passed.logicalNodes, packetTree.nodes.length)
  passed.nodes.forEach((node, index) => {
    const row = expectedTree.nodes[index]

    assert.equal(node.kind, row.kind)
    assert.equal(node.parent, row.parent ?? -1)
    assert.equal(node.index, index)
    assert.ok(node.attached && node.width > 0 && node.height > 0)
    if (node.kind === 'label') {
      assert.equal(node.text, row.text)
    }
  })

  if (adoption) {
    const proofs = events.filter(
      (event) => event.event === 'artifact-proof' && event.epoch === passed.epoch,
    )

    if (customAdoption) {
      assert.deepEqual(
        proofs.map((event) => event.phase),
        ['hydrated', 'presented'],
      )

      const [initial, presented] = proofs

      assert.ok(
        initial.coldLiveParity &&
          initial.nativeIdentityRetained &&
          initial.masonIdentityRetained,
      )

      assert.equal(initial.logicalNodes, packetTree.nodes.length)
      assert.equal(
        initial.initialClaims + (initial.replacedClaims ?? 0),
        expectedTree.nodes.length,
      )
      assert.equal(initial.factoryCalls, expectedTree.nodes.length)
      assert.equal(presented.visualNodes, expectedTree.nodes.length)
      assert.equal(presented.viewportChildren, 1)

      assert.ok(
        proofs.every(
          (event) =>
            event.runtimeStarted && event.runtimeLibraryLoaded && event.runtimeStarts === 1,
        ),
      )
    } else {
      assert.deepEqual(
        proofs.map((event) => event.phase),
        ['hydrated', 'reordered-added', 'removed', 'recreated', 'disposed'],
      )

      const [initial, added, removed, recreated, cleanup] = proofs

      assert.ok(
        initial.coldLiveParity && initial.ordinaryInitialParity &&
          initial.nativeIdentityRetained &&
          initial.masonIdentityRetained &&
          initial.prepareAbortMutationFree,
      )

      assert.equal(initial.logicalNodes, packetTree.nodes.length)
      assert.equal(initial.initialClaims, expectedTree.nodes.length)
      assert.equal(initial.factoryCalls, expectedTree.nodes.length)
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
        assert.ok(proof.transitions.every((row) => ['native', 'mason', 'handle'].every((key) => typeof row.retained[key] === 'boolean')))
    }
    assert.equal(added.transitions.find((row) => row.label === 'One').retained.native, true)
    assert.equal(added.transitions.find((row) => row.label === 'Two').retained.native, false)
    assert.notEqual(initial.children[1].owner, recreated.children[1].owner)
    assert.notEqual(initial.children[1].native, recreated.children[1].native)
    assert.equal(added.factoryCalls, expectedTree.nodes.length + 1)
    assert.equal(removed.factoryCalls, expectedTree.nodes.length + 1)
    assert.equal(recreated.factoryCalls, expectedTree.nodes.length + 2)
    assert.ok(
      added.adoptedOwnersRetained &&
        added.ordinaryCreation &&
        removed.removedOwnerReleased &&
        recreated.removedKeyCreatedOrdinarily,
    )

    assert.ok(
      cleanup.nativeHandlesCleared &&
        cleanup.contextsCleared &&
        cleanup.logicalParentsCleared &&
        cleanup.claimPhase === 'retired',
    )

    assert.ok(
      proofs.every(
        (event) => event.runtimeStarted && event.runtimeLibraryLoaded && event.runtimeStarts === 1,
      ),
    )

    assert.ok(
      teardown.runtimeStarted && teardown.runtimeLibraryLoaded && teardown.runtimeStarts === 1,
    )
    }
  }

  writeFileSync(
    join(report, 'status.json'),
    JSON.stringify(
      {
        passed: true,
        physical,
        visualNodes: passed.visualNodes,
        logicalNodes: passed.logicalNodes,
        hydrationQualified: adoption,
        presentationQualified: false,
      },
      null,
      2,
    ),
  )

  console.log(JSON.stringify({ report, passed: true, visualNodes: passed.visualNodes }, null, 2))
} catch (error) {
  writeFileSync(
    join(report, 'status.json'),
    JSON.stringify({ passed: false, error: String(error) }, null, 2),
  )

  throw error
} finally {
  if (installed) {
    const pid = device(['shell', 'pidof', build.id], false).stdout.trim()

    if (/^\d+$/.test(pid)) {
      const logs = device(['logcat', '-d', '-t', '200', '--pid=' + pid], false)

      writeFileSync(join(report, 'logcat.txt'), logs.stdout + logs.stderr)
    }

    if (!keepDevice) device(['shell', 'am', 'force-stop', build.id], false)
  }
}
