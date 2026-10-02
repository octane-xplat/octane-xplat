// Propagates the canonical framework patch set —
// packages/cli/patches/manifest.json + *.patch — to every consumer:
//
//   1. root pnpm-workspace.yaml        patchedDependencies points at
//                                      packages/cli/patches/ directly — no
//                                      second copy lives at the repo root.
//   2. packages/patches/               generated package files, consumed by
//                                      pnpm configDependencies.
//   3. packages/create/template/       configDependencies + patchedDependencies
//                                      point into node_modules/.pnpm-config.
//
// `pnpm sync:patches` rewrites these outputs. `pnpm check:patches` diffs and
// exits 1 on drift.
//
// Maintainer flow: `pnpm patch <pkg@version>` → edit → `pnpm patch-commit`
// writes back to the configured path (packages/cli/patches/), then
// `pnpm sync:patches` + update manifest.json why/dropWhen.

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
import { parseDocument, Scalar } from 'yaml'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const CLI_PATCHES = join(repo, 'packages/cli/patches')
const TEMPLATE = join(repo, 'packages/create/template')
const PATCH_PACKAGE = join(repo, 'packages/patches')
const PATCH_PACKAGE_FILES = join(PATCH_PACKAGE, 'patches')
const PATCH_PACKAGE_NAME = '@octane-xplat/patches'
const PATCH_PACKAGE_VERSION = JSON.parse(
	readFileSync(join(PATCH_PACKAGE, 'package.json'), 'utf8'),
).version

const PATCH_CONFIG_PATH = `node_modules/.pnpm-config/${PATCH_PACKAGE_NAME}`
const CHECK = process.argv.includes('--check')

const manifest = JSON.parse(readFileSync(join(CLI_PATCHES, 'manifest.json'), 'utf8')).patches

const wrap = (text, width = 88) => {
	const words = text.split(' ')
	const lines = []
	let line = ''
	for (const w of words) {
		if (line && line.length + w.length + 1 > width) {
			lines.push(line)
			line = w
		} else {
			line = line ? `${line} ${w}` : w
		}
	}

	if (line) {
		lines.push(line)
	}
	return lines.join('\n ')
}

// Rebuild the patchedDependencies block in-place: fresh map (per-entry `why`
// comments from the manifest), standard header comment on the key. Everything
// else in the document — comments included — is untouched.
const renderYaml = (file, pathPrefix, header, withConfigDependency = false) => {
	const doc = parseDocument(readFileSync(file, 'utf8'))
	if (withConfigDependency) {
		const configDependencies = doc.createNode({})
		configDependencies.set(new Scalar(PATCH_PACKAGE_NAME), PATCH_PACKAGE_VERSION)

		doc.set('configDependencies', configDependencies)
	}

	// The starter must declare only patches its own matrix can resolve —
	// pnpm fails `pnpm install` on declared-but-unused patches.
	const map = doc.createNode({})
	for (const patch of manifest) {
		if (withConfigDependency && patch.template === false) {
			continue
		}

		const key = new Scalar(patch.specifier)
		key.commentBefore = ' ' + wrap(patch.why)
		map.set(key, `${pathPrefix}/${patch.file}`)
	}

	doc.set('patchedDependencies', map)
	const pair = doc.contents.items.find((i) => i.key?.value === 'patchedDependencies')

	pair.key.commentBefore = ' ' + wrap(header)
	return String(doc)
}

const ROOT_HEADER =
	'Canonical copies live in packages/cli/patches/ — manifest.json there carries why/dropWhen per entry and feeds `xplat patches apply`. Regenerate a patch with `pnpm patch`/`pnpm patch-commit` (it writes to the configured path), then `pnpm sync:patches` propagates it to @octane-xplat/patches. `pnpm check:patches` fails on drift.'

const TEMPLATE_HEADER =
	'Framework patches are supplied by the @octane-xplat/patches config dependency and applied via pnpm patchedDependencies. Managed upstream by @octane-xplat/cli (`xplat patches apply` refreshes, `xplat patches check` verifies); do not edit by hand.'

const syncYaml = (file, pathPrefix, header, failures, withConfigDependency = false) => {
	const rendered = renderYaml(file, pathPrefix, header, withConfigDependency)
	if (readFileSync(file, 'utf8') === rendered) {
		return
	}
	failures.push(`${relative(file)} — patchedDependencies block is stale`)
	if (!CHECK) {
		writeFileSync(file, rendered)
	}
}

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

const removeTemplatePatchCopies = (failures) => {
	const dir = join(TEMPLATE, 'patches')
	for (const file of existsSync(dir) ? readdirSync(dir) : []) {
		if (!file.endsWith('.patch')) {
			continue
		}

		const path = join(dir, file)
		failures.push(`${relative(path)} — obsolete template patch copy`)
		if (!CHECK) {
			rmSync(path)
		}
	}

	if (!CHECK && existsSync(dir) && !readdirSync(dir).length) {
		rmSync(dir, { recursive: true })
	}
}

const failures = []
syncYaml(join(repo, 'pnpm-workspace.yaml'), 'packages/cli/patches', ROOT_HEADER, failures)
syncYaml(
	join(TEMPLATE, 'pnpm-workspace.yaml'),
	`${PATCH_CONFIG_PATH}/patches`,
	TEMPLATE_HEADER,
	failures,
	true,
)

syncPatchPackageFiles(failures)
removeTemplatePatchCopies(failures)

if (failures.length) {
	console.error(`${CHECK ? 'patch drift' : 'synced'} — ${failures.length} file(s):`)

	for (const f of failures) {
		console.error(`  ${f}`)
	}
	if (CHECK) {
		console.error('\nrun `pnpm sync:patches` to regenerate')
		process.exit(1)
	}
} else {
	console.log('patch set in sync')
}
