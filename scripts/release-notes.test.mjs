import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'
import { prepareNotes, readNotes, renderNotes } from './release-notes.ts'
import { commitBump, releaseVersion, resolveRelease } from './release-version.ts'

const workflow = parse(readFileSync('.github/workflows/release.yml', 'utf8'))
const versionScript = resolve('scripts/release-version.ts')
const notesScript = resolve('scripts/release-notes.ts')
const bot = '41898282+github-actions[bot]@users.noreply.github.com'

function fixture(t) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-release-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	return root
}

function write(root, path, content) {
	mkdirSync(dirname(join(root, path)), { recursive: true })
	writeFileSync(join(root, path), content)
}

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

function init(root) {
	git(root, 'init', '-q', '--initial-branch=main')
	git(root, 'config', 'user.name', 'Release test')
	git(root, 'config', 'user.email', 'release-test@example.invalid')
}

function commit(root, message, path = 'packages/ui/src/example.ts') {
	if (path) {
		write(root, path, message + '\n')
	}
	git(root, 'add', '-A')
	git(root, 'commit', '-qm', message)
}

function note(release, title, description = 'A concise explanation.') {
	const header = release ? `---\nrelease: ${release}\n---\n\n` : ''
	return `${header}### ${title}\n\n${description}\n`
}

test('version policy includes supported commits and breaking changes, independently of notes', () => {
	for (const [message, expected] of [
		['feat(ui): add a feature', 'minor'],
		['fix(ui): repair a behavior', 'patch'],
		['perf: speed up a list', 'patch'],
		['refactor: simplify a helper', 'patch'],
		['revert: revert a change', 'patch'],
		['feat(ui)!: remove a prop', 'breaking'],
		['chore: update tooling\n\nBREAKING CHANGE: new setup required', 'breaking'],
		['fix: repair types\n\nBREAKING-CHANGE: remove invalid types', 'breaking'],
		['feat(ci)!: change CI setup', undefined],
		['docs: explain a feature', undefined],
		['test: add coverage', undefined],
		['chore: maintenance', undefined],
		['ci: adjust checks', undefined],
		['build: update bundling', undefined],
		['style: format code', undefined],
		['Merge pull request #1', undefined],
		['A plain message\n\nBREAKING CHANGE: still not conventional', undefined],
	]) {
		assert.equal(commitBump(message), expected, message)
	}
})

test('automatic versions filter paths and keep the two streams independent', (t) => {
	const root = fixture(t)
	init(root)
	commit(root, 'chore: initial state')
	git(root, 'tag', 'v0.4.2')
	git(root, 'tag', 'tsrx-typegen-v0.2.7')
	for (const directory of ['app', 'demos', 'media-probe', 'typegen-fixture']) {
		commit(root, 'feat: harness change', `packages/${directory}/example.ts`)
	}
	commit(root, 'feat: tooling change', 'scripts/example.ts')
	commit(root, 'docs: document the API', 'packages/ui/README.md')
	commit(root, 'feat(ci)!: CI-only change')
	commit(root, 'feat: hand-written release note', '.changelog/feature.md')
	assert.deepEqual(resolveRelease(root, 'lockstep'), { shouldRelease: false })
	commit(root, 'feat: improve declarations', 'packages/tsrx-typegen/src/example.ts')
	assert.deepEqual(resolveRelease(root, 'lockstep'), { shouldRelease: false })
	assert.equal(resolveRelease(root, 'tsrx-typegen').version, '0.3.0')
	commit(root, 'fix: repair a behavior')
	assert.equal(resolveRelease(root, 'lockstep').version, '0.4.3')
	commit(root, 'feat: add a feature')
	assert.equal(resolveRelease(root, 'lockstep').version, '0.5.0')
	commit(root, 'refactor!: replace an API')
	assert.equal(resolveRelease(root, 'lockstep').version, '0.5.0')
	git(root, 'tag', 'v1.0.0')
	commit(root, 'fix: repair an API\n\nBREAKING CHANGE: replace a prop')
	assert.equal(resolveRelease(root, 'lockstep').version, '2.0.0')
})

test('version resolution ignores prerelease and unreachable tags, and skips a released revision', (t) => {
	const root = fixture(t)
	init(root)
	commit(root, 'fix: initial implementation')
	assert.equal(resolveRelease(root, 'lockstep').version, '0.1.0')
	git(root, 'tag', 'v0.1.0')
	assert.deepEqual(resolveRelease(root, 'lockstep'), { shouldRelease: false })
	git(root, 'switch', '--orphan', 'unrelated')
	commit(root, 'feat: unrelated history')
	git(root, 'tag', 'v99.0.0')
	git(root, 'switch', 'main')
	commit(root, 'fix: release without a note')
	git(root, 'tag', 'v7.0.0-alpha.1')
	assert.equal(resolveRelease(root, 'lockstep').version, '0.1.1')
	assert.deepEqual(resolveRelease(root, 'lockstep', 'v0.1.0'), {
		shouldRelease: false,
		version: '0.1.0',
		tag: 'v0.1.0',
	})
	assert.equal(resolveRelease(root, 'tsrx-typegen', '0.8.0-rc.1').tag, 'tsrx-typegen-v0.8.0-rc.1')
	const run = spawnSync(process.execPath, [versionScript, 'lockstep'], {
		cwd: root,
		encoding: 'utf8',
		env: { ...process.env, VERSION_OVERRIDE: '' },
	})
	assert.equal(run.status, 0, run.stderr)
	assert.equal(run.stdout, 'should_release=true\nversion=0.1.1\ntag=v0.1.1\n')
})

test('invalid version overrides cannot enter tags or workflow outputs', () => {
	for (const value of [
		'01.2.3',
		'1.2',
		'1.2.3-',
		'1.2.3-alpha..1',
		'1.2.3-01',
		'1.2.3\n',
		'1.2.3\nshould_release=true',
		'$(id)',
		'1.2.9007199254740992',
	]) {
		assert.throws(() => releaseVersion(value), undefined, value)
	}
	assert.equal(releaseVersion('v1.2.3-alpha-beta.1'), '1.2.3-alpha-beta.1')
})

test('preview preserves Markdown and prepare consumes only the selected release', (t) => {
	const root = fixture(t)
	const prior =
		'# Changelog\n\nExisting introduction.\n\n## [0.1.0] - 2026-01-01\n\nOriginal history.\n'
	write(root, 'CHANGELOG.md', prior)
	write(root, 'FIXLOG.md', '# Fixlog\n\nBug fixes.\n')
	write(root, '.changelog/.gitkeep', '')
	const example =
		'Show the change.\n\n```sh\n# A comment inside an example\npnpm xplat doctor\n```\n\n[Documentation](https://octane-xplat.goddardai.org/toolchain)'
	write(root, '.changelog/b-feature.md', note('lockstep', 'Second feature'))
	write(root, '.changelog/a-feature.md', note(undefined, 'First feature', example))
	write(root, '.changelog/fixes/repair.md', note(undefined, 'A repair'))
	const independent = note('tsrx-typegen', 'Better declarations')
	write(root, '.changelog/typegen.md', independent)
	const preview = renderNotes(root, 'lockstep', '0.2.0', '2026-10-23')
	assert.equal(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), prior)
	assert.equal(readNotes(root).length, 4)
	assert.equal(existsSync(join(root, '.release-notes.md')), false)
	assert.ok(preview.github.includes(example))
	assert.ok(preview.github.indexOf('First feature') < preview.github.indexOf('Second feature'))
	assert.match(preview.github, /## Fixes\n\n### A repair/)
	assert.doesNotMatch(preview.github, /release:|Better declarations/)
	prepareNotes(root, 'lockstep', '0.2.0', '2026-10-23')
	const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
	assert.match(changelog, /## \[Octane Xplat 0\.2\.0\].* - 2026-10-23/)
	assert.ok(changelog.endsWith('## [0.1.0] - 2026-01-01\n\nOriginal history.\n'))
	assert.doesNotMatch(changelog, /A repair/)
	assert.match(readFileSync(join(root, 'FIXLOG.md'), 'utf8'), /A repair/)
	assert.equal(readFileSync(join(root, '.release-notes.md'), 'utf8'), preview.github)
	assert.equal(readNotes(root).length, 1)
	assert.equal(readFileSync(join(root, '.changelog/typegen.md'), 'utf8'), independent)
	assert.ok(existsSync(join(root, '.changelog/.gitkeep')))
	assert.throws(() => prepareNotes(root, 'lockstep', '0.2.0'), /already recorded/)
	prepareNotes(root, 'tsrx-typegen', '0.3.0', '2026-10-23')
	assert.match(
		readFileSync(join(root, 'CHANGELOG.md'), 'utf8'),
		/## \[tsrx-typegen 0\.3\.0\].*tsrx-typegen-v0.3.0/,
	)
	assert.equal(readNotes(root).length, 0)
})

test('an unlisted release leaves both histories unchanged and produces usable GitHub notes', (t) => {
	const root = fixture(t)
	write(root, 'CHANGELOG.md', '# Changelog\n')
	write(root, 'FIXLOG.md', '# Fixlog\n')
	write(root, '.changelog/typegen.md', note('tsrx-typegen', 'Pending independent feature'))
	prepareNotes(root, 'lockstep', '0.2.1')
	assert.equal(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), '# Changelog\n')
	assert.equal(readFileSync(join(root, 'FIXLOG.md'), 'utf8'), '# Fixlog\n')
	assert.equal(
		readFileSync(join(root, '.release-notes.md'), 'utf8'),
		'No user-facing release notes for this release.\n',
	)
	assert.equal(readNotes(root).length, 1)
	const preview = spawnSync(process.execPath, [notesScript, 'preview', 'tsrx-typegen', '0.1.0'], {
		cwd: root,
		encoding: 'utf8',
	})
	assert.equal(preview.status, 0, preview.stderr)
	assert.match(preview.stdout, /Pending independent feature/)
	assert.equal(readNotes(root).length, 1)
})

test('invalid fragments fail before logs change or any file is consumed', (t) => {
	const root = fixture(t)
	const path = '.changelog/fixes/invalid.md'
	write(root, 'CHANGELOG.md', '# Changelog\n')
	write(root, 'FIXLOG.md', '# Fixlog\n')
	write(root, '.changelog/good.md', note('lockstep', 'A valid feature'))
	for (const invalid of [
		'---\nrelease: lockstep\n### Unclosed header\n\nDescription.\n',
		'---\n\n---\n\n### Empty header\n\nDescription.\n',
		note('nightly', 'Wrong release'),
		note('lockstep', 'Unknown field').replace(
			'release: lockstep',
			'release: lockstep\nextra: true',
		),
		note('lockstep', 'Duplicate field').replace(
			'release: lockstep',
			'release: lockstep\nrelease: tsrx-typegen',
		),
		note('lockstep', 'Missing description', ''),
		note('lockstep', 'Wrong heading').replace('### Wrong', '## Wrong'),
		note('lockstep', 'Open code fence', '```ts\nconst value = 1'),
		note('lockstep', 'Nested release', '## Another release\n\nDescription.'),
	]) {
		write(root, path, invalid)
		assert.throws(() => prepareNotes(root, 'lockstep', '0.3.0'))
		assert.equal(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), '# Changelog\n')
		assert.equal(readFileSync(join(root, 'FIXLOG.md'), 'utf8'), '# Fixlog\n')
		assert.ok(existsSync(join(root, '.changelog/good.md')))
		assert.equal(readFileSync(join(root, path), 'utf8'), invalid)
		assert.equal(existsSync(join(root, '.release-notes.md')), false)
	}
})

test('both workflows sync shared histories before edits and keep nightly non-consuming', () => {
	assert.ok(workflow.jobs.packages.needs.includes('tsrx-typegen'))
	for (const id of ['packages', 'tsrx-typegen']) {
		const steps = workflow.jobs[id].steps
		const sync = steps.findIndex((step) => step.name === 'Sync preceding release commits')
		const version = steps.findIndex((step) => step.name === 'Resolve release version')
		const notes = steps.findIndex((step) => step.name === 'Prepare release notes')
		assert.ok(sync >= 0 && sync < version && version < notes)
		assert.equal(steps[sync].if, "needs.gate.outputs.channel == 'stable'")
		assert.equal(steps[version].if, "needs.gate.outputs.channel == 'stable'")
		assert.equal(steps[notes].if, "steps.version.outputs.should_release == 'true'")
		const commitStep = steps.find((step) => step.name === 'Commit and tag release')
		assert.match(commitStep.run, /CHANGELOG\.md FIXLOG\.md \.changelog/)
		assert.doesNotMatch(
			steps.map((step) => step.run ?? step.uses ?? '').join('\n'),
			/git-cliff|--rebase/,
		)
	}
})

test('actual workflow sync preserves the first stream and rejects untested main changes', (t) => {
	const root = fixture(t)
	const first = join(root, 'first')
	const second = join(root, 'second')
	const remote = join(root, 'origin.git')
	mkdirSync(first)
	init(first)
	write(first, 'CHANGELOG.md', '# Changelog\n')
	write(first, 'FIXLOG.md', '# Fixlog\n')
	write(first, '.changelog/feature.md', note('lockstep', 'Main feature'))
	write(first, '.changelog/typegen.md', note('tsrx-typegen', 'Independent feature'))
	write(first, '.changelog/fixes/repair.md', note('lockstep', 'Main fix'))
	write(first, '.changelog/fixes/typegen.md', note('tsrx-typegen', 'Independent fix'))
	commit(first, 'feat: tested changes')
	const tested = git(first, 'rev-parse', 'HEAD')
	git(root, 'init', '--bare', '-q', remote)
	git(first, 'remote', 'add', 'origin', remote)
	git(first, 'push', '-q', 'origin', 'HEAD:main')
	git(root, 'clone', '-q', '--branch', 'main', remote, second)
	git(second, 'checkout', '--detach', tested)
	prepareNotes(first, 'tsrx-typegen', '0.3.0')
	git(first, 'add', '-A')
	git(first, '-c', `user.email=${bot}`, 'commit', '-qm', 'chore(release): tsrx-typegen 0.3.0')
	git(first, 'push', '-q', 'origin', 'HEAD:main')
	const sync = workflow.jobs.packages.steps.find(
		(step) => step.name === 'Sync preceding release commits',
	)
	const runSync = () =>
		spawnSync('bash', ['-c', sync.run], {
			cwd: second,
			env: { ...process.env, TESTED_SHA: tested },
			encoding: 'utf8',
		})
	const result = runSync()
	assert.equal(result.status, 0, result.stderr)
	prepareNotes(second, 'lockstep', '0.4.0')
	for (const file of ['CHANGELOG.md', 'FIXLOG.md']) {
		const history = readFileSync(join(second, file), 'utf8')
		assert.match(history, /Octane Xplat 0\.4\.0/)
		assert.match(history, /tsrx-typegen 0\.3\.0/)
	}
	assert.equal(readNotes(second).length, 0)
	commit(first, 'fix: untested change')
	git(first, 'push', '-q', 'origin', 'HEAD:main')
	const rejected = runSync()
	assert.notEqual(rejected.status, 0)
	assert.match(rejected.stderr, /non-release commits/)
})
