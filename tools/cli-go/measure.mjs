// Warm process startup only: help does not initialize a model or project worker.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { performance } from 'node:perf_hooks'

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const flags = process.argv.slice(2)
assert.ok(flags.length === 0 || (flags.length === 1 && flags[0] === '--onnx'))
const onnx = flags.includes('--onnx')

const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary =
  process.env.XPLAT_GO_ROUTES_BINARY ??
  join(
    work,
    `xplat-go-${target}-cli${onnx ? '-onnx' : ''}${process.platform === 'win32' ? '.exe' : ''}`,
  )

const build = JSON.parse(readFileSync(binary + '.json'))
assert.equal(build.onnx, onnx, 'Measure the requested inference variant')
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const bytes = readFileSync(binary),
  archive = readFileSync(binary + '.tgz')

assert.equal(sha(bytes), build.sha256)
assert.equal(sha(archive), build.download.sha256)
assert.equal(archive.length, build.download.bytes)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, `Stale source: ${file}`)
}

const samples = []
for (let at = 0; at < 25; at++) {
  const started = performance.now()
  const result = spawnSync(binary, ['--help'], {
    encoding: 'utf8',
    timeout: 10000,
    env: { ...process.env, PATH: '' },
  })

  const milliseconds = performance.now() - started
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
  if (at >= 5) {
    samples.push(milliseconds)
  }
}

samples.sort((a, b) => a - b)
const record = {
  target,
  variant: onnx ? 'native-inference' : 'core',
  node: process.version,
  binarySha256: build.sha256,
  scope:
    'Partial public Go CLI; warm --help startup through Node spawnSync with empty PATH, no model initialization or Node worker. Not full command latency or installer qualification.',
  executableBytes: bytes.length,
  gzip6Bytes: gzipSync(bytes, { level: 6 }).length,
  downloadBytes: archive.length,
  warmups: 5,
  samples,
  medianMs: (samples[9] + samples[10]) / 2,
  p95Ms: samples[18],
  goals: { gzipBytes: 5000000, medianMs: 50 },
}

writeFileSync(
  join(work, `startup-${target}-cli${onnx ? '-onnx' : ''}.json`),
  JSON.stringify(record, null, 2) + '\n',
)

console.log(JSON.stringify(record, null, 2))
