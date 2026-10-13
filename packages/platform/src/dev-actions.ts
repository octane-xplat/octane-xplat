// App-declared development actions — the framework's development API.
//
// An app declares named actions here; the framework announces the live
// registry to its dev server, and a connected MCP server can list and invoke
// it with no action-specific wiring. The declaration is the single source of
// truth: handler, runtime-validatable input/result contracts, effects,
// availability, and execution policy all travel in one announcement.
//
// Lifetime and trust boundaries:
// - This module never runs the bridge in production: the endpoint requires
//   the dev-only __XPLAT_DEV_BRIDGE__ token define, which only the
//   xplatDevBridge dev-server plugin injects. Declare actions behind
//   `import.meta.env.DEV` (or your bundler's dev gate) so handlers and test
//   credentials tree-shake out of production artifacts.
// - The registry is a realm singleton — it survives hot reload, so a reload
//   replaces declarations atomically under a new revision while in-flight
//   invocations keep their original definitions.
// - Duplicate ids throw; disposing the returned handle removes the action
//   (component-owned registrations end with their owner).

import { devBridgeEndpoint, devBridgePlatform } from './dev-bridge'
import {
	validateActionDeclaration,
	validateActionInput,
	validateActionOutput,
	type DevActionFields,
} from './dev-actions-schema'

export type { DevActionField, DevActionFields } from './dev-actions-schema'

export type DevPlatform = 'web' | 'ios' | 'android' | 'macos' | 'linux' | 'windows'

/** Disclosed effect categories — the agent reads these to judge authorization. */
export interface DevActionEffects {
	/** Plain-language summary of what the action changes. */
	summary: string
	auth?: boolean
	navigation?: boolean
	appState?: boolean
	testData?: boolean
	/** Effects outside the app (external test services, destructive resets) — the MCP server requires the external-effects grant. */
	externalEffects?: boolean
}

export interface DevActionAvailability {
	/** Platforms this action applies to; absent = all. */
	platforms?: DevPlatform[]
	/** Live readiness — boolean or a probe evaluated on every announce/invoke. */
	ready?: boolean | (() => { ready: boolean; reason?: string } | boolean)
	/** Readiness conditions, e.g. "mock test server reachable". */
	readyWhen?: string
}

export interface DevActionExecution {
	/** 'serialized' (default) runs one action per app instance at a time; 'overlap' declares safe concurrency. */
	concurrency?: 'serialized' | 'overlap'
	/** Cooperative cancellation supported by the handler. */
	cancellable?: boolean
	/** Idempotent — safe for a retry after an uncertain outcome. */
	retryable?: boolean
	/** Execution deadline enforced by the caller; bounded server-side. */
	timeoutMs?: number
}

export interface DevActionContext {
	/** Aborted when the caller requests cancellation (cancellable actions only). */
	signal: AbortSignal
	requestId: string
	/** Disclose a change the action already made — reported back on failure/cancel. */
	reportPartialEffect(effect: string): void
}

export interface DevActionSpec {
	/** Stable machine identity, e.g. `auth.login-as-test-admin`. */
	id: string
	title: string
	/** When to use it and what successful completion means. */
	description: string
	input?: DevActionFields
	result?: DevActionFields
	effects: DevActionEffects
	availability?: DevActionAvailability
	execution?: DevActionExecution
	run(input: Record<string, unknown>, context: DevActionContext): unknown
}

export interface DevActionHandle {
	dispose(): void
}

type AvailabilityProbe = () => { ready: boolean; reason?: string } | boolean

interface RunningInvocation {
	controller: AbortController
	cancellable: boolean
	started: boolean
}

interface BridgeRuntime {
	endpoint: { origin: string; token: string }
	state: 'connecting' | 'live' | 'degraded' | 'stopped'
	lastError?: string
	polling: boolean
	announcing: boolean
	controller: AbortController
	timer?: ReturnType<typeof setInterval>
}

interface RegistryState {
	instanceId: string
	revision: number
	actions: Map<string, DevActionSpec>
	outcomes: Map<string, DevActionOutcome>
	running: Map<string, RunningInvocation>
	cancelRequested: Set<string>
	chain: Promise<unknown>
	bridge?: BridgeRuntime
	appLabel?: string
	announceScheduled: boolean
}

interface DevActionOutcome {
	requestId: string
	status: 'succeeded' | 'failed' | 'cancelled' | 'unknown'
	result?: Record<string, unknown>
	error?: { code: string; message: string }
	partialEffects?: string[]
	completedAt: string
}

interface InvocationRequest {
	requestId: string
	appInstanceId: string
	actionId: string
	registryRevision?: number
	input: Record<string, unknown>
}

export interface DevActionBridge {
	readonly instanceId: string
	readonly state: 'connecting' | 'live' | 'degraded' | 'stopped' | 'unavailable'
	readonly lastError?: string
	stop(): void
}

export interface DevActionBridgeOptions {
	/** Dev-server origin override — normally discovered per platform. */
	origin?: string
	/** Label for the developer, e.g. which test harness window this is. */
	appLabel?: string
	/** Announcement/heartbeat interval; must stay below the bridge's instance TTL. */
	intervalMs?: number
}

const ANNOUNCE_INTERVAL_MS = 5_000
const POLL_WAIT_MS = 25_000
const MAX_OUTCOMES = 256

const GLOBAL_KEY = 'octane-xplat.dev-actions'

type FetchLike = (
	input: string,
	init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: unknown },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

const fetchImpl = () => (globalThis as { fetch?: FetchLike }).fetch

const uuid = () =>
	(globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID?.() ??
	`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

function registry(): RegistryState {
	const g = globalThis as unknown as Record<string, RegistryState | undefined>
	if (!g[GLOBAL_KEY]) {
		g[GLOBAL_KEY] = {
			instanceId: `inst_${uuid()}`,
			revision: 0,
			actions: new Map(),
			outcomes: new Map(),
			running: new Map(),
			cancelRequested: new Set(),
			chain: Promise.resolve(),
			announceScheduled: false,
		}
	}

	return g[GLOBAL_KEY] as RegistryState
}

const evaluateAvailability = (spec: DevActionSpec): { ready: boolean; reason?: string } => {
	const probe = spec.availability?.ready as AvailabilityProbe | boolean | undefined
	if (typeof probe === 'function') {
		const verdict = probe()
		return typeof verdict === 'boolean' ? { ready: verdict } : verdict
	}

	return { ready: probe !== false }
}

const declarations = (state: RegistryState) =>
	[...state.actions.values()].map((spec) => {
		const live = evaluateAvailability(spec)
		return {
			id: spec.id,
			title: spec.title,
			description: spec.description,
			input: spec.input,
			result: spec.result,
			effects: spec.effects,
			availability: {
				...(spec.availability?.platforms ? { platforms: spec.availability.platforms } : {}),
				...(spec.availability?.readyWhen ? { readyWhen: spec.availability.readyWhen } : {}),
				ready: live.ready,
				...(live.reason ? { reason: live.reason } : {}),
			},
			execution: spec.execution,
		}
	})

const snapshot = (state: RegistryState, appLabel?: string) => ({
	protocol: 'xplat-dev-actions',
	version: 1,
	appInstanceId: state.instanceId,
	...(appLabel ? { appLabel } : {}),
	platform: devBridgePlatform(),
	revision: state.revision,
	announcedAt: new Date().toISOString(),
	actions: declarations(state),
})

/**
 * Declare a development action. Throws on an invalid declaration or a
 * duplicate id — registry membership is explicit, never a silent replace.
 */
export function registerDevAction(spec: DevActionSpec): DevActionHandle {
	const problems = validateActionDeclaration(spec)
	if (problems.length) {
		throw new Error(`Invalid dev action "${spec?.id ?? '?'}": ${problems.join('; ')}`)
	}

	if (typeof spec.run !== 'function') {
		throw new Error(`Invalid dev action "${spec.id}": a run(input, context) handler is required`)
	}

	const state = registry()
	if (state.actions.has(spec.id)) {
		throw new Error(`Dev action "${spec.id}" is already registered`)
	}

	state.actions.set(spec.id, spec)
	state.revision += 1
	// The app declaration is sufficient setup. Production has no endpoint,
	// so this remains inert without the dev-server-only bridge token.
	startDevActionBridge()
	scheduleAnnounce(state)

	return {
		dispose() {
			if (state.actions.delete(spec.id)) {
				state.revision += 1
				scheduleAnnounce(state)
			}
		},
	}
}

/** Current declarations as the registry would announce them. */
export function listDevActions() {
	return declarations(registry())
}

/** The registry revision — increments on every add/remove. */
export function devActionsRevision(): number {
	return registry().revision
}

/**
 * Start announcing this app's registry to the dev bridge and polling it for
 * invocations. Idempotent — later calls return the live bridge. When no
 * dev-bridge endpoint exists (production builds, runtimes without a dev
 * server) the returned handle reports 'unavailable' and stays inert.
 */
export function startDevActionBridge(options: DevActionBridgeOptions = {}): DevActionBridge {
	const state = registry()
	if (state.bridge) {
		const rt = state.bridge
		if (options.appLabel !== undefined && options.appLabel !== state.appLabel) {
			state.appLabel = options.appLabel
			scheduleAnnounce(state)
		}

		return {
			instanceId: state.instanceId,
			get state() {
				return rt.state
			},
			get lastError() {
				return rt.lastError
			},
			stop: () => stopBridge(rt),
		}
	}

	const discovered = devBridgeEndpoint()
	const origin = options.origin ?? discovered?.origin
	const token = discovered?.token
	if (!origin || !token) {
		return {
			instanceId: state.instanceId,
			state: 'unavailable',
			lastError:
				'No dev-bridge endpoint: this build has no __XPLAT_DEV_BRIDGE__ token (dev-server-only define) or no reachable dev-server origin.',
			stop: () => {},
		}
	}

	const rt: BridgeRuntime = {
		endpoint: { origin, token },
		state: 'connecting',
		polling: true,
		announcing: true,
		controller: new AbortController(),
	}

	state.bridge = rt
	state.appLabel = options.appLabel

	void announceOnce(rt)
	rt.timer = setInterval(() => void announceOnce(rt), options.intervalMs ?? ANNOUNCE_INTERVAL_MS)
	void pollLoop(rt)

	return {
		instanceId: state.instanceId,
		get state() {
			return rt.state
		},
		get lastError() {
			return rt.lastError
		},
		stop: () => stopBridge(rt),
	}
}

function stopBridge(rt: BridgeRuntime) {
	rt.polling = false
	rt.announcing = false
	rt.state = 'stopped'
	rt.controller.abort()
	if (rt.timer) {
		clearInterval(rt.timer)
	}

	if (registry().bridge === rt) {
		registry().bridge = undefined
	}
}

// Coalesce bursts (hot-reload re-registration) into one announcement.
function scheduleAnnounce(state: RegistryState) {
	if (!state.bridge?.announcing || state.announceScheduled) {
		return
	}

	state.announceScheduled = true
	queueMicrotask(() => {
		state.announceScheduled = false
		void announceOnce(state.bridge as BridgeRuntime)
	})
}

async function announceOnce(rt: BridgeRuntime) {
	const fetch = fetchImpl()
	if (!rt.announcing || !fetch) {
		if (!fetch) {
			rt.state = 'degraded'
			rt.lastError = 'no fetch implementation in this runtime'
		}

		return
	}

	const state = registry()
	try {
		const res = await fetch(`${rt.endpoint.origin}/__xplat_dev__/registry`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-xplat-dev-token': rt.endpoint.token,
			},
			body: JSON.stringify(snapshot(state, state.appLabel)),
		})

		rt.state = res.ok ? 'live' : 'degraded'
		rt.lastError = res.ok ? undefined : `announce failed: HTTP ${res.status}`
	} catch (error) {
		rt.state = 'degraded'
		rt.lastError = `announce failed: ${(error as Error)?.message ?? error}`
	}
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function pollLoop(rt: BridgeRuntime) {
	const fetch = fetchImpl()
	if (!fetch) {
		rt.state = 'degraded'
		rt.lastError = 'no fetch implementation in this runtime'
		return
	}

	const state = registry()
	while (rt.polling) {
		try {
			const res = await fetch(
				`${rt.endpoint.origin}/__xplat_dev__/poll?instance=${encodeURIComponent(
					state.instanceId,
				)}&wait=${POLL_WAIT_MS}`,
				{
					headers: { 'x-xplat-dev-token': rt.endpoint.token },
					signal: rt.controller.signal,
				},
			)

			if (res.status === 404) {
				// The bridge forgot this instance — re-announce before polling again.
				await announceOnce(rt)
				continue
			}

			if (!res.ok) {
				rt.state = 'degraded'
				rt.lastError = `poll failed: HTTP ${res.status}`
				await sleep(1_000)
				continue
			}

			rt.state = 'live'
			rt.lastError = undefined
			const work = (await res.json()) as {
				invocations?: InvocationRequest[]
				cancel?: string[]
			}

			for (const request of work.invocations ?? []) {
				void dispatchInvocation(rt, request)
			}

			for (const requestId of work.cancel ?? []) {
				requestCancel(requestId)
			}
		} catch (error) {
			rt.state = 'degraded'
			rt.lastError = `poll failed: ${(error as Error)?.message ?? error}`
			await sleep(1_500)
		}
	}
}

function requestCancel(requestId: string) {
	const state = registry()
	state.cancelRequested.add(requestId)
	const running = state.running.get(requestId)
	if (running?.cancellable && running.started) {
		running.controller.abort()
	}
}

async function postOutcome(rt: BridgeRuntime, outcome: DevActionOutcome) {
	const fetch = fetchImpl()
	const state = registry()
	if (state.outcomes.size >= MAX_OUTCOMES) {
		state.outcomes.delete(state.outcomes.keys().next().value as string)
	}

	state.outcomes.set(outcome.requestId, outcome)

	if (!fetch) {
		return
	}

	try {
		await fetch(`${rt.endpoint.origin}/__xplat_dev__/result`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-xplat-dev-token': rt.endpoint.token,
			},
			body: JSON.stringify({ requestId: outcome.requestId, outcome }),
		})
	} catch {
		// The MCP side times out honestly when the bridge is gone.
	}
}

const failOutcome = (requestId: string, code: string, message: string): DevActionOutcome => ({
	requestId,
	status: 'failed',
	error: { code, message },
	completedAt: new Date().toISOString(),
})

async function dispatchInvocation(rt: BridgeRuntime, request: InvocationRequest) {
	const state = registry()

	// Stable request identity: a repeated delivery re-posts the stored outcome.
	const prior = state.outcomes.get(request.requestId)
	if (prior) {
		await postOutcome(rt, prior)
		return
	}

	if (state.running.has(request.requestId) || state.cancelRequested.has(request.requestId)) {
		return
	}

	// Rejected before execution — stale revision, removed action, unavailable.
	if (request.registryRevision !== undefined && request.registryRevision !== state.revision) {
		await postOutcome(
			rt,
			failOutcome(
				request.requestId,
				'stale_identity',
				`registry revision ${request.registryRevision} is stale (current ${state.revision})`,
			),
		)

		return
	}

	const spec = state.actions.get(request.actionId)
	if (!spec) {
		await postOutcome(
			rt,
			failOutcome(request.requestId, 'invalid_selection', `no action "${request.actionId}"`),
		)

		return
	}

	const platforms = spec.availability?.platforms
	const platform = devBridgePlatform()
	if (platforms && !platforms.includes(platform)) {
		await postOutcome(
			rt,
			failOutcome(
				request.requestId,
				'unavailable',
				`action "${spec.id}" is not applicable on ${platform}`,
			),
		)

		return
	}

	const availability = evaluateAvailability(spec)
	if (!availability.ready) {
		await postOutcome(
			rt,
			failOutcome(
				request.requestId,
				'unavailable',
				`action "${spec.id}" is unavailable: ${availability.reason ?? 'reported unavailable'}`,
			),
		)

		return
	}

	const input = validateActionInput(spec.input, request.input)
	if (!input.ok) {
		await postOutcome(
			rt,
			failOutcome(
				request.requestId,
				'invalid_selection',
				`invalid input: ${input.errors.join('; ')}`,
			),
		)

		return
	}

	const running: RunningInvocation = {
		controller: new AbortController(),
		cancellable: spec.execution?.cancellable === true,
		started: false,
	}

	state.running.set(request.requestId, running)

	const work = async () => {
		if (state.cancelRequested.has(request.requestId)) {
			state.running.delete(request.requestId)
			await postOutcome(rt, {
				requestId: request.requestId,
				status: 'cancelled',
				completedAt: new Date().toISOString(),
			})

			return
		}

		running.started = true
		const partialEffects: string[] = []
		const context: DevActionContext = {
			signal: running.controller.signal,
			requestId: request.requestId,
			reportPartialEffect: (effect) => partialEffects.push(String(effect)),
		}

		try {
			const result = (await spec.run(input.value, context)) as Record<string, unknown> | undefined
			const output = validateActionOutput(spec.result, result)
			const outcome: DevActionOutcome = output.ok
				? {
						requestId: request.requestId,
						status: 'succeeded',
						result: output.value,
						...(partialEffects.length ? { partialEffects } : {}),
						completedAt: new Date().toISOString(),
					}
				: {
						requestId: request.requestId,
						status: 'failed',
						error: {
							code: 'execution_failure',
							message: `output failed the declared result contract: ${output.errors.join('; ')}`,
						},
						partialEffects: partialEffects.length
							? partialEffects
							: ['action ran to completion; its result was rejected'],
						completedAt: new Date().toISOString(),
					}

			await postOutcome(rt, outcome)
		} catch (error) {
			await postOutcome(
				rt,
				running.controller.signal.aborted
					? {
							requestId: request.requestId,
							status: 'cancelled',
							...(partialEffects.length ? { partialEffects } : {}),
							completedAt: new Date().toISOString(),
						}
					: {
							requestId: request.requestId,
							status: 'failed',
							error: {
								code: 'execution_failure',
								message: (error as Error)?.message ?? String(error),
							},
							...(partialEffects.length ? { partialEffects } : {}),
							completedAt: new Date().toISOString(),
						},
			)
		} finally {
			state.running.delete(request.requestId)
		}
	}

	// Serialized by default: one action per app instance at a time.
	if (spec.execution?.concurrency === 'overlap') {
		void work()
	} else {
		state.chain = state.chain.catch(() => {}).then(work)
	}
}
