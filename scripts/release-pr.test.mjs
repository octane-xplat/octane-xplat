import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { readOverride, renderReleaseBody, resolveOverride } from './release-pr.ts'

const script = resolve('scripts/release-pr.ts')

const existingBody = [
	'<!-- xplat-release: lockstep -->',
	'<!-- release-version-override: 0.9.1 -->',
	'',
	'Merging this pull request releases **Octane Xplat 0.9.1** …',
].join('\n')

test('readOverride parses the marker comment', () => {
	assert.equal(readOverride(existingBody), '0.9.1')
	assert.equal(readOverride('<!-- release-version-override: 1.0.0-rc.1 -->'), '1.0.0-rc.1')
	assert.equal(readOverride('no marker here'), undefined)
	assert.equal(readOverride(''), undefined)
})

test('resolveOverride keeps, clears, or sets the override by input', () => {
	assert.equal(resolveOverride('', existingBody), '0.9.1')
	assert.equal(resolveOverride('', undefined), undefined)
	assert.equal(resolveOverride('', 'plain body'), undefined)
	assert.equal(resolveOverride('auto', existingBody), undefined)
	assert.equal(resolveOverride('0.10.0', existingBody), '0.10.0')
	assert.equal(resolveOverride('v1.2.3', undefined), '1.2.3')
	assert.throws(() => resolveOverride('soon', undefined))
})

test('renderReleaseBody carries the marker, an optional override, and the notes', () => {
	const notes = '## Features and breaking changes\n\n### A feature\n\nDescription.\n'
	const body = renderReleaseBody({ version: '0.9.1', override: '0.9.1', notes })
	assert.match(
		body,
		/^<!-- xplat-release: lockstep -->\n<!-- release-version-override: 0\.9\.1 -->\n/,
	)
	assert.match(body, /\*\*Octane Xplat 0\.9\.1\*\*/)
	assert.match(body, /gh workflow run release-pr\.yml -f version=<x\.y\.z>/)
	assert.ok(body.endsWith(`---\n\n${notes.trim()}\n`))

	const inferred = renderReleaseBody({ version: '0.10.0', notes })
	assert.match(inferred, /^<!-- xplat-release: lockstep -->\n\nMerging/)
	assert.doesNotMatch(inferred, /release-version-override/)
})

test('renderReleaseBody truncates oversized notes at a paragraph boundary', () => {
	const entry = (n) => `### Entry ${n}\n\n${'x'.repeat(5000)}\n`
	const notes = Array.from({ length: 20 }, (_, i) => entry(i)).join('\n')
	const body = renderReleaseBody({ version: '0.9.1', notes })
	assert.ok(body.length <= 65536, `body length ${body.length}`)
	assert.match(body, /truncated to fit GitHub’s pull request body limit/)
	assert.match(body, /\.release-notes\.md/)
	assert.doesNotMatch(body, /### Entry 19/)
	assert.ok(!body.includes(`${'x'.repeat(4990)}${'x'.repeat(20)}y`))
})

test('override subcommand reads the existing body on stdin', () => {
	for (const [input, stdin, expected] of [
		['', existingBody, '0.9.1\n'],
		['', '', '\n'],
		['auto', existingBody, '\n'],
		['0.11.0', existingBody, '0.11.0\n'],
	]) {
		const run = spawnSync(process.execPath, [script, 'override', input], {
			encoding: 'utf8',
			input: stdin,
		})
		assert.equal(run.status, 0, run.stderr)
		assert.equal(run.stdout, expected, `input=${input}`)
	}
})

test('body subcommand renders from a notes file', (t) => {
	const directory = mkdtempSync(join(tmpdir(), 'release-pr-test-'))
	t.after(() => rmSync(directory, { recursive: true, force: true }))
	const notesFile = join(directory, 'notes.md')
	writeFileSync(notesFile, '## Fixes\n\n### A fix\n\nDescription.\n')
	const run = spawnSync(process.execPath, [script, 'body', '0.9.1', notesFile, '0.9.1'], {
		encoding: 'utf8',
	})
	assert.equal(run.status, 0, run.stderr)
	assert.match(run.stdout, /<!-- release-version-override: 0\.9\.1 -->/)
	assert.match(run.stdout, /## Fixes\n\n### A fix/)

	const invalid = spawnSync(process.execPath, [script, 'body', 'not-a-version', notesFile], {
		encoding: 'utf8',
	})
	assert.notEqual(invalid.status, 0)
})
