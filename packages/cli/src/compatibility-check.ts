import { existsSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { dependencySections, projectProfile } from 'create-octane-xplat/compatibility'
import {
	compatibility,
	localSpecifier,
	managedPackage,
	managedSpecifier,
	readPackage,
	readWorkspace,
	resolveCatalog,
	workspaceRoot,
} from './compatibility.ts'

export type CompatibilityCheck = { name: string; ok: boolean; detail: string; hint?: string }

/** Resolve metadata without importing package code, including export-restricted packages. */
function installedPackage(from: string, name: string) {
	const require = createRequire(join(from, 'package.json'))
	for (const path of require.resolve.paths(name) ?? []) {
		const file = join(path, name, 'package.json')
		if (existsSync(file)) {
			const dir = realpathSync(join(path, name))
			return { dir, pkg: readPackage(join(dir, 'package.json')) }
		}
	}
	return undefined
}

const versionTuple = (version: string) =>
	version.replace(/^v/, '').split(/[.-]/).slice(0, 3).map(Number)

const atLeast = (actual: string, minimum: string) => {
	const left = versionTuple(actual)
	const right = versionTuple(minimum)
	if (left.length !== 3 || left.some(Number.isNaN)) {
		return false
	}
	for (let index = 0; index < 3; index++) {
		if (left[index] !== right[index]) {
			return left[index] > right[index]
		}
	}
	return true
}

function commandVersion(command: string, cwd: string) {
	try {
		return execFileSync(command, ['--version'], { cwd, encoding: 'utf8', timeout: 10000 }).trim()
	} catch {
		return 'unavailable'
	}
}

/** Declarations and the reachable installed graph are independent checks. */
export function inspectCompatibility(
	dir: string,
	tools?: { node: string; pnpm: string },
): CompatibilityCheck[] {
	dir = realpathSync(resolve(dir))
	const root = workspaceRoot(dir)
	const config = readWorkspace(root).toJS() ?? {}
	const pkg = readPackage(join(dir, 'package.json'))
	const profile = projectProfile(pkg)
	const rows: CompatibilityCheck[] = []
	const row = (
		name: string,
		ok: boolean,
		detail: string,
		hint = 'run xplat upgrade, then pnpm xplat doctor',
	) => rows.push({ name, ok, detail, ...(!ok && { hint }) })
	const runtime = tools ?? { node: commandVersion('node', dir), pnpm: commandVersion('pnpm', dir) }
	row(
		'compatibility Node',
		atLeast(runtime.node, compatibility.tools.nodeMinimum),
		`${runtime.node}; requires >=${compatibility.tools.nodeMinimum}`,
		`install Node >=${compatibility.tools.nodeMinimum}`,
	)
	row(
		'compatibility pnpm',
		runtime.pnpm === compatibility.tools.pnpm,
		`${runtime.pnpm}; expected ${compatibility.tools.pnpm}`,
		`use pnpm ${compatibility.tools.pnpm}`,
	)
	const rootPkg = existsSync(join(root, 'package.json'))
		? readPackage(join(root, 'package.json'))
		: pkg
	row(
		'compatibility packageManager',
		rootPkg.packageManager?.split('+')[0] === `pnpm@${compatibility.tools.pnpm}`,
		rootPkg.packageManager ?? 'packageManager is missing',
	)

	const local = new Set<string>()
	const declared = Object.assign({}, ...dependencySections.map((section) => pkg[section]))
	for (const [name, spec] of Object.entries(declared) as [string, string][]) {
		if (!managedPackage(name, profile)) {
			continue
		}

		const resolved = resolveCatalog(spec, name, config)
		if (localSpecifier(resolved)) {
			local.add(name)
			continue
		}

		const expected = managedSpecifier(name, profile)
		row(`compatibility pin ${name}`, resolved === expected, `${resolved}; expected ${expected}`)
	}
	if (declared.octane && !declared['@tsrx/oxc'] && !local.has('octane')) {
		row(
			'compatibility compiler peer @tsrx/oxc',
			false,
			'Octane requires the app to declare @tsrx/oxc',
		)
	}
	// The patched NativeScript driver imports the mason engine for container
	// layout — apps using it must declare the package.
	if (
		declared['@nativescript-community/octane'] &&
		!declared['@triniwiz/nativescript-masonkit'] &&
		!local.has('@nativescript-community/octane')
	) {
		row(
			'compatibility mason engine @triniwiz/nativescript-masonkit',
			false,
			'the NativeScript driver requires @triniwiz/nativescript-masonkit for container layout',
			'run pnpm xplat upgrade (or add the catalog pin)',
		)
	}

	const queue = Object.keys(declared).map((name) => ({
		from: dir,
		name,
		required: !pkg.optionalDependencies?.[name],
	}))
	const visited = new Set<string>()
	const checked = new Set<string>()
	const singletons = new Map<string, Map<string, string>>()
	for (let index = 0; index < queue.length; index++) {
		const { from, name, required } = queue[index]
		const installed = installedPackage(from, name)
		if (!installed) {
			const key = `${from}:${name}`
			if (required && managedPackage(name, profile) && !checked.has(key)) {
				checked.add(key)
				row(
					`compatibility installed ${name}`,
					false,
					`package is not installed (required by ${relative(dir, from) || '.'})`,
					'run pnpm install',
				)
			}

			continue
		}

		const { dir: location, pkg: dependency } = installed
		const identity = dependency.name ?? name
		const managed = managedPackage(identity, profile)
		if (managed?.singleton) {
			const copies = singletons.get(identity) ?? new Map<string, string>()
			copies.set(location, dependency.version)
			singletons.set(identity, copies)
		}

		if (managed && !local.has(name) && !checked.has(`${name}:${location}`)) {
			checked.add(`${name}:${location}`)
			// Only the app-resolved copy carries the version contract (plus
			// singletons, where every physical copy matters) — a private nested
			// copy pinned by an upstream package (e.g. nativescript's own
			// typescript) is that package's implementation detail.
			if (from === dir || managed.singleton) {
				row(
					`compatibility installed ${identity}`,
					dependency.version === managed.version,
					`${dependency.version} at ${relative(dir, location) || '.'}; expected ${managed.version}`,
				)
			}
		}

		if (visited.has(location)) {
			continue
		}

		visited.add(location)
		for (const [child, spec] of Object.entries({
			...dependency.dependencies,
			...dependency.optionalDependencies,
			...dependency.peerDependencies,
		}) as [string, string][]) {
			if (localSpecifier(spec)) {
				local.add(child)
			}

			const required =
				!dependency.optionalDependencies?.[child] &&
				(Boolean(dependency.dependencies?.[child]) ||
					!dependency.peerDependenciesMeta?.[child]?.optional)

			queue.push({ from: location, name: child, required })
		}
	}
	for (const [name, copies] of singletons) {
		row(
			`compatibility singleton ${name}`,
			copies.size === 1,
			copies.size === 1
				? 'one runtime copy'
				: `${copies.size} runtime copies: ${[...copies].map(([path, version]) => `${version} (${relative(dir, path)})`).join(', ')}`,
			'align dependency pins and remove nested runtime copies; run pnpm why ' + name,
		)
	}
	return rows
}
