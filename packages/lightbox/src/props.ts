import type { ClassValue, HostElement, PlatformProps, Renderable, StyleProp, TestIDProps } from '@octane-xplat/ui'
import type { MotionValue, Transition } from '@octane-xplat/motion'

// ---------- lightbox ----------

/** Kind of a `LightboxMedia` entry — `'image'` (default) or `'video'` (real player on web only; native displays alt text).
 */
export type LightboxMediaType = 'image' | 'video'

/** One `Lightbox` entry — `src` URI, required `alt` description, optional `caption`, and `type`.
 */
export interface LightboxMedia {
	src: string
	/** Accessible description of the media (web `alt`). */
	alt: string
	caption?: Renderable
	/** @default 'image' */
	type?: LightboxMediaType
	/** Natural media size; aids layout before the media loads. */
	width?: number
	height?: number
	/** Web `srcset`/`sizes` passthrough on the zoomed image. */
	srcSet?: string
	sizes?: string
}

/** A tap on a lightbox slide, after the double-tap window when zoom is on. */
export interface LightboxTapEvent {
	index: number
	/** Where the tap landed — on the image or the surrounding backdrop. */
	target: 'image' | 'backdrop'
	/** Tap position normalized to the image box (0–1); may exceed the range on the backdrop. */
	x: number
	y: number
	pointerType: string
	/** Skip the default action (backdrop close / UI toggle). */
	preventDefault(): void
}

/** Shared behavior options for `Lightbox` and `Lightbox.Root`. */
export interface LightboxOptions<T extends LightboxMedia = LightboxMedia> {
	media: T[]
	/** Controlled visibility — pair with `onOpenChange`. `Lightbox.Root` uses
	 *  `defaultOpen` for trigger-driven galleries. */
	isOpen?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	/** Controlled index. */
	index?: number
	/** Uncontrolled initial index. */
	defaultIndex?: number
	onIndexChange?: (index: number) => void
	/** Pinch/double-tap zoom on images; `false` is upstream `maxZoom: 1`. @default true */
	hasZoom?: boolean
	/** Auto-play videos when they are shown. Web only. @default false */
	hasAutoPlay?: boolean
	/** Element to focus on close; defaults to the element focused when the
	 *  lightbox opened. Web restores DOM focus; native attempts keyboard focus
	 * after the presenting layer detaches. Native screen-reader focus is not
	 * qualified. `{current}`-style ref. */
	finalFocusRef?: { current: HostElement | null }
	/** Trackpad/wheel zoom on the photo. Web only. */
	hasWheelZoom?: boolean
	/** Tapping the backdrop closes the viewer. @default true */
	hasBackdropDismiss?: boolean
	/** Maximum pinch/double-tap zoom scale. @default 4 */
	maxZoom?: number
	/** Keep the page behind in sync: scroll the current trigger into view.
	 *  `false` disables it; recycled or unmounted triggers fade instead. */
	triggerScroll?: 'smooth' | 'instant' | false
	/** Open/close morph transition override (motion `Transition`). */
	transition?: Transition
}

/** Full-screen media viewer (Astryx `Lightbox`). Navigates a `media` array
 *  with prev/next controls, arrow keys (web), and swipe (native);
 *  pinch/double-tap zoom applies to images only. `type: 'video'` renders
 *  a real player only on web — native displays alt text.
 *
 * @example
 * ```tsx
 * import { Lightbox } from '@octane-xplat/lightbox'
 *
 * <Lightbox
 * 	isOpen={viewing}
 * 	onOpenChange={setViewing}
 * 	media={[{ src: photo.url, alt: photo.name }]}
 * />
 * ```
 * @see LightboxMedia, useLightbox.
 */
export interface LightboxProps extends LightboxOptions {
	/** Convenience `Lightbox` requires controlled visibility (Astryx). */
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	className?: ClassValue
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Headless root for custom chrome — `Lightbox.Root`, `Trigger`, `Popup`,
 *  `Backdrop`, `Viewport`, `Slide`, `Image`, `Close`, `Prev`, `Next`. */
export interface LightboxRootProps extends LightboxOptions {
	children?: Renderable
	className?: ClassValue
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Props spread onto a media element that should open the lightbox on
 *  press/click.
 *
 * @see UseLightboxReturn.getTriggerProps — these props come from `useLightbox`.
 */
export interface LightboxTriggerProps {
	onPress?: () => void
	/** Registers the trigger host so the open/close morph can find it. */
	ref?: (host: HostElement | null) => void
	/** Web cursor hint + native accessibility hint. */
	web?: PlatformProps
}

/** Options for `useLightbox` — the `media` array, controlled `index`/`onIndexChange` or `defaultIndex`, and zoom/autoplay flags matching `LightboxProps`.
 */
export interface UseLightboxOptions extends Omit<LightboxOptions, 'isOpen' | 'defaultOpen'> {}

/** `useLightbox` result — `open(index)`/`close`, live `isOpen`/`index`, and `element`: the `Lightbox` node to render in the tree.
 */
export interface UseLightboxReturn {
	/** Open at `index` (default 0). */
	open: (index?: number) => void
	close: () => void
	isOpen: boolean
	index: number
	/** The lightbox node — render it once in the tree. */
	element: Renderable
	/** Props for a plain trigger element that opens index 0. */
	triggerProps: LightboxTriggerProps
	/** Props for a trigger bound to a specific media index. */
	getTriggerProps: (index: number) => LightboxTriggerProps
}

/** Live viewer state from `useLightboxState()` inside `Lightbox.Root` —
 *  upstream's `useLightbox()` shape for custom chrome. */
export interface UseLightboxState<T extends LightboxMedia = LightboxMedia> {
	items: T[]
	item: T
	index: number
	count: number
	phase: 'closed' | 'opening' | 'open' | 'closing'
	open: boolean
	zoomed: boolean
	dragging: boolean
	uiHidden: boolean
	/** 0→1 visibility of the open layer (backdrop fade during pull/morph). */
	presence: MotionValue
	/** Fractional viewport position — index + in-progress swipe. */
	progress: MotionValue
	openAt: (index: number) => void
	close: () => void
	goTo: (index: number) => void
	next: () => void
	prev: () => void
	zoomIn: () => void
	zoomOut: () => void
	resetZoom: () => void
}

/** Props shared by the lightbox layer parts. */
export interface LightboxPartProps extends TestIDProps {
	/** Host `id` — probe/test lookup (NativeScript `view.id`, web `id` attr). */
	id?: string
	children?: Renderable
	className?: ClassValue
	style?: StyleProp
}
/** `Lightbox.Trigger` — registers the morph source element for `index`. */
export interface LightboxTriggerPartProps extends LightboxPartProps {
	index: number
	/** Activation callback — matches the cross-platform `onPress` convention. */
	onPress?: (event: unknown) => void
}
/** `Lightbox.Slide`. */
export interface LightboxSlidePartProps extends LightboxPartProps {
	index: number
	/** Taps on this slide (after the double-tap window when zoom is on). Call `event.preventDefault()` to skip the default. */
	onTap?: (event: LightboxTapEvent) => void
}
/** A selectable thumbnail inside `Lightbox.Thumbnails`. */
export interface LightboxThumbnailPartProps extends LightboxPartProps {
	index: number
	onPress?: (event: unknown) => void
}
/** `Lightbox.Image` — defaults `src`/`alt`/`srcSet`/`sizes` to the slide's item. */
export interface LightboxImagePartProps extends LightboxPartProps {
	src?: string
	alt?: string
	srcSet?: string
	sizes?: string
}
