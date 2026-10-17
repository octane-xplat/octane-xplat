import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

// The package pass roots at process.cwd(), so a fixture app directory can
// stand in for a consumer checkout. A malformed .tsrx reports `path: error`
// on stderr and fails the run — that line is the signal that a file was
// collected and linted.
const lintScript = fileURLToPath(new URL('../packages/lint/src/lint-tsrx.ts', import.meta.url))
const broken = 'const x = {'

const fixture = (t) => {
	// realpath: macOS /var -> /private/var, and the pass reports paths
	// relative to its own cwd.
	const dir = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-lint-tsrx-')))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	writeFileSync(join(dir, '.oxlintrc.json'), '{"rules":{}}')
	return dir
}

const addFile = (dir, path, source = broken) => {
	const file = join(dir, path)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, source)
}

const lint = (dir) => spawnSync(process.execPath, [lintScript], { cwd: dir, encoding: 'utf8' })

test('lint-tsrx stops at nested repository boundaries', (t) => {
	const dir = fixture(t)

	// The scan root is itself a repository; its files are still linted.
	mkdirSync(join(dir, '.git'))
	addFile(dir, 'broken.tsrx')
	addFile(dir, 'src/ordinary/broken.tsrx')

	// A regular clone carries a .git directory.
	mkdirSync(join(dir, 'nested-checkout/.git'), { recursive: true })
	addFile(dir, 'nested-checkout/broken.tsrx')

	// A linked worktree or submodule checkout carries a .git file.
	addFile(dir, 'linked-worktree/.git', 'gitdir: /elsewhere\n')
	addFile(dir, 'linked-worktree/broken.tsrx')
	addFile(dir, 'linked-worktree/deep/broken.tsrx')

	const run = lint(dir)
	assert.equal(run.status, 1, run.stderr)
	assert.match(run.stderr, /^broken\.tsrx:/m)
	assert.match(run.stderr, /^src\/ordinary\/broken\.tsrx:/m)
	assert.doesNotMatch(run.stderr, /nested-checkout/)
	assert.doesNotMatch(run.stderr, /linked-worktree/)
})

test('lint-tsrx passes a clean tree that contains a nested repository', (t) => {
	const dir = fixture(t)
	addFile(dir, 'ok.tsrx', 'export const x = 1\n')
	mkdirSync(join(dir, 'nested-checkout/.git'), { recursive: true })
	addFile(dir, 'nested-checkout/broken.tsrx')

	const run = lint(dir)
	assert.equal(run.status, 0, run.stderr)
	assert.doesNotMatch(run.stderr, /nested-checkout/)
})
