/**
 * Shared native JSX contract — the renderer-neutral element, prop, event, and
 * ref surface consumed through `@octane-xplat/jsx/jsx-runtime` under the
 * `default`, `native`, and `macos` export conditions.
 *
 * Every declaration here is generic over `TElement` — the host element type —
 * so a target-conditioned entry can bind it to a concrete host class without
 * changing the element or prop surface. The conditioned exports may change
 * ref and host-event payload value types only; intrinsic membership and prop
 * names are identical on every target.
 *
 * This file must not import `@nativescript/core`, AppKit, or DOM types: it is
 * the shared graph every native target resolves, including macOS consumers
 * that have no NativeScript dependency. Members whose upstream value is a
 * host platform object are projected through the named `HostObject`-family
 * types below so the dependency stays at one chokepoint.
 */
import type { ClassValue, CSSProperties } from 'octane/jsx-runtime'

/** JSX renderable — what a JSX expression types as and what `children` accepts. */
export type NativeNode = unknown

/**
 * ElementType for the automatic runtime — a tag name or function component.
 * Octane components take `(props, scope)`; one-parameter callables stay
 * assignable because fewer required parameters satisfy a wider signature.
 */
export type ElementTypeOf = string | ((props: any, scope: any) => unknown)

/**
 * Ref callback with React-style parameter bivariance: a callback annotated
 * with the concrete host type is accepted where the facade binds a generic
 * `TElement`, without loosening the result or arity checks.
 */
export type RefCallback<TElement> = {
	bivarianceHack(instance: TElement | null): void | (() => void)
}['bivarianceHack']

/**
 * Host-event handler with the same method-syntax bivariance: handlers whose
 * event parameter is typed against the conditioned `TElement` accept an
 * annotation naming the concrete host element or view.
 */
export type HostHandler<E> = { bivarianceHack(event: E): void }['bivarianceHack']

/**
 * Host ref lifecycle, matching the octane universal contract: a callback that
 * may return a cleanup function, a `{ current }` object, an array of refs
 * (nested arrays flatten), or null/undefined. Ref callbacks compare their
 * parameter bivariantly, so a callback annotated with the concrete host type
 * is accepted.
 */
export type Ref<TElement> =
	| RefCallback<TElement>
	| { current: TElement | null }
	| readonly Ref<TElement>[]
	| null
	| undefined

/**
 * HOST-OBJECT PROJECTION — members typed `HostObject` carry renderer host
 * objects in the pinned upstream contract (`ImageSource`, `FormattedString`,
 * `ItemsSource`, `KeyedTemplate`, segmented/tab item arrays, `ActionBar`'s
 * `titleView`, native view handles) whose class identity cannot be named in a
 * core-free shared declaration graph.
 *
 * The `object` projection keeps every real host value assignable while still
 * rejecting primitives; it does newly accept arbitrary object lookalikes. The
 * exact member inventory and accepted-lookalike delta are recorded in the
 * host-object policy report — this alias is the single point to retarget if
 * the contract adopts a structural or nominal projection instead.
 */
export type HostObject = object

/**
 * Inline style bag — upstream `Partial<Style>`. A record projection keeps
 * `Partial<NS.Style>` values and style literals assignable while rejecting
 * primitives; see `HostObject` for the pending policy.
 */
export type StyleProps = Record<string, unknown>

/** Octane's class composition contract, shared unchanged across renderers. */
export type { ClassValue } from 'octane/jsx-runtime'

/** Base host-event payload — the driver hands `object` the host element. */
export interface NativeEvent<TElement> {
	readonly eventName: string
	readonly object: TElement
}

/** Tap/double-tap/long-press gestures — `{object}` payload only. */
export interface TapEvent<TElement> extends NativeEvent<TElement> {}
export interface SwipeGestureEvent<TElement> extends NativeEvent<TElement> {
	/** Upstream `SwipeDirection` enum — projected, see `HostObject`. */
	readonly direction: unknown
}

export interface PanGestureEvent<TElement> extends NativeEvent<TElement> {
	readonly deltaX: number
	readonly deltaY: number
	/** Upstream `GestureState` enum — projected, see `HostObject`. */
	readonly state: unknown
}

export interface PinchGestureEvent<TElement> extends NativeEvent<TElement> {
	readonly scale: number
	readonly state: unknown
}

export interface RotationGestureEvent<TElement> extends NativeEvent<TElement> {
	readonly rotation: number
	readonly state: unknown
}

export interface TouchGestureEvent<TElement> extends NativeEvent<TElement> {
	readonly action: unknown
	readonly x: number
	readonly y: number
}

/** `PropertyChangeData`-shaped payloads (`textChange`, `checkedChange`, …). */
export interface ValueChangeEvent<TElement, TValue = unknown> extends NativeEvent<TElement> {
	readonly value: TValue
	readonly oldValue?: TValue
}

/** `selectedIndexChange(d)` payloads — `value` is the new index. */
export interface IndexChangeEvent<TElement> extends NativeEvent<TElement> {
	readonly value: number
	readonly oldIndex?: number
	readonly newIndex?: number
}

export interface ScrollEvent<TElement> extends NativeEvent<TElement> {
	readonly scrollX: number
	readonly scrollY: number
}

/** Recycled-cell payloads (`itemLoading`, `itemTap`, `itemDisposing`). */
export interface ItemEvent<TElement> extends NativeEvent<TElement> {
	readonly index: number
	/** The recycled host cell. Observation-only: replacing it is outside the shared contract. */
	readonly view: HostObject
}

/** WebView navigation payloads (`loadStarted`/`loadFinished`/`loadError`). */
export interface WebViewEvent<TElement> extends NativeEvent<TElement> {
	readonly url?: string
	readonly error?: unknown
	readonly navigationType?: unknown
}

/** Attributes every host element accepts: key, ref, children. */
export interface OctaneAttributes<TElement> {
	key?: string | number
	ref?: Ref<TElement>
	children?: NativeNode
}

/**
 * Attributes every host element accepts — class, inline style, drawer-style
 * slot hosting (`hostSlot`), and the attached layout properties layout
 * modules register on every view at runtime (`row`, `col`, `dock`, …).
 */
export interface CommonAttributes {
	/** Resolved against the app stylesheet; clsx-style composition. */
	className?: ClassValue
	/** Alias for `className`. */
	class?: ClassValue
	/** A string is parsed as inline CSS; an object is assigned onto the view's style bag. */
	style?: string | StyleProps | CSSProperties
	id?: string
	/**
	 * Name of the property on a slot-hosting parent (e.g. a drawer's
	 * `mainContent` / `leftDrawer`) this child should be assigned to instead
	 * of being added as a regular layout child.
	 */
	hostSlot?: string
	visibility?: 'visible' | 'hidden' | 'collapse'
	accessible?: boolean
	accessibilityLabel?: string
	accessibilityRole?: string
	accessibilityHint?: string
	accessibilityValue?: string
	accessibilityState?: Record<string, unknown>
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	automationText?: string
	testID?: string
	/** Escape bag for platform-specific modifiers applied through a ref or escape-props helper. */
	ios?: Record<string, unknown>
	android?: Record<string, unknown>
}

/**
 * Events available on every host element: the gesture surface, the driver's
 * web-shaped aliases (`onClick`/`onPress` → tap, `onChange` → textChange,
 * `onSubmit` → returnPress), focus/blur, and the view lifecycle pair.
 */
export interface CommonEvents<TElement> {
	onTap?: HostHandler<TapEvent<TElement>>
	/** Alias for `onTap`. */
	onClick?: HostHandler<TapEvent<TElement>>
	/** Alias for `onTap`. */
	onPress?: HostHandler<TapEvent<TElement>>
	onDoubleTap?: HostHandler<TapEvent<TElement>>
	onLongPress?: HostHandler<TapEvent<TElement>>
	onSwipe?: HostHandler<SwipeGestureEvent<TElement>>
	onPan?: HostHandler<PanGestureEvent<TElement>>
	onPinch?: HostHandler<PinchGestureEvent<TElement>>
	onRotation?: HostHandler<RotationGestureEvent<TElement>>
	onTouch?: HostHandler<TouchGestureEvent<TElement>>
	/** Alias for `onTextChange`. */
	onChange?: HostHandler<ValueChangeEvent<TElement>>
	/** Alias for `onReturnPress`. */
	onSubmit?: HostHandler<NativeEvent<TElement>>
	onFocus?: HostHandler<NativeEvent<TElement>>
	onBlur?: HostHandler<NativeEvent<TElement>>
	onLoaded?: HostHandler<NativeEvent<TElement>>
	onUnloaded?: HostHandler<NativeEvent<TElement>>
	onLayoutChanged?: HostHandler<NativeEvent<TElement>>
}

/**
 * The shared attribute composition: octane identity attributes, the common
 * attribute bag, the common event surface, plus a tag's own props. Leaf
 * packages augmenting `NativeElements` compose their prop surface the same
 * way — `Attributes<TElement, { src?: string }>`.
 */
export type Attributes<TElement, Props = object> = OctaneAttributes<TElement> &
	CommonAttributes &
	CommonEvents<TElement> &
	Props

// ---------------------------------------------------------------------------
// Per-tag prop surfaces. Primitive members are the shared cross-platform
// contract; `HostObject`-typed members carry platform objects (see above).
// ---------------------------------------------------------------------------

/** The single layout container — CSS layout semantics backed by Mason on
 *  every native target. ALL layout is expressed through `style`/`className`
 *  (the `MasonStyleProps` surface): display, position, grid tracks, flex
 *  configuration, insets — the DOM-style channel web uses. No layout prop
 *  exists here; the drivers warn and drop former prop names. Components keep
 *  their semantic APIs (`direction`, `hAlign`, `row`, `dock`, …) and
 *  translate them internally, exactly as the web targets do. */
export interface MasonViewProps {}

export interface TextBaseProps {
	text?: string | number
	/** Rich text content — upstream `string | FormattedString`. */
	formattedText?: string | HostObject
	textWrap?: boolean
	whiteSpace?: 'normal' | 'nowrap' | 'initial' | 'nowrapping'
	textOverflow?: 'clip' | 'ellipsis' | 'none'
	maxLines?: number
}

export interface SpanProps {
	text?: string | number
	fontFamily?: string
	fontSize?: number
	fontWeight?: string | number
	fontStyle?: string
	textDecoration?: string
	color?: string | HostObject
	backgroundColor?: string | HostObject
}

export interface FormattedStringProps {
	fontFamily?: string
	fontSize?: number
	color?: string | HostObject
	backgroundColor?: string | HostObject
}

export interface HtmlViewProps {
	html?: string
}

export interface TextFieldProps<TElement> {
	text?: string
	hint?: string
	secure?: boolean
	editable?: boolean
	maxLength?: number
	keyboardType?: 'datetime' | 'phone' | 'number' | 'url' | 'email' | 'integer' | 'digits' | string
	returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send' | string
	autocorrect?: boolean
	autocapitalizationType?: 'none' | 'words' | 'sentences' | 'allcharacters'
	onTextChange?: HostHandler<ValueChangeEvent<TElement, string>>
	onReturnPress?: HostHandler<NativeEvent<TElement>>
}

export interface TextViewProps<TElement> {
	text?: string
	hint?: string
	editable?: boolean
	maxLength?: number
	autocorrect?: boolean
	autoGrow?: boolean
	maxRows?: number
	rows?: number
	onTextChange?: HostHandler<ValueChangeEvent<TElement, string>>
}

export interface SearchBarProps<TElement> {
	text?: string
	hint?: string
	onTextChange?: HostHandler<ValueChangeEvent<TElement, string>>
	onSubmit?: HostHandler<NativeEvent<TElement>>
}

export interface ButtonProps {
	text?: string | number
	formattedText?: string | HostObject
	isEnabled?: boolean
	textWrap?: boolean
}

export interface SwitchProps<TElement> {
	checked?: boolean
	isEnabled?: boolean
	onCheckedChange?: HostHandler<ValueChangeEvent<TElement, boolean>>
}

export interface SliderProps<TElement> {
	value?: number
	minValue?: number
	maxValue?: number
	isEnabled?: boolean
	onValueChange?: HostHandler<ValueChangeEvent<TElement, number>>
}

/** Shared range contract for determinate progress on every native target. */
export interface ProgressProps {
	/** Defaults to 0; clamps to [0, maxValue]. Nonpositive maxValue displays 0%. */
	value?: number
	/** Defaults to 100. A nonpositive maximum displays 0%, without division by zero. */
	maxValue?: number
}

export interface ActivityIndicatorProps {
	busy?: boolean
}

export interface ListPickerProps<TElement> {
	items?: readonly unknown[]
	selectedIndex?: number
	onSelectedIndexChange?: HostHandler<IndexChangeEvent<TElement>>
}

export interface SegmentedBarProps<TElement> {
	/** Upstream `SegmentedBarItem[]`. */
	items?: readonly HostObject[]
	selectedIndex?: number
	onSelectedIndexChange?: HostHandler<IndexChangeEvent<TElement>>
}

export interface SegmentedBarItemProps {
	title?: string
}

/** Calendar-date-only values. Drivers normalize date/minDate/maxDate to local
 * midnight, and dateChange emits a Date at local midnight. Time-of-day belongs
 * to timepicker. Strings are parsed as Date values before normalization. */
export interface DatePickerProps<TElement> {
	date?: Date | string
	minDate?: Date | string
	maxDate?: Date | string
	day?: number
	month?: number
	year?: number
	onDateChange?: HostHandler<ValueChangeEvent<TElement, Date>>
}

/** Minute-precision time of day: time and event values normalize to
 * new Date(0, 0, 0, hour, minute), with zero seconds/milliseconds. Strings must
 * be 24-hour HH:mm or HH:mm:ss; invalid values throw TypeError. Equality uses
 * hour/minute only. Components are applied in prop order; removing them restores
 * the creation-time component. Bounds compose one inclusive range (defaults
 * 00:00–23:59); inverted proposals retain the previous effective range without
 * partial application. Bounds changes clamp selection to the nearest endpoint. */
export interface TimePickerProps<TElement> {
	time?: Date | string
	hour?: number
	minute?: number
	minHour?: number
	maxHour?: number
	minMinute?: number
	maxMinute?: number
	onTimeChange?: HostHandler<ValueChangeEvent<TElement, Date>>
}

export interface ListViewProps<TElement> {
	/** Upstream `any[] | ItemsSource`. */
	items?: readonly unknown[] | HostObject
	/** Zero-argument host factory or NativeScript Builder XML over shared tags.
	 * Bindings {{ path.sub }}, {{ expression }} and $value evaluate against the
	 * item bindingContext on bind/rebind. Nested tags are supported. Malformed
	 * XML, unknown tags and undeclared props throw TypeError. Live observable
	 * bindings and two-way writeback remain an AppKit qualification gap.
	 * Callable templates take precedence over strings; their host owns unmount
	 * on rebind/release. renderItem takes precedence over all templates. */
	itemTemplate?: string | (() => HostObject)
	/** Zero-argument keyed host factories. Without itemTemplateSelector only
	 * "default" is reachable; other keys throw TypeError at the prop boundary. */
	itemTemplates?: readonly { key: string; createView: () => HostObject }[]
	/**
	 * Renders one row into a recycled cell. Takes precedence over
	 * `itemTemplate`/`itemTemplates`; the cell's own Octane root is diffed in place on rebind.
	 */
	renderItem?: (item: any, index: number) => NativeNode
	separatorColor?: string | HostObject
	onItemLoading?: HostHandler<ItemEvent<TElement>>
	onItemTap?: HostHandler<ItemEvent<TElement>>
	onLoadMoreItems?: HostHandler<NativeEvent<TElement>>
}

/** Unconditioned item instance. Target entries bind this name to the
 * NativeScript TabViewItem or AppKit's viewless logical handle. */
export type TabViewItemHandle = HostObject

/** Logical item instances come from tabviewitem refs, not arbitrary prop bags.
 * AppKit conditions this to its viewless handle; mobile uses TabViewItem.
 * JSX children belong to the item's host-owned content root. Retained handles
 * keep identity across item-array updates and transfer prior-parent ownership.
 * Assigned content roots cannot be replaced: update the item's JSX children.
 * This is minimal hosting for TabView; standalone item qualification follows.
 */
export interface TabViewProps<TElement, TItem = TabViewItemHandle> {
	/** Imperative alternative to ordered tabviewitem JSX children. */
	items?: readonly TItem[]
	selectedIndex?: number
	onSelectedIndexChange?: HostHandler<IndexChangeEvent<TElement>>
	onSelectedIndexChanged?: HostHandler<IndexChangeEvent<TElement>>
}

export interface TabViewItemProps {
	title?: string
	/** Upstream `string | ImageSource`. */
	iconSource?: string | HostObject
}

export interface PageProps<TElement> {
	actionBarHidden?: boolean
	enableSwipeBackNavigation?: boolean
	statusBarStyle?: 'light' | 'dark' | string
	backgroundSpanUnderStatusBar?: boolean
	onNavigatedTo?: HostHandler<NativeEvent<TElement>>
	onNavigatedFrom?: HostHandler<NativeEvent<TElement>>
	onNavigatingTo?: HostHandler<NativeEvent<TElement>>
}

export interface FrameProps {
	actionBarVisibility?: 'auto' | 'never' | 'always' | string
}

export interface ActionBarProps {
	title?: string
	/** Upstream `View` — a view instance to render inside the bar. */
	titleView?: HostObject
	flat?: boolean
}

export interface ActionItemProps {
	text?: string
	/** Upstream `string | ImageSource`. */
	icon?: string | HostObject
}

export interface NavigationButtonProps {
	text?: string
}

export interface ImageProps {
	/** Upstream `string | ImageSource` — `res://`, `~/`, file path, URL, or a decoded source. */
	src?: string | HostObject
	imageSource?: HostObject
	stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill'
	loadMode?: 'sync' | 'async'
	tintColor?: string | HostObject
}

export interface WebViewProps<TElement> {
	src?: string
	onLoadStarted?: HostHandler<WebViewEvent<TElement>>
	onLoadFinished?: HostHandler<WebViewEvent<TElement>>
	onLoadError?: HostHandler<WebViewEvent<TElement>>
}

export interface ScrollViewProps<TElement> {
	orientation?: 'horizontal' | 'vertical'
	scrollBarIndicatorVisible?: boolean
	isScrollEnabled?: boolean
	onScroll?: HostHandler<ScrollEvent<TElement>>
}

export interface PlaceholderProps<TElement> {
	/** Fired once the placeholder is attached; the handler assigns `event`'s view. */
	onCreatingView?: HostHandler<NativeEvent<TElement> & { view?: HostObject }>
}

// ---------------------------------------------------------------------------
// Maintained cross-platform extension props — the nine shipped tags below.
// Plugin-scoped props keep loose value types so the facade carries no plugin
// class references; `HostObject` marks upstream host-object members.
// ---------------------------------------------------------------------------

export interface CachedImageProps {
	/** Upstream `SrcType` — uri, `ImageSource`/`ImageAsset`, a promise of one, or a resolver function. */
	src?: string | HostObject | PromiseLike<string | HostObject>
	stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill'
	placeholderImageUri?: string
	failureImageUri?: string
	lowerResSrc?: string
	backgroundUri?: string
	headers?: Record<string, string> | (() => Record<string, string>)
	fadeDuration?: number
	alwaysFade?: boolean
	progressiveRenderingEnabled?: boolean
	localThumbnailPreviewsEnabled?: boolean
	showProgressBar?: boolean
	/** Upstream `Color | string`. */
	progressBarColor?: string | HostObject
	roundAsCircle?: boolean
	roundTopLeftRadius?: number | string
	roundTopRightRadius?: number | string
	roundBottomLeftRadius?: number | string
	roundBottomRightRadius?: number | string
	blurRadius?: number
	blurDownSampling?: number
	imageRotation?: number
	autoPlayAnimations?: boolean
	tapToRetryEnabled?: boolean
	aspectRatio?: number
	decodeWidth?: number
	decodeHeight?: number
	animatedImageView?: boolean
	loadMode?: 'sync' | 'async'
	noCache?: boolean
	noRatioEnforce?: boolean
	/** Upstream `Color`. */
	tintColor?: string | HostObject
}

export interface SvgViewProps {
	src?: string | Promise<string>
	stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill'
}

export interface VideoProps<TElement> {
	src?: string
	autoplay?: boolean
	controls?: boolean
	loop?: boolean
	muted?: boolean
	fill?: 'aspect' | 'aspectFill' | 'fill' | string
	headers?: Record<string, string>
	observeCurrentTime?: boolean
	onFinished?: HostHandler<NativeEvent<TElement>>
	onPlaybackReady?: HostHandler<NativeEvent<TElement>>
	onPlaybackStart?: HostHandler<NativeEvent<TElement>>
	onCurrentTimeUpdated?: HostHandler<NativeEvent<TElement> & { position?: number }>
	onError?: HostHandler<NativeEvent<TElement> & { error?: unknown }>
}

export interface CanvasProps<TElement> {
	width?: number | string
	height?: number | string
	onReady?: HostHandler<NativeEvent<TElement>>
}

export interface LottieProps {
	src?: string | HostObject
	autoPlay?: boolean
	loop?: boolean
	progress?: number
	speed?: number
}

export interface PagerProps<TElement> {
	items?: readonly unknown[] | HostObject
	renderItem?: (item: any, index: number) => NativeNode
	selectedIndex?: number
	onItemLoading?: HostHandler<ItemEvent<TElement>>
	onItemDisposing?: HostHandler<ItemEvent<TElement>>
	onSelectedIndexChange?: HostHandler<IndexChangeEvent<TElement>>
}

export interface AnimatedImageProps {
	src?: string | HostObject
	stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill'
	width?: number | string
	height?: number | string
	animatedImageView?: boolean
	autoPlayAnimations?: boolean
}

export interface AppleSignInButtonProps {
	type?: 'default' | 'signIn' | 'continue' | 'signUp' | string
	buttonStyle?: 'black' | 'white' | 'whiteOutline' | string
	isEnabled?: boolean
}

export interface GoogleSignInButtonProps {
	colorScheme?: 'auto' | 'dark' | 'light' | string
	colorStyle?: 'standard' | 'wide' | 'icon' | string
	isEnabled?: boolean
}

/**
 * The shared native intrinsic map — the 39 NativeScript-baseline tags, the
 * compiler-produced `#text` node, and the nine maintained cross-platform
 * extension tags. Generic over the host element type; target-conditioned
 * entries instantiate it without changing membership. Leaf packages add
 * platform-scoped elements by augmenting this interface through
 * `@octane-xplat/jsx/intrinsics`.
 */
export interface NativeElements<TElement> {
	// Layout
	masonview: Attributes<TElement, MasonViewProps>
	contentview: Attributes<TElement>
	proxyviewcontainer: Attributes<TElement>
	rootlayout: Attributes<TElement>
	// Text
	label: Attributes<TElement, TextBaseProps>
	formattedstring: Attributes<TElement, FormattedStringProps>
	span: Attributes<TElement, SpanProps>
	htmlview: Attributes<TElement, HtmlViewProps>
	// Text input
	textfield: Attributes<TElement, TextFieldProps<TElement>>
	textview: Attributes<TElement, TextViewProps<TElement>>
	searchbar: Attributes<TElement, SearchBarProps<TElement>>
	// Controls
	button: Attributes<TElement, ButtonProps>
	switch: Attributes<TElement, SwitchProps<TElement>>
	slider: Attributes<TElement, SliderProps<TElement>>
	progress: Attributes<TElement, ProgressProps>
	activityindicator: Attributes<TElement, ActivityIndicatorProps>
	listpicker: Attributes<TElement, ListPickerProps<TElement>>
	segmentedbar: Attributes<TElement, SegmentedBarProps<TElement>>
	segmentedbaritem: Attributes<TElement, SegmentedBarItemProps>
	datepicker: Attributes<TElement, DatePickerProps<TElement>>
	timepicker: Attributes<TElement, TimePickerProps<TElement>>
	// Lists and tabs
	listview: Attributes<TElement, ListViewProps<TElement>>
	tabview: Attributes<TElement, TabViewProps<TElement>>
	tabviewitem: Attributes<TElement, TabViewItemProps>
	// Navigation chrome
	page: Attributes<TElement, PageProps<TElement>>
	frame: Attributes<TElement, FrameProps>
	actionbar: Attributes<TElement, ActionBarProps>
	actionitem: Attributes<TElement, ActionItemProps>
	navigationbutton: Attributes<TElement, NavigationButtonProps>
	// Media and other
	image: Attributes<TElement, ImageProps>
	webview: Attributes<TElement, WebViewProps<TElement>>
	scrollview: Attributes<TElement, ScrollViewProps<TElement>>
	placeholder: Attributes<TElement, PlaceholderProps<TElement>>
	liquidglass: Attributes<TElement>
	/** Compiler-produced text node — carries `props.value`, folded into the parent's text. */
	'#text': Attributes<TElement, { value?: string }>
	// Maintained cross-platform extensions (registered for iOS + Android).
	cachedimage: Attributes<TElement, CachedImageProps>
	svgview: Attributes<TElement, SvgViewProps>
	xplatvideo: Attributes<TElement, VideoProps<TElement>>
	nscanvas: Attributes<TElement, CanvasProps<TElement>>
	xplatlottie: Attributes<TElement, LottieProps>
	pager: Attributes<TElement, PagerProps<TElement>>
	animatedimage: Attributes<TElement, AnimatedImageProps>
	applesigninbutton: Attributes<TElement, AppleSignInButtonProps>
	googlesigninbutton: Attributes<TElement, GoogleSignInButtonProps>
}
