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
// - Declarations and handlers are stored independently: a module-level
//   defineDevAction supplies the announced contract while components attach
//   and detach the handlers that execute it. Handlers outlive declaration
//   redefines so HMR keeps component-attached actions working.
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
	/** Aborted when the caller requests cancellation (cancellable actions only) or when the running handler's owner detaches. */
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

/** A development-action declaration without its handler — the announced contract. */
export type DevActionDeclaration = Omit<DevActionSpec, 'run'>

/** The handler signature a dev action or dev effect runs. */
export type DevActionRun = DevActionSpec['run']

/** A dev effect's declaration — effects report a fixed handler-count result. */
export type DevEffectDeclaration = Omit<DevActionDeclaration, 'result'>

/** A declared dev action: the announced contract plus its disposal handle. */
export interface DevActionDefinition extends DevActionHandle {
	readonly id: string
	readonly kind: 'action'
}

/** A declared dev effect: every attached handler runs on each invocation. */
export interface DevEffectDefinition extends DevActionHandle {
	readonly id: string
	readonly kind: 'effect'
}

/** One handler's failure as structured data — which owner threw, and the error it threw. */
export interface DevActionFailure {
	/** 0-based position, in attach order, of the failing handler among the action's handlers at dispatch. */
	handler: number
	/** Optional owner label (e.g. component name) supplied at attach time. */
	label?: string
	name: string
	message: string
	stack?: string
}

type AvailabilityProbe = () => { ready: boolean; reason?: string } | boolean

interface DeclarationEntry {
	spec: DevActionDeclaration
	kind: 'action' | 'effect'
	origin: 'static' | 'retained'
	owners: number
	key: string
}

interface HandlerEntry {
	run: DevActionRun
	label?: string
}

interface RunningInvocation {
	controller: AbortController
	cancellable: boolean
	started: boolean
	/** Handler entries currently executing for this invocation; detaching one aborts it. */
	active: Set<HandlerEntry>
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
	actions: Map<string, DeclarationEntry>
	handlers: Map<string, HandlerEntry[]>
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
	error?: { code: string; message: string; failures?: DevActionFailure[] }
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
			handlers: new Map(),
			outcomes: new Map(),
			running: new Map(),
			cancelRequested: new Set(),
			chain: Promise.resolve(),
			announceScheduled: false,
		}
	}

	return g[GLOBAL_KEY] as RegistryState
}

const evaluateAvailability = (spec: DevActionDeclaration): { ready: boolean; reason?: string } => {
	const probe = spec.availability?.ready as AvailabilityProbe | boolean | undefined
	if (typeof probe === 'function') {
		const verdict = probe()
		return typeof verdict === 'boolean' ? { ready: verdict } : verdict
	}

	return { ready: probe !== false }
}

const NO_HANDLER_REASON = 'no handler attached; its owning component is not mounted'

const liveAvailability = (state: RegistryState, entry: DeclarationEntry) =>
	entry.kind === 'action' && (state.handlers.get(entry.spec.id)?.length ?? 0) === 0
		? { ready: false, reason: NO_HANDLER_REASON }
		: evaluateAvailability(entry.spec)

const declarations = (state: RegistryState) =>
	[...state.actions.values()].map((entry) => {
		const spec = entry.spec
		const live = liveAvailability(state, entry)
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

const EFFECT_RESULT: DevActionFields = {
	fields: { handlerCount: { type: 'integer', minimum: 0 } },
}

function defineDeclaration(
	declaration: DevActionDeclaration,
	kind: 'action' | 'effect',
): DevActionDefinition | DevEffectDefinition {
	const problems = validateActionDeclaration(declaration)
	if (problems.length) {
		throw new Error(`Invalid dev ${kind} "${declaration?.id ?? '?'}": ${problems.join('; ')}`)
	}

	const state = registry()
	if (state.actions.has(declaration.id)) {
		throw new Error(`Dev ${kind} "${declaration.id}" is already registered`)
	}

	const entry: DeclarationEntry = {
		spec: kind === 'effect' ? { ...declaration, result: EFFECT_RESULT } : declaration,
		kind,
		origin: 'static',
		owners: 1,
		key: '',
	}

	state.actions.set(declaration.id, entry)
	state.revision += 1
	// The app declaration is sufficient setup. Production has no endpoint,
	// so this remains inert without the dev-server-only bridge token.
	startDevActionBridge()
	scheduleAnnounce(state)

	let disposed = false
	return {
		id: declaration.id,
		kind,
		dispose() {
			if (disposed) {
				return
			}

			disposed = true
			if (state.actions.get(declaration.id) === entry) {
				state.actions.delete(declaration.id)
				state.revision += 1
				scheduleAnnounce(state)
			}
		},
	} as DevActionDefinition | DevEffectDefinition
}

/**
 * Declare a development action's announced contract without a handler.
 * Components attach the handler that executes it (attachDevActionHandler or
 * the useDevActionHandler hook). Throws on an invalid declaration or a
 * duplicate id — registry membership is explicit, never a silent replace.
 */
export function defineDevAction(declaration: DevActionDeclaration): DevActionDefinition {
	return defineDeclaration(declaration, 'action') as DevActionDefinition
}

/**
 * Declare a development effect — a broadcast action that runs every attached
 * handler. Effects are announced as ordinary actions with a fixed
 * `{ handlerCount }` result contract.
 */
export function defineDevEffect(declaration: DevEffectDeclaration): DevEffectDefinition {
	return defineDeclaration(declaration, 'effect') as DevEffectDefinition
}

function attachHandler(
	id: string,
	kind: 'action' | 'effect',
	run: DevActionRun,
	options?: { label?: string },
): () => void {
	if (typeof run !== 'function') {
		throw new Error(`Invalid dev ${kind} handler for "${id}": a run(input, context) function is required`)
	}

	const state = registry()
	const entry = state.actions.get(id)
	if (entry && entry.kind !== kind) {
		throw new Error(`"${id}" is declared as a dev ${entry.kind}; cannot attach a ${kind} handler`)
	}

	const handler: HandlerEntry = { run, ...(options?.label !== undefined ? { label: options.label } : {}) }
	const list = state.handlers.get(id)
	if (list) {
		list.push(handler)
	} else {
		state.handlers.set(id, [handler])
	}

	// Availability changed even though the announced contract did not —
	// re-announce without bumping the registry revision.
	startDevActionBridge()
	scheduleAnnounce(state)

	let detached = false
	return () => {
		if (detached) {
			return
		}

		detached = true
		const list = state.handlers.get(id)
		if (list) {
			const index = list.indexOf(handler)
			if (index >= 0) {
				list.splice(index, 1)
			}

			if (!list.length) {
				state.handlers.delete(id)
			}
		}

		// A detached owner takes its in-flight invocation down with it.
		for (const running of state.running.values()) {
			if (running.active.has(handler)) {
				running.controller.abort()
			}
		}

		scheduleAnnounce(state)
	}
}

/**
 * Attach a handler to a declared dev action while the caller owns it; the
 * returned function detaches exactly this handler. When several handlers are
 * attached, the most recently attached one runs. Attaching to an undeclared
 * id is allowed — the handler waits for its declaration.
 */
export function attachDevActionHandler(
	action: DevActionDefinition | string,
	run: DevActionRun,
	options?: { label?: string },
): () => void {
	if (typeof action !== 'string' && action.kind !== 'action') {
		throw new Error(`"${action.id}" is a dev ${action.kind}; use attachDevEffectHandler`)
	}

	return attachHandler(typeof action === 'string' ? action : action.id, 'action', run, options)
}

/** Attach a handler to a dev effect; every attached handler runs per invocation. `options.label` names this owner in failure records. */
export function attachDevEffectHandler(
	effect: DevEffectDefinition | string,
	run: DevActionRun,
	options?: { label?: string },
): () => void {
	if (typeof effect !== 'string' && effect.kind !== 'effect') {
		throw new Error(`"${effect.id}" is a dev ${effect.kind}; use attachDevActionHandler`)
	}

	return attachHandler(typeof effect === 'string' ? effect : effect.id, 'effect', run, options)
}

/**
 * Declare a development action and attach its handler in one call. Disposing
 * the handle removes the declaration and only this registration's handler —
 * handlers attached by components stay attached.
 */
export function registerDevAction(spec: DevActionSpec): DevActionHandle {
	if (typeof spec.run !== 'function') {
		throw new Error(`Invalid dev action "${spec.id}": a run(input, context) handler is required`)
	}

	const definition = defineDevAction(spec)
	const detach = attachDevActionHandler(definition, spec.run)
	return {
		dispose() {
			detach()
			definition.dispose()
		},
	}
}

const normalizeForKey = (value: unknown): unknown => {
	if (typeof value === 'function') {
		return 'function'
	}

	if (Array.isArray(value)) {
		return value.map(normalizeForKey)
	}

	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {}
		for (const name of Object.keys(value).sort()) {
			out[name] = normalizeForKey((value as Record<string, unknown>)[name])
		}

		return out
	}

	return value
}

/** Stable identity for an inline declaration — functions compare as 'function'. */
export function devActionDeclarationKey(declaration: DevActionDeclaration): string {
	return JSON.stringify(normalizeForKey(declaration))
}

/**
 * Retain a component-owned inline declaration. Multiple owners may retain the
 * same id; identical declarations share one entry and the most recent spec
 * wins on conflicts. A static declaration of the same id is left untouched
 * (the inline declaration is ignored). The returned release function is
 * idempotent and drops the declaration when the last owner releases.
 */
export function retainDevAction(
	declaration: DevActionDeclaration,
	key: string,
): () => void {
	const problems = validateActionDeclaration(declaration)
	if (problems.length) {
		throw new Error(`Invalid dev action "${declaration?.id ?? '?'}": ${problems.join('; ')}`)
	}

	const state = registry()
	const id = declaration.id
	const entry = state.actions.get(id)

	if (entry?.origin === 'static') {
		console.warn(
			`[octane-xplat] Inline dev action declaration for "${id}" is ignored; a module-level declaration already owns this id.`,
		)

		return () => {}
	}

	if (!entry) {
		state.actions.set(id, { spec: declaration, kind: 'action', origin: 'retained', owners: 1, key })
		state.revision += 1
	} else {
		if (entry.key !== key) {
			console.warn(
				`[octane-xplat] Dev action "${id}" has conflicting inline declarations; using the most recent.`,
			)

			entry.key = key
			state.revision += 1
		}

		entry.spec = declaration
		entry.owners += 1
	}

	startDevActionBridge()
	scheduleAnnounce(state)

	let released = false
	return () => {
		if (released) {
			return
		}

		released = true
		const current = state.actions.get(id)
		if (current?.origin === 'retained') {
			current.owners -= 1
			if (current.owners <= 0) {
				state.actions.delete(id)
				state.revision += 1
				scheduleAnnounce(state)
			}
		}
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

const FAILURE_MESSAGE_MAX = 1024
const FAILURE_STACK_MAX = 4096
const FAILURE_RECORDS_MAX = 20
const FAILURE_SUMMARY_SHOWN = 3

const capText = (text: string, max: number) =>
	text.length > max ? `${text.slice(0, max)}…` : text

// Cross-realm safe: duck-typed, never instanceof Error.
const toFailureRecord = (
	index: number,
	label: string | undefined,
	thrown: unknown,
): DevActionFailure => {
	const base = { handler: index, ...(label !== undefined ? { label } : {}) }
	if (
		typeof thrown === 'object' &&
		thrown !== null &&
		typeof (thrown as { message?: unknown }).message === 'string'
	) {
		const error = thrown as { name?: unknown; message: string; stack?: unknown }
		return {
			...base,
			name: typeof error.name === 'string' ? error.name : 'Error',
			message: capText(error.message, FAILURE_MESSAGE_MAX),
			...(typeof error.stack === 'string'
				? { stack: capText(error.stack, FAILURE_STACK_MAX) }
				: {}),
		}
	}

	return { ...base, name: 'ThrownValue', message: capText(String(thrown), FAILURE_MESSAGE_MAX) }
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

	const entry = state.actions.get(request.actionId)
	if (!entry) {
		await postOutcome(
			rt,
			failOutcome(request.requestId, 'invalid_selection', `no action "${request.actionId}"`),
		)

		return
	}

	const spec = entry.spec
	const handlers = [...(state.handlers.get(spec.id) ?? [])]
	if (entry.kind === 'action' && handlers.length === 0) {
		await postOutcome(
			rt,
			failOutcome(
				request.requestId,
				'unavailable',
				`action "${spec.id}" is unavailable: ${NO_HANDLER_REASON}`,
			),
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

	const availability = liveAvailability(state, entry)
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
		active: new Set(),
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

		let invocationFailures: DevActionFailure[] | undefined
		try {
			let result: Record<string, unknown> | undefined
			if (entry.kind === 'effect') {
				// Broadcast: every handler attached at dispatch start runs, in
				// attach order, and failures don't stop the remaining handlers.
				const failureRecords: DevActionFailure[] = []
				const failureMessages: string[] = []
				for (const [index, handler] of handlers.entries()) {
					running.active.add(handler)
					try {
						await handler.run(input.value, context)
					} catch (error) {
						if (running.controller.signal.aborted) {
							throw error
						}

						const record = toFailureRecord(index, handler.label, error)
						if (failureRecords.length < FAILURE_RECORDS_MAX) {
							failureRecords.push(record)
						}

						failureMessages.push(record.message)
					} finally {
						running.active.delete(handler)
					}
				}

				if (failureMessages.length) {
					partialEffects.unshift(
						`${handlers.length - failureMessages.length} of ${handlers.length} handlers completed`,
					)

					invocationFailures = failureRecords
					const shown = failureMessages.slice(0, FAILURE_SUMMARY_SHOWN).join('; ')
					const rest = failureMessages.length - FAILURE_SUMMARY_SHOWN
					throw new Error(
						`${failureMessages.length} of ${handlers.length} handlers failed: ${shown}${rest > 0 ? ` (+${rest} more)` : ''}`,
					)
				}

				result = { handlerCount: handlers.length }
			} else {
				// The most recently attached handler wins; older ones stay
				// attached and take over again when it detaches.
				const handlerIndex = handlers.length - 1
				const handler = handlers[handlerIndex]
				if (handlers.length > 1) {
					console.warn(
						`[octane-xplat] Dev action "${spec.id}" has ${handlers.length} attached handlers; using the most recently attached${handler.label ? ` (${handler.label})` : ''}.`,
					)
				}

				running.active.add(handler)
				try {
					result = (await handler.run(input.value, context)) as
						| Record<string, unknown>
						| undefined
				} catch (thrown) {
					invocationFailures = [toFailureRecord(handlerIndex, handler.label, thrown)]
					throw thrown
				} finally {
					running.active.delete(handler)
				}
			}

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
								...(invocationFailures?.length
									? { failures: invocationFailures }
									: {}),
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
