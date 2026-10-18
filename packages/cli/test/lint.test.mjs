import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const alias = fileURLToPath(new URL('../../lint/bin/lint.mjs', import.meta.url))
const plugin = fileURLToPath(new URL('../../lint/dist/oxlint-plugin.js', import.meta.url))
const run = (args, cwd) =>
	spawnSync(process.execPath, [cli, 'lint', ...args], { cwd, encoding: 'utf8' })

const output = (result) => result.stdout + result.stderr
const BAD = "console.debug('remove this')\n"
const FIXABLE = 'export function positive(n: number) { if (n > 0) return true; return false }\n'

function app(t, files = {}) {
	const cwd = mkdtempSync(join(tmpdir(), 'xplat-lint-test-'))
	t.after(() => rmSync(cwd, { recursive: true, force: true }))
	for (const [name, contents] of Object.entries(files)) {
		mkdirSync(dirname(join(cwd, name)), { recursive: true })
		writeFileSync(join(cwd, name), contents)
	}
	return cwd
}

const config = (rules = {}, rest = {}) => JSON.stringify({ jsPlugins: [plugin], rules, ...rest })

test('lint defaults check regular source and TSRX without changing either file', (t) => {
	const cwd = app(t, { 'a.ts': BAD, 'b.tsrx': BAD })
	const result = run([], cwd)
	assert.equal(result.status, 1, output(result))
	assert.match(output(result), /a\.ts/)
	assert.match(output(result), /b\.tsrx/)
	assert.match(output(result), /xplat[(/]no-console-debug/)
	assert.equal(readFileSync(join(cwd, 'a.ts'), 'utf8'), BAD)
	assert.equal(readFileSync(join(cwd, 'b.tsrx'), 'utf8'), BAD)
})

test('lint --fix applies safe fixes, leaves formatting to fmt, and rechecks cleanly', (t) => {
	const cwd = app(t, { 'a.ts': FIXABLE + 'export const   untouched=1\n' })
	assert.equal(run([], cwd).status, 1)
	const fixed = run(['--fix'], cwd)
	assert.equal(fixed.status, 0, output(fixed))
	const source = readFileSync(join(cwd, 'a.ts'), 'utf8')
	assert.match(source, /if \(n > 0\) \{\s*return true;?\s*\}/)
	assert.match(source, /const   untouched=1/)
	assert.equal(run([], cwd).status, 0)
})

test('lint --fix still fails for remaining findings and preserves TSRX source', (t) => {
	const cwd = app(t, { 'a.ts': FIXABLE, 'b.tsrx': BAD })
	const result = run(['--fix'], cwd)
	assert.equal(result.status, 1, output(result))
	assert.notEqual(readFileSync(join(cwd, 'a.ts'), 'utf8'), FIXABLE)
	assert.equal(readFileSync(join(cwd, 'b.tsrx'), 'utf8'), BAD)
	assert.match(output(result), /b\.tsrx/)
})

test('lint selects explicit files and directories in both passes, without duplicates', (t) => {
	const cwd = app(t, {
		'selected/a.ts': 'export const a = 1\n',
		'selected/b.tsrx': BAD,
		'unselected/a.ts': BAD,
		'unselected/b.tsrx': BAD,
	})
	const result = run(['selected', 'selected/b.tsrx'], cwd)
	assert.equal(result.status, 1, output(result))
	assert.doesNotMatch(output(result), /unselected/)
	assert.equal((output(result).match(/b\.tsrx:1:/g) ?? []).length, 1)
	assert.equal(run(['selected/a.ts'], cwd).status, 0)
})

test('lint honors root/nested gitignore, eslintignore and config ignores in both passes', (t) => {
	const files = {
		'.gitignore': 'git-ignored/\n',
		'.eslintignore': 'eslint-ignored/\n',
		'.oxlintrc.json': config(
			{ 'xplat/no-console-debug': 'error' },
			{ ignorePatterns: ['config-ignored/'] },
		),
		'src/.gitignore': 'nested-ignored/\n',
		'src/clean.ts': 'export const clean = 1\n',
	}
	for (const directory of [
		'git-ignored',
		'eslint-ignored',
		'config-ignored',
		'src/nested-ignored',
	]) {
		files[`${directory}/a.ts`] = BAD
		files[`${directory}/b.tsrx`] = BAD
	}
	const cwd = app(t, files)
	for (const paths of [
		[],
		['src'],
		['git-ignored/a.ts', 'eslint-ignored/b.tsrx', 'config-ignored', 'src/nested-ignored'],
	]) {
		const result = run(paths, cwd)
		assert.equal(result.status, 0, output(result))
	}
})

test('lint skips generated output, nested repositories and symlinks in both passes', (t) => {
	const cwd = app(t, {
		'clean.ts': 'export const clean = 1\n',
		'dist/a.ts': BAD,
		'dist/b.tsrx': BAD,
		'nested/a.ts': BAD,
		'nested/b.tsrx': BAD,
		'worktree/.git': 'gitdir: elsewhere\n',
		'worktree/a.ts': BAD,
		'worktree/b.tsrx': BAD,
		'routes.gen.ts': BAD,
	})
	mkdirSync(join(cwd, '.git'))
	mkdirSync(join(cwd, 'nested/.git'))
	symlinkSync(join(cwd, 'nested'), join(cwd, 'linked'), 'dir')
	assert.equal(run([], cwd).status, 0)
	assert.equal(run(['nested', 'worktree', 'dist'], cwd).status, 0)
	assert.equal(run(['linked'], cwd).status, 2)
})

test('nested gitignore negations reinclude files, while config ignores remain authoritative', (t) => {
	const cwd = app(t, {
		'.gitignore': '*.ts\n*.tsrx\n',
		'src/.gitignore': '!a.ts\n!b.tsrx\n',
		'src/a.ts': BAD,
		'src/b.tsrx': BAD,
	})
	const included = run(['src'], cwd)
	assert.equal(included.status, 1, output(included))
	assert.match(output(included), /a\.ts/)
	assert.match(output(included), /b\.tsrx/)
	writeFileSync(
		join(cwd, '.oxlintrc.json'),
		config(
			{ 'xplat/no-console-debug': 'error' },
			{
				ignorePatterns: ['src/'],
			},
		),
	)
	writeFileSync(join(cwd, '.eslintignore'), '!src/\n')
	assert.equal(run(['src'], cwd).status, 0)
})

test('project config replaces defaults and handles numeric/alias severities in both passes', (t) => {
	const cwd = app(t, { 'a.ts': BAD, 'b.tsrx': BAD })
	for (const [severity, status, warning] of [
		[0, 0, false],
		['allow', 0, false],
		[1, 0, true],
		[2, 1, false],
		['deny', 1, false],
	]) {
		writeFileSync(join(cwd, '.oxlintrc.json'), config({ 'xplat/no-console-debug': severity }))
		const result = run([], cwd)
		assert.equal(result.status, status, output(result))
		if (warning) {
			assert.match(result.stderr, /warn xplat\/no-console-debug/)
		}
	}
	writeFileSync(join(cwd, '.oxlintrc.json'), '{"rules":{}}')
	assert.equal(run([], cwd).status, 0)
})

test('TSRX and regular source honor inherited rules, options and file overrides', (t) => {
	const cwd = app(t, {
		'base.json': config({ 'xplat/no-console-debug': ['error', { exclude: ['excluded/'] }] }),
		'.oxlintrc.json': JSON.stringify({
			extends: ['./base.json'],
			overrides: [{ files: ['**/allowed.*'], rules: { 'xplat/no-console-debug': 'off' } }],
		}),
		'src/allowed.ts': BAD,
		'src/allowed.tsrx': BAD,
		'excluded/a.ts': BAD,
		'excluded/b.tsrx': BAD,
		'src/bad.ts': BAD,
		'src/bad.tsrx': BAD,
	})
	const result = run([], cwd)
	assert.equal(result.status, 1, output(result))
	assert.match(output(result), /bad\.ts/)
	assert.match(output(result), /bad\.tsrx/)
	assert.doesNotMatch(output(result), /allowed\.|excluded\//)
})

test('a project can extend the shipped preset and override one framework rule', (t) => {
	const preset = fileURLToPath(new URL('../../lint/config.json', import.meta.url))
	const cwd = app(t, {
		'.oxlintrc.json': JSON.stringify({
			extends: [preset],
			rules: { 'xplat/no-console-debug': 'off' },
		}),
		'a.ts': BAD,
		'b.tsrx': BAD,
		'fix.ts': FIXABLE,
	})
	assert.equal(run(['a.ts', 'b.tsrx'], cwd).status, 0)
	const result = run(['fix.ts'], cwd)
	assert.equal(result.status, 1, output(result))
	assert.match(output(result), /curly/)
})

test('bare override globs apply to nested source and dotfiles in both passes', (t) => {
	const cwd = app(t, {
		'.oxlintrc.json': config(
			{ 'xplat/no-console-debug': 'error' },
			{
				overrides: [{ files: ['*.ts', '*.tsrx'], rules: { 'xplat/no-console-debug': 'off' } }],
			},
		),
		'src/allowed.ts': BAD,
		'src/allowed.tsrx': BAD,
		'.hidden.ts': BAD,
		'.hidden.tsrx': BAD,
	})
	const result = run([], cwd)
	assert.equal(result.status, 0, output(result))
})

test('lint rejects bad arguments, missing paths and invalid config before applying fixes', (t) => {
	const cwd = app(t, { 'fix.ts': FIXABLE, 'notes.md': '# Notes\n' })
	for (const args of [
		['--wat'],
		['--fix', 'fix.ts', 'missing.ts'],
		['notes.md'],
		['../outside.ts'],
	]) {
		const result = run(args, cwd)
		assert.equal(result.status, 2, output(result))
		assert.equal(readFileSync(join(cwd, 'fix.ts'), 'utf8'), FIXABLE)
	}
	writeFileSync(join(cwd, '.oxlintrc.json'), '{')
	assert.equal(run(['--fix'], cwd).status, 2)
	assert.equal(readFileSync(join(cwd, 'fix.ts'), 'utf8'), FIXABLE)
})

test('lint help works outside an app, empty selections pass, and -- ends options', (t) => {
	const cwd = app(t, { '-source.tsrx': BAD })
	const help = run(['--help'], cwd)
	assert.equal(help.status, 0, output(help))
	assert.match(help.stdout, /--fix/)
	const rootHelp = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' })
	assert.match(output(rootHelp), /\blint\b/)
	assert.equal(run(['--', '-source.tsrx'], cwd).status, 1)
	const empty = app(t)
	assert.equal(run([], empty).status, 0)
})

test('unsupported config formats fail clearly without applying fixes', (t) => {
	for (const name of ['.oxlintrc.jsonc', 'oxlint.config.ts', 'oxlint.config.mts']) {
		const cwd = app(t, { [name]: '{}', 'a.ts': FIXABLE })
		const result = run(['--fix'], cwd)
		assert.equal(result.status, 2, output(result))
		assert.match(output(result), /strict JSON/)
		assert.equal(readFileSync(join(cwd, 'a.ts'), 'utf8'), FIXABLE)
	}
})

test('xplat-lint remains compatible with paths and --fix without relying on PATH', (t) => {
	const cwd = app(t, { 'fix.ts': FIXABLE, 'unselected.tsrx': BAD })
	const result = spawnSync(process.execPath, [alias, '--fix', 'fix.ts'], {
		cwd,
		encoding: 'utf8',
		env: { ...process.env, PATH: '' },
	})
	assert.equal(result.status, 0, output(result))
	assert.notEqual(readFileSync(join(cwd, 'fix.ts'), 'utf8'), FIXABLE)
	assert.equal(readFileSync(join(cwd, 'unselected.tsrx'), 'utf8'), BAD)
})
