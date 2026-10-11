/**
 * Code retrieval contract (work item C) — the provider seam the workspace
 * context's `code` slot and the `xplat_code_search` / `xplat_code_read` tools
 * consume.
 *
 * Rules carried by the design:
 * - Exact search reads current source files directly — it stays usable while
 *   the semantic index is absent, preparing, stale, or failed.
 * - Semantic search is optional local acceleration (no remote embedding
 *   without explicit opt-in). Similarity rank is relevance, never evidence of
 *   correctness or platform support.
 * - Results are leads: every hit carries a ref, provenance, and a freshness
 *   marker so the agent can open current source before citing an API.
 * - Secrets, private configuration, generated output, and paths outside the
 *   permitted corpus scope are never served.
 */

import type { AppRef, Platform, SubsystemState, WorkspaceKind } from './identity'

/** `app` = the bound application's own source; `framework` = its installed @octane-xplat package sources. */
export type CodeCorpus = 'app' | 'framework'

export type CodeSearchMode = 'auto' | 'exact' | 'semantic'

/** Per-hit freshness: `current` means revalidated or read live just now. */
export interface CodeFreshness {
	state: 'current' | 'stale'
	/** Content hash at serve time — a later read with a different hash drifted. */
	contentHash?: string
	mtimeMs?: number
}

export interface CodeHitProvenance {
	source: 'app-source' | 'framework-source'
	scope: 'release' | 'project'
	package?: string | null
	requestedVersion?: string | null
	servedVersion?: string | null
	match:
		| 'exact'
		| 'verified-compatible'
		| 'outside-installed-binding'
		| 'unavailable'
		| 'tag-conflict'
	offline?: boolean
}

export interface CodeHit {
	/** `xplat-code://<corpus>/<key>` — open it with xplat_code_read. */
	ref: string
	corpus: CodeCorpus
	package?: string
	/** Corpus-relative path (app: workspace-relative; framework: package source root). */
	path: string
	line: number
	endLine: number
	excerpt: string
	matchType: 'exact' | 'semantic'
	score?: number
	freshness: CodeFreshness
	provenance: CodeHitProvenance
	/** Index revision that produced a semantic hit. */
	indexRevision?: number
	provisional?: boolean
}

export interface SemanticIndexStatus {
	state: SubsystemState
	/** e.g. 'local-tfidf' — remote embedding is never used without opt-in. */
	backend?: string
	detail?: string
	files?: number
	chunks?: number
	truncated?: boolean
	revision?: number
	/** Hits dropped because they failed revalidation against current source. */
	droppedStale?: number
}

export interface CodeSearchArgs {
	app: AppRef | null
	workspaceKind?: WorkspaceKind
	query: string
	mode?: CodeSearchMode
	corpus?: CodeCorpus | 'all'
	platform?: Platform
	package?: string
	limit?: number
}

export interface CodeSearchResult {
	status?: CodeResultStatus
	mode: CodeSearchMode
	results: CodeHit[]
	semantic: SemanticIndexStatus
	coverage: unknown
	/** Working-tree freshness marker (HEAD + uncommitted count) when git is available. */
	tree?: string
}

export interface CodeReadArgs {
	app: AppRef | null
	workspaceKind?: WorkspaceKind
	ref?: string
	corpus?: CodeCorpus
	package?: string
	path?: string
	offset?: number
	limit?: number
}

export type CodeResultStatus =
	| 'selection-required'
	| 'invalid-selection'
	| 'invalid-ref'
	| 'out-of-scope'
	| 'excluded'
	| 'unavailable'

export interface CodeErrorResult {
	status: CodeResultStatus
	reason?: string
	detail?: string
	corpus?: string
	path?: string
}

/** The provider contract injected as `options.code` on the workspace context. */
export interface CodeProvider {
	/** Fills the project-status `codeIndex` slot. */
	status(app: AppRef | null): unknown
	search(args: CodeSearchArgs): CodeSearchResult | CodeErrorResult | Promise<unknown>
	read(args: CodeReadArgs): unknown | Promise<unknown>
}
