// Measure the native code that actually contains and executes route generation.
// The project worker is included; this is not a public CLI startup result.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, symlinkSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { spawnSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { scratchRun } from './scratch.mjs'
import { assertCurrentNativeBuild, envProbeInputs, artifactFingerprint } from './native-inputs.mjs'
if (process.platform !== 'darwin') throw Error('The native route emitter has runtime qualification only on macOS')
const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/nim-cli')
const original = join(work, 'native/env-probe')
const build = JSON.parse(readFileSync(join(work, 'native/env-build.json')))
assertCurrentNativeBuild(root, build, readFileSync(original), envProbeInputs)
const scratch = scratchRun(root, 'route-core-benchmark')
const binary = join(scratch, 'route-core')
const project = join(scratch, 'project')
const screen = 'export default function Page() { return null }'
try {
 copyFileSync(original, binary)
 const stripped = spawnSync('strip', [binary], { encoding: 'utf8' })
 assert.equal(stripped.status, 0, stripped.stderr)
 const sources = {
  'app/_layout.tsx': screen,
  'app/index.web.tsx': 'export const loader = () => 1; export const head = {}; ' + screen,
  'app/index.macos.tsx': 'export const beforeLoad = () => {}; ' + screen,
  'app/users/[id].tsx': 'export const validateSearch = (raw: unknown) => raw; ' + screen,
 }
 mkdirSync(join(project, 'node_modules/@octane-xplat'), { recursive: true })
 symlinkSync(join(root, 'packages/build'), join(project, 'node_modules/@octane-xplat/build'), 'dir')
 for (const [file, source] of Object.entries(sources)) {
  mkdirSync(dirname(join(project, file)), { recursive: true })
  writeFileSync(join(project, file), source)
 }
 const input = JSON.stringify({ operation: 'route-generate', dir: project, publish: true }) + '\n'
 const samples = []
 for (let i = 0; i < 25; i++) {
  const start = performance.now()
  const run = spawnSync(binary, [], { input, encoding: 'utf8', env: { ...process.env, PATH: dirname(process.execPath) }, timeout: 5000, maxBuffer: 4 * 1024 * 1024 })
  const elapsed = performance.now() - start
  assert.equal(run.status, 0, run.stderr)
  assert.equal(run.stderr, '')
  const result = JSON.parse(run.stdout)
  assert.equal(result.ok, true)
  assert.equal(result.value.count, 2)
  assert.equal(Object.keys(result.value.outputs).length, 18)
  assert.deepEqual(result.value.warnings, [])
  if (i >= 5) samples.push(elapsed)
 }
 const sorted = samples.toSorted((a,b) => a-b)
 const bytes = readFileSync(binary)
 const artifact = { ...artifactFingerprint(bytes), gzipBytes: gzipSync(bytes).length, gzipLevel: 6, stripped: true }
 assertCurrentNativeBuild(root, build, readFileSync(original), envProbeInputs)
 const output = join(work, `route-core-benchmark-${process.platform}-${process.arch}-${Date.now()}`)
 mkdirSync(output, { recursive: true })
 copyFileSync(binary, join(output, 'route-core'))
 const result = {
  scope: 'Test-only native config/route core, including the actual renderer; not a public CLI command or end-to-end typecheck',
  platform: process.platform, arch: process.arch, hostRuntime: process.version, build,
  methodSha256: createHash('sha256').update(readFileSync(import.meta.filename)).digest('hex'), artifact,
  workload: { routes: 2, sourceLeaves: 3, layouts: 1, generatedFiles: 18, projectWorkerIncluded: true, parserWorkExcluded: false, firstPublicationExcludedByWarmups: true },
  warmGeneration: { includesProcessLaunch: true, includesJsonProtocol: true, includesPlanningAndPublicationChecks: true,
   warmups: 5, samplesMs: samples, medianMs: sorted[10], p95Ms: sorted[18], nodeExecutable: process.execPath },
 }
 writeFileSync(join(output, 'results.json'), JSON.stringify(result, null, 2) + '\n')
 console.log(`Native route/config core: ${artifact.bytes} stripped bytes / ${artifact.gzipBytes} gzip bytes; warm process + generation median ${sorted[10].toFixed(3)} ms, p95 ${sorted[18].toFixed(3)} ms`)
 console.log(`Evidence: ${output}`)
} finally { rmSync(scratch, { recursive: true, force: true }) }
