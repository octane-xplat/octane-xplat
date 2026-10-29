/** @jsxImportSource @octane-xplat/jsx */
// Sticky-columns plugin — universal fallback for native hosts without
// placement support. AppKit selects its dedicated measured-placement leaf.
// Shared membership/offset math lives in ./sticky-column-offsets.

import type { TablePlugin, UseTableStickyColumnsConfig } from './types'

/** Native fallback: scrolling is separate from unimplemented column pinning. */
export function useTableStickyColumns<T extends Record<string, unknown>>(
	config: UseTableStickyColumnsConfig,
): TablePlugin<T> {
	void config
	return {}
}

export type { UseTableStickyColumnsConfig }
