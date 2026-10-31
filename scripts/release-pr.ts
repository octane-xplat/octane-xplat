#!/usr/bin/env node
// Release-PR body and version-override helpers for release-pr.yml. The
// workflow keeps the override in an HTML comment in the PR body so a manual
// `workflow_dispatch` can change or clear it; inference is the default.
//
// Usage:
//   node scripts/release-pr.ts override <input>        # reads existing body on stdin
//   node scripts/release-pr.ts body <version> <notes-file> [override]
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { releaseVersion } from './release-version.ts'

const OVERRIDE_PATTERN = /<!-- release-version-override: (\S+) -->/

export function readOverride(body: string): string | undefined {
	return OVERRIDE_PATTERN.exec(body)?.[1]
}

// '' keeps whatever the PR body already declares; 'auto' clears the override
// and returns to Conventional Commit inference; anything else must be a
// valid semver override.
export function resolveOverride(input: string, body: string | undefined): string | undefined {
	if (input === 'auto') {
		return undefined
	}
	if (input) {
		return releaseVersion(input)
	}
	return body ? readOverride(body) : undefined
}

// GitHub rejects pull request bodies over 65,536 characters. Large releases
// exceed that, so the notes get truncated at a paragraph boundary with a
// pointer to the full file on the release branch.
const BODY_LIMIT = 65000

function truncateNotes(notes: string, budget: number): string {
	const trimmed = notes.trim()
	if (trimmed.length <= budget) {
		return trimmed
	}
	const boundary = trimmed.lastIndexOf('\n\n', budget)
	const cut = boundary > 0 ? trimmed.slice(0, boundary) : trimmed.slice(0, budget)
	return (
		cut.trimEnd() +
		'\n\n---\n\n_Notes truncated to fit GitHub’s pull request body limit — ' +
		'the full text is in `.release-notes.md` on this branch._'
	)
}

export function renderReleaseBody({
	version,
	override,
	notes,
}: {
	version: string
	override?: string
	notes: string
}): string {
	const preamble = [
		'<!-- xplat-release: lockstep -->',
		...(override ? [`<!-- release-version-override: ${override} -->`] : []),
		'',
		`Merging this pull request releases **Octane Xplat ${version}** once \`main\` CI passes on the merged commit. If this exact tree already passed **Stable CI** on this pull request, publishing starts immediately; otherwise the release workflow runs Stable CI on the merged commit first.`,
		'',
		'Mark the pull request ready for review to run Stable CI. The branch is rebuilt from `main` after every push. To choose a different version, run `gh workflow run release-pr.yml -f version=<x.y.z>`; `-f version=auto` returns to inference.',
		'',
		'---',
		'',
		'',
	].join('\n')
	return preamble + truncateNotes(notes, BODY_LIMIT - preamble.length - 1) + '\n'
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		const [command, ...rest] = process.argv.slice(2)
		if (command === 'override') {
			assert.equal(rest.length, 1, 'usage: node scripts/release-pr.ts override <input>')
			const body = readFileSync(0, 'utf8')
			console.log(resolveOverride(rest[0], body || undefined) ?? '')
		} else if (command === 'body') {
			assert.ok(
				rest.length === 2 || rest.length === 3,
				'usage: node scripts/release-pr.ts body <version> <notes-file> [override]',
			)
			const [version, notesFile, override] = rest
			process.stdout.write(
				renderReleaseBody({
					version: releaseVersion(version),
					override: override ? releaseVersion(override) : undefined,
					notes: readFileSync(notesFile, 'utf8'),
				}),
			)
		} else {
			assert.fail(
				'usage: node scripts/release-pr.ts <override <input>|body <version> <notes-file> [override]>',
			)
		}
	} catch (error) {
		console.error(error.message)
		process.exitCode = 1
	}
}
