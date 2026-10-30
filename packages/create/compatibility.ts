import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** One supported external version, optionally using a preview tarball specifier. */
export type ManagedPackage = {
	version: string
	specifier?: string
	group: string
	singleton?: boolean
}

/** The release-owned pins used by creator, doctor, and upgrade. */
export type Compatibility = {
	schemaVersion: number
	frameworkVersion: string
	tools: { nodeMinimum: string; bun: string; pnpm: string }
	frameworkPackages: string[]
	packages: Record<string, ManagedPackage>
	profiles: Record<string, Record<string, Partial<ManagedPackage>>>
	overrides: Record<string, string>
}

const dir = dirname(fileURLToPath(import.meta.url))
const root = basename(dir) === 'dist' ? dirname(dir) : dir
// Keep JSON on disk: Vite's asset URL transform produces a data URL here.
export const compatibility: Compatibility = createRequire(import.meta.url)(
	join(root, 'compatibility.json'),
)

/** Look up a known framework package or a profile's external dependency pin. */
export function managedPackage(name: string, profile = 'default'): ManagedPackage | undefined {
	if (compatibility.frameworkPackages.includes(name)) {
		return {
			version: compatibility.frameworkVersion,
			group: 'framework',
			singleton: name === '@octane-xplat/ui',
		}
	}

	const base = compatibility.packages[name]
	return base ? { ...base, ...compatibility.profiles[profile]?.[name] } : undefined
}

/** Return the install specifier, keeping preview URLs separate from package versions. */
export function managedSpecifier(name: string, profile = 'default') {
	const entry = managedPackage(name, profile)
	return entry?.specifier ?? entry?.version
}

/** Named catalog reserved for this compatibility profile. */
export const managedCatalog = (profile = 'default') =>
	profile === 'default' ? 'xplat' : `xplat-${profile}`

/** Installed dependency fields; library consumer peers intentionally keep their ranges. */
export const dependencySections = [
	'dependencies',
	'devDependencies',
	'optionalDependencies',
] as const

/** Select Windows preview pins, rejecting a package that also needs mobile pins. */
export function projectProfile(pkg: Record<string, any>): string {
	const deps = Object.assign({}, ...dependencySections.map((section) => pkg[section]))
	const windows = deps['@nativescript/windows'] || pkg.xplat?.targets?.windows
	if (windows && (deps['@nativescript/ios'] || deps['@nativescript/android'])) {
		throw new Error(
			'Windows preview and mobile need separate workspace packages: their NativeScript pins differ',
		)
	}

	return windows ? 'windows' : 'default'
}

/** Find the Bun workspace that owns this app, respecting package membership. */
export function compatibilityRoot(appRoot: string) {
	const app = resolve(appRoot)
	for (let at = dirname(app); dirname(at) !== at; at = dirname(at)) {
		const file = join(at, 'package.json')
		if (!existsSync(file)) {
			continue
		}
		const pkg = JSON.parse(readFileSync(file, 'utf8'))
		const patterns = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces?.packages
		if (!patterns?.length) {
			continue
		}
		const included = patterns.filter((p) => !p.startsWith('!'))
		const exclude = [
			'**/node_modules/**',
			...patterns.filter((p) => p.startsWith('!')).map((p) => p.slice(1)),
		]
		if (globSync(included, { cwd: at, exclude }).some((p) => resolve(at, p) === app)) {
			return at
		}
	}
	return app
}

/** Add missing Bun catalog pins when enabling a target. Existing pins stay intact. */
export function ensureCompatibilityCatalog(appRoot: string, pkg: Record<string, any>) {
	const root = compatibilityRoot(appRoot)
	const file = join(root, 'package.json')
	const owner = root === resolve(appRoot) ? pkg : JSON.parse(readFileSync(file, 'utf8'))
	if (Array.isArray(owner.workspaces)) {
		owner.workspaces = { packages: owner.workspaces }
	}
	owner.workspaces ??= { packages: [] }
	const catalogs = owner.catalogs ?? (owner.workspaces.catalogs ??= {})
	const profile = projectProfile(pkg)
	const catalog = (catalogs[managedCatalog(profile)] ??= {})
	for (const section of dependencySections) {
		for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
			if (spec === `catalog:${managedCatalog(profile)}`) {
				catalog[name] ??= managedSpecifier(name, profile)
			}
		}
	}
	if (owner !== pkg) {
		writeFileSync(file, JSON.stringify(owner, null, '\t') + '\n')
	}
}
