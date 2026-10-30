import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { stringify } from 'yaml'
import {
	applyPatches,
	inspectPatches,
	loadPatchManifest,
	specifierPackage,
} from '../dist/patches.js'

for (const multiDocument of [false, true]) {
	test(`patch inspection reads ${multiDocument ? 'multi-document' : 'single-document'} pnpm lockfiles`, (t) => {
		const root = mkdtempSync(join(tmpdir(), 'xplat-patches-lock-'))
		t.after(() => rmSync(root, { recursive: true, force: true }))
		const patch = loadPatchManifest()[0]
		const name = specifierPackage(patch.specifier)
		const version = patch.specifier.slice(name.length + 1)
		writeFileSync(
			join(root, 'package.json'),
			JSON.stringify({ packageManager: 'pnpm@11.24.0', dependencies: { [name]: version } }),
		)
		assert.equal(applyPatches(root).conflicts.length, 0)
		const sections = [
			{ lockfileVersion: '9.0', importers: { '.': { dependencies: { [name]: { version } } } } },
			{ packages: { [patch.specifier]: {} } },
			{ patchedDependencies: { [patch.specifier]: { hash: 'installed' } }, snapshots: {} },
		]

		writeFileSync(
			join(root, 'pnpm-lock.yaml'),
			multiDocument
				? sections.map((section) => stringify(section)).join('---\n')
				: stringify(Object.assign({}, ...sections)),
		)

		assert.equal(
			inspectPatches(root).find((item) => item.specifier === patch.specifier).state,
			'applied',
		)

		// A transitive resolution must still count when no importer declares it.
		writeFileSync(
			join(root, 'package.json'),
			JSON.stringify({
				pnpm: { patchedDependencies: { [patch.specifier]: `patches/${patch.file}` } },
			}),
		)

		sections[0].importers = {}
		writeFileSync(
			join(root, 'pnpm-lock.yaml'),
			sections.map((section) => stringify(section)).join('---\n'),
		)

		assert.equal(
			inspectPatches(root).find((item) => item.specifier === patch.specifier).state,
			'applied',
		)

		sections[2].patchedDependencies = {}
		writeFileSync(
			join(root, 'pnpm-lock.yaml'),
			sections.map((section) => stringify(section)).join('---\n'),
		)

		assert.equal(
			inspectPatches(root).find((item) => item.specifier === patch.specifier).state,
			'not-installed',
		)
	})
}

test('catalog: specifiers resolve through the workspace catalog', (t) => {
	const root = mkdtempSync(join(tmpdir(), 'xplat-patches-catalog-'))
	t.after(() => rmSync(root, { recursive: true, force: true }))
	const patch = loadPatchManifest()[0]
	const name = specifierPackage(patch.specifier)
	const version = patch.specifier.slice(name.length + 1)

	writeFileSync(
		join(root, 'package.json'),
		JSON.stringify({ dependencies: { [name]: 'catalog:' } }),
	)
	writeFileSync(
		join(root, 'pnpm-workspace.yaml'),
		stringify({ packages: [], catalog: { [name]: version } }),
	)

	// No lockfile: the declared side is compared directly — catalog: must read
	// the pinned version, so the patch is only missing config, not mismatched.
	assert.notEqual(
		inspectPatches(root).find((item) => item.specifier === patch.specifier).state,
		'version-mismatch',
	)

	// A named catalog resolves the same way.
	writeFileSync(
		join(root, 'package.json'),
		JSON.stringify({ dependencies: { [name]: 'catalog:toolchain' } }),
	)
	writeFileSync(
		join(root, 'pnpm-workspace.yaml'),
		stringify({ packages: [], catalogs: { toolchain: { [name]: version } } }),
	)
	assert.notEqual(
		inspectPatches(root).find((item) => item.specifier === patch.specifier).state,
		'version-mismatch',
	)
})
