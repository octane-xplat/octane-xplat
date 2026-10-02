// Scaffold manifest + compose/apply shared by create-octane-xplat and the
// CLI's `xplat add`. template/package.json is the canonical store for dep
// versions and script bodies — targets name which keys they own; unclaimed
// files, deps, and scripts are part of the base scaffold. Keeping versions in
// template/package.json means scripts/bump-versions.mjs keeps working
// unchanged at release time.
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from 'node:fs'

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const TEMPLATE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'template')

/** Scaffoldable targets. `files` entries are template-relative paths —
 *  directories copy recursively. `deps`/`devDeps`/`scripts` name keys whose
 *  values come from template/package.json. `typecheck` contributes one clause
 *  to the generated typecheck script. */
export const targets = {
	web: {
		label: 'Web (Vite)',
		files: ['index.html', 'vite.config.ts', 'src/main.web.tsrx'],
		scripts: ['dev', 'build'],
		devDeps: ['@octanejs/vite-plugin'],
	},
	ios: {
		label: 'iOS (NativeScript)',
		requires: ['native-shared'],
		files: ['App_Resources/iOS'],
		scripts: ['dev:ios', 'build:ios'],
		devDeps: ['@nativescript/ios'],
		note: 'needs macOS + Xcode — `pnpm xplat doctor` checks the toolchain',
	},
	android: {
		label: 'Android (NativeScript)',
		requires: ['native-shared'],
		files: ['App_Resources/Android'],
		scripts: ['dev:android', 'build:android'],
		devDeps: ['@nativescript/android'],
		note: 'needs Android SDK + a compatible JDK — `pnpm xplat doctor` checks the toolchain',
	},
	// Shared NativeScript machinery pulled in by ios/android. Not user-
	// selectable on its own. `patches` names the packages whose
	// patchedDependencies entries in pnpm-workspace.yaml belong to this
	// fragment — pnpm hard-fails installs on unused patch entries, so a
	// scaffold must not carry patches for deps it doesn't install.
	'native-shared': {
		hidden: true,
		patches: [
			'@nativescript/core',
			'@nativescript/types',
			'css',
			'@nativescript/vite',
			'@nativescript-community/octane',
			'@nativescript-community/vite-octane',
		],
		files: [
			'nativescript.config.ts',
			'vite.config.native.mts',
			'tsconfig.native.json',
			'references.d.ts',
			'src/main.ts',
		],
		deps: [
			'@nativescript-community/gesturehandler',
			'@nativescript-community/octane',
			'@nativescript-community/ui-drawer',
			'@nativescript/core',
			'@octane-xplat/effects',
			'@valor/nativescript-websockets',
		],
		devDeps: [
			'@nativescript-community/vite-octane',
			'@nativescript/types',
			'@nativescript/vite',
			'nativescript',
		],
		typecheck: 'tsrx-tsc --noEmit -p tsconfig.native.json',
	},
}

export const selectableTargets = Object.keys(targets).filter((id) => !targets[id].hidden)

/** `pnpm create` without --targets and `xplat add`'s prompt default. */
export const defaultTargets = ['web', 'ios', 'android']

const BASE_TYPECHECK = 'tsrx-tsc --noEmit'

// package.json keys every scaffolded app keeps regardless of target set —
// the targets' `scripts` lists own the rest.
const BASE_SCRIPTS = ['xplat', 'lint', 'lint:fix']

/** Expand `requires` edges, dependencies first. Throws on unknown ids. */
export function resolveTargets(ids) {
	const resolved = []
	const visit = (id) => {
		const t = targets[id]
		if (!t) {
			throw new Error(`unknown target "${id}" — expected one of: ${selectableTargets.join(', ')}`)
		}

		for (const req of t.requires ?? []) {
			visit(req)
		}

		if (!resolved.includes(id)) {
			resolved.push(id)
		}
	}

	for (const id of ids) {
		visit(id)
	}

	return resolved
}

const templateManifest = () => JSON.parse(readFileSync(join(TEMPLATE_DIR, 'package.json'), 'utf8'))

/** Which target claims a template-relative path (entries may be dirs). */
function ownerOf(path) {
	for (const [id, t] of Object.entries(targets)) {
		for (const entry of t.files) {
			if (path === entry || path.startsWith(entry + '/')) {
				return id
			}
		}
	}

	return null
}

function walk(dir, prefix = '') {
	const out = []
	for (const name of readdirSync(dir)) {
		if (name === 'node_modules') {
			continue
		}

		const rel = prefix ? `${prefix}/${name}` : name
		if (statSync(join(dir, name)).isDirectory()) {
			out.push(...walk(join(dir, name), rel))
		} else {
			out.push(rel)
		}
	}

	return out
}

function pickKeys(source, names, label) {
	const out = {}
	for (const name of names) {
		if (source[name] === undefined) {
			throw new Error(`template/package.json has no ${label} entry "${name}"`)
		}

		out[name] = source[name]
	}

	return out
}

/**
 * The package.json a given target set produces. With every target selected
 * this is identical to template/package.json.
 */
export function composeManifest(ids) {
	const resolved = resolveTargets(ids)
	const tpl = templateManifest()
	const manifest = { ...tpl }

	for (const section of ['dependencies', 'devDependencies']) {
		const key = section === 'dependencies' ? 'deps' : 'devDeps'
		const wanted = new Set()
		for (const id of resolved) {
			for (const name of targets[id][key] ?? []) {
				wanted.add(name)
			}
		}

		const next = {}
		for (const [name, spec] of Object.entries(tpl[section] ?? {})) {
			// Unclaimed entries are base; claimed entries follow their target.
			const claimed = Object.keys(targets).some((id) => (targets[id][key] ?? []).includes(name))

			if (!claimed || wanted.has(name)) {
				next[name] = spec
			}
		}

		manifest[section] = next
	}

	const wantedScripts = new Set(BASE_SCRIPTS)
	for (const id of resolved) {
		for (const name of targets[id].scripts ?? []) {
			wantedScripts.add(name)
		}
	}

	const scripts = pickKeys(tpl.scripts ?? {}, [...wantedScripts].sort(), 'script')
	const typecheck = [BASE_TYPECHECK]
	for (const id of resolved) {
		if (targets[id].typecheck) {
			typecheck.push(targets[id].typecheck)
		}
	}

	scripts.typecheck = typecheck.join(' && ')
	// Keep the template's key order: scripts sit where they were.
	manifest.scripts = {}
	for (const name of Object.keys(tpl.scripts ?? {})) {
		if (name === 'typecheck' || wantedScripts.has(name)) {
			manifest.scripts[name] = scripts[name]
		}
	}

	if (!resolved.includes('native-shared')) {
		// "main" points at the native entry — meaningless without it.
		delete manifest.main
	}

	return manifest
}

// --- pnpm-workspace.yaml patchedDependencies --------------------------------
// Patch entries look like `  octane@0.6.3: <path>` or
// `  "@nativescript/core@9.1.2": <path>`, each preceded by a comment block.
// Ownership comes from each target's `patches` list; unclaimed entries are
// base and ship in every scaffold.
const PATCH_ENTRY = /^\s+"?(@?[\w./-]+@[\w.-]+)"?:\s+\S+\s*$/

const patchPkg = (key) => key.replace(/@[^@]+$/, '')

// Split a pnpm-workspace.yaml into per-package patch blocks (leading comment
// lines included) so compose can drop entries and apply can transplant them.
function parsePatchEntries(lines) {
	const entries = []
	let inPatches = false
	let pending = []
	for (const line of lines) {
		if (/^\S/.test(line)) {
			inPatches = line.startsWith('patchedDependencies')
			pending = []
			continue
		}

		if (!inPatches) {
			continue
		}

		const m = line.match(PATCH_ENTRY)
		if (m) {
			entries.push({ name: patchPkg(m[1]), comments: pending, line })
			pending = []
		} else {
			pending.push(line)
		}
	}

	return entries
}

/** The pnpm-workspace.yaml a given target set produces. */
export function composeWorkspaceYaml(ids) {
	const resolved = new Set(resolveTargets(ids))
	const drop = new Set()
	for (const [id, t] of Object.entries(targets)) {
		if (!resolved.has(id)) {
			for (const name of t.patches ?? []) {
				drop.add(name)
			}
		}
	}

	const lines = readFileSync(join(TEMPLATE_DIR, 'pnpm-workspace.yaml'), 'utf8').split('\n')
	const out = []
	let inPatches = false
	let pending = []
	for (const line of lines) {
		if (/^\S/.test(line)) {
			out.push(...pending, line)
			pending = []
			inPatches = line.startsWith('patchedDependencies')
			continue
		}

		if (!inPatches) {
			out.push(line)
			continue
		}

		const m = line.match(PATCH_ENTRY)
		if (!m) {
			pending.push(line) // comment/blank inside the section
			continue
		}

		if (drop.has(patchPkg(m[1]))) {
			pending = []
			continue
		}

		out.push(...pending, line)
		pending = []
	}

	out.push(...pending)
	return out.join('\n')
}

/**
 * Add the patch entries that `enabledIds` owns to the app's
 * pnpm-workspace.yaml. Entries already present (by package name, any
 * version) are kept. Returns true if the file changed.
 */
function ensurePatchEntries(appRoot, enabledIds) {
	const needed = new Set()
	for (const id of enabledIds) {
		for (const name of targets[id].patches ?? []) {
			needed.add(name)
		}
	}

	if (!needed.size) {
		return false
	}

	const yamlPath = join(appRoot, 'pnpm-workspace.yaml')
	const appText = existsSync(yamlPath) ? readFileSync(yamlPath, 'utf8') : ''
	const present = new Set(parsePatchEntries(appText.split('\n')).map((e) => e.name))
	const missing = [...needed].filter((name) => !present.has(name))
	if (!missing.length) {
		return false
	}

	const tplText = readFileSync(join(TEMPLATE_DIR, 'pnpm-workspace.yaml'), 'utf8')
	const blocks = parsePatchEntries(tplText.split('\n'))
		.filter((e) => missing.includes(e.name))
		.map((e) => [...e.comments, e.line].join('\n'))

	if (!appText.trim()) {
		writeFileSync(yamlPath, composeWorkspaceYaml(enabledIds))
		return true
	}

	let next = appText
	const lines = next.split('\n')
	const sectionStart = lines.findIndex((l) => l.startsWith('patchedDependencies'))
	if (sectionStart === -1) {
		next = `${appText.trimEnd()}\npatchedDependencies:\n${blocks.join('\n')}\n`
	} else {
		// Insert before the next top-level key (or at EOF).
		let insertAt = lines.length
		for (let i = sectionStart + 1; i < lines.length; i++) {
			if (/^\S/.test(lines[i])) {
				insertAt = i
				break
			}
		}

		lines.splice(insertAt, 0, ...blocks.join('\n').split('\n'))
		next = lines.join('\n')
	}

	writeFileSync(yamlPath, next.endsWith('\n') ? next : next + '\n')
	return true
}

/** Write a scaffold for `ids` into `dir` (must not exist or be empty). */
export function composeTargets(ids, dir) {
	const resolved = new Set(resolveTargets(ids))
	mkdirSync(dir, { recursive: true })

	for (const rel of walk(TEMPLATE_DIR)) {
		if (rel === 'package.json' || rel === 'pnpm-workspace.yaml') {
			continue // generated below
		}

		const owner = ownerOf(rel)
		if (owner && !resolved.has(owner)) {
			continue
		}

		const dest = join(dir, rel === 'gitignore' ? '.gitignore' : rel)
		mkdirSync(dirname(dest), { recursive: true })
		cpSync(join(TEMPLATE_DIR, rel), dest, { recursive: true })
	}

	writeFileSync(join(dir, 'package.json'), JSON.stringify(composeManifest(ids), null, '\t') + '\n')
	writeFileSync(join(dir, 'pnpm-workspace.yaml'), composeWorkspaceYaml(ids))
	return [...resolved]
}

const readJson = (file) => {
	try {
		return JSON.parse(readFileSync(file, 'utf8'))
	} catch {
		return null
	}
}

/** Sentinel-based enablement check, mirroring the CLI's targets.mjs. */
export function targetEnabled(appRoot, id) {
	if (id === 'web') {
		return (
			existsSync(join(appRoot, 'vite.config.ts')) || existsSync(join(appRoot, 'vite.config.mts'))
		)
	}

	if (id === 'native-shared') {
		return existsSync(join(appRoot, 'nativescript.config.ts'))
	}

	// ios/android: declared runtime devDep is the canonical signal — App_Resources
	// alone doesn't reach the bundler config.
	const manifest = readJson(join(appRoot, 'package.json')) ?? {}
	const declared = { ...manifest.dependencies, ...manifest.devDependencies }
	const runtime = { ios: '@nativescript/ios', android: '@nativescript/android' }[id]
	return runtime ? typeof declared[runtime] === 'string' : false
}

/** Copy a template file/dir into the app unless the destination exists. */
function copyMissing(rel, appRoot, report) {
	const src = join(TEMPLATE_DIR, rel)
	const dest = join(appRoot, rel === 'gitignore' ? '.gitignore' : rel)
	if (existsSync(dest)) {
		report.skipped.push(rel)
		return
	}

	mkdirSync(dirname(dest), { recursive: true })
	cpSync(src, dest, { recursive: true })
	report.copied.push(rel)
}

/**
 * Enable `id` (plus unmet `requires`) inside an existing app at `appRoot`.
 * Additive only: existing files, scripts, and dep entries are skipped, never
 * overwritten. Returns a report for the caller to render.
 */
export function applyTarget(appRoot, id) {
	const manifestPath = join(appRoot, 'package.json')
	const raw = readFileSync(manifestPath, 'utf8')
	const manifest = JSON.parse(raw)
	const tpl = templateManifest()
	const report = {
		enabled: [],
		already: [],
		copied: [],
		skipped: [],
		scriptsAdded: [],
		scriptsSkipped: [],
		depsAdded: [],
	}

	let touched = false
	for (const tid of resolveTargets([id])) {
		if (targetEnabled(appRoot, tid)) {
			report.already.push(tid)
			continue
		}

		report.enabled.push(tid)
		const t = targets[tid]
		for (const rel of t.files) {
			copyMissing(rel, appRoot, report)
		}

		for (const [section, key] of [
			['dependencies', 'deps'],
			['devDependencies', 'devDeps'],
		]) {
			for (const name of t[key] ?? []) {
				manifest[section] ??= {}
				if (manifest[section][name] === undefined) {
					manifest[section][name] = tpl[section][name]
					report.depsAdded.push(name)
				}
			}
		}

		manifest.scripts ??= {}
		for (const name of t.scripts ?? []) {
			if (manifest.scripts[name] === undefined) {
				manifest.scripts[name] = tpl.scripts[name]
				report.scriptsAdded.push(name)
			} else if (manifest.scripts[name] !== tpl.scripts[name]) {
				report.scriptsSkipped.push(name)
			}
		}

		if (t.typecheck) {
			const current = manifest.scripts.typecheck ?? ''
			if (!current.includes(t.typecheck)) {
				manifest.scripts.typecheck = current ? `${current} && ${t.typecheck}` : t.typecheck
				report.scriptsAdded.push('typecheck')
			}
		}

		if (tid === 'native-shared' && manifest.main === undefined) {
			manifest.main = tpl.main
		}

		touched = true
	}

	// Newly enabled targets may carry patch entries the scaffolded
	// pnpm-workspace.yaml never had — without them the next install misses the
	// framework patches. enabled+already covers the yaml-missing case, where
	// the file is regenerated for the whole enabled set.
	if (ensurePatchEntries(appRoot, [...report.enabled, ...report.already])) {
		report.patchesAdded = true
	}

	if (touched) {
		// Match the file's existing indent so diffs stay minimal.
		const indent = raw.match(/\n(\s+)"/)?.[1] ?? '\t'
		writeFileSync(manifestPath, JSON.stringify(manifest, null, indent) + '\n')
	}

	return report
}
