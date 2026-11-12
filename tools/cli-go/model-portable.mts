// Portable actual-host gate. The snapshot supplies pinned assets and Node
// reference vectors; this runner performs no model computation in JavaScript.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { performance } from 'node:perf_hooks'

const root = resolve(import.meta.dirname, '../..'),
  work = join(root, 'research/go-cli')

const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${target}-onnx${process.platform === 'win32' ? '.exe' : ''}`)
const build = JSON.parse(readFileSync(binary + '.json')),
  pins = JSON.parse(readFileSync(new URL('./native-assets.json', import.meta.url))).targets[target]

const cases = JSON.parse(readFileSync(join(work, 'model-cases.json')))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')

assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
  assert.equal(sha(readFileSync(join(root, file))), hash, `Stale source: ${file}`)
}

const library = join(work, 'runtime-assets', pins.directory, pins.library)

assert.equal(sha(readFileSync(library)), pins.librarySha256)

const input = join(work, 'model-request.json')
const request = {
  directory: join(work, 'model-fixtures'),
  library,
  librarySha256: pins.librarySha256,
  texts: cases.texts,
}

function native(operation, overrides = {}, fail = false) {
  writeFileSync(input, JSON.stringify({ ...request, ...overrides }))

  const result = spawnSync(binary, [operation, '--request', input, '--timeout', '2m'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: '' },
    timeout: 150000,
    maxBuffer: 32 << 20,
  })

  assert.equal(result.status, fail ? 1 : 0, result.stdout + '\n' + result.stderr)
  assert.equal(result.stderr, '')
  return JSON.parse(result.stdout)
}

const record = {
  target,
  build,
  scope:
    'Actual host native Go CPU model; precomputed canonical Node vectors/token IDs, no Node inference fallback.',
  passed: false,
}

try {
  assert.deepEqual(native('tokenize'), cases.expectedTokens)

  const output = native('embed')

  assert.match(output.engine, /onnxruntime-1\.31\.1/)

  const dot = (a, b) => a.reduce((sum, value, at) => sum + value * b[at], 0)

  record.cosines = output.vectors.map((vector, at) => {
    assert.equal(vector.length, 384)
    assert.ok(vector.every(Number.isFinite))
    assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-10)

    const cosine = dot(vector, cases.expectedVectors[at])

    assert.ok(cosine > 0.95)
    return cosine
  })

  record.retrieval = cases.documents.map((document, at) => {
    const query = output.vectors[cases.prefixCount + cases.documents.length + at]
    const ranked = cases.documents
      .map((candidate, index) => ({
        path: candidate.path,
        score: dot(query, output.vectors[cases.prefixCount + index]),
      }))
      .sort((a, b) => b.score - a.score)

    assert.equal(ranked[0].path, document.path)
    return { query: document.query, ranked }
  })

  assert.deepEqual(native('embed', { texts: [cases.texts[1]] }).vectors[0], output.vectors[1])
  assert.match(native('embed', { librarySha256: '0'.repeat(64) }, true).error, /checksum/)

  const sizes = (file) => {
    const bytes = readFileSync(file)

    return {
      bytes: bytes.length,
      gzip6Bytes: gzipSync(bytes, { level: 6 }).length,
      sha256: sha(bytes),
    }
  }

  record.assets = {
    runtime: sizes(library),
    weights: sizes(join(request.directory, 'onnx/model_quantized.onnx')),
  }

  const samples = []

  for (let at = 0; at < 25; at++) {
    const start = performance.now()
    const result = spawnSync(binary, ['--help'], {
      encoding: 'utf8',
      env: { ...process.env, PATH: '' },
    })

    assert.equal(result.status, 0, result.stderr)
    if (at >= 5) {
      samples.push(performance.now() - start)
    }
  }

  samples.sort((a, b) => a - b)
  record.measurements = {
    executableBytes: build.bytes,
    gzip6Bytes: build.gzipBytes,
    downloadBytes: build.download.bytes,
    medianMs: (samples[9] + samples[10]) / 2,
    p95Ms: samples[18],
    samples,
    goals: { gzipBytes: 5000000, medianMs: 50 },
  }

  record.passed = true
} finally {
  writeFileSync(
    join(work, `model-qualification-${target}.json`),
    JSON.stringify(record, null, 2) + '\n',
  )
}

console.log(JSON.stringify(record, null, 2))
