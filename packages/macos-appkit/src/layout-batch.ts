import { FailureCollector } from './failures.ts'

/** Per-root layout work shared by host commands and standalone CSS restyles. */
export interface LayoutBatchState<Node> {
  layoutDirty: Set<Node> | null
}

export type BatchOutcome = 'succeeded' | 'failed'

/** Nested work joins the outer owner. Always release ownership before committing,
 * including when a native write throws, so a later update can open a new batch. */
export function withLayoutBatch<Node>(
  state: LayoutBatchState<Node>,
  update: () => void,
  commit: (dirty: Set<Node>, outcome: BatchOutcome) => void,
): void {
  if (state.layoutDirty != null) {
    update()
    return
  }

  const dirty = new Set<Node>()

  state.layoutDirty = dirty

  const failures = new FailureCollector()

  try {
    failures.run('update', update)
  } finally {
    // Release before finalization even when update threw (including undefined).
    state.layoutDirty = null
  }

  failures.run('commit', () => commit(dirty, failures.failed ? 'failed' : 'succeeded'))
  failures.throwIfFailed()
}
