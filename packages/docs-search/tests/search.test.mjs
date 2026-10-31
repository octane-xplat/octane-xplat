import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { chunkMarkdown, prepareIndex, searchIndex } from '../src/index.ts'

const document = (path, content, corpus = 'guide') => ({ path, content, corpus })
const embedder = () => ({
	id: 'fixture-v1',
	calls: 0,
	async embed(texts) {
		this.calls += texts.length
		return texts.map((text) => (/retain|preserve|remember/i.test(text) ? [1, 0] : [0, 1]))
	},
})

function fixture(t) {
	const cacheDir = mkdtempSync(join(tmpdir(), 'xplat-docs-search-'))
	t.after(() => rmSync(cacheDir, { recursive: true, force: true }))
	return { cacheDir, binding: 'release-a', embedder: embedder() }
}

test('chunks preserve fenced headings, examples, source lines and historical release identity', () => {
	const content =
		'# Changelog\n\n## [Octane Xplat 2.0.0](tag) - 2026-10-31\n\n### Retain screens\n\nUse retention.\n\n```ts\n// example\n# not a heading\n```\n\n## [Octane Xplat 1.0.0](tag) - 2026-09-01\n\n### Earlier feature\n\nOld behavior.\n'
	const chunks = chunkMarkdown(document('CHANGELOG.md', content, 'changelog'))
	const hit = chunks.find((c) => c.heading === 'Retain screens')
	assert.equal(hit.releaseVersion, '2.0.0')
	assert.equal(hit.releaseDate, '2026-10-31')
	assert.match(hit.content, /```ts\n\/\/ example\n# not a heading\n```/)
	assert.equal(
		hit.content,
		content
			.split('\n')
			.slice(hit.line - 1, hit.endLine)
			.join('\n')
			.trim(),
	)
	assert.equal(chunks.at(-1).releaseVersion, '1.0.0')
})

test('hybrid retrieves paraphrases, reuses embeddings and isolates version snapshots', async (t) => {
	const ctx = fixture(t)
	const documents = [
		document('routes.md', '# Navigation\n\nRetain inactive screens.'),
		document('camera.md', '# Photography\n\nTake pictures.'),
	]
	const cold = await searchIndex({ ...ctx, documents, query: 'remember' })
	assert.equal(cold.retrieval.reason, 'index-not-ready')
	assert.equal(ctx.embedder.calls, 0)
	const first = await prepareIndex({ ...ctx, documents })
	assert.equal(first.embedded, 2)
	let prepared = 0
	ctx.embedder.prepare = async () => {
		prepared++
	}
	assert.equal((await prepareIndex({ ...ctx, documents })).embedded, 0)
	assert.equal(
		prepared,
		1,
		'Preparation must repair/check model files even when embeddings are cached',
	)
	const found = await searchIndex({ ...ctx, documents, query: 'remember' })
	assert.equal(found.retrieval.used, 'hybrid')
	assert.equal(found.results[0].path, 'routes.md')
	assert.equal(found.results.length, 1)
	const changed = [document('camera.md', '# Photography\n\nTake pictures.')]
	const newer = await searchIndex({
		...ctx,
		binding: 'release-b',
		documents: changed,
		query: 'remember',
	})
	assert.equal(newer.results.length, 0)
	assert.notEqual(found.retrieval.snapshot, newer.retrieval.snapshot)
})

test('content changes invalidate linked checkout embeddings; unchanged files remain reusable', async (t) => {
	const ctx = fixture(t)
	const documents = [document('routes.md', '# Navigation\n\nRetain screens.')]
	await prepareIndex({ ...ctx, documents })
	const edited = [document('routes.md', '# Navigation\n\nDestroy screens.')]
	const cold = await searchIndex({ ...ctx, documents: edited, query: 'screens' })
	assert.equal(cold.retrieval.reason, 'index-not-ready')
	assert.match(cold.results[0].content, /Destroy/)
	assert.equal((await prepareIndex({ ...ctx, documents: edited })).embedded, 1)
})

test('keyword identifiers survive punctuation; unavailable model falls back explicitly', async (t) => {
	const ctx = fixture(t)
	const documents = [document('api.md', '# API\n\nUse RouteOutlet and captureV2().')]
	await prepareIndex({ ...ctx, documents })
	const broken = {
		id: ctx.embedder.id,
		async embed() {
			throw new Error('offline')
		},
	}
	const found = await searchIndex({
		...ctx,
		embedder: broken,
		documents,
		query: 'captureV2() " OR *',
	})
	assert.equal(found.retrieval.reason, 'model-unavailable')
	assert.equal(found.results[0].path, 'api.md')
	const exact = await searchIndex({
		...ctx,
		embedder: broken,
		documents,
		mode: 'lexical',
		query: 'RouteOutlet',
	})
	assert.equal(exact.retrieval.used, 'lexical')
	assert.equal(exact.retrieval.reason, undefined)
})
