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
async function captureHeap() {
  // am opens its output as shell before handing the descriptor to the app.
  const file =
    '/data/local/tmp/xplat-home-' + driverHash.slice(0, 12) + '-' + process.pid + '.hprof'
  try {
    await device(['shell', 'am', 'dumpheap', build.id, file], 60000)
    await device(['pull', file, join(report, 'retired-home.hprof')], 60000)
  } finally {
    await device(['shell', 'rm', '-f', file], 30000, false)
  }
}
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
  const deadline = Date.now() + 45000 + Math.max(0, (build.home?.recreateCount ?? 1) - 1) * 5000
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
      if (
        homeFailure &&
        build.home?.lifetime &&
        process.env.XPLAT_PRERENDER_ANDROID_DUMP_HEAP === '1'
      ) {
        try {
          await captureHeap()
        } catch (error) {
          writeFileSync(join(report, 'heap-capture-error.txt'), String(error))
        }
      }
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
        if (
          build.home.fallback &&
          events.some(
            (event) =>
              event.event === 'fallback-layout' &&
              (!['seed', 'attach'].includes(build.home.fallback) ||
                events.some(
                  (disposed) =>
                    disposed.phase ===
                      (build.home.fallback === 'seed'
                        ? 'unmatched-disposed'
                        : 'failed-adoption-disposed') && disposed.epoch === event.epoch,
                )),
          )
        )
          break
        const ready = completedHomeEpoch(events, Boolean(build.home.parity))
        const request = events.find((event) => event.event === 'recreation-requested')
        if (
          ready !== undefined &&
          (!build.home.recreate || (request && ready > request.epoch)) &&
          (!build.home.lifetime ||
            events.some((event) => event.phase === 'retired-lifetime' && event.epoch === ready))
        )
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
  if (build.home?.fallback) {
    const rejected = events.find(
      (event) =>
        event.event ===
          (build.home.fallback === 'font-scale' ? 'environment-rejected-native' : 'ir-rejected') &&
        event.epoch === begin?.epoch,
    )
    const fallback = events.find(
      (event) =>
        event.event === 'fallback-layout' &&
        !events.some(
          (later) =>
            later.epoch > event.epoch ||
            (later.epoch === event.epoch && later.event === 'activity-destroyed'),
        ),
    )
    const application = events.find(
      (event) => event.phase === 'application' && event.epoch === fallback?.epoch,
    )
    const ordinary = events.find(
      (event) => event.phase === 'ordinary-fallback' && event.epoch === fallback?.epoch,
    )
    const expected = JSON.parse(readFileSync(join(resolve(work), 'producer/resolved.json')))
    if (['build', 'font-scale'].includes(build.home.fallback))
      check(
        rejected &&
          (build.home.fallback === 'build'
            ? rejected.reason.includes('build mismatch')
            : rejected.reason.includes('fontScale1') &&
              Math.abs(rejected.fontScale - 1.3) < 0.0001 &&
              Number.isFinite(rejected.density) &&
              rejected.density > 0 &&
              events.some(
                (event) => event.event === 'native-home-decoded' && event.epoch === begin.epoch,
              )) &&
          rejected.homeAllocationStarted === false &&
          rejected.runtimeStarted === false &&
          rejected.runtimeLibraryLoaded === false &&
          events.indexOf(rejected) < events.indexOf(begin) &&
          end?.runtimeStarted &&
          events.filter((event) => event.event === 'engine-init-begin').length === 1 &&
          !events.some(
            (event) =>
              (build.home.fallback === 'build' && event.event === 'native-home-decoded') ||
              event.event === 'native-home-mounted' ||
              event.phase === 'adopted',
          ),
        'IR or environment preflight did not reject before native Home allocation and the only VM start',
      )
    else if (build.home.fallback === 'seed') {
      const denied = events.find(
        (event) => event.phase === 'plan-rejected' && event.epoch === fallback?.epoch,
      )
      const discarded = events.find(
        (event) => event.event === 'native-home-discarded' && event.epoch === fallback?.epoch,
      )
      const disposed = events.find(
        (event) => event.phase === 'unmatched-disposed' && event.epoch === fallback?.epoch,
      )
      check(
        native &&
          native.runtimeStarted === false &&
          native.runtimeLibraryLoaded === false &&
          native.nodes?.length === 19 &&
          native.nodes[9].text === String(expected.seed.initialCompleted) &&
          native.nodes.every((node) => node.attached && node.width > 0 && node.height > 0) &&
          end?.runtimeStarted &&
          events.filter((event) => event.event === 'engine-init-begin').length === 1 &&
          denied?.hookCalls === 0 &&
          denied.preparedAborted &&
          denied.wrappersUnattached &&
          discarded?.visualNodes === 19 &&
          discarded.nativeChildren === 0 &&
          discarded.masonChildren === 0 &&
          disposed?.hookCalls === 0 &&
          !events.some((event) => event.phase === 'adopted') &&
          events.indexOf(denied) < events.indexOf(discarded) &&
          events.indexOf(discarded) < events.indexOf(ordinary),
        'Live Home seed mismatch did not abort before claims and discard its unused native tree',
      )
    } else if (build.home.fallback === 'theme') {
      const denied = events.find(
        (event) => event.phase === 'environment-rejected' && event.epoch === fallback?.epoch,
      )
      const discarded = events.find(
        (event) => event.event === 'native-home-discarded' && event.epoch === fallback?.epoch,
      )
      check(
        native &&
          native.runtimeStarted === false &&
          native.runtimeLibraryLoaded === false &&
          native.nodes?.length === 19 &&
          native.nodes.every((node) => node.attached && node.width > 0 && node.height > 0) &&
          end?.runtimeStarted &&
          events.filter((event) => event.event === 'engine-init-begin').length === 1 &&
          denied?.reason === 'theme' &&
          denied.nativeTheme === native.theme &&
          denied.nativeTheme !== denied.liveTheme &&
          ordinary?.liveTheme === denied.liveTheme &&
          denied.hookCalls === 0 &&
          denied.wrappersAllocated === 0 &&
          denied.preparedPlanCreated === false &&
          discarded?.visualNodes === 19 &&
          discarded.nativeChildren === 0 &&
          discarded.masonChildren === 0 &&
          events.indexOf(denied) < events.indexOf(discarded) &&
          events.indexOf(discarded) < events.indexOf(ordinary) &&
          !events.some((event) => event.phase === 'adopted'),
        'Stale native Home theme was not rejected before wrapper creation and recovered with the live theme',
      )
    } else {
      const failed = events.find(
        (event) => event.phase === 'claim-failure' && event.epoch === fallback?.epoch,
      )
      const discarded = events.find(
        (event) => event.event === 'native-home-discarded' && event.epoch === fallback?.epoch,
      )
      const disposed = events.find(
        (event) => event.phase === 'failed-adoption-disposed' && event.epoch === fallback?.epoch,
      )
      check(
        native &&
          native.runtimeStarted === false &&
          native.runtimeLibraryLoaded === false &&
          native.nodes?.length === 19 &&
          native.nodes[9].text === String(expected.seed.initialCompleted) &&
          end?.runtimeStarted &&
          events.filter((event) => event.event === 'engine-init-begin').length === 1 &&
          failed?.injectedFailureObserved &&
          failed.hookCalls === 19 &&
          failed.attachmentCalls === 17 &&
          failed.setupWrappers > 0 &&
          disposed?.releasedWrappers === 19 &&
          disposed.hookCalls === 19 &&
          disposed.contextsCleared &&
          disposed.handlesCleared &&
          disposed.parentsCleared &&
          discarded?.visualNodes === 19 &&
          discarded.nativeChildren === 0 &&
          discarded.masonChildren === 0 &&
          !events.some((event) => event.phase === 'adopted') &&
          events.indexOf(failed) < events.indexOf(discarded) &&
          events.indexOf(discarded) < events.indexOf(disposed) &&
          events.indexOf(disposed) < events.indexOf(ordinary),
        'Partial native attachment failure did not release claimed owners before ordinary recovery',
      )
    }
    check(
      fallback?.ordinaryRender &&
        fallback.adoptionClaims === 0 &&
        ordinary?.adoptionFactoryInstalled === false &&
        fallback.nodes?.length === 19 &&
        fallback.nodes.every(
          (node, index) =>
            node.attached &&
            node.width > 0 &&
            node.height > 0 &&
            node.index === index &&
            node.parent === (expected.nodes[index].parent ?? -1) &&
            node.kind === expected.nodes[index].kind &&
            (node.kind !== 'label' ||
              node.text ===
                (build.home.fallback === 'seed' && index === 9
                  ? String(expected.seed.initialCompleted + 1)
                  : expected.nodes[index].text)),
        ) &&
        application?.registrySize === 1 &&
        application.sameRoot &&
        application.lifecycle.ready === 1 &&
        application.lifecycle.opened === 1,
      'Ordinary fallback Home native tree or Core window proof missing',
    )
  } else if (build.home) {
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
            proof.applicationHandoff === Boolean(build.home.application) &&
            proof.styleParityQualified === false,
          'Actual Home Octane wrapper adoption proof missing',
        )
      }
    }
    if (build.home.recreate) {
      const requests = events.filter((event) => event.event === 'recreation-requested')
      check(requests.length === build.home.recreateCount, 'Requested Home recreation count differs')
      for (const request of requests) {
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
        check(
          events.some(
            (event) =>
              event.phase === 'claims-retired' &&
              event.epoch === request.epoch &&
              event.releasedWrappers === 19 &&
              event.nativeArraysCleared &&
              event.wrapperHandlesCleared,
          ),
          'Requested Home generation did not retire its own nineteen claim owners',
        )
      }
    }
    if (build.home.application) {
      const initial = events.find(
        (event) =>
          event.event === 'home-proof' &&
          event.phase === 'application' &&
          event.epoch === begin.epoch,
      )
      for (const epoch of new Set([begin.epoch, completedEpoch])) {
        const proof = events.find(
          (event) =>
            event.event === 'home-proof' && event.phase === 'application' && event.epoch === epoch,
        )
        check(
          proof &&
            initial &&
            proof.windowId === initial.windowId &&
            proof.sameRoot &&
            proof.registrySize === 1 &&
            proof.active &&
            proof.foregroundActivity &&
            proof.lifecycle.ready === 1 &&
            proof.lifecycle.opened === 1 &&
            proof.lifecycle.created === proof.lifecycle.destroyed + 1 &&
            proof.lifecycle.attached === proof.lifecycle.created &&
            proof.lifecycle.detached === proof.lifecycle.destroyed &&
            proof.catchUp === (epoch === begin.epoch) &&
            proof.componentStatePreserved === false &&
            proof.normalEntry === Boolean(build.home.entry) &&
            (!build.home.entry ||
              (proof.entryCounts?.factories === 1 &&
                proof.entryCounts?.launches === 1 &&
                proof.entryBeforeCommit === true &&
                events.indexOf(proof) <
                  events.findIndex(
                    (event) => event.phase === 'adopted' && event.epoch === epoch,
                  ))) &&
            events.some(
              (event) => event.event === 'native-content-adopted' && event.epoch === epoch,
            ),
          'Home Core Application/window handoff proof missing',
        )
      }
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
    if (build.home.lifetime) {
      const imageFetcher = events.find(
        (event) => event.event === 'native-image-fetcher-initialized',
      )
      const request = events.find((event) => event.event === 'recreation-requested')
      const retired = events.find(
        (event) => event.phase === 'claims-retired' && event.epoch === request?.epoch,
      )
      const proof = events.find(
        (event) => event.phase === 'retired-lifetime' && event.epoch === completedEpoch,
      )
      check(
        imageFetcher?.context === 'application' &&
          imageFetcher.runtimeStarted === false &&
          imageFetcher.runtimeLibraryLoaded === false &&
          events.indexOf(imageFetcher) < events.indexOf(begin) &&
          retired?.releasedWrappers === 19 &&
          retired.nativeArraysCleared &&
          retired.wrapperHandlesCleared &&
          events.indexOf(retired) < events.indexOf(proof) &&
          proof?.retiredGenerations === build.home.recreateCount &&
          proof.observedViews === 19 * build.home.recreateCount &&
          proof.observedNodes === 19 * build.home.recreateCount &&
          proof.aliveViews.length === 0 &&
          proof.aliveNodes.length === 0 &&
          proof.javaObjectsCollected &&
          proof.nativeLiveNodesReturned &&
          proof.masonStats.liveNodes >= 20 &&
          proof.masonStats.liveNodes <= proof.masonBaseline.liveNodes &&
          proof.masonStats.trackedNodes >= 20 &&
          proof.masonStats.trackedNodes <= proof.masonBaseline.trackedNodes &&
          proof.attempts > 0 &&
          proof.attempts <= 8 &&
          proof.nativeDeallocationQualified === false,
        'Retired Home Java weak-reference collection proof missing',
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
      if (build.home.restore) {
        const readEvents = async () => {
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
            !events.some((event) => event.event === 'failed' || event.phase === 'failed'),
            'Retained Home restoration failed',
          )
        }
        const waitFor = async (predicate) => {
          const deadline = Date.now() + 15000
          while (Date.now() < deadline) {
            await readEvents()
            const observed = events.find(predicate)
            if (observed) return observed
            await pause(100)
          }
          throw new Error('Retained Home restoration receipt timed out')
        }
        const increment = inputProofs[0]
        await device([
          'shell',
          'input',
          'tap',
          String(Math.round(increment.x)),
          String(Math.round(increment.y)),
        ])
        const changed = await waitFor(
          (event) =>
            event.event === 'home-input' && event.epoch === completedEpoch && event.touchUps === 3,
        )
        check(
          changed.handled && changed.nodes[9].text === '4',
          'Home state did not change before recreation',
        )
        const layout = await waitFor(
          (event) => event.event === 'restored-layout' && event.epoch > completedEpoch,
        )
        const retained = events.find(
          (event) => event.phase === 'owners-retained' && event.epoch === completedEpoch,
        )
        const restored = events.find(
          (event) => event.phase === 'owners-restored' && event.epoch === layout.epoch,
        )
        const application = events.find(
          (event) => event.phase === 'application' && event.epoch === layout.epoch,
        )
        const skipped = events.find(
          (event) => event.event === 'warm-owner-restoration' && event.epoch === layout.epoch,
        )
        check(
          retained?.ownerIds.length === 20 &&
            new Set(retained.ownerIds).size === 20 &&
            JSON.stringify(retained.ownerIds) === JSON.stringify(restored?.ownerIds) &&
            retained.count === '4' &&
            retained.nativeHandlesCleared &&
            retained.rootUnmounted === false &&
            restored.count === '4' &&
            restored.hookCalls === 19 &&
            restored.logicalRootRetained &&
            restored.nativeFactoriesRestored &&
            application?.normalEntry &&
            application.componentStatePreserved &&
            application.entryCounts.factories === 1 &&
            application.entryCounts.launches === 1 &&
            application.lifecycle.created === 2 &&
            application.lifecycle.destroyed === 1 &&
            application.registrySize === 1 &&
            skipped?.homeAllocationStarted === false &&
            skipped.runtimeStarted &&
            skipped.runtimeStarts === 1 &&
            !events.some(
              (event) => event.event === 'native-home-decoded' && event.epoch === layout.epoch,
            ) &&
            events.filter((event) => event.event === 'engine-init-begin').length === 1 &&
            layout.nodes.length === 19 &&
            layout.nodes[9].text === '4' &&
            layout.nodes[18].text === 'One more step completed.' &&
            layout.nodes.every((node) => node.attached && node.width > 0 && node.height > 0),
          'Home retained owner/state restoration proof missing',
        )
        const warmInputs = []
        for (const [index, count, status] of [
          [12, '5', 'One more step completed.'],
          [15, '3', 'Ready when you are.'],
        ]) {
          const target = layout.nodes[index]
          const x = target.screenLeft + target.width / 2,
            y = target.screenTop + target.height / 2
          check(Number.isFinite(x) && Number.isFinite(y), 'Restored Home input coordinates missing')
          await device(['shell', 'input', 'tap', String(Math.round(x)), String(Math.round(y))])
          const observed = await waitFor(
            (event) =>
              event.event === 'restored-input' &&
              event.epoch === layout.epoch &&
              event.touchUps === warmInputs.length + 1,
          )
          check(
            observed.handled &&
              observed.touchDowns === warmInputs.length + 1 &&
              Math.abs(observed.x - x) <= 1 &&
              Math.abs(observed.y - y) <= 1 &&
              observed.nodes.length === 19 &&
              observed.nodes[9].text === count &&
              observed.nodes[18].text === status &&
              observed.nodes.every(
                (node, position) =>
                  node.attached &&
                  node.width > 0 &&
                  node.height > 0 &&
                  ([9, 18].includes(position) || node.text === layout.nodes[position].text),
              ),
            'Restored Home OS input did not use retained hook state',
          )
          warmInputs.push({ index, x, y, count, status, observation: observed })
        }
        writeFileSync(
          join(report, 'home-restoration.json'),
          JSON.stringify(
            {
              retained,
              restored,
              application,
              skipped,
              layout,
              warmInputs,
              source: 'adb shell input tap',
              presentationQualified: false,
            },
            null,
            2,
          ),
        )
      }
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
  const phases = (
    build.home?.fallback === 'build'
      ? ['ir-rejected', 'engine-init-begin', 'engine-init-end']
      : build.home?.fallback === 'font-scale'
        ? [
            'native-home-decoded',
            'environment-rejected-native',
            'engine-init-begin',
            'engine-init-end',
          ]
        : build.home?.fallback
          ? [
              'native-home-decoded',
              'native-home-mounted',
              'native-layout-before-runtime',
              'engine-init-begin',
              'engine-init-end',
            ]
          : [
              ...(build.home ? ['native-home-decoded', 'native-home-mounted'] : []),
              'native-layout-before-runtime',
              'engine-init-begin',
              'engine-init-end',
              'passed',
            ]
  ).map((name) => events.findIndex((event) => event.event === name && event.epoch === begin?.epoch))
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
