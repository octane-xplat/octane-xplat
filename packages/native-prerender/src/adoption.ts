import { matchPreparedTree, projectVisualTree } from './project.ts'
import { requireArtifact, validateNodes } from './schema.ts'

export type NativeClaimPhase = 'unmatched' | 'ready' | 'applying' | 'live' | 'rejected' | 'failed' | 'retired'
export type NativeClaims<View extends object> = {
  readonly phase: NativeClaimPhase
  readonly factoryCalls: number
  readonly claimedCount: number
  readonly replacedCount: number
  readonly pendingCount: number
  match(commands: unknown): void
  createView(id: number, kind: string): View | undefined
  commit(apply: () => undefined): void
  retire(): void
}

/** Initial claim coordination only; the host owns native binding and failed-scope cleanup. */
export function createNativeClaims<View extends object>(input: unknown, views: readonly (View | null)[]): NativeClaims<View> {
  const nodes = validateNodes(input)
  const visual = projectVisualTree(nodes)
  let available = [...views]
  requireArtifact(
    available.length === visual.length &&
      available.every(
        (view, index) =>
          visual[index].kind === 'placeholder'
            ? view === null
            : view !== null && (typeof view === 'object' || typeof view === 'function'),
      ) &&
      new Set(available.filter((view) => view !== null)).size ===
        available.filter((view) => view !== null).length,
    'native claims require one distinct wrapper per non-placeholder visual record',
  )
  let phase: NativeClaimPhase = 'unmatched'
  let factoryCalls = 0, claimedCount = 0, replacedCount = 0
  const pending = new Map<number, number>()
  const initialIds = new Set<number>()
  return {
    get phase() { return phase },
    get factoryCalls() { return factoryCalls },
    get claimedCount() { return claimedCount },
    get replacedCount() { return replacedCount },
    get pendingCount() { return pending.size },
    match(commands) {
      requireArtifact(phase === 'unmatched', 'native claims already matched or retired')
      try {
        const matched = matchPreparedTree(commands, nodes)
        for (const [id, index] of matched.visualByCommandId) {
          pending.set(id, index)
          initialIds.add(id)
        }
        phase = 'ready'
      } catch (error) {
        phase = 'rejected'
        pending.clear()
        initialIds.clear()
        available = []
        throw error
      }
    },
    createView(id, kind) {
      factoryCalls++
      if (phase === 'live' || phase === 'retired') {return undefined}
      requireArtifact(phase === 'applying', 'native claims requested outside commit')
      const index = pending.get(id)
      if (index === undefined) {
        // Layout callbacks can enqueue ordinary creation after the initial
        // host batch has consumed its claims. Never replay a consumed ID.
        requireArtifact(pending.size === 0 && !initialIds.has(id), 'unexpected or repeated native claim')
        return undefined
      }
      requireArtifact(
        visual[index].kind === 'placeholder'
          ? kind === visual[index].hostKind
          : visual[index].kind === kind,
        'native claim kind differs',
      )
      pending.delete(id)
      if (visual[index].kind === 'placeholder') {
        // The live host creates its own native view; the cold box was already removed.
        replacedCount++
        return undefined
      }
      claimedCount++
      // Non-placeholder slots are non-null by construction (validated above).
      return available[index] as View
    },
    commit(apply) {
      requireArtifact(phase === 'ready', 'native claims are not ready to commit')
      phase = 'applying'
      try {
        const result = apply()
        requireArtifact(result === undefined, 'native claims require a synchronous commit')
        requireArtifact(
          pending.size === 0 && claimedCount + replacedCount === visual.length,
          'native claims were not fully consumed',
        )
        phase = 'live'
        available = []
        initialIds.clear()
      } catch (error) {
        // Octane may publish logical state and callbacks after a host apply
        // error. This is a failed scope, never a fresh/retryable preparation.
        phase = 'failed'
        throw error
      }
    },
    retire() {
      requireArtifact(phase !== 'applying', 'cannot retire claims during commit')
      phase = 'retired'
      pending.clear()
      initialIds.clear()
      available = []
    },
  }
}
