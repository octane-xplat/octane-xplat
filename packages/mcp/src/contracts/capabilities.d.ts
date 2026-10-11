/**
 * Explicit capability matrix — per platform and target, each capability is
 * reported separately. Unsupported or unqualified capabilities stay visible
 * with an explanation and a usable alternative, never hidden or faked.
 */

import type { AppRef, Platform, RuntimePrerequisite } from './identity'
import type { PermissionScope } from './policy'

/** The externally observable capability surface. */
export const CAPABILITY_IDS: readonly CapabilityId[]

export type CapabilityId =
	/** Detected project identity, versions, guidance, prerequisites (package A). */
	| 'project_status'
	/** Project-scoped guidance retrieval. */
	| 'guidance'
	/** Version-bound documentation search/read (package B). */
	| 'docs'
	/** Exact/semantic code discovery (package C). */
	| 'code_search'
	/** Device/target enumeration with availability and ownership (package D). */
	| 'target_discovery'
	/** Authorized build for a development session (package D). */
	| 'build'
	/** Launch a built app on a target (package D). */
	| 'launch'
	/** Attach to an existing compatible development session (package D). */
	| 'attach'
	/** Bounded, cursor-paginated logs with gap indicators (package D). */
	| 'logs'
	/** Job status/cancellation without holding a tool call open (package A+D). */
	| 'job_control'
	/** Qualified host-state inspection (package E). */
	| 'ui_inspection'
	/** Screenshot capture — always permission-gated at action time (package E). */
	| 'screenshot'
	/** Scoped interactions with an explicit mechanism (package E). */
	| 'interaction'
	/** App-declared development actions: discovery + invocation (package G). */
	| 'dev_actions'
	/** Ownership-safe session end (package A+D). */
	| 'session_end'
	/** Session-scoped evidence with retain/delete (package A). */
	| 'evidence'

export type CapabilityStatus =
	/** Usable now on this platform/target. */
	| 'supported'
	/** Works within stated coverage limits; `detail` names them. */
	| 'partial'
	/** Exists, but every use is checked against a permission grant at action time. */
	| 'permission_gated'
	/** Achievable on this platform but a provider or prerequisite is absent. */
	| 'unavailable'
	/** Not possible on this platform; `detail` says why. */
	| 'unsupported'
	/** Not yet qualified; never presented as ready. */
	| 'unknown'

/** A usable path when a capability is not supported here. */
export interface CapabilityAlternative {
	description: string
	/** A concrete command the developer can run, when one exists. */
	command?: string
}

export interface CapabilityEntry {
	capability: CapabilityId
	status: CapabilityStatus
	/** Why the capability is limited, missing, or gated — or its coverage bounds. */
	detail?: string
	/** The grant checked at action time (screenshots: 'visual-capture'). */
	requiresPermission?: PermissionScope
	prerequisites?: RuntimePrerequisite[]
	alternative?: CapabilityAlternative
}

export interface PlatformCapabilityMatrix {
	platform: Platform
	/** Whether the bound app declares this platform. */
	declared: boolean
	capabilities: CapabilityEntry[]
}

/**
 * A platform adapter supplied by a runtime package (D/E/G). Providers return
 * entries only for capabilities they implement; everything else keeps the
 * honest default from `defaultCapabilityEntry`.
 */
export interface CapabilityProvider {
	platform: Platform
	describe(app: AppRef): CapabilityEntry[] | Promise<CapabilityEntry[]>
}

export declare function defaultCapabilityEntry(
	capability: CapabilityId,
	platform: Platform,
): CapabilityEntry

export interface CapabilityRegistry {
	register(provider: CapabilityProvider): void
	matrixFor(app: AppRef | null, platforms: Platform[]): Promise<PlatformCapabilityMatrix[]>
}

export declare function createCapabilityRegistry(): CapabilityRegistry
