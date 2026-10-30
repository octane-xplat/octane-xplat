import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { applyPatches, inspectPatches, loadPatchManifest } from '../dist/patches.js'
import { packageManagerFor } from '../dist/package-manager.js'

const patch = loadPatchManifest().find((patch) => patch.specifier === 'css@3.0.0')
const json = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
function fixture(t, pkg = { packageManager: 'bun@1.4.4', dependencies: { css: '3.0.0' } }) {
	const root = mkdtempSync(join(tmpdir(), 'xplat-bun-patches-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	json(join(root, 'package.json'), pkg)
	return root
}

const state = (root) => inspectPatches(root).find((row) => row.specifier === patch.specifier).state
const lock = (
	root,
	patches = { [patch.specifier]: `patches/${patch.file}` },
	packages = { css: ['css@3.0.0'] },
) => {
	writeFileSync(
		join(root, 'bun.lock'),
		'// Bun text lockfile\n' +
			JSON.stringify({ lockfileVersion: 2, packages, patchedDependencies: patches }).replace(
				/}$/,
				',}\n',
			),
	)
}

test('Bun registers root patches without changing pnpm mappings; inspection follows its selected lockfile', (t) => {
	const root = fixture(t)
	writeFileSync(
		join(root, 'pnpm-workspace.yaml'),
		'packages: []\npatchedDependencies: {custom: custom.patch}\n',
	)
	assert.equal(applyPatches(root).copied.length, 1)
	const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
	assert.equal(pkg.patchedDependencies[patch.specifier], `patches/${patch.file}`)
	assert.equal(pkg.pnpm, undefined)
	assert.match(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8'), /custom.patch/)
	assert.equal(applyPatches(root).copied.length, 0)
	lock(root)
	assert.equal(state(root), 'applied')
	lock(root, {})
	assert.equal(state(root), 'not-installed')
	lock(root)
	writeFileSync(join(root, 'patches', patch.file), 'changed')
	assert.equal(state(root), 'file-differs')
	assert.equal(applyPatches(root).conflicts.length, 1)
	assert.equal(applyPatches(root, { force: true }).copied.length, 1)
	assert.equal(state(root), 'applied')
})

test('Bun discovers nested members, exclusions and both catalog forms from package.json', (t) => {
	const root = fixture(t, {
		packageManager: 'bun@1.4.4',
		workspaces: {
			packages: ['modules/**', '!modules/excluded'],
			catalogs: { tools: { css: '3.0.0' } },
		},
	})
	for (const name of ['nested/app', 'excluded']) {
		mkdirSync(join(root, 'modules', name), { recursive: true })
		json(join(root, 'modules', name, 'package.json'), {
			dependencies: name === 'excluded' ? { octane: '0.16.3' } : { css: 'catalog:tools' },
		})
	}
	const member = join(root, 'modules/nested/app')
	assert.equal(applyPatches(member).copied.length, 1)
	assert.equal(state(member), 'applied')
	assert.equal(
		JSON.parse(readFileSync(join(member, 'package.json'), 'utf8')).patchedDependencies,
		undefined,
	)
})

test('Bun lockfile resolves transitive and aliased package identities from entry values', (t) => {
	const root = fixture(t, { packageManager: 'bun@1.4.4' })
	lock(root, {}, { 'parent/css-alias': ['css@3.0.0'] })
	assert.equal(applyPatches(root).copied.length, 1)
	lock(root, { [patch.specifier]: `patches/${patch.file}` }, { 'parent/css-alias': ['css@3.0.0'] })
	assert.equal(state(root), 'applied')
})

test('explicit manager wins; ambiguous lockfiles and invalid Bun locks fail without writes', (t) => {
	const root = fixture(t, { dependencies: { css: '3.0.0' } })
	lock(root)
	writeFileSync(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n')
	assert.throws(() => applyPatches(root), /Both Bun and pnpm/)
	assert.equal(applyPatches(root, { packageManager: 'bun' }).copied.length, 1)
	assert.equal(packageManagerFor(root, 'pnpm'), 'pnpm')
	writeFileSync(join(root, 'bun.lock'), '{ broken')
	assert.throws(() => inspectPatches(root, { packageManager: 'bun' }), /invalid Bun lockfile/)
	assert.throws(() => packageManagerFor(root, 'npm'), /supports Bun and pnpm/)
})

test('Bun applies the canonical Windows patch to its exact pinned URL source', (t) => {
	const source = '@nativescript/core@https://pkg.pr.new/@nativescript/core@abae298'
	const root = fixture(t, {
		packageManager: 'bun@1.4.4',
		dependencies: { '@nativescript/core': source.slice('@nativescript/core@'.length) },
	})
	assert.equal(applyPatches(root).copied.length, 1)
	assert.ok(
		JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).patchedDependencies[source],
	)
})

test('a sole pnpm lockfile takes precedence over stale Bun mappings', (t) => {
	const root = fixture(t, {
		dependencies: { css: '3.0.0' },
		patchedDependencies: { custom: 'custom.patch' },
	})
	writeFileSync(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9\npackages:\n  css@3.0.0: {}\n')
	assert.equal(applyPatches(root).copied.length, 1)
	assert.match(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8'), /css@3.0.0/)
	assert.deepEqual(
		JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).patchedDependencies,
		{ custom: 'custom.patch' },
	)
})

test('an explicit Bun selection reads its catalogs even with pnpm metadata retained', (t) => {
	const root = fixture(t, {
		packageManager: 'pnpm@11.24.0',
		dependencies: { css: 'catalog:' },
		catalog: { css: '3.0.0' },
	})
	writeFileSync(join(root, 'pnpm-workspace.yaml'), 'catalog: {css: 9.9.9}\n')
	assert.equal(applyPatches(root, { packageManager: 'bun' }).copied.length, 1)
	assert.equal(
		inspectPatches(root, { packageManager: 'bun' }).find((row) => row.specifier === patch.specifier)
			.state,
		'applied',
	)
})
