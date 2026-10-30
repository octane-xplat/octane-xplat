#!/usr/bin/env node
// Nightly publish decision for release.yml's scheduled run. The newest green
// main CI revision publishes `0.0.0-nightly.g<sha7>` only when the published
// nightly is missing, unreadable, or older than publishable changes — a daily
// cron should not republish an unchanged tree.
//
// Usage: node scripts/release-nightly.ts <candidate sha>
// Prints publish=, version=, reason= lines for GITHUB_OUTPUT.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RELEASES } from './release-version.ts'

// Publishable surface: the lockstep package set (with its existing
// non-published package exclusions) plus workspace wiring that changes what
// consumers install.
export const NIGHTLY_PATHS = [...RELEASES.lockstep.paths, 'package.json', 'bunfig.toml', 'bun.lock']

const NIGHTLY_PATTERN = /^0\.0\.0-nightly\.g([0-9a-f]{7,})$/

export function nightlyDecision({
	root,
	candidate,
	published,
}: {
	root: string
	candidate: string
	published: string | undefined
}) {
	const version = `0.0.0-nightly.g${candidate.slice(0, 7)}`
	const decide = (publish: boolean, reason: string) => ({ publish, version, reason })
	if (!published) {
		return decide(true, 'no nightly is published yet')
	}
	const match = NIGHTLY_PATTERN.exec(published)
	if (!match) {
		return decide(true, `published nightly ${published} is not a commit-stamped prerelease`)
	}
	const publishedSha = match[1]
	// --verify --quiet fails for unknown and ambiguous revisions alike.
	const resolved = spawnSync(
		'git',
		['rev-parse', '--verify', '--quiet', `${publishedSha}^{commit}`],
		{ cwd: root, encoding: 'utf8' },
	)
	const publishedCommit = resolved.status === 0 ? resolved.stdout.trim() : ''
	if (!publishedCommit) {
		return decide(true, `published commit g${publishedSha} is not in this repository`)
	}
	const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', candidate, publishedCommit], {
		cwd: root,
	})
	if (ancestor.status === 0) {
		return decide(false, `${version} is already published`)
	}
	const diff = spawnSync(
		'git',
		['diff', '--quiet', publishedCommit, candidate, '--', ...NIGHTLY_PATHS],
		{ cwd: root },
	)
	if (diff.status === 0) {
		return decide(false, `no publishable changes since g${publishedSha.slice(0, 7)}`)
	}
	return decide(true, `publishable changes since g${publishedSha.slice(0, 7)}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		const candidate = process.argv[2]
		assert.ok(candidate, 'usage: node scripts/release-nightly.ts <sha>')
		let published: string | undefined
		try {
			published =
				execFileSync('npm', ['view', '@octane-xplat/ui', 'dist-tags.nightly'], {
					encoding: 'utf8',
					stdio: ['ignore', 'pipe', 'pipe'],
				}).trim() || undefined
		} catch {
			published = undefined
		}
		const { publish, version, reason } = nightlyDecision({
			root: process.cwd(),
			candidate,
			published,
		})
		console.log(`publish=${publish}\nversion=${version}\nreason=${reason}`)
	} catch (error) {
		console.error(error.message)
		process.exitCode = 1
	}
}
