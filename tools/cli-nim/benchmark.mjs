// Measure the actual public entry after a current host build, not a smaller probe.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { performance } from 'node:perf_hooks'
import { assertCurrentNativeBuild } from './native-inputs.mjs'
const root = resolve(import.meta.dirname, '../..')
const work = join(root, 'research/nim-cli')
const build = JSON.parse(readFileSync(join(work, 'native/build.json'), 'utf8'))
const binary = join(work, `native/xplat${process.platform === 'win32' ? '.exe' : ''}`)
const bytes = readFileSync(binary)
assertCurrentNativeBuild(root, build, bytes)
const sha256 = createHash('sha256').update(bytes).digest('hex')
function run(args) {
 const result = spawnSync(binary, args, { encoding: 'utf8', timeout: 5000, env: { ...process.env, PATH: '' } })
 assert.equal(result.status, 0, result.stderr || result.error?.message)
 assert.equal(result.stderr, '')
 return result.stdout
}
assert.equal(run(['--version']).trim(), build.version)
const samples = []
for (let i = 0; i < 25; i++) {
 const started = performance.now()
 run(['--help'])
 if (i >= 5) samples.push(performance.now() - started)
}
const sorted = samples.toSorted((a, b) => a - b)
const gzipBytes = gzipSync(bytes).length
const file = process.platform === 'win32' ? null : spawnSync('file', ['-b', binary], { encoding: 'utf8' })
const result = {
 scope: 'Public Nim CLI entry; command/runtime qualification is reported separately',
 platform: process.platform, arch: process.arch, referenceRuntime: process.version, build,
 artifact: { bytes: bytes.length, gzipBytes, gzipLevel: 6, sha256, stripped: build.stripped,
  format: file?.status === 0 ? file.stdout.trim() : undefined },
 startup: { command: '--help', warmups: 5, samplesMs: samples, medianMs: sorted[10], p95Ms: sorted[18],
  includesProcessLaunch: true, path: '' },
 goals: { gzipBytes: 5_000_000, medianMs: 50, met: gzipBytes < 5_000_000 && sorted[10] < 50 },
}
assertCurrentNativeBuild(root, build, readFileSync(binary))
const out = join(work, `benchmark-${process.platform}-${process.arch}-${Date.now()}`)
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'results.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`Public entry: ${bytes.length} executable bytes / ${gzipBytes} gzip bytes; warm median ${sorted[10].toFixed(3)} ms, p95 ${sorted[18].toFixed(3)} ms`)
console.log(`Evidence: ${out}`)
if (!result.goals.met) process.exitCode = 1
