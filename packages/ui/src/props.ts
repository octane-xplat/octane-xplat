/** Shared prop/type contract — the single source of truth for the public
 *  API surface. Platform leaves import these types so prop shapes cannot
 *  drift across .web/native-default, and `tsc --emitDeclarationOnly` emits this
 *  file into the published package's boundary types (tsrx can't emit
 *  declarations — pure .ts is what escapes that). No imports here:
 *  everything must stay dependency-free and platform-agnostic. */

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

export interface TextInputProps {
	className?: any
	style?: any
	id?: string
	value?: string
	placeholder?: string
	onChange?: (value: string) => void
	bind?: (h: TextInputHandle) => void
	secure?: boolean
	keyboardType?: 'default' | 'email' | 'number' | 'decimal' | 'phone' | 'url'
	returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send'
	onSubmit?: () => void
	onFocus?: () => void
	onBlur?: () => void
	editable?: boolean
	placeholderTextColor?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface TextAreaProps extends TextInputProps {
	/** Submit on native only when `returnKeyType` is `done` or `send`; other
	 * returns insert newlines because TextView emits returnPress per newline.
	 * Web submits on Cmd/Ctrl+Enter. */
	/** Height in text rows. Web: the `rows` attr (fixed box); native:
	 *  minHeight at the widget's measured line height. With `autoGrow` it
	 *  becomes the starting height instead of a fixed one. */
	rows?: number
	/** Grow to fit content, capped by `maxRows`. Native TextView grows by
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
export interface SearchInputProps {
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
	editable?: boolean
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

export interface SwitchProps {
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
	/** Content shown after the pointer rests over the children on web. */
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

/** Web-only tooltip (`@octane-xplat/ui/web`, decision #47) — `trigger` is
 *  the anchor content, `content` the tooltip body. Hover-intent delay plus
 *  keyboard focus; wires `aria-describedby` onto the focusable trigger and
 *  dismisses on Escape, blur, or scroll. */
export interface TooltipProps {
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
	 *  skip it (the screen mounts in the same tick anyway). */
	loader?: (params: Record<string, unknown>) => unknown
	/** Optional guard awaited before a push commits. A thrown `redirect(...)`
	 * short-circuits the attempted route. */
	beforeLoad?: BeforeLoad
	/** Optional route title/meta declaration, or a params-only function. */
	head?: RouteHeadExport
}

/** Output of `deriveRouteManifest` — `screens` feeds `registerScreens`
 *  (native pushRoute + web outlet fallback), `routes` feeds web URL
 *  matching, `layouts` catalogs `_layout` files by directory ('' = root). */
export interface RouteManifest {
	screens: ScreenTable
	routes: RouteMeta[]
	layouts: Record<string, any>
	loaders?: Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>>
}

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
export interface CheckboxProps {
	className?: any
	style?: any
	id?: string
	checked?: boolean
	disabled?: boolean
	onCheckedChange?: (checked: boolean) => void
	label?: string
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

export interface RadioOption {
	value: string
	label?: string
	disabled?: boolean
}

/** Self-drawn radio group — dot options in a column/row. */
export interface RadioGroupProps {
	className?: any
	style?: any
	id?: string
	options: RadioOption[]
	value?: string
	disabled?: boolean
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
export interface SegmentedControlProps {
	className?: any
	style?: any
	id?: string
	options: RadioOption[]
	value?: string
	defaultValue?: string
	onValueChange?: (value: string) => void
	disabled?: boolean
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

/** Separator — hairline rule between content. */
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

/** FormField wraps a control with a label, hint, and error text. The error
 *  replaces the hint when present. Children is the control element. */
export interface FormFieldProps {
	className?: any
	style?: any
	id?: string
	label?: string
	hint?: string
	error?: string
	required?: boolean
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

/** InputNumber — normalized TextInput (number keyboard) flanked by −/+
 *  steppers. `value`/`onValueChange` for controlled, `defaultValue` for
 *  uncontrolled. `step` defaults to 1; `min`/`max` clamp. */
export interface InputNumberProps {
	className?: any
	style?: any
	id?: string
	value?: number
	defaultValue?: number
	min?: number
	max?: number
	step?: number
	disabled?: boolean
	placeholder?: string
	onValueChange?: (value: number) => void
	ios?: any
	android?: any
	web?: any
}

/** PinInput — a row of single-character cells that auto-advance on entry.
 *  `onComplete` fires when all `length` cells are filled. */
export interface PinInputProps {
	className?: any
	style?: any
	id?: string
	length?: number
	value?: string
	onValueChange?: (value: string) => void
	onComplete?: (value: string) => void
	secure?: boolean
	disabled?: boolean
	ios?: any
	android?: any
	web?: any
}

export interface SelectOption {
	value: string
	label?: string
	disabled?: boolean
}

/** Select — anchored self-drawn listbox on every target (decision #48).
 *  `multiple` keeps the listbox open and reports string[]; `searchable`
 *  puts a normalized TextInput filter at the top of the listbox. */
export interface SelectProps {
	className?: any
	style?: any
	id?: string
	options: SelectOption[]
	value?: string | string[]
	defaultValue?: string | string[]
	multiple?: boolean
	searchable?: boolean
	placeholder?: string
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	onValueChange?: (value: string | string[]) => void
	disabled?: boolean
	placement?: PopoverPlacement
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

/** InputTags — chip list + trailing normalized TextInput. Enter commits a
 *  tag, Backspace on an empty field removes the last tag. */
export interface InputTagsProps {
	className?: any
	style?: any
	id?: string
	value?: string[]
	defaultValue?: string[]
	onValueChange?: (tags: string[]) => void
	placeholder?: string
	max?: number
	disabled?: boolean
	ios?: any
	android?: any
	web?: any
}

/** InputRating — row of tappable glyphs reporting a 1..max score. */
export interface InputRatingProps {
	className?: any
	style?: any
	id?: string
	value?: number
	defaultValue?: number
	max?: number
	/** Glyph per cell — a Text character (default ★) or a registered Icon name. */
	icon?: string
	onValueChange?: (value: number) => void
	disabled?: boolean
	accessibilityLabel?: string
	ios?: any
	android?: any
	web?: any
}

/** CheckboxGroup — multi-select list of self-drawn checkboxes. */
export interface CheckboxGroupProps {
	className?: any
	style?: any
	id?: string
	options: RadioOption[]
	value?: string[]
	defaultValue?: string[]
	onValueChange?: (values: string[]) => void
	disabled?: boolean
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
