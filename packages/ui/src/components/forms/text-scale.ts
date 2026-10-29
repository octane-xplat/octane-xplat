/** Astryx type-scale resolution shared by every Text/Heading leaf. Consumes
 *  the resolved token map from `useTheme()` (Astryx defaults under the
 *  theme's overrides, mode arm already picked) and returns both the raw CSS
 *  values web renders and the dip numbers native/macOS need — NativeScript
 *  reads the numeric prefix of `font-size`, so `0.875rem` must arrive as 14. */

import type { HeadingType, TextColor, TextSize, TextType, TextWeight } from '../../props'

export interface TextScaleStyle {
	/** CSS font-size as declared ('0.875rem'). */
	fontSize?: string
	/** Same size in dips for native/macOS leaves. */
	fontSizePx?: number
	/** Unitless CSS line-height multiplier ('1.4286'). */
	lineHeight?: string
	/** Leading resolved against the effective size, in dips. */
	lineHeightPx?: number
	/** Resolved numeric weight string ('600'). */
	fontWeight?: string
	/** `code` type's `--font-family-code` stack. */
	fontFamily?: string
	/** Resolved `--color-text-*` value. */
	color?: string
}

/** rem/em lengths resolve against the 16px root every Astryx theme assumes. */
const ROOT_FONT_PX = 16

function fontSizePxOf(value: string | undefined): number | undefined {
	if (!value) {
		return undefined
	}
	const m = /^([\d.]+)(rem|em|px)?$/.exec(value.trim())
	if (!m) {
		return undefined
	}
	const n = parseFloat(m[1])
	return m[2] === 'rem' || m[2] === 'em' ? n * ROOT_FONT_PX : n
}

/** Leading tokens are unitless multipliers; an absolute `px` leading passes
 *  through. Anything else leaves the box to its natural metrics. */
function lineHeightPxOf(
	leading: string | undefined,
	sizePx: number | undefined,
): number | undefined {
	if (!leading || sizePx == null) {
		return undefined
	}
	const m = /^([\d.]+)(px)?$/.exec(leading.trim())
	if (!m) {
		return undefined
	}
	const n = parseFloat(m[1])
	return m[2] === 'px' ? n : n * sizePx
}

/** Astryx `colorStyles` — `placeholder` shares the secondary token; `inherit`
 *  leaves the inherited color alone. */
const COLOR_TOKEN: Record<TextColor, string | null> = {
	primary: '--color-text-primary',
	secondary: '--color-text-secondary',
	disabled: '--color-text-disabled',
	placeholder: '--color-text-secondary',
	accent: '--color-text-accent',
	inherit: null,
}

/** Upstream `defaultColorByType` — `supporting` is secondary by default. */
const DEFAULT_COLOR: Record<TextType, TextColor> = {
	body: 'primary',
	large: 'primary',
	label: 'primary',
	supporting: 'secondary',
	code: 'primary',
	'display-1': 'primary',
	'display-2': 'primary',
	'display-3': 'primary',
	inherit: 'inherit',
}

function finish(
	style: TextScaleStyle,
	tokens: Record<string, string>,
	color: TextColor | undefined,
	defaultColor: TextColor,
	weight: TextWeight | undefined,
): TextScaleStyle {
	style.fontSizePx = fontSizePxOf(style.fontSize)
	style.lineHeightPx = lineHeightPxOf(style.lineHeight, style.fontSizePx)
	if (weight) {
		style.fontWeight = tokens[`--font-weight-${weight}`] || undefined
	}
	const colorToken = COLOR_TOKEN[color ?? defaultColor]
	if (colorToken) {
		style.color = tokens[colorToken] || undefined
	}
	return style
}

/** Text's Astryx scale: `type` picks `--text-<type>-*`, `size` overrides the
 *  font-size token only (leading stays a multiplier of the effective size),
 *  `color`/`weight` refine. `type` omitted or 'inherit' → ambient typography
 *  (size alone still applies). */
export function textScaleStyle(
	tokens: Record<string, string>,
	opts: {
		type?: TextType
		size?: TextSize
		color?: TextColor
		weight?: TextWeight
	},
): TextScaleStyle {
	const type = opts.type ?? 'inherit'
	const style: TextScaleStyle = {}
	if (type !== 'inherit') {
		style.fontSize = tokens[`--text-${type}-size`]
		style.lineHeight = tokens[`--text-${type}-leading`]
		style.fontWeight = tokens[`--text-${type}-weight`]
		if (type === 'code') {
			style.fontFamily = tokens['--font-family-code']
		}
	}
	if (opts.size) {
		style.fontSize = tokens[`--font-size-${opts.size === 'xsm' ? 'xs' : opts.size}`]
	}
	return finish(style, tokens, opts.color, DEFAULT_COLOR[type], opts.weight)
}

/** Heading's Astryx scale: the level's `--text-heading-<level>-*` tokens, or
 *  the `--text-display-<n>-*` set when `type` selects the display scale. */
export function headingScaleStyle(
	tokens: Record<string, string>,
	opts: {
		level?: 1 | 2 | 3 | 4 | 5 | 6
		type?: HeadingType
		color?: TextColor
		weight?: TextWeight
	},
): TextScaleStyle {
	const prefix = opts.type ? `--text-${opts.type}` : `--text-heading-${opts.level ?? 2}`
	const style: TextScaleStyle = {
		fontSize: tokens[`${prefix}-size`],
		lineHeight: tokens[`${prefix}-leading`],
		fontWeight: tokens[`${prefix}-weight`],
	}
	return finish(style, tokens, opts.color, 'primary', opts.weight)
}
