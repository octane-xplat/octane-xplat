import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { NIGHTLY_PATHS, nightlyDecision } from './release-nightly.ts'

function git(root, ...args) {
	return execFileSync(
		'git',
		['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args],
		{
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		},
	).trim()
}

function fixture(t) {
	const root = mkdtempSync(join(tmpdir(), 'nightly-test-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	git(root, 'init', '-q', '--initial-branch=main')
	git(root, 'config', 'user.name', 'Nightly test')
	git(root, 'config', 'user.email', 'nightly-test@example.invalid')
	return root
}

function commit(root, message, path = 'packages/ui/src/example.ts') {
	if (path) {
		mkdirSync(dirname(join(root, path)), { recursive: true })
		writeFileSync(join(root, path), message + '\n')
	}
	git(root, 'add', '-A')
	git(root, 'commit', '-qm', message)
	return git(root, 'rev-parse', 'HEAD')
}

const nightly = (sha) => `0.0.0-nightly.g${sha.slice(0, 7)}`

test('NIGHTLY_PATHS extends the lockstep publish set with workspace wiring', () => {
	assert.ok(NIGHTLY_PATHS.includes('packages/**'))
	assert.ok(NIGHTLY_PATHS.includes(':(exclude)packages/tsrx-typegen/**'))
	assert.ok(NIGHTLY_PATHS.includes('pnpm-workspace.yaml'))
	assert.ok(NIGHTLY_PATHS.includes('pnpm-lock.yaml'))
})

test('nightlyDecision publishes when no nightly exists or it is unreadable', (t) => {
	const root = fixture(t)
	const candidate = commit(root, 'feat: first')
	assert.equal(
		nightlyDecision({ root, candidate, published: undefined }).publish,
		true,
		'first publish',
	)
	assert.equal(
		nightlyDecision({ root, candidate, published: 'latest' }).publish,
		true,
		'malformed published version',
	)
	assert.equal(
		nightlyDecision({ root, candidate, published: '0.0.0-nightly.gfffffff' }).publish,
		true,
		'published commit is not in this repository',
	)
	assert.match(
		nightlyDecision({ root, candidate, published: undefined }).version,
		/^0\.0\.0-nightly\.g[0-9a-f]{7}$/,
	)
})

test('nightlyDecision skips when the candidate is already published', (t) => {
	const root = fixture(t)
	const published = commit(root, 'feat: base')
	assert.equal(
		nightlyDecision({ root, candidate: published, published: nightly(published) }).publish,
		false,
	)
	// An older candidate than the published nightly is also skipped.
	const candidate = published
	const newer = commit(root, 'fix: newer', 'packages/ui/src/newer.ts')
	assert.equal(
		nightlyDecision({ root, candidate, published: nightly(newer) }).publish,
		false,
	)
})

test('nightlyDecision ignores changes outside the publishable surface', (t) => {
	const root = fixture(t)
	const published = commit(root, 'feat: base')
	commit(root, 'docs: app page', 'apps/web/src/page.tsx')
	const candidate = commit(root, 'chore: excluded package', 'packages/tsrx-typegen/src/gen.ts')
	const decision = nightlyDecision({ root, candidate, published: nightly(published) })
	assert.equal(decision.publish, false)
	assert.match(decision.reason, /no publishable changes/)
})

test('nightlyDecision publishes for lockstep paths and workspace wiring', (t) => {
	const root = fixture(t)
	const published = commit(root, 'feat: base')
	for (const [message, path] of [
		['fix: package change', 'packages/ui/src/fix.ts'],
		['chore: workspace wiring', 'pnpm-workspace.yaml'],
		['chore: lockfile', 'pnpm-lock.yaml'],
	]) {
		commit(root, message, path)
		const decision = nightlyDecision({
			root,
			candidate: git(root, 'rev-parse', 'HEAD'),
			published: nightly(published),
		})
		assert.equal(decision.publish, true, `${message} (${path})`)
		assert.match(decision.reason, /publishable changes/)
	}
})
