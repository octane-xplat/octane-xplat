import {
	existsSync,
	globSync,
	mkdirSync,
	readFileSync,
	realpathSync,
	unlinkSync,
	writeFileSync,
} from 'node:fs'

import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { parseDocument } from 'yaml'
import {
	compatibility,
	dependencySections,
	managedCatalog,
	managedPackage,
	managedSpecifier,
	projectProfile,
} from 'create-octane-xplat/compatibility'

import { canonicalPatchesDir, loadPatchManifest, specifierPackage } from './patches.ts'

export { compatibility, managedPackage, managedSpecifier }

export const readPackage = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
export const localSpecifier = (spec: string) => /^(workspace:|link:|file:|portal:)/.test(spec)
const patchPrefix = 'node_modules/.pnpm-config/@octane-xplat/patches/patches/'

export function workspaceRoot(dir: string) {
	for (let at = resolve(dir); ; at = dirname(at)) {
		if (existsSync(join(at, 'pnpm-workspace.yaml'))) {
			return at
		}

		if (dirname(at) === at) {
			return resolve(dir)
		}
	}
}

export function readWorkspace(root: string) {
	const path = join(root, 'pnpm-workspace.yaml')
	const doc = parseDocument(existsSync(path) ? readFileSync(path, 'utf8') : '{}\n')
	if (doc.errors.length) {
		throw new Error(`${path}: ${doc.errors[0].message}`)
	}
	return doc
}

export function resolveCatalog(spec: string, name: string, config: Record<string, any>): string {
	if (!spec.startsWith('catalog:')) {
		return spec
	}
	const catalog = spec.slice('catalog:'.length)
	return (
		(catalog && catalog !== 'default'
			? config.catalogs?.[catalog]?.[name]
			: config.catalog?.[name]) ?? spec
	)
}

/** Match pnpm package globs, including nested directories and exclusions. */
function workspacePackages(root: string, patterns: string[] = []) {
	const included = patterns.filter((pattern) => !pattern.startsWith('!'))
	const excluded = patterns
		.filter((pattern) => pattern.startsWith('!'))
		.map((pattern) => pattern.slice(1))
	const paths = new Set<string>([root])
	for (const match of included.length
		? globSync(included, { cwd: root, exclude: ['**/node_modules/**', ...excluded] })
		: []) {
		const path = resolve(root, match)
		const rel = relative(realpathSync(root), realpathSync(path))
		if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) {
			throw new Error(
				`Workspace package ${match} points outside ${root}; align it in its own workspace`,
			)
		}

		paths.add(path)
	}
	return [...paths].sort().filter((path) => existsSync(join(path, 'package.json')))
}

export type FileChange = { path: string; before: string | null; after: string }
export type UpgradePlan = {
	root: string
	version: string
	files: FileChange[]
	updates: string[]
	skipped: string[]
	projects: string[]
}

const formatPackage = (pkg: any, raw: string) =>
	JSON.stringify(pkg, null, raw.match(/^([\t ]+)"/m)?.[1] ?? '\t') + '\n'

/** Pure preflight: no writes, installs, or package code execution. */
export function planUpgrade(dir: string): UpgradePlan {
	const root = workspaceRoot(dir)
	const ws = readWorkspace(root)
	const config = ws.toJS() ?? {}
	const paths = workspacePackages(root, config.packages)
	if (!paths.length || !existsSync(join(resolve(dir), 'package.json'))) {
		throw new Error('Run xplat upgrade inside a package with a package.json')
	}

	const plan: UpgradePlan = {
		root,
		version: compatibility.frameworkVersion,
		files: [],
		updates: [],
		skipped: [],
		projects: [],
	}
	const expected = new Map<string, Set<string>>()
	const expectedSpecs = new Map<string, Set<string>>()
	const applicable = new Set<string>()
	const packages = paths.map((path) => {
		const file = join(path, 'package.json')
		const raw = readFileSync(file, 'utf8')
		return { path, file, raw, pkg: JSON.parse(raw) }
	})
	const change = (path: string, after: string) => {
		const before = existsSync(path) ? readFileSync(path, 'utf8') : null
		if (after !== before) {
			plan.files.push({ path, before, after })
		}
	}

	for (const { path, pkg } of packages) {
		const profile = projectProfile(pkg)
		const label = relative(root, path) || '.'
		// Octane's compiler peer must stay visible to pnpm; it is not hidden in the CLI.
		const deps = Object.assign({}, ...dependencySections.map((section) => pkg[section]))
		if (deps.octane && !deps['@tsrx/oxc'] && !localSpecifier(deps.octane)) {
			pkg.devDependencies ??= {}
			pkg.devDependencies['@tsrx/oxc'] = managedSpecifier('@tsrx/oxc', profile)
			plan.updates.push(`${label}: add @tsrx/oxc compiler peer`)
		}
		// The mason layout cutover: the patched NativeScript driver resolves the
		// container intrinsics to MasonKit views, so every octane-driven app needs
		// the engine package declared.
		if (
			deps['@nativescript-community/octane'] &&
			!deps['@triniwiz/nativescript-masonkit'] &&
			!localSpecifier(deps['@nativescript-community/octane'])
		) {
			pkg.dependencies ??= {}
			pkg.dependencies['@triniwiz/nativescript-masonkit'] = managedSpecifier(
				'@triniwiz/nativescript-masonkit',
				profile,
			)
			plan.updates.push(`${label}: add @triniwiz/nativescript-masonkit mason engine`)
		}

		for (const section of dependencySections) {
			for (const [name, declared] of Object.entries(pkg[section] ?? {}) as [string, string][]) {
				const managed = managedPackage(name, profile)
				if (!managed) {
					continue
				}

				const spec = resolveCatalog(declared, name, config)
				if (localSpecifier(spec)) {
					plan.skipped.push(`${label}: keep ${name} ${declared}`)
					continue
				}

				const desired = managedSpecifier(name, profile)!
				if ((/^[\w+.-]+:/.test(spec) || spec.includes('/')) && spec !== desired) {
					throw new Error(
						`${label}: ${name} uses a custom source; replace it with a registry pin or a local dependency before upgrading`,
					)
				}

				const catalog = managedCatalog(profile)
				pkg[section][name] = `catalog:${catalog}`
				ws.setIn(['catalogs', catalog, name], desired)
				if (declared !== `catalog:${catalog}` || spec !== desired) {
					plan.updates.push(`${label}: ${name} ${spec} → ${desired}`)
				}

				applicable.add(name)
				if (!plan.projects.includes(path)) {
					plan.projects.push(path)
				}

				const versions = expected.get(name) ?? new Set<string>()
				versions.add(managed.version)
				expected.set(name, versions)
				const specs = expectedSpecs.get(name) ?? new Set<string>()
				specs.add(desired)
				expectedSpecs.set(name, specs)
			}
		}

		if (
			path === root ||
			dependencySections.some((section) =>
				Object.keys(pkg[section] ?? {}).some((name) => applicable.has(name)),
			)
		) {
			pkg.packageManager = `pnpm@${compatibility.tools.pnpm}`
			pkg.engines ??= {}
			pkg.engines.node ??= `>=${compatibility.tools.nodeMinimum}`
		}
	}

	// pnpm uses root overrides, including legacy package.json settings. Preserve
	// unrelated selectors and stop on ambiguous profile-specific overrides.
	const rootPackage = packages.find((pkg) => pkg.path === root)
	for (const overrides of [config.overrides ?? {}, rootPackage?.pkg.pnpm?.overrides ?? {}]) {
		for (const [selector, value] of Object.entries(overrides)) {
			const name = specifierPackage(selector.split('>').at(-1)!)
			if (!applicable.has(name)) {
				continue
			}

			const versions = expected.get(name)!
			if (versions.size !== 1) {
				throw new Error(
					`Override ${selector} spans incompatible profiles; scope it to the appropriate workspace package`,
				)
			}

			const desired = [...versions][0]
			const source = resolveCatalog(String(value), name, config)
			if (!expectedSpecs.get(name)!.has(source)) {
				throw new Error(
					`Override ${selector} conflicts with ${desired}; remove this override before upgrading`,
				)
			}
		}
	}
	for (const [selector, version] of Object.entries(compatibility.overrides)) {
		const existing = config.overrides?.[selector]
		if (existing && existing !== version) {
			throw new Error(`Override ${selector} conflicts with framework pin ${version}`)
		}

		ws.setIn(['overrides', selector], version)
	}

	const oldPatches = {
		...rootPackage?.pkg.pnpm?.patchedDependencies,
		...config.patchedDependencies,
	}
	const wanted = loadPatchManifest().filter((patch) => {
		const name = specifierPackage(patch.specifier)
		const version = patch.specifier.slice(name.length + 1)
		const versions = expected.get(name)
		if (versions) {
			return versions.has(version)
		}
		return patch.template !== false && !managedPackage(name)
	})
	for (const patch of wanted) {
		const existing = oldPatches[patch.specifier]
		if (existing && !String(existing).startsWith(patchPrefix)) {
			const file = resolve(root, existing)
			const canonical = readFileSync(join(canonicalPatchesDir, patch.file))
			if (!existsSync(file) || !canonical.equals(readFileSync(file))) {
				throw new Error(
					`Custom patch for ${patch.specifier} at ${existing} differs from the framework patch; reconcile it before upgrading`,
				)
			}
		}
	}

	const wantedSpecs = new Set(wanted.map((patch) => patch.specifier))
	for (const [specifier, path] of Object.entries(oldPatches)) {
		// Only remove entries supplied by the framework config package. Local
		// user-owned patch files and mappings survive, including obsolete versions.
		if (String(path).startsWith(patchPrefix) && !wantedSpecs.has(specifier)) {
			delete oldPatches[specifier]
		}
	}
	for (const patch of wanted) {
		oldPatches[patch.specifier] ??= `${patchPrefix}${patch.file}`
	}
	if (Object.keys(oldPatches).length) {
		ws.set('patchedDependencies', oldPatches)
		ws.set('allowUnusedPatches', true)
	}
	if (wanted.some((patch) => oldPatches[patch.specifier].startsWith(patchPrefix))) {
		ws.setIn(['configDependencies', '@octane-xplat/patches'], compatibility.frameworkVersion)
	}
	if (rootPackage?.pkg.pnpm?.patchedDependencies) {
		delete rootPackage.pkg.pnpm.patchedDependencies
	}

	for (const { file, raw, pkg } of packages) {
		const after = formatPackage(pkg, raw)
		// Avoid reformatting package files whose values did not change.
		if (JSON.stringify(JSON.parse(raw)) !== JSON.stringify(pkg)) {
			change(file, after)
		}
	}
	change(join(root, 'pnpm-workspace.yaml'), String(ws))
	return plan
}

/** Refuse stale previews and roll back authored files if a write fails. */
export function applyUpgrade(plan: UpgradePlan) {
	for (const file of plan.files) {
		const current = existsSync(file.path) ? readFileSync(file.path, 'utf8') : null
		if (current !== file.before) {
			throw new Error(`${file.path} changed during upgrade; rerun xplat upgrade`)
		}
	}
	const written: FileChange[] = []
	try {
		for (const file of plan.files) {
			written.push(file)
			mkdirSync(dirname(file.path), { recursive: true })
			writeFileSync(file.path, file.after)
		}
	} catch (error) {
		for (const file of written.reverse()) {
			if (file.before === null) {
				if (existsSync(file.path)) {
					unlinkSync(file.path)
				}
			} else {
				writeFileSync(file.path, file.before)
			}
		}

		throw error
	}
}
