/**
 * Project identity contract — what the server detects and reports about the
 * developer's workspace during setup, and the shape of the project-status
 * report every later package (docs, code, runtime) plugs into.
 */

export const PLATFORMS: readonly Platform[]

/** The six release-boundary targets. `web` means Chromium acceptance checks. */
export type Platform = 'web' | 'ios' | 'android' | 'macos' | 'linux' | 'windows'

/** A detected application inside the selected workspace. */
export interface AppRef {
	/** Stable identity for selection and binding: workspace-relative root path ('.' for the root app). */
	id: string
	/** package.json name, falling back to the directory basename. */
	name: string
	/** Absolute path. */
	root: string
	/** Path relative to the workspace root. */
	relativeRoot: string
	/**
	 * `consumer-app` — a deployable Octane Xplat application (the primary setup path).
	 * `framework-package` — a package inside the octane-xplat framework repository
	 * (identified separately, never silently treated as the consumer app).
	 */
	kind: 'consumer-app' | 'framework-package'
	/** Platforms this app declares (from its config and dependencies). */
	platforms: Platform[]
}

/** Where a package version came from. `installed` is the only version that binds docs. */
export type VersionSource = 'installed' | 'workspace' | 'lockfile' | 'unresolved'

export interface PackageVersion {
	/** e.g. `@octane-xplat/ui`. */
	name: string
	version: string | null
	source: VersionSource
	/** The declared range in the app's manifest, when it differs from the resolved version. */
	declared?: string
}

export interface FrameworkBinding {
	packages: PackageVersion[]
	/**
	 * `installed` — resolved from the app's actual node_modules (binds documentation).
	 * `provisional` — lockfile/declared only; the real install could not be verified.
	 * `unresolved` — no version information at all.
	 */
	status: 'installed' | 'provisional' | 'unresolved'
	/** Set when the lockfile and the actual installation disagree; installation wins. */
	discrepancy?: string
}

export interface GuidanceSource {
	kind: 'agents-md' | 'claude-md' | 'devin' | 'framework' | 'other'
	/** Workspace-relative path. */
	path: string
}

/** Project-level guidance the agent should read; never mixed into generic docs results. */
export interface GuidanceStatus {
	sources: GuidanceSource[]
}

/** Optional-subsystem readiness. `not_provided` = no provider registered yet. */
export type SubsystemState = 'ready' | 'preparing' | 'stale' | 'unavailable' | 'not_provided'

export interface DocsStatus {
	state: SubsystemState
	/** e.g. which version binding is active, or why docs are unavailable. */
	detail?: string
}

export interface CodeIndexStatus {
	state: SubsystemState
	detail?: string
	/** Human-readable freshness marker (index revision vs working tree). */
	freshness?: string
}

export type PrerequisiteStatus = 'satisfied' | 'missing' | 'unknown'

export interface RuntimePrerequisite {
	/** Stable id: `node`, `git`, `pnpm`, `xcode`, `adb`, `nativescript-cli`, `chromium`, … */
	id: string
	name: string
	status: PrerequisiteStatus
	/** e.g. the found version, or where it was looked for. */
	detail?: string
	/** The smallest corrective action when missing/unknown. */
	remedy?: string
	/** Platforms this prerequisite gates; absent = server-wide. */
	platforms?: Platform[]
}

/** The workspace as a whole. */
export type WorkspaceKind =
	/** A consumer application workspace (single- or multi-app monorepo). */
	| 'consumer'
	/** The octane-xplat framework repository itself — framework sources are a separate corpus. */
	| 'framework-repo'
	/** No Octane Xplat app detected. */
	| 'empty'

export interface WorkspaceInfo {
	root: string
	kind: WorkspaceKind
}

/**
 * App selection state. `ambiguous` is a first-class state: the server never
 * silently picks among multiple apps — the developer (via the agent) must choose.
 */
export type AppSelection =
	| { state: 'bound'; app: AppRef; reason: 'explicit' | 'sole-app' | 'configured' | 'preference' }
	| { state: 'ambiguous'; candidates: AppRef[] }
	| { state: 'none'; reason: 'no-apps' | 'workspace-not-found' }

export interface ProjectIdentity {
	workspace: WorkspaceInfo
	apps: AppRef[]
	selection: AppSelection
	/** Framework versions for the bound app (null while selection is ambiguous/none). */
	framework: FrameworkBinding | null
}
