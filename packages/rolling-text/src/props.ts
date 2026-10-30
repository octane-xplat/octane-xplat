/** Shared prop surface for RollingText — identical on web and native leaves. */

/** Layout metadata the parent layout reads (grid slots, dock edges, flex
 *  factors, absolute offsets) — same vocabulary as the ui primitives. */
export interface LayoutChildProps {
	/** Zero-based row index in the parent grid. */
	row?: number
	/** Zero-based column index in the parent grid. */
	col?: number
	/** Row tracks to span (>= 1). */
	rowSpan?: number
	/** Column tracks to span (>= 1). */
	colSpan?: number
	/** Edge of the parent dock layout this child pins to. */
	dock?: 'left' | 'top' | 'right' | 'bottom'
	/** Absolute x offset in dips inside an absolute-layout parent. */
	left?: number
	/** Absolute y offset in dips inside an absolute-layout parent. */
	top?: number
	/** Flex grow factor along the parent main axis. */
	flexGrow?: number
	/** Flex shrink factor along the parent main axis. */
	flexShrink?: number
	/** Cross-axis alignment override for this child. */
	alignSelf?: string
	/** Sibling ordering — lower orders lay out first. */
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
	/** Segmentation unit for the roll. @default 'grapheme' */
	rollBy?: RollingTextUnit
	/** Roll direction. @default 'up' */
	direction?: RollingTextDirection
	/** Mid-roll update handling. @default 'interrupt' */
	updatePolicy?: RollingTextUpdatePolicy
	/** Per-roll timing in seconds. */
	transition?: RollingTextTransition
	/** Reduced-motion handling. @default 'user' */
	reducedMotion?: RollingTextReducedMotion
	/** Class list applied to the container element. */
	className?: any
	/** Inline style applied to the container (string CSS or object). */
	style?: any
	/** Element id passed through to the host element. */
	id?: string
	/** Test hook id on the container element. */
	testID?: string
	/** Accessible name override; defaults to the live `value` text. */
	accessibilityLabel?: string
	/** Opt-in live announcement when the value changes. @default 'none' */
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	/** Platform escape hatches, applied to the container after shared props. */
	ios?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	web?: Record<string, any>
}
