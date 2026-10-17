/**
 * Shared error vocabulary for the Octane Xplat MCP server.
 *
 * Every tool failure is one of these codes — agents must be able to tell an
 * invalid selection from a missing prerequisite, a busy target, a stale
 * identity, a disconnected runtime, or a real execution failure. Each error
 * names the smallest corrective action through `recovery`.
 */

export const CONTRACT_ERROR_CODES: readonly ContractErrorCode[]

export type ContractErrorCode =
	/** The named app, target, session, job, or option does not exist or does not apply. */
	| 'invalid_selection'
	/** Equally plausible choices would change the result — the developer must pick. Never resolved silently. */
	| 'ambiguous_selection'
	/** A required permission grant is absent, expired, or revoked. */
	| 'permission_denied'
	/** The platform/target does not support this capability; `alternative` may offer a usable path. */
	| 'unsupported_capability'
	/** A toolchain, device, or data prerequisite is missing; `recovery` names the smallest fix. */
	| 'prerequisite_missing'
	/** The target is owned by another session/agent, or a bounded queue is saturated. */
	| 'target_busy'
	/** The session, registry revision, or build identity changed since the caller bound it. */
	| 'stale_identity'
	/** The runtime disconnected; last-known state is historical evidence, never current state. */
	| 'disconnected_runtime'
	/** The operation ran and failed. */
	| 'execution_failure'
	/** The named resource (job, session, evidence record) does not exist. */
	| 'not_found'
	/** Cancellation won the race or was requested before/while running. */
	| 'cancelled'
	/** A bounded wait or execution timeout expired. */
	| 'timeout'
	/** An optional subsystem (docs index, code index, embeddings) is not provided or offline. */
	| 'unavailable'

/** The smallest corrective step a developer or agent can take. */
export interface Recovery {
	/** Imperative description, e.g. "Select an app with xplat_select_app". */
	action: string
	/** Optional concrete detail: a command, path, or env var. */
	detail?: string
}

export interface ContractError {
	code: ContractErrorCode
	message: string
	recovery?: Recovery
	/** Whether retrying the same call could succeed without other changes. */
	retryable?: boolean
	/** Structured context, e.g. `candidates` for ambiguous_selection. */
	context?: Record<string, unknown>
}

/** Success/failure envelope used by every MCP tool result's structuredContent. */
export type ToolOutcome<T> = { ok: true; data: T } | { ok: false; error: ContractError }

export declare function contractError(
	code: ContractErrorCode,
	message: string,
	options?: { recovery?: Recovery; retryable?: boolean; context?: Record<string, unknown> },
): ContractError

export declare function ok<T>(data: T): ToolOutcome<T>
export declare function fail(error: ContractError): ToolOutcome<never>
export declare function isContractError(value: unknown): value is ContractError

/** Normalize any thrown value into a ContractError (default code: execution_failure). */
export declare function toContractError(
	value: unknown,
	fallbackCode?: ContractErrorCode,
): ContractError
