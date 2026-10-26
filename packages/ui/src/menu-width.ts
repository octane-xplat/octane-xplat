// Port of Astryx `DropdownMenu/menuWidth.ts` (pinned 0.6.4) — decides whether
// a public `menuWidth` belongs on min-width or inline-size.

const INTRINSIC_AND_CSS_WIDE_WIDTHS = new Set([
	'auto',
	'contain',
	'fit-content',
	'inherit',
	'initial',
	'max-content',
	'min-content',
	'revert',
	'revert-layer',
	'stretch',
	'unset',
])

export type ResolvedMenuWidth =
	| { property: 'inlineSize'; value: string }
	| { property: 'minWidth'; value: string }

/** CSS intrinsic and CSS-wide keywords cannot be arguments to `min()`. Apply
 *  those values as the preferred inline size so max-inline-size can still cap
 *  the menu. Lengths retain the minimum-width growth contract. */
export function resolveMenuWidth(menuWidth: number | string, maximum: string): ResolvedMenuWidth {
	if (typeof menuWidth === 'number') {
		return { property: 'minWidth', value: `min(${menuWidth}px, ${maximum})` }
	}

	const width = menuWidth.trim()
	const normalizedWidth = width.toLowerCase()
	if (INTRINSIC_AND_CSS_WIDE_WIDTHS.has(normalizedWidth) || normalizedWidth.startsWith('fit-content(')) {
		return { property: 'inlineSize', value: width }
	}

	return { property: 'minWidth', value: `min(${width}, ${maximum})` }
}
