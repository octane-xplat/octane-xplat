// Explicit local-model qualification; excluded from the ordinary offline test task.
import assert from 'node:assert/strict'
import { mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { prepareIndex, searchIndex, MODEL } from '../dist/index.js'

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
