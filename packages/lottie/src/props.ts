import type { Octane } from 'octane/jsx-runtime'

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

/** Flex-container props shared by View/Row/Pressable — RN vocabulary, applied
 *  to the host flexboxlayout natively and the element's style on web.
 *  `gap` is a dip number (px on web); NS supports it on FlexboxLayout only. */
export interface FlexContainerProps {
	justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
	alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
	flexWrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse'
	gap?: number | string
	rowGap?: number | string
	columnGap?: number | string
}

export type Role =
	| 'button'
	| 'link'
	| 'search'
	| 'image'
	| 'heading'
	| 'adjustable'
	| 'summary'
	| 'text'
	| 'none'
	| 'progressbar'
	| 'checkbox'
	| 'switch'
	| 'radio'
	| 'spinbutton'
	| 'tab'

export interface AccessibilityProps {
	/** Whether the element is exposed to assistive technology as an accessibility element. */
	accessible?: boolean
	/** Spoken name for assistive technology. */
	accessibilityLabel?: string
	/** Semantic role — mapped to an ARIA role on web and the platform role vocabulary natively. */
	accessibilityRole?: Role
	/** Spoken hint describing what activating does. */
	accessibilityHint?: string
	/** Spoken current value text. */
	accessibilityValue?: string
	/** State flags merged into the platform accessibility state. */
	accessibilityState?: {
		disabled?: boolean
		selected?: boolean
		checked?: boolean
	}
	/** Live-region announcements: polite queues, assertive interrupts. @default 'none' */
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
}

/** Content fitting inside the frame: 'contain' letterboxes, 'cover' crops
 *  to fill, 'fill' stretches. */
export type LottieFit = 'contain' | 'cover' | 'fill'

/** Payload delivered to load/error callbacks. */
export interface LottieEvent {
	/** Animation duration in milliseconds once loaded (0 before then). */
	duration?: number
	/** Failure description. */
	message?: string
}

/** Imperative handle exposed through the Lottie `ref`. */
export interface LottieHandle {
	/** Start or resume playback. */
	play(): void
	/** Pause at the current playhead. */
	pause(): void
	/** Stop and reset the playhead to the start. */
	stop(): void
	/** Seek to a normalized position, 0..1. */
	seekTo(progress: number): void
	/** Playback speed multiplier (1 = normal). */
	setSpeed(n: number): void
	/** Current playhead position, 0..1. */
	progress(): number
	/** Animation duration in milliseconds (0 before load). */
	duration(): number
	/** Whether playback is currently running. */
	isPlaying(): boolean
	/** The platform surface (lottie-web AnimationItem / plugin LottieView).
	 *  `any` deliberately — the two surfaces share no common type. */
	native: any
}

/** Lottie animation — lottie-web (svg renderer) on web, vendored
 *  ui-lottie (`src/vendor/ui-lottie` submodule, `octane-xplat/ui-lottie`
 *  @ `xplat-vendored`) on native.
 *  On web, lottie-web evaluates expressions embedded in animation data as
 *  JavaScript. Load only trusted animation data; expression-bearing files
 *  require a CSP that allows `unsafe-eval`.
 *  Progress is always normalized 0..1 and durations are milliseconds on
 *  every platform (the native plugin reports seconds on iOS). */
export interface LottieProps extends LayoutChildProps, AccessibilityProps {
	/** Class list applied to the animation element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Element id passed through to the host element. */
	id?: string
	/** Remote URL; native also accepts `~/` bundle paths, absolute file
	 *  paths, `res://` names, `.lottie`/`.zip` containers, and raw JSON
	 *  strings starting with `{`. */
	src?: string
	/** Inline animation object — wins over `src` when both are given. */
	data?: object
	/** Start playing as soon as the composition loads. Default true —
	 *  matches lottie-web; the native plugin's own default is false. */
	autoPlay?: boolean
	/** Repeat forever. Default false — a finite play is the least
	 *  surprising shared contract (lottie-web's own default is true). */
	loop?: boolean
	/** Controlled playback — leave unset for uncontrolled play. */
	playing?: boolean
	/** Controlled playhead position, 0..1. */
	progress?: number
	/** Playback speed multiplier (1 = normal). */
	speed?: number
	/** Content fitting inside the frame: `contain` (letterbox, default),
	 *  `cover` (crop to fill), `fill` (stretch). */
	fit?: LottieFit
	/** Composition parsed and ready — `e.duration` is the length in ms. */
	onLoaded?: (e: LottieEvent) => void
	/** Reached the end; does not fire per loop iteration. */
	onEnded?: () => void
	/** Load or parse failure. */
	onError?: (e: LottieEvent) => void
	/** Imperative handle — play/pause/seek plus `native` for anything the
	 *  shared props don't cover. */
	ref?: Octane.Ref<LottieHandle>
	/** Platform escape hatches, applied after the shared props. */
	ios?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	web?: Record<string, any>
}
