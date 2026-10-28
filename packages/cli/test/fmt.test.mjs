import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const cli = join(dirname(fileURLToPath(import.meta.url)), '../bin/xplat.mjs')
const run = (argv, cwd, input) =>
	spawnSync(process.execPath, [cli, ...argv], { cwd, encoding: 'utf8', input })

const app = (t, files = {}) => {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-fmt-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	for (const [name, contents] of Object.entries(files)) {
		mkdirSync(dirname(join(dir, name)), { recursive: true })
		writeFileSync(join(dir, name), contents)
	}
	return dir
}

const MESSY = 'if (a) b()\nconst x = 1\n'
const TIDY = 'if (a) {\n\tb()\n}\n\nconst x = 1\n'

test('fmt writes changes, then check is clean', (t) => {
	const dir = app(t, { 'src/a.ts': MESSY })
	assert.equal(run(['fmt', '--check'], dir).status, 1)
	assert.equal(run(['fmt'], dir).status, 0)
	assert.equal(readFileSync(join(dir, 'src/a.ts'), 'utf8'), TIDY)
	assert.equal(run(['fmt', '--check'], dir).status, 0)
})

test('fmt preserves ambient declaration mode for TypeScript declaration files', (t) => {
	const files = Object.fromEntries(
		['d.ts', 'd.mts', 'd.cts'].map((extension) => [
			`types/contracts.${extension}`,
			'export const contract:{value:string}\n',
		]),
	)
	const dir = app(t, files)
	const result = run(['fmt'], dir)
	assert.equal(result.status, 0, result.stderr)
	for (const path of Object.keys(files)) {
		assert.equal(
			readFileSync(join(dir, path), 'utf8'),
			'export const contract: { value: string }\n',
		)
	}
	assert.equal(run(['fmt', '--check'], dir).status, 0)
})

test('fmt --stdin-filepath formats stdin to stdout without writing', (t) => {
	const dir = app(t, { 'src/a.ts': MESSY })
	const out = run(['fmt', '--stdin-filepath', 'src/a.ts'], dir, MESSY)
	assert.equal(out.status, 0, out.stderr)
	assert.equal(out.stdout, TIDY)
	assert.equal(readFileSync(join(dir, 'src/a.ts'), 'utf8'), MESSY)
	const check = run(['fmt', '--stdin-filepath', 'src/a.ts', '--check'], dir, MESSY)
	assert.equal(check.status, 1)
	assert.equal(check.stdout, '')
})

test('fmt restricts to explicit paths and fails on unknown or unsupported ones', (t) => {
	const dir = app(t, { 'src/a.ts': MESSY, 'src/b.ts': MESSY })
	assert.equal(run(['fmt', 'src/a.ts'], dir).status, 0)
	assert.equal(readFileSync(join(dir, 'src/a.ts'), 'utf8'), TIDY)
	assert.equal(readFileSync(join(dir, 'src/b.ts'), 'utf8'), MESSY)

	assert.equal(run(['fmt', 'gone.ts'], dir).status, 2)
	writeFileSync(join(dir, 'note.md'), '# hi\n')
	assert.match(run(['fmt', 'note.md'], dir).stderr, /unsupported extension/)
	assert.equal(run(['fmt', 'note.md'], dir).status, 2)
})

test('fmt stops at nested-repository boundaries and malformed input writes nothing', (t) => {
	const dir = app(t, {
		'src/ok.ts': 'const ok = 1\n',
		'src/bad.ts': 'const = 3\n',
		'nested/inner.ts': MESSY,
	})
	mkdirSync(join(dir, 'nested/.git'), { recursive: true })
	const result = run(['fmt'], dir)
	assert.equal(result.status, 2)
	assert.match(result.stderr, /bad\.ts/)
	// zero writes on a transform failure — and the nested repo was never touched
	assert.equal(readFileSync(join(dir, 'src/ok.ts'), 'utf8'), 'const ok = 1\n')
	assert.equal(readFileSync(join(dir, 'nested/inner.ts'), 'utf8'), MESSY)
})

test('fmt honors .gitignore during discovery', (t) => {
	const dir = app(t, {
		'.gitignore': 'skipme.ts\n',
		'skipme.ts': MESSY,
		'keep.ts': MESSY,
	})
	assert.equal(run(['fmt'], dir).status, 0)
	assert.equal(readFileSync(join(dir, 'skipme.ts'), 'utf8'), MESSY)
	assert.equal(readFileSync(join(dir, 'keep.ts'), 'utf8'), TIDY)
})
