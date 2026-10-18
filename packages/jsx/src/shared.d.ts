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

/** JSX renderable — what a JSX expression types as and what `children` accepts. */
export type NativeNode = unknown

/** ElementType for the automatic runtime — a tag name or function component. */
export type ElementTypeOf = string | ((props: any) => unknown)

/**
 * Host ref lifecycle, matching the octane universal contract: a callback that
 * may return a cleanup function, a `{ current }` object, an array of refs
 * (nested arrays flatten), or null/undefined.
 */
export type Ref<TElement> =
	| ((instance: TElement | null) => void | (() => void))
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

/** Values accepted by `className` and `class` (clsx-style composition). */
export type ClassValue =
	| string
	| boolean
	| null
	| undefined
	| readonly ClassValue[]
	| { readonly [className: string]: unknown }

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
	style?: string | StyleProps
	id?: string
	/**
	 * Name of the property on a slot-hosting parent (e.g. a drawer's
	 * `mainContent` / `leftDrawer`) this child should be assigned to instead
	 * of being added as a regular layout child.
	 */
	hostSlot?: string
	row?: number | string
	col?: number | string
	rowSpan?: number | string
	colSpan?: number | string
	dock?: 'top' | 'right' | 'bottom' | 'left'
	left?: number | string
	top?: number | string
	right?: number | string
	bottom?: number | string
	flexGrow?: number | string
	flexShrink?: number | string
	flexWrapBefore?: boolean | string
	alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'
	order?: number | string
	horizontalAlignment?: 'left' | 'center' | 'right' | 'stretch'
	verticalAlignment?: 'top' | 'middle' | 'bottom' | 'stretch'
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
	onTap?: (event: TapEvent<TElement>) => void
	/** Alias for `onTap`. */
	onClick?: (event: TapEvent<TElement>) => void
	/** Alias for `onTap`. */
	onPress?: (event: TapEvent<TElement>) => void
	onDoubleTap?: (event: TapEvent<TElement>) => void
	onLongPress?: (event: TapEvent<TElement>) => void
	onSwipe?: (event: SwipeGestureEvent<TElement>) => void
	onPan?: (event: PanGestureEvent<TElement>) => void
	onPinch?: (event: PinchGestureEvent<TElement>) => void
	onRotation?: (event: RotationGestureEvent<TElement>) => void
	onTouch?: (event: TouchGestureEvent<TElement>) => void
	/** Alias for `onTextChange`. */
	onChange?: (event: ValueChangeEvent<TElement>) => void
	/** Alias for `onReturnPress`. */
	onSubmit?: (event: NativeEvent<TElement>) => void
	onFocus?: (event: NativeEvent<TElement>) => void
	onBlur?: (event: NativeEvent<TElement>) => void
	onLoaded?: (event: NativeEvent<TElement>) => void
	onUnloaded?: (event: NativeEvent<TElement>) => void
	onLayoutChanged?: (event: NativeEvent<TElement>) => void
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
 *  every native target. Raw Mason/CSS style keys (`display`, `position`,
 *  grid tracks, overflow, insets, …) are style-only: set them through
 *  `style={{…}}` or `className`, never as direct props. What remains here is
 *  the shared component contract: flex-container props (FlexContainerProps
 *  vocabulary) and the LayoutChildProps placement sugar — row/col/rowSpan/
 *  colSpan become grid lines, left/top/right/bottom and dock become absolute
 *  insets, and horizontalAlignment/verticalAlignment map to self-alignment
 *  on the parent's axes. */
export interface MasonViewProps {
	flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
	flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
	justifyContent?:
		| 'flex-start'
		| 'flex-end'
		| 'center'
		| 'space-between'
		| 'space-around'
		| 'space-evenly'
	alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'
	alignContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch'
	gap?: number | string
	rowGap?: number | string
	columnGap?: number | string
	flexGrow?: number
	flexShrink?: number
	alignSelf?: string
	order?: number
	// LayoutChildProps sugar — see the interface doc.
	row?: number
	col?: number
	rowSpan?: number
	colSpan?: number
	dock?: 'left' | 'top' | 'right' | 'bottom'
	left?: number | string
	top?: number | string
	right?: number | string
	bottom?: number | string
	horizontalAlignment?: 'left' | 'right' | 'center' | 'stretch'
	verticalAlignment?: 'top' | 'bottom' | 'middle' | 'center' | 'stretch'
}

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
	onTextChange?: (event: ValueChangeEvent<TElement, string>) => void
	onReturnPress?: (event: NativeEvent<TElement>) => void
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
	onTextChange?: (event: ValueChangeEvent<TElement, string>) => void
}

export interface SearchBarProps<TElement> {
	text?: string
	hint?: string
	onTextChange?: (event: ValueChangeEvent<TElement, string>) => void
	onSubmit?: (event: NativeEvent<TElement>) => void
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
	onCheckedChange?: (event: ValueChangeEvent<TElement, boolean>) => void
}

export interface SliderProps<TElement> {
	value?: number
	minValue?: number
	maxValue?: number
	isEnabled?: boolean
	onValueChange?: (event: ValueChangeEvent<TElement, number>) => void
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
	onSelectedIndexChange?: (event: IndexChangeEvent<TElement>) => void
}

export interface SegmentedBarProps<TElement> {
	/** Upstream `SegmentedBarItem[]`. */
	items?: readonly HostObject[]
	selectedIndex?: number
	onSelectedIndexChange?: (event: IndexChangeEvent<TElement>) => void
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
	onDateChange?: (event: ValueChangeEvent<TElement, Date>) => void
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
	onTimeChange?: (event: ValueChangeEvent<TElement, Date>) => void
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
	onItemLoading?: (event: ItemEvent<TElement>) => void
	onItemTap?: (event: ItemEvent<TElement>) => void
	onLoadMoreItems?: (event: NativeEvent<TElement>) => void
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
	onSelectedIndexChange?: (event: IndexChangeEvent<TElement>) => void
	onSelectedIndexChanged?: (event: IndexChangeEvent<TElement>) => void
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
	onNavigatedTo?: (event: NativeEvent<TElement>) => void
	onNavigatedFrom?: (event: NativeEvent<TElement>) => void
	onNavigatingTo?: (event: NativeEvent<TElement>) => void
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
	onLoadStarted?: (event: WebViewEvent<TElement>) => void
	onLoadFinished?: (event: WebViewEvent<TElement>) => void
	onLoadError?: (event: WebViewEvent<TElement>) => void
}

export interface ScrollViewProps<TElement> {
	orientation?: 'horizontal' | 'vertical'
	scrollBarIndicatorVisible?: boolean
	isScrollEnabled?: boolean
	onScroll?: (event: ScrollEvent<TElement>) => void
}

export interface PlaceholderProps<TElement> {
	/** Fired once the placeholder is attached; the handler assigns `event`'s view. */
	onCreatingView?: (event: NativeEvent<TElement> & { view?: HostObject }) => void
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
	onFinished?: (event: NativeEvent<TElement>) => void
	onPlaybackReady?: (event: NativeEvent<TElement>) => void
	onPlaybackStart?: (event: NativeEvent<TElement>) => void
	onCurrentTimeUpdated?: (event: NativeEvent<TElement> & { position?: number }) => void
	onError?: (event: NativeEvent<TElement> & { error?: unknown }) => void
}

export interface CanvasProps<TElement> {
	width?: number | string
	height?: number | string
	onReady?: (event: NativeEvent<TElement>) => void
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
	onItemLoading?: (event: ItemEvent<TElement>) => void
	onItemDisposing?: (event: ItemEvent<TElement>) => void
	onSelectedIndexChange?: (event: IndexChangeEvent<TElement>) => void
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
