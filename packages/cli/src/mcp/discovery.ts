// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Workspace discovery: find Octane Xplat apps, resolve framework versions from
// the actual installation, detect declared platforms, guidance sources, and
// runtime prerequisites. Every check degrades quietly — discovery never claims
// a missing toolchain or device is ready.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { parse as parseYaml } from 'yaml'

const SKIP_DIRS = new Set([
	'node_modules',
	'.git',
	'dist',
	'build',
	'.turbo',
	'.next',
	'coverage',
	'platforms', // NativeScript-generated native projects — huge and not app source
	'research',
])

const MAX_DEPTH = 5
const XPLAT_DEP = /^@octane-xplat\//

const readJson = (file) => {
	try {
		return JSON.parse(readFileSync(file, 'utf8'))
	} catch {
		return null
	}
}

const run = (cmd, args) => {
	try {
		return execFileSync(cmd, args, {
			encoding: 'utf8',
			timeout: 15000,
			stdio: ['ignore', 'pipe', 'ignore'],
		})
	} catch {
		return null
	}
}

const allDeps = (manifest) => ({ ...manifest?.dependencies, ...manifest?.devDependencies })

const hasRunnableConfig = (dir, manifest) =>
	existsSync(join(dir, 'nativescript.config.ts')) ||
	['vite.config.ts', 'vite.config.mts', 'vite.config.ts', 'vite.config.js'].some((f) =>
		existsSync(join(dir, f)),
	) ||
	manifest?.xplat?.targets !== undefined

const isAppDir = (dir, manifest) => {
	if (!manifest) {
		return false
	}

	const deps = allDeps(manifest)
	const xplatDep = Object.keys(deps).some(
		(name) =>
			XPLAT_DEP.test(name) || name === 'octane' || name === '@nativescript-community/octane',
	)

	return (xplatDep && hasRunnableConfig(dir, manifest)) || manifest?.xplat?.targets !== undefined
}

// Platform detection mirrors packages/cli/src/targets.ts so CLI and MCP agree.
export function detectPlatforms(dir) {
	const manifest = readJson(join(dir, 'package.json'))
	if (!manifest) {
		return []
	}

	const platforms = []
	const deps = allDeps(manifest)

	if (
		['vite.config.ts', 'vite.config.mts', 'vite.config.ts', 'vite.config.js'].some((f) =>
			existsSync(join(dir, f)),
		)
	) {
		platforms.push('web')
	}

	if (existsSync(join(dir, 'nativescript.config.ts'))) {
		for (const platform of ['ios', 'android', 'windows']) {
			if (typeof deps[`@nativescript/${platform}`] === 'string') {
				platforms.push(platform)
			}
		}
	}

	if (manifest.xplat?.targets?.macos?.runtime === 'appkit-node-api') {
		platforms.push('macos')
	}

	if (manifest.xplat?.targets?.linux?.runtime === 'webkitgtk') {
		platforms.push('linux')
	}

	return platforms
}

export function detectGuidance(dir) {
	const sources = []
	const candidates = [
		['AGENTS.md', 'agents-md'],
		['CLAUDE.md', 'claude-md'],
		['.devin', 'devin'],
	]

	for (const [file, kind] of candidates) {
		if (existsSync(join(dir, file))) {
			sources.push({ kind, path: file })
		}
	}

	if (existsSync(join(dir, 'docs'))) {
		sources.push({ kind: 'framework', path: 'docs/' })
	}

	return sources
}

/** Resolve @octane-xplat/* versions from the app's actual node_modules. */
function installedVersions(dir, declared) {
	const scopeDir = join(dir, 'node_modules', '@octane-xplat')
	const found = new Map()
	if (existsSync(scopeDir)) {
		for (const name of readdirSync(scopeDir)) {
			const manifest = readJson(join(scopeDir, name, 'package.json'))
			if (manifest?.version) {
				found.set(`@octane-xplat/${name}`, manifest.version)
			}
		}
	}

	return Object.keys(declared)
		.filter((name) => XPLAT_DEP.test(name))
		.map((name) => {
			const spec = declared[name]
			if (found.has(name)) {
				return { name, version: found.get(name), source: 'installed' }
			}

			if (spec === 'workspace:*' || spec.startsWith('link:') || spec.startsWith('file:')) {
				return { name, version: spec, source: 'workspace', declared: spec }
			}

			return { name, version: null, source: 'unresolved', declared: spec }
		})
}

/** The versions the nearest pnpm lockfile recorded for this importer. */
function lockedVersions(workspaceRoot, appDir, declared) {
	let dir = appDir
	while (true) {
		const lockfile = join(dir, 'pnpm-lock.yaml')
		if (existsSync(lockfile)) {
			try {
				const doc = parseYaml(readFileSync(lockfile, 'utf8'))
				const rel = relative(dir, appDir) || '.'
				const importer = doc?.importers?.[rel] ?? doc?.importers?.['.']
				const locked = importer ? { ...importer.dependencies, ...importer.devDependencies } : {}

				return Object.keys(declared)
					.filter((name) => XPLAT_DEP.test(name))
					.map((name) => ({
						name,
						version: locked[name]?.version ?? locked[name]?.specifier ?? null,
						source: 'lockfile',
						declared: declared[name],
					}))
			} catch {
				return []
			}
		}

		const next = dirname(dir)
		if (next === dir || !resolve(next).startsWith(resolve(workspaceRoot))) {
			return []
		}

		dir = next
	}
}

/** Installed + lockfile comparison: actual installation wins; disagreement is reported. */
export function resolveFrameworkBinding(workspaceRoot, appDir) {
	const declared = allDeps(readJson(join(appDir, 'package.json')))
	const installed = installedVersions(appDir, declared)
	const locked = lockedVersions(workspaceRoot, appDir, declared)

	if (!installed.length && !locked.length) {
		return { packages: [], status: 'unresolved' }
	}

	const installedByName = new Map(installed.map((p) => [p.name, p]))
	const resolved = installed.some((p) => p.source === 'installed' || p.source === 'workspace')
	// Nothing verifiably installed → fall back to the lockfile, labeled provisional.
	const packages = resolved ? installed : locked.map((p) => ({ ...p, source: 'lockfile' }))

	let discrepancy
	for (const lockedPkg of locked) {
		const actual = installedByName.get(lockedPkg.name)
		if (
			actual?.version &&
			lockedPkg.version &&
			lockedPkg.version !== actual.version &&
			!/^(workspace|link|file):/.test(lockedPkg.version)
		) {
			discrepancy = `Lockfile records ${lockedPkg.name}@${lockedPkg.version} but the installation has ${actual.version}; using the actual installation.`
		}
	}

	return {
		packages,
		status: resolved ? 'installed' : 'provisional',
		discrepancy,
	}
}

function scanPackageDirs(root) {
	const found = []
	const visit = (dir, depth) => {
		if (depth > MAX_DEPTH) {
			return
		}

		let entries
		try {
			entries = readdirSync(dir, { withFileTypes: true })
		} catch {
			return
		}

		for (const entry of entries) {
			if (!entry.isDirectory() || SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) {
				continue
			}

			const path = join(dir, entry.name)
			if (existsSync(join(path, 'package.json'))) {
				found.push(path)
				// Still descend — apps can nest (e.g. examples/ inside an app).
			}

			visit(path, depth + 1)
		}
	}

	visit(root, 0)
	return found
}

/**
 * Detect the workspace kind and every app in it. Selection is NOT made here —
 * ambiguous results stay ambiguous until `selectApp`.
 */
export function discoverWorkspace(workspaceRoot) {
	const root = resolve(workspaceRoot)
	const rootManifest = readJson(join(root, 'package.json'))
	const frameworkRepo =
		rootManifest?.name === 'octane-xplat' ||
		readJson(join(root, 'packages', 'ui', 'package.json'))?.name === '@octane-xplat/ui'

	const dirs = [root, ...scanPackageDirs(root)]
	const seen = new Set()
	const apps = []
	for (const dir of dirs) {
		const manifest = readJson(join(dir, 'package.json'))
		if (!manifest || seen.has(dir) || !isAppDir(dir, manifest)) {
			continue
		}

		seen.add(dir)
		const rel = relative(root, dir) || '.'
		apps.push({
			id: rel,
			name: manifest.name ?? rel.split(sep).pop(),
			root: dir,
			relativeRoot: rel,
			kind:
				rel.startsWith('packages' + sep) && frameworkRepo ? 'framework-package' : 'consumer-app',
			platforms: detectPlatforms(dir),
		})
	}

	return {
		workspace: {
			root,
			kind: !rootManifest ? 'empty' : frameworkRepo ? 'framework-repo' : 'consumer',
		},
		apps,
	}
}

/** Resolve an explicit app selector (id, relative path, or package name). */
export function selectApp(discovered, selector) {
	const matches = discovered.apps.filter(
		(app) => app.id === selector || app.relativeRoot === selector || app.name === selector,
	)

	return matches
}

const prerequisiteChecks = [
	{
		id: 'node',
		name: 'Node.js',
		probe: () => ({ status: 'satisfied', detail: process.version }),
	},
	{
		id: 'pnpm',
		name: 'pnpm',
		probe: () =>
			run('pnpm', ['--version'])
				? { status: 'satisfied', detail: run('pnpm', ['--version'])?.trim() }
				: {
						status: 'missing',
						remedy:
							'Install pnpm — runtime sessions spawn the app\u2019s toolchain through `pnpm exec`.',
					},
	},
	{
		id: 'git',
		name: 'Git',
		platforms: undefined, // docs snapshots use it, but every workflow benefits
		probe: () =>
			run('git', ['--version'])
				? { status: 'satisfied', detail: run('git', ['--version'])?.trim() }
				: {
						status: 'missing',
						remedy: 'Install Git — version-matched documentation checkouts need it.',
					},
	},
	{
		id: 'xcode',
		name: 'Xcode command line tools',
		platforms: ['ios', 'macos'],
		probe: () =>
			run('xcodebuild', ['-version'])
				? { status: 'satisfied', detail: run('xcodebuild', ['-version'])?.split('\n')[0] }
				: {
						status: 'missing',
						remedy: 'Install Xcode and run `xcode-select --install`.',
					},
	},
	{
		id: 'adb',
		name: 'Android Debug Bridge',
		platforms: ['android'],
		probe: () =>
			run('adb', ['--version'])
				? { status: 'satisfied', detail: run('adb', ['--version'])?.split('\n')[0] }
				: {
						status: 'missing',
						remedy: 'Install Android platform-tools (adb on PATH).',
					},
	},
	{
		id: 'chromium',
		name: 'Chromium browser',
		platforms: ['web'],
		probe: () => ({
			status: 'unknown',
			remedy: 'Web acceptance checks target Chromium; install it before browser verification runs.',
		}),
	},
]

/** Probe prerequisites relevant to the given declared platforms. */
export function checkPrerequisites(platforms) {
	const wanted = new Set(platforms)
	return prerequisiteChecks
		.filter((check) => !check.platforms || check.platforms.some((p) => wanted.has(p)))
		.map(({ probe, ...meta }) => ({ ...meta, ...probe() }))
}
