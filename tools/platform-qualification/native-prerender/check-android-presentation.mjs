import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const report = resolve(required('XPLAT_PRERENDER_ANDROID_REPORT'))
const processor = resolve(required('XPLAT_PRERENDER_TRACE_PROCESSOR'))
const trace = join(report, 'home.pftrace')
const build = JSON.parse(readFileSync(join(report, 'build.json')))
const status = JSON.parse(readFileSync(join(report, 'status.json')))
const events = JSON.parse(readFileSync(join(report, 'result.json')))
function required(name) {
  if (!process.env[name]) throw new Error('Set ' + name)
  return process.env[name]
}
function check(value, reason) {
  if (!value) throw new Error(reason)
}
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
check(status.passed && build.home?.adopt, 'Presentation requires a passing Home adoption run')
check(statSync(trace).size > 0, 'FrameTimeline trace is empty')
const begin = events.find((event) => event.event === 'engine-init-begin')
check(Number.isSafeInteger(begin?.epoch), 'Engine initialization epoch missing')
const native = events.find(
  (event) => event.event === 'native-layout-before-runtime' && event.epoch === begin.epoch,
)
check(
  native?.drawnSafeBounds &&
    native.runtimeStarted === false &&
    native.runtimeLibraryLoaded === false,
  'Pre-VM safe-area draw proof missing',
)

function query(name, sql) {
  writeFileSync(join(report, name + '.sql'), sql)
  const result = spawnSync(processor, ['query', '--quiet', '--format', 'csv', trace, sql], {
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024,
  })
  writeFileSync(join(report, name + '.log'), result.stderr ?? '')
  check(
    !result.error && result.status === 0,
    'Trace query failed: ' + name + ': ' + String(result.error ?? result.stderr),
  )
  const rows = result.stdout.trim().split(/\r?\n/)
  check(
    rows.length === 2 && rows[0] === '"evidence_hex"' && /^"[0-9A-F]+"$/.test(rows[1]),
    'Unexpected trace query encoding',
  )
  return JSON.parse(Buffer.from(rows[1].slice(1, -1), 'hex').toString('utf8'))
}
const markers = query(
  'presentation-markers',
  `
SELECT hex(json_group_array(json_object('name',s.name,'ts',s.ts,'upid',p.upid))) AS evidence_hex
FROM slice s JOIN thread_track tt ON tt.id=s.track_id JOIN thread t USING(utid) JOIN process p USING(upid)
WHERE p.name='org.octanexplat.prerenderhome.android' AND s.name IN (
  'XplatHome:native-home-mounted:${begin.epoch}',
  'XplatHome:native-layout-before-runtime:${begin.epoch}',
  'XplatHome:engine-init-begin:${begin.epoch}'
)`,
)
check(
  markers.length === 3 &&
    new Set(markers.map((row) => row.name)).size === 3 &&
    new Set(markers.map((row) => row.upid)).size === 1,
  'Unique mount/layout/engine markers from one process are required',
)
const stage = (name) => markers.find((row) => row.name === `XplatHome:${name}:${begin.epoch}`).ts
const mounted = stage('native-home-mounted'),
  laidOut = stage('native-layout-before-runtime'),
  engine = stage('engine-init-begin')
check(
  mounted < laidOut && laidOut < engine && Math.abs(engine - begin.elapsedRealtimeNanos) < 10000000,
  'Trace marker order or boot-clock correspondence differs',
)
const candidates = query(
  'presentation-frames',
  `
SELECT hex(json_group_array(json_object(
 'drawId',draw.id,'drawTs',draw.ts,'drawEnd',draw.ts+draw.dur,
 'choreographerId',ch.id,'surfaceToken',app.surface_frame_token,
 'appFrameId',app.id,'appFrameEnd',app.ts+app.dur,'layer',app.layer_name,'appPresent',app.present_type,
 'displayToken',sf.display_frame_token,'displayFrameId',sf.id,
 'displayFrameEnd',sf.ts+sf.dur,'displayPresent',sf.present_type
))) AS evidence_hex
FROM slice draw JOIN ancestor_slice(draw.id) ch
JOIN thread_track tt ON tt.id=draw.track_id JOIN thread t USING(utid)
JOIN actual_frame_timeline_slice app ON app.upid=t.upid
 AND app.surface_frame_token=CAST(substr(ch.name,length('Choreographer#doFrame ')+1) AS INT)
JOIN actual_frame_timeline_slice sf ON sf.display_frame_token=app.display_frame_token
 AND sf.surface_frame_token IS NULL
JOIN process sf_process ON sf_process.upid=sf.upid
WHERE draw.name='XplatHomeDraw' AND ch.name GLOB 'Choreographer#doFrame [0-9]*'
 AND t.upid=${markers[0].upid} AND sf_process.name='/system/bin/surfaceflinger'
 AND draw.ts>${mounted} AND draw.ts+draw.dur<${laidOut} AND draw.dur>0
 AND app.ts<=draw.ts AND app.ts+app.dur>=draw.ts+draw.dur AND app.dur>0
 AND app.present_type IN ('Early Present','On-time Present','Late Present')
 AND sf.present_type IN ('Early Present','On-time Present','Late Present')
 AND sf.ts>=app.ts AND sf.dur>0 AND sf.ts+sf.dur<${engine}
`,
)
check(
  candidates.length > 0,
  'No Home draw links through its app buffer token to a presented display frame before the engine',
)
const health = query(
  'presentation-health',
  `
SELECT hex(json_group_array(json_object('name',name,'value',value,'severity',severity))) AS evidence_hex
FROM stats WHERE value>0 AND severity IN ('error','data_loss')`,
)
check(health.length === 0, 'Trace reports errors or data loss: ' + JSON.stringify(health))
const selected = candidates.toSorted((a, b) => b.drawTs - a.drawTs)[0]
const proof = {
  passed: true,
  target: 'Android35 elegant-fir-probe',
  epoch: begin.epoch,
  traceHash: hash(trace),
  processorHash: hash(processor),
  verifierHash: hash(import.meta.filename),
  apkHash: build.apkHash,
  markers,
  candidates,
  selected,
  health,
  engineBeginNanos: engine,
  displayBeforeEngineMs: (engine - selected.displayFrameEnd) / 1000000,
  hardwareSubmissionNanos: native.firstCommittedFrameNanos,
  platformPresentationQualified: true,
  pixelsQualified: false,
  physicalDisplayQualified: false,
  startupPerformanceQualified: false,
  scope:
    'Nonvisual emulator FrameTimeline: Home draw/choreographer token -> application buffer -> SurfaceFlinger display frame before engine initialization; artificial startup gate, no pixel or physical-display claim',
}
writeFileSync(join(report, 'presentation.json'), JSON.stringify(proof, null, 2))
console.log(JSON.stringify(proof, null, 2))
