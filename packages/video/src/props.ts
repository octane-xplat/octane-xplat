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
	accessible?: boolean
	accessibilityLabel?: string
	accessibilityRole?: Role
	accessibilityHint?: string
	accessibilityValue?: string
	accessibilityState?: {
		disabled?: boolean
		selected?: boolean
		checked?: boolean
	}
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
}

export type VideoFit = 'contain' | 'cover' | 'fill'

export interface VideoEvent {
	/** Playback position in milliseconds. */
	position?: number
	/** Clip duration in milliseconds, once known (0 before then). */
	duration?: number
	/** Failure description. */
	message?: string
}

export interface VideoHandle {
	play(): void
	pause(): void
	/** Seek to a position in milliseconds. */
	seekTo(ms: number): void
	/** Current playback position in ms (0 before metadata loads). */
	currentTime(): number
	/** Clip duration in ms (0 before metadata loads). */
	duration(): number
	/** The platform surface (`HTMLVideoElement` / plugin `Video`). */
	native: any
}

/** Embedded video — surface-hosted bucket: the OS engine owns the pixels
 *  (web `<video>` / `@nstudio/nativescript-exoplayer` → AVPlayerViewController
 *  + ExoPlayer2), all chrome is self-drawn so `controls` looks identical on
 *  every target. Times are milliseconds on every platform. */
export interface VideoProps extends LayoutChildProps, AccessibilityProps {
	className?: any
	style?: any
	id?: string
	/** Remote URL; native also accepts `~/` bundle paths and absolute files. */
	src: string
	/** Frame shown until playback starts. */
	poster?: string
	/** Controlled playback — pair with `onPlayingChange`. Leave unset for
	 *  uncontrolled playback (the transport and `bind` handle still work). */
	playing?: boolean
	/** Uncontrolled start-playing shorthand. Browsers block unmuted
	 *  autoplay — pair with `muted` when `autoPlay` matters on web. */
	autoPlay?: boolean
	muted?: boolean
	loop?: boolean
	/** Self-drawn transport overlay (play/pause, scrubber, time, mute) —
	 *  tap the surface to show/hide. Default true. */
	controls?: boolean
	/** Content fitting inside the frame: `contain` (letterbox, default),
	 *  `cover` (crop to fill), `fill` (stretch). */
	fit?: VideoFit
	/** Playback metadata is loaded; `e.duration` is the clip length in ms. */
	onReady?: (e: VideoEvent) => void
	onEnded?: () => void
	/** Fires on user toggles and controlled `playing` writes. */
	onPlayingChange?: (playing: boolean) => void
	/** Fires when the transport's mute button toggles. */
	onMutedChange?: (muted: boolean) => void
	/** Web only — the plugin players surface no error event on native. */
	onError?: (e: VideoEvent) => void
	/** Imperative handle — play/pause/seek/time plus `native` for anything
	 *  the shared props don't cover. */
	bind?: (h: VideoHandle) => void
	/** Platform escape hatches, applied after the shared props. */
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}
