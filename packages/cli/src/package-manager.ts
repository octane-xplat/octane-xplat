import { existsSync, globSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseDocument } from 'yaml'
import { parse, type ParseError } from 'jsonc-parser'

/** Read project metadata without treating malformed files as absent. */
export function readProjectPackage(root: string): Record<string, any> {
	const file = join(root, 'package.json')
	return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
}

/** Workspace patterns shared by patch discovery and workspace-root selection. */
export function readProjectWorkspace(root: string, selectedManager?: string): Record<string, any> {
	const pkg = readProjectPackage(root)
	const manager = selectedManager ?? pkg.packageManager?.split('@')[0]
	const yaml = join(root, 'pnpm-workspace.yaml')
	if (manager !== 'bun' && existsSync(yaml)) {
		const doc = parseDocument(readFileSync(yaml, 'utf8'))
		if (doc.errors.length) {
			throw new Error(`Cannot read ${yaml}: ${doc.errors[0].message}`)
		}

		return doc.toJS() ?? {}
	}
	const workspace = pkg.workspaces
	return {
		packages: Array.isArray(workspace) ? workspace : (workspace?.packages ?? []),
		catalog: pkg.catalog ?? workspace?.catalog ?? {},
		catalogs: pkg.catalogs ?? workspace?.catalogs ?? {},
	}
}

/** Enumerate included workspace members, honoring exclusions and nested globs. */
export function workspaceMembers(root: string, manager?: string): string[] {
	const patterns: string[] = readProjectWorkspace(root, manager).packages ?? []
	const included = patterns.filter((pattern) => !pattern.startsWith('!'))
	const excluded = patterns
		.filter((pattern) => pattern.startsWith('!'))
		.map((pattern) => pattern.slice(1))
	return included.length
		? globSync(included, {
				cwd: root,
				exclude: [...excluded, '**/node_modules', '**/node_modules/**', '**/.git', '**/.git/**'],
			}).map((path) => resolve(root, path))
		: []
}

/** Patches belong to the workspace root, including invocations from a member. */
export function packageManagerRoot(dir: string): string {
	const start = resolve(dir)
	for (let at = dirname(start); at !== dirname(at); at = dirname(at)) {
		if (!existsSync(join(at, 'package.json')) && !existsSync(join(at, 'pnpm-workspace.yaml'))) {
			continue
		}

		if (workspaceMembers(at).includes(start)) {
			return at
		}
	}
	return start
}

/** Select the declared package manager before consulting potentially stale locks. */
export function packageManagerFor(dir: string, explicit?: string): 'bun' | 'pnpm' {
	const root = packageManagerRoot(dir)
	const pkg = readProjectPackage(root)
	const declared = explicit ?? pkg.packageManager?.split('@')[0]
	if (declared) {
		if (declared === 'bun' || declared === 'pnpm') {
			return declared
		}

		throw new Error(
			`Xplat supports Bun and pnpm projects; found packageManager ${declared}.`,
		)
	}
	const bun = existsSync(join(root, 'bun.lock')) || existsSync(join(root, 'bun.lockb'))
	const pnpm = existsSync(join(root, 'pnpm-lock.yaml'))
	if (bun && pnpm) {
		throw new Error(
			'Both Bun and pnpm lockfiles exist. Set packageManager in package.json or pass --package-manager.',
		)
	}
	if (bun) {
		return 'bun'
	}
	if (pnpm) {
		return 'pnpm'
	}
	return pkg.patchedDependencies ? 'bun' : 'pnpm'
}

/** Parse Bun's text lockfile (JSON with comments and trailing commas). */
export function readBunLock(root: string): Record<string, any> | null {
	const file = join(root, 'bun.lock')
	if (!existsSync(file)) {
		if (existsSync(join(root, 'bun.lockb'))) {
			throw new Error(
				'xplat patches needs bun.lock. Run bun install --save-text-lockfile --lockfile-only to convert bun.lockb.',
			)
		}

		return null
	}
	const errors: ParseError[] = []
	const lock = parse(readFileSync(file, 'utf8'), errors, { allowTrailingComma: true })
	if (errors.length || !lock || typeof lock !== 'object') {
		throw new Error(`Cannot read ${file}: invalid Bun lockfile`)
	}
	return lock
}

/** Resolve an installed tool through the selected project package manager. */
export function packageManagerExec(dir: string, args: string[]): { cmd: string; args: string[] } {
	const cmd = packageManagerFor(dir)
	return { cmd, args: [cmd === 'bun' ? 'run' : 'exec', ...args] }
}
