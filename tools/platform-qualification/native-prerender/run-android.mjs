import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { closeSync, mkdirSync, mkdtempSync, openSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { completedHomeEpoch } from './home-events.mjs'

// Own android:elegant-fir-probe + resident_devices for the entire run/cleanup.
const work = process.env.XPLAT_PRERENDER_ANDROID_BUILD
if (!work) throw new Error('Set XPLAT_PRERENDER_ANDROID_BUILD to the printed build directory')
const build = JSON.parse(readFileSync(join(resolve(work), 'build.json'), 'utf8'))
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const driverInputs = Object.fromEntries(
  [import.meta.filename, join(import.meta.dirname, 'home-events.mjs')].map((path) => [
    path,
    hash(path),
  ]),
)
const driverHash = createHash('sha256').update(JSON.stringify(driverInputs)).digest('hex')
const check = (value, message) => {
  if (!value) throw new Error(message)
}
check(
  build.id ===
    (build.home
      ? 'org.octanexplat.prerenderhome.android'
      : 'org.octanexplat.prerenderbootstrap.android'),
  'Unexpected bootstrap app identity',
)
check(hash(build.apk) === build.apkHash, 'APK changed since build')
for (const [path, input] of Object.entries(build.sourceHashes))
  check(
    hash(path) === input.sha256 && hash(input.copy) === input.sha256,
    'Build source changed: ' + path,
  )
for (const input of Object.values(build.inputs))
  check(hash(input.copy) === input.sha256, 'Pinned SDK input changed: ' + input.copy)
for (const [path, digest] of Object.entries(build.generatedHashes))
  check(hash(path) === digest, 'Generated input changed: ' + path)
const adb = join(build.sdk, 'platform-tools/adb')
const emulator = join(build.sdk, 'emulator/emulator')
const serial = 'emulator-5566',
  avd = 'elegant-fir-probe'
let interruption,
  cleaning = false
const commands = new Set()
const onSignal = (signal) => {
  interruption ??= new Error('Android probe interrupted: ' + signal)
  if (!cleaning) for (const child of commands) child.kill('SIGTERM')
}
process.on('SIGINT', onSignal)
process.on('SIGTERM', onSignal)
const pause = (ms) => new Promise((done) => setTimeout(done, ms))
function call(program, args, timeout = 30000, required = true) {
  if (interruption && !cleaning) return Promise.reject(interruption)
  return new Promise((done, reject) => {
    const child = execFile(
      program,
      args,
      { encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024 },
      (error, stdout, stderr) => {
        commands.delete(child)
        if (interruption && !cleaning) return reject(interruption)
        if (error && required)
          return reject(
            new Error(program + ' ' + args.join(' ') + ': ' + error.message + '\n' + stderr),
          )
        done({ status: error ? error.code : 0, output: stdout.trim(), error: stderr })
      },
    )
    commands.add(child)
  })
}
const device = (args, timeout = 30000, required = true) =>
  call(adb, ['-s', serial, ...args], timeout, required)
const devices = await call(adb, ['devices'])
check(
  !devices.output.split('\n').some((line) => line.startsWith('emulator-')),
  'Another Android emulator is present; cannot start a second',
)
check(
  (await call(emulator, ['-list-avds'])).output.split(/\r?\n/).includes(avd),
  'Required existing AVD is missing',
)
const reports = join(homedir(), 'dev/reports/octane-xplat/native-prerender-android-bootstrap')
mkdirSync(reports, { recursive: true })
const report = mkdtempSync(join(reports, 'run-'))
writeFileSync(join(report, 'build.json'), JSON.stringify(build, null, 2))
writeFileSync(join(report, 'status.json'), JSON.stringify({ passed: false, state: 'running' }))
let child,
  childError,
  installed = false,
  uid,
  identityConfirmed = false,
  failed = false,
  failure
try {
  const descriptor = openSync(join(report, 'emulator.log'), 'w')
  child = spawn(
    emulator,
    [
      '-avd',
      avd,
      '-port',
      '5566',
      '-no-window',
      '-no-audio',
      '-no-snapshot-load',
      '-no-snapshot-save',
      '-no-boot-anim',
      '-gpu',
      'swiftshader_indirect',
    ],
    { stdio: ['ignore', descriptor, descriptor] },
  )
  closeSync(descriptor)
  child.on('error', (error) => {
    childError = error
  })
  const alive = () => {
    if (childError) throw childError
    check(child.exitCode === null && child.signalCode === null, 'Owned emulator exited')
    if (interruption) throw interruption
  }
  const bootDeadline = Date.now() + 180000
  while (true) {
    alive()
    const boot = await device(['shell', 'getprop', 'sys.boot_completed'], 5000, false)
    alive()
    if (boot.output === '1') break
    check(Date.now() < bootDeadline, 'Owned emulator boot timed out')
    await pause(1000)
  }
  const identity = (await device(['emu', 'avd', 'name'])).output
  writeFileSync(
    join(report, 'device-identity.json'),
    JSON.stringify({ serial, avd, consoleReply: identity }),
  )
  check(identity.split(/\r?\n/)[0].trim() === avd, 'Wrong booted AVD: ' + JSON.stringify(identity))
  identityConfirmed = true
  check(
    (await device(['shell', 'getprop', 'ro.build.version.sdk'])).output === '35',
    'Unexpected Android API',
  )
  await device(['install', '-r', build.apk], 120000)
  installed = true
  uid = Number(
    (await device(['shell', 'pm', 'list', 'packages', '-U', build.id])).output.match(
      /uid:(\d+)/,
    )?.[1],
  )
  check(Number.isSafeInteger(uid) && uid >= 10000, 'Missing app UID')
  await device(['shell', 'am', 'force-stop', build.id])
  await device([
    'shell',
    'run-as',
    build.id,
    'rm',
    '-f',
    'files/probe-result.json',
    'files/lifecycle-result.json',
  ])
  const launch = await device([
    'shell',
    'am',
    'start',
    '-W',
    '-n',
    build.id +
      '/org.octanexplat.prerenderandroid.' +
      (build.home ? 'HomeActivity' : 'ProbeActivity'),
    '--ez',
    'xplat-recreate',
    'true',
  ])
  writeFileSync(join(report, 'launch.txt'), launch.output)
  const deadline = Date.now() + 45000
  let events = []
  while (Date.now() < deadline) {
    alive()
    const receipt = await device(
      ['shell', 'run-as', build.id, 'cat', 'files/probe-result.json'],
      5000,
      false,
    )
    if (receipt.status === 0) {
      events = JSON.parse(receipt.output)
      writeFileSync(join(report, 'result.json'), JSON.stringify(events, null, 2))
      const homeFailure = events.find(
        (event) => event.event === 'home-proof' && event.phase === 'failed',
      )
      check(!homeFailure, 'Home adoption failed: ' + homeFailure?.error)
      check(
        !events.some((event) => ['failed', 'native-layout-timeout'].includes(event.event)),
        'Native bootstrap failed',
      )
      const wrapperFailure = events.find(
        (event) => event.event === 'wrapper-proof' && event.phase === 'failed',
      )
      check(!wrapperFailure, 'Wrapper control failed: ' + wrapperFailure?.error)
      if (build.home) {
        const ready = completedHomeEpoch(events, Boolean(build.home.parity))
        const request = events.find((event) => event.event === 'recreation-requested')
        if (ready !== undefined && (!build.home.recreate || (request && ready > request.epoch)))
          break
      }
      const request = events.find((event) => event.event === 'recreation-requested')
      if (
        !build.home &&
        request &&
        events.some(
          (event) => event.event === 'passed' && event.warmActivity && event.epoch > request.epoch,
        )
      )
        break
    }
    await pause(250)
  }
  const completedEpoch = build.home
    ? completedHomeEpoch(events, Boolean(build.home.parity))
    : undefined
  const begin = events.find((event) => event.event === 'engine-init-begin')
  const native = events.find(
    (event) => event.event === 'native-layout-before-runtime' && event.epoch === begin?.epoch,
  )
  const end = events.find((event) => event.event === 'engine-init-end')
  const success = events.find((event) => event.event === 'passed' && event.epoch === begin?.epoch)
  if (build.home) {
    const decoded = events.find(
      (event) => event.event === 'native-home-decoded' && event.epoch === begin?.epoch,
    )
    const mounted = events.find(
      (event) => event.event === 'native-home-mounted' && event.epoch === begin?.epoch,
    )
    check(
      [decoded, mounted, native].every(
        (event) => event && event.runtimeStarted === false && event.runtimeLibraryLoaded === false,
      ),
      'Actual Home was not decoded/mounted/laid out before the runtime/library',
    )
    check(
      native.homeVisualNodes === 19 &&
        native.width === native.availableWidth &&
        native.height === native.availableHeight &&
        native.width > 0 &&
        native.height > 0 &&
        native.draws > 0 &&
        native.windowFocused &&
        native.nodes?.length === 19 &&
        native.nodes.every((node) => node.attached && node.width > 0 && node.height > 0),
      'Actual Home native geometry missing',
    )
    const expected = JSON.parse(readFileSync(join(resolve(work), 'producer/resolved.json')))
    check(
      native.nodes.every(
        (node, index) =>
          node.index === index &&
          node.kind === expected.nodes[index].kind &&
          node.parent === (expected.nodes[index].parent ?? -1) &&
          (node.kind !== 'label' || node.text === expected.nodes[index].text),
      ),
      'Decoded Home native projection differs from producer',
    )
    check(
      end?.runtimeStarted === true &&
        success?.runtimeStarts === 1 &&
        events.filter((event) => event.event === 'engine-init-begin').length === 1 &&
        success.rootWindowAttachments === 1 &&
        success.rootWindowDetachments === 0 &&
        success.nativeHomeMountQualified &&
        success.nativeIdentityRetained &&
        success.masonNodeIdentityRetained &&
        success.rustNodeHandlesRetained &&
        success.homeHydrationQualified === false &&
        success.presentationQualified === false,
      'Home native/runtime identity proof missing',
    )
    const currentPass = events.find(
      (event) => event.event === 'passed' && event.epoch === completedEpoch,
    )
    check(
      currentPass &&
        currentPass.nativeIdentityRetained &&
        currentPass.masonNodeIdentityRetained &&
        currentPass.rustNodeHandlesRetained &&
        currentPass.rootWindowAttachments === 1 &&
        currentPass.rootWindowDetachments === 0 &&
        currentPass.width > 0 &&
        currentPass.height > 0 &&
        currentPass.draws > 0 &&
        currentPass.windowFocused &&
        currentPass.width === currentPass.availableWidth &&
        currentPass.height === currentPass.availableHeight,
      'Current Home native identity, viewport or window attachment differs',
    )
    if (build.home.adopt) {
      check(completedEpoch !== undefined, 'No complete live Home Activity generation')
      for (const epoch of new Set([begin.epoch, completedEpoch])) {
        const proof = events.find(
          (event) =>
            event.event === 'home-proof' && event.phase === 'adopted' && event.epoch === epoch,
        )
        check(
          proof &&
            proof.visualOwners === 19 &&
            proof.logicalNodesMatched === 27 &&
            proof.hookCalls === 19 &&
            proof.prepareAbortMutationFree &&
            proof.identitiesRetained &&
            proof.logicalChildOrder &&
            proof.contextsEstablished &&
            proof.loaded &&
            proof.applicationHandoff === false &&
            proof.styleParityQualified === false,
          'Actual Home Octane wrapper adoption proof missing',
        )
      }
    }
    if (build.home.recreate) {
      const request = events.find((event) => event.event === 'recreation-requested')
      check(
        request &&
          completedEpoch > request.epoch &&
          currentPass.warmActivity &&
          currentPass.runtimeStarts === 1 &&
          events.some(
            (event) => event.event === 'activity-destroyed' && event.epoch === request.epoch,
          ) &&
          events.some(
            (event) =>
              event.event === 'home-proof' &&
              event.phase === 'parity-cancelled' &&
              event.epoch === request.epoch,
          ),
        'Requested recreation did not cancel the retired lease and complete a warm live generation',
      )
    }
    if (build.home.parity) {
      check(
        currentPass.screenLeft === native.screenLeft &&
          currentPass.screenTop === native.screenTop &&
          currentPass.width === native.width &&
          currentPass.height === native.height,
        'Fixed-environment Home viewport moved or resized between cold and current Activity',
      )
      const proof = events.find(
        (event) =>
          event.event === 'home-proof' &&
          event.phase === 'parity' &&
          event.epoch === completedEpoch,
      )
      check(
        proof &&
          proof.referenceVisualNodes === 19 &&
          proof.ordinaryObjectsDistinct &&
          proof.preRuntimeCompared === 19 &&
          proof.baselineCompared === 19 &&
          proof.initialCompared === 19 &&
          proof.removedCompared === 19 &&
          proof.restoredCompared === 19 &&
          proof.referenceDisposed &&
          proof.hookCalls === 19,
        'Independent Home reference/style-removal proof missing',
      )
    }
    if (build.home.input) {
      const inputProofs = []
      for (const [index, count, status] of [
        [12, '4', 'One more step completed.'],
        [15, '3', 'Ready when you are.'],
      ]) {
        const target = currentPass.nodes[index]
        let x = currentPass.screenLeft + target.width / 2,
          y = currentPass.screenTop + target.height / 2
        for (let node = target; node; node = currentPass.nodes[node.parent]) {
          x += node.left
          y += node.top
        }
        check(Number.isFinite(x) && Number.isFinite(y), 'Home tap coordinates missing')
        await device(['shell', 'input', 'tap', String(Math.round(x)), String(Math.round(y))])
        let observed
        const inputDeadline = Date.now() + 5000
        while (Date.now() < inputDeadline) {
          alive()
          const receipt = await device([
            'shell',
            'run-as',
            build.id,
            'cat',
            'files/probe-result.json',
          ])
          events = JSON.parse(receipt.output)
          writeFileSync(join(report, 'result.json'), JSON.stringify(events, null, 2))
          check(
            completedHomeEpoch(events, true) === completedEpoch &&
              !events.some((event) => event.event === 'failed'),
            'Home input lost its accepted Activity or failed native identity checks',
          )
          observed = events.find(
            (event) =>
              event.event === 'home-input' &&
              event.epoch === completedEpoch &&
              event.touchUps === inputProofs.length + 1,
          )
          if (observed) break
          await pause(100)
        }
        check(
          observed?.handled &&
            observed.identitiesRetained &&
            observed.touchDowns === inputProofs.length + 1 &&
            Math.abs(observed.x - x) <= 1 &&
            Math.abs(observed.y - y) <= 1 &&
            observed.nodes?.length === 19 &&
            observed.nodes[9].text === count &&
            observed.nodes[18].text === status &&
            observed.nodes.every(
              (node, position) =>
                node.attached &&
                node.width > 0 &&
                node.height > 0 &&
                (![9, 18].includes(position)
                  ? node.text === currentPass.nodes[position].text
                  : true),
            ),
          'Android OS tap did not update retained Home count/status: ' + JSON.stringify(observed),
        )
        inputProofs.push({ target: index, x, y, count, status, observation: observed })
      }
      writeFileSync(
        join(report, 'home-input.json'),
        JSON.stringify(
          {
            epoch: completedEpoch,
            source: 'adb shell input tap',
            inputProofs,
            presentationQualified: false,
          },
          null,
          2,
        ),
      )
    }
  } else {
    check(
      native &&
        native.runtimeStarted === false &&
        native.runtimeLibraryLoaded === false &&
        native.firstWidth > 0 &&
        native.firstHeight > 0 &&
        native.children === 2 &&
        native.firstText === 'Native home screen',
      'Native pre-runtime layout not established',
    )
    check(end?.runtimeStarted === true, 'Deferred runtime initialization not established')
    const request = events.find((event) => event.event === 'recreation-requested')
    const rebound = events.find(
      (event) => event.event === 'passed' && event.warmActivity && event.epoch > request?.epoch,
    )
    check(
      request &&
        rebound &&
        rebound.activeBridgeEpoch === rebound.epoch &&
        rebound.firstWidth > 0 &&
        events.some(
          (event) =>
            event.event === 'bridge-detached' &&
            event.epoch === request.epoch &&
            event.activeBridgeEpoch === 0,
        ) &&
        events.filter((event) => event.event === 'engine-init-begin').length === 1 &&
        rebound.runtimeStarts === 1,
      'Activity recreation did not release/rebind the controller with one runtime',
    )
    check(
      events
        .filter((event) => event.event === 'passed')
        .every(
          (event) =>
            event.nativeIdentityRetained &&
            event.masonNodeIdentityRetained &&
            event.rustNodeHandlesRetained &&
            event.activeBridgeEpoch === event.epoch,
        ),
      'Per-activity native identity or controller ownership differs',
    )
    check(
      success?.nativeIdentityRetained &&
        success.masonNodeIdentityRetained &&
        success.rustNodeHandlesRetained &&
        success.bridgeUpdateQualified &&
        success.firstText === 'Updated through NativeScript bridge',
      'Post-boot native identity/update proof missing',
    )
    if (build.labelWrappers) {
      for (const epoch of [begin.epoch, rebound.epoch])
        check(
          events.some(
            (event) =>
              event.event === 'wrapper-proof' &&
              event.epoch === epoch &&
              event.phase === 'adopted' &&
              event.realLabelWrappers === 2 &&
              event.identitiesRetained &&
              event.contextsEstablished &&
              event.loaded &&
              (!build.masonParent ||
                (event.logicalMasonParent &&
                  event.matchedAttachmentOnly === Boolean(build.masonAdopt) &&
                  event.mutationsVerified &&
                  event.adoptionPhysicalAttachments === 0)),
          ),
          'Real Label wrapper adoption missing',
        )
      check(
        events.some(
          (event) =>
            event.event === 'wrapper-proof' &&
            event.epoch === request.epoch &&
            event.phase === 'disposed' &&
            event.releasedWrappers === 2,
        ),
        'Old Activity Label wrappers not disposed',
      )
      check(
        native.firstHeight === rebound.firstHeight,
        'Fixed-font single-line height changed during wrapper setup',
      )
      check(
        events.some(
          (event) =>
            event.epoch === begin.epoch &&
            event.firstText === 'Updated through NativeScript bridge' &&
            event.firstWidth > native.firstWidth &&
            event.firstWidth === rebound.firstWidth &&
            event.firstHeight === native.firstHeight,
        ),
        'Wrapper text update did not remeasure the cold native tree like the fresh tree',
      )
    }
    if (build.applicationHandoff) {
      check(
        [success, rebound].every(
          (event) => event.rootWindowAttachments === 1 && event.rootWindowDetachments === 0,
        ),
        'Core handoff detached/re-attached the original native window root',
      )
      const applicationProofs = [begin.epoch, rebound.epoch].map((epoch) =>
        events.find(
          (event) =>
            event.event === 'wrapper-proof' &&
            event.phase === 'application' &&
            event.epoch === epoch,
        ),
      )
      for (const proof of applicationProofs) {
        check(
          proof &&
            proof.state === 'attached' &&
            proof.active &&
            proof.foregroundActivity &&
            proof.sameRoot &&
            proof.registrySize === 1 &&
            proof.lifecycle.ready === 1 &&
            proof.lifecycle.opened === 1,
          'Core Application/window root handoff missing',
        )
        check(
          events.some(
            (event) => event.event === 'native-content-adopted' && event.epoch === proof.epoch,
          ),
          'Core content pipeline did not adopt the installed native root',
        )
      }
      const [cold, warm] = applicationProofs
      check(
        cold.catchUp && !warm.catchUp && cold.windowId === warm.windowId,
        'Cold catch-up or recreated window session identity differs',
      )
      if (build.applicationEntry) {
        check(
          cold.normalEntry &&
            warm.normalEntry &&
            cold.entryCounts.factories === 1 &&
            warm.entryCounts.factories === 1 &&
            cold.entryCounts.launches === 1 &&
            warm.entryCounts.launches === 1 &&
            !cold.reusingOwners &&
            warm.reusingOwners &&
            JSON.stringify(cold.ownerIds) === JSON.stringify(warm.ownerIds),
          'Normal main entry/launch or saved live owner restoration differs',
        )
        check(
          events.some(
            (event) =>
              event.event === 'wrapper-proof' &&
              event.phase === 'disposed' &&
              event.epoch === request.epoch &&
              event.ownersRetained &&
              event.claimsRetired,
          ),
          'Activity-scoped native claims were not retired before owner restoration',
        )
      }
      check(
        cold.lifecycle.created === 1 &&
          cold.lifecycle.attached === 1 &&
          cold.lifecycle.started === 1 &&
          cold.lifecycle.resumed === 1 &&
          warm.lifecycle.created >= 2 &&
          warm.lifecycle.attached === warm.lifecycle.created &&
          warm.lifecycle.started === warm.lifecycle.created &&
          warm.lifecycle.resumed === warm.lifecycle.created &&
          warm.lifecycle.detached === warm.lifecycle.created - 1 &&
          warm.lifecycle.destroyed === warm.lifecycle.created - 1,
        'Core Activity lifecycle delivery duplicated or missed events',
      )
    }
  }
  const phases = [
    ...(build.home ? ['native-home-decoded', 'native-home-mounted'] : []),
    'native-layout-before-runtime',
    'engine-init-begin',
    'engine-init-end',
    'passed',
  ].map((name) => events.findIndex((event) => event.event === name && event.epoch === begin?.epoch))
  check(
    phases.every(
      (index, position) => index >= 0 && (position === 0 || index > phases[position - 1]),
    ),
    'Native/runtime event order differs',
  )
  check(
    Object.entries(driverInputs).every(([path, digest]) => hash(path) === digest) &&
      hash(build.apk) === build.apkHash,
    'Driver or APK changed during execution',
  )
  writeFileSync(
    join(report, 'status.json'),
    JSON.stringify({ passed: true, driverHash, driverInputs, avd, api: 35, scope: build.scope }),
  )
  console.log(JSON.stringify({ report, passed: true, scope: build.scope }, null, 2))
} catch (error) {
  failed = true
  failure = String(error)
  writeFileSync(
    join(report, 'status.json'),
    JSON.stringify({ passed: false, error: String(error), driverHash, driverInputs }),
  )
  throw error
} finally {
  cleaning = true
  const errors = []
  try {
    if (installed && identityConfirmed) {
      if (uid) {
        const logs = await device(['logcat', '-d', '--uid=' + uid], 10000, false)
        writeFileSync(join(report, 'app-logcat.txt'), logs.output)
      }
      const receipt = await device(
        ['shell', 'run-as', build.id, 'cat', 'files/probe-result.json'],
        5000,
        false,
      )
      if (receipt.status === 0) writeFileSync(join(report, 'native-result.json'), receipt.output)
      const lifecycle = await device(
        ['shell', 'run-as', build.id, 'cat', 'files/lifecycle-result.json'],
        5000,
        false,
      )
      if (lifecycle.status === 0)
        writeFileSync(join(report, 'lifecycle-result.json'), lifecycle.output)
      await device(['shell', 'am', 'force-stop', build.id], 10000, false)
    }
  } catch (error) {
    errors.push('App diagnostic cleanup: ' + String(error))
  }
  if (child?.pid && child.exitCode === null && child.signalCode === null) {
    if (identityConfirmed) await device(['emu', 'kill'], 10000, false)
    const deadline = Date.now() + (identityConfirmed ? 15000 : 0)
    while (child.exitCode === null && child.signalCode === null && Date.now() < deadline)
      await pause(100)
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM')
      const stopDeadline = Date.now() + 5000
      while (child.exitCode === null && child.signalCode === null && Date.now() < stopDeadline)
        await pause(100)
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL')
        const killDeadline = Date.now() + 3000
        while (child.exitCode === null && child.signalCode === null && Date.now() < killDeadline)
          await pause(100)
        errors.push('Owned emulator required forced termination')
      }
    }
  }
  process.off('SIGINT', onSignal)
  process.off('SIGTERM', onSignal)
  if (errors.length) {
    writeFileSync(join(report, 'cleanup-errors.json'), JSON.stringify(errors))
    writeFileSync(
      join(report, 'status.json'),
      JSON.stringify({
        passed: false,
        error: failure,
        driverHash,
        driverInputs,
        cleanupErrors: errors,
      }),
    )
    if (!failed) throw new Error(errors.join('; '))
  }
}
