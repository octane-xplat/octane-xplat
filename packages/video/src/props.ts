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

/** Flex-container props shared by View/HStack/Pressable — RN vocabulary, applied
 *  to the host flexboxlayout natively and the element's style on web.
 *  `gap` is a dip number (px on web); NS supports it on FlexboxLayout only
 *  (GridLayout has no gap). */
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
export type VideoFit = 'contain' | 'cover' | 'fill'

/** Payload delivered to video callbacks — times are milliseconds. */
export interface VideoEvent {
	/** Playback position in milliseconds. */
	position?: number
	/** Clip duration in milliseconds, once known (0 before then). */
	duration?: number
	/** Failure description. */
	message?: string
}

/** Imperative handle exposed through the Video `ref`. */
export interface VideoHandle {
	/** Start or resume playback. */
	play(): void
	/** Pause at the current position. */
	pause(): void
	/** Seek to a position in milliseconds. */
	seekTo(ms: number): void
	/** Current playback position in ms (0 before metadata loads). */
	currentTime(): number
	/** Clip duration in ms (0 before metadata loads). */
	duration(): number
	/** The platform surface (`HTMLVideoElement` / plugin `Video` / AppKit NSView).
	 *  `any` deliberately — the three surfaces share no common type. */
	native: any
}

/** Embedded video — surface-hosted bucket: the OS engine owns the pixels
 *  (web `<video>` / `@nstudio/nativescript-exoplayer` → AVPlayerViewController
 *  + ExoPlayer2; AVPlayerLayer on AppKit), with self-drawn transport chrome.
 *  AppKit runtime qualification remains pending. Times are milliseconds on every platform. */
export interface VideoProps extends LayoutChildProps, AccessibilityProps {
	/** Class list applied to the video element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Element id passed through to the host element. */
	id?: string
	/** Remote URL; native also accepts `~/` bundle paths and absolute files. */
	src: string
	/** Frame shown until playback starts. */
	poster?: string
	/** Controlled playback — pair with `onPlayingChange`. Leave unset for
	 *  uncontrolled playback (the transport and `ref` handle still work). */
	playing?: boolean
	/** Uncontrolled start-playing shorthand. Browsers block unmuted
	 *  autoplay — pair with `muted` when `autoPlay` matters on web. */
	autoPlay?: boolean
	/** Audio-muted playback. Browsers require it for uncontrolled autoplay. */
	muted?: boolean
	/** Repeat the clip when it ends. */
	loop?: boolean
	/** Self-drawn transport overlay (play/pause, scrubber, time, mute) —
	 *  tap the surface to show/hide. Default true. */
	controls?: boolean
	/** Content fitting inside the frame: `contain` (letterbox, default),
	 *  `cover` (crop to fill), `fill` (stretch). */
	fit?: VideoFit
	/** Playback metadata is loaded; `e.duration` is the clip length in ms. */
	onReady?: (e: VideoEvent) => void
	/** Reached the end (with `loop`, fires before restarting). */
	onEnded?: () => void
	/** Fires on user toggles and controlled `playing` writes. */
	onPlayingChange?: (playing: boolean) => void
	/** Fires when the transport's mute button toggles. */
	onMutedChange?: (muted: boolean) => void
	/** Web and AppKit. Mobile plugin players surface no error event. */
	onError?: (e: VideoEvent) => void
	/** Imperative handle — play/pause/seek/time plus `native` for anything
	 *  the shared props don't cover. */
	ref?: Octane.Ref<VideoHandle>
	/** Platform escape hatches, applied after the shared props. */
	ios?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	web?: Record<string, any>
}
