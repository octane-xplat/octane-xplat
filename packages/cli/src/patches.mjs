// Canonical framework patch set — ../patches/manifest.json + .patch files,
// shipped inside @octane-xplat/cli. pnpm only honors `patchedDependencies`
// at the app/workspace root, so downstream apps materialize the set:
// `xplat patches apply` copies files into <app>/patches/ and merges the
// block into the app's pnpm-workspace.yaml (or package.json
// `pnpm.patchedDependencies` when no workspace yaml exists). `xplat doctor`
// and `xplat patches check` report drift via inspectPatches().

import { createHash } from 'node:crypto'
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from 'node:fs'

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDocument, isMap, Scalar } from 'yaml'

export const canonicalPatchesDir = join(dirname(fileURLToPath(import.meta.url)), '../patches')

export const loadPatchManifest = () =>
	JSON.parse(readFileSync(join(canonicalPatchesDir, 'manifest.json'), 'utf8')).patches

export const specifierPackage = (spec) => {
	const i = spec.indexOf('@', 1)
	return i === -1 ? spec : spec.slice(0, i)
}

const specifierVersion = (spec) => spec.slice(spec.indexOf('@', 1) + 1)

const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')

const readJson = (file) => {
	try {
		return JSON.parse(readFileSync(file, 'utf8'))
	} catch {
		return null
	}
}

const readYamlDoc = (file) => {
	try {
		return parseDocument(readFileSync(file, 'utf8'))
	} catch {
		return null
	}
}

/** package name → declared range across all dep fields. */
export const declaredDeps = (pkg) => ({
	...pkg?.dependencies,
	...pkg?.devDependencies,
	...pkg?.peerDependencies,
	...pkg?.optionalDependencies,
})

// Workspace roots declare the shared deps in member package.jsons, not the
// root's own — expand `packages:` globs (dir/* form) and merge every member's
// dep fields so a workspace app checks the packages it actually installs.
const workspaceDeps = (appDir) => {
	const ws = join(appDir, 'pnpm-workspace.yaml')
	if (!existsSync(ws)) {
		return {}
	}
	const globs = readYamlDoc(ws)?.get('packages')?.toJSON() ?? []
	const deps = {}
	for (const glob of globs) {
		if (!glob.endsWith('/*')) {
			continue
		}
		const parent = join(appDir, glob.slice(0, -2))
		if (!existsSync(parent)) {
			continue
		}
		for (const member of readdirSync(parent)) {
			const pkg = readJson(join(parent, member, 'package.json'))
			Object.assign(deps, declaredDeps(pkg))
		}
	}

	return deps
}

/** The config file that owns patchedDependencies for this app. */
const configTarget = (appDir) =>
	existsSync(join(appDir, 'pnpm-workspace.yaml')) ? 'workspace' : 'packageJson'

/** spec → patch path, from whichever config source the app uses. */
export const configuredPatches = (appDir) => {
	if (configTarget(appDir) === 'workspace') {
		const doc = readYamlDoc(join(appDir, 'pnpm-workspace.yaml'))
		const pd = doc?.get('patchedDependencies')
		return isMap(pd) ? pd.toJSON() : {}
	}

	return readJson(join(appDir, 'package.json'))?.pnpm?.patchedDependencies ?? {}
}

/** Specifiers recorded in pnpm-lock.yaml — null when there is no lockfile. */
const lockfilePatches = (appDir) => {
	const lock = join(appDir, 'pnpm-lock.yaml')
	if (!existsSync(lock)) {
		return null
	}
	const pd = readYamlDoc(lock)?.get('patchedDependencies')
	return isMap(pd) ? new Set(pd.items.map((i) => String(i.key))) : new Set()
}

// Resolved versions per package across all lockfile importers — the truth
// about which copy pnpm actually installs. `>=9.1.0 <10` on a peer is fine
// when every resolution lands on the pin.
const lockfileResolvedVersions = (appDir) => {
	const lock = join(appDir, 'pnpm-lock.yaml')
	if (!existsSync(lock)) {
		return null
	}
	const doc = readYamlDoc(lock)
	const resolved = {}
	const add = (name, version) => {
		if (!name || !version) {
			return
		}
		const set = (resolved[name] ??= new Set())
		set.add(version)
	}

	// Importers carry declared deps (incl. link:/file: specs that never
	// appear under packages).
	for (const importer of Object.values(doc?.get('importers')?.toJSON() ?? {})) {
		for (const group of ['dependencies', 'devDependencies']) {
			for (const [name, entry] of Object.entries(importer?.[group] ?? {})) {
				const version = typeof entry === 'string' ? entry : entry?.version

				if (!version) {
					continue
				}

				add(name, version.split('(')[0])
			}
		}
	}

	// packages:/snapshots: carry the whole resolved graph — a patch may
	// target a transitive dep (e.g. reworkcss `css` under
	// @nativescript/vite) that no importer declares. Keys look like
	// `css@3.0.0` or `pkg@1.2.3(patch_hash=…)(peer@…)`.
	for (const section of ['packages', 'snapshots']) {
		const map = doc?.get(section)
		if (!isMap(map)) {
			continue
		}

		for (const item of map.items) {
			const key = String(item.key).split('(')[0]
			const at = key.lastIndexOf('@')
			if (at > 0) {
				add(key.slice(0, at), key.slice(at + 1))
			}
		}
	}

	return resolved
}

// A patch only bites when pnpm resolves exactly its pinned version. The
// lockfile is authoritative; pre-install (no lockfile) fall back to the
// declared range being the pin itself.
const versionOk = (declared, pinned, resolved) =>
	resolved
		? resolved.has(pinned)
		: declared === pinned || declared === 'workspace:*' || declared === '*'

/**
 * Per-patch state for an app:
 *   not-declared      package isn't a dep of this app — patch not needed
 *   not-applicable    package installed but not at the pinned version — patch can't bite
 *   missing-config    no patchedDependencies entry
 *   missing-file      configured path doesn't exist
 *   file-differs      configured file isn't the framework copy
 *   version-mismatch  declared range won't resolve the pinned version
 *   not-installed     configured but absent from pnpm-lock.yaml
 *   applied           configured, file matches, lockfile recorded it
 */
export const inspectPatches = (appDir) => {
	appDir = resolve(appDir)
	const deps = {
		...workspaceDeps(appDir),
		...declaredDeps(readJson(join(appDir, 'package.json'))),
	}

	const configured = configuredPatches(appDir)
	const locked = lockfilePatches(appDir)
	const resolved = lockfileResolvedVersions(appDir)

	return loadPatchManifest().map((patch) => {
		const name = specifierPackage(patch.specifier)
		const declared = deps[name]
		const base = { ...patch, declared, path: configured[patch.specifier] }
		// Not needed when the app neither declares the package nor installs
		// it transitively at the pinned version (a patch may target a
		// transitive dep, e.g. reworkcss `css` under @nativescript/vite).

		if (declared === undefined && !resolved?.[name]?.has(specifierVersion(patch.specifier))) {
			return { ...base, state: 'not-declared' }
		}

		// The package is installed, but not at the pinned version the patch
		// targets and nothing declares the patch — it can never bite (e.g.
		// the starter never resolves the windows-preview pins). A configured
		// entry in that state still reports version-mismatch below.
		if (!base.path && !versionOk(declared, specifierVersion(patch.specifier), resolved?.[name])) {
			return { ...base, state: 'not-applicable' }
		}

		if (!base.path) {
			return { ...base, state: 'missing-config' }
		}
		const file = join(appDir, base.path)
		if (!existsSync(file)) {
			return { ...base, state: 'missing-file' }
		}
		if (sha(file) !== sha(join(canonicalPatchesDir, patch.file))) {
			return { ...base, state: 'file-differs' }
		}

		if (!versionOk(declared, specifierVersion(patch.specifier), resolved?.[name])) {
			return { ...base, state: 'version-mismatch' }
		}

		if (locked && !locked.has(patch.specifier)) {
			return { ...base, state: 'not-installed' }
		}

		return { ...base, state: 'applied' }
	})
}

export const patchStateDetail = (state) =>
	({
		'not-declared': 'package not declared — not needed',
		'not-applicable': 'no install resolves the pinned version — not needed',
		'missing-config': 'no patchedDependencies entry',
		'missing-file': 'configured patch file does not exist',
		'file-differs': 'patch file differs from the framework copy',
		'version-mismatch': `declared range won't resolve the pinned version`,
		'not-installed': 'configured but missing from pnpm-lock.yaml',
		applied: 'applied',
	})[state]

const detectIndent = (src) => src.match(/^([ \t]+)"/m)?.[1] ?? '\t'

export const wrapComment = (text, width = 88) => {
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

/**
 * Copy canonical patches into <appDir>/patches/ and register them. Only
 * patches whose package the app declares are applied — an entry for a
 * package pnpm never resolves produces a "patch not applied" warning at
 * install for no benefit.
 */
export const applyPatches = (appDir, { force = false } = {}) => {
	appDir = resolve(appDir)
	const pkg = readJson(join(appDir, 'package.json'))
	if (!pkg) {
		return { error: `no package.json in ${appDir}` }
	}

	const deps = { ...workspaceDeps(appDir), ...declaredDeps(pkg) }
	const configured = configuredPatches(appDir)
	const resolved = lockfileResolvedVersions(appDir)
	const report = { copied: [], kept: [], conflicts: [], skipped: [] }
	const relevant = []

	for (const patch of loadPatchManifest()) {
		const name = specifierPackage(patch.specifier)
		const declared = deps[name]
		const pinned = specifierVersion(patch.specifier)
		if (declared === undefined && !resolved?.[name]?.has(pinned)) {
			report.skipped.push({
				...patch,
				reason: 'package not declared or installed',
			})

			continue
		}

		if (!versionOk(declared, pinned, resolved?.[name])) {
			report.skipped.push({
				...patch,
				reason: `no install resolves ${name}@${pinned} — the patch would not apply`,
			})

			continue
		}

		relevant.push(patch)
	}

	const skipMerge = new Set()
	for (const patch of relevant) {
		const src = join(canonicalPatchesDir, patch.file)
		const target = `patches/${patch.file}`
		const configuredPath = configured[patch.specifier]
		// Entry already resolves to a byte-identical copy at another path
		// (this repo's own packages/cli/patches/ entries hit this) — leave
		// the mapping alone rather than repointing it at a second copy.
		if (configuredPath && configuredPath !== target) {
			const alt = join(appDir, configuredPath)
			if (existsSync(alt) && sha(alt) === sha(src)) {
				report.kept.push(patch)
				skipMerge.add(patch.specifier)
				continue
			}

			if (!force) {
				report.conflicts.push({
					...patch,
					reason: `patchedDependencies maps ${patch.specifier} → ${configuredPath}`,
				})

				continue
			}
		}

		const dst = join(appDir, target)
		if (existsSync(dst)) {
			if (sha(src) === sha(dst)) {
				report.kept.push(patch)
				continue
			}

			if (!force) {
				report.conflicts.push({
					...patch,
					reason: `patches/${patch.file} exists and differs`,
				})

				continue
			}
		}

		mkdirSync(dirname(dst), { recursive: true })
		copyFileSync(src, dst)
		report.copied.push(patch)
	}

	// Only register entries whose file actually landed (copied or identical)
	// and whose mapping isn't already satisfied by an identical alt-path file.
	const landed = new Set([...report.copied, ...report.kept].map((p) => p.specifier))

	mergeConfig(
		appDir,
		relevant.filter((p) => landed.has(p.specifier) && !skipMerge.has(p.specifier)),
		{ force, report },
	)

	return report
}

const mergeConfig = (appDir, patches, { force, report }) => {
	if (configTarget(appDir) === 'workspace') {
		const file = join(appDir, 'pnpm-workspace.yaml')
		const doc = parseDocument(readFileSync(file, 'utf8'))
		let pd = doc.get('patchedDependencies')
		if (pd === undefined) {
			doc.set('patchedDependencies', doc.createNode({}))
			pd = doc.get('patchedDependencies')
		} else if (!isMap(pd)) {
			report.conflicts.push({
				specifier: 'patchedDependencies',
				reason: 'pnpm-workspace.yaml has a non-map patchedDependencies — merge by hand',
			})

			return
		}

		let changed = false
		for (const patch of patches) {
			const target = `patches/${patch.file}`
			const existing = pd.get(patch.specifier)
			if (existing === target) {
				continue
			}
			if (existing !== undefined && !force) {
				report.conflicts.push({
					...patch,
					reason: `patchedDependencies already maps ${patch.specifier} → ${existing}`,
				})

				continue
			}

			const key = new Scalar(patch.specifier)
			key.commentBefore = ' ' + wrapComment(patch.why)
			pd.set(key, target)
			changed = true
		}

		if (changed) {
			writeFileSync(file, String(doc))
		}
		return
	}

	const file = join(appDir, 'package.json')
	const src = readFileSync(file, 'utf8')
	const pkg = JSON.parse(src)
	pkg.pnpm ??= {}
	pkg.pnpm.patchedDependencies ??= {}
	let changed = false
	for (const patch of patches) {
		const target = `patches/${patch.file}`
		const existing = pkg.pnpm.patchedDependencies[patch.specifier]
		if (existing === target) {
			continue
		}
		if (existing !== undefined && !force) {
			report.conflicts.push({
				...patch,
				reason: `pnpm.patchedDependencies already maps ${patch.specifier} → ${existing}`,
			})

			continue
		}

		pkg.pnpm.patchedDependencies[patch.specifier] = target
		changed = true
	}

	if (changed) {
		writeFileSync(file, JSON.stringify(pkg, null, detectIndent(src)) + '\n')
	}
}
