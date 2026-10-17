/**
 * App-declared development-action contract (design: plans/octane-xplat-mcp.md,
 * "App-declared development actions").
 *
 * The app owns action semantics; the framework owns discovery and invocation.
 * A dev-mode app announces a registry snapshot (identity + revision + typed
 * declarations) over a platform bridge; this server lists the live registry
 * and invokes actions through that same bridge. The declaration is the single
 * source of truth: handler, runtime-validatable input/result contracts, and
 * metadata all travel in one announcement — there are no MCP-side per-action
 * definitions.
 *
 * Wire invariants:
 * - Every registry carries `appInstanceId` — each running app realm (tab,
 *   window, device process) is a distinct invocation destination. Calls are
 *   never silently shared or redirected.
 * - `revision` increments on every registry change (add/change/remove, owner
 *   disposal, hot reload). Invocation presents the revision it read; a stale
 *   revision is rejected with `stale_identity` before anything runs.
 * - Announcements are heartbeats: a stopped heartbeat marks the instance
 *   `disconnected` — a live app with zero actions still announces, so an
 *   empty registry is always distinguishable from a disconnected runtime.
 */

import type { ContractError } from './errors'
import type { Platform } from './identity'

export const DEV_ACTIONS_PROTOCOL = 'xplat-dev-actions'
export const DEV_ACTIONS_PROTOCOL_VERSION = 1
/** Heartbeat interval the app-side bridge uses; instances quieter than this ×3 are stale. */
export const DEV_ACTIONS_ANNOUNCE_INTERVAL_MS: number
export const DEV_ACTIONS_STALE_AFTER_MS: number
/** Bounded pending-invocation queue per instance; saturation returns `target_busy`. */
export const DEV_ACTIONS_QUEUE_LIMIT: number
/** Cap on overlapping invocations per instance (declared `overlap` actions). */
export const DEV_ACTIONS_OVERLAP_LIMIT: number
/** Default and maximum execution timeouts. */
export const DEV_ACTIONS_DEFAULT_TIMEOUT_MS: number
export const DEV_ACTIONS_MAX_TIMEOUT_MS: number

// ---------- declaration contract ----------

/** Runtime-validatable field subset. `fields`/`items` allow one level of structure. */
export interface DevActionField {
	type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'
	description?: string
	/** Applied when the caller omits the field. */
	default?: unknown
	/** Closed value set. */
	enum?: readonly unknown[]
	minLength?: number
	maxLength?: number
	/** Regular expression source (must compile). */
	pattern?: string
	minimum?: number
	maximum?: number
	minItems?: number
	maxItems?: number
	/** For `object`: named nested fields. Defaults apply to top-level fields only. */
	fields?: Record<string, DevActionField>
	/** For `array`: element contract. */
	items?: DevActionField
}

/** Named typed fields. `{}` (or omitted) means the action takes no arguments. */
export interface DevActionFields {
	fields?: Record<string, DevActionField>
}

/**
 * Disclosed effect categories — the agent reads these to decide whether an
 * action fits the existing authorization. `externalEffects` maps to the
 * `external-effects` permission scope and is checked at invocation time.
 */
export interface DevActionEffects {
	/** Plain-language summary of what the action changes. */
	summary: string
	auth?: boolean
	navigation?: boolean
	appState?: boolean
	testData?: boolean
	/** Effects outside the app itself — external test services, destructive resets. */
	externalEffects?: boolean
}

export type DevActionConcurrency =
	/** Default: actions for one app instance run one at a time through a bounded queue. */
	| 'serialized'
	/** The app declares this action safe to overlap with other executions. */
	| 'overlap'

export interface DevActionExecution {
	concurrency?: DevActionConcurrency
	/** Cooperative cancellation supported by the handler. */
	cancellable?: boolean
	/** Safe to retry (idempotent). Non-retryable actions never auto-rerun. */
	retryable?: boolean
	/** Per-action execution deadline; bounded by DEV_ACTIONS_MAX_TIMEOUT_MS. */
	timeoutMs?: number
}

export interface DevActionDeclaration {
	/** Stable machine identity, e.g. `auth.login-as-test-admin`. */
	id: string
	title: string
	/** When to use it and what successful completion means. */
	description: string
	input?: DevActionFields
	result?: DevActionFields
	effects: DevActionEffects
	availability?: {
		/** Platforms this action applies to; absent = all. */
		platforms?: Platform[]
		/** Readiness conditions outside platform selection (free text). */
		readyWhen?: string
	}
	execution?: DevActionExecution
}

/** Declared action plus its live availability, as announced by the app. */
export interface DevActionListing extends DevActionDeclaration {
	availability?: {
		platforms?: Platform[]
		readyWhen?: string
		/** Live readiness verdict from the app. */
		ready: boolean
		/** Why it is unavailable right now. */
		reason?: string
	}
}

// ---------- registry announcement ----------

export interface DevActionRegistryAnnouncement {
	protocol: typeof DEV_ACTIONS_PROTOCOL
	version: number
	/** Unique per app realm — survives hot reload, never crosses processes. */
	appInstanceId: string
	/** App-supplied label for the developer, e.g. package name or window title. */
	appLabel?: string
	platform: Platform
	revision: number
	announcedAt: string
	actions: DevActionListing[]
}

// ---------- invocation ----------

export interface DevActionInvocationRequest {
	/** Stable request identity — retries with the same requestId must not re-run the effect. */
	requestId: string
	appInstanceId: string
	actionId: string
	/** The registry revision the caller discovered; rejected when stale. */
	registryRevision: number
	input: Record<string, unknown>
}

export type DevActionInvocationStatus =
	| 'succeeded'
	| 'failed'
	| 'cancelled'
	/** The app may or may not have run the action; reported, never silently retried. */
	| 'unknown'

export interface DevActionOutcome {
	requestId: string
	status: DevActionInvocationStatus
	/** Structured result validated against the declared result contract. */
	result?: Record<string, unknown>
	/** Machine-readable failure detail; mapped to ContractError codes server-side. */
	error?: { code: string; message: string }
	/** What the app knows changed before a failure/cancellation; absent = unknown. */
	partialEffects?: string[]
	completedAt: string
}

/** What `validateActionInput` returns. */
export type DevActionInputResult =
	| { ok: true; value: Record<string, unknown> }
	| { ok: false; errors: string[] }

// ---------- validators (shared with the app-side implementation) ----------

/** Declaration sanity: id shape, required metadata, compilable field patterns. */
export declare function validateActionDeclaration(action: unknown): string[]

/** Type-check + apply defaults + reject undeclared fields. */
export declare function validateActionInput(
	contract: DevActionFields | undefined,
	input: unknown,
): DevActionInputResult

/** Result-contract validation. An invalid output fails explicitly — it does not undo a ran action. */
export declare function validateActionOutput(
	contract: DevActionFields | undefined,
	output: unknown,
): DevActionInputResult

/** Structural check on an announcement payload. */
export declare function isDevActionAnnouncement(
	value: unknown,
): value is DevActionRegistryAnnouncement

/** Live availability for an announced action on a given platform. */
export declare function actionAvailability(
	action: DevActionListing,
	platform: Platform,
): { ready: boolean; reason?: string }
