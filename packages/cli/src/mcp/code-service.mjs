// Code retrieval service — exact/current-source search and reads plus the
// optional local semantic index (plans/octane-xplat-mcp.md work item C).
// Every result carries contract.mjs provenance and a freshness marker; app
// and framework corpora stay labeled and distinguishable. The semantic index
// is local TF-IDF acceleration only — it builds in the background and never
// blocks exact retrieval.

import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { MATCH, SOURCES, provenance } from './contract.mjs'
import { createCodeIndex } from './code-index.mjs'
import { readCodeFile, searchCodeFiles } from './code-retrieval.mjs'
import {
	appliesToPlatform,
	codeKeyFor,
	codeRef,
	collectCorpora,
	listCorpusFiles,
	parseCodeRef,
	resolveCodePath,
} from './code-scope.mjs'

const SEARCH_MODES = ['auto', 'exact', 'semantic']

/**
 * @param {{
 *   workspaceRoot: string,
 *   workspaceKind?: string | (() => string), // 'consumer' | 'framework-repo' | 'empty'
 *   execFile?: Function,                    // test seam for git probes
 * }} options
 */
export function createCodeService({ workspaceRoot, workspaceKind, execFile }) {
	const index = createCodeIndex()
	const kind = (explicit) =>
		explicit ?? (typeof workspaceKind === 'function' ? workspaceKind() : workspaceKind)

	function corporaFor(app, wk) {
		return collectCorpora({ workspaceRoot, workspaceKind: kind(wk), app: app ?? null })
	}

	/** Enumerate corpus files; each entry carries its corpus descriptor. */
	function corpusFiles(corpora, { platform } = {}) {
		const files = []
		const coverage = []
		for (const corpus of corpora) {
			const { files: found, truncated } = listCorpusFiles(corpus.root, { platform })
			for (const file of found) {
				files.push({ ...file, corpus })
			}

			coverage.push({
				corpus: corpus.corpus,
				package: corpus.package ?? undefined,
				root: corpus.label ?? corpus.root,
				files: found.length,
				truncated: truncated || undefined,
			})
		}

		return { files, coverage }
	}

	const collectIndexFiles = (app, wk) => corpusFiles(corporaFor(app, wk)).files

	/** Working-tree freshness marker: HEAD + uncommitted-edit count. */
	function treeMarker() {
		const run = execFile ?? execFileSync
		try {
			const head = String(
				run('git', ['-C', workspaceRoot, 'rev-parse', 'HEAD'], {
					encoding: 'utf8',
					timeout: 5000,
					stdio: ['ignore', 'pipe', 'ignore'],
				}),
			).trim()

			const dirty = String(
				run('git', ['-C', workspaceRoot, 'status', '--porcelain', '-uno'], {
					encoding: 'utf8',
					timeout: 5000,
					stdio: ['ignore', 'pipe', 'ignore'],
				}),
			)
				.split('\n')
				.filter(Boolean).length

			return `HEAD ${head.slice(0, 12)}${dirty ? `, ${dirty} uncommitted` : ', clean'}`
		} catch {
			return 'not a git checkout — freshness is per-read mtimes'
		}
	}

	const appProvenance = () =>
		provenance({ source: SOURCES.APP_SOURCE, scope: 'project', match: MATCH.EXACT })

	const frameworkProvenance = (corpus) =>
		provenance({
			source: SOURCES.FRAMEWORK_SOURCE,
			scope: corpus.kind === 'registry' ? 'release' : 'project',
			package: corpus.package,
			requestedVersion: corpus.version,
			servedVersion: corpus.kind === 'registry' ? corpus.version : 'development',
			match: MATCH.EXACT,
		})

	function hit(corpus, file, fields) {
		return {
			ref: codeRef(corpus.corpus, codeKeyFor(corpus, file)),
			corpus: corpus.corpus,
			package: corpus.package ?? undefined,
			path: file.rel,
			line: fields.line,
			endLine: fields.endLine,
			excerpt: fields.excerpt,
			matchType: fields.matchType,
			score: fields.score,
			freshness: {
				state: 'current',
				contentHash: fields.contentHash,
				mtimeMs: fields.mtimeMs ?? file.mtimeMs,
			},
			provenance: corpus.corpus === 'app' ? appProvenance() : frameworkProvenance(corpus),
			indexRevision: fields.matchType === 'semantic' ? index.status().revision : undefined,
			...(corpus.provisional ? { provisional: true } : {}),
		}
	}

	const selectionRequired = () => ({
		status: 'selection-required',
		detail:
			'Code retrieval needs a bound app: the app corpus is the bound app, the framework corpus is its installed packages. Select the app first — xplat_select_app (MCP) or `xplat app select` (CLI).',
	})

	return {
		/**
		 * The workspace-context `codeIndexStatus` provider slot. Exact
		 * retrieval is always current; the nested `semantic` block reports
		 * index readiness separately.
		 */
		status(app, wk) {
			const corpora = corporaFor(app, wk)
			const { files, coverage } = corpusFiles(corpora)
			return {
				state: 'ready',
				detail:
					'exact search reads current source; semantic index is local-only and builds on demand',
				freshness: treeMarker(),
				files: files.length,
				corpora: coverage,
				semantic: index.status(),
			}
		},

		/**
		 * Query current source. `mode: 'exact'` is token/identifier search;
		 * `'semantic'` is intent-style matching from the local index;
		 * `'auto'` returns exact hits plus semantic hits when the index is
		 * ready. The index state is always reported; while it is preparing
		 * or stale the exact results remain fully usable.
		 */
		search({
			app,
			query,
			mode = 'auto',
			corpus = 'all',
			platform,
			package: pkg,
			limit = 10,
			workspaceKind: wk,
		}) {
			if (!app && kind(wk) !== 'framework-repo') {
				return selectionRequired()
			}

			if (!SEARCH_MODES.includes(mode)) {
				return {
					status: 'invalid-selection',
					detail: `mode must be one of ${SEARCH_MODES.join(', ')}`,
				}
			}

			if (!query?.trim()) {
				return { status: 'invalid-selection', detail: 'query is required' }
			}

			let corpora = corporaFor(app, wk)
			if (corpus !== 'all') {
				corpora = corpora.filter((c) => c.corpus === corpus)
			}

			if (pkg) {
				corpora = corpora.filter((c) => c.package === pkg)
			}

			const { files, coverage } = corpusFiles(corpora, { platform })
			const results = []
			const seen = new Set()

			if (mode !== 'semantic') {
				for (const h of searchCodeFiles(files, { query, limit })) {
					results.push(
						hit(h.corpus, h.file, {
							matchType: 'exact',
							score: h.score,
							line: h.line,
							endLine: h.endLine,
							excerpt: h.excerpt,
							contentHash: h.contentHash,
						}),
					)

					seen.add(`${h.corpus.corpus}:${h.file.rel}:${h.line}`)
				}
			}

			const semantic = { state: 'not-requested' }
			if (mode !== 'exact' && query) {
				// Kick (or reuse) the background build over ALL corpora — scoped
				// filters apply at query time, not index time.
				const status = index.ensure(() => collectIndexFiles(app, wk))
				Object.assign(semantic, status)

				if (status.state === 'ready' || status.state === 'stale') {
					const accepted = new Set(files.map((f) => f.abs))
					const { hits, droppedStale } = index.search(query, {
						limit,
						accept: (file) => accepted.has(file.abs) && appliesToPlatform(file.rel, platform),
					})

					if (droppedStale) {
						semantic.droppedStale = droppedStale
						semantic.detail = `${droppedStale} stale result(s) failed revalidation against current source and were dropped`
					}

					for (const { chunk, score } of hits) {
						const key = `${chunk.file.corpus.corpus}:${chunk.file.rel}:${chunk.startLine}`
						if (mode !== 'semantic' && seen.has(key)) {
							continue
						}

						const current = files.find((f) => f.abs === chunk.file.abs)
						results.push(
							hit(chunk.file.corpus, current ?? chunk.file, {
								matchType: 'semantic',
								score: Math.round(score * 1000) / 1000,
								line: chunk.startLine,
								endLine: chunk.endLine,
								excerpt: chunk.text.split('\n').slice(0, 12).join('\n').slice(0, 900).trim(),
								contentHash: chunk.hash.slice(0, 12),
								mtimeMs: current?.mtimeMs,
							}),
						)
					}
				}
			}

			return {
				mode,
				results: results.slice(0, limit),
				semantic,
				coverage,
				tree: treeMarker(),
			}
		},

		/**
		 * Bounded read of current source. Accepts a search `ref`
		 * (xplat-code://…) or explicit corpus+path(+package). A file that
		 * vanished or drifted is reported, never served stale.
		 */
		read({ app, ref, corpus, package: pkg, path, offset, limit, workspaceKind: wk }) {
			if (!app && kind(wk) !== 'framework-repo') {
				return selectionRequired()
			}

			if (!ref && !path) {
				return {
					status: 'invalid-selection',
					detail: 'a search ref or an explicit corpus + path is required',
				}
			}

			let key = path
			let corpusName = corpus ?? 'app'
			if (ref) {
				const parsed = parseCodeRef(ref)
				if (!parsed) {
					return { status: 'invalid-ref', ref }
				}

				corpusName = parsed.corpus
				key = parsed.key
			}

			if (pkg && corpusName === 'framework' && key && !key.startsWith(`${pkg}/`)) {
				key = `${pkg}/${key}`
			}

			const resolved = resolveCodePath({
				corpora: corporaFor(app, wk),
				corpus: corpusName,
				key,
			})

			if (resolved.error) {
				return {
					status: resolved.error,
					detail: resolved.detail,
					corpus: corpusName,
					path: key,
				}
			}

			const page = readCodeFile(resolved.abs, { offset, limit })
			if (!page) {
				return {
					status: 'unavailable',
					reason: 'file-vanished-or-binary',
					detail: `${key} no longer reads as current source`,
					corpus: corpusName,
				}
			}

			return {
				...page,
				ref: codeRef(
					resolved.corpus.corpus,
					resolved.corpus.corpus === 'app' ? key : `${resolved.corpus.package}/${resolved.rel}`,
				),
				corpus: resolved.corpus.corpus,
				package: resolved.corpus.package ?? undefined,
				path: resolved.rel,
				freshness: {
					state: 'current',
					contentHash: page.contentHash,
					mtimeMs: statSync(resolved.abs, { throwIfNoEntry: false })?.mtimeMs,
				},
				provenance:
					resolved.corpus.corpus === 'app' ? appProvenance() : frameworkProvenance(resolved.corpus),
				tree: treeMarker(),
			}
		},

		/** Build the semantic index now (explicit warmup; tests await this). */
		async prepareIndex(app, wk) {
			return index.whenReady(() => collectIndexFiles(app, wk))
		},
	}
}
