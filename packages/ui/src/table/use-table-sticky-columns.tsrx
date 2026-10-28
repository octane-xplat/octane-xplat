/** @jsxImportSource @octane-xplat/jsx */
// Sticky-columns plugin — universal leaf. Native Table leaves have no
// horizontal scroll container to pin against, so this is a pass-through
// plugin exposing the same config contract (recorded gap; documented in
// .agents/docs). The offset math lives in ./sticky-column-offsets (shared).

import type { TablePlugin, UseTableStickyColumnsConfig } from './types'

/** Sticky-columns plugin — no-op on native leaves (no horizontal scroller). */
export function useTableStickyColumns<T extends Record<string, unknown>>(
	config: UseTableStickyColumnsConfig,
): TablePlugin<T> {
	void config
	return {}
}

export type { UseTableStickyColumnsConfig }
