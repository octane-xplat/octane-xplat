// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Propagates the canonical framework patch set —
// packages/cli/patches/manifest.json + *.patch — to every consumer:
//
//   1. root package.json             patchedDependencies points at
//                                      packages/cli/patches/ directly — no
//                                      second copy lives at the repo root.
//   2. packages/patches/               generated package files, consumed by
//                                      optional manual compatibility checks.
//   3. creator templates               local patch files + Bun registrations,
//                                      available before the first install.
//
// `bun run sync:patches` rewrites these outputs. `bun run check:patches` diffs and
// exits 1 on drift.
// --package-only prepares packages/patches without editing workspace YAML
// or starter files; the patch package's prepack hook uses this scope.
//
// Maintainer flow: `bun patch <pkg@version>` → edit → `bun patch --commit`.
// Retain the canonical path in packages/cli/patches/ and the manifest, then
// `bun run sync:patches` + update manifest.json why/dropWhen.

import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { managedPackage } from '../packages/create/compatibility.ts'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const CLI_PATCHES = join(repo, 'packages/cli/patches')
const PATCH_PACKAGE = join(repo, 'packages/patches')
const PATCH_PACKAGE_FILES = join(PATCH_PACKAGE, 'patches')
const CHECK = process.argv.includes('--check')
const PACKAGE_ONLY = process.argv.includes('--package-only')
for (const arg of process.argv.slice(2)) {
	if (arg !== '--check' && arg !== '--package-only') {
		throw new Error(`sync-patches: unknown option ${arg}`)
	}
}

const manifest = JSON.parse(readFileSync(join(CLI_PATCHES, 'manifest.json'), 'utf8')).patches

const relative = (f) => f.slice(repo.length + 1)

const syncPatchPackageFiles = (failures) => {
	if (!CHECK) {
		mkdirSync(PATCH_PACKAGE_FILES, { recursive: true })
	}

	const wanted = new Set(manifest.map((p) => p.file))
	for (const patch of manifest) {
		const src = join(CLI_PATCHES, patch.file)
		const dst = join(PATCH_PACKAGE_FILES, patch.file)
		if (existsSync(dst) && readFileSync(src).equals(readFileSync(dst))) {
			continue
		}

		failures.push(
			existsSync(dst) ? `${relative(dst)} — differs from canonical` : `${relative(dst)} — missing`,
		)

		if (!CHECK) {
			copyFileSync(src, dst)
		}
	}

	for (const f of existsSync(PATCH_PACKAGE_FILES) ? readdirSync(PATCH_PACKAGE_FILES) : []) {
		if (f.endsWith('.patch') && !wanted.has(f)) {
			failures.push(`${relative(join(PATCH_PACKAGE_FILES, f))} — not in manifest`)
			if (!CHECK) {
				rmSync(join(PATCH_PACKAGE_FILES, f))
			}
		}
	}
}

const failures = []
if (!PACKAGE_ONLY) {
	const file = join(repo, 'package.json')
	const before = readFileSync(file, 'utf8')
	const pkg = JSON.parse(before)
	pkg.patchedDependencies = Object.fromEntries(
		manifest
			.filter((patch) => patch.repository !== false)
			.flatMap((patch) =>
				(patch.bunSpecifiers ?? [patch.specifier]).map((specifier) => [
					specifier,
					`packages/cli/patches/${patch.file}`,
				]),
			),
	)

	const after = JSON.stringify(pkg, null, '\t') + '\n'
	if (before !== after) {
		failures.push('package.json — Bun patchedDependencies are stale')
		if (!CHECK) {
			writeFileSync(file, after)
		}
	}

	for (const template of ['template', 'library-template']) {
		const base = join(repo, 'packages/create', template)
		const file = join(base, 'package.json')
		const pkg = JSON.parse(readFileSync(file, 'utf8'))
		const patches = manifest.filter((patch) => {
			const at = patch.specifier.indexOf('@', 1)
			const pin = managedPackage(patch.specifier.slice(0, at))
			return patch.template !== false && (!pin || pin.version === patch.specifier.slice(at + 1))
		})
		pkg.patchedDependencies = Object.fromEntries(
			patches.map((patch) => [patch.specifier, `patches/${patch.file}`]),
		)
		const after = JSON.stringify(pkg, null, '\t') + '\n'
		if (after !== readFileSync(file, 'utf8')) {
			failures.push(`${relative(file)} — patch registrations are stale`)
			if (!CHECK) {
				writeFileSync(file, after)
			}
		}
		const destination = join(base, 'patches')
		if (!CHECK) {
			mkdirSync(destination, { recursive: true })
		}
		const wanted = new Set(patches.map((patch) => patch.file))
		for (const name of existsSync(destination) ? readdirSync(destination) : []) {
			if (!wanted.has(name)) {
				failures.push(`${relative(destination)}/${name} — obsolete starter patch`)
				if (!CHECK) {
					rmSync(join(destination, name))
				}
			}
		}
		for (const patch of patches) {
			const src = join(CLI_PATCHES, patch.file)
			const dst = join(destination, patch.file)
			if (!existsSync(dst) || !readFileSync(src).equals(readFileSync(dst))) {
				failures.push(`${relative(dst)} — starter patch is stale`)
				if (!CHECK) {
					copyFileSync(src, dst)
				}
			}
		}
	}
}

syncPatchPackageFiles(failures)

if (failures.length) {
	console.error(`${CHECK ? 'patch drift' : 'synced'} — ${failures.length} file(s):`)

	for (const f of failures) {
		console.error(`  ${f}`)
	}

	if (CHECK) {
		console.error('\nrun `bun run sync:patches` to regenerate')
		process.exit(1)
	}
} else {
	console.log('patch set in sync')
}
