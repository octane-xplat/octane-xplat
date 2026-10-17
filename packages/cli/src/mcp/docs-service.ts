// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Documentation service — orchestrates installed-version binding, snapshot
// acquisition, and retrieval for the MCP docs capability
// (plans/octane-xplat-mcp.md work item B). Every response carries the
// contract.mjs provenance shape so package A's identity layer can wrap it
// without re-interpretation.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { developmentDocsDir, resolveInstallations } from './docs-binding.ts'
import { tailoredGuidance } from './docs-guidance.ts'
import { docRef, parseDocRef, readPage, searchDocs } from './docs-retrieval.ts'
import { boundProvenance, defaultCacheDir, ensureSnapshot, gitAvailable } from './docs-snapshots.ts'

import { MATCH, provenance, SOURCES, unavailable } from './contract.ts'
import { releaseMapping } from './release-map.ts'

/**
 * @param {{
 *   workspaceRoot: string,
 *   cacheDir?: string,
 *   repo?: string,            // release-repo override (tests point at a fixture)
 *   gitPath?: string, execFile?: Function, env?: object, timeoutMs?: number,
 * }} options
 */
export function createDocsService({
	workspaceRoot,
	cacheDir,
	repo,
	gitPath,
	execFile,
	env,
	timeoutMs,
}) {
	const ctx = { cacheDir: cacheDir ?? defaultCacheDir(), gitPath, execFile, env, timeoutMs }
	const state = { install: null, fingerprint: null, revision: 0 }

	async function refresh() {
		const install = resolveInstallations(workspaceRoot)
		if (install.fingerprint !== state.fingerprint) {
			state.install = install
			state.fingerprint = install.fingerprint
			state.revision += 1
		}

		return state.install
	}

	/** Acquire the pinned docs root for one package@version. */
	async function bind(pkg, { version = pkg.version, acceptMovedTag = false } = {}) {
		// 'development' is the servedVersion label for a linked checkout — it is
		// the installed binding, not a version outside it.
		const outside = version !== pkg.version && !(pkg.kind === 'linked' && version === 'development')
		if (!outside && pkg.kind === 'linked') {
			// Development binding: current checkout, never an invented version.
			const docs = pkg.installPath ? developmentDocsDir(pkg.installPath) : null
			if (!docs) {
				return unavailable('docs-absent', {
					source: SOURCES.DEVELOPMENT_DOCS,
					package: pkg.name,
					fallback: { kind: 'installed-source', path: pkg.installPath },
				})
			}

			return {
				status: 'bound',
				dir: dirname(docs),
				dev: true,
				prov: provenance({
					source: SOURCES.DEVELOPMENT_DOCS,
					package: pkg.name,
					requestedVersion: version,
					servedVersion: 'development',
					match: MATCH.EXACT,
				}),
			}
		}

		const mapping = releaseMapping(pkg.name, version, repo ?? undefined)
		if (!mapping) {
			return unavailable('no-release-mapping', { package: pkg.name, requestedVersion: version })
		}

		const result = await ensureSnapshot(ctx, {
			packageName: pkg.name,
			version,
			repo: mapping.repo,
			tag: mapping.tag,
			packageDir: mapping.dir,
			acceptMovedTag,
		})

		if (result.status !== 'bound') {
			return attachFallback(result, pkg)
		}

		return {
			...result,
			prov: provenance({
				...boundProvenance(result, { packageName: pkg.name, version }),
				repo: mapping.repo,
				match: outside ? MATCH.OUTSIDE_BINDING : MATCH.EXACT,
			}),
		}
	}

	function attachFallback(result, pkg) {
		if (result.status !== 'unavailable' || result.fallback) {
			return result
		}

		return {
			...result,
			fallback: pkg.installPath
				? { kind: 'installed-source', path: pkg.installPath }
				: { kind: 'none', detail: 'package is not installed; lockfile entry is provisional' },
		}
	}

	function docHit(pkg, bound, hit, { provisional }) {
		return {
			title: hit.title,
			path: hit.path,
			corpus: hit.corpus,
			platforms: hit.platforms,
			excerpt: hit.excerpt,
			line: hit.line,
			ref: docRef(pkg.name, bound.prov.servedVersion, hit.path),
			provenance: bound.prov,
			...(provisional ? { provisional: true } : {}),
		}
	}

	/** Scoped project guidance — separate from release docs, never blended. */
	function projectGuidance({ query, limit = 5 } = {}) {
		const needle = (query ?? '').trim().toLowerCase()
		const tokens = needle.split(/\s+/).filter(Boolean)
		const files = []
		const collect = (dir, deep) => {
			let entries
			try {
				entries = readdirSync(dir)
			} catch {
				return
			}

			for (const name of entries) {
				if (name.startsWith('.') || name === 'node_modules') {
					continue
				}

				const path = join(dir, name)
				const stat = statSync(path, { throwIfNoEntry: false })
				if (!stat) {
					continue
				}

				if (stat.isDirectory()) {
					if (deep) {
						collect(path, deep)
					}
				} else if (/^(AGENTS|README|CLAUDE).*\.md$/.test(name) || (deep && name.endsWith('.md'))) {
					files.push(path)
				}
			}
		}

		collect(workspaceRoot, false)
		for (const sub of ['docs', join('.agents', 'docs')]) {
			const dir = join(workspaceRoot, sub)
			if (existsSync(dir)) {
				collect(dir, true)
			}
		}

		const scored = []
		for (const file of files) {
			const content = readFileSync(file, 'utf8')
			const rel = relative(workspaceRoot, file).split(sep).join('/')
			const hay = `${rel}\n${content}`.toLowerCase()
			const hits = tokens.filter((t) => hay.includes(t)).length
			if (needle && hits === 0) {
				continue
			}

			scored.push({ rel, content, score: hits + (hay.includes(needle) ? 100 : 0) })
		}

		scored.sort((a, b) => b.score - a.score)
		return scored.slice(0, limit).map(({ rel, content }) => {
			const heading = content.match(/^#\s+(.+)$/m)
			const at = needle ? hay_indexOf(content, needle) : 0
			return {
				title: heading ? heading[1].trim() : rel,
				path: rel,
				excerpt: content.slice(Math.max(0, at), at + 480).trim(),
				provenance: provenance({
					source: SOURCES.PROJECT_GUIDANCE,
					scope: 'project',
					match: MATCH.EXACT,
				}),
			}
		})
	}

	function hay_indexOf(content, needle) {
		const i = content.toLowerCase().indexOf(needle.toLowerCase())
		return i < 0 ? 0 : i
	}

	return {
		/** Project identity + binding/doc status — A's status surface reads this. */
		async status() {
			const install = state.install ?? (await refresh())
			return {
				identity: {
					workspaceRoot,
					packages: install.packages,
					fingerprint: install.fingerprint,
					discrepancies: install.discrepancies,
				},
				bindingRevision: state.revision,
				git: (await gitAvailable(ctx)) ? 'available' : 'unavailable',
				cacheDir: ctx.cacheDir,
			}
		},

		/** Dependency changes invalidate the binding before the next lookup. */
		async refresh() {
			const before = state.revision
			const install = await refresh()
			return {
				bindingRevision: state.revision,
				changed: state.revision !== before,
				packages: install.packages,
				discrepancies: install.discrepancies,
			}
		},

		/**
		 * Exact/token documentation search against the installed-version
		 * bindings. `version` is an explicit comparison/migration request and
		 * its results stay labeled outside the installed binding.
		 */
		async search({ query, package: packageName, version, platform, corpus, limit = 10 }) {
			const install = await refresh()
			const started = state.revision
			const targets = install.packages.filter((p) => !packageName || p.name === packageName)
			// Explicit version request for a package that is not installed still
			// binds its release tag — labeled outside the installed binding.
			if (packageName && version && targets.length === 0) {
				targets.push({
					name: packageName,
					version,
					kind: 'registry',
					installPath: null,
					source: 'explicit-request',
				})
			}

			const results = []
			const failures = []
			const boundCommits = {}
			const boundByName = {}
			for (const pkg of targets) {
				const bound = await bind(pkg, { version: version ?? pkg.version })
				boundByName[pkg.name] = bound
				if (bound.status !== 'bound') {
					failures.push(bound)
					continue
				}

				boundCommits[pkg.name] = bound.commit ?? bound.dir
				const hits = searchDocs(bound.dir, { query, corpus, platform, limit })
				if (hits.length === 0 && !existsSync(join(bound.dir, 'docs'))) {
					failures.push(
						attachFallback(
							unavailable('docs-absent', {
								package: pkg.name,
								requestedVersion: version ?? pkg.version,
								repo: bound.prov.repo,
								tag: bound.prov.tag,
							}),
							pkg,
						),
					)

					continue
				}

				for (const hit of hits) {
					results.push(
						docHit(pkg, bound, hit, { provisional: pkg.source === 'lockfile-provisional' }),
					)
				}
			}

			// Shared guide: one snapshot serving several bound packages states
			// its verified compatible set.
			for (const r of results) {
				const me = boundByName[r.provenance.package]
				const key = me?.commit ?? me?.dir
				const set = Object.entries(boundCommits)
					.filter(([, c]) => c === key)
					.map(([name]) => name)

				if (set.length > 1) {
					r.provenance.verifiedCompatibleSet = set
				}
			}

			return {
				bindingRevision: state.revision,
				bindingChangedDuring: state.revision !== started,
				results,
				unavailable: failures.filter((f) => f.status === 'unavailable'),
				conflicts: failures.filter((f) => f.status === 'tag-conflict'),
				projectGuidance: projectGuidance({ query, limit: 5 }),
			}
		},

		/**
		 * Bounded page read. Accepts a search `ref` (xplat-doc://…) or an
		 * explicit package+path. Same binding rules as search — a page read
		 * can never drift to a different version than the binding.
		 */
		async read({ ref, package: packageName, path, version, offset, limit }) {
			await refresh()
			let target = packageName
			let relPath = path
			let requested = version
			if (ref) {
				const parsed = parseDocRef(ref)
				if (!parsed) {
					return { status: 'invalid-ref', ref }
				}

				target = parsed.package
				relPath = parsed.path
				requested ??= parsed.version
			}

			const pkg = state.install.packages.find((p) => p.name === target)
			// Explicit comparison request for a non-installed package binds the
			// requested release tag, still labeled outside the installed set.
			const effective =
				pkg ??
				(requested
					? { name: target, version: requested, kind: 'registry', installPath: null }
					: null)

			if (!effective) {
				return { status: 'unavailable', reason: 'package-not-installed', package: target }
			}

			const bound = await bind(effective, { version: requested ?? effective.version })
			if (bound.status !== 'bound') {
				return attachFallback(bound, effective)
			}

			const page = readPage(bound.dir, relPath, { offset, limit })
			if (!page) {
				return attachFallback(
					unavailable('docs-absent', {
						package: effective.name,
						requestedVersion: requested ?? effective.version,
						tag: bound.prov.tag,
						detail: relPath,
					}),
					effective,
				)
			}

			return {
				...page,
				ref: docRef(effective.name, bound.prov.servedVersion, relPath),
				provenance: bound.prov,
				bindingRevision: state.revision,
			}
		},

		/** Explicit tag-move resolution: 'remote' rebinds, 'cached' keeps. */
		async resolveTagConflict(packageName, version, resolution) {
			const install = state.install ?? (await refresh())
			const pkg = install.packages.find((p) => p.name === packageName) ?? {
				name: packageName,
				version,
				kind: 'registry',
				installPath: null,
			}

			if (resolution === 'cached') {
				return { status: 'kept-cached', package: packageName, version }
			}

			if (resolution === 'remote') {
				const bound = await bind(pkg, { version, acceptMovedTag: true })
				return bound.status === 'bound'
					? { status: 'rebound', commit: bound.commit, package: packageName, version }
					: bound
			}

			return { status: 'invalid-resolution', resolution }
		},

		/** Tailored guidance — scoped, provenance-labeled entries. */
		async guidance() {
			const install = state.install ?? (await refresh())
			return { bindingRevision: state.revision, entries: tailoredGuidance(install) }
		},

		projectGuidance,
	}
}
