/** Shared prop surface for RollingText — identical on web and native leaves. */

/** Layout metadata the parent layout reads (grid slots, dock edges, flex
 *  factors, absolute offsets) — same vocabulary as the ui primitives. */
export interface LayoutChildProps {
	row?: number
	col?: number
	rowSpan?: number
	colSpan?: number
	dock?: 'left' | 'top' | 'right' | 'bottom'
	left?: number
	top?: number
	flexGrow?: number
	flexShrink?: number
	alignSelf?: string
	order?: number
}

/** Segmentation unit for the roll. 'word' keeps each word (and its trailing
 *  whitespace) in one cell so joined scripts and within-word shaping survive;
 *  'grapheme' rolls per user-perceived character. */
export type RollingTextUnit = 'grapheme' | 'word'

/** 'up' rolls outgoing text toward the top; 'down' toward the bottom. */
export type RollingTextDirection = 'up' | 'down'

/** Mid-roll update handling. 'interrupt' snaps the running roll to its
 *  target and starts the next one; 'latest' lets the run finish, then rolls
 *  to the most recent requested value only. */
export type RollingTextUpdatePolicy = 'interrupt' | 'latest'

/** 'always' settles every update instantly; 'never' always rolls; 'user'
 *  follows the platform reduce-motion preference, live. */
export type RollingTextReducedMotion = 'always' | 'never' | 'user'

/** Timing in seconds, matching @octane-xplat/motion's convention. */
export interface RollingTextTransition {
	/** Per-cell roll duration. @default 0.3 */
	duration?: number
	/** Delay before the run starts. @default 0 */
	delay?: number
}

/** A single-line label whose text rolls per unit when `value` changes.
 *  The semantic value and accessible label track `value` immediately, even
 *  while visual playback is queued or reduced. */
export interface RollingTextProps extends LayoutChildProps {
	/** The already-formatted string to display — RollingText never formats or
	 *  mutates the text itself. */
	value: string
	/** @default 'grapheme' */
	rollBy?: RollingTextUnit
	/** @default 'up' */
	direction?: RollingTextDirection
	/** @default 'interrupt' */
	updatePolicy?: RollingTextUpdatePolicy
	transition?: RollingTextTransition
	/** @default 'user' */
	reducedMotion?: RollingTextReducedMotion
	className?: any
	style?: any
	id?: string
	testID?: string
	/** Accessible name override; defaults to the live `value` text. */
	accessibilityLabel?: string
	/** Opt-in live announcement when the value changes. @default 'none' */
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	/** Platform escape hatches, applied to the container after shared props. */
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}
