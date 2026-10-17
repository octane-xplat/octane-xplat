/**
 * Permission/policy contract. Workspace scope and ordinary runtime actions
 * reuse the existing task authorization — policy is established once, not
 * re-requested per tool call. Grants are scoped, revocable, optionally
 * expiring, and checked at action time. `visual-capture` is never part of
 * any baseline: the screenshot capability can exist while every actual
 * capture still requires explicit per-task developer approval.
 */

import type { ContractError } from './errors'

export const PERMISSION_SCOPES: readonly PermissionScope[]

export type PermissionScope =
	/** Read the selected workspace: manifests, config, source inventory. */
	| 'workspace'
	/** Build, launch, attach, and interact with development sessions. */
	| 'runtime-actions'
	/** Screenshot capture and any visual inspection of captured pixels. Never granted by task authorization alone. */
	| 'visual-capture'
	/** Persist evidence artifacts beyond the MCP session. */
	| 'evidence-retain'
	/** Effects outside the app itself (external services, destructive resets). Never implied by runtime-actions. */
	| 'external-effects'

export type GrantSource =
	/** The developer authorized this task; covers workspace + runtime-actions only. */
	| 'task-authorization'
	/** An explicit developer approval for this task (e.g. via client elicitation). */
	| 'developer'
	/** A server startup flag/environment setting the developer configured. */
	| 'server-config'

export type GrantState = 'granted' | 'denied' | 'required'

export interface PermissionGrant {
	scope: PermissionScope
	state: GrantState
	source?: GrantSource
	grantedAt?: string
	/** ISO timestamp after which the grant no longer applies; absent = session-bound. */
	expiresAt?: string
	/** False only for server-internal baseline entries; everything the developer grants is revocable. */
	revocable: boolean
	note?: string
}

export type RequireResult =
	| { granted: true; grant: PermissionGrant }
	| { granted: false; error: ContractError }

/**
 * The channel that asks the developer for a grant — wired to the client's
 * elicitation support when available. Returns the resulting state.
 */
export type GrantElicitor = (
	scope: PermissionScope,
	reason: string,
) => Promise<'granted' | 'denied'> | 'granted' | 'denied'

export interface PolicyStoreOptions {
	/** The developer authorized this task — grants workspace + runtime-actions for the session. */
	taskAuthorization?: boolean
	/** Extra grants from server configuration (env/flags), e.g. a pre-approved visual-capture. */
	grants?: PermissionGrant[]
	/** Optional elicitation channel used by `requestGrant`. */
	elicit?: GrantElicitor
}

export interface PolicyStore {
	/** Synchronous check used at action time. Expired grants are denied. */
	require(scope: PermissionScope): RequireResult
	/**
	 * Resolve a grant, asking the developer through the elicitation channel when
	 * one exists. Without a channel, returns `required` state plus the recovery
	 * text telling the developer how to grant it.
	 */
	requestGrant(scope: PermissionScope, reason: string): Promise<RequireResult>
	grant(scope: PermissionScope, grant?: Partial<PermissionGrant>): PermissionGrant
	revoke(scope: PermissionScope): boolean
	list(): PermissionGrant[]
	/** Late-bind the elicitation channel (it needs a connected client). */
	setElicitor(elicit: GrantElicitor): void
}

export declare function createPolicyStore(options?: PolicyStoreOptions): PolicyStore
