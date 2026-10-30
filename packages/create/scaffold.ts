// Scaffold manifest + compose/apply shared by create-octane-xplat and the
// CLI's `xplat add`. compatibility.json owns version pins; the generated
// templates own script bodies and the dependency set for each starter.
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from 'node:fs'

import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureCompatibilityCatalog, compatibilityRoot } from './compatibility.ts'

const moduleDir = dirname(fileURLToPath(import.meta.url))
// dist/ emit sits one level deeper than the root sources it mirrors.
const pkgRoot = basename(moduleDir) === 'dist' ? join(moduleDir, '..') : moduleDir
export const TEMPLATE_DIR = join(pkgRoot, 'template')
export const LIBRARY_TEMPLATE_DIR = join(pkgRoot, 'library-template')

/** Scaffoldable targets. `files` entries are template-relative paths —
 *  directories copy recursively. `deps`/`devDeps`/`scripts` name keys whose
 *  values come from template/package.json. `typecheck` contributes one clause
 *  to the generated typecheck script. */
export const targets: Record<string, any> = {
	web: {
		label: 'Web (Vite)',
		files: [
			'index.html',
			'vite.config.ts',
			'src/main.web.tsrx',
			'vitest.web.config.mts',
			'src/app.web.test.tsx',
			'src/test-setup.web.ts',
		],
		scripts: ['dev', 'build', 'test', 'test:web'],
		devDeps: ['@octanejs/vite-plugin', 'jsdom'],
	},
	ios: {
		label: 'iOS (NativeScript)',
		requires: ['native-shared'],
		files: ['App_Resources/iOS'],
		scripts: ['dev:ios', 'build:ios', 'test:ios'],
		devDeps: ['@nativescript/ios'],
		note: 'needs macOS + Xcode — `bun run xplat doctor` checks the toolchain',
	},
	android: {
		label: 'Android (NativeScript)',
		requires: ['native-shared'],
		files: ['App_Resources/Android'],
		scripts: ['dev:android', 'build:android', 'test:android'],
		devDeps: ['@nativescript/android'],
		note: 'needs Android SDK + a compatible JDK — `bun run xplat doctor` checks the toolchain',
	},
	// Shared NativeScript machinery pulled in by ios/android. Not user-
	// selectable on its own. `patches` names the packages whose
	// patchedDependencies entries in package.json belong to this
	// fragment — Bun hard-fails installs on unused patch entries, so a
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
			'references.d.ts',
			'src/main.ts',
			'vitest.config.mts',
			'src/test.ts',
			'src/app.spec.tsrx',
			'src/native-runtime.spec.ts',
			'src/failure-reporting.spec.ts',
		],
		deps: [
			'@nativescript-community/octane',
			'@nativescript/core',
			'@valor/nativescript-websockets',
		],
		devDeps: [
			'@nativescript-community/vite-octane',
			'@nativescript/types',
			'@nativescript/unit-test-runner',
			'@nativescript/vite',
			'nativescript',
		],
		typecheck: 'xplat typecheck',
	},
}

export const selectableTargets = Object.keys(targets).filter((id) => !targets[id].hidden)

/** `bun create` without --targets and `xplat add`'s prompt default. */
export const defaultTargets = ['web', 'ios', 'android']

const BASE_TYPECHECK = 'xplat typecheck'

// package.json keys every scaffolded app keeps regardless of target set —
// the targets' `scripts` lists own the rest.
const BASE_SCRIPTS = ['xplat', 'lint', 'lint:fix', 'format']

/** Expand `requires` edges, dependencies first. Throws on unknown ids. */
export function resolveTargets(ids) {
	const resolved: string[] = []
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
	const out: string[] = []
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
	const out: Record<string, string> = {}
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
	const manifest: Record<string, any> = { ...tpl }

	for (const section of ['dependencies', 'devDependencies']) {
		const key = section === 'dependencies' ? 'deps' : 'devDeps'
		const wanted = new Set<string>()
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
	const typecheck: string[] = [BASE_TYPECHECK]
	for (const id of resolved) {
		if (targets[id].typecheck) {
			typecheck.push(targets[id].typecheck)
		}
	}

	scripts.typecheck = [...new Set(typecheck)].join(' && ')
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

	const drop = new Set(
		Object.entries(targets)
			.filter(([id]) => !resolved.includes(id))
			.flatMap(([, target]) => target.patches ?? []),
	)
	manifest.patchedDependencies = Object.fromEntries(
		Object.entries(tpl.patchedDependencies).filter(
			([key]) => !drop.has(key.slice(0, key.indexOf('@', 1))),
		),
	)
	const used = new Set([
		...Object.keys(manifest.dependencies),
		...Object.keys(manifest.devDependencies),
	])
	manifest.workspaces = {
		...tpl.workspaces,
		catalogs: {
			...tpl.workspaces.catalogs,
			xplat: Object.fromEntries(
				Object.entries(tpl.workspaces.catalogs.xplat).filter(([name]) => used.has(name)),
			),
		},
	}
	return manifest
}

/** Add target-owned local patches before installing newly enabled dependencies. */
function ensurePatchEntries(appRoot, enabledIds, manifest) {
	const root = compatibilityRoot(appRoot)
	const file = join(root, 'package.json')
	const pkg = root === resolve(appRoot) ? manifest : JSON.parse(readFileSync(file, 'utf8'))
	const needed = new Set(enabledIds.flatMap((id) => targets[id].patches ?? []))
	const template = templateManifest()
	const present = new Set(
		Object.keys(pkg.patchedDependencies ?? {}).map((key) => key.slice(0, key.indexOf('@', 1))),
	)
	let changed = false
	pkg.patchedDependencies ??= {}
	for (const [specifier, path] of Object.entries(template.patchedDependencies) as [
		string,
		string,
	][]) {
		const name = specifier.slice(0, specifier.indexOf('@', 1))
		if (!needed.has(name) || present.has(name)) {
			continue
		}
		const source = join(TEMPLATE_DIR, path)
		const destination = join(root, path)
		if (existsSync(destination) && !readFileSync(source).equals(readFileSync(destination))) {
			throw new Error(
				`Custom patch ${destination} differs from the framework patch; reconcile it first`,
			)
		}
		mkdirSync(dirname(destination), { recursive: true })
		cpSync(source, destination)
		pkg.patchedDependencies[specifier] = path
		changed = true
	}
	if (changed && root !== resolve(appRoot)) {
		writeFileSync(file, JSON.stringify(pkg, null, '\t') + '\n')
	}
	return changed
}

/**
 * The tsconfig.json a given target set produces. One program covers every
 * platform suffix (moduleSuffixes is the fixed precedence order); a web-only
 * scaffold just drops the native ambient root and entrypoint.
 */
export function composeTsconfig(ids) {
	const resolved = new Set(resolveTargets(ids))
	const config = JSON.parse(readFileSync(join(TEMPLATE_DIR, 'tsconfig.json'), 'utf8'))
	if (!resolved.has('native-shared')) {
		delete config.files
		config.compilerOptions.types = (config.compilerOptions.types ?? []).filter(
			(t) => t !== '@nativescript/types',
		)

		config.exclude = [...new Set([...(config.exclude ?? []), 'src/main.ts'])]
	}

	return JSON.stringify(config, null, '\t') + '\n'
}

/** Write a scaffold with tests for `ids` into `dir` (must not exist or be empty). */
export function composeTargets(ids, dir) {
	const resolved = new Set(resolveTargets(ids))
	mkdirSync(dir, { recursive: true })

	for (const rel of walk(TEMPLATE_DIR)) {
		if (rel === 'package.json' || rel === 'tsconfig.json') {
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
	writeFileSync(join(dir, 'tsconfig.json'), composeTsconfig(ids))
	return [...resolved]
}

/** Write the cross-platform library starter into `dir`. */
export function composeLibrary(dir, packageName = basename(resolve(dir))) {
	if (
		packageName.length > 214 ||
		!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(packageName)
	) {
		throw new Error(
			`invalid npm package name "${packageName}" — use lowercase letters, numbers, dots, underscores, or hyphens`,
		)
	}

	mkdirSync(dir, { recursive: true })
	for (const rel of walk(LIBRARY_TEMPLATE_DIR)) {
		if (rel === 'package.json') {
			continue
		}

		const dest = join(dir, rel === 'gitignore' ? '.gitignore' : rel)
		mkdirSync(dirname(dest), { recursive: true })
		const source = join(LIBRARY_TEMPLATE_DIR, rel)
		if (/\.(?:md|ts|tsx|mjs|json)$/.test(rel)) {
			const content = readFileSync(source, 'utf8').replaceAll('octane-xplat-library', packageName)
			writeFileSync(dest, content)
		} else {
			cpSync(source, dest, { recursive: true })
		}
	}

	const manifest = JSON.parse(readFileSync(join(LIBRARY_TEMPLATE_DIR, 'package.json'), 'utf8'))
	manifest.name = packageName
	writeFileSync(join(dir, 'package.json'), JSON.stringify(manifest, null, '\t') + '\n')
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
	const manifest: Record<string, any> = readJson(join(appRoot, 'package.json')) ?? {}
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
 * Fold a native-capable app's sources into the one tsconfig program: the
 * manifest (tsconfig.envs.json) is gone — one program covers every platform
 * suffix — so enabling native means wiring the ambient declaration file and
 * the entrypoint into the app's own config.
 */
function enableNativeInTsconfig(appRoot) {
	const path = join(appRoot, 'tsconfig.json')
	const text = existsSync(path) ? readFileSync(path, 'utf8') : ''
	const config = readJson(path)
	if (!config || typeof config !== 'object') {
		return false
	}

	const indent = text.match(/\n(\s+)"/)?.[1] ?? '\t'
	config.files = [...new Set(['references.d.ts', ...(config.files ?? [])])]
	config.exclude = (config.exclude ?? []).filter((e) => e !== 'src/main.ts')

	const types = config.compilerOptions?.types
	if (config.compilerOptions && Array.isArray(types) && !types.includes('@nativescript/types')) {
		config.compilerOptions.types = [...types, '@nativescript/types']
	}

	writeFileSync(path, JSON.stringify(config, null, indent) + '\n')
	return true
}

/**
 * Enable `id` (plus unmet `requires`) inside an existing app at `appRoot`.
 * Additive only: existing files, scripts, and dep entries are skipped, never
 * overwritten. Returns a report for the caller to render.
 */
export function applyTarget(appRoot, id) {
	const manifestPath = join(appRoot, 'package.json')
	const raw = readFileSync(manifestPath, 'utf8')
	const manifest: Record<string, any> = JSON.parse(raw)
	const tpl = templateManifest()
	const report: Record<string, any> = {
		enabled: [],
		already: [],
		copied: [],
		skipped: [],
		scriptsAdded: [],
		scriptsSkipped: [],
		depsAdded: [],
	}

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

		if (tid === 'native-shared') {
			if (manifest.main === undefined) {
				manifest.main = tpl.main
			}

			// Native sources join the app's single typecheck program — pull the
			// ambient declaration entry into the roots and un-exclude the
			// NativeScript entry that a web-only scaffold skips.
			report.tsconfigUpdated = enableNativeInTsconfig(appRoot)
		}
	}

	// Newly enabled targets may carry patch entries the scaffolded
	// package.json never had — without them the next install misses the
	// framework patches. enabled+already covers the yaml-missing case, where
	// the file is regenerated for the whole enabled set.
	if (ensurePatchEntries(appRoot, [...report.enabled, ...report.already], manifest)) {
		report.patchesAdded = true
	}
	ensureCompatibilityCatalog(appRoot, manifest)

	if (JSON.stringify(manifest) !== JSON.stringify(JSON.parse(raw))) {
		// Match the file's existing indent so diffs stay minimal.
		const indent = raw.match(/\n(\s+)"/)?.[1] ?? '\t'
		writeFileSync(manifestPath, JSON.stringify(manifest, null, indent) + '\n')
	}
	return report
}
