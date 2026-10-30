import { createContext, type Context } from 'octane'

/** Which `Layout` slots are filled — `LayoutContent` reads it for
 *  edge-aware padding (outer padding on edges that touch the layout
 *  boundary, inner padding otherwise). Mirrors Astryx's LayoutSlotsContext. */
export interface LayoutSlots {
	hasHeader: boolean
	hasFooter: boolean
	hasStart: boolean
	hasEnd: boolean
}

export const DEFAULT_LAYOUT_SLOTS: LayoutSlots = {
	hasHeader: false,
	hasFooter: false,
	hasStart: false,
	hasEnd: false,
}

export const LayoutSlotsContext: Context<LayoutSlots> =
	createContext<LayoutSlots>(DEFAULT_LAYOUT_SLOTS)

export const LayoutSlotsProvider: any = LayoutSlotsContext

/** `defaultHasDividers` channel — Layout publishes, LayoutHeader resolves
 *  `hasDivider ?? default ?? false`. Nested Layouts inherit when they don't
 *  set their own (Astryx's LayoutDividerContext). */
export interface LayoutDividerContextValue {
	defaultHasDividers: boolean
}

export const LayoutDividerContext: Context<LayoutDividerContextValue | null> =
	createContext<LayoutDividerContextValue | null>(null)

export const LayoutDividerProvider: any = LayoutDividerContext

/** Resolved region padding in dips — the value channel for the
 *  `--layout-padding-outer-*`/`--layout-padding-inner-*` CSS vars the web
 *  leaf publishes. Native and macOS have no inherited-var cascade, so
 *  Layout provides the resolved steps here and the regions read their edge
 *  defaults from it (outer on layout-boundary edges, inner otherwise).
 *  `padding` on Layout overrides only the outer channel — matching the
 *  upstream contract where `padding` sets `--layout-padding-outer-x/y`. */
export interface LayoutPadding {
	outerX: number
	outerY: number
	innerX: number
	innerY: number
}

export const DEFAULT_LAYOUT_PADDING: LayoutPadding = {
	outerX: 16,
	outerY: 16,
	innerX: 16,
	innerY: 16,
}

export const LayoutPaddingContext: Context<LayoutPadding> =
	createContext<LayoutPadding>(DEFAULT_LAYOUT_PADDING)

export const LayoutPaddingProvider: any = LayoutPaddingContext

/** Which side slot a `LayoutPanel` mounts in — `Layout` wraps `start`/`end`
 *  slot content in this context (Astryx `LayoutAreaContext`). */
export const LayoutAreaContext: Context<'start' | 'end' | null> = createContext<
	'start' | 'end' | null
>(null)

export const LayoutAreaProvider: any = LayoutAreaContext
