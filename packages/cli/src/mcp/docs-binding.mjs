// Installed-version resolution (plans/octane-xplat-mcp.md: "Installed-version
// documentation binding"). Declared ranges are not enough — the binding reads
// the resolved installation under node_modules. A lockfile-only entry is
// provisional; a lockfile/install disagreement is reported and the actual
// installation wins. Linked/workspace deps become development bindings.

import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { releaseMapping } from './release-map.mjs'

const SCOPED_DIR = '@octane-xplat'
const UNSCOPED = ['tsrx-typegen', 'create-octane-xplat']

const readJson = (path) => {
	try {
		return JSON.parse(readFileSync(path, 'utf8'))
	} catch {
		return null
	}
}

/** Versions a pnpm-lock.yaml records for this importer (empty when absent). */
function lockfileVersions(projectRoot) {
	const file = join(projectRoot, 'pnpm-lock.yaml')
	if (!existsSync(file)) {
		return {}
	}

	let doc
	try {
		doc = parseYaml(readFileSync(file, 'utf8'))
	} catch {
		return {}
	}

	const out = {}
	const importer = doc?.importers?.['.']
	for (const section of ['dependencies', 'devDependencies']) {
		for (const [name, entry] of Object.entries(importer?.[section] ?? {})) {
			// pnpm locks { specifier, version } objects; version may carry a
			// (peer) suffix that is not part of the released version.
			const raw = typeof entry === 'string' ? entry : entry?.version
			if (raw) {
				out[name] = String(raw).replace(/[(@].*$/, '')
			}
		}
	}

	return out
}

/** package.json specs for this workspace (link:/file:/workspace: detection). */
function declaredSpecs(projectRoot) {
	const pkg = readJson(join(projectRoot, 'package.json'))
	const specs = {}
	for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
		for (const [name, spec] of Object.entries(pkg?.[section] ?? {})) {
			specs[name] = spec
		}
	}

	return specs
}

function installedEntry(nodeModules, name) {
	const dir = join(nodeModules, name)
	const manifest = join(dir, 'package.json')
	if (!existsSync(manifest)) {
		return null
	}

	const pkg = readJson(manifest)
	if (!pkg?.name || !pkg?.version) {
		return null
	}

	return {
		name: pkg.name,
		version: pkg.version,
		installPath: dir,
		linked: lstatSync(dir).isSymbolicLink(),
	}
}

/**
 * Resolve every release-mapped Octane Xplat package in a consumer project.
 *
 * @returns {{
 *   packages: Array<{ name: string, version: string, kind: 'registry'|'linked',
 *     installPath: string|null, source: 'installed'|'lockfile-provisional' }>,
 *   discrepancies: string[],
 *   fingerprint: string,
 * }}
 */
export function resolveInstallations(projectRoot) {
	const nodeModules = join(projectRoot, 'node_modules')
	const specs = declaredSpecs(projectRoot)
	const locked = lockfileVersions(projectRoot)
	const candidates = new Set()

	const scopedDir = join(nodeModules, SCOPED_DIR)
	if (existsSync(scopedDir)) {
		for (const entry of readdirSync(scopedDir)) {
			if (entry.startsWith('.')) {
				continue
			}

			candidates.add(`${SCOPED_DIR}/${entry}`)
		}
	}

	for (const name of [...UNSCOPED, ...Object.keys(specs), ...Object.keys(locked)]) {
		if (name.startsWith(`${SCOPED_DIR}/`) || UNSCOPED.includes(name)) {
			candidates.add(name)
		}
	}

	const packages = []
	const discrepancies = []
	for (const name of [...candidates].sort()) {
		if (!releaseMapping(name, '0.0.0')) {
			continue
		}

		const entry = installedEntry(nodeModules, name)
		if (entry) {
			const kind =
				entry.linked || /^(link|file|workspace|portal):/.test(specs[name] ?? '')
					? 'linked'
					: 'registry'

			packages.push({
				name,
				version: entry.version,
				kind,
				installPath: entry.installPath,
				source: 'installed',
			})

			if (locked[name] && locked[name] !== entry.version) {
				discrepancies.push(
					`${name}: lockfile records ${locked[name]} but ${entry.version} is installed; using the installation`,
				)
			}
		} else if (locked[name]) {
			// Declared but not installed — provisional, never silently latest.
			packages.push({
				name,
				version: locked[name],
				kind: /^(link|file|workspace|portal):/.test(specs[name] ?? '') ? 'linked' : 'registry',
				installPath: null,
				source: 'lockfile-provisional',
			})
		}
	}

	const fingerprint = createHash('sha256')
		.update(packages.map((p) => `${p.name}@${p.version}:${p.kind}`).join('\n'))
		.digest('hex')

	return { packages, discrepancies, fingerprint }
}

/** Real location of a linked package's repo docs dir (walk to workspace root). */
export function developmentDocsDir(installPath) {
	let dir = resolve(realpathSync(installPath))
	for (let i = 0; i < 8; i++) {
		if (existsSync(join(dir, 'pnpm-workspace.yaml')) || existsSync(join(dir, '.git'))) {
			const docs = join(dir, 'docs')
			return existsSync(docs) ? docs : null
		}

		const parent = dirname(dir)
		if (parent === dir) {
			break
		}

		dir = parent
	}

	return null
}
