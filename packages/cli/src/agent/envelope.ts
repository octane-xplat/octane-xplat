// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Shared CLI contract envelope — the versioned projection every agent-facing
// command emits in `--json` mode, including the session/job/observation
// commands that route through the runtime host, so it lives in one place
// rather than per command.
//
// Envelope: { contractVersion, ok, requestId, context?, data? | error? }
// Error:    { code, message, recovery?, retryable?, context? }
//           — the same shape the MCP service contracts produce; meanings are
//           preserved, not re-encoded.
import { randomUUID } from 'node:crypto'

export const CONTRACT_VERSION = 1

export const EXIT = {
	ok: 0,
	invalidInput: 2,
	unavailable: 3,
	permissionDenied: 4,
	failed: 5,
	disconnected: 6,
	timeout: 7,
	cancelled: 8,
}

// Contract error code → process exit group (plan: Output, failure and
// long-running operations). Unknown codes are ordinary failures.
export const ERROR_EXIT = {
	invalid_selection: EXIT.invalidInput,
	ambiguous_selection: EXIT.invalidInput,
	not_found: EXIT.invalidInput,
	prerequisite_missing: EXIT.unavailable,
	unavailable: EXIT.unavailable,
	unsupported_capability: EXIT.unavailable,
	target_busy: EXIT.unavailable,
	permission_denied: EXIT.permissionDenied,
	stale_identity: EXIT.failed,
	execution_failure: EXIT.failed,
	disconnected_runtime: EXIT.disconnected,
	timeout: EXIT.timeout,
	cancelled: EXIT.cancelled,
}

export const requestId = () => `req-${randomUUID()}`

export const exitForError = (error) => ERROR_EXIT[error?.code] ?? EXIT.failed

/** One finite JSON result on stdout — nothing else may share the channel. */
export const emitJson = (payload) => {
	process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
}

/** Diagnostics never contaminate stdout. */
export const diagnose = (message) => {
	process.stderr.write(`${message}\n`)
}

export const resultOk = (data, { id, context } = {}) => ({
	contractVersion: CONTRACT_VERSION,
	ok: true,
	requestId: id ?? requestId(),
	...(context ? { context } : {}),
	data,
})

export const resultFail = (error, { id, context } = {}) => ({
	contractVersion: CONTRACT_VERSION,
	ok: false,
	requestId: id ?? requestId(),
	...(context ? { context } : {}),
	error,
})
