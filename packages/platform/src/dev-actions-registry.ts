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
//   devBridge dev-server plugin injects. Declare actions behind
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

import { ReadinessError, type ReadinessController, type ReadinessSnapshot } from './readiness-state'

import type { AppDebugSocket } from './dev-bridge-socket'
import { devBridgeEndpoint, devBridgePlatform, devBridgeSocket } from './dev-bridge'
import {
  validateActionDeclaration,
  validateActionInput,
  validateActionOutput,
  type DevActionFields,
} from './dev-actions-schema'

export type DevActionInfo = {
  /** Stable action/run identifier. */
  id: string
  /** Display title. */
  title: string
  description: string
  /** Current input values. */
  input: DevActionFields | undefined
  /** Execution result. */
  result: DevActionFields | undefined
  /** Declared side-effect targets. */
  effects: DevActionEffects
  /** Whether the action can run now. */
  availability: {
    reason?: string | undefined
    ready: boolean
    route?:
      | {
          url: string
          fromInput?: undefined
        }
      | {
          fromInput: boolean
          url?: undefined
        }
      | undefined
    readyWhen?: string | undefined
    platforms?: DevPlatform[] | undefined
  }
  /** Registered work owned by selected handlers; separate from invocation availability. */
  readiness?: ReadinessSnapshot[]
  /** Current/last execution record. */
  execution: DevActionExecution | undefined
}[]

export type { DevActionField, DevActionFields } from './dev-actions-schema'

/** Platforms dev actions target. */
export type DevPlatform = 'web' | 'ios' | 'android' | 'macos' | 'linux' | 'windows'

/** Disclosed effect categories — the agent reads these to judge authorization. */
export interface DevActionEffects {
  /** Plain-language summary of what the action changes. */
  summary: string
  /** Auth service available to actions. */
  auth?: boolean
  /** Navigation service available to actions. */
  navigation?: boolean
  /** App-state service. */
  appState?: boolean
  /** Test-data injection seam. */
  testData?: boolean
  /** Effects outside the app (external test services, destructive resets) — the MCP server requires the external-effects grant. */
  externalEffects?: boolean
}

/** Whether a dev action can run. */
export interface DevActionAvailability {
  /** Platforms this action applies to; absent = all. */
  platforms?: DevPlatform[]
  /** Live readiness — boolean or a probe evaluated on every announce/invoke. */
  ready?: boolean | (() => { ready: boolean; reason?: string } | boolean)
  /** Readiness conditions, e.g. "mock test server reachable". */
  readyWhen?: string
}

/** One execution of a dev action. */
export interface DevActionExecution {
  /** 'serialized' (default) runs one action per app instance at a time; 'overlap' declares safe concurrency. */
  concurrency?: 'serialized' | 'overlap'
  /** Cooperative cancellation supported by the handler. */
  cancellable?: boolean
  /** Idempotent — safe for a retry after an uncertain outcome. */
  retryable?: boolean
  /** Execution deadline enforced by the caller; bounded server-side. Route-declared actions spend at most half of it navigating and waiting for the handler. */
  timeoutMs?: number
}

/** Services a dev action may use. */
export interface DevActionContext {
  /** Aborted when the caller requests cancellation (cancellable actions only) or when the running handler's owner detaches. */
  signal: AbortSignal
  /** Correlation id for the request. */
  requestId: string
  /** Disclose a change the action already made — reported back on failure/cancel. */
  reportPartialEffect(effect: string): void
}

/** Registered dev-action spec. */
export interface DevActionSpec {
  /** Stable machine identity, e.g. `auth.login-as-test-admin`. */
  id: string
  /** Display title. */
  title: string
  /** When to use it and what successful completion means. */
  description: string
  /** Current input values. */
  input?: DevActionFields
  /** Execution result. */
  result?: DevActionFields
  /** Declared side-effect targets. */
  effects: DevActionEffects
  /** Whether the action can run now. */
  availability?: DevActionAvailability
  /** Current/last execution record. */
  execution?: DevActionExecution
  /**
   * URL (e.g. '/checkout') — or an input-derived URL — the framework
   * navigates to when this action is invoked without an attached handler.
   * Screen-owned actions declare this so agents can reach them without
   * knowing app route structure. Dev actions only.
   */
  route?: string | ((input: Record<string, unknown>) => string)
  /** The handler. May return a Promise; the awaited result is validated
   *  against the declared `result` contract, so `unknown` is honest here. */
  run(input: Record<string, unknown>, context: DevActionContext): unknown
}

/** Handle for a running dev action. */
export interface DevActionHandle {
  /** Remove this registration's declaration/attachment; idempotent. */
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
  /** The declared action id. */
  readonly id: string
  /** Discriminates from a dev-effect definition. */
  readonly kind: 'action'
}

/** A declared dev effect: every attached handler runs on each invocation. */
export interface DevEffectDefinition extends DevActionHandle {
  /** The declared effect id. */
  readonly id: string
  /** Discriminates from a dev-action definition. */
  readonly kind: 'effect'
}

/** One handler's failure as structured data — which owner threw, and the error it threw. */
export interface DevActionFailure {
  /** 0-based position, in attach order, of the failing handler among the action's handlers at dispatch. */
  handler: number
  /** Optional owner label (e.g. component name) supplied at attach time. */
  label?: string
  /** Error/action name. */
  name: string
  /** Error message. */
  message: string
  /** Error stack trace. */
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

/** One dispatch-start participant; success describes its handler, not painted pixels. */
export interface DevActionHandlerOutcome {
  /** Position in the dispatch-start cohort. */
  handler: number
  /** Static owner label supplied at attachment. */
  label?: string
  /** A cancelled invocation can leave later participants unrun. */
  status: 'not-run' | 'succeeded' | 'failed' | 'cancelled'
}

/** Options for a directly attached handler. Component hooks bind readiness through context. */
export interface DevActionHandlerOptions {
  /** Static owner label, without user data. */
  label?: string
  /** Readiness owner to await after execution; omitted for unscoped handlers. */
  readiness?: ReadinessController
}

interface HandlerEntry {
  readiness?: ReadinessController
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

// Structural protocol only; browser code is installed by its development Vite
// plugin. Other hosts and SSR have no inspector and must not advertise one.
interface AppDebugInspector {
  version: 1
  documentId: string
  inspect(args: unknown): unknown
  interact?(args: unknown): unknown
}

function appDebugInspector(): AppDebugInspector | undefined {
  const candidate = (globalThis as unknown as Record<string, AppDebugInspector | undefined>)[
    'octane-xplat.dev-inspector'
  ]

  return candidate?.version === 1 &&
    typeof candidate.documentId === 'string' &&
    candidate.documentId.length <= 128 &&
    typeof candidate.inspect === 'function'
    ? candidate
    : undefined
}

interface BridgeRuntime {
  endpoint: {
    origin: string
    token: string
    socket?: string
    instanceId?: string
    targetId?: string
  }
  socket?: AppDebugSocket
  reconnect?: ReturnType<typeof setTimeout>
  state: 'connecting' | 'live' | 'degraded' | 'stopped'
  lastError?: string
  polling: boolean
  announcing: boolean
  controller: AbortController
  timer?: ReturnType<typeof setInterval>
  /** Set when the hub's `registered` ack advertised the channels capability. */
  channelCapable?: boolean
}

interface ChannelEntry {
  id: string
  version: number
  handlers: DevChannelHandlers
  closed: boolean
  state?: DevChannelState
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
  navigator?: { impl: DevActionNavigator; unsubscribe?: () => void }
  channels?: Map<string, ChannelEntry>
}

/**
 * A dev-action failure carrying a protocol error code instead of the generic
 * `execution_failure` — used by `xplat.navigate` to surface the router's
 * `navigation_blocked`/`navigation_failed` codes verbatim. @internal
 */
export class DevNavigationError extends Error {
  /** Result code. */
  code: 'navigation_blocked' | 'navigation_failed'
  constructor(code: 'navigation_blocked' | 'navigation_failed', message: string) {
    super(message)
    this.code = code
  }
}

/** The result a router navigator reports to the dev-actions registry. @internal */
export type DevNavigationResult =
  | { ok: true; route: string | null }
  | {
      /** Whether the call succeeded. */
      ok: false
      /** Result code. */
      code: 'navigation_blocked' | 'navigation_failed'
      status: string
      /** Error message. */
      message: string
    }

/**
 * The seam a UI router installs so route-declared dev actions can navigate to
 * their screen before running. Implemented by
 * `@octane-xplat/ui/routing/dev`. @internal
 */
export interface DevActionNavigator {
  /** Navigate to a route; resolves with the outcome the router reports. */
  navigate(url: string, signal: AbortSignal): Promise<DevNavigationResult>
  /** Current route snapshot; undefined when the router has no location yet. */
  location(): { route: string | null; modal: boolean } | undefined
  /** Subscribe to route changes; returns an unsubscribe. */
  subscribe(listener: () => void): () => void
}

/**
 * Install (or clear) the router navigator used by route-declared dev actions.
 * Returns a restore function that uninstalls this navigator. Realm-singleton:
 * the announcement picks up `location` immediately; re-announces on every
 * route change without bumping the registry revision. @internal
 */
export function setDevActionNavigator(navigator: DevActionNavigator | undefined): () => void {
  const state = registry()
  const previous = state.navigator

  previous?.unsubscribe?.()

  let unsubscribe: (() => void) | undefined

  if (navigator) {
    try {
      unsubscribe = navigator.subscribe(() => scheduleAnnounce(state))
    } catch {
      unsubscribe = undefined
    }
  }

  state.navigator = navigator ? { impl: navigator, unsubscribe } : undefined
  scheduleAnnounce(state)

  let restored = false

  return () => {
    if (restored) {
      return
    }

    restored = true
    if (state.navigator?.impl === navigator) {
      unsubscribe?.()
      state.navigator = previous
      scheduleAnnounce(state)
    }
  }
}

interface DevActionOutcome {
  requestId: string
  status: 'succeeded' | 'failed' | 'cancelled' | 'unknown'
  result?: Record<string, unknown>
  error?: { code: string; message: string; failures?: DevActionFailure[] }
  partialEffects?: string[]
  handlers?: DevActionHandlerOutcome[]
  readiness?: ReadinessSnapshot[]
  completedAt: string
}

interface InvocationRequest {
  requestId: string
  appInstanceId: string
  actionId: string
  registryRevision?: number
  input: Record<string, unknown>
}

/** Bridge the dev host uses to reach actions. */
export interface DevActionBridge {
  /** Per-app-instance identifier announced to the dev server. */
  readonly instanceId: string
  /** Bridge lifecycle: connecting → live → degraded/stopped; 'unavailable' when the host has no endpoint. */
  readonly state: 'connecting' | 'live' | 'degraded' | 'stopped' | 'unavailable'
  /** Most recent transport/polling error, when in 'degraded' state. */
  readonly lastError?: string
  /** Stop announcing and polling; idempotent. */
  stop(): void
}

/** Options for creating the dev-action bridge. */
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

  const state = g[GLOBAL_KEY] as RegistryState

  // Realm singletons survive hot reload; a bridge started before this field
  // existed still gets a channel table.
  state.channels ??= new Map()
  return state
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
    const attached = state.handlers.get(spec.id) ?? []
    const selected = entry.kind === 'effect' ? attached : attached.slice(-1)
    const scopes = new Set(
      selected.flatMap((handler) => (handler.readiness ? [handler.readiness] : [])),
    )

    const routed = entry.kind === 'action' && spec.route !== undefined

    return {
      id: spec.id,
      title: spec.title,
      description: spec.description,
      input: spec.input,
      result: spec.result,
      effects: routed ? { ...spec.effects, navigation: true } : spec.effects,
      availability: {
        ...(spec.availability?.platforms ? { platforms: spec.availability.platforms } : {}),
        ...(spec.availability?.readyWhen ? { readyWhen: spec.availability.readyWhen } : {}),
        ...(routed
          ? {
              route: typeof spec.route === 'string' ? { url: spec.route } : { fromInput: true },
            }
          : {}),
        ready: live.ready,
        ...(live.reason ? { reason: live.reason } : {}),
      },
      readiness: [...scopes].map((scope) => scope.snapshot()),
      execution: spec.execution,
    }
  })

const snapshot = (state: RegistryState, appLabel?: string) => {
  const inspector = appDebugInspector()
  let location: { route: string | null; modal: boolean } | undefined

  try {
    location = state.navigator?.impl.location()
  } catch {
    location = undefined
  }

  return {
    protocol: 'xplat-dev-actions',
    version: 1,
    appInstanceId: state.instanceId,
    ...(appLabel ? { appLabel } : {}),
    platform: devBridgePlatform(),
    ...(inspector
      ? {
          inspection: {
            version: 1,
            documentId: inspector.documentId,
            mechanisms: typeof inspector.interact === 'function' ? ['handler-dispatch'] : [],
          },
        }
      : {}),
    revision: state.revision,
    announcedAt: new Date().toISOString(),
    ...(location !== undefined ? { location } : {}),
    actions: declarations(state),
    ...(state.channels?.size
      ? {
          channels: [...state.channels.values()].map((entry) => ({
            id: entry.id,
            version: entry.version,
          })),
        }
      : {}),
  }
}

const EFFECT_RESULT: DevActionFields = {
  fields: { handlerCount: { type: 'integer', minimum: 0 } },
}

function defineDeclaration(
  declaration: DevActionDeclaration,
  kind: 'action' | 'effect',
): DevActionDefinition | DevEffectDefinition {
  const problems = validateActionDeclaration(declaration)

  if (kind === 'effect' && (declaration as DevActionDeclaration).route !== undefined) {
    problems.push('route is only supported for dev actions')
  }

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
  options?: DevActionHandlerOptions,
): () => void {
  if (typeof run !== 'function') {
    throw new Error(
      `Invalid dev ${kind} handler for "${id}": a run(input, context) function is required`,
    )
  }

  const state = registry()
  const entry = state.actions.get(id)

  if (entry && entry.kind !== kind) {
    throw new Error(`"${id}" is declared as a dev ${entry.kind}; cannot attach a ${kind} handler`)
  }

  const handler: HandlerEntry = {
    run,
    readiness: options?.readiness,
    ...(options?.label !== undefined ? { label: options.label } : {}),
  }

  const list = state.handlers.get(id)

  if (list) {
    list.push(handler)
  } else {
    state.handlers.set(id, [handler])
  }

  const stopReadiness = handler.readiness?.subscribe(() => scheduleAnnounce(state))

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
    stopReadiness?.()

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
  options?: DevActionHandlerOptions,
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
  options?: DevActionHandlerOptions,
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
export function retainDevAction(declaration: DevActionDeclaration, key: string): () => void {
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
export function listDevActions(): DevActionInfo {
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

  ensureDevActionsChannel(state)

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
    endpoint: { ...discovered, origin, token },
    state: 'connecting',
    polling: true,
    announcing: true,
    controller: new AbortController(),
  }

  state.bridge = rt
  state.appLabel = options.appLabel

  if (rt.endpoint.socket) {
    connectAppSocket(rt)
  } else {
    void announceOnce(rt)
  }

  rt.timer = setInterval(() => void announceOnce(rt), options.intervalMs ?? ANNOUNCE_INTERVAL_MS)
  if (!rt.endpoint.socket) {
    void pollLoop(rt)
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

function stopBridge(rt: BridgeRuntime) {
  rt.polling = false
  rt.announcing = false
  rt.state = 'stopped'
  rt.controller.abort()
  if (rt.reconnect) {
    clearTimeout(rt.reconnect)
  }

  rt.socket?.close()
  if (rt.timer) {
    clearInterval(rt.timer)
  }

  const state = registry()

  if (state.bridge === rt) {
    state.bridge = undefined
  }

  notifyChannels(state)
}

/** Channel lifecycle reported to a registered dev channel. */
export type DevChannelState = 'unavailable' | 'connecting' | 'live' | 'closed'

/** Routing failure codes the hub returns on a `channel-error` frame. */
export type ChannelErrorCode =
  | 'oversize'
  | 'undeclared_channel'
  | 'no_backend'
  | 'no_session'
  | 'invalid_target'

/** Handlers a dev channel registration supplies. */
export interface DevChannelHandlers {
  /** A routed channel frame; `panel` identifies the devtools panel sender. */
  message(frame: { from: 'backend' | 'panel'; panel?: string; data: unknown }): void
  /** Lifecycle transitions of this channel's hub transport. */
  state(state: DevChannelState): void
  /**
   * A routing failure the hub bounced back to this channel's sender
   * (`channel-error` frames carrying this channel's id). Errors for channels
   * the app never declared are ignored.
   */
  error?(failure: { code: ChannelErrorCode; detail: string }): void
}

/**
 * A registered devtools channel. `send` returns false unless the app socket is
 * live and the hub advertised the channels capability; `dispose` removes the
 * channel from the registry announcement. @internal
 */
export interface DevChannelRegistration {
  send(to: 'backend' | 'panels', data: unknown): boolean
  dispose(): void
}

function devChannelSend(
  entry: ChannelEntry,
  state: RegistryState,
  to: 'backend' | 'panels',
  data: unknown,
): boolean {
  const rt = state.bridge

  if (entry.closed || !rt?.endpoint.socket || rt.socket?.readyState !== 1 || !rt.channelCapable) {
    return false
  }

  try {
    rt.socket.send(JSON.stringify({ type: 'channel', channel: entry.id, to, data }))
    return true
  } catch {
    return false
  }
}

function devChannelState(entry: ChannelEntry, state: RegistryState): DevChannelState {
  if (entry.closed) {
    return 'closed'
  }

  const rt = state.bridge

  if (!rt || !rt.endpoint.socket) {
    return 'unavailable'
  }

  return rt.socket?.readyState === 1 && rt.state === 'live' && rt.channelCapable
    ? 'live'
    : 'connecting'
}

function notifyChannel(entry: ChannelEntry, state: RegistryState) {
  const next = devChannelState(entry, state)

  if (next !== entry.state) {
    entry.state = next
    entry.handlers.state(next)
  }
}

function notifyChannels(state: RegistryState) {
  for (const entry of state.channels?.values() ?? []) {
    notifyChannel(entry, state)
  }
}

/**
 * Register a devtools channel on the app debug socket. The channel id joins
 * the registry announcement (revision bump + re-announce); duplicate ids
 * throw. On the HTTP-polling fallback bridge the channel reports
 * 'unavailable' — channels only exist on the Go dev hub. Starts the bridge
 * like action registration does. @internal
 */
export function registerDevChannel(
  id: string,
  version: number,
  handlers: DevChannelHandlers,
): DevChannelRegistration {
  if (
    typeof id !== 'string' ||
    !/^[a-z][a-z0-9-]{0,31}$/.test(id) ||
    !Number.isInteger(version) ||
    version < 1 ||
    version > 2147483647
  ) {
    throw new Error(
      `Invalid dev channel "${id}": id must match /^[a-z][a-z0-9-]{0,31}$/ and version must be an int32`,
    )
  }

  if (typeof handlers?.message !== 'function' || typeof handlers?.state !== 'function') {
    throw new Error(`Invalid dev channel "${id}": message and state handlers are required`)
  }

  const state = registry()

  if (state.channels?.has(id)) {
    throw new Error(`Dev channel "${id}" is already registered`)
  }

  const entry: ChannelEntry = { id, version, handlers, closed: false }

  state.channels?.set(id, entry)
  state.revision += 1
  startDevActionBridge()
  scheduleAnnounce(state)
  notifyChannel(entry, state)

  return {
    send(to: 'backend' | 'panels', data: unknown): boolean {
      return devChannelSend(entry, state, to, data)
    },
    dispose() {
      if (entry.closed) {
        return
      }

      entry.closed = true
      if (state.channels?.get(id) === entry) {
        state.channels.delete(id)
        state.revision += 1
        scheduleAnnounce(state)
      }

      notifyChannel(entry, state)
    },
  }
}

/**
 * Reserved channel carrying devtools-panel action invocations into the app.
 * Panels send `{ type: 'invoke' | 'cancel' }` data; outcomes come back as
 * `{ type: 'outcome', outcome }` broadcast to all panels. @internal
 */
export const DEV_ACTIONS_CHANNEL_ID = 'xplat-actions'

// Devtools invocation traffic rides the app socket's channel transport, so
// dispatch needs a runtime whose outcome path writes frames onto this
// channel instead of the socket's `outcome` type.
function devActionsChannelRuntime(entry: ChannelEntry, state: RegistryState): BridgeRuntime {
  const socket: AppDebugSocket = {
    readyState: 1,
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    send: (text) => {
      try {
        devChannelSend(entry, state, 'panels', JSON.parse(text))
      } catch {
        // A malformed frame can never come from postOutcome; drop it quietly.
      }
    },
    close: () => {},
  }

  return {
    endpoint: { origin: '', token: '', socket: `channel:${entry.id}` },
    socket,
    state: 'live',
    polling: false,
    announcing: false,
    controller: new AbortController(),
  }
}

function dispatchDevActionsChannel(entry: ChannelEntry, state: RegistryState, data: unknown) {
  if (typeof data !== 'object' || data === null) {
    return
  }

  const request = data as Record<string, unknown>

  if (request.type === 'cancel' && Array.isArray(request.requestIds)) {
    for (const requestId of request.requestIds.slice(0, 64)) {
      if (typeof requestId === 'string' && requestId.length > 0 && requestId.length <= 128) {
        requestCancel(requestId)
      }
    }

    return
  }

  if (
    request.type !== 'invoke' ||
    typeof request.requestId !== 'string' ||
    request.requestId.length === 0 ||
    request.requestId.length > 128
  ) {
    return
  }

  const invocation: InvocationRequest = {
    requestId: request.requestId,
    appInstanceId: state.instanceId,
    actionId: typeof request.actionId === 'string' ? request.actionId : '',
    input:
      typeof request.input === 'object' && request.input !== null && !Array.isArray(request.input)
        ? (request.input as Record<string, unknown>)
        : {},
    ...(typeof request.registryRevision === 'number' && Number.isInteger(request.registryRevision)
      ? { registryRevision: request.registryRevision }
      : {}),
  }

  void dispatchInvocation(devActionsChannelRuntime(entry, state), invocation)
}

// Declared once per registry so devtools panels can always find the action
// surface; registering 'xplat-actions' as a user channel is a conflict. The
// reserved channel joins the announcement without a revision bump — revision
// guards the action surface, which a built-in transport channel never alters.
function ensureDevActionsChannel(state: RegistryState) {
  if (state.channels?.has(DEV_ACTIONS_CHANNEL_ID)) {
    return
  }

  const entry: ChannelEntry = {
    id: DEV_ACTIONS_CHANNEL_ID,
    version: 1,
    handlers: {
      message(frame) {
        dispatchDevActionsChannel(entry, state, frame.data)
      },
      state() {},
    },
    closed: false,
  }

  state.channels?.set(entry.id, entry)
  scheduleAnnounce(state)
  notifyChannel(entry, state)
}

// Coalesce bursts (hot-reload re-registration) into one announcement.
function scheduleAnnounce(state: RegistryState) {
  if (!state.bridge?.announcing || state.announceScheduled) {
    return
  }

  const bridge = state.bridge

  state.announceScheduled = true
  queueMicrotask(() => {
    state.announceScheduled = false
    if (state.bridge === bridge && bridge.announcing) {
      void announceOnce(bridge)
    }
  })
}

async function announceOnce(rt: BridgeRuntime) {
  if (rt.endpoint.socket) {
    if (rt.announcing && rt.socket?.readyState === 1 && rt.state === 'live') {
      try {
        rt.socket.send(
          JSON.stringify({ type: 'registry', registry: snapshot(registry(), registry().appLabel) }),
        )
      } catch {
        rt.socket.close()
      }
    }

    return
  }

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

    if (!rt.announcing) {
      return
    }

    rt.state = res.ok ? 'live' : 'degraded'
    rt.lastError = res.ok ? undefined : `announce failed: HTTP ${res.status}`
  } catch (error) {
    if (!rt.announcing) {
      return
    }

    rt.state = 'degraded'
    rt.lastError = `announce failed: ${(error as Error)?.message ?? error}`
  }
}

function connectAppSocket(rt: BridgeRuntime) {
  if (!rt.polling || !rt.endpoint.socket) {
    return
  }

  let socket: AppDebugSocket

  try {
    const connection = devBridgeSocket(rt.endpoint.socket)

    if (!connection) {
      rt.state = 'degraded'
      rt.lastError = 'No WebSocket implementation in this runtime'
      return
    }

    socket = connection
  } catch {
    rt.state = 'degraded'
    rt.lastError = 'App debug socket could not connect'
    rt.reconnect = setTimeout(() => connectAppSocket(rt), 1000)
    return
  }

  rt.socket = socket
  rt.channelCapable = false
  socket.onopen = () => {
    if (!rt.polling || rt.socket !== socket) {
      socket.close()
      return
    }

    try {
      socket.send(
        JSON.stringify({
          protocol: 'octane-app-debug',
          version: 1,
          instanceId: rt.endpoint.instanceId,
          targetId: rt.endpoint.targetId,
          token: rt.endpoint.token,
          registry: snapshot(registry(), registry().appLabel),
        }),
      )
    } catch {
      rt.state = 'degraded'
      rt.lastError = 'App registration could not be sent'
      socket.close()
    }
  }

  socket.onmessage = (event) => {
    if (rt.socket !== socket || !rt.polling) {
      return
    }

    try {
      if (typeof event.data !== 'string' || event.data.length > 1 << 20) {
        throw Error('invalid app frame')
      }

      const frame = JSON.parse(event.data)

      if (
        frame.type === 'registered' &&
        frame.protocol === 'octane-app-debug' &&
        frame.version === 1 &&
        frame.instanceId === rt.endpoint.instanceId
      ) {
        rt.state = 'live'
        rt.lastError = undefined
        rt.channelCapable =
          Array.isArray(frame.capabilities) && frame.capabilities.includes('channels')

        notifyChannels(registry())
      } else if (frame.type === 'channel' && rt.state === 'live') {
        // Channels the app never declared are routed nowhere; unknown ids are ignored.
        const entry =
          typeof frame.channel === 'string' ? registry().channels?.get(frame.channel) : undefined

        if (entry && !entry.closed && (frame.from === 'backend' || frame.from === 'panel')) {
          entry.handlers.message({
            from: frame.from,
            ...(typeof frame.panel === 'string' ? { panel: frame.panel } : {}),
            data: frame.data,
          })
        }
      } else if (frame.type === 'channel-error') {
        // Routing failures go to the channel that sent the frame; errors
        // naming channels the app never declared are ignored.
        const entry =
          typeof frame.channel === 'string' ? registry().channels?.get(frame.channel) : undefined

        if (entry && !entry.closed && typeof frame.code === 'string' && entry.handlers.error) {
          entry.handlers.error({
            code: frame.code as ChannelErrorCode,
            detail: typeof frame.detail === 'string' ? frame.detail : '',
          })
        }
      } else if ((frame.type === 'inspect' || frame.type === 'interact') && rt.state === 'live') {
        if (
          typeof frame.requestId !== 'string' ||
          !frame.requestId ||
          frame.requestId.length > 128
        ) {
          throw Error('invalid inspection request')
        }

        const inspector = appDebugInspector()
        let result: unknown

        try {
          result = (frame.type === 'inspect'
            ? inspector?.inspect(frame.args)
            : inspector?.interact?.(frame.args)) ?? {
            error: { code: 'unsupported_capability', message: 'No app inspector in this runtime.' },
          }
        } catch {
          result = {
            error: { code: 'execution_failure', message: 'The fixed app operation failed.' },
            outcome: frame.type === 'interact' ? 'unknown' : undefined,
          }
        }

        const response = JSON.stringify({ type: 'inspection', requestId: frame.requestId, result })

        if (response.length > 64 * 1024) {
          socket.send(
            JSON.stringify({
              type: 'inspection',
              requestId: frame.requestId,
              result: {
                error: {
                  code: 'unavailable',
                  message:
                    'App operation result exceeds its bound; effects may already have occurred.',
                },
              },
            }),
          )
        } else {
          socket.send(response)
        }
      } else if (frame.type === 'work' && rt.state === 'live') {
        for (const request of frame.invocations ?? []) {
          void dispatchInvocation(rt, request)
        }

        for (const requestId of frame.cancel ?? []) {
          requestCancel(requestId)
        }
      } else {
        throw Error('invalid app frame')
      }
    } catch {
      rt.state = 'degraded'
      rt.lastError = 'Invalid app debug response'
      socket.close()
    }
  }

  socket.onerror = () => {
    if (rt.socket === socket) {
      rt.state = 'degraded'
      rt.lastError = 'App debug socket disconnected'
      notifyChannels(registry())
    }
  }

  socket.onclose = () => {
    if (rt.socket !== socket) {
      return
    }

    rt.socket = undefined
    rt.channelCapable = false
    if (rt.polling) {
      rt.state = 'degraded'
      rt.lastError = 'App debug socket disconnected'
      rt.reconnect = setTimeout(() => connectAppSocket(rt), 1000)
    }

    notifyChannels(registry())
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

      if (!rt.polling) {
        return
      }

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

      if (!rt.polling) {
        return
      }

      for (const request of work.invocations ?? []) {
        void dispatchInvocation(rt, request)
      }

      for (const requestId of work.cancel ?? []) {
        requestCancel(requestId)
      }
    } catch (error) {
      if (!rt.polling) {
        return
      }

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
  if (rt.endpoint.socket) {
    if (rt.socket?.readyState === 1 && rt.state === 'live') {
      try {
        rt.socket.send(JSON.stringify({ type: 'outcome', outcome }))
      } catch {
        rt.socket.close()
      }
    }

    return
  }

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

const capText = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text)

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

  // Validated early: a function route derives its URL from this input.
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

  const handlers = [...(state.handlers.get(spec.id) ?? [])]

  if (entry.kind === 'action' && handlers.length === 0) {
    // A route-declared action defers to the serialized work chain, which
    // navigates to its screen and waits for a handler to attach. Without a
    // declared route or an installed navigator, it stays unavailable.
    if (spec.route === undefined) {
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

    if (!state.navigator) {
      await postOutcome(
        rt,
        failOutcome(
          request.requestId,
          'unavailable',
          `action "${spec.id}" is unavailable: ${NO_HANDLER_REASON}; route "${
            typeof spec.route === 'string' ? spec.route : 'input-derived'
          }" is declared but no router navigator is installed`,
        ),
      )

      return
    }
  } else {
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
    const participants: DevActionHandlerOutcome[] = []
    const readiness: ReadinessSnapshot[] = []
    const scopes = new Set<ReadinessController>()
    const deadline = Date.now() + (spec.execution?.timeoutMs ?? 30_000)

    try {
      let handlers = [...(state.handlers.get(spec.id) ?? [])]

      if (entry.kind === 'action' && handlers.length === 0 && spec.route !== undefined) {
        // Screen not mounted: navigate to the declared route, then wait for
        // its handler to attach and report ready. The navigator was checked
        // before dispatch; it could have been uninstalled since.
        const navigator = state.navigator?.impl

        if (!navigator) {
          await postOutcome(
            rt,
            failOutcome(
              request.requestId,
              'unavailable',
              `action "${spec.id}" is unavailable: ${NO_HANDLER_REASON}; route "${
                typeof spec.route === 'string' ? spec.route : 'input-derived'
              }" is declared but no router navigator is installed`,
            ),
          )

          return
        }

        // Route-declared actions spend at most half of the caller's
        // deadline navigating and waiting, so the handler and the outcome
        // post still fit inside the caller's bound. Measured from the
        // start of navigation, not from its commit.
        const waitDeadline =
          spec.execution?.timeoutMs !== undefined
            ? Date.now() + Math.min(10_000, Math.floor(spec.execution.timeoutMs / 2))
            : Date.now() + 10_000

        // A throwing route function is an ordinary execution failure.
        const url = typeof spec.route === 'function' ? spec.route(input.value) : spec.route
        const navigation = await navigator.navigate(url, running.controller.signal)

        if (running.controller.signal.aborted) {
          throw new Error('cancelled')
        }

        if (!navigation.ok) {
          await postOutcome(rt, {
            requestId: request.requestId,
            status: 'failed',
            error: {
              code: navigation.code,
              message: `navigation to "${url}" did not commit (status "${navigation.status}"): ${navigation.message}`,
            },
            completedAt: new Date().toISOString(),
          })

          return
        }

        partialEffects.push(`navigated to ${url}`)

        // Mounting the target screen attaches the handler — possibly under a
        // new registry revision; the in-flight call is not re-checked.
        let pendingReason = NO_HANDLER_REASON

        for (;;) {
          handlers = [...(state.handlers.get(spec.id) ?? [])]

          const availability = handlers.length
            ? evaluateAvailability(spec)
            : { ready: false, reason: NO_HANDLER_REASON }

          if (handlers.length && availability.ready) {
            break
          }

          pendingReason = availability.reason ?? 'reported unavailable'
          if (running.controller.signal.aborted || state.cancelRequested.has(request.requestId)) {
            await postOutcome(rt, {
              requestId: request.requestId,
              status: 'cancelled',
              partialEffects,
              completedAt: new Date().toISOString(),
            })

            return
          }

          if (Date.now() >= waitDeadline) {
            await postOutcome(rt, {
              requestId: request.requestId,
              status: 'failed',
              error: {
                code: 'unavailable',
                message: `navigated to ${url} but action "${spec.id}" is still unavailable: ${pendingReason}`,
              },
              partialEffects,
              completedAt: new Date().toISOString(),
            })

            return
          }

          await sleep(50)
        }
      }

      let result: Record<string, unknown> | undefined

      const cohort = entry.kind === 'effect' ? handlers : handlers.slice(-1)

      for (const handler of cohort) {
        if (handler.readiness) {
          scopes.add(handler.readiness)
        }

        participants.push({
          handler: handlers.indexOf(handler),
          label: handler.label,
          status: 'not-run',
        })
      }

      if (entry.kind === 'effect') {
        // Broadcast: every handler attached at dispatch start runs, in
        // attach order, and failures don't stop the remaining handlers.
        const failureRecords: DevActionFailure[] = []
        const failureMessages: string[] = []

        for (const [index, handler] of handlers.entries()) {
          if (running.controller.signal.aborted) {
            throw new Error('cancelled')
          }

          running.active.add(handler)
          try {
            await handler.run(input.value, context)
            participants[index]!.status = running.controller.signal.aborted
              ? 'cancelled'
              : 'succeeded'
          } catch (error) {
            participants[index]!.status = running.controller.signal.aborted ? 'cancelled' : 'failed'
            if (running.controller.signal.aborted) {
              throw error
            }

            const record = toFailureRecord(index, handler.label, error)

            if (failureRecords.length < FAILURE_RECORDS_MAX) {
              failureRecords.push(record)
            }

            failureMessages.push(record.message)
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
          result = (await handler.run(input.value, context)) as Record<string, unknown> | undefined
          participants[0]!.status = running.controller.signal.aborted ? 'cancelled' : 'succeeded'
        } catch (thrown) {
          participants[0]!.status = running.controller.signal.aborted ? 'cancelled' : 'failed'
          invocationFailures = [toFailureRecord(handlerIndex, handler.label, thrown)]
          throw thrown
        }
      }

      if (running.controller.signal.aborted) {
        throw new Error('cancelled')
      }

      const waitController = new AbortController()
      const abortWait = () => waitController.abort()

      context.signal.addEventListener('abort', abortWait, { once: true })
      if (context.signal.aborted) {
        abortWait()
      }

      try {
        const settled = await Promise.all(
          [...scopes].map((scope) =>
            scope.wait({
              signal: waitController.signal,
              includeBackground: true,
              timeoutMs: Math.min(10_000, Math.max(1, Math.floor((deadline - Date.now()) / 2))),
            }),
          ),
        )

        readiness.push(...settled)
      } catch (error) {
        readiness.splice(0, readiness.length, ...[...scopes].map((scope) => scope.snapshot()))
        partialEffects.push('handlers completed; registered work did not settle')
        throw error
      } finally {
        waitController.abort()
        context.signal.removeEventListener('abort', abortWait)
      }

      if (running.controller.signal.aborted) {
        throw new Error('cancelled')
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

      await postOutcome(rt, { ...outcome, handlers: participants, readiness })
    } catch (error) {
      if (!readiness.length) {
        readiness.push(...[...scopes].map((scope) => scope.snapshot()))
      }

      await postOutcome(
        rt,
        running.controller.signal.aborted
          ? {
              requestId: request.requestId,
              status: 'cancelled',
              handlers: participants,
              readiness,
              ...(partialEffects.length ? { partialEffects } : {}),
              completedAt: new Date().toISOString(),
            }
          : {
              requestId: request.requestId,
              status: 'failed',
              handlers: participants,
              readiness,
              error: {
                code:
                  error instanceof DevNavigationError || error instanceof ReadinessError
                    ? error.code
                    : 'execution_failure',
                message: (error as Error)?.message ?? String(error),
                ...(invocationFailures?.length ? { failures: invocationFailures } : {}),
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
