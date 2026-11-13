import { execFile, spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  closeSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { completedHomeEpoch } from './home-events.mjs'
import { qualifyAndroidStartup } from './qualify-android-startup.mjs'

// Own android:elegant-fir-probe + resident_devices, or device:<explicit serial>.
const work = process.env.XPLAT_PRERENDER_ANDROID_BUILD
if (!work) throw new Error('Set XPLAT_PRERENDER_ANDROID_BUILD to the printed build directory')
const build = JSON.parse(readFileSync(join(resolve(work), 'build.json'), 'utf8'))
let startupPath = process.env.XPLAT_PRERENDER_ANDROID_STARTUP_PATH ?? 'native'
if (
  !['native', 'ordinary'].includes(startupPath) ||
  (startupPath === 'ordinary' && !build.home?.startup)
)
  throw new Error('Ordinary startup path requires the matched release startup fixture')
let scope = build.home?.startup
  ? 'Matched release Home startup control (' +
    startupPath +
    '); no artificial250ms delay or extra abort/parity probe; no repeated-distribution, pixel or physical-performance qualification'
  : build.scope
let receiptAuthority = build.id + '.receipts' + (startupPath === 'ordinary' ? '.ordinary' : '')
const traceEnabled = process.env.XPLAT_PRERENDER_ANDROID_TRACE === '1'
const traceProcessor = process.env.XPLAT_PRERENDER_TRACE_PROCESSOR
if (traceEnabled && !traceProcessor)
  throw new Error(
    'Traced runs require XPLAT_PRERENDER_TRACE_PROCESSOR for the data-source readiness gate',
  )
if (traceEnabled && (!build.home || build.home.fallback))
  throw new Error('FrameTimeline capture requires the native Home mount path')
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const driverInputs = Object.fromEntries(
  [
    import.meta.filename,
    join(import.meta.dirname, 'home-events.mjs'),
    join(import.meta.dirname, 'qualify-android-startup.mjs'),
  ].map((path) => [path, hash(path)]),
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
const physicalSerial = process.env.XPLAT_PRERENDER_ANDROID_DEVICE_SERIAL
const physical = physicalSerial !== undefined
check(
  !physical ||
    (physicalSerial.length > 0 && !physicalSerial.startsWith('emulator-') && build.home?.startup),
  'An explicit physical serial requires the matched Home startup fixture',
)
const serial = physical ? physicalSerial : 'emulator-5566'
const avd = 'elegant-fir-probe'
const deviceKind = physical ? 'physical' : 'emulator'
let deviceIdentity
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
function call(program, args, timeout = 30000, required = true, input) {
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
    if (input !== undefined) {
      child.stdin.on('error', reject)
      child.stdin.end(input)
    }
  })
}
const device = (args, timeout = 30000, required = true, input) =>
  call(adb, ['-s', serial, ...args], timeout, required, input)
async function readReceipt(name, timeout = 5000, required = false) {
  const args =
    build.variant === 'release'
      ? ['shell', 'content', 'read', '--uri', 'content://' + receiptAuthority + '/' + name]
      : ['shell', 'run-as', build.id, 'cat', 'files/' + name]
  const result = await device(args, timeout, false)
  // Android's content CLI can print a provider error while returning exit0.
  if (result.status === 0 && !result.output.startsWith('[')) result.status = 1
  check(
    !required || result.status === 0,
    'Could not read fixture receipt: ' + name + ': ' + result.output + result.error,
  )
  return result
}
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
if (physical)
  check(
    devices.output
      .split(/\r?\n/)
      .some((line) => line.split(/\s+/)[0] === serial && line.split(/\s+/)[1] === 'device'),
    'Explicit physical device is not connected and authorized',
  )
else {
  check(
    !devices.output.split('\n').some((line) => line.startsWith('emulator-')),
    'Another Android emulator is present; cannot start a second',
  )
  check(
    (await call(emulator, ['-list-avds'])).output.split(/\r?\n/).includes(avd),
    'Required existing AVD is missing',
  )
}
const reports = join(homedir(), 'dev/reports/octane-xplat/native-prerender-android-bootstrap')
mkdirSync(reports, { recursive: true })
const sessionReport = mkdtempSync(join(reports, 'run-'))
let report = sessionReport
writeFileSync(join(report, 'build.json'), JSON.stringify(build, null, 2))
writeFileSync(join(report, 'status.json'), JSON.stringify({ passed: false, state: 'running' }))
let child,
  childError,
  installed = false,
  uid,
  identityConfirmed = false,
  failed = false,
  failure
const traceName = 'xplat-home-' + driverHash.slice(0, 12) + '-' + process.pid
const traceRemote = '/data/misc/perfetto-traces/' + traceName + '.pftrace'
let traceTask, traceResult, traceFailure
async function finishTrace() {
  if (!traceTask) return
  const pending = traceTask
  traceTask = undefined
  try {
    // Keep the adb foreground process alive until its bounded capture drains.
    await pending
    writeFileSync(
      join(report, 'trace-command.json'),
      JSON.stringify({ result: traceResult, error: String(traceFailure ?? '') }),
    )
    if (traceFailure) throw traceFailure
    await device(['pull', traceRemote, join(report, 'home.pftrace')])
    check(statSync(join(report, 'home.pftrace')).size > 0, 'Perfetto capture is empty')
  } finally {
    await device(['shell', 'rm', '-f', traceRemote], 5000, false)
  }
}
async function runAttempt(trial, runToken, alive) {
  await device(['shell', 'am', 'force-stop', build.id])
  if (physical) {
    const battery = await device(['shell', 'dumpsys', 'battery'], 5000, false)
    const thermal = await device(['shell', 'dumpsys', 'thermalservice'], 5000, false)
    const value = (text, pattern) => {
      const match = text.match(pattern)
      return match ? Number(match[1]) : null
    }
    writeFileSync(
      join(report, 'device-conditions.json'),
      JSON.stringify(
        {
          batteryLevel: value(battery.output, /^\s*level:\s*(\d+)/m),
          batteryTemperatureTenthsC: value(battery.output, /^\s*temperature:\s*(\d+)/m),
          thermalStatus: value(thermal.output, /Thermal Status:\s*(\d+)/i),
          batteryQuerySucceeded: battery.status === 0,
          thermalQuerySucceeded: thermal.status === 0,
          scope: 'Read-only pre-launch observations; no power, thermal or display settings changed',
        },
        null,
        2,
      ),
    )
  }
  if (build.variant === 'release' && trial.index === 0 && !physical)
    await device(['shell', 'pm', 'clear', build.id])
  else if (build.variant !== 'release')
    await device([
      'shell',
      'run-as',
      build.id,
      'rm',
      '-f',
      'files/probe-result.json',
      'files/lifecycle-result.json',
    ])
  if (traceEnabled) {
    traceResult = undefined
    traceFailure = undefined
    const config = `buffers { size_kb: 32768 fill_policy: RING_BUFFER }
duration_ms: 10000
write_into_file: true
file_write_period_ms: 250
flush_period_ms: 500
data_sources { config { name: "linux.ftrace" ftrace_config {
atrace_categories: "gfx"
atrace_categories: "view"
atrace_categories: "wm"
atrace_apps: "${build.id}"
atrace_apps: "${build.id}:ordinary"
} } }
data_sources { config { name: "linux.process_stats" process_stats_config { scan_all_processes_on_start: true } } }
data_sources { config { name: "android.surfaceflinger.frametimeline" } }
`
    const local = join(report, 'trace-config.pbtxt')
    writeFileSync(local, config)
    // Perfetto's SELinux domain cannot read shell-owned /data/local/tmp files.
    // Pass the owned config over stdin instead of changing device permissions.
    traceTask = device(
      ['shell', 'perfetto', '--txt', '-c', '-', '-o', traceRemote],
      20000,
      true,
      config,
    ).then(
      (result) => {
        traceResult = result
      },
      (error) => {
        traceFailure = error
      },
    )
    const deadline = Date.now() + 5000
    while (true) {
      if (traceFailure) throw traceFailure
      check(!traceResult, 'Perfetto exited before Home launch')
      const size = await device(['shell', 'stat', '-c', '%s', traceRemote], 5000, false)
      if (Number(size.output) > 0) {
        const prefix = join(report, 'trace-start-prefix.pftrace')
        await device(['pull', traceRemote, prefix])
        const sql =
          "SELECT coalesce(max(int_value),0) AS started_ns FROM metadata WHERE name='all_data_source_started_ns'"
        const readiness = spawnSync(
          traceProcessor,
          ['query', '--full-sort', '--quiet', '--format', 'csv', prefix, sql],
          { encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024 },
        )
        writeFileSync(
          join(report, 'trace-readiness.log'),
          (readiness.stdout ?? '') + (readiness.stderr ?? '') + String(readiness.error ?? ''),
        )
        const started = Number(readiness.stdout?.trim().split(/\r?\n/).at(-1))
        if (readiness.status === 0 && Number.isSafeInteger(started) && started > 0) {
          writeFileSync(
            join(report, 'trace-start.json'),
            JSON.stringify({
              streamingBytes: Number(size.output),
              allDataSourcesStartedNanos: started,
              processorHash: hash(traceProcessor),
            }),
          )
          break
        }
      }
      check(
        Date.now() < deadline,
        'Perfetto did not acknowledge all data sources before Home launch',
      )
      await pause(100)
    }
  }
  const launch = await device([
    'shell',
    'am',
    'start',
    '-W',
    '-n',
    build.id +
      '/org.octanexplat.prerenderandroid.' +
      (build.home
        ? startupPath === 'ordinary'
          ? 'HomeOrdinaryActivity'
          : 'HomeActivity'
        : 'ProbeActivity'),
    '--es',
    'xplat-startup-run',
    runToken,
    '--ez',
    'xplat-recreate',
    'true',
  ])
  writeFileSync(join(report, 'launch.txt'), launch.output)
  // Delay only the observer, never the application or engine. Analysis checks
  // that receipt I/O follows the first Home presentation on both paths.
  if (build.home?.startup) await pause(1500)
  const deadline = Date.now() + 45000 + Math.max(0, (build.home?.recreateCount ?? 1) - 1) * 5000
  let events = []
  while (Date.now() < deadline) {
    alive()
    const receipt = await readReceipt('probe-result.json')
    if (receipt.status === 0) {
      events = JSON.parse(receipt.output)
      if (build.home?.startup && !events.some((event) => event.runToken === runToken)) {
        await pause(100)
        continue
      }
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
          build.home.startup &&
          events.some(
            (event) =>
              event.event === 'startup-complete' &&
              event.epoch === Math.max(...events.map((event) => event.epoch)),
          )
        )
          break
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
        const ready = build.home.startup
          ? undefined
          : completedHomeEpoch(events, Boolean(build.home.parity))
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
  if (build.home?.startup) {
    const power = await device(['shell', 'dumpsys', 'power'], 5000, false)
    const wakefulness = power.output.match(/mWakefulness=(\w+)/)?.[1] ?? null
    writeFileSync(
      join(report, 'startup-display-state.json'),
      JSON.stringify(
        {
          wakefulness,
          displayPower: power.output.match(/Display Power: state=(\w+)/)?.[1] ?? null,
          querySucceeded: power.status === 0,
          scope: 'Read-only display state before startup OS input; no raw power dump retained',
        },
        null,
        2,
      ),
    )
    events = await qualifyAndroidStartup({
      build,
      path: startupPath,
      events,
      readReceipt,
      device,
      alive,
      pause,
      report,
    })
  } else if (build.home?.fallback) {
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
            ? rejected.reason === 'Native startup IR: binary build identity'
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
      native.debuggable === (build.variant !== 'release'),
      'Runtime Android debuggable flag differs from selected fixture variant',
    )
    check(
      native.homeVisualNodes === 19 &&
        native.width === native.availableWidth &&
        native.height === native.availableHeight &&
        native.width > 0 &&
        native.height > 0 &&
        native.draws > 0 &&
        native.drawnSafeBounds &&
        native.windowFocused &&
        native.nodes?.length === 19 &&
        native.nodes.every((node) => node.attached && node.width > 0 && node.height > 0),
      'Actual Home native geometry missing',
    )
    check(
      Number.isSafeInteger(native.firstCommittedFrameNanos) &&
        native.firstCommittedFrameNanos > mounted.elapsedRealtimeNanos &&
        native.firstCommittedFrameNanos <= native.elapsedRealtimeNanos &&
        native.elapsedRealtimeNanos < begin.elapsedRealtimeNanos,
      'Home hardware frame submission was not observed before engine initialization',
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
          const receipt = await readReceipt('probe-result.json', 5000, true)
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
          const receipt = await readReceipt('probe-result.json', 5000, true)
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
    build.home?.startup
      ? []
      : build.home?.fallback === 'build'
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
  if (build.variant === 'release') {
    const rejected = await device(
      [
        'shell',
        'content',
        'read',
        '--uri',
        'content://' + receiptAuthority + '/not-a-receipt.json',
      ],
      5000,
      false,
    )
    const writeRejected = await device(
      [
        'shell',
        'content',
        'write',
        '--uri',
        'content://' + receiptAuthority + '/probe-result.json',
      ],
      5000,
      false,
      '',
    )
    check(
      [rejected, writeRejected].every((result) =>
        (result.output + result.error).includes('Unknown read-only fixture receipt'),
      ),
      'Release receipt provider accepted an unknown file or a write',
    )
    writeFileSync(
      join(report, 'receipt-provider-controls.json'),
      JSON.stringify({ unknownFile: rejected, writeAttempt: writeRejected }, null, 2),
    )
  }
  await finishTrace()
  writeFileSync(
    join(report, 'status.json'),
    JSON.stringify({
      passed: true,
      driverHash,
      driverInputs,
      deviceKind,
      api: deviceIdentity.api,
      scope,
    }),
  )
  console.log(JSON.stringify({ report, passed: true, scope }, null, 2))
}

try {
  if (!physical) {
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
  }
  const alive = () => {
    if (childError) throw childError
    if (child) check(child.exitCode === null && child.signalCode === null, 'Owned emulator exited')
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
  const api = Number((await device(['shell', 'getprop', 'ro.build.version.sdk'])).output)
  const properties = {}
  for (const key of [
    'ro.product.manufacturer',
    'ro.product.model',
    'ro.product.cpu.abilist',
    'ro.build.fingerprint',
    'ro.kernel.qemu',
  ])
    properties[key] = (await device(['shell', 'getprop', key])).output
  deviceIdentity = { deviceKind, serial, api, properties }
  if (physical) {
    check(
      properties['ro.kernel.qemu'] !== '1' &&
        properties['ro.product.cpu.abilist'].split(',').includes('arm64-v8a'),
      'Explicit physical target must be an ARM64 phone, not an emulator',
    )
    check(
      Number.isInteger(api) && api >= 35,
      'Physical startup qualification requires Android35 or newer',
    )
  } else {
    const identity = (await device(['emu', 'avd', 'name'])).output
    check(
      identity.split(/\r?\n/)[0].trim() === avd,
      'Wrong booted AVD: ' + JSON.stringify(identity),
    )
    check(api === 35, 'Unexpected emulator Android API')
    Object.assign(deviceIdentity, { avd, consoleReply: identity })
  }
  writeFileSync(join(report, 'device-identity.json'), JSON.stringify(deviceIdentity, null, 2))
  identityConfirmed = true
  if (physical) {
    // OEM shells may prohibit pm clear. Reset only this disposable fixture,
    // once before installation/warmups; retain its data for measured trials.
    const existing = await device(['shell', 'pm', 'path', build.id], 5000, false)
    if (existing.output.startsWith('package:')) {
      const removed = await device(['uninstall', build.id], 30000)
      check(removed.output === 'Success', 'Could not reset the disposable physical fixture')
    }
  }
  await device(['install', '-r', build.apk], 120000)
  installed = true
  uid = Number(
    (await device(['shell', 'pm', 'list', 'packages', '-U', build.id])).output.match(
      /uid:(\d+)/,
    )?.[1],
  )
  check(Number.isSafeInteger(uid) && uid >= 10000, 'Missing app UID')
  const pairs = Number(process.env.XPLAT_PRERENDER_ANDROID_STARTUP_PAIRS ?? 0)
  check(
    Number.isInteger(pairs) &&
      pairs >= 0 &&
      pairs <= 12 &&
      (!pairs || (build.home?.startup && traceEnabled)),
    'Startup pairs must be0..12 and require the traced startup fixture',
  )
  const sequence = pairs
    ? [
        ...['native', 'ordinary', 'ordinary', 'native'].map((path) => ({ path, warmup: true })),
        ...Array.from({ length: pairs }, (_, index) =>
          (index % 2 ? ['ordinary', 'native'] : ['native', 'ordinary']).map((path) => ({
            path,
            warmup: false,
          })),
        ).flat(),
      ].map((trial, index) => ({ ...trial, index }))
    : [{ path: startupPath, warmup: false, index: 0 }]
  const trialReports = []
  for (const trial of sequence) {
    if (pairs) {
      report = join(
        sessionReport,
        'trial-' + String(trial.index).padStart(2, '0') + '-' + trial.path,
      )
      mkdirSync(report)
      writeFileSync(join(report, 'build.json'), JSON.stringify(build, null, 2))
      writeFileSync(
        join(report, 'device-identity.json'),
        readFileSync(join(sessionReport, 'device-identity.json')),
      )
      writeFileSync(
        join(report, 'status.json'),
        JSON.stringify({ passed: false, state: 'running' }),
      )
    }
    startupPath = trial.path
    receiptAuthority = build.id + '.receipts' + (startupPath === 'ordinary' ? '.ordinary' : '')
    if (build.home?.startup)
      scope =
        'Matched release Home startup control (' +
        startupPath +
        '); no artificial250ms delay or extra abort/parity probe; ' +
        deviceKind +
        ' device'
    const runToken = driverHash.slice(0, 12) + '-' + process.pid + '-' + trial.index
    await runAttempt(trial, runToken, alive)
    trialReports.push({ ...trial, report, runToken })
    if (pairs)
      writeFileSync(
        join(sessionReport, 'trials-progress.json'),
        JSON.stringify({ pairs, completed: trialReports }, null, 2),
      )
  }
  if (pairs) {
    report = sessionReport
    writeFileSync(
      join(report, 'trials.json'),
      JSON.stringify(
        {
          apkHash: build.apkHash,
          warmups: 4,
          pairs,
          appDataReset: 'before-warmups-only',
          appDataResetMethod: physical
            ? 'fixture-reinstall-before-session'
            : 'pm-clear-before-warmups',
          apkInstalledOnce: true,
          deviceKind,
          trials: trialReports,
          protocol:
            'One installed APK/one device session; app data reset only before warmups, force-stop between launches, alternating measured pairs, run tokens reject stale receipts; descriptive ' +
            deviceKind +
            ' pilot',
        },
        null,
        2,
      ),
    )
    writeFileSync(
      join(report, 'status.json'),
      JSON.stringify({
        passed: true,
        driverHash,
        driverInputs,
        scope:
          'Matched release ' +
          deviceKind +
          ' startup trial collection; analyze each trace before comparison',
      }),
    )
    console.log(JSON.stringify({ report, pairs, passed: true }))
  }
} catch (error) {
  failed = true
  failure = String(error)
  if (installed && identityConfirmed) {
    try {
      const windows = await device(['shell', 'dumpsys', 'window', 'windows'], 5000, false)
      const anrs = await device(['logcat', '-b', 'events', '-d', '-s', 'am_anr'], 5000, false)
      writeFileSync(
        join(report, 'failure-input-state.json'),
        JSON.stringify(
          {
            focusOnFixture: windows.output.includes('mCurrentFocus=')
              ? windows.output
                  .split(/\r?\n/)
                  .some((line) => line.includes('mCurrentFocus=') && line.includes(build.id))
              : null,
            fixtureWindows: windows.output.split(/\r?\n/).filter((line) => line.includes(build.id)),
            fixtureAnrs: anrs.output.split(/\r?\n/).filter((line) => line.includes(build.id)),
            scope: 'Only fixture window/ANR lines retained; unrelated windows and app logs omitted',
          },
          null,
          2,
        ),
      )
    } catch (diagnosticError) {
      writeFileSync(join(report, 'failure-input-state-error.txt'), String(diagnosticError))
    }
  }
  if (report !== sessionReport)
    writeFileSync(
      join(sessionReport, 'status.json'),
      JSON.stringify({ passed: false, error: failure, failedTrial: report }),
    )
  writeFileSync(
    join(report, 'status.json'),
    JSON.stringify({ passed: false, error: String(error), driverHash, driverInputs }),
  )
  throw error
} finally {
  cleaning = true
  const errors = []
  try {
    await finishTrace()
  } catch (error) {
    errors.push('Owned Perfetto cleanup: ' + String(error))
  }
  try {
    if (installed && identityConfirmed) {
      if (uid) {
        const logs = await device(['logcat', '-d', '--uid=' + uid], 10000, false)
        writeFileSync(join(report, 'app-logcat.txt'), logs.output)
      }
      const receipt = await readReceipt('probe-result.json')
      if (receipt.status === 0) writeFileSync(join(report, 'native-result.json'), receipt.output)
      const lifecycle = await readReceipt('lifecycle-result.json')
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
