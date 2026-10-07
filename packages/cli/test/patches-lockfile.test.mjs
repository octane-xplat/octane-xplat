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
} from '../src/patches.mjs'

for (const multiDocument of [false, true]) {
	test(`patch inspection reads ${multiDocument ? 'multi-document' : 'single-document'} pnpm lockfiles`, (t) => {
		const root = mkdtempSync(join(tmpdir(), 'xplat-patches-lock-'))
		t.after(() => rmSync(root, { recursive: true, force: true }))
		const patch = loadPatchManifest()[0]
		const name = specifierPackage(patch.specifier)
		const version = patch.specifier.slice(name.length + 1)
		writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { [name]: version } }))
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
