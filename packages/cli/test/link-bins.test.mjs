import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const linkBins = join(dirname(fileURLToPath(import.meta.url)), '../src/link-bins.mjs')

// A `link:`-installed dep looks exactly like this in the consumer: the package
// dir is a symlink into the linked checkout and pnpm may have written no .bin
// shims for it (GH#16).
const writeDep = (root, { name, bin, spec = `link:../${name.split('/').at(-1)}` }) => {
	const dir = join(root, name.split('/').at(-1))
	mkdirSync(join(dir, 'bin'), { recursive: true })
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version: '0.0.0', bin }))
	writeFileSync(join(dir, 'bin/tool.mjs'), '#!/usr/bin/env node\nconsole.log("tool ran")\n')
	chmodSync(join(dir, 'bin/tool.mjs'), 0o755)
	return { name, spec, dir }
}

const consumer = (t, deps) => {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-link-bins-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	const root = join(dir, 'consumer')
	mkdirSync(join(root, 'node_modules'), { recursive: true })
	writeFileSync(
		join(root, 'package.json'),
		JSON.stringify({ name: 'consumer', dependencies: deps }),
	)

	return root
}

const linkInto = (root, dep) => {
	const dest = join(root, 'node_modules', ...dep.name.split('/'))
	mkdirSync(dirname(dest), { recursive: true })
	symlinkSync(dep.dir, dest, 'dir')
}

const run = (cwd) =>
	spawnSync(process.execPath, [linkBins], { cwd, encoding: 'utf8' })

test('writes missing .bin shims for link: deps', (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-link-bins-deps-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	const dep = writeDep(dir, { name: '@test/fake', bin: { 'fake-bin': 'bin/tool.mjs' } })
	const root = consumer(t, { [dep.name]: dep.spec })
	linkInto(root, dep)

	const result = run(root)
	assert.equal(result.status, 0, result.stderr)
	assert.match(result.stdout, /fake-bin/)

	const shim = join(root, 'node_modules/.bin/fake-bin')
	assert.ok(lstatSync(shim).isSymbolicLink())

	if (process.platform !== 'win32') {
		const tool = spawnSync(shim, [], { encoding: 'utf8' })
		assert.equal(tool.status, 0, tool.stderr)
		assert.match(tool.stdout, /tool ran/)
	}
})

test('maps a string bin field to the unscoped package name', (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-link-bins-deps-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	const dep = writeDep(dir, { name: 'plain-pkg', bin: 'bin/tool.mjs' })
	const root = consumer(t, { [dep.name]: dep.spec })
	linkInto(root, dep)

	const result = run(root)
	assert.equal(result.status, 0, result.stderr)
	assert.ok(lstatSync(join(root, 'node_modules/.bin/plain-pkg')).isSymbolicLink())
})

test('leaves existing .bin entries alone', (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-link-bins-deps-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	const dep = writeDep(dir, { name: '@test/fake', bin: { 'fake-bin': 'bin/tool.mjs' } })
	const root = consumer(t, { [dep.name]: dep.spec })
	linkInto(root, dep)

	mkdirSync(join(root, 'node_modules/.bin'), { recursive: true })
	writeFileSync(join(root, 'node_modules/.bin/fake-bin'), 'custom\n')
	const result = run(root)
	assert.equal(result.status, 0, result.stderr)
	assert.match(result.stdout, /already complete/)
	assert.equal(readFileSync(join(root, 'node_modules/.bin/fake-bin'), 'utf8'), 'custom\n')
})

test('warns on an unresolved link: target and still succeeds', (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-link-bins-deps-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	const dep = writeDep(dir, { name: '@test/fake', bin: { 'fake-bin': 'bin/tool.mjs' } })
	const root = consumer(t, {
		[dep.name]: dep.spec,
		'@test/gone': 'link:../does-not-exist',
	})

	linkInto(root, dep)

	const result = run(root)
	assert.equal(result.status, 0, result.stderr)
	assert.match(result.stderr, /@test\/gone/)
	assert.ok(lstatSync(join(root, 'node_modules/.bin/fake-bin')).isSymbolicLink())
})

test('reports nothing to do without link: deps', (t) => {
	const root = consumer(t, { oxlint: '^1.74.0' })
	const result = run(root)
	assert.equal(result.status, 0, result.stderr)
	assert.match(result.stdout, /nothing to do/)
})
