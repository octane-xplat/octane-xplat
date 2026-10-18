import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDocument } from 'yaml'

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
	tools: { nodeMinimum: string; pnpm: string }
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

/** Return the pnpm specifier, keeping preview URLs separate from package versions. */
export function managedSpecifier(name: string, profile = 'default') {
	const entry = managedPackage(name, profile)
	return entry?.specifier ?? entry?.version
}

/** Named pnpm catalog reserved for this compatibility profile. */
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

/** Add missing pins when enabling a target in an older scaffold. Existing pins stay intact. */
export function ensureCompatibilityCatalog(appRoot: string, pkg: Record<string, any>) {
	const path = join(appRoot, 'pnpm-workspace.yaml')
	const before = existsSync(path) ? readFileSync(path, 'utf8') : ''
	const doc = parseDocument(before || '{}\n')
	if (doc.errors.length) {
		throw new Error(`${path}: ${doc.errors[0].message}`)
	}

	const profile = projectProfile(pkg)
	for (const section of dependencySections) {
		for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
			if (spec !== `catalog:${managedCatalog(profile)}`) {
				continue
			}

			const key = ['catalogs', managedCatalog(profile), name]
			if (!doc.hasIn(key)) {
				doc.setIn(key, managedSpecifier(name, profile))
			}
		}
	}

	const after = String(doc)
	if (after !== before) {
		writeFileSync(path, after)
	}
}
