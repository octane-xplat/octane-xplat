// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Code corpus scoping and exclusion rules (plans/octane-xplat-mcp.md work
// item C). Corpora stay distinguishable: 'app' is the bound application's own
// source; 'framework' is the installed @octane-xplat/* package source (linked
// checkouts stay labeled development content). Secrets, private
// configuration, generated output, and files outside the workspace are
// excluded by default — an excluded path is unreachable by search AND by
// direct read.

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { basename, join, relative, resolve, sep } from 'node:path'
import { resolveInstallations } from './docs-binding.ts'

export const CODE_CORPORA = ['app', 'framework']

// Directory names never indexed or searched in the app corpus.
const SKIP_DIRS = new Set([
	'node_modules',
	'.git',
	'.hg',
	'.svn',
	'dist',
	'build',
	'out',
	'coverage',
	'platforms', // NativeScript-generated native projects
	'.turbo',
	'.next',
	'.output',
	'.nuxt',
	'.svelte-kit',
	'research',
	'generated',
	'.agents', // agent-scoped notes/config, not application code
	'.devin',
	'.claude',
	'.idea',
	'.vscode',
])

// Extensions worth indexing as code. JSON stays out — config and lock data
// swamp code queries without helping them.
const CODE_EXTENSIONS = new Set([
	'ts',
	'tsx',
	'tsrx',
	'js',
	'jsx',
	'mjs',
	'cjs',
	'mts',
	'cts',
	'css',
	'scss',
	'swift',
	'kt',
	'kts',
	'java',
	'm',
	'mm',
	'h',
	'c',
	'cc',
	'cpp',
	'cs',
])

// Secrets and private configuration: never returned, indexed, or read.
const SECRET_FILES = new Set([
	'.npmrc',
	'.netrc',
	'.pypirc',
	'.git-credentials',
	'credentials.json',
	'service-account.json',
	'id_rsa',
	'id_dsa',
	'id_ecdsa',
	'id_ed25519',
])

const SECRET_NAME =
	/^\.env(\.|$)|\.(pem|key|p12|pfx|keystore|jks|mobileprovision|provisionprofile|asc|gpg|secret)$/i

const SECRET_DIRS = new Set(['.ssh', '.gnupg', 'secrets', '.secrets', 'private'])

// Generated output and vendored bundles: not application source.
const GENERATED_NAME =
	/\.(gen|generated|min)\.(js|ts|tsx|css|mjs|cjs)$|\.map$|^[^/]*(pnpm-lock|package-lock|yarn\.lock|bun\.lock)[^/]*$/

export const MAX_FILE_BYTES = 256 * 1024
export const MAX_FILES_PER_CORPUS = 8000

const within = (dir, root) => {
	const r = resolve(root)
	return dir === r || dir.startsWith(r + sep)
}

const posix = (path) => path.split(sep).join('/')

/** The corpus-relative exclusion check. Returns the reason or null. */
export function exclusionReason(relPath) {
	const parts = relPath.split('/')
	for (const part of parts.slice(0, -1)) {
		if (SKIP_DIRS.has(part) || SECRET_DIRS.has(part) || part.startsWith('.')) {
			return 'excluded-directory'
		}
	}

	const name = parts[parts.length - 1]
	if (name.startsWith('.')) {
		return 'dotfile'
	}

	if (SECRET_FILES.has(name) || SECRET_NAME.test(name)) {
		return 'secret-or-private-config'
	}

	if (GENERATED_NAME.test(name)) {
		return 'generated-output'
	}

	const ext = name.includes('.') ? name.split('.').pop() : ''
	if (!CODE_EXTENSIONS.has(ext)) {
		return 'not-code'
	}

	return null
}

/** Approximate binary sniff: a NUL in the first 8k means not source text. */
function isBinary(file) {
	try {
		const fd = readFileSync(file, { encoding: 'utf8', flag: 'r' })
		return fd.includes('\0')
	} catch {
		return true
	}
}

const SUFFIX_PLATFORMS = {
	web: ['web'],
	mobile: ['ios', 'android'],
	native: ['ios', 'android', 'macos', 'windows', 'linux'],
	ios: ['ios'],
	android: ['android'],
	macos: ['macos'],
	windows: ['windows'],
	linux: ['linux'],
}

/**
 * Platforms a file targets, from filename tiers (`.ios.ts`,
 * `Screen.mobile.tsrx`) and platform directory segments (`src/ios/`).
 * An empty result means shared code applicable to every platform.
 */
export function filePlatforms(relPath) {
	const found = new Set()
	const parts = relPath.split('/')
	for (const part of parts.slice(0, -1)) {
		for (const p of SUFFIX_PLATFORMS[part] ?? []) {
			found.add(p)
		}
	}

	const stem = basename(relPath)
	const tier = /\.([a-z]+)\.[^.]+$/.exec(stem)?.[1]
	for (const p of SUFFIX_PLATFORMS[tier] ?? []) {
		found.add(p)
	}

	return [...found]
}

/** Shared files apply everywhere; marked files only apply to their marks. */
export function appliesToPlatform(relPath, platform) {
	if (!platform) {
		return true
	}

	const marks = filePlatforms(relPath)
	return marks.length === 0 || marks.includes(platform)
}

/** Recursively collect searchable files under root, honoring exclusions. */
export function listCorpusFiles(root, { platform, limit = MAX_FILES_PER_CORPUS } = {}) {
	const files = []
	let truncated = false
	const visit = (dir, rel) => {
		if (files.length >= limit) {
			truncated = true
			return
		}

		let entries
		try {
			entries = readdirSync(dir, { withFileTypes: true })
		} catch {
			return
		}

		for (const entry of entries) {
			if (files.length >= limit) {
				truncated = true
				return
			}

			const relPath = rel ? `${rel}/${entry.name}` : entry.name
			const path = join(dir, entry.name)
			if (entry.isDirectory()) {
				if (
					SKIP_DIRS.has(entry.name) ||
					SECRET_DIRS.has(entry.name) ||
					entry.name.startsWith('.')
				) {
					continue
				}

				visit(path, relPath)
				continue
			}

			if (!entry.isFile()) {
				continue
			}

			if (exclusionReason(relPath) || !appliesToPlatform(relPath, platform)) {
				continue
			}

			const stat = statSync(path, { throwIfNoEntry: false })
			if (!stat || stat.size > MAX_FILE_BYTES || stat.size === 0) {
				continue
			}

			if (stat.size > 8192 && isBinary(path)) {
				continue
			}

			files.push({ abs: path, rel: posix(relPath), mtimeMs: stat.mtimeMs, size: stat.size })
		}
	}

	visit(root, '')
	return { files, truncated }
}

/**
 * The framework corpus roots for an app: every release-mapped installed
 * @octane-xplat/* package's own source. Registry installs serve `src/` when
 * the package ships it; linked/workspace deps serve the real checkout and are
 * labeled development. Returns [] when the app has no resolvable installs.
 */
export function frameworkRoots(appRoot) {
	const install = resolveInstallations(appRoot)
	const roots = []
	for (const pkg of install.packages) {
		if (!pkg.installPath) {
			continue
		}

		// pnpm's isolated linker symlinks every install into .pnpm — a symlink
		// alone is not a linked checkout. Linked = resolves outside the
		// package store (a real workspace/dev checkout).
		const real = safeRealpath(pkg.installPath) ?? pkg.installPath
		const linked = pkg.kind === 'linked' && !real.includes(`${sep}.pnpm${sep}`)
		if (!existsSync(real)) {
			continue
		}

		const srcDir = join(real, 'src')
		roots.push({
			corpus: 'framework',
			package: pkg.name,
			version: pkg.version,
			kind: linked ? 'linked' : 'registry',
			provisional: pkg.source === 'lockfile-provisional',
			root: existsSync(srcDir) ? srcDir : real,
			packageRoot: real,
		})
	}

	return roots
}

function safeRealpath(path) {
	try {
		return realpathSync(path)
	} catch {
		return null
	}
}

/**
 * A framework-repo workspace (`kind === 'framework-repo'`) contributes each
 * packages/<dir>/src as framework corpus — separately identified from the
 * bound app, per the design's framework-maintainer mode.
 */
export function frameworkRepoRoots(workspaceRoot) {
	const dir = join(workspaceRoot, 'packages')
	const roots = []
	let entries
	try {
		entries = readdirSync(dir, { withFileTypes: true })
	} catch {
		return roots
	}

	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name.startsWith('.')) {
			continue
		}

		const pkgRoot = join(dir, entry.name)
		const srcDir = join(pkgRoot, 'src')
		if (!existsSync(srcDir)) {
			continue
		}

		let name = entry.name
		try {
			name = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8')).name ?? name
		} catch {
			// unnamed package dir still indexes under its directory name
		}

		roots.push({
			corpus: 'framework',
			package: name,
			version: null,
			kind: 'workspace',
			provisional: false,
			root: srcDir,
			packageRoot: pkgRoot,
		})
	}

	return roots
}

/** All corpora available for a bound app inside a workspace. */
export function collectCorpora({ workspaceRoot, workspaceKind, app }) {
	const corpora = []
	if (app) {
		corpora.push({
			corpus: 'app',
			package: null,
			root: app.root,
			base: workspaceRoot,
			label: app.relativeRoot === '.' ? '.' : app.relativeRoot,
		})

		for (const root of frameworkRoots(app.root)) {
			corpora.push(root)
		}
	}

	if (workspaceKind === 'framework-repo') {
		corpora.push(...frameworkRepoRoots(workspaceRoot))
	}

	// The app corpus can itself live inside a framework repo's packages/* —
	// dedupe identical roots so hits are not doubled.
	const seen = new Set()
	return corpora.filter((c) => {
		const key = `${c.corpus}:${c.package ?? ''}:${c.root}`
		if (seen.has(key)) {
			return false
		}

		seen.add(key)
		return true
	})
}

/**
 * Stable hit reference. App corpus refs carry the workspace-relative path;
 * framework refs carry `<package>/<path inside the package root>`.
 */
export function codeRef(corpus, key) {
	return `xplat-code://${corpus}/${key}`
}

export function parseCodeRef(ref) {
	const m = /^xplat-code:\/\/(app|framework)\/(.+)$/.exec(ref)
	return m ? { corpus: m[1], key: m[2] } : null
}

function resolveCorpusFile(corpus, abs, key) {
	if (!within(abs, corpus.root)) {
		return { error: 'out-of-scope' }
	}

	const exclusionRoot = corpus.packageRoot ?? corpus.root
	const excluded = exclusionReason(posix(relative(exclusionRoot, abs)))
	if (excluded) {
		return { error: 'excluded', detail: `${key} is excluded (${excluded})` }
	}

	// Check both names: an allowed alias must not expose an excluded target,
	// and symlinked corpus roots must still support ordinary in-scope reads.
	const real = safeRealpath(abs)
	const root = safeRealpath(corpus.root)
	const realExclusionRoot = safeRealpath(exclusionRoot)
	if (!real || !root || !realExclusionRoot) {
		return { error: 'unavailable' }
	}
	if (!within(real, root)) {
		return { error: 'out-of-scope' }
	}
	const targetExcluded = exclusionReason(posix(relative(realExclusionRoot, real)))
	if (targetExcluded) {
		return { error: 'excluded', detail: `${key} is excluded (${targetExcluded})` }
	}

	return { abs: real, rel: posix(relative(corpus.root, abs)), corpus }
}

/**
 * Resolve a hit reference or explicit path to an absolute file, enforcing the
 * scope boundary: app paths must stay inside the bound app root; framework
 * paths must stay inside the resolved package root. Anything else returns
 * `out-of-scope` — unrelated workspaces and traversal are never served.
 */
export function resolveCodePath({ corpora, corpus, key }) {
	if (!corpus || !key || key.split('/').includes('..') || key.startsWith('/')) {
		return { error: 'out-of-scope' }
	}

	if (corpus === 'app') {
		const c = corpora.find((entry) => entry.corpus === 'app')
		if (!c) {
			return { error: 'unavailable', detail: 'no app corpus (no bound app)' }
		}

		// Keys are workspace-relative; the app root may be nested inside it.
		const abs = resolve(c.base ?? c.root, key)
		return resolveCorpusFile(c, abs, key)
	}

	// Package names are scoped (`@octane-xplat/ui`): match the longest known
	// package prefix instead of splitting on the first slash.
	const c = corpora
		.filter((entry) => entry.corpus === 'framework' && key.startsWith(`${entry.package}/`))
		.sort((a, b) => b.package.length - a.package.length)[0]

	if (!c) {
		return {
			error: 'unavailable',
			detail: `framework package for "${key}" is not in scope`,
		}
	}

	const inner = key.slice(c.package.length + 1)

	const abs = resolve(c.root, inner)
	return resolveCorpusFile(c, abs, key)
}

/** The corpus key for a file (inverse of resolveCodePath). */
export function codeKeyFor(corpus, file) {
	if (corpus.corpus === 'app') {
		return posix(relative(corpus.base ?? corpus.root, file.abs))
	}

	return `${corpus.package}/${file.rel}`
}
