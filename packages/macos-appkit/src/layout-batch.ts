/** Per-root layout work shared by host commands and standalone CSS restyles. */
export interface LayoutBatchState<Node> {
  layoutDirty: Set<Node> | null
}

/** Nested work joins the outer owner. Always release ownership before committing,
 * including when a native write throws, so a later update can open a new batch. */
export function withLayoutBatch<Node>(
  state: LayoutBatchState<Node>,
  update: () => void,
  commit: (dirty: Set<Node>) => void,
): void {
  if (state.layoutDirty != null) {
    update()
    return
  }

  const dirty = new Set<Node>()
  state.layoutDirty = dirty
  try {
    update()
  } finally {
    state.layoutDirty = null
    commit(dirty)
  }
}
