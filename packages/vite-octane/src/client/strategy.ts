import type {
  FrameworkClientBatchContext,
  FrameworkClientStrategy,
} from '@nativescript/vite/hmr/client/framework.js'
import {
  ENV_VERBOSE as VERBOSE,
  buildEvictionUrls,
  getGlobalScope,
  getNsHotRegistry,
  graph,
  invalidateModulesByUrls,
  normalizeSpec,
  readNsRuntimeDevHostApi,
  requestModuleFromServer,
  setUpdateStage as setUpdateOverlayStage,
} from '@nativescript/vite/hmr/client/framework.js'
import { propagateToAcceptingBoundaries } from './boundary-propagation.js'

/**
 * Octane client strategy — the device half of Vite's accept contract.
 *
 * Octane's compiler makes every component module self-accepting: the exported
 * component is wrapped by `hmrUniversalComponent`, and the module's
 * `import.meta.hot.accept` callback hands the fresh export to the wrapper,
 * which swaps the render function and schedules the live owners. Applying an
 * update therefore never touches the view tree from here — no root reset, no
 * navigation. The strategy only sequences the registry: drain the outgoing
 * instance's dispose callbacks before eviction, re-import, fire accept with
 * the fresh namespace. Non-accepting edits propagate up the reverse import
 * graph to the nearest accepting importers; an edit nothing accepts (the app
 * entry, the driver the entry mounts) reloads the module graph in process.
 *
 * Which accept callback fires is the one subtlety. The wrapper that owns the
 * live owners is the one the importer holds — the module's FIRST evaluation;
 * every later evaluation only exists to be handed to it. Its callback closes
 * over that live wrapper, so it is the callback that must keep firing, edit
 * after edit. The registry naturally holds only the newest evaluation's
 * callbacks, so the strategy anchors on the first non-empty capture per
 * module and keeps it while the module stays self-accepting. A graph reload
 * re-evaluates everything, so anchors reset with it.
 */

type HotCallback = (...args: unknown[]) => unknown

/** Accept callbacks of the live (first) evaluation, per canonical hot key. */
const anchors = new Map<string, HotCallback[]>()
/** Drained ids whose module accepts nothing itself, with the fresh namespace. */
const orphaned = new Map<string, unknown>()
/**
 * Keys whose last re-import threw before the body could register anything.
 * The registry then shows no accept callback, but the live wrapper — and the
 * anchored callback that reaches it — are untouched, so the next save is a
 * retry in place, not a change of acceptance.
 */
const failedReimport = new Set<string>()
/** Keys evicted in the current drain that have not re-imported yet. */
const awaitingReimport = new Set<string>()
/** Changed ids the main realm never loaded (worker scripts, type-only modules). */
const unloadedChanged: string[] = []
/** Changed ids no accepting importer can absorb; one graph reload covers them all. */
const deadChanged: string[] = []
/**
 * Every key the main realm has ever held. Membership in the live registry is
 * transient — a module is absent between its eviction and re-import — so the
 * "does this module evaluate here" question is answered by history, not by a
 * snapshot taken mid-cycle.
 */
const everLoaded = new Set<string>()
let anchorResetInstalled = false
let reloadInFlight = false
/** A save landed while a graph reload was running; reload again when it settles. */
let reloadPending = false

function hotKey(id: string): string {
  return getNsHotRegistry().canonicalHotKey(normalizeSpec(id))
}

function isMainRealmModule(key: string): boolean {
  if (everLoaded.has(key)) {
    return true
  }
  const urls = readNsRuntimeDevHostApi(getGlobalScope()).getLoadedModuleUrls
  if (typeof urls !== 'function') {
    return true
  }
  try {
    for (const url of urls()) {
      if (typeof url === 'string' && url.includes('/ns/m/')) {
        everLoaded.add(getNsHotRegistry().canonicalHotKey(url))
      }
    }
  } catch {}
  return everLoaded.has(key)
}

function requestGraphReload(reason: string): void {
  if (reloadInFlight) {
    reloadPending = true
    return
  }
  reloadInFlight = true
  setUpdateOverlayStage('rebooting', { detail: reason })
  getNsHotRegistry().requestFullReload(reason)
}

function installAnchorReset(): void {
  if (anchorResetInstalled) {
    return
  }
  anchorResetInstalled = true
  const hot = getNsHotRegistry().createHotContext('/__ns_octane_strategy__')
  hot.on('vite:beforeFullReload', () => {
    anchors.clear()
    orphaned.clear()
    failedReimport.clear()
    awaitingReimport.clear()
  })
  const settle = (detail: string) => {
    reloadInFlight = false
    setUpdateOverlayStage('complete', { detail })
    if (reloadPending) {
      reloadPending = false
      requestGraphReload('changes arrived during the previous reload')
    }
  }
  hot.on('ns:full-reload-complete', () => settle('Module graph reloaded'))
  hot.on('ns:full-reload-failed', (payload: any) =>
    settle(`Reload failed: ${payload?.message ?? ''}`),
  )
}

function captureBeforeEvict(ids: readonly string[]): void {
  const registry = getNsHotRegistry()
  for (const id of ids) {
    const key = hotKey(id)
    if (!key) {
      continue
    }
    const current = registry.getAcceptCallbacks(key)
    if (current.length === 0 && !failedReimport.has(key)) {
      anchors.delete(key)
    } else if (current.length > 0 && !anchors.has(key)) {
      anchors.set(key, current)
    }
    registry.runDispose([key])
    awaitingReimport.add(key)
  }
}

function fireAccept(key: string, namespace: unknown): boolean {
  const callbacks = anchors.get(key)
  if (!callbacks || callbacks.length === 0) {
    return false
  }
  for (const cb of callbacks) {
    try {
      cb(namespace)
    } catch (err) {
      console.warn(`[hmr][octane] accept callback threw for ${key}:`, (err as any)?.message ?? err)
    }
  }
  return true
}

/** Fire the dependency-form acceptors of `key` (Vite passes `[freshModule]`). */
function fireDepAcceptors(key: string, namespace: unknown): boolean {
  const acceptors = getNsHotRegistry().getDepAcceptors(key)
  if (acceptors.length === 0) {
    return false
  }
  for (const { owner, callback } of acceptors) {
    try {
      callback([namespace])
    } catch (err) {
      console.warn(
        `[hmr][octane] ${owner} accept(${key}) callback threw:`,
        (err as any)?.message ?? err,
      )
    }
  }
  return true
}

async function reimport(key: string): Promise<unknown> {
  const url = await requestModuleFromServer(key)
  return import(/* @vite-ignore */ url)
}

function acceptPredicates() {
  const registry = getNsHotRegistry()
  return {
    acceptsSelf: (key: string) =>
      registry.getAcceptCallbacks(key).length > 0 || (failedReimport.has(key) && anchors.has(key)),
    acceptsDep: (importer: string, dep: string) => registry.acceptsDep(importer, dep),
  }
}

async function propagateOrphans(ctx: FrameworkClientBatchContext): Promise<void> {
  const changed = Array.from(orphaned.keys())
  if (!changed.length) {
    return
  }

  const plan = propagateToAcceptingBoundaries(changed, ctx.graph ?? graph, acceptPredicates())
  if (VERBOSE) {
    console.log('[hmr][octane] propagation', plan)
  }

  if (plan.dead.length) {
    orphaned.clear()
    requestGraphReload(`no accepting importer for ${plan.dead.join(', ')}`)
    return
  }

  for (const boundary of plan.boundaries) {
    if (boundary.kind === 'dep') {
      fireDepAcceptors(boundary.dep, orphaned.get(boundary.dep))
    }
  }
  orphaned.clear()

  const selfBoundaries = plan.boundaries.filter((b) => b.kind === 'self').map((b) => b.key)
  if (!selfBoundaries.length) {
    return
  }
  captureBeforeEvict(selfBoundaries)
  // The changed modules were already evicted and re-imported by the shared
  // queue; evicting them again only arms one more nonce on an already-fresh
  // key, which is harmless and keeps the set closed.
  invalidateModulesByUrls(buildEvictionUrls(plan.evict))
  for (const boundary of selfBoundaries) {
    try {
      const mod = await reimport(boundary)
      awaitingReimport.delete(boundary)
      failedReimport.delete(boundary)
      if (!fireAccept(boundary, mod)) {
        requestGraphReload(`${boundary} stopped accepting after re-evaluation`)
        return
      }
    } catch (err) {
      awaitingReimport.delete(boundary)
      failedReimport.add(boundary)
      console.warn(
        '[hmr][octane] boundary re-import FAILED for',
        boundary,
        '-',
        (err as any)?.message ?? err,
      )
    }
  }
}

export const octaneClientStrategy: FrameworkClientStrategy = {
  flavor: 'octane',
  drivesQueueOverlayStages: true,

  install() {
    installAnchorReset()
    if (VERBOSE) {
      console.log('[hmr][octane] client strategy installed')
    }
  },

  shouldQueueReimport(id: string) {
    const key = hotKey(id)
    if (!key) {
      return true
    }
    // While a graph reload is evaluating, the registry is in flux and a
    // queued re-import would race it; the reload that follows picks up
    // every module fresh from the server anyway.
    if (reloadInFlight) {
      reloadPending = true
      return false
    }
    if (!isMainRealmModule(key)) {
      unloadedChanged.push(key)
      return false
    }
    // A change nothing can accept is known before any module is fetched —
    // the graph already carries the new edges — so it goes straight to the
    // reload instead of evaluating once in isolation first.
    const plan = propagateToAcceptingBoundaries([key], graph, acceptPredicates())
    if (plan.dead.length) {
      deadChanged.push(key)
      return false
    }
    return true
  },

  applyUnqueuedChanges() {
    const dead = deadChanged.splice(0)
    const unloaded = unloadedChanged.splice(0)
    if (dead.length) {
      unloadedChanged.length = 0
      requestGraphReload(`no accepting importer for ${dead.join(', ')}`)
      return
    }
    if (!unloaded.length) {
      return
    }
    // A module this realm never evaluated has no instance to replace here.
    // A worker script is the common case: the module that spawned the
    // worker accepts it by path and respawns. Anything else (a type-only
    // module, a file nothing imports) is a no-op, as on the web.
    const accepted: string[] = []
    for (const key of unloaded) {
      if (fireDepAcceptors(key, undefined)) {
        accepted.push(key)
      } else if (VERBOSE) {
        console.log('[hmr][octane] not loaded in this realm, ignored', key)
      }
    }
    setUpdateOverlayStage('complete', {
      detail: accepted.length
        ? `Accepted by importer: ${accepted.join(', ')}`
        : 'Nothing to apply in this realm',
    })
  },

  handleGraphResync(changedIds: string[]) {
    // After a dev-server restart every served body differs from the mirror;
    // re-evaluating modules one by one would run the entry outside its
    // dispose/mount choreography. One ordered reload is the same outcome
    // done right.
    requestGraphReload(`dev server resync (${changedIds.length} modules)`)
    return true
  },

  beforeBatchEvict(drained: string[]) {
    captureBeforeEvict(drained)
  },

  afterModuleReimport(id: string, mod: any) {
    const key = hotKey(id)
    if (!key) {
      return
    }
    awaitingReimport.delete(key)
    failedReimport.delete(key)
    if (fireAccept(key, mod)) {
      if (VERBOSE) {
        console.log('[hmr][octane] accepted in place', key)
      }
      return
    }
    orphaned.set(key, mod)
  },

  async refreshAfterBatch(_drained: string[], ctx: FrameworkClientBatchContext) {
    // The shared queue reports a failed re-import and moves on; whatever is
    // still awaited here is a module whose fresh body threw.
    for (const key of awaitingReimport) {
      failedReimport.add(key)
    }
    awaitingReimport.clear()
    try {
      await propagateOrphans(ctx)
    } finally {
      ctx.setUpdateOverlayStage('complete', {
        detail: `Total ${Math.max(0, Date.now() - ctx.startedAt)}ms`,
      })
    }
  },
}

export default octaneClientStrategy
