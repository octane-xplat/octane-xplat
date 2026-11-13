import { createHash } from 'node:crypto'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createTraceQuery } from './android-trace-query.mjs'

function check(value, reason) {
  if (!value) throw new Error(reason)
}
function required(name) {
  check(process.env[name], 'Set ' + name)
  return process.env[name]
}
const report = resolve(required('XPLAT_PRERENDER_ANDROID_REPORT'))
const processor = resolve(required('XPLAT_PRERENDER_TRACE_PROCESSOR'))
const trace = join(report, 'home.pftrace')
const status = JSON.parse(readFileSync(join(report, 'status.json')))
const build = JSON.parse(readFileSync(join(report, 'build.json')))
const startup = JSON.parse(readFileSync(join(report, 'startup.json')))
const capture = JSON.parse(readFileSync(join(report, 'trace-start.json')))
const events = JSON.parse(readFileSync(join(report, 'result.json')))
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
check(
  status.passed &&
    build.home?.startup &&
    build.variant === 'release' &&
    build.id === 'org.octanexplat.prerenderhome.android' &&
    startup.apkHash === build.apkHash &&
    ['native', 'ordinary'].includes(startup.path) &&
    statSync(trace).size > 0,
  'Startup timing requires a passing matched release control and nonempty trace',
)
const processName = build.id + (startup.path === 'ordinary' ? ':ordinary' : '')
check(startup.processName === processName, 'Startup process differs')
check(
  Number.isSafeInteger(capture.allDataSourcesStartedNanos) &&
    capture.allDataSourcesStartedNanos > 0 &&
    capture.allDataSourcesStartedNanos < startup.processStartNanos &&
    capture.processorHash === hash(processor),
  'Startup preceded the acknowledged tracing sources or used a different trace parser',
)
const begin = events.find((event) => event.event === 'engine-init-begin')
const end = events.find((event) => event.event === 'engine-init-end')
const mountName = startup.path === 'native' ? 'native-home-mounted' : 'startup-tree-mounted'
const mount = events.find((event) => event.event === mountName)
check(
  mount && begin && end && Number.isSafeInteger(startup.processStartNanos),
  'Startup phase receipts missing',
)
const query = createTraceQuery(report, processor, trace)
const acknowledged = query(
  'startup-capture-gate',
  `SELECT hex(json_group_array(json_object('started',int_value))) AS evidence_hex
FROM metadata WHERE name='all_data_source_started_ns'`,
)
check(
  acknowledged.length === 1 && acknowledged[0].started === capture.allDataSourcesStartedNanos,
  'Capture readiness prefix and completed trace belong to different source acknowledgements',
)
const markers = query(
  'startup-markers',
  `
SELECT hex(json_group_array(json_object('name',s.name,'ts',s.ts,'upid',p.upid))) AS evidence_hex
FROM slice s JOIN thread_track tt ON tt.id=s.track_id JOIN thread t USING(utid) JOIN process p USING(upid)
WHERE p.name='${processName}' AND s.name IN (
 'XplatHome:${mountName}:${mount.epoch}',
 'XplatHome:engine-init-begin:${begin.epoch}',
 'XplatHome:engine-init-end:${end.epoch}')`,
)
check(
  markers.length === 3 &&
    new Set(markers.map((row) => row.name)).size === 3 &&
    new Set(markers.map((row) => row.upid)).size === 1,
  'Unique startup mount/engine markers from one process required',
)
const engine = markers.find((row) => row.name === `XplatHome:engine-init-begin:${begin.epoch}`).ts
const engineEnd = markers.find((row) => row.name === `XplatHome:engine-init-end:${end.epoch}`).ts
const mounted = markers.find((row) => row.name === `XplatHome:${mountName}:${mount.epoch}`).ts
check(
  Math.abs(engine - begin.elapsedRealtimeNanos) < 10000000 &&
    Math.abs(engineEnd - end.elapsedRealtimeNanos) < 10000000 &&
    Math.abs(mounted - mount.elapsedRealtimeNanos) < 10000000 &&
    engine < engineEnd &&
    startup.processStartNanos < Math.min(engine, mounted),
  'Startup trace/receipt clocks or phase ordering differ',
)
const candidates = query(
  'startup-frames',
  `
SELECT hex(json_group_array(json_object(
 'drawId',draw.id,'drawTs',draw.ts,'surfaceToken',app.surface_frame_token,'appFrameId',app.id,
 'displayToken',sf.display_frame_token,'displayFrameId',sf.id,'displayFrameEnd',sf.ts+sf.dur,
 'appPresent',app.present_type,'displayPresent',sf.present_type,'layer',app.layer_name
))) AS evidence_hex
FROM slice draw JOIN ancestor_slice(draw.id) ch
JOIN thread_track tt ON tt.id=draw.track_id JOIN thread t USING(utid)
JOIN actual_frame_timeline_slice app ON app.upid=t.upid
 AND app.surface_frame_token=CAST(substr(ch.name,length('Choreographer#doFrame ')+1) AS INT)
JOIN actual_frame_timeline_slice sf ON sf.display_frame_token=app.display_frame_token AND sf.surface_frame_token IS NULL
JOIN process sp ON sp.upid=sf.upid
WHERE draw.name='XplatHomeDraw' AND ch.name GLOB 'Choreographer#doFrame [0-9]*' AND t.upid=${markers[0].upid}
 AND sp.name='/system/bin/surfaceflinger' AND draw.ts>${mounted} AND draw.ts+draw.dur<${startup.ready.elapsedRealtimeNanos}
 AND draw.dur>0 AND app.ts<=draw.ts AND app.ts+app.dur>=draw.ts+draw.dur AND app.dur>0 AND sf.dur>0
 AND sf.ts>=app.ts AND app.present_type IN ('Early Present','On-time Present','Late Present')
 AND sf.present_type IN ('Early Present','On-time Present','Late Present')`,
)
check(candidates.length > 0, 'No initial Home draw links to a presented display frame')
const health = query(
  'startup-health',
  `SELECT hex(json_group_array(json_object('name',name,'value',value,'severity',severity))) AS evidence_hex
FROM stats WHERE value>0 AND severity IN ('error','data_loss')`,
)
check(health.length === 0, 'Startup trace has errors/data loss: ' + JSON.stringify(health))
const first = candidates.toSorted((a, b) => a.displayFrameEnd - b.displayFrameEnd)[0]
const receiptIo = query(
  'startup-receipt-io',
  `SELECT hex(json_group_array(json_object('name',s.name,'ts',s.ts))) AS evidence_hex
FROM slice s JOIN thread_track tt ON tt.id=s.track_id JOIN thread t USING(utid)
WHERE t.upid=${markers[0].upid} AND s.name IN ('XplatHomeReceiptRead','XplatHomeReceiptWrite')`,
)
check(
  receiptIo.some((row) => row.name === 'XplatHomeReceiptWrite') &&
    receiptIo.some((row) => row.name === 'XplatHomeReceiptRead') &&
    receiptIo.every((row) => row.ts > first.displayFrameEnd),
  'Receipt observation ran before first Home presentation',
)
check(
  startup.path === 'native' ? first.displayFrameEnd < engine : engineEnd < first.drawTs,
  'Native-first presentation or eager-engine ordinary ordering differs',
)
const result = {
  path: startup.path,
  apkHash: build.apkHash,
  traceHash: hash(trace),
  processorHash: hash(processor),
  verifierHash: hash(import.meta.filename),
  queryHelperHash: hash(join(import.meta.dirname, 'android-trace-query.mjs')),
  processName,
  processStartNanos: startup.processStartNanos,
  markers,
  candidates,
  first,
  receiptIo,
  health,
  firstPresentedMs: (first.displayFrameEnd - startup.processStartNanos) / 1000000,
  engineBeginMs: (engine - startup.processStartNanos) / 1000000,
  engineEndMs: (engineEnd - startup.processStartNanos) / 1000000,
  liveTreeAcceptedMs: startup.liveTreeAcceptedMs,
  platformPresentationQualified: true,
  speedupQualified: false,
  physicalPerformanceQualified: false,
  scope:
    'Single emulator release startup observation; live-tree acceptance is not first possible input; OS tap verified separately; use the paired collector/analyzer for a warm-cache comparison',
}
writeFileSync(join(report, 'startup-timing.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
