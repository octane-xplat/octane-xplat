/**
 * Session, job, and ownership contract.
 *
 * A session binds one app to one target. Sessions are either `owned` (this
 * server started them — ending releases their resources) or `attached`
 * (a development session the user already had running — ending detaches and
 * preserves it). Restarting always establishes a new session identity; tools
 * refuse operations against stopped or disconnected sessions.
 *
 * Jobs are bounded units of work (build, launch, dev-action, …) whose status
 * is queryable without holding a tool call open. Repeating a request with the
 * same `requestKey` returns the live job instead of duplicating it.
 * Cancellation is cooperative: `cancelling` and `cancelled` are distinct
 * states, and cancelling a job only signals that job's own operation — it
 * must never kill an unrelated app.
 */

import type { ContractError } from './errors'
import type { Platform } from './identity'

export const SESSION_STATES: readonly SessionState[]
export const JOB_STATES: readonly JobState[]
export const JOB_TERMINAL_STATES: readonly JobState[]

export type SessionState =
	/** Bound but not yet ready for observation/interaction. */
	| 'starting'
	/** Ready — inspection, logs, and authorized interactions may proceed. */
	| 'ready'
	/** Lost contact; last-known data is historical evidence, never current state. */
	| 'disconnected'
	/** Ended — identity is stale; a new run is a new sessionId. */
	| 'stopped'

export type SessionOwnership =
	/** Started by this server; end releases owned resources. */
	| 'owned'
	/** Pre-existing user session; end detaches and preserves it. */
	| 'attached'

/** Build/source identity attached to observations so a new install is never mistaken for the running process. */
export interface BuildIdentity {
	buildId?: string
	revision?: string
	label?: string
}

export interface SessionBinding {
	sessionId: string
	appId: string
	platform: Platform
	targetId: string
	ownership: SessionOwnership
	state: SessionState
	createdAt: string
	/** `fresh` = new process; `warm` = iteration that retained process/module/OS state. */
	processKind: 'fresh' | 'warm' | null
	buildIdentity?: BuildIdentity
	detail?: string
}

export interface EndSessionResult {
	sessionId: string
	ended: boolean
	/** Owned resources released (processes, ports, temp dirs) — reported by the adapter. */
	released?: string[]
	/** What was deliberately left running — e.g. an attached user-owned session. */
	preserved?: string[]
}

export type JobState = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelling' | 'cancelled'

export interface JobProgress {
	phase?: string
	percent?: number
	message?: string
}

export interface Job {
	jobId: string
	/** e.g. `build`, `launch`, `attach`, `dev-action`. */
	kind: string
	sessionId?: string
	/** Idempotence key supplied by the caller or adapter. */
	requestKey?: string
	state: JobState
	progress?: JobProgress
	result?: unknown
	error?: ContractError
	createdAt: string
	finishedAt?: string
}

/** Adapter-provided work for a job. Receives the cooperative-cancel signal. */
export type JobRunner = (
	signal: AbortSignal,
	report: (progress: JobProgress) => void,
) => Promise<unknown>

export interface StartJobOptions {
	kind: string
	sessionId?: string
	requestKey?: string
	run?: JobRunner
}

export interface StartJobResult {
	job: Job
	/** True when an identical live job already existed and was returned instead of starting a duplicate. */
	deduplicated: boolean
}

export interface SessionRegistry {
	/** Start a server-owned session in `starting` state. `cleanup` runs on end/shutdown and must only release resources this session created. */
	bindOwned(input: {
		appId: string
		platform: Platform
		targetId: string
		cleanup?: () => Promise<{ released?: string[] } | void> | { released?: string[] } | void
		detail?: string
	}): SessionBinding
	/** Bind an existing user-owned development session — never restarted or terminated by this server. */
	attach(input: {
		appId: string
		platform: Platform
		targetId: string
		processKind?: 'fresh' | 'warm'
		buildIdentity?: BuildIdentity
		detail?: string
	}): SessionBinding
	get(sessionId: string): SessionBinding | null
	/** The binding if usable, else a ContractError: `stale_identity` (stopped) or `disconnected_runtime`. */
	requireUsable(
		sessionId: string,
	): { usable: true; session: SessionBinding } | { usable: false; error: ContractError }
	markReady(
		sessionId: string,
		meta?: { processKind?: 'fresh' | 'warm'; buildIdentity?: BuildIdentity },
	): SessionBinding | null
	markDisconnected(sessionId: string, detail?: string): SessionBinding | null
	end(sessionId: string): Promise<EndSessionResult>
	/** End every owned session and detach attached ones. */
	shutdown(): Promise<EndSessionResult[]>
	list(): SessionBinding[]
}

export interface JobRegistry {
	start(options: StartJobOptions): StartJobResult
	status(jobId: string): Job | null
	setProgress(jobId: string, progress: JobProgress): Job | null
	succeed(jobId: string, result?: unknown): Job | null
	fail(jobId: string, error: ContractError): Job | null
	/** Cooperative cancellation; returns the job's resulting state. */
	cancel(jobId: string): Job | null
	/** Live and finished jobs (finished history is bounded). */
	list(): Job[]
}

export declare function createSessionRegistry(): SessionRegistry
export declare function createJobRegistry(options?: { historyLimit?: number }): JobRegistry
