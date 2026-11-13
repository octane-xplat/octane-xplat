import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'

function check(value, reason) {
  if (!value) throw new Error(reason)
}
function required(name) {
  check(process.env[name], 'Set ' + name)
  return process.env[name]
}
const report = resolve(required('XPLAT_PRERENDER_ANDROID_REPORT'))
const processor = resolve(required('XPLAT_PRERENDER_TRACE_PROCESSOR'))
const collection = JSON.parse(readFileSync(join(report, 'trials.json')))
const status = JSON.parse(readFileSync(join(report, 'status.json')))
const deviceIdentity = JSON.parse(readFileSync(join(report, 'device-identity.json')))
check(
  ['emulator', 'physical'].includes(deviceIdentity.deviceKind) &&
    collection.deviceKind === deviceIdentity.deviceKind,
  'Collection device identity differs',
)
const physical = deviceIdentity.deviceKind === 'physical'
check(
  collection.appDataResetMethod ===
    (physical ? 'fixture-reinstall-before-session' : 'pm-clear-before-warmups'),
  'Collection reset method differs from its declared target',
)
check(
  status.passed &&
    collection.warmups === 4 &&
    collection.pairs > 0 &&
    collection.trials.length === 4 + 2 * collection.pairs &&
    collection.appDataReset === 'before-warmups-only' &&
    collection.apkInstalledOnce,
  'Expected complete alternating startup collection with four warmups',
)
const checker = join(import.meta.dirname, 'check-android-startup.mjs')
const observations = []
let previousStart = 0
for (const [index, trial] of collection.trials.entries()) {
  const path =
    index < 4
      ? ['native', 'ordinary', 'ordinary', 'native'][index]
      : (Math.floor((index - 4) / 2) % 2 ? ['ordinary', 'native'] : ['native', 'ordinary'])[
          (index - 4) % 2
        ]
  const directory = resolve(trial.report)
  check(
    trial.index === index &&
      trial.path === path &&
      trial.warmup === index < 4 &&
      directory.startsWith(report + sep),
    'Startup trial order, warmup boundary or report scope differs',
  )
  const command = spawnSync(process.execPath, [checker], {
    env: {
      ...process.env,
      XPLAT_PRERENDER_ANDROID_REPORT: directory,
      XPLAT_PRERENDER_TRACE_PROCESSOR: processor,
    },
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 4 * 1024 * 1024,
  })
  writeFileSync(
    join(directory, 'startup-analysis.log'),
    (command.stdout ?? '') + (command.stderr ?? ''),
  )
  check(
    !command.error && command.status === 0,
    'Startup trace analysis failed: ' + directory + ': ' + String(command.error ?? command.stderr),
  )
  const timing = JSON.parse(readFileSync(join(directory, 'startup-timing.json')))
  const startup = JSON.parse(readFileSync(join(directory, 'startup.json')))
  const trialStatus = JSON.parse(readFileSync(join(directory, 'status.json')))
  check(
    timing.path === trial.path &&
      timing.apkHash === collection.apkHash &&
      startup.runToken === trial.runToken &&
      trialStatus.driverHash === status.driverHash &&
      timing.processStartNanos > previousStart &&
      timing.health.length === 0,
    'Startup trial identity, nonce, process-cold order or trace health differs',
  )
  check(
    JSON.stringify(timing.deviceIdentity) === JSON.stringify(deviceIdentity),
    'Startup trial device identity changed within the collection',
  )
  previousStart = timing.processStartNanos
  observations.push({ ...trial, timing })
}
function distribution(values) {
  check(values.length > 0 && values.every(Number.isFinite), 'Invalid startup samples')
  const sorted = values.toSorted((a, b) => a - b)
  const median =
    sorted.length % 2
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
  return { n: values.length, median, min: sorted[0], max: sorted.at(-1), values }
}
const measured = observations.filter((row) => !row.warmup)
const summary = {}
for (const path of ['native', 'ordinary']) {
  const rows = measured.filter((row) => row.path === path)
  summary[path] = Object.fromEntries(
    ['firstPresentedMs', 'liveTreeAcceptedMs', 'engineBeginMs', 'engineEndMs'].map((field) => [
      field,
      distribution(rows.map((row) => row.timing[field])),
    ]),
  )
}
const pairs = []
for (let index = 0; index < measured.length; index += 2) {
  const rows = measured.slice(index, index + 2)
  const native = rows.find((row) => row.path === 'native'),
    ordinary = rows.find((row) => row.path === 'ordinary')
  check(native && ordinary, 'Matched startup pair missing')
  pairs.push({
    index: index / 2,
    order: rows.map((row) => row.path),
    native: native.report,
    ordinary: ordinary.report,
    firstPresentedDeltaMs: native.timing.firstPresentedMs - ordinary.timing.firstPresentedMs,
    liveTreeAcceptedDeltaMs: native.timing.liveTreeAcceptedMs - ordinary.timing.liveTreeAcceptedMs,
  })
}
const pairedDifferences = Object.fromEntries(
  ['firstPresentedDeltaMs', 'liveTreeAcceptedDeltaMs'].map((field) => [
    field,
    distribution(pairs.map((row) => row[field])),
  ]),
)
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const result = {
  apkHash: collection.apkHash,
  pairs,
  pairedDifferences,
  summary,
  observations,
  analyzerHash: hash(import.meta.filename),
  checkerHash: hash(checker),
  queryHelperHash: hash(join(import.meta.dirname, 'android-trace-query.mjs')),
  processorHash: hash(processor),
  protocol: collection.protocol,
  deviceIdentity,
  emulatorPilotQualified: !physical,
  physicalPilotQualified: physical,
  physicalPerformanceQualified: false,
  firstPossibleInputQualified: false,
  scope:
    'Alternating paired ' +
    deviceIdentity.deviceKind +
    ' pilot observations; descriptive distributions on this device only. First Home presentation uses the full frame chain. Live-tree acceptance is a commit/restoration milestone, not first possible input. OS tap functionality is verified per trial; no production startup or broader device claim.',
}
writeFileSync(join(report, 'startup-comparison.json'), JSON.stringify(result, null, 2))
const number = (value) => value.toFixed(1)
const lines = [
  '# Matched Android release startup pilot',
  '',
  'One APK and one ' +
    deviceIdentity.deviceKind +
    ' device session; four predeclared warmups, app data retained for measured process-cold launches, alternating pairs. Every trace and OS-input control passed.',
  '',
  '| Metric (ms from Android process start) | Native-first median (min–max) | Ordinary median (min–max) |',
  '| --- | --- | --- |',
]
for (const field of ['firstPresentedMs', 'liveTreeAcceptedMs', 'engineBeginMs', 'engineEndMs']) {
  const a = summary.native[field],
    b = summary.ordinary[field]
  lines.push(
    '| ' +
      field +
      ' | ' +
      number(a.median) +
      ' (' +
      number(a.min) +
      '–' +
      number(a.max) +
      ') | ' +
      number(b.median) +
      ' (' +
      number(b.min) +
      '–' +
      number(b.max) +
      ') |',
  )
}
lines.push(
  '',
  'Paired differences are native minus ordinary: first presentation median ' +
    number(pairedDifferences.firstPresentedDeltaMs.median) +
    'ms; live-tree acceptance median ' +
    number(pairedDifferences.liveTreeAcceptedDeltaMs.median) +
    'ms. Negative means earlier. All observations and pair order remain in startup-comparison.json.',
  '',
  'These are descriptive ' +
    deviceIdentity.deviceKind +
    ' results on this device, not production performance or first possible input latency. Live-tree acceptance includes any required Activity restoration. Presentation is platform-reported; no pixel or installed-size comparison is qualified by this pilot.',
  '',
)
writeFileSync(join(report, 'startup-comparison.md'), lines.join('\n'))
console.log(
  JSON.stringify(
    {
      report,
      summary,
      pairedDifferences,
      emulatorPilotQualified: !physical,
      physicalPilotQualified: physical,
    },
    null,
    2,
  ),
)
