import { matchPreparedTree, projectVisualTree } from './project.ts'
import { requireArtifact, validateNodes } from './schema.ts'

export type NativeClaimPhase = 'unmatched' | 'ready' | 'applying' | 'live' | 'rejected' | 'failed' | 'retired'
export type NativeClaims<View extends object> = {
  readonly phase: NativeClaimPhase
  readonly factoryCalls: number
  readonly claimedCount: number
  readonly pendingCount: number
  match(commands: unknown): void
  createView(id: number, kind: string): View | undefined
  commit(apply: () => undefined): void
  retire(): void
}

/** Initial claim coordination only; the host owns native binding and failed-scope cleanup. */
export function createNativeClaims<View extends object>(input: unknown, views: readonly View[]): NativeClaims<View> {
  const nodes = validateNodes(input)
  const visual = projectVisualTree(nodes)
  let available = [...views]
  requireArtifact(
    available.length === visual.length && new Set(available).size === available.length &&
      available.every((view) => view !== null && (typeof view === 'object' || typeof view === 'function')),
    'native claims require one distinct wrapper per visual record',
  )
  let phase: NativeClaimPhase = 'unmatched'
  let factoryCalls = 0, claimedCount = 0
  const pending = new Map<number, number>()
  const initialIds = new Set<number>()
  return {
    get phase() { return phase },
    get factoryCalls() { return factoryCalls },
    get claimedCount() { return claimedCount },
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
      if (phase === 'live' || phase === 'retired') return undefined
      requireArtifact(phase === 'applying', 'native claims requested outside commit')
      const index = pending.get(id)
      if (index === undefined) {
        // Layout callbacks can enqueue ordinary creation after the initial
        // host batch has consumed its claims. Never replay a consumed ID.
        requireArtifact(pending.size === 0 && !initialIds.has(id), 'unexpected or repeated native claim')
        return undefined
      }
      requireArtifact(visual[index].kind === kind, 'native claim kind differs')
      pending.delete(id)
      claimedCount++
      return available[index]
    },
    commit(apply) {
      requireArtifact(phase === 'ready', 'native claims are not ready to commit')
      phase = 'applying'
      try {
        const result = apply()
        requireArtifact(result === undefined, 'native claims require a synchronous commit')
        requireArtifact(pending.size === 0 && claimedCount === visual.length, 'native claims were not fully consumed')
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
