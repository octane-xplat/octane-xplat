/** @jsxImportSource @octane-xplat/jsx */
// Sticky-columns plugin — universal fallback. AppKit data Table now has a
// horizontal viewport, but native pinning is still unimplemented. Keep the
// shared config as a pass-through; offset math lives in ./sticky-column-offsets.

import type { TablePlugin, UseTableStickyColumnsConfig } from './types'

/** Native fallback: scrolling is separate from unimplemented column pinning. */
export function useTableStickyColumns<T extends Record<string, unknown>>(
	config: UseTableStickyColumnsConfig,
): TablePlugin<T> {
	void config
	return {}
}

export type { UseTableStickyColumnsConfig }
