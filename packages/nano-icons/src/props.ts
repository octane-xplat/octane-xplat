import type { IconOptions, IconProps, IconSvg } from '@octane-xplat/icons'

/**
 * Shared icon inputs that produce one prepared geometry. `color` is excluded:
 * tint is a materialization-time input, so instances that differ only in color
 * share the same prepared body.
 */
export type NanoIconOptions = Omit<IconOptions, 'color'>

/** Props for `NanoIcon` — the same contract as `@octane-xplat/icons`' `Icon`. */
export type NanoIconProps = IconProps

/** Materialization-time input: the concrete tint for `currentColor` slots. */
export interface NanoIconTint {
	color?: string
}

/**
 * Immutable prepared icon. `body` is the normalized SVG fragment with the
 * artwork's own definition IDs and literal `currentColor` tint slots retained;
 * `viewBox`/`width`/`height` are the resolved logical-pixel geometry. Prepared
 * values are shared across instances — never mutate them.
 */
export interface PreparedNanoIcon {
	readonly body: string
	readonly viewBox: string
	readonly width: number
	readonly height: number
}

export type { IconSvg }
