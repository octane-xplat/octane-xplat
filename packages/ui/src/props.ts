/** Shared prop/type contract — the single source of truth for the public
 *  API surface. Platform leaves import these types so prop shapes cannot
 *  drift across .web/native-default, and `tsrx-typegen` emits the package's
 *  declarations from its public entrypoints and component leaves. No imports
 *  here: the shared contracts stay dependency-free and platform-agnostic. */

// ---------- gestures ----------

export interface PanEvent {
	x: number
	y: number
	dx: number
	dy: number
	vx: number
	vy: number
	state: string
	target: any
}

export interface SwipeEvent {
	direction: number
}

/** Public shape of `setTranslate` — the imperative translate write on a
 *  bound view (a leaf's `bind` target). Web composes into the element's
 *  `transform`; native sets the view's translateX/translateY props.
 *  Both axes default to 0, so `setTranslate(el)` resets. */
export type SetTranslate = (el: any, x?: number, y?: number) => void

// ---------- primitives ----------

/** Metadata read by parent layouts. Native forwards NativeScript attached
 *  attributes; web folds the CSS equivalents into the child's style. */
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

/** JSON-compatible modifier data accepted by the platform-authentic widgets. */
export type NativeModifierValue =
	| string
	| number
	| boolean
	| null
	| readonly NativeModifierValue[]
	| { readonly [key: string]: NativeModifierValue }

/** A serializable change to a NativeScript view's style or native property.
 *  Platform-specific UI subpaths apply modifier arrays after shared props and
 *  the matching `ios`/`android` escape bag. */
export type NativeModifier =
	| { type: 'style'; values: Record<string, NativeModifierValue | undefined> }
	| { type: 'property'; name: string; value: NativeModifierValue }

/** Adds the native-only modifier escape hatch to an OS-backed widget's props. */
export type PlatformWidgetProps<Props> = Props & {
	modifiers?: readonly NativeModifier[]
}

/** Native glyph names for the OS-authentic UI subpaths. */
export interface PlatformIconChoice {
	ios: string
	android: string
}

/** Flex-container props shared by View/Row/Pressable — RN vocabulary, applied
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

/** Liquid Glass material config. Native maps it to `iosGlassEffect`
 *  (iOS 26+; inert on Android and older iOS), web to the `vx-glass`
 *  backdrop-filter approximation. `variant:'clear'` is the faint,
 *  mostly-transparent glass; `'regular'` is Apple's default. */
export interface GlassConfig {
	variant?: 'regular' | 'clear' | 'identity' | 'none'
	/** Touch-tracking highlight — only meaningful on <LiquidGlass>; the
	 *  per-view glass applied by `glass` never receives touches upstream. */
	interactive?: boolean
	tint?: string
	/** (LiquidGlassContainer only) merge distance between glass siblings. */
	spacing?: number
	/** Effect-change animation in ms (default 300). */
	animateChangeDuration?: number
}

export interface GridProps extends AccessibilityProps {
	className?: any
	style?: any
	children?: any
	rows?: string
	columns?: string
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
}

export interface StackProps extends AccessibilityProps {
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
}

export interface AbsoluteProps extends AccessibilityProps {
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
}

/** Interactive glass surface — the element root IS the platform's glass
 *  effect view (NS `LiquidGlass`, a UIVisualEffectView hosting children).
 *  Real material on iOS 26+; inert layout on Android and older iOS;
 *  backdrop-filter approximation on web. */
export interface LiquidGlassProps extends LayoutChildProps {
	className?: any
	style?: any
	children?: any
	id?: string
	variant?: 'regular' | 'clear'
	interactive?: boolean
	tint?: string
	animateChangeDuration?: number
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

/** Merged-glass region — sibling glass elements inside morph together
 *  across `spacing` dips (NS `LiquidGlassContainer`, an AbsoluteLayout:
 *  children position via left/top). */
export interface LiquidGlassContainerProps extends LayoutChildProps {
	className?: any
	style?: any
	children?: any
	id?: string
	spacing?: number
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

export interface SpacerProps {
	className?: any
	style?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
}

/** The shared accessibility prop set — `Role` and friends are declared
 *  below; containers and leaf components carry the same names so ARIA on
 *  web and NativeScript's accessibility properties stay aligned. */
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

export interface ViewProps extends LayoutChildProps, FlexContainerProps, AccessibilityProps {
	className?: any
	style?: any
	children?: any
	id?: string
	/** `ref` is runtime-reserved on component elements — leaves expose
	 *  `bind` to reach the native/DOM node. */
	bind?: (el: any) => void
	onPan?: (e: PanEvent) => void
	onSwipe?: (e: SwipeEvent) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface RowProps extends LayoutChildProps, FlexContainerProps, AccessibilityProps {
	className?: any
	style?: any
	children?: any
	id?: string
	/** `ref` is runtime-reserved on component elements — leaves expose
	 *  `bind` to reach the native/DOM node. */
	bind?: (el: any) => void
	onPan?: (e: PanEvent) => void
	onSwipe?: (e: SwipeEvent) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Shared accessibility roles. The native leaf maps the ARIA spellings that
 * NativeScript names differently (for example `heading` → `header`). */
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

export interface TextProps extends LayoutChildProps {
	className?: any
	style?: any
	children?: any
	id?: string
	numberOfLines?: number
	ellipsize?: boolean
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
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Inline rich text container. Children should be RichTextSpan components so
 * the native leaf can preserve each run as a NativeScript Span. */
export interface RichTextProps extends LayoutChildProps {
	className?: any
	style?: any
	children?: any
	id?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** One styled or tappable inline run inside RichText. `text` is an explicit
 * native-safe escape hatch; a single string child is also accepted. */
export interface RichTextSpanProps {
	className?: any
	style?: any
	children?: any
	text?: string
	onPress?: () => void
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface PressableProps extends LayoutChildProps, FlexContainerProps {
	className?: any
	style?: any
	children?: any
	id?: string
	disabled?: boolean
	/** `ref` is runtime-reserved on component elements — leaves expose
	 *  `bind` to reach the native/DOM node. */
	bind?: (el: any) => void
	onPan?: (e: PanEvent) => void
	onSwipe?: (e: SwipeEvent) => void
	onPress?: () => void
	/** ~500ms press-and-hold (web: timer over pointerdown/up). */
	onLongPress?: () => void
	accessible?: boolean
	accessibilityLabel?: string
	accessibilityRole?: Role
	onPressIn?: () => void
	onPressOut?: () => void
	onDoublePress?: () => void
	hitSlop?: number
	accessibilityHint?: string
	accessibilityValue?: string
	accessibilityState?: {
		disabled?: boolean
		selected?: boolean
		checked?: boolean
	}
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface TextInputHandle {
	focus(): void
	blur(): void
	native: any
}

export type FieldStatusType = 'warning' | 'error' | 'success'

/** Portable validation status shared by field controls. */
export interface FieldStatus {
	type: FieldStatusType
	message?: string
}

export type FieldControlSize = 'sm' | 'md' | 'lg'

/** Shared, platform-neutral field vocabulary. */
export interface FieldControlProps {
	label?: string
	description?: string
	isLabelHidden?: boolean
	isDisabled?: boolean
	isReadOnly?: boolean
	/** Indicates asynchronous work associated with the field. */
	isLoading?: boolean
	isRequired?: boolean
	isOptional?: boolean
	size?: FieldControlSize
	status?: FieldStatus
	statusVariant?: 'attached' | 'detached'
}

export interface TextInputProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	value?: string
	placeholder?: string
	onChange?: (value: string) => void
	/** Optional explicit accessible name override for the input. */
	accessibilityLabel?: string
	bind?: (h: TextInputHandle) => void
	secure?: boolean
	keyboardType?: 'default' | 'email' | 'number' | 'decimal' | 'phone' | 'url'
	returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send'
	onSubmit?: () => void
	onFocus?: () => void
	onBlur?: () => void
	/** Draw a clear action while the field has a value. Defaults to false. */
	hasClear?: boolean
	/** Called after a clear action reports an empty value. */
	onClear?: () => void
	placeholderTextColor?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface TextAreaProps extends Omit<TextInputProps, 'hasClear' | 'onClear'> {
	/** Submit on native only when `returnKeyType` is `done` or `send`; other
	 * returns insert newlines because TextView emits returnPress per newline.
	 * Web submits on Cmd/Ctrl+Enter. */
	/** Height in text rows. Web: the `rows` attr (fixed box); native:
	 *  minHeight at the widget's measured line height. With `autoGrow` it
	 *  becomes the starting height instead of a fixed one. */
	rows?: number
	/** Grow on input and value updates, capped by `maxRows`, including when
	 *  `value` is omitted. Native TextView grows by
	 *  default — this prop exists so web (<textarea> is fixed-rows) matches;
	 *  without it, native gets a fixed `rows`-high box like web. */
	autoGrow?: boolean
	/** Growth cap in rows — past it the field scrolls internally. Native:
	 *  maxHeight at measured line height (TextView's own `maxLines` only
	 *  sets truncation on iOS — not a cap). */
	maxRows?: number
}

/** Chrome-reset search field — TextInput with a leading glyph and a clear
 *  affordance, normalized: the web leaf is `<input type="search">` with the
 *  engine's own clear button hidden (the leaf draws the same one native
 *  gets), the native leaf is a styled TextField with `returnKeyType`
 *  `'search'`. Not UISearchBar — OS search chrome is deliberately absent. */
export interface SearchInputProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	/** Controlled text — pair with `onChange`. */
	value?: string
	/** Initial text for uncontrolled use. */
	defaultValue?: string
	onChange?: (value: string) => void
	/** Enter on web, the keyboard's `search` return key on native. */
	onSubmit?: () => void
	/** The clear button tapped — fires after `onChange('')`. */
	onClear?: () => void
	onFocus?: () => void
	onBlur?: () => void
	placeholder?: string
	hasClear?: boolean
	/** Leading glyph — a registered icon name. Defaults to the built-in
	 *  `'xplat-search'` glyph; `false` renders no glyph. */
	icon?: string | false
	bind?: (h: TextInputHandle) => void
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Pull-to-refresh contract — shared by `ScrollView` and the platform
 *  lists (`UITableView`/`RecyclerView`). The indicator is self-drawn (the
 *  `vx-spinner` ring), not the OS spinner, so the affordance is the same
 *  pixels on every target. The pull gesture is enabled by `onRefresh`;
 *  `refreshing` is controlled — set it true while reloading to keep the
 *  indicator docked, false to collapse it. */
export interface RefreshProps {
	/** True while a refresh is in flight — docks the indicator strip above
	 *  the content. Read-only after the initial pull: the app owns it. */
	refreshing?: boolean
	/** Enables the pull gesture; fires when the user pulls past
	 *  `refreshThreshold` and releases. */
	onRefresh?: () => void
	/** Pull distance past the top edge (px on web, dip on native) whose
	 *  release fires `onRefresh`. Defaults to the indicator strip height
	 *  (64). */
	refreshThreshold?: number
}

export interface ListProps extends RefreshProps {
	className?: any
	style?: any
	id?: string
	items: any[]
	renderItem: (item: any, index: number) => any
	renderEmpty?: () => any
	/** iOS row-height estimate (UITableView only). */
	estimatedItemHeight?: number
	/** Called when the list approaches its end. */
	onEndReached?: () => void
	/** Platform escape hatches, applied after the shared props. */
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

export interface ScrollViewProps extends LayoutChildProps, AccessibilityProps, RefreshProps {
	className?: any
	style?: any
	id?: string
	horizontal?: boolean
	children?: any
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Shared virtualized vertical list. Item keys must be unique and stable
 *  across inserts and reorders. Rows outside the rendered window unmount;
 *  keep durable row state keyed by item identity outside the row component. */
export interface VirtualListProps<T = any> extends LayoutChildProps, AccessibilityProps {
	className?: any
	style?: any
	id?: string
	items: readonly T[]
	keyExtractor: (item: T, index: number) => string | number
	getItemType?: (item: T, index: number) => string | number
	renderItem: (item: T, index: number) => any
	renderEmpty?: () => any
	renderHeader?: () => any
	renderFooter?: () => any
	renderSeparator?: () => any
	/** Platform-specific properties are applied after shared props. */
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

/** Scrollable ordinary content on web. Native is an inline flex container so
 * a child ListView can own the scrolling without nesting recycling views in a
 * native ScrollView. */
export interface ScrollBoxProps extends LayoutChildProps, AccessibilityProps {
	className?: any
	style?: any
	id?: string
	children?: any
	/** Platform-specific properties are applied after the shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface WebViewHandle {
	/** Re-request the current document. */
	reload(): void
	/** Frame-local history navigation. */
	goBack(): void
	goForward(): void
	stopLoading(): void
	/** The platform view (`HTMLIFrameElement` / NS `WebView`). */
	native: any
}

export interface WebViewLoadEvent {
	/** The loaded document URL when the platform reports one — absent for
	 *  `html` documents. */
	url?: string
	/** Failure description; present only on the `onError` path. */
	error?: string
}

export interface WebViewContentSize {
	width: number
	height: number
}

/** Embedded web document — chrome-reset bucket: web renders a sandboxed
 *  `<iframe>`, native renders the OS web view (`webview` → WKWebView /
 *  android.webkit.WebView). The *frame* is normalized; the document's
 *  pixels belong to each platform's engine, same as TextInput's IME.
 *  No JS bridge: iframe `postMessage`, WKScriptMessageHandler, and
 *  `addJavascriptInterface` have different page-side contracts, so a
 *  shared one would be fake parity — reach it through the escape bags. */
export interface WebViewProps extends LayoutChildProps, AccessibilityProps {
	className?: any
	style?: any
	id?: string
	/** Remote document URL. Native also accepts `~/` bundle paths and
	 *  absolute file paths (NS `src` grammar). */
	src?: string
	/** Inline HTML document — web `srcdoc`; native loads it through the
	 *  `src` property's data path (`loadHTMLString`/`loadDataWithBaseURL`).
	 *  Takes precedence over `src` when both are set. Treated as trusted
	 *  content — the default web sandbox keeps `allow-same-origin`, so a
	 *  srcdoc document can reach the embedding page. */
	html?: string
	/** After each successful document load (web `load`; native
	 *  `loadFinished` without an error). */
	onLoad?: (e: WebViewLoadEvent) => void
	/** Report the embedded document's measured size when the platform can read
	 *  it. Cross-origin browser frames cannot be inspected. */
	onLayoutContent?: (size: WebViewContentSize) => void
	/** Resize the host to the embedded document's measured height. Browser
	 *  frames must be same-origin; native measurement is best-effort. */
	matchContents?: boolean
	/** On load failure. Native reports the NS `loadFinished` error string;
	 *  web maps the iframe `error` event, which does not fire reliably
	 *  cross-browser — treat as best-effort there. */
	onError?: (e: WebViewLoadEvent) => void
	/** Default true. `false` freezes inner scrolling: web writes
	 *  `scrolling="no"`, iOS clears the WKWebView scrollView's
	 *  `scrollEnabled`, Android eats move touch events on the view (link
	 *  taps still pass; drag text selection inside the frame is lost). */
	scrollEnabled?: boolean
	/** Web only — the iframe `sandbox` token list. Defaults to
	 *  `'allow-scripts allow-same-origin allow-forms allow-modals'`: the
	 *  capabilities NS WebView content already has, while top navigation,
	 *  popups, and downloads stay contained. Pass a token list to tighten,
	 *  `false` for no sandbox attribute. Ignored on native — the OS web
	 *  views are already isolated processes. */
	sandbox?: string | false
	/** Imperative handle — reload/back/forward/stop plus `native` for
	 *  anything the shared props don't cover. */
	bind?: (h: WebViewHandle) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface ImageProps extends LayoutChildProps {
	className?: any
	style?: any
	id?: string
	src: string
	alt?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface ScreenProps {
	className?: any
	style?: any
	children?: any
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
	id?: string
}

// ---------- device seams ----------

export interface SafeAreaProps {
	className?: any
	style?: any
	children?: any
	/** Do not inset the child away from the system's safe area. */
	ignoreSafeArea?: boolean
	/** NativeScript props applied to the host after shared props. */
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
}

export interface KeyboardAvoidingProps {
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
}

export interface DrawerProps {
	className?: any
	style?: any
	id?: string
	main?: any
	drawer?: any
	open?: boolean
	/** Backdrop tap — the self-drawn leaf fires it on both platforms. */
	onDismiss?: () => void
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

export interface SwitchProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	checked?: boolean
	onCheckedChange?: (checked: boolean) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface ActivityIndicatorProps {
	className?: any
	style?: any
	id?: string
	busy?: boolean
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

export interface MeterProps {
	className?: any
	style?: any
	id?: string
	children?: any
	value: number
	max?: number
	size?: number
	strokeWidth?: number
	color?: string
	trackColor?: string
	accessibilityLabel?: string
}

export interface SliderProps {
	className?: any
	style?: any
	id?: string
	value: number
	minValue?: number
	maxValue?: number
	disabled?: boolean
	onValueChange?: (value: number) => void
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

export interface IconProps {
	className?: any
	id?: string
	name: string
	size?: number
	color?: string
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

/** One registered icon representation. `svg` contains path `d` data;
 *  `markup` is full inner-SVG markup (groups, transforms, several paths)
 *  rendered inside an `<svg viewBox>` shell on web and through `svgview`
 *  (ui-svg) on native. `font`, `src`, and `text` are fallback
 *  representations, in that order after SVG. `src` may be a raster source or
 *  an SVG source; SVG is auto-detected for inline markup, SVG data URIs, and
 *  `.svg` paths/URLs. Opaque resource names need `markup`/`svg` when their
 *  format cannot be inferred from the string. */
export interface IconGlyph {
	svg?: string
	markup?: string
	viewBox?: string
	text?: string
	font?: { family: string; glyph: string }
	src?: string
}

export interface HeadingProps {
	className?: any
	style?: any
	children?: any
	id?: string
	level?: 1 | 2 | 3 | 4 | 5 | 6
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

// ---------- overlays ----------

export interface OverlayProps {
	open?: boolean
	onDismiss?: () => void
	/** Enables a RootLayout shade that dismisses when tapped. */
	shadeCover?: boolean
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'

/** A platform-neutral ref to the host view or element that owns a popover. */
export interface PopoverAnchorRef {
	readonly current: unknown
}

export interface PopoverProps {
	/** Ref to a native view or web element, commonly populated by `bind`. */
	anchor: PopoverAnchorRef
	open?: boolean
	placement?: PopoverPlacement
	/** Alignment along the edge adjoining the anchor. */
	alignment?: 'start' | 'center' | 'end'
	dismissOnOutsideTap?: boolean
	onDismiss?: () => void
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

export interface HoverableProps {
	id?: string
	/** Content shown after the pointer rests over the children on pointer
	 *  platforms (web, macOS). Touch targets never mount the card — keep
	 *  essential information out of it. */
	card: any
	/** Styling for the card's wrapper view inside the popover — e.g. a
	 *  pointer bridge covering the anchor↔card gap or a positional offset. */
	cardClassName?: any
	cardStyle?: any
	children?: any
	openDelay?: number
	closeDelay?: number
	placement?: PopoverPlacement
	className?: any
	style?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

/** Tooltip — `trigger` is the anchor content, `content` the hint body.
 *  Pointer platforms show the hint after hover/focus intent (web adds
 *  `aria-describedby` + Escape/scroll dismissal; macOS presents an anchored
 *  NSPopover). Touch targets render the trigger and never mount the hint —
 *  keep essential information out of `content`. */
export interface TooltipProps {
	id?: string
	trigger: any
	content: any
	/** Styling for the tooltip panel inside the popover. */
	contentClassName?: any
	contentStyle?: any
	openDelay?: number
	closeDelay?: number
	placement?: PopoverPlacement
	disabled?: boolean
	className?: any
	style?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

export type ToastContent = string | (() => any)
export type ToastPosition =
	| 'top'
	| 'top-start'
	| 'top-end'
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end'

export interface ToastOptions {
	duration?: number
	position?: ToastPosition
	/** When set, the toast is positioned by Popover relative to this view. */
	anchor?: PopoverAnchorRef
	/** Placement used with `anchor`; `position` supplies the top/bottom default. */
	placement?: PopoverPlacement
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

// ---------- measurement ----------

export interface MeasureBounds {
	x: number
	y: number
	width: number
	height: number
}

export interface UseMeasureOptions {
	/** Re-measure on layout, resize, scroll, and content-size changes. Defaults to true. */
	observe?: boolean
}

export interface MeasureResult {
	/** Pass to a View's `bind` prop. */
	bind: (element: any) => void
	bounds: MeasureBounds | null
}

export interface ModalProps {
	open?: boolean
	onClose?: (result?: ModalOpenResult) => void
	fullscreen?: boolean
	/** Native: sheet uses fullscreen=false (iOS form sheet; Android centered
	 *  dialog), fullscreen uses fullscreen=true. Web: dialog is a centered
	 *  card, sheet is bottom-anchored, fullscreen is the default dialog size. */
	presentation?: 'sheet' | 'fullscreen' | 'dialog'
	/** Component reference rendered inside the modal's separate root. When
	 *  both component and children are set, component takes precedence. */
	component?: any
	/** Props passed to component. Context and theme do not cross modal roots. */
	params?: any
	children?: any
}

/** Options for `openModal`. `fullscreen` is retained for callers using the
 *  NativeScript option directly; `presentation` takes precedence when set.
 *  Android's non-fullscreen modal is a centered dialog, not a bottom sheet. */
export interface ModalOpenOptions {
	presentation?: 'sheet' | 'fullscreen' | 'dialog'
	fullscreen?: boolean
	animated?: boolean
}

/** Value supplied to a modal close callback and returned by `openModal`. */
export type ModalOpenResult = unknown

/** Public function shape of the imperative modal service. */
export type OpenModal = (
	component: any,
	params?: any,
	options?: ModalOpenOptions,
) => Promise<ModalOpenResult>

// ---------- sheet (in-window bottom panel) ----------

/** Declarative in-window sheet: bottom-anchored panel on the enclosing
 *  screen's RootLayout (native) or a document-body portal layer (web).
 *  Unlike `Modal presentation='sheet'` (system modal), content stays
 *  inside the app window — same window region as the declaring page. */
export interface SheetProps {
	open?: boolean
	/** Called when the shade is tapped or the sheet is dismissed by the
	 *  platform — not on programmatic `open`→`false` transitions. */
	onDismiss?: () => void
	/** Dim backdrop + tap-to-dismiss (default true). */
	shadeCover?: boolean
	/** Snap heights as viewport-height fractions, e.g. `[0.25, 0.5, 1]` —
	 *  sorted ascending; the sheet opens at the smallest and drags between
	 *  detents via the grabber strip, releasing below half of the smallest
	 *  dismisses (same dismissal as a shade tap — `onDismiss` / resolve).
	 *  Absent → the panel keeps its content-sized height. In-window on
	 *  every target; OS sheet presentations stay in the platform
	 *  subpaths. */
	detents?: number[]
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}

/** Options for the imperative `openSheet` service. */
export interface SheetOpenOptions {
	shadeCover?: boolean
	/** Same contract as `SheetProps.detents`. */
	detents?: number[]
}

/** Imperative sheet: mounts `component` on a dedicated root in a bottom
 *  sheet and resolves with the value passed to `close(result)`. The
 *  component receives `{ params, close }`. */
export type OpenSheet = (
	component: any,
	params?: any,
	options?: SheetOpenOptions,
) => Promise<ModalOpenResult>

// ---------- tabs / navigation shells ----------

export interface TabSpec {
	title: string
	/** Registered icon name (see `registerIcons`). The shared self-drawn
	 *  `Tabs` renders the glyph through `Icon` on every platform. The
	 *  platform tab bars (`UITabBar`/`BottomNavigationView` in the ios/
	 *  android subpaths) consume the glyph's `src` (a NativeScript
	 *  iconSource URI — `sys://` SF Symbol, `res://`, `font://`, file
	 *  path) or `font`/`text` representation; `svg`/`markup`-only glyphs
	 *  warn and render title-only there. */
	icon?: string
	render: () => any
	/** Named parallel stack — the pane is the route outlet for `stack`
	 *  (pushed screens render in place). The platform tab bars host a real
	 *  Frame per such pane. */
	stack?: string
}

export interface TabsProps {
	className?: any
	style?: any
	id?: string
	tabs: readonly TabSpec[]
	selectedIndex?: number
	onSelectedIndexChanged?: (index: number) => void
	/** Renders a pushed route's screen by name (the app owns the table).
	 *  Web: route outlet. Native: pushes render inside the pane's Frame. */
	resolveScreen?: (name: string, params: Record<string, unknown>) => any
}

/** Platform tab-bar item shape. `icon` may be a registered name or a native
 *  asset value returned by `Icon.select()` from the matching subpath. */
export type PlatformTabSpec = Omit<TabSpec, 'icon'> & {
	icon?: string
}

export type PlatformTabsProps = Omit<TabsProps, 'tabs'> & {
	tabs: readonly PlatformTabSpec[]
	ios?: Record<string, any>
	android?: Record<string, any>
}

// ---------- routes ----------

export interface Route {
	stack: string
	name: string
	params: Record<string, unknown>
	/** 'push' (default) pushes onto the stack · 'modal' opens its own root
	 *  (native: `showModal`; web: overlay pane, URL preserved) · 'fade' is a
	 *  push with a fade transition. A `+modal`/`+fade` filename suffix in
	 *  the route dir sets the manifest default; this field overrides it. */
	presentation?: 'push' | 'modal' | 'fade'
	/** Loader result supplied to the route screen as `data`. */
	loaderData?: unknown
	/** Loader rejection supplied to the route screen as `error`. */
	loaderError?: unknown
	/** Context returned by the route's `beforeLoad` export. It is merged into
	 * screen props and remains available from `useRoute`. */
	context?: RouteContext
}

/** Values shared by a route guard and the screen it admits. */
export type RouteContext = Record<string, unknown>

export interface BeforeLoadArgs {
	params: Record<string, unknown>
	context: RouteContext
}

export type BeforeLoad = (
	args: BeforeLoadArgs,
) => RouteContext | void | Promise<RouteContext | void>

/** The deliberately small cross-platform head surface. `meta` keys become
 * web `<meta name="..." content="...">` tags; native consumes `title`. */
export interface RouteHead {
	title?: string
	meta?: Record<string, string>
}

export type RouteHeadExport = RouteHead | ((params: Record<string, unknown>) => RouteHead)

export interface LinkProps {
	href: string
	target?: string
	className?: any
	children?: any
}

export interface NavLinkProps {
	route: Route
	activeClassName?: string
	className?: any
	children?: any
}

/** name → screen component table for `registerScreens` — the app owns the
 *  route table; native `pushRoute` resolves `route.name` through it and
 *  web outlets fall back to it via `screenFor`. Values are component
 *  functions (`() => Element` / UniversalComponent shapes both fit). */
export type ScreenTable = Record<string, any>

/** One route file's entry in the derived manifest. `name` is the file
 *  path under the route dir with `[param]` segments normalized to
 *  `:param` (`app/demo/[id].tsrx` → `demo/:id`); `segments` is the URL
 *  pattern used for web path matching/substitution. */
export interface RouteMeta {
	name: string
	segments: string[]
	params: string[]
	/** Source file (glob key) — diagnostics only. */
	file: string
	/** Declared default presentation — set by a `+modal`/`+fade` filename
	 *  suffix (`app/settings+modal.tsrx` → route 'settings', modal). */
	presentation?: 'push' | 'modal' | 'fade'
	/** Optional `loader` named export — a prefetch hook, not a data layer.
	 *  pushRoute fires it (fire-and-forget) before navigating so the
	 *  screen's `query$` reads hit a warm cache; boot/deep-link routes
	 *  skip it (the screen mounts in the same tick anyway). Ignored when
	 *  `dataMode: 'baked'` — baked routes resolve from `manifest.baked`. */
	loader?: (params: Record<string, unknown>) => unknown
	/** Data provenance: 'live' (default) runs `loader` at navigation;
	 *  'baked' reads build-time output from the manifest's `baked` map —
	 *  for file routes the loader lives in a `<route>.loader.ts` sibling
	 *  that `xplat routes`/`xplat build` executes and never bundles. */
	dataMode?: RouteDataMode
	/** Optional guard awaited before a push commits. A thrown `redirect(...)`
	 * short-circuits the attempted route. */
	beforeLoad?: BeforeLoad
	/** Optional route title/meta declaration, or a params-only function. */
	head?: RouteHeadExport
}

/** How a route's data is produced — `'live'` runs the loader at navigation,
 *  `'baked'` freezes loader output into the bundle at build time. */
export type RouteDataMode = 'live' | 'baked'

/** Output of `deriveRouteManifest` — `screens` feeds `registerScreens`
 *  (native pushRoute + web outlet fallback), `routes` feeds web URL
 *  matching, `layouts` catalogs `_layout` files by directory ('' = root). */
export interface RouteManifest {
	screens: ScreenTable
	routes: RouteMeta[]
	layouts: Record<string, any>
	loaders?: Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>>
	/** Build-time loader output for `dataMode: 'baked'` routes — the
	 *  generated `routes.gen.*` glue assigns it from `routes.gen.data`;
	 *  programmatic hosts pass it on `RouteSpecSet`/`addRoutes` directly. */
	baked?: Record<string, unknown>
}

/** One programmatic route entry for `defineRoutes` — the manifest fields a
 *  route file would have produced, supplied directly. `path` uses the
 *  route-dir vocabulary: `'docs/:slug'` (or `'docs/[slug]'`), `'index'`/`''`
 *  for the root route. `screen` is the component itself — not a module. */
export interface RouteSpec {
	path: string
	screen: any
	/** Default presentation, like a `+modal`/`+fade` filename suffix. */
	presentation?: 'push' | 'modal' | 'fade'
	loader?: RouteMeta['loader']
	dataMode?: RouteDataMode
	beforeLoad?: BeforeLoad
	head?: RouteHeadExport
	/** Diagnostics label recorded on `RouteMeta.file` (warn strings). */
	source?: string
}

/** Input to `defineRoutes`: the route list plus optional path-keyed layouts
 *  — `layouts: { docs: Shell }` plays the `_layout.tsrx` role for every
 *  route under `docs/*`. `baked` carries build-time data for
 *  `dataMode: 'baked'` specs — the host computes it (a content dir read, a
 *  build step) and ships it in the manifest. */
export interface RouteSpecSet {
	routes: readonly RouteSpec[]
	layouts?: Record<string, any>
	baked?: Record<string, unknown>
}

/** The host-consumable route schema — what `xplat routes` writes to
 *  `routes.gen.manifest.json` and `manifestToJson` produces from any
 *  RouteManifest. Same shape whether the routes came from the file dir
 *  or `defineRoutes`, so an external host (e.g. a web SSR tier) consumes
 *  one normalized list. `loader`/`guard`/`head` are presence flags — the
 *  functions don't cross the JSON boundary. */
export interface RouteManifestJson {
	version: 1
	/** Layout dirs present, '' = the root `_layout` — sorted. */
	layouts: string[]
	/** Registered screen names, including any without a URL pattern. */
	screens: string[]
	routes: RouteJson[]
}

export interface RouteJson {
	name: string
	/** Colon-syntax path — 'docs/:slug', '' for the root index. */
	path: string
	params: string[]
	presentation?: 'push' | 'modal' | 'fade'
	dataMode?: RouteDataMode
	/** Layout dirs applying to this route, root '' first, innermost last. */
	layouts: string[]
	/** Source label — file path or `programmatic:<path>`. */
	source: string
	loader: boolean
	guard: boolean
	head: boolean
}

// ---------- programmatic route typing ----------

/** Phantom key carrying a `defineRoutes` manifest's spec-derived route
 *  types — type-level only, never present at runtime. Module-private so the
 *  published declarations carry no value binding for it. */
declare const specRouteTypes: unique symbol

/** ':id' or '[id]' segment → 'id'; a static segment contributes nothing. */
type RouteParamOf<S extends string> = S extends `:${infer P}`
	? P
	: S extends `[${infer P}]`
		? P
		: never

type TrimSlashes<P extends string> = P extends `/${infer R}`
	? TrimSlashes<R>
	: P extends `${infer R}/`
		? TrimSlashes<R>
		: P

/** Route-dir vocabulary at the type level: '[id]' normalizes to ':id'. */
type NormSegment<S extends string> = S extends `[${infer P}]` ? `:${P}` : S

type NormPath<P extends string> = P extends `${infer Head}/${infer Tail}`
	? `${NormSegment<Head>}/${NormPath<Tail>}`
	: NormSegment<P>

/** The route name a spec `path` produces — `''`/`'index'` and a trailing
 *  'index' segment normalize like `specSegments` does at runtime. */
export type RouteNameOfPath<P extends string> =
	NormPath<TrimSlashes<P>> extends infer N extends string
		? N extends '' | 'index'
			? 'index'
			: N extends `${infer R}/index`
				? R
				: N
		: never

/** Param names in a spec path — `'docs/[slug]'` and `'docs/:slug'` both
 *  give `'slug'`; static-only paths give `never`. */
export type RoutePathParams<Path extends string> =
	TrimSlashes<Path> extends infer P extends string
		? P extends `${infer Head}/${infer Tail}`
			? RouteParamOf<Head> | RoutePathParams<Tail>
			: RouteParamOf<P>
		: never

type RouteParamRecord<Path extends string> = { [K in RoutePathParams<Path>]: string }

type SpecPaths<Specs extends readonly RouteSpec[]> = Specs[number] extends infer S
	? S extends { path: infer P extends string }
		? P
		: never
	: never

type SpecsToParamMap<P extends string> = P extends string
	? { [N in RouteNameOfPath<P>]: RouteParamRecord<P> }
	: never

type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (
	value: infer I,
) => void
	? I
	: never

/** name → params map for a spec list — same shape `routes.gen.types.ts`
 *  emits for file routes, so the two merge with `&`/`|`. */
export type RouteParamsFromSpecs<Specs extends readonly RouteSpec[]> = UnionToIntersection<
	SpecsToParamMap<SpecPaths<Specs>>
>

type SpecPresentations<S> = S extends {
	path: infer P extends string
	presentation: infer Pr
}
	? { [N in RouteNameOfPath<P>]: Pr }
	: {}

export type RoutePresentationsFromSpecs<Specs extends readonly RouteSpec[]> = UnionToIntersection<
	SpecPresentations<Specs[number]>
>

/** The spec-derived typing record `defineRoutes` brands onto its manifest
 *  return — read it with the `ManifestRoute*` helpers, never directly. */
export interface SpecRouteInfo<Specs extends readonly RouteSpec[]> {
	readonly [specRouteTypes]: {
		params: RouteParamsFromSpecs<Specs>
		presentations: RoutePresentationsFromSpecs<Specs>
	}
}

/** Pull the `{name: params}` map out of a `defineRoutes` manifest's type —
 *  `RouteParams & ManifestRouteParams<typeof manifest>` merges file and
 *  programmatic routes into one typed navigation surface. A plain
 *  `RouteManifest` (untagged) extracts to `{}`, so `ManifestRouteNames`
 *  is `never` and unions degrade to the file-derived names. */
export type ManifestRouteParams<M> = M extends {
	readonly [specRouteTypes]: { params: infer P }
}
	? P
	: {}

export type ManifestRouteNames<M> = keyof ManifestRouteParams<M> & string

export type ManifestRoutePresentations<M> = M extends {
	readonly [specRouteTypes]: { presentations: infer P }
}
	? P
	: {}

export interface OpenWindowOptions {
	/** Data made available to the native window content resolver. */
	data?: Record<string, unknown>
	/** Optional URL used by the web window. */
	url?: string
}

// ---------- animation ----------

/**
 * Value returned by `useAnimation(initial, prop)`. On web, `prop` supports
 * translateX/translateY/translateZ, scale/scaleX/scaleY, rotate/rotateX/
 * rotateY, and skewX/skewY as CSS transforms, plus `opacity` and other CSS
 * style properties. On NativeScript, `prop` is the name of a NativeScript
 * view property (for example, `translateX` or `opacity`).
 */
export interface AnimatedValue {
	readonly value: number
	bind(el: any): void
	to(target: number, opts?: { duration?: number }): void
	spring(target: number, opts?: { damping?: number; stiffness?: number }): void
	stop(): void
}

// ---------- self-drawn components (Phase 1) ----------

/** Button composes Pressable — same-props/same-pixels, self-drawn. `loading`
 *  shows the spinner and blocks presses. */
export interface ButtonProps extends PressableProps {
	loading?: boolean
	/** Content rendered before children (e.g. an Icon). */
	leading?: any
	/** Content rendered after children. */
	trailing?: any
}

/** Collapsible shows/hides `children` behind a `trigger`. Controlled via
 *  `open`/`onOpenChange` or uncontrolled via `defaultOpen`. */
export interface CollapsibleProps {
	className?: any
	style?: any
	id?: string
	trigger?: any
	children?: any
	open?: boolean
	defaultOpen?: boolean
	disabled?: boolean
	onOpenChange?: (open: boolean) => void
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface AccordionItemSpec {
	key: string
	header?: any
	content?: any
	disabled?: boolean
}

/** Accordion — a list of Collapsibles. `open` is the open key (or keys with
 *  `multiple`); omit it for uncontrolled via `defaultOpen`. */
export interface AccordionProps {
	className?: any
	style?: any
	id?: string
	items: AccordionItemSpec[]
	multiple?: boolean
	open?: string | string[]
	defaultOpen?: string | string[]
	onOpenChange?: (open: string | string[]) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Self-drawn checkbox — box + check mark, identical pixels across targets. */
export interface CheckboxProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	checked?: boolean
	onCheckedChange?: (checked: boolean) => void
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface RadioOption {
	value: string
	label?: string
	isDisabled?: boolean
}

/** Self-drawn radio group — dot options in a column/row. */
export interface RadioGroupProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	options: RadioOption[]
	value?: string
	horizontal?: boolean
	onValueChange?: (value: string) => void
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Self-drawn segmented control — a row of equal-width segments in a track,
 *  one selected (UISegmentedControl / Material segmented-button shape, no OS
 *  chrome). `value`/`onValueChange` for controlled, `defaultValue` for
 *  uncontrolled; `disabled` on the group or per-option. Sizes come from
 *  className, matching the Button family. */
export interface SegmentedControlProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	options: RadioOption[]
	value?: string
	defaultValue?: string
	onValueChange?: (value: string) => void
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface MenuItem {
	key: string
	label?: string
	icon?: string
	disabled?: boolean
	onSelect?: () => void
}

/** DropdownMenu — `trigger` anchored to a self-drawn item list via Popover.
 *  Same anchored listbox on every target (decision #48). */
export interface DropdownMenuProps {
	className?: any
	style?: any
	id?: string
	/** Anchor content — rendered inside the trigger Pressable. */
	trigger?: any
	items: MenuItem[]
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	placement?: PopoverPlacement
	disabled?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** ContextMenu — same anchored list as DropdownMenu, opened by right-click
 *  on web and long-press on native. */
export interface ContextMenuProps {
	className?: any
	style?: any
	id?: string
	items: MenuItem[]
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	children?: any
	disabled?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Badge — inline label chip. Pure composition, unstyled beyond layout. */
export interface BadgeProps {
	className?: any
	style?: any
	id?: string
	children?: any
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Hairline rule between content. */
export interface SeparatorProps {
	className?: any
	style?: any
	id?: string
	orientation?: 'horizontal' | 'vertical'
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Skeleton — placeholder block shown while content loads. */
export interface SkeletonProps {
	className?: any
	style?: any
	id?: string
	width?: number
	height?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Avatar — circular image with a text fallback. */
export interface AvatarProps {
	className?: any
	style?: any
	id?: string
	src?: string
	alt?: string
	/** Fallback text (initials) shown when `src` is missing/fails. */
	fallback?: string
	size?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** AvatarGroup — overlapping row of avatars with an optional `+N` overflow. */
export interface AvatarGroupProps {
	className?: any
	style?: any
	id?: string
	children?: any
	/** Max avatars rendered; the rest collapse into a `+N` avatar. */
	max?: number
	size?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

// ---------- form field layer (Phase 2) ----------

/** FormField wraps a control with a label, description, and validation status.
 *  Children is the control element. */
export interface FormFieldProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	/** ID of the single control associated with this field's label. */
	inputID?: string
	labelTooltip?: string
	children?: any
	ios?: any
	android?: any
	web?: any
}

/** FieldGroup — labeled group of related fields (role=group). */
export interface FieldGroupProps {
	className?: any
	style?: any
	id?: string
	label?: string
	children?: any
	ios?: any
	android?: any
	web?: any
}

/** Shared settings/navigation row. Use the four shorthand props for common
 *  rows, or `ListItem.Leading`/`Content`/`Supporting`/`Trailing` children
 *  when the row needs custom composition. */
export interface ListItemProps extends AccessibilityProps {
	className?: any
	style?: any
	id?: string
	title?: any
	supportingText?: any
	leading?: any
	trailing?: any
	onPress?: () => void
	disabled?: boolean
	children?: any
}

export interface ListItemSlotProps {
	className?: any
	children?: any
}

export interface ListItemComponent {
	(props: ListItemProps): unknown
	Leading: (props: ListItemSlotProps) => unknown
	Content: (props: ListItemSlotProps) => unknown
	Supporting: (props: ListItemSlotProps) => unknown
	Trailing: (props: ListItemSlotProps) => unknown
}

/** InputNumber — normalized TextInput (number keyboard) flanked by −/+
 *  steppers. `value`/`onValueChange` for controlled, `defaultValue` for
 *  uncontrolled. `step` defaults to 1; `min`/`max` clamp. */
export interface InputNumberProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	value?: number
	defaultValue?: number
	min?: number
	max?: number
	step?: number
	placeholder?: string
	onValueChange?: (value: number) => void
	ios?: any
	android?: any
	web?: any
}

/** PinInput — a row of single-character cells that auto-advance on entry.
 *  `onComplete` fires when all `length` cells are filled. */
export interface PinInputProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	length?: number
	value?: string
	onValueChange?: (value: string) => void
	onComplete?: (value: string) => void
	secure?: boolean
	ios?: any
	android?: any
	web?: any
}

export interface SelectOption {
	value: string
	label?: string
	isDisabled?: boolean
}

/** Select — anchored self-drawn listbox on every target (decision #48).
 *  `multiple` keeps the listbox open and reports string[]; `searchable`
 *  puts a normalized TextInput filter at the top of the listbox. */
export interface SelectProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	options: SelectOption[]
	value?: string | string[] | null
	defaultValue?: string | string[] | null
	multiple?: boolean
	searchable?: boolean
	placeholder?: string
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	onValueChange?: (value: string | string[] | null) => void
	onClear?: () => void
	hasClear?: boolean
	placement?: PopoverPlacement
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

// ---------- Astryx parity: typeahead + token selection ----------

/** Minimal item contract for search results feeding the Typeahead family.
 *  `element` is a pre-rendered node that takes priority over `renderItem` and
 *  the default TypeaheadItem row; a string `auxiliaryData.group` groups
 *  results under a shared heading. */
export interface SearchableItem<TAuxData = any> {
	id: string
	label: string
	element?: any
	auxiliaryData?: TAuxData
}

/** Supplies items to Typeahead/Tokenizer. `search` runs on (debounced) query
 *  changes, `bootstrap` on focus when `hasEntriesOnFocus` is set, and
 *  `cancel` aborts superseded in-flight work — optional; without it stale
 *  results are discarded when they resolve. */
export interface SearchSource<T extends SearchableItem = SearchableItem> {
	search(query: string): Promise<T[]> | T[]
	bootstrap(): Promise<T[]> | T[]
	cancel?(): void
}

export interface CreateStaticSourceOptions<T extends SearchableItem = SearchableItem> {
	/** Extra search terms per item, matched alongside `label`. */
	keywords?: (item: T) => string[]
}

/** Imperative handle for the text input inside the Typeahead family,
 *  delivered through `bind`. `setQuery` rewrites the field's query text —
 *  it backs Typeahead's click-to-edit. */
export interface TypeaheadInputHandle {
	focus(): void
	blur(): void
	setQuery(query: string): void
	native: any
}

/** Keydown notification on the typeahead input. Fires with the DOM
 *  KeyboardEvent on web before internal navigation (call `preventDefault`
 *  to suppress it). Never fires on iOS/Android — native text fields emit
 *  no key events — so behavior gated on it (e.g. Tokenizer's
 *  Backspace-removes-last-token) is pointer-platform only. */
export type TypeaheadKeyDownHandler = (event: any) => void

/** BaseTypeahead — the unstyled combobox engine under Typeahead and
 *  Tokenizer: bare input + search/bootstrap + keyboard navigation + an
 *  anchored result listbox. It renders no field chrome; callers supply the
 *  visible wrapper and pass `anchor` for dropdown positioning. */
export interface BaseTypeaheadProps<T extends SearchableItem = SearchableItem> extends FieldControlProps {
	className?: any
	style?: any
	/** Element id applied to the input itself. */
	id?: string
	searchSource: SearchSource<T>
	/** Currently selected item (null = nothing selected). Controlled. */
	value: T | null
	/** Fires when a result is committed (item) or cleared (null). */
	onChange: (item: T | null) => void
	/** Custom option content inside the stable result row. Default:
	 *  TypeaheadItem. `item.element` takes precedence over this. */
	renderItem?: (item: T) => any
	placeholder?: string
	/** Offer `bootstrap()` results on focus before typing. */
	hasEntriesOnFocus?: boolean
	/** Max options rendered in the dropdown. Default 10. */
	maxMenuItems?: number
	/** Requested dropdown width (px on web, dip on native) before viewport
	 *  clamping; defaults to the anchor's width. */
	menuWidth?: number
	/** Minimum grapheme count before `search` runs; shorter queries show no
	 *  results and no empty state. Default 1. */
	minQueryLength?: number
	/** Empty-state text after a completed empty search. */
	emptySearchResultsText?: string
	/** Disabled presentation that keeps the input focusable (web:
	 *  aria-disabled + readOnly) so a disabled-reason tooltip stays
	 *  discoverable. Editing stays blocked. */
	isFocusableDisabled?: boolean
	hasAutoFocus?: boolean
	onChangeQuery?: (query: string) => void
	onOpenChange?: (open: boolean) => void
	/** Debounce before `search` after typing; 0 runs synchronously.
	 *  Default 150. */
	debounceMs?: number
	/** Anchor the dropdown to this ref's element/view instead of the input. */
	anchorRef?: PopoverAnchorRef
	placement?: PopoverPlacement
	inputId?: string
	ariaDescribedBy?: string
	ariaLabelledBy?: string
	inputTabIndex?: number
	onKeyDown?: TypeaheadKeyDownHandler
	onFocus?: () => void
	onBlur?: () => void
	bind?: (handle: TypeaheadInputHandle) => void
	/** Class/style applied to the input element only. */
	inputClassName?: any
	inputStyle?: any
	accessibilityLabel?: string
	/** @internal — entries derived from the query text, appended to search
	 *  results and exempt from minQueryLength (Tokenizer's "Create …"). */
	__queryEntries?: (query: string, results: T[]) => T[]
	ios?: any
	android?: any
	web?: any
}

/** Typeahead — single-selection search-as-you-type field. Renders its Field
 *  chrome (label/description/status), the input wrapper, and the selected
 *  value as a Token over the input; click the token to edit (blur or Escape
 *  restores it). */
export interface TypeaheadProps<T extends SearchableItem = SearchableItem> extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	/** Accessible label — required by Astryx; kept required here. */
	label: string
	isLabelHidden?: boolean
	searchSource: SearchSource<T>
	value: T | null
	onChange: (item: T | null) => void
	renderItem?: (item: T) => any
	placeholder?: string
	hasEntriesOnFocus?: boolean
	maxMenuItems?: number
	minQueryLength?: number
	emptySearchResultsText?: string
	/** Why the field is disabled; shown as a tooltip on pointer platforms
	 *  while the input stays focusable. */
	disabledMessage?: string
	/** Show the clear button while a value is selected. Default true. */
	hasClear?: boolean
	hasAutoFocus?: boolean
	debounceMs?: number
	onChangeQuery?: (query: string) => void
	onOpenChange?: (open: boolean) => void
	/** Leading glyph — a registered Icon name or a node. */
	startIcon?: any
	/** Field width; numbers are px/dip, strings pass through. */
	width?: number | string
	bind?: (handle: TypeaheadInputHandle) => void
	ios?: any
	android?: any
	web?: any
	labelTooltip?: string
}

export interface TypeaheadItemProps<T extends SearchableItem = SearchableItem> {
	className?: any
	style?: any
	id?: string
	item: T
	/** Leading node — icon, avatar, etc. */
	icon?: any
	/** Supporting text under the label. */
	description?: string
	isDisabled?: boolean
	/** Group label; presentational only — grouping itself is driven by
	 *  `item.auxiliaryData.group`. */
	group?: string
	bind?: (el: any) => void
	ios?: any
	android?: any
	web?: any
}

/** Token color — the Astryx palette names. */
export type TokenColor =
	| 'default'
	| 'red'
	| 'orange'
	| 'yellow'
	| 'green'
	| 'teal'
	| 'cyan'
	| 'blue'
	| 'purple'
	| 'pink'
	| 'gray'

export type TokenSize = FieldControlSize

/** Token — inline chip for an entity: label + optional icon, end content,
 *  and a remove affordance. `onClick` makes the whole chip a button;
 *  `href` makes it a link (web `<a>`, native opens the URL); with both
 *  `href` and `onRemove` the link and the remove button render as siblings
 *  and the rest of the chip surface activates the link. */
export interface TokenProps {
	className?: any
	style?: any
	id?: string
	label: string
	size?: TokenSize
	color?: TokenColor
	/** Leading node — icon, avatar, etc. */
	icon?: any
	isDisabled?: boolean
	/** Remove affordance — renders the ✕ button. (Astryx `onRemove`.) */
	onRemove?: () => void
	/** Whole-chip press action. (Astryx `onClick`.) */
	onClick?: () => void
	/** Link target — chip behaves as a link. */
	href?: string
	/** Accessible description for the token (aria-description /
	 *  accessibilityHint). */
	description?: string
	/** Content rendered after the label, before the remove button. */
	endContent?: any
	/** Hide the label visually; it stays the accessible name. */
	isLabelHidden?: boolean
	bind?: (el: any) => void
	ios?: any
	android?: any
	web?: any
}

/** Change metadata passed to Tokenizer's `onChange`. */
export type TokenizerChange<T extends SearchableItem = SearchableItem> =
	| { item: T; type: 'add' }
	| { item: T; type: 'create' }
	| { item: T; type: 'remove' }
	| { type: 'reorder' }

export type TokenizerSize = FieldControlSize

/** Token overflow when the field is too narrow: 'none' wraps (default);
 *  'unfocusedInline' collapses to one clipped line with a "+N more" count
 *  until the field is focused; 'unfocusedLayer' does the same but expands
 *  in an anchored overlay instead of reflowing the field. */
export type TokenizerOverflowBehavior = 'none' | 'unfocusedInline' | 'unfocusedLayer'

/** Imperative handle delivered through Tokenizer's `bind`. */
export interface TokenizerHandle {
	focus(): void
	blur(): void
	/** The root field element/view. */
	native: any
}

/** Tokenizer — multi-select field: Token chips + a BaseTypeahead input.
 *  Selecting adds a token and clears the query; Backspace on an empty input
 *  removes the last token (pointer platforms — native fields emit no key
 *  events); `hasCreate` offers a "Create \"…\"" entry for free text. */
export interface TokenizerProps<T extends SearchableItem = SearchableItem> extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	label: string
	searchSource: SearchSource<T>
	/** Selected items. Controlled. */
	value: T[]
	onChange: (items: T[], change: TokenizerChange<T>) => void
	renderItem?: (item: T) => any
	/** Custom token renderer — receives the item and its remove callback.
	 *  Default: Token with label + ✕. */
	renderToken?: (item: T, onRemove: () => void) => any
	/** Cap on selections; the input collapses at the cap. */
	maxEntries?: number
	placeholder?: string
	hasEntriesOnFocus?: boolean
	maxMenuItems?: number
	/** Fixed dropdown width (px/dip); never below the field width. */
	menuWidth?: number
	minQueryLength?: number
	emptySearchResultsText?: string
	/** Why the field is disabled; tooltip on pointer platforms. */
	disabledMessage?: string
	/** Show a clear-all button while tokens exist. Default false. */
	hasClear?: boolean
	/** Content in the field's inline-end lane (with the spinner/clear). */
	endContent?: any
	hasAutoFocus?: boolean
	tokenOverflowBehavior?: TokenizerOverflowBehavior
	debounceMs?: number
	/** Offer "Create \"query\"" for unmatched free text. */
	hasCreate?: boolean
	/** HTML form name — web only: renders hidden `<input>`s carrying one
	 *  entry per selected item id. No-op on native. */
	htmlName?: string
	onChangeQuery?: (query: string) => void
	/** Focus enters/leaves the field (no event object — portable). */
	onFocus?: () => void
	onBlur?: () => void
	startIcon?: any
	width?: number | string
	labelTooltip?: string
	bind?: (handle: TokenizerHandle) => void
	ios?: any
	android?: any
	web?: any
}

export type ComplexSelectorVariant = 'input' | 'ghost'
export type ComplexSelectorSize = FieldControlSize

/** Render state passed to the ComplexSelector surface builder. */
export interface ComplexSelectorRenderState {
	isOpen: boolean
	isBusy: boolean
	triggerId: string
	contentId: string
}

/** Imperative handle delivered through ComplexSelector's `bind`. Drives the
 *  same popover machinery as the trigger — prefer it over mirroring open
 *  state in the parent. */
export interface ComplexSelectorHandle {
	open(): void
	/** Closes the surface and restores focus to the trigger. */
	close(): void
	toggle(): void
	isOpen(): boolean
}

/** ComplexSelector — a field + trigger + anchored surface for rich custom
 *  pickers. `children` is a render function receiving the (optimistic)
 *  value, a commit callback, a close callback, and the render state; the
 *  component owns the trigger, popover, focus restore, and async
 *  `changeAction` flow. */
export interface ComplexSelectorProps<Value> extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	label: string
	value: Value
	onChange?: (value: Value) => void
	/** Async action run after `onChange`; the surface reports `isBusy` and
	 *  renders `value` optimistically until it settles. */
	changeAction?: (value: Value) => void | Promise<void>
	children: (
		value: Value,
		onChange: (value: Value) => void,
		close: () => void,
		state: ComplexSelectorRenderState,
	) => any
	/** Trigger content while closed; falls back to `placeholder`. */
	triggerLabel?: any
	placeholder?: any
	/** Loading/busy state on the trigger. */
	isLoading?: boolean
	/** 'input' (default) draws the field chrome; 'ghost' a flat
	 *  toolbar-style button. */
	variant?: ComplexSelectorVariant
	startIcon?: any
	width?: number | string
	labelTooltip?: string
	placement?: PopoverPlacement
	alignment?: 'start' | 'center' | 'end'
	bind?: (handle: ComplexSelectorHandle) => void
	onOpenChange?: (open: boolean) => void
	contentClassName?: any
	contentXstyle?: any
	ios?: any
	android?: any
	web?: any
}


/** InputRating — row of tappable glyphs reporting a 1..max score. */
export interface InputRatingProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	value?: number
	defaultValue?: number
	max?: number
	/** Glyph per cell — a Text character (default ★) or a registered Icon name. */
	icon?: string
	onValueChange?: (value: number) => void
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

/** CheckboxGroup — multi-select list of self-drawn checkboxes. */
export interface CheckboxGroupProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	options: RadioOption[]
	value?: string[]
	defaultValue?: string[]
	onValueChange?: (values: string[]) => void
	horizontal?: boolean
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

// ---------- navigation & wayfinding (Phase 3) ----------

export interface BreadcrumbItem {
	label: string
	onSelect?: () => void
}

/** Breadcrumb — ancestor trail. Items render as pressable links separated
 *  by `separator` (default /). */
export interface BreadcrumbProps {
	className?: any
	style?: any
	id?: string
	items: BreadcrumbItem[]
	separator?: string
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

/** Pagination — prev/next + a windowed run of page buttons around `page`. */
export interface PaginationProps {
	className?: any
	style?: any
	id?: string
	page: number
	pageCount: number
	/** Pages shown to each side of `page` (default 1). */
	siblingCount?: number
	onPageChange?: (page: number) => void
	disabled?: boolean
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

export interface StepperStep {
	key: string
	label?: string
	icon?: string
	disabled?: boolean
}

/** Stepper — numbered step row. Steps before `current` show a done mark;
 *  tapping a non-disabled step calls `onStepChange`. */
export interface StepperProps {
	className?: any
	style?: any
	id?: string
	steps: StepperStep[]
	current?: number
	onStepChange?: (index: number) => void
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

export interface NavigationMenuItem {
	key: string
	label?: string
	icon?: string
	active?: boolean
	disabled?: boolean
	onSelect?: () => void
}

/** NavigationMenu — row (or column) of nav items; mostly a desktop/web
 *  idiom — the mobile equivalent is Tabs/Drawer. */
export interface NavigationMenuProps {
	className?: any
	style?: any
	id?: string
	items: NavigationMenuItem[]
	horizontal?: boolean
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

/** CommandPalette — overlay with a search field over a filtered action
 *  list. Esc/outside dismisses, Enter selects the highlighted match. */
export interface CommandPaletteProps {
	className?: any
	style?: any
	id?: string
	open?: boolean
	onOpenChange?: (open: boolean) => void
	items: MenuItem[]
	placeholder?: string
	ios?: any
	android?: any
	web?: any
}

// ---------- data display (Phase 4) ----------

export interface TableColumn {
	key: string
	label?: string
	/** Column width in dips; omit to share the remaining space evenly. */
	width?: number
	align?: 'left' | 'center' | 'right'
}

/** Table — self-drawn grid via rows + cells. Bounded and unvirtualized:
 *  large datasets belong to the platform UITableView/RecyclerView
 *  subpaths, not this component. */
export interface TableProps {
	className?: any
	style?: any
	id?: string
	columns: TableColumn[]
	rows: Record<string, any>[]
	/** Cell override — default renders row[col.key] as text. */
	renderCell?: (row: Record<string, any>, column: TableColumn, rowIndex: number) => any
	/** Row key; defaults to the row index. */
	keyFor?: (row: Record<string, any>, rowIndex: number) => string
	onRowPress?: (row: Record<string, any>, rowIndex: number) => void
	empty?: any
	ios?: any
	android?: any
	web?: any
}

export interface TimelineItem {
	key: string
	title?: string
	description?: string
	time?: string
	icon?: string
}

/** Timeline — vertical list of events with dot + connector. */
export interface TimelineProps {
	className?: any
	style?: any
	id?: string
	items: TimelineItem[]
	ios?: any
	android?: any
	web?: any
}

export interface TreeNode {
	key: string
	label?: string
	children?: TreeNode[]
	disabled?: boolean
}

/** Tree — recursive indent + collapse. `defaultExpanded` seeds the open
 *  set; `onToggle` reports changes. */
export interface TreeProps {
	className?: any
	style?: any
	id?: string
	nodes: TreeNode[]
	defaultExpanded?: string[]
	onToggle?: (key: string, open: boolean) => void
	onSelect?: (node: TreeNode) => void
	ios?: any
	android?: any
	web?: any
}

/** Alert — status callout. `tone` maps to a class modifier; error tone
 *  gets role=alert on web, others role=status. */
export interface AlertProps {
	className?: any
	style?: any
	id?: string
	tone?: 'info' | 'success' | 'warning' | 'error'
	icon?: string
	title?: string
	children?: any
	ios?: any
	android?: any
	web?: any
}

/** Card — container with optional header/footer slots. */
export interface CardProps {
	className?: any
	style?: any
	id?: string
	header?: any
	footer?: any
	children?: any
	ios?: any
	android?: any
	web?: any
}

/** Chip — small action/filter element: pressable, optional selected state,
 *  optional ✕ remove affordance. */
export interface ChipProps {
	className?: any
	style?: any
	id?: string
	children?: any
	selected?: boolean
	disabled?: boolean
	onSelect?: () => void
	onRemove?: () => void
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

/** Kbd — keyboard key glyph (⌘K styling hook). */
export interface KbdProps {
	className?: any
	style?: any
	id?: string
	children?: any
	ios?: any
	android?: any
	web?: any
}

/** Empty — empty-state block: icon + title + description + actions. */
export interface EmptyProps {
	className?: any
	style?: any
	id?: string
	icon?: string
	title?: string
	description?: string
	children?: any
	ios?: any
	android?: any
	web?: any
}

/** Banner — inline notice strip with optional dismiss. */
export interface BannerProps {
	className?: any
	style?: any
	id?: string
	icon?: string
	children?: any
	onDismiss?: () => void
	ios?: any
	android?: any
	web?: any
}

/** User — avatar + name/description row. */
export interface UserProps {
	className?: any
	style?: any
	id?: string
	name?: string
	description?: string
	src?: string
	fallback?: string
	size?: number
	onSelect?: () => void
	ios?: any
	android?: any
	web?: any
}

/** ProgressGroup — stacked labeled Meter rows. */
export interface ProgressGroupProps {
	className?: any
	style?: any
	id?: string
	items: { key: string; label?: string; value: number; max?: number }[]
	ios?: any
	android?: any
	web?: any
}

// ---------- chat ----------

/** Who sent a chat message — drives alignment, bubble styling, and metadata
 *  direction. 'system' messages center and skip the avatar/name affordances. */
export type ChatMessageSender = 'user' | 'assistant' | 'system'

/** Visual density shared across the chat family. */
export type ChatDensity = 'compact' | 'balanced' | 'spacious'

/** ChatComposer accepts the same density scale; kept as its own alias so the
 *  public name matches upstream. */
export type ChatComposerDensity = ChatDensity

/** Delivery state shown by ChatMessageMetadata. */
export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error'

/** Sender context wrapper for one message. Renders the optional avatar, name,
 *  children (usually ChatMessageBubble), and trailing metadata column. */
export interface ChatMessageProps {
	className?: any
	style?: any
	id?: string
	sender: ChatMessageSender
	children?: any
	avatar?: any
	/** Sender name above the body — prefer the bubble's `name` when the first
	 *  child is a ChatMessageBubble. */
	name?: any
	/** Footer content below the body — prefer the bubble's `metadata` when the
	 *  last child is a ChatMessageBubble. */
	metadata?: any
	/** Defaults to the enclosing ChatMessageList density, then 'balanced'. */
	density?: ChatDensity
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

export type ChatMessageBubbleVariant = 'filled' | 'ghost'

/** Styled content container — the chat bubble. Reads sender/density from the
 *  enclosing ChatMessage. `group` tightens sender-side corners for
 *  consecutive bubbles; `width` replaces the default max-width cap. */
export interface ChatMessageBubbleProps {
	className?: any
	style?: any
	id?: string
	children?: any
	variant?: ChatMessageBubbleVariant
	/** Sender name row above the bubble, aligned to its text column. */
	name?: any
	/** Metadata row below the bubble, aligned to its text column. */
	metadata?: any
	group?: 'first' | 'middle' | 'last'
	/** Bubble width — number (px/dip) or CSS string ('100%'). Replaces the
	 *  default max-width cap when set. */
	width?: number | string
	ios?: any
	android?: any
	web?: any
}

/** Composable metadata row: timestamp · footer · status. Renders nothing
 *  when all three are absent. */
export interface ChatMessageMetadataProps {
	className?: any
	style?: any
	id?: string
	timestamp?: any
	footer?: any
	status?: ChatMessageStatus
	ios?: any
	android?: any
	web?: any
}

export type ChatSystemMessageVariant = 'default' | 'divider'

/** Centered system/notice row — date separators, "conversation started".
 *  `divider` draws hairlines on both sides of the text. */
export interface ChatSystemMessageProps {
	className?: any
	style?: any
	id?: string
	children?: any
	variant?: ChatSystemMessageVariant
	icon?: any
	ios?: any
	android?: any
	web?: any
}

/** Presentational message container. Density flows to children via context;
 *  `align:'bottom'` pads short lists so messages sit above the composer;
 *  `scrollToTopAction` loads older messages (spinner row while pending);
 *  `isStreaming` marks the region busy for assistive tech. Auto-scroll and
 *  the scroll-to-bottom button are owned by ChatLayout or useChatStreamScroll. */
export interface ChatMessageListProps {
	className?: any
	style?: any
	id?: string
	children?: any
	emptyState?: any
	/** Called when the user scrolls to the top — load older messages. Calls are
	 *  serialized while a returned promise is pending. */
	scrollToTopAction?: () => void | Promise<void>
	density?: ChatDensity
	/** Gap between top-level message rows (px on web, dip on native).
	 *  Defaults to the density's gap. */
	gap?: number
	align?: 'top' | 'bottom'
	isStreaming?: boolean
	ios?: any
	android?: any
	web?: any
}

export type ChatToolCallStatus = 'pending' | 'running' | 'complete' | 'error'

/** One tool/function call in a ChatToolCalls list — mirrors the shape LLM
 *  streaming APIs return. */
export interface ChatToolCallItem {
	name: string
	status?: ChatToolCallStatus
	target?: string
	duration?: string
	/** Short qualifier rendered as a chip next to the name (e.g. file part). */
	node?: string
	additions?: number
	deletions?: number
	/** Custom stats content replacing/augmenting additions+deletions. */
	stats?: any
	errorMessage?: string
	key?: string
	data?: unknown
	/** Expandable detail content (diff, code block, arguments). */
	resultDetail?: any
}

/** Tool-call list — one call renders inline; several collapse behind a
 *  summary header showing the latest call and the count. */
export interface ChatToolCallsProps {
	className?: any
	style?: any
	id?: string
	calls: ChatToolCallItem[]
	/** Expanded-state summary label (defaults to "N tool calls"). */
	label?: string
	isExpanded?: boolean
	defaultIsExpanded?: boolean
	onExpandedChange?: (isExpanded: boolean) => void
	ios?: any
	android?: any
	web?: any
}

// --- composer ---

export type ChatComposerStatus = { type: 'error' | 'warning'; message?: string }

/** Portable key event for the composer input — the seam for app-specific key
 *  handling. `native` carries the platform event (KeyboardEvent on web). */
export interface ChatComposerKeyEvent {
	key: string
	shiftKey: boolean
	ctrlKey: boolean
	metaKey: boolean
	altKey: boolean
	/** True while an IME composition is active — Enter never submits. */
	isComposing: boolean
	defaultPrevented: boolean
	preventDefault(): void
	native?: any
}

/** A pasted/dropped file. On web `native` is the browser `File`; native
 *  paste/drop file delivery is platform-dependent and may never fire —
 *  treat this as web-real, native-best-effort. */
export interface ChatComposerFile {
	name: string
	/** MIME type ('' when unknown). */
	type: string
	size: number
	native?: any
}

/** Portable paste event handed to ChatComposerInput.onPaste. */
export interface ChatComposerPasteEvent {
	preventDefault(): void
	/** The platform event (ClipboardEvent on web; undefined on native). */
	native?: any
}

export type ChatComposerTokenVariant =
	| 'neutral'
	| 'info'
	| 'success'
	| 'warning'
	| 'error'
	| 'blue'
	| 'cyan'
	| 'green'
	| 'orange'
	| 'pink'
	| 'purple'
	| 'red'
	| 'teal'
	| 'yellow'

/** Badge-configured token — renders as an inline chip; `value` is what
 *  serializes into the submitted string. */
export interface ChatComposerTokenBadge {
	value: string
	label?: any
	variant?: ChatComposerTokenVariant
	/** Registered icon name (see registerIcon). */
	icon?: string
}

/** Custom-rendered token — full control over the chip's content. */
export interface ChatComposerTokenCustom {
	value: string
	render: () => any
}

/** A token (mention, pasted blob, command argument) embedded in the
 *  composer value. Web renders it as a non-editable inline chip inside the
 *  field; native keeps tokens in a chip row above the field and serializes
 *  them at their recorded insertion offset. */
export type ChatComposerToken = ChatComposerTokenBadge | ChatComposerTokenCustom

/** Item shape for trigger-menu sources — the portable SearchableItem. */
export interface ChatComposerTriggerItem<TAuxData = unknown> {
	id: string
	label: string
	/** Pre-rendered item content — takes priority over renderItem/label. */
	element?: any
	auxiliaryData?: TAuxData
}

/** Sync or async item source for a trigger menu — the portable SearchSource. */
export interface ChatComposerSearchSource<
	T extends ChatComposerTriggerItem = ChatComposerTriggerItem,
> {
	search(query: string): Promise<T[]> | T[]
	bootstrap?(): Promise<T[]> | T[]
	cancel?(): void
}

/** One trigger (`@`, `/`, …) activating an autocomplete menu in the input. */
export interface ChatComposerTrigger {
	/** Character that activates the menu (e.g. '@', '/'). */
	character: string
	searchSource: ChatComposerSearchSource
	renderItem?: (item: ChatComposerTriggerItem) => any
	/** What to insert on selection — plain text or a token chip. */
	onSelect: (item: ChatComposerTriggerItem) => string | ChatComposerToken
	/** Parse a serialized token back when loading a draft for editing. */
	deserialize?: (value: string) => ChatComposerToken | null
	emptySearchResultsText?: string
	loadingText?: string
	menuLabel?: string
}

/** Imperative surface the composer shell and app code invoke on the input.
 *  Delivered through the input's `bind` prop. */
export interface ChatComposerInputHandle {
	/** Insert a token chip at the current caret position; returns its id. */
	insertToken(token: ChatComposerToken): string | undefined
	/** Replace the token chip with its serialized text value. */
	expandToken(id: string): void
	insertText(text: string): void
	focus(): void
	/** Current serialized value (token values inline). */
	getValue(): string
}

/** Registration record for the composer shell → input slot seam: a custom
 *  `input` assigns `{focus}` to `context.inputControlRef.current` so the
 *  shell's click-to-focus works without knowing the input's shape. */
export interface ChatComposerInputControl {
	focus(): void
}

export interface ChatComposerContextValue {
	value: string
	onChange: (value: string) => void
	onSubmit: (value: string) => void
	placeholder: string
	isDisabled: boolean
	isStopShown: boolean
	canSend: boolean
	onStop?: () => void
	inputControlRef?: { current: ChatComposerInputControl | null }
}

/** Rich composer field. Web is a real contenteditable with inline token
 *  chips, Enter-to-submit (IME-guarded), submitted-message recall on ArrowUp/Down,
 *  paste interception, and file drop. Native is a TextView plus a chip row
 *  for inserted tokens; serialization matches, mid-text token positions are
 *  approximated by recorded insertion offsets. */
export interface ChatComposerInputProps {
	className?: any
	style?: any
	id?: string
	/** Delivers the imperative handle (this repo's `bind` convention; the
	 *  upstream `handleRef` equivalent). */
	bind?: (h: ChatComposerInputHandle) => void
	value?: string
	onChange?: (value: string) => void
	placeholder?: string
	/** Height cap in lines before the field scrolls internally. */
	maxRows?: number
	triggers?: ChatComposerTrigger[]
	debounceMs?: number
	/** ArrowUp/ArrowDown recall of submitted messages — keyboard platforms. */
	hasHistory?: boolean
	/** Accessible name for the field. */
	label?: string
	isDisabled?: boolean
	/** Plain-text paste interception — return true to take over insertion. */
	onPaste?: (event: ChatComposerPasteEvent, text: string) => boolean | void
	/** Long-paste → token conversion; pass a useChatPasteAsToken result to
	 *  customize, false to disable. Web only — native has no paste event. */
	pasteAsToken?: { onPaste: (event: ChatComposerPasteEvent, text: string) => boolean } | false
	/** File drop/paste (web only — see ChatComposerFile). */
	onFiles?: (files: ChatComposerFile[]) => void
	onSubmit?: (value: string) => void
	/** Runs before built-in Enter/recall handling; preventDefault() to own
	 *  the keystroke. IME composition always suppresses submit. */
	onKeyDown?: (event: ChatComposerKeyEvent) => void
	ios?: any
	android?: any
	web?: any
}

export interface ChatComposerTokenElementProps {
	className?: any
	style?: any
	id?: string
	token: ChatComposerToken
	ios?: any
	android?: any
	web?: any
}

/** Collapsible drawer above the composer input — attachments/context chips.
 *  With `count`, a collapse toggle renders the badge+label summary. */
export interface ChatComposerDrawerProps {
	className?: any
	style?: any
	id?: string
	children?: any
	count?: number
	label?: string
	collapsedSummary?: any
	isCollapsed?: boolean
	defaultIsCollapsed?: boolean
	onCollapsedChange?: (isCollapsed: boolean) => void
	ios?: any
	android?: any
	web?: any
}

/** Circular send/stop toggle. Reads ChatComposerContext by default; every
 *  context-derived value is prop-overridable for standalone use. */
export interface ChatSendButtonProps {
	className?: any
	style?: any
	id?: string
	isStopShown?: boolean
	isDisabled?: boolean
	onSend?: () => void
	onStop?: () => void
	/** Custom send-state icon content (default: registered arrow-up glyph). */
	sendIcon?: any
	stopIcon?: any
	size?: 'sm' | 'md'
	/** Composes after the send/stop action. */
	onPress?: () => void
	ios?: any
	android?: any
	web?: any
}

/** Composer layout shell — slots for drawer, header actions/context, input,
 *  footer actions, send actions/button, and an error/warning status strip. */
export interface ChatComposerProps {
	className?: any
	style?: any
	id?: string
	onSubmit: (value: string) => void
	onStop?: () => void
	isStopShown?: boolean
	value?: string
	onChange?: (value: string) => void
	placeholder?: string
	isDisabled?: boolean
	density?: ChatComposerDensity
	/** 'low' (default) is the raised surface; 'none' is flat with a border. */
	elevation?: 'none' | 'low'
	drawer?: any
	headerActions?: any
	headerContext?: any
	/** Custom input element — replaces the default ChatComposerInput. */
	input?: any
	footerActions?: any
	sendActions?: any
	sendButton?: any
	status?: ChatComposerStatus
	statusPosition?: 'top' | 'bottom'
	ios?: any
	android?: any
	web?: any
}

/** Renders serialized message text with token values replaced by their
 *  chips — share one token table between input and display. */
export interface ChatTokenizedTextProps {
	className?: any
	style?: any
	id?: string
	children?: string
	tokens?: ChatComposerToken[]
	ios?: any
	android?: any
	web?: any
}

// --- chat layout & scrolling ---

/** Page-style chat shell: messages in a scroll area, composer docked at the
 *  bottom behind a blur strip, scroll-to-bottom button above it. Without
 *  `scrollRef` the layout root is the scroller (sticky dock); with an
 *  external scroll container ref the dock floats fixed above the page and
 *  the scroll hooks target that container. On native the dock is an overlay
 *  at the bottom of the layout (no backdrop blur — NS has no
 *  backdrop-filter), and `scrollRef` attaches to the layout's own ScrollView
 *  (it is populated by the layout, so callers can hand it to the hooks). */
export interface ChatLayoutProps {
	className?: any
	style?: any
	id?: string
	children?: any
	/** Composer element docked at the bottom — typically ChatComposer. */
	composer?: any
	emptyState?: any
	/** Custom scroll-to-bottom control, or null to hide. Defaults to
	 *  ChatLayoutScrollButton wired to the layout's scroll state. */
	scrollButton?: any
	/** External scroll container — { current: HTMLElement | NSView }. */
	scrollRef?: { current?: any }
	density?: ChatDensity
	ios?: any
	android?: any
	web?: any
}

export interface ChatLayoutScrollButtonProps {
	className?: any
	style?: any
	id?: string
	isVisible: boolean
	/** Optional pill label (e.g. "New messages") — expands the button. */
	label?: string
	onPress?: () => void
	ios?: any
	android?: any
	web?: any
}

export interface ChatScrollToBottomOptions {
	/** 'instant' jumps in one frame (open/restore); default 'spring' animates
	 *  (web spring, NS animated scroll). Reduced-motion web jumps instantly. */
	behavior?: 'instant' | 'spring'
}

/** Owns a scroll container's follow-the-stream behavior. `scrollRef` points
 *  at the DOM scroller on web or the bound NS ScrollView on native. */
export interface UseChatStreamScrollOptions {
	scrollRef: { current?: any }
	enabled?: boolean
	/** Distance from bottom within which scroll-end re-locks (default 10). */
	lockThreshold?: number
	/** Distance from bottom beyond which the button shows (default 100). */
	buttonThreshold?: number
	/** Web spring parameters; native scroll uses the OS animation. */
	damping?: number
	stiffness?: number
	mass?: number
}

export interface UseChatStreamScrollReturn {
	isScrolledUp: boolean
	isLocked: boolean
	scrollToBottom(options?: ChatScrollToBottomOptions): void
	/** Scroll so the given message element/view tops the visible area. */
	scrollToMessage(el: any): void
	lock(): void
	unlock(): void
	/** Follow growth only while locked — call on content resize. */
	scrollIfLocked(): void
	scrollToLastMessage(): void
}

export interface UseChatNewMessagesOptions {
	/** When the scroll is locked, new arrivals don't flag — the user is
	 *  already at the bottom. */
	isLocked: boolean
	/** Fires on every content height change (new message, streaming growth). */
	onResize?: () => void
}

export interface UseChatNewMessagesReturn {
	hasNewMessages: boolean
	dismiss(): void
	/** Attach to the message-list content element — ResizeObserver on web,
	 *  layoutChanged on native. */
	contentRef(el: any): void
}

/** Converts long pastes into token chips. `inputRef` carries the input
 *  handle (the object `bind` delivered). */
export interface UseChatPasteAsTokenOptions {
	inputRef: { current: ChatComposerInputHandle | null }
	/** Character threshold — pastes longer than this become tokens (200). */
	threshold?: number
	toToken?: (text: string) => ChatComposerToken
}

export interface UseChatPasteAsTokenReturn {
	/** Wire as ChatComposerInput's pasteAsToken/onPaste — true means the
	 *  paste became a token. */
	onPaste(event: ChatComposerPasteEvent, text: string): boolean
}

/** Token bookkeeping inside a composer input. `editableRef` is the editable
 *  div on web; on native it's the host object the native input installs. */
export interface UseChatComposerTokensOptions {
	editableRef: { current?: any }
	onEmitChange(): void
}

export interface TokenPortal {
	id: string
	/** The non-editable span web portals render into (DOM element). */
	span: any
	token: ChatComposerToken
}

export interface UseChatComposerTokensReturn {
	tokenPortals: TokenPortal[]
	expandToken(id: string): void
	insertToken(token: ChatComposerToken): string | undefined
	/** Backspace-near-token interception (web KeyboardEvent). */
	handleKeyDown(e: any): boolean
	/** Paste-near-token interception (web ClipboardEvent). */
	handlePaste(e: any): boolean
	cleanupPortals(): void
}

// --- dictation (web SpeechRecognition; unsupported on native — isSupported:false) ---

export interface UseSpeechRecognitionOptions {
	lang?: string
	continuous?: boolean
	interimResults?: boolean
	audioContext?: any
	transformTranscript?: (text: string) => string
	onTranscript?: (transcript: string, isFinal: boolean) => void
	onResult?: (transcript: string) => void
	onError?: (error: { error: string; message?: string }) => void
	onStart?: () => void
	onEnd?: () => void
}

export interface UseSpeechRecognitionReturn {
	isSupported: boolean
	isListening: boolean
	isSpeaking: boolean
	volume: number
	bands: number[]
	rawBands: number[]
	interimTranscript: string
	start(): void
	stop(): void
	abort(): void
	toggle(): void
}

export interface UseChatDictationOptions extends UseSpeechRecognitionOptions {
	/** Start/stop audio cues (default false). Web only. */
	hasSounds?: boolean
	/** Input handle ref — when set, interim/final transcripts are inserted
	 *  into the composer input. */
	inputRef?: { current: ChatComposerInputHandle | null }
}

export interface UseChatDictationReturn extends UseSpeechRecognitionReturn {}

/** Mic button bound to a useChatDictation/useSpeechRecognition result. */
export interface ChatDictationButtonProps {
	className?: any
	style?: any
	id?: string
	dictation: UseSpeechRecognitionReturn
	size?: 'sm' | 'md'
	/** Hide entirely when unsupported (default true) — else show disabled. */
	isHiddenWhenUnsupported?: boolean
	label?: string
	ios?: any
	android?: any
	web?: any
}

/** Values flowing from ChatMessageList/ChatLayout to their children. */
export interface ChatMessageContextValue {
	sender: ChatMessageSender
	density: ChatDensity
}

export interface ChatListContextValue {
	density: ChatDensity
}

export interface ChatLayoutContextValue {
	/** The scrollable container — DOM element on web, NS ScrollView natively. */
	scrollContainerRef: { current?: any }
	/** Message-list content element for size observation. */
	contentRef(el: any): void
}

// ---------- theme ----------

export type ColorScheme = 'light' | 'dark'

// ---------- stores ----------

/** Minimal external-store contract `useStore` subscribes to. */
export interface ReadableStore<T> {
	get(): T
	subscribe(notify: () => void): () => void
}

export interface Store<T> extends ReadableStore<T> {
	set(next: T | ((prev: T) => T)): void
}

// Astryx-aligned component prop names. The existing interfaces remain the
// source contracts so these aliases preserve the current cross-platform API.
/** Props accepted by `Divider`, using the existing `Separator` contract. */
export type DividerProps = SeparatorProps
/** Props accepted by `HStack`, using the existing horizontal `Row` contract. */
export type HStackProps = RowProps
/** Props accepted by `VStack`, using the existing vertical `Column` contract. */
export type VStackProps = ViewProps
/** Props accepted by `Item`, using the existing `ListItem` contract. */
export type ItemProps = ListItemProps
/** Props accepted by `CheckboxInput`. */
export type CheckboxInputProps = CheckboxProps
/** Props accepted by `CheckboxList`. */
export type CheckboxListProps = CheckboxGroupProps
/** Props accepted by `RadioList`. */
export type RadioListProps = RadioGroupProps
/** Props accepted by `Field`, using the existing `FormField` contract. */
export type FieldProps = FormFieldProps
/** Props accepted by `NumberInput`. */
export type NumberInputProps = InputNumberProps
/** Props accepted by `Selector`. */
export type SelectorProps = SelectProps
/** Props accepted by `MultiSelector`. */
export type MultiSelectorProps = SelectProps
/** Props accepted by `Breadcrumbs`. */
export type BreadcrumbsProps = BreadcrumbProps
/** Props accepted by `TreeList`. */
export type TreeListProps = TreeProps
/** Props accepted by `EmptyState`. */
export type EmptyStateProps = EmptyProps
/** Props accepted by `Spinner`. */
export type SpinnerProps = ActivityIndicatorProps
