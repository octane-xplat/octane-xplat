// Explicit local-model qualification; excluded from the ordinary offline test task.
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { prepareIndex, searchIndex, MODEL, localEmbedder } from '../dist/index.js'

const cacheDir = resolve(
  process.env.XPLAT_DOCS_MODEL_CACHE ?? '../../research/docs-search/model-cache',
)

mkdirSync(cacheDir, { recursive: true })
const docs = (version) => [
  {
    path: 'docs/navigation.md',
    corpus: 'guide',
    content: `# Screen lifecycle\n\nRetain inactive route screens so their local state survives navigation. Version ${version}.`,
  },
  {
    path: 'docs/media.md',
    corpus: 'guide',
    content: '# Camera\n\nCapture a photograph with the device camera.',
  },
  {
    path: 'CHANGELOG.md',
    corpus: 'changelog',
    content: `# Changelog\n\n## [Octane Xplat ${version}](tag) - 2026-10-31\n\n### Preserve inactive routes\n\nRoute screens retain local state when navigating away and back.`,
  },
]

const start = performance.now()

// Exercise input boundaries with real tokenization/inference, without network.
const originalFetch = globalThis.fetch
const boundaryEmbedder = localEmbedder(cacheDir, true)
await boundaryEmbedder.prepare()
globalThis.fetch = () => {
  throw new Error('Inference attempted network access')
}

try {
  const texts = ['', 'Café 中文 🚀', 'navigation '.repeat(800)]
  const together = await boundaryEmbedder.embed(texts)
  for (let i = 0; i < texts.length; i++) {
    const [alone] = await boundaryEmbedder.embed([texts[i]])
    assert.equal(alone.length, MODEL.dimensions)
    assert.ok(alone.every(Number.isFinite))
    assert.ok(Math.abs(Math.hypot(...alone) - 1) < 1e-6)
    assert.deepEqual(alone, together[i], 'Embedding must not depend on batch companions')
  }

  assert.deepEqual(await boundaryEmbedder.embed([]), [])
} finally {
  globalThis.fetch = originalFetch
  await boundaryEmbedder.dispose()
}

for (const version of ['1.0.0', '2.0.0']) {
  const documents = docs(version)
  const options = { documents, binding: version, cacheDir }
  await prepareIndex(options)
  const fetch = globalThis.fetch
  globalThis.fetch = () => {
    throw new Error('Search attempted network access')
  }

  const before = performance.now()
  const hit = await searchIndex({
    ...options,
    documents: documents.filter((d) => d.corpus === 'guide'),
    query: 'remember form input when switching pages',
  })

  assert.equal(hit.retrieval.used, 'hybrid', JSON.stringify(hit.retrieval))
  assert.equal(hit.results[0].path, 'docs/navigation.md')
  assert.match(hit.results[0].content, new RegExp(version.replaceAll('.', '\\.')))
  console.log(
    JSON.stringify({
      version,
      queryMs: Math.round(performance.now() - before),
      top: hit.results[0].path,
    }),
  )

  const releases = await searchIndex({
    ...options,
    documents: documents.filter((d) => d.corpus === 'changelog'),
    query: 'remember form input when switching pages',
  })

  assert.equal(releases.results[0].releaseVersion, version)
  globalThis.fetch = fetch
}

// Use actual maintained guides as a small, repeatable retrieval evaluation.
const root = fileURLToPath(new URL('../../../', import.meta.url))
const paths = [
  'docs/app/navigation.md',
  'docs/app/local-storage.md',
  'docs/platform/media-services.md',
  'docs/testing/test-identifiers.md',
]

const documents = paths.map((path) => ({
  path,
  corpus: 'guide',
  content: readFileSync(join(root, path), 'utf8'),
}))

const guideOptions = { documents, binding: 'maintained-guides', cacheDir }
const prepared = await prepareIndex(guideOptions)
const cases = [
  ['ask for confirmation before throwing away unfinished form changes', 'docs/app/navigation.md'],
  ['keep saved records after closing and reopening the database', 'docs/app/local-storage.md'],
  ['get query results as positional arrays instead of objects', 'docs/app/local-storage.md'],
  ['capture a voice memo from the microphone', 'docs/platform/media-services.md'],
  ['make speech faster while keeping its pitch', 'docs/platform/media-services.md'],
  [
    'stable automation selectors after the interface is translated',
    'docs/testing/test-identifiers.md',
  ],
]

const evaluation = []
globalThis.fetch = () => {
  throw new Error('Guide search attempted network access')
}

try {
  for (const [query, expected] of cases) {
    const found = await searchIndex({ ...guideOptions, query, limit: 3 })
    assert.equal(found.retrieval.used, 'hybrid', JSON.stringify(found.retrieval))
    evaluation.push({
      query,
      expected,
      passed: found.results.some((r) => r.path === expected),
      hits: found.results.map((r) => ({ path: r.path, heading: r.heading })),
    })
  }
} finally {
  globalThis.fetch = originalFetch
}

console.log(JSON.stringify({ guideChunks: prepared.chunks, evaluation }))
assert.ok(
  evaluation.every((result) => result.passed),
  JSON.stringify(evaluation),
)

const size = (dir) =>
  readdirSync(dir, { withFileTypes: true }).reduce(
    (sum, e) =>
      sum + (e.isDirectory() ? size(join(dir, e.name)) : statSync(join(dir, e.name)).size),
    0,
  )

console.log(
  JSON.stringify({
    runtime: process.versions.bun ? `bun ${process.versions.bun}` : process.version,
    model: MODEL,
    totalMs: Math.round(performance.now() - start),
    cacheBytes: size(cacheDir),
  }),
)
