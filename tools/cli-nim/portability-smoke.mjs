// Actual-host standalone help/catalog and warm startup; no provider qualification.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { gzipSync } from 'node:zlib'

const binary = resolve(process.env.XPLAT_NIM_SMOKE_BINARY ?? process.argv[2] ?? '')
const output = process.env.XPLAT_NIM_SMOKE_RECORD ?? process.argv[3]
assert.ok(output, 'Provide XPLAT_NIM_SMOKE_BINARY and XPLAT_NIM_SMOKE_RECORD (or BINARY RECORD argv)')
const bytes = readFileSync(binary)
const sha256 = createHash('sha256').update(bytes).digest('hex')
if (process.platform === 'win32') {assert.equal(bytes.subarray(0, 2).toString(), 'MZ')}
if (process.platform === 'linux') {assert.equal(bytes.subarray(0, 4).toString('hex'), '7f454c46')}
const environment = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== 'PATH')), PATH: '', NODE_PATH: '', NODE_OPTIONS: '' }
function run(args) {
 const result = spawnSync(binary, args, { env: environment, encoding: 'utf8', timeout: 10000, maxBuffer: 8*1024*1024 })
 assert.equal(result.status, 0, result.stderr + (result.error?.message ?? ''))
 assert.equal(result.stderr, '')
 return result.stdout
}
assert.match(run(['--help']), /experimental Nim CLI/)
const first = JSON.parse(run(['catalog', '--json'])), second = JSON.parse(run(['catalog', '--json']))
assert.equal(first.contractVersion, 1)
assert.equal(first.ok, true)
assert.notEqual(first.requestId, second.requestId)
for (let i = 0; i < 5; i++) {run(['--help'])}
const samplesMs = []
for (let i = 0; i < 20; i++) {
 const start = performance.now()
 run(['--help'])
 samplesMs.push(performance.now()-start)
}
const ordered = samplesMs.toSorted((a,b) => a-b)
const record = { version: 1, platform: process.platform, arch: process.arch, node: process.version, cliVersion: first.data.cli.version,
 artifact: { bytes: bytes.length, gzipLevel: 6, gzipBytes: gzipSync(bytes, { level: 6 }).length, sha256 },
 runtime: { scope: 'Native help/catalog only; no HTTP/TLS, RPC, worker or cancellation qualification', path: '', passed: true },
 startup: { command: '--help', warmups: 5, samplesMs, medianMs: ordered[10], p95Ms: ordered[18], includesProcessLaunch: true },
 goals: { gzipBytes: 5000000, medianMs: 50, met: bytes.length > 0 && gzipSync(bytes, { level: 6 }).length < 5000000 && ordered[10] < 50 } }
mkdirSync(dirname(resolve(output)), { recursive: true })
writeFileSync(output, JSON.stringify(record, null, 2)+'\n')
console.log(JSON.stringify({ platform: record.platform, arch: record.arch, artifact: record.artifact, runtime: record.runtime,
 startup: { medianMs: record.startup.medianMs, p95Ms: record.startup.p95Ms }, goals: record.goals }, null, 2))
