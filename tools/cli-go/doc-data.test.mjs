import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { listDocs, readPage, parseDocRef } from '../../packages/cli/src/mcp/docs-retrieval.ts'
import { chunkMarkdown } from '../../packages/docs-search/src/chunks.ts'
import { scratchRun } from '../cli-nim/scratch.mjs'
import { nativeInputs } from './native-inputs.mjs'
const root = resolve(import.meta.dirname, '../..')
const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(
	root,
	`research/go-cli/xplat-go-${host}${process.platform === 'win32' ? '.exe' : ''}`,
)
assert.deepEqual(JSON.parse(readFileSync(binary + '.json')).inputs, nativeInputs(root))
const scratch = scratchRun(root, 'go-doc-data'),
	fixture = join(scratch, 'snapshot')
function put(path, content) {
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, content)
	return path
}
const markdown = '# Camera guide\n\nUse 🚀 on web and ios.\n\n## Capture\n\nTake a photo.\n'
for (const path of [
	'docs/camera.md',
	'docs/notes/design.md',
	'.agents/design/a.md',
	'.agents/docs/notes/adapter.md',
	'.agents/docs/recipes/camera.md',
	'recipes/legacy.md',
	'CHANGELOG.md',
	'FIXLOG.md',
	'packages/ui/README.md',
	'packages/tsrx-typegen/CHANGELOG.md',
]) {
	put(join(fixture, path), markdown)
}
function native(request) {
	const file = put(join(scratch, 'request.json'), JSON.stringify(request))
	const result = spawnSync(binary, ['doc-data', '--request', file], {
		encoding: 'utf8',
		timeout: 10000,
		env: { ...process.env, PATH: '' },
	})
	assert.equal(result.stderr, '')
	assert.equal(result.status, 0, result.stdout)
	return JSON.parse(result.stdout)
}
test('native inventory keeps corpus distinctions and matches ordinary reference documents', () => {
	const actual = native({ operation: 'list', root: fixture })
	const expected = listDocs(fixture)
		.map(({ path, corpus }) => ({ path, corpus }))
		.sort((a, b) => (a.path < b.path ? -1 : 1))
	assert.deepEqual(actual, expected)
	assert.equal(actual.find((doc) => doc.path === 'docs/notes/design.md').corpus, 'design-note')
	assert.equal(actual.find((doc) => doc.path === '.agents/docs/recipes/camera.md').corpus, 'recipe')
})
test('native page continuation and versioned refs match the independent reference', () => {
	const rocket = markdown.indexOf('🚀')
	for (const [offset, limit] of [
		[0, 24000],
		[rocket, 1],
		[rocket + 1, 1],
		[10, 12],
		[1e30, 1],
	]) {
		const actual = native({
			operation: 'page',
			root: fixture,
			path: 'docs/camera.md',
			values: { offset, limit },
		})
		assert.deepEqual(actual, readPage(fixture, 'docs/camera.md', { offset, limit }))
	}
	for (const ref of [
		'xplat-doc://@octane-xplat/ui@0.19.0/docs/camera.md',
		'xplat-doc://@octane-xplat/ui@development/docs/at@name.md',
		'xplat-doc://tsrx-typegen@1.0.0/CHANGELOG.md',
		'invalid',
	]) {
		assert.deepEqual(native({ operation: 'ref', ref }), parseDocRef(ref))
	}
})
test('Markdown chunks preserve fences, heading ranges and release metadata', () => {
	const samples = [
		markdown,
		'# Changelog\n\n## [v0.19.0] 2026-11-01\n\nCamera supports web.\n\n```md\n## not a release\n```\n\n## v0.18.0 2026-10-01\n\nOlder feature\n',
		'# Long\n\n' + 'A paragraph with Unicode 🚀 text. '.repeat(50) + '\n\n## Next\n\nend\n',
	]
	for (const corpus of ['guide', 'changelog']) {
		for (const content of samples) {
			const request = { operation: 'chunks', path: 'docs/changes.md', corpus, content }
			const expected = JSON.parse(
				JSON.stringify(chunkMarkdown({ path: request.path, corpus, content })),
			)
			assert.deepEqual(native(request), expected)
		}
	}
})
test('document aliases stay within an eligible corpus and directory cycles are skipped', () => {
	const outside = put(join(scratch, 'outside.md'), 'Outside sentinel')
	put(join(fixture, 'private/secret.md'), 'Private sentinel')
	symlinkSync(outside, join(fixture, 'docs/outside.md'))
	symlinkSync(join(fixture, 'private/secret.md'), join(fixture, 'docs/private-alias.md'))
	symlinkSync(join(fixture, 'docs/camera.md'), join(fixture, 'docs/safe-alias.md'))
	symlinkSync(
		join(fixture, 'docs'),
		join(fixture, 'docs/cycle'),
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	for (const path of [
		'private/secret.md',
		'docs/outside.md',
		'docs/private-alias.md',
		'../outside.md',
		'docs/../../outside.md',
	]) {
		assert.ok(native({ operation: 'page', root: fixture, path }).error, path)
	}
	assert.equal(
		native({ operation: 'page', root: fixture, path: 'docs/safe-alias.md' }).content,
		markdown,
	)
	const docs = native({ operation: 'list', root: fixture })
	assert.ok(docs.some((doc) => doc.path === 'docs/safe-alias.md'))
	assert.ok(!docs.some((doc) => /cycle|outside|private/.test(doc.path)))
})
after(() => rmSync(scratch, { recursive: true, force: true }))
