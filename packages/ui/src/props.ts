import type { ClassValue, CSSProperties, Octane } from 'octane/jsx-runtime'

/** Shared prop/type contract — the single source of truth for the public
 *  API surface. Platform leaves import these types so prop shapes cannot
 *  drift across .web/native-default, and `tsrx-typegen` emits the package's
 *  declarations from its public entrypoints and component leaves. The Octane
 *  import is type-only; shared contracts stay platform-agnostic. */

/** Space-separated class names or a clsx-style class value (strings, arrays,
 *  keyed objects) applied to the host — Octane's ClassValue contract. */
export type ClassName = ClassValue

/** Dynamic inline styles — a camelCase CSS property object (numbers are dips)
 *  or an inline CSS string. Static styles belong in `className`. */
export type StyleProp = string | CSSProperties

/** Any value Octane can render — the React `ReactNode` analogue (elements,
 *  text, lists, conditionally omitted content). Opaque to consumers. */
export type Renderable = unknown

/** The platform host delivered through `ref` and escape props — a DOM
 *  element on web, a NativeScript view on iOS/Android, an AppKit view on
 *  macOS. Cast to the platform type for host-specific access. */
export type HostElement = unknown

/** Per-platform escape bag of host attributes, applied after shared props. */
export type PlatformProps = Record<string, unknown>

/** A component reference — a function component or (web) an intrinsic tag
 *  name. The contract for `as`-style customization slots. */
export type ElementType = string | ((props: any) => any)

/** A function component usable from JSX — `P` plus Octane's JSX attributes
 *  (`key`). The contract for `components`-style override slots. */
export type ElementComponent<P> = (props: P & Octane.Attributes) => any

/** Props delivered to components mounted imperatively by `openModal` /
 *  `openBottomSheet`, or by `Modal`'s `component` prop: `params` plus a
 *  `close` that resolves the host with an optional result. `params` is
 *  whatever the caller passed — the mounted component declares its own
 *  shape. */
export interface HostedComponentProps {
	params: any
	close(result?: unknown): void
}

/** A component mounted on a dedicated root — `openModal`/`openBottomSheet`
 *  arguments and `Modal`'s `component` prop. */
export type HostedComponent = (props: HostedComponentProps) => any

/** A route screen component — receives the route's params as props. */
export type ScreenComponent = (props: any) => any

/** A route layout component — renders the route subtree through `children`. */
export type LayoutComponent = (props: { children?: Renderable }) => any

// ---------- gestures ----------

/** Pan phase; cancellation never implies a completed drag. */
export type PanState = 'began' | 'moved' | 'ended' | 'cancelled'

/** Cumulative translation from gesture start (x/dx and y/dy are aliases),
 * in CSS pixels on web or logical DIPs/points on native. Velocity uses
 * those same units per second; target is the attached host. */
export interface PanEvent {
	x: number
	y: number
	dx: number
	dy: number
	vx: number
	vy: number
	state: PanState
	target: HostElement
}

/** NativeScript swipe direction flags: right=1, left=2, up=4, down=8.
 * Swipe callbacks attach to native gesture-capable primitives; web does not
 * synthesize swipe events. Use onPan for portable dragging. */
export interface SwipeEvent {
	direction: 1 | 2 | 4 | 8
}

/** Public shape of `setTranslate` — the imperative translate write on a
 *  bound view (a leaf's `ref` target). Web composes into the element's
 *  `transform`; native sets the view's translateX/translateY props.
 *  Both axes default to 0, so `setTranslate(el)` resets. */
export type SetTranslate = (el: HostElement, x?: number, y?: number) => void

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
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	rows?: string
	columns?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
}

/** Astryx spacing scale — `step * 4` dips. Shared by `Stack`, `Center`,
 *  `Section`, and `FormLayout` gap/padding props. */
export type SpacingStep = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10

/** Numbers are dips (px on web); strings are used as-is ('100%', '12em'). */
export type SizeValue = number | string

export type StackDirection = 'horizontal' | 'vertical'

/** Main-axis alignment — mirrors `justify-content` (start/center/end plus
 *  the space-distribution values). */
export type StackMainAlignment = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'

/** Cross-axis alignment — mirrors `align-items`. */
export type StackCrossAlignment = 'start' | 'center' | 'end' | 'stretch'

/** Union accepted by the directional `hAlign`/`vAlign` props; which half is
 *  meaningful depends on `direction` (hAlign is main-axis when horizontal,
 *  cross-axis when vertical). */
export type StackAlignment = StackMainAlignment | StackCrossAlignment

export type StackWrap = 'nowrap' | 'wrap' | 'wrap-reverse'

/** Padding props shared by the flow layout components. Per edge, most
 *  specific wins: edge → axis → `padding`. */
export interface StackPaddingProps {
	padding?: SpacingStep
	/** Inline axis (horizontal in LTR). Overrides `padding` on both inline edges. */
	paddingInline?: SpacingStep
	/** Inline-start edge — left in LTR. Native maps logical edges to physical left/right. */
	paddingInlineStart?: SpacingStep
	paddingInlineEnd?: SpacingStep
	/** Block axis (vertical). Overrides `padding` on both block edges. */
	paddingBlock?: SpacingStep
	paddingBlockStart?: SpacingStep
	paddingBlockEnd?: SpacingStep
}

export interface StackSizeProps {
	width?: SizeValue
	height?: SizeValue
	maxWidth?: SizeValue
	minHeight?: SizeValue
}

/** Astryx flow Stack — a flex container, NOT an overlap layer. For children
 *  stacked in the same cell use `Absolute`. `hAlign`/`vAlign` map to
 *  main/cross axis by direction; `justify`/`align` are the CSS-named aliases.
 *  `as` picks the web element tag; native always renders the platform
 *  container (no semantic HTML exists there). `isScrollable` wraps content
 *  in a ScrollView on native and overflow:auto on web. */
export interface StackProps extends StackPaddingProps, StackSizeProps, AccessibilityProps, TestIDProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<HostElement>
	/** @default 'vertical' */
	direction?: StackDirection
	hAlign?: StackAlignment
	vAlign?: StackAlignment
	justify?: StackMainAlignment
	align?: StackCrossAlignment
	gap?: SpacingStep
	wrap?: StackWrap
	isScrollable?: boolean
	as?: ElementType
	onPan?: (e: PanEvent) => void
	onSwipe?: (e: SwipeEvent) => void
}

export type StackItemCrossAlignSelf = 'start' | 'center' | 'end' | 'stretch'
export type StackItemSize = 'static' | 'fill'

/** Per-child overrides inside a `Stack`. `size="fill"` grows into the
 *  remaining space (splits evenly between fill siblings). On web the item
 *  carries the flex `min-width/min-height: 0` reset so a fill child can
 *  become a scroll region; native flex children already shrink to zero. */
export interface StackItemProps extends AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	ref?: Octane.Ref<HostElement>
	/** Cross-axis self alignment, overriding the stack's cross alignment. */
	crossAlignSelf?: StackItemCrossAlignSelf
	/** @default 'static' */
	size?: StackItemSize
	/** overflow:auto on web; wraps in a ScrollView on native. */
	isScrollable?: boolean
	as?: ElementType
	onPan?: (e: PanEvent) => void
	onSwipe?: (e: SwipeEvent) => void
}

/** Horizontal flow stack — `Stack` with `direction="horizontal"`. `hAlign`
 *  is the main axis, `vAlign` the cross axis. */
export interface HStackProps extends Omit<StackProps, 'direction' | 'hAlign' | 'vAlign'> {
	hAlign?: StackMainAlignment
	vAlign?: StackCrossAlignment
}

/** Vertical flow stack — `Stack` with `direction="vertical"`. `vAlign` is
 *  the main axis, `hAlign` the cross axis. */
export interface VStackProps extends Omit<StackProps, 'direction' | 'hAlign' | 'vAlign'> {
	hAlign?: StackCrossAlignment
	vAlign?: StackMainAlignment
}

export interface AbsoluteProps extends AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
}

/** Interactive glass surface — the element root IS the platform's glass
 *  effect view (NS `LiquidGlass`, a UIVisualEffectView hosting children).
 *  Real material on iOS 26+; inert layout on Android and older iOS;
 *  backdrop-filter approximation on web. */
export interface LiquidGlassProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	id?: string
	variant?: 'regular' | 'clear'
	/** iOS 26+ glass touch tracking. Default false; child touch behavior with
	 * explicit true is not device-qualified. Earlier iOS uses system material blur. */
	interactive?: boolean
	tint?: string
	animateChangeDuration?: number
	modifiers?: readonly NativeModifier[]
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Merged-glass region — sibling glass elements inside morph together
 *  across `spacing` dips (NS `LiquidGlassContainer`, an AbsoluteLayout:
 *  children position via left/top). */
export interface LiquidGlassContainerProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	id?: string
	spacing?: number
	modifiers?: readonly NativeModifier[]
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface SpacerProps {
	className?: ClassName
	style?: StyleProp
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
}

/** Optional automation identity on supported host components. */
export interface TestIDProps {
	/** Stable semantic automation name, independent of `id` and spoken labels.
	 * Supported hosts map to data-testid on web and NativeScript testID on
	 * iOS/Android. Inputs target the editable host; Overlay targets its content.
	 * Other components/platforms are not automatically supported by inheritance.
	 * Keep IDs unique among mounted targets and stable across localization.
	 * @see docs/verify/test-identifiers.md for qualified hosts and precedence. */
	testID?: string
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
		/** Toggle-button pressed state — `aria-pressed` on web; reported as
		 *  checked/unchecked where the platform a11y model has no pressed. */
		pressed?: boolean
	}
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
}

export interface ViewProps extends LayoutChildProps, FlexContainerProps, AccessibilityProps, TestIDProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<HostElement>
	onPan?: (e: PanEvent) => void
	onSwipe?: (e: SwipeEvent) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface RowProps extends LayoutChildProps, FlexContainerProps, AccessibilityProps, TestIDProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<HostElement>
	onPan?: (e: PanEvent) => void
	onSwipe?: (e: SwipeEvent) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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
	| 'menu'
	| 'group'
	| 'menuitem'
	| 'menuitemcheckbox'
	| 'menuitemradio'
	| 'meter'

export interface TextProps extends LayoutChildProps, TestIDProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
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
		/** Toggle-button pressed state — `aria-pressed` on web; reported as
		 *  checked/unchecked where the platform a11y model has no pressed. */
		pressed?: boolean
	}
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Inline rich text container. Children should be RichTextSpan components so
 * the native leaf can preserve each run as a NativeScript Span. */
export interface RichTextProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	id?: string
	/** Optional explicit accessible name override for the text block. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** One styled or tappable inline run inside RichText. `text` is an explicit
 * native-safe escape hatch; a single string child is also accepted. */
export interface RichTextSpanProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	text?: string
	onPress?: () => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface PressableProps extends LayoutChildProps, FlexContainerProps, TestIDProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	id?: string
	disabled?: boolean
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<HostElement>
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
		/** Toggle-button pressed state — `aria-pressed` on web; reported as
		 *  checked/unchecked where the platform a11y model has no pressed. */
		pressed?: boolean
	}
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TextInputHandle {
	focus(): void
	blur(): void
	native: HostElement
}

export type FieldStatusType = 'warning' | 'error' | 'success'

/** Portable validation status shared by field controls. */
export interface FieldStatus {
	type: FieldStatusType
	message?: string
}

export type FieldControlSize = 'sm' | 'md' | 'lg'

/** How a field status message is placed (Astryx parity):
 *  - `attached`: the message border-merges with the control below it
 *  - `detached`: a separate message under the control
 *  - `tooltip`: no message box; the status glyph reveals the message on
 *    hover/focus. Touch platforms (iOS/Android) have no hover/focus
 *    surfaces — `tooltip` degrades to `detached` there. */
export type FieldStatusVariant = 'attached' | 'detached' | 'tooltip'

/** Shared, platform-neutral field vocabulary. */
export interface FieldControlProps {
	label?: string
	description?: string
	isLabelHidden?: boolean
	isDisabled?: boolean
	/** Why the field is disabled. Web shows it as a hover/focus tooltip on the
	 *  control (which stays focusable via `aria-disabled`); native appends it
	 *  to the control's accessibility hint instead. */
	disabledMessage?: string
	isReadOnly?: boolean
	/** Indicates asynchronous work associated with the field. */
	isLoading?: boolean
	isRequired?: boolean
	isOptional?: boolean
	size?: FieldControlSize
	status?: FieldStatus
	/** @default 'attached' */
	statusVariant?: FieldStatusVariant
	/** Hint shown from an info glyph at the end of the label. Web renders a
	 *  real tooltip; native folds it into the label's accessibility hint. */
	labelTooltip?: string
	/** Field width — a number in px or a CSS-ish string on web/density units
	 *  on native. Sizes the whole field (label, control, status), unlike
	 *  styling the control itself. */
	width?: number | string
}

export interface TextInputProps extends FieldControlProps, TestIDProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Controlled text — pair with `onChange`. */
	value?: string
	/** Initial text for uncontrolled use; `value` wins when both are set. */
	defaultValue?: string
	placeholder?: string
	/** Reports the field's text after each user edit (and after `hasClear`).
	 *  Programmatic `value` writes do not fire it. */
	onChange?: (value: string) => void
	/** Optional explicit accessible name override for the input. */
	accessibilityLabel?: string
	ref?: Octane.Ref<TextInputHandle>
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
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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
export interface SearchInputProps extends FieldControlProps, TestIDProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Controlled text — pair with `onChange`. */
	value?: string
	/** Initial text for uncontrolled use; `value` wins when both are set. */
	defaultValue?: string
	/** Reports the field's text after each user edit (and after `hasClear`).
	 *  Programmatic `value` writes do not fire it. */
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
	icon?: IconName | false
	ref?: Octane.Ref<TextInputHandle>
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- date / time / file entry (Astryx parity) ----------

/** ISO 8601 calendar date `YYYY-MM-DD`. Date/time inputs and Calendar carry
 *  ISO strings — never `Date` — so values serialize losslessly and ignore
 *  zones. `Date` appears only in `dateConstraints` callbacks and Calendar's
 *  single-mode `onChange` second argument. */
export type ISODateString =
	`${number}${number}${number}${number}-${number}${number}-${number}${number}`

/** ISO wall-clock time `HH:MM` or `HH:MM:SS`. */
export type ISOTimeString =
	| `${number}${number}:${number}${number}`
	| `${number}${number}:${number}${number}:${number}${number}`

/** ISO local date-time `YYYY-MM-DDTHH:MM[:SS]` — no zone suffix; these are
 *  wall-clock values, not instants. */
export type ISODateTimeString = `${ISODateString}T${ISOTimeString}`

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type DayOfWeekName = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

/** Inclusive ISO date range. */
export interface DateRange {
	start: ISODateString
	end: ISODateString
}

/** Quick-select range beside a `DateRangeInput` calendar. A preset is
 *  disabled when it violates min/max/dateConstraints or the span bounds. */
export interface DateRangePreset {
	label: string
	getRange: () => DateRange
}

/** Immutable Gregorian calendar day — the unit all calendar math uses. */
export interface PlainDate {
	readonly year: number
	readonly month: number
	readonly day: number
}

/** Which surface a date/time field opens. `text-input` is TimeInput-only
 *  (a typed field, no picker surface at all). `native` is the platform's own
 *  control — `<input type="date|time">` on web; on iOS/Android the
 *  OS-authentic pickers live in `@octane-xplat/date-picker`, so the ui leaf
 *  resolves `native` to its self-drawn `bottom-sheet` surface instead.
 *  `adaptive-native` / `adaptive-bottom-sheet` pick by pointer coarseness. */
export type InputPresentation =
	| 'text-input'
	| 'popover'
	| 'bottom-sheet'
	| 'native'
	| 'adaptive-bottom-sheet'
	| 'adaptive-native'

export type PickerPresentation = Exclude<InputPresentation, 'text-input'>
export type DateInputPresentation = PickerPresentation
export type TimeInputPresentation = InputPresentation
export type DateTimeInputPresentation = PickerPresentation

/** @deprecated Prefer `presentation`; kept for upstream source parity —
 *  `touch` → `adaptive-native`, `always` → `native`, `never` →
 *  `adaptive-bottom-sheet` (`text-input` for TimeInput). `presentation`
 *  wins when both are set. */
export type NativePickerPolicy = 'touch' | 'always' | 'never'

/** Imperative calendar navigation — obtained via `ref`. */
export interface CalendarHandle {
	navigateTo(date: ISODateString): void
}

/** App-owned translations for date-family chrome and state announcements.
 * Dates passed to message functions are already formatted in `locale`. */
export interface DateInputMessages {
	previousMonth: string
	nextMonth: string
	openCalendar: string
	closeCalendar: string
	openTimePicker: string
	closeTimePicker: string
	invalidDate: string
	invalidTime: string
	invalidDateTime: string
	selected: (date: string) => string
	rangeStart: (date: string) => string
	rangeEnd: (date: string) => string
	inRange: (date: string) => string
	rangeSelected: (start: string, end: string) => string
	rangeCleared: string
	cleared: string
}

/** Pass your app locale and translated messages from any i18n library.
 * No provider or translation dependency is required by the shared controls. */
export interface DateLocaleProps {
	/** BCP 47 locale for Gregorian date parsing/formatting; runtime locale by default. */
	locale?: string
	/** Calendar layout and horizontal key direction. Web inherits CSS direction
	 * when omitted; native defaults to ltr. */
	direction?: 'ltr' | 'rtl'
	/** Partial overrides; omitted messages retain the English defaults. */
	messages?: Partial<DateInputMessages>
}

interface CalendarBaseProps extends DateLocaleProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Receives `{ navigateTo }` for imperative month navigation. */
	ref?: Octane.Ref<CalendarHandle>
	/** Month panes shown side by side. @default 1 */
	numberOfMonths?: 1 | 2
	min?: ISODateString
	max?: ISODateString
	/** Extra rules — a date is disabled when ANY callback returns false. The
	 *  callback receives a local-midnight `Date`. */
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>
	/** Range mode: max inclusive day span of a selection. @default none */
	maxRangeSpan?: number
	/** Range mode: min inclusive day span; 2 forbids same-day ranges.
	 *  @default 1 */
	minRangeSpan?: number
	/** Controlled visible month (any ISO day in it). */
	focusDate?: ISODateString
	onFocusDateChange?: (focusDate: ISODateString) => void
	/** Render adjacent-month pad days (dimmed, never interactive).
	 *  @default true */
	hasOutsideDays?: boolean
	/** ISO week-number column. @default false */
	hasWeekNumbers?: boolean
	/** Trim the grid to the month's own weeks instead of the fixed 6-row
	 *  layout. @default false */
	hasVariableRowCount?: boolean
	/** First column of the week grid — number (0=Sun) or three-letter day
	 *  name. @default 0 */
	weekStartsOn?: DayOfWeek | DayOfWeekName
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface CalendarSingleProps extends CalendarBaseProps {
	mode?: 'single'
	value?: ISODateString
	defaultValue?: ISODateString
	/** Fires with the ISO day plus a local-midnight `Date` convenience. */
	onChange?: (value: ISODateString, valueAsDate: Date) => void
}

export interface CalendarRangeProps extends CalendarBaseProps {
	mode: 'range'
	value?: DateRange
	defaultValue?: DateRange
	onChange?: (value: DateRange) => void
}

/** A self-drawn month calendar — same value model on every target. Keyboard
 *  grid navigation is web; native hardware-key delivery is not implemented. Native cells announce through
 *  `accessibility*` props rather than ARIA. */
export type CalendarProps = CalendarSingleProps | CalendarRangeProps

export type SharedDateFormat = 'date' | 'date_long' | 'date_weekday' | 'system_date'

// Public Astryx names stay available even where the shared field layer owns
// the underlying type contract.
export type DateInputSize = FieldControlSize
export type TimeInputSize = FieldControlSize
export type DateTimeInputSize = FieldControlSize
export type DateRangeInputSize = FieldControlSize
export type DateInputFormat = SharedDateFormat
export type TimeInputHourFormat = '12h' | '24h'
export type DateTimeInputHourFormat = TimeInputHourFormat
export type DateTimeInputTimeIncrement = 1 | 5 | 10 | 15 | 30
export type DateTimeInputTimeOptionInterval = 5 | 10 | 15 | 30 | 60
export type DateInputNativePicker = NativePickerPolicy
export type TimeInputNativePicker = NativePickerPolicy
export type DateTimeInputNativePicker = NativePickerPolicy
export type DateInputStatus = FieldStatus
export type DateInputStatusType = FieldStatusType
export type TimeInputStatus = FieldStatus
export type TimeInputStatusType = FieldStatusType
export type DateTimeInputStatus = FieldStatus
export type DateTimeInputStatusType = FieldStatusType
export type DateRangeInputStatus = FieldStatus
export type DateRangeInputStatusType = FieldStatusType
/** Typed date entry + calendar. The default `presentation` is
 *  `adaptive-native`: fine pointers get the typed field + calendar popover,
 *  coarse pointers the platform picker (web) or the self-drawn sheet
 *  (native). */
export interface DateInputProps extends FieldControlProps, DateLocaleProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value?: ISODateString
	onChange?: (value: ISODateString | undefined) => void
	/** Async follow-up after `onChange`; the field stays busy until it
	 *  resolves. */
	changeAction?: (value: ISODateString | undefined) => void | Promise<void>
	min?: ISODateString
	max?: ISODateString
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>
	/** Closed-value format — a named shared format or a mapper from ISO.
	 *  @default 'date_long' */
	format?: DateInputFormat | ((iso: ISODateString) => string)
	hasClear?: boolean
	hasAutoFocus?: boolean
	presentation?: DateInputPresentation
	/** @deprecated Use `presentation`; `presentation` wins when both set. */
	nativePicker?: DateInputNativePicker
	placeholder?: string
	ref?: Octane.Ref<TextInputHandle>
	/** Calendar popover pane count. Ignored by the `native` surface.
	 *  @default 1 */
	numberOfMonths?: 1 | 2
	weekStartsOn?: DayOfWeek | DayOfWeekName
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TimeInputProps extends FieldControlProps, DateLocaleProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value?: ISOTimeString
	onChange?: (value: ISOTimeString | undefined) => void
	changeAction?: (value: ISOTimeString | undefined) => void | Promise<void>
	min?: ISOTimeString
	max?: ISOTimeString
	/** Include a seconds segment. @default false */
	hasSeconds?: boolean
	hasClear?: boolean
	hasAutoFocus?: boolean
	/** Display format of the closed field. @default '12h' */
	hourFormat?: TimeInputHourFormat
	/** Arrow-key / stepper minute increment. @default 1 */
	increment?: number
	/** @default 'adaptive-native' */
	presentation?: TimeInputPresentation
	/** @deprecated Use `presentation`; `presentation` wins when both set.
	 *  `never` maps to `text-input`. */
	nativePicker?: TimeInputNativePicker
	placeholder?: string
	ref?: Octane.Ref<TextInputHandle>
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Date and time under one label — a date segment and a time segment whose
 *  commits combine into the ISODateTimeString value. */
export interface DateTimeInputProps extends FieldControlProps, DateLocaleProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value?: ISODateTimeString
	onChange: (value: ISODateTimeString | undefined) => void
	changeAction?: (value: ISODateTimeString | undefined) => void | Promise<void>
	/** Earliest selectable instant — constrains the calendar and (when the
	 *  picked day equals `min`'s day) the time segment. */
	min?: ISODateTimeString
	max?: ISODateTimeString
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>
	hasSeconds?: boolean
	/** @default '12h' */
	hourFormat?: DateTimeInputHourFormat
	/** Arrow-key minute step for the time segment. @default 1 */
	timeIncrement?: DateTimeInputTimeIncrement
	/** Preset-time list cadence for the time segment (e.g. 15 → quarter
	 *  hours). When set the time field offers a selectable option list;
	 *  typing still accepts times between options. Pointer platforms only —
	 *  touch sheets use wheels instead. */
	timeOptionInterval?: DateTimeInputTimeOptionInterval
	hasClear?: boolean
	placeholder?: string
	/** Time segment placeholder. @default "Select a time" */
	timePlaceholder?: string
	/** Accessible name of the time segment. @default `${label} time` */
	timeLabel?: string
	/** @default 'adaptive-native' */
	presentation?: DateTimeInputPresentation
	/** @deprecated Use `presentation`; `presentation` wins when both set. */
	nativePicker?: DateTimeInputNativePicker
	ref?: Octane.Ref<TextInputHandle>
	/** Calendar pane count on the popover/sheet surface. @default 1 */
	numberOfMonths?: 1 | 2
	weekStartsOn?: DayOfWeek | DayOfWeekName
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Trigger + range calendar. Always controlled: `value` is the committed
 *  range or null, `onChange` reports commits and clears. */
export interface DateRangeInputProps extends FieldControlProps, DateLocaleProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value: DateRange | null
	onChange: (value: DateRange | null) => void
	changeAction?: (value: DateRange | null) => void | Promise<void>
	min?: ISODateString
	max?: ISODateString
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>
	maxRangeSpan?: number
	minRangeSpan?: number
	/** Quick ranges beside the calendar. Invalid endpoint/span selections
	 *  are disabled; an accepted preset closes the picker. */
	presets?: ReadonlyArray<DateRangePreset>
	/** @default true */
	hasClear?: boolean
	placeholder?: string
	/** @default 2 */
	numberOfMonths?: 1 | 2
	weekStartsOn?: DayOfWeek | DayOfWeekName
	ref?: Octane.Ref<TextInputHandle>
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Pull-to-refresh contract — shared by `ScrollableArea` and the platform
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

/** A logical row reported by a platform list's viewability callback. */
export interface ListVisibleItem<T = unknown> {
	item: T
	index: number
}

/** A change to the set of rows that meet the configured viewability rules. */
export interface ListViewabilityChange<T = unknown> extends ListVisibleItem<T> {
	isViewable: boolean
}

/** Current viewable rows and the rows that entered or left in this update.
 *  Both arrays are ordered by data index. */
export interface ListViewabilityInfo<T = unknown> {
	viewableItems: readonly ListVisibleItem<T>[]
	changed: readonly ListViewabilityChange<T>[]
}

/** Percentage of each row that must intersect the list viewport and how
 *  long it must remain visible before it is reported. Defaults match the
 *  NativeScript feed contract: 50 percent for 250 milliseconds. */
export interface ListViewabilityConfig {
	itemVisiblePercentThreshold?: number
	minimumViewTime?: number
}

/** Imperative operations exposed by `UITableView` and `RecyclerView`. */
export interface PlatformListHandle {
	/** Scroll to a valid item index. Invalid or unavailable indexes are no-ops. */
	scrollToIndex(index: number, options?: { animated?: boolean }): void
}

/** Props for platform-authentic list widgets (`UITableView`/`RecyclerView`).
 *  Shared content `List` has its own `ListProps` below. */
export interface PlatformListProps<T = unknown> extends RefreshProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	items: T[]
	renderItem: (item: T, index: number) => Renderable
	renderEmpty?: () => Renderable
	/** Ref to a platform-neutral list handle. It is cleared on unmount. */
	ref?: Octane.Ref<PlatformListHandle>
	/** Initial row to scroll to after the list mounts. Invalid indexes are
	 *  ignored. */
	initialScrollIndex?: number
	/** Rows crossing the threshold and dwell time are reported by logical data
	 *  index, not by recycled native cell identity. */
	viewabilityConfig?: ListViewabilityConfig
	onViewableItemsChanged?: (info: ListViewabilityInfo<T>) => void
	/** iOS row-height estimate (UITableView only). */
	estimatedItemHeight?: number
	/** Called when the list approaches its end. */
	onEndReached?: () => void
	/** Platform escape hatches, applied after the shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Props accepted by `UITableView` (`@octane-xplat/ui/ios`). */
export type UITableViewProps<T = any> = PlatformWidgetProps<PlatformListProps<T>>
/** Handle exposed by `UITableView`'s `ref` (`@octane-xplat/ui/ios`). */
export type UITableViewHandle = PlatformListHandle
/** Props accepted by `RecyclerView` (`@octane-xplat/ui/android`). */
export type RecyclerViewProps<T = any> = PlatformWidgetProps<PlatformListProps<T>>
/** Handle exposed by `RecyclerView`'s `ref` (`@octane-xplat/ui/android`). */
export type RecyclerViewHandle = PlatformListHandle

/** Logical scroll axis (Astryx `ScrollableArea`): 'inline' follows the
 *  writing direction's inline axis (horizontal in LTR/RTL), 'block' the
 *  block axis (vertical in horizontal writing modes), 'both' scrolls both.
 *  Native maps inline→horizontal and block→vertical. */
export type ScrollAxis = 'inline' | 'block' | 'both'

/** Whether effective axes continue scrolling an ancestor at their edge.
 *  Web maps to `overscroll-behavior`; NativeScript scroll views never chain
 *  to a non-scrolling parent, so 'contain' is already the native semantic
 *  and 'allow' only differs on web. */
export type ScrollOverscroll = 'allow' | 'contain'

/** Whether a fitting (non-overflowing) viewport stays the sticky boundary
 *  for descendants. Web CSS semantics only; native has no position:sticky
 *  equivalent and ignores this. */
export type ScrollStickyContainment = 'whenScrollable' | 'always'

/** Which element carries the keyboard-scrollable tab stop and accessible
 *  name. Web semantics — native scroll views scroll without a tab stop. */
export type ScrollKeyboardAccess =
	| { owner: 'content' }
	| { owner: 'viewport'; label: string; role?: 'group' | 'region' }
	| { owner: 'contentOrViewport'; label: string; role?: 'group' | 'region' }

export interface ScrollAxisState {
	/** The axis currently overflows its viewport on an allowed axis. */
	isScrollable: boolean
	/** The viewport is at the axis's start edge (or the axis is not scrollable). */
	atStart: boolean
	/** The viewport is at the axis's end edge (or the axis is not scrollable). */
	atEnd: boolean
}

export interface ScrollableAreaState {
	inline: ScrollAxisState
	block: ScrollAxisState
}

export interface UseScrollableAreaOptions {
	/** Logical axis or axes where scrolling is allowed. @default 'block' */
	axis?: ScrollAxis
	/** Keyboard/tab-stop ownership. Web only. */
	keyboardAccess?: ScrollKeyboardAccess
	overscroll?: ScrollOverscroll
	stickyContainment?: ScrollStickyContainment
}

export interface UseScrollableAreaResult {
	/** Merges behavior-owned props (ref/role/tabIndex/overflow/data attrs)
	 *  into caller props for the viewport element or native scroll view. */
	getViewportProps(props?: Record<string, unknown>): Record<string, any>
	/** Merges the observed-content marker + ref into the content box props. */
	getContentProps(props?: Record<string, unknown>): Record<string, any>
	/** Live per-axis overflow/edge state. */
	state: ScrollableAreaState
}

/** Imperative operations exposed by `ScrollableArea` via `ref`. Calls before
 *  the viewport mounts are no-ops; the handle is cleared on unmount. */
export interface ScrollableAreaHandle {
	/** Scrolls each listed axis to an absolute content offset — a distance
	 *  from the axis's start edge in viewport units (px on web, dips on
	 *  iOS/Android, points on macOS), clamped to the scrollable range.
	 *  Omitted axes keep their position. `animated` (default false) uses the
	 *  platform's scroll animation where the leaf provides one. */
	scrollToOffset(offset: { inline?: number; block?: number }, options?: { animated?: boolean }): void
	/** The platform scroll viewport (`HTMLElement` / NS `ScrollView` / AppKit
	 *  `NSScrollView`) — escape hatch for anything the shared contract does
	 *  not cover. */
	native: any
}

/** A native scroll viewport with axis-aware accessibility (Astryx
 *  `ScrollableArea`). The root is the scroll container; children render
 *  inside a content box. Pull-to-refresh props (`refreshing`, `onRefresh`,
 *  `refreshThreshold`) are an xplat extension with no upstream equivalent —
 *  they only apply on the block axis on web/iOS/Android. macOS does not
 *  support pull-to-refresh; use an app-owned refresh action. */
export interface ScrollableAreaProps extends LayoutChildProps, AccessibilityProps, RefreshProps, TestIDProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Logical axis or axes where scrolling is allowed. @default 'block' */
	axis?: ScrollAxis
	/** Accessible name for the viewport; used as the scroll region's label
	 *  (web `aria-label`, native `accessibilityLabel`). */
	label?: string
	/** Semantics for the named scroll viewport. Web emits ARIA `role`;
	 *  native has no group/region role and ignores this. @default 'group' */
	role?: 'group' | 'region'
	overscroll?: ScrollOverscroll
	/** Viewport sizing; numbers are CSS px on web, dips on mobile, points on macOS. */
	width?: number | string
	height?: number | string
	maxWidth?: number | string
	minHeight?: number | string
	stickyContainment?: ScrollStickyContainment
	/** Content padding on every edge, in spacing steps (1 step = 4px/dip). */
	padding?: number
	paddingInline?: number
	paddingInlineStart?: number
	paddingInlineEnd?: number
	paddingBlock?: number
	paddingBlockStart?: number
	paddingBlockEnd?: number
	/** Web only: escape inherited container padding on the viewport's block
	 *  edges via negative margins. Inert on native. @default false */
	isFullBleed?: boolean
	/** Ref to a portable `ScrollableAreaHandle` — logical-axis scrolling plus
	 *  `native` for the raw platform viewport. It is cleared on unmount. */
	ref?: Octane.Ref<ScrollableAreaHandle>
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Options accepted by the `VirtualList` key/index seeks. */
export interface VirtualListScrollOptions {
	animated?: boolean
	/** Where the target row lands in the viewport. @default 'start' */
	align?: 'start' | 'center' | 'end'
}

/** Imperative operations exposed by `VirtualList` via `ref`. Calls before
 *  the list mounts are no-ops; the handle is cleared on unmount. */
export interface VirtualListHandle {
	/** Scrolls the viewport so its content sits `offset` units from the top —
	 *  px on web, dips on iOS/Android, points on macOS. Values clamp to the
	 *  scrollable range; `animated` (default false) uses the platform's
	 *  scroll animation where the leaf provides one. */
	scrollToOffset(offset: number, options?: { animated?: boolean }): void
	/** Scrolls so the item at `index` lands on the aligned viewport edge.
	 *  An index is positional: it follows inserts and reorders rather than
	 *  tracking an item — use `scrollToItem` to seek by identity. Rows
	 *  above an unvisited target are estimated, so a deep seek can land
	 *  short; call again once intervening rows measure. */
	scrollToIndex(index: number, options?: VirtualListScrollOptions): void
	/** Same seek as `scrollToIndex`, addressed by the item's `keyExtractor`
	 *  key. Unknown keys are a no-op. */
	scrollToItem(key: Key, options?: VirtualListScrollOptions): void
	/** The platform scroll view (`HTMLElement` / NS `ScrollView` / AppKit
	 *  `NSScrollView`) — escape hatch for anything the shared contract does
	 *  not cover. */
	native: any
}

/** Shared virtualized vertical list. Item keys must be unique and stable
 *  across inserts and reorders. Rows outside the rendered window unmount;
 *  keep durable row state keyed by item identity outside the row component. */
export interface VirtualListProps<T = unknown> extends LayoutChildProps, AccessibilityProps, TestIDProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Ref to a platform-neutral scroll handle. It is cleared on unmount. */
	ref?: Octane.Ref<VirtualListHandle>
	items: readonly T[]
	/** Returns each item's stable `Key`; must be unique and survive reorder.
	 *  Defaults to `defaultItemKey` — the item's `id` or `key` property;
	 *  items without either throw instead of guessing a positional key. */
	keyExtractor?: (item: T, index: number) => Key
	getItemType?: (item: T, index: number) => Key
	renderItem: (item: T, index: number) => Renderable
	renderEmpty?: () => Renderable
	renderHeader?: () => Renderable
	renderFooter?: () => Renderable
	renderSeparator?: () => Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface WebViewHandle {
	/** Re-request the current document. */
	reload(): void
	/** Frame-local history navigation. */
	goBack(): void
	goForward(): void
	stopLoading(): void
	/** The platform view (`HTMLIFrameElement` / NS `WebView` / AppKit `WKWebView`). */
	native: HostElement
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

interface WebViewBaseProps extends LayoutChildProps, AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	id?: string
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
	 *  `scrollEnabled`, AppKit uses hidden document overflow,
	 *  Android eats move touch events on the view (link
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
	ref?: Octane.Ref<WebViewHandle>
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Embedded web document — hosted bucket: web renders a sandboxed
 *  `<iframe>`, native renders the OS web view (`webview` → WKWebView /
 *  android.webkit.WebView). The *frame* is normalized; the document's
 *  pixels belong to each platform's engine, same as TextInput's IME.
 *  No JS bridge: iframe `postMessage`, WKScriptMessageHandler, and
 *  `addJavascriptInterface` have different page-side contracts, so a
 *  shared one would be fake parity — reach it through the escape bags.
 *
 *  Exactly one source is required: `src` or `html`. */
export type WebViewProps = WebViewBaseProps &
	(
		| {
				/** Remote document URL. Native also accepts `~/` bundle paths and
				 *  absolute file paths (NS `src` grammar). AppKit resolves `~/`
				 *  relative to the app bundle resources and permits reads in the
				 *  file's directory. */
				src: string
				html?: never
			}
		| {
				/** Inline HTML document — web `srcdoc`; native loads it through
				 *  the `src` property's data path
				 *  (`loadHTMLString`/`loadDataWithBaseURL`). Treated as trusted
				 *  content — the default web sandbox keeps `allow-same-origin`,
				 *  so a srcdoc document can reach the embedding page. */
				html: string
				src?: never
			}
	)

/** A density/size-qualified entry in a multi-resolution `Image.src` array —
 *  the native `srcset` analog. `uri` takes the same grammar as a string
 *  `src`. `width`/`height` declare the source's display size (dips) and
 *  `scale` its density multiplier, so file pixels are `width·scale`: the
 *  selector compares `width·height·scale²` against the view's pixel count
 *  and loads the closest match once a real layout exists. */
export interface ImageSourceLike {
	uri: string
	width?: number
	height?: number
	scale?: number
}

/** How the bitmap is sized inside the element's box — the CSS `object-fit`
 *  vocabulary (same contract as expo-image `contentFit`). Default 'cover'. */
export type ImageContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'

/** One edge value in a `contentPosition`: dips from the named edge, a
 *  percentage of the free space along that axis, or 'center' (= '50%'). */
export type ImageContentPositionValue = number | `${number}%` | 'center'

export interface ImageContentPositionObject {
	top?: ImageContentPositionValue
	right?: ImageContentPositionValue
	bottom?: ImageContentPositionValue
	left?: ImageContentPositionValue
}

export type ImageContentPositionString =
	| 'center'
	| 'top'
	| 'right'
	| 'bottom'
	| 'left'
	| 'top center'
	| 'top right'
	| 'top left'
	| 'right center'
	| 'right top'
	| 'right bottom'
	| 'bottom center'
	| 'bottom right'
	| 'bottom left'
	| 'left center'
	| 'left top'
	| 'left bottom'

/** Where the drawn bitmap sits inside the element's box — CSS
 *  `object-position`. A keyword string, or an object naming one horizontal
 *  and one vertical edge. Default centered on every platform. */
export type ImageContentPosition = ImageContentPositionObject | ImageContentPositionString

/** When the bitmap is decoded — the HTML `decoding` attribute's vocabulary.
 *  'async' decodes off the UI thread, 'sync' decodes during the `src`
 *  assignment. */
export type ImageDecoding = 'async' | 'sync'

export interface ImageProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** A single source — `res://name`, `~/bundle-path`, file path, remote
	 *  URL, or data:/inline-SVG URI — or a resolution-qualified array
	 *  (closest pixel count wins; the `srcset` model). */
	src: string | ImageSourceLike[]
	alt?: string
	/** Placeholder shown while `src` loads — painted inside the same image
	 *  view so the swap can't blank or mismatch fit (expo-image study L5).
	 *  Accepts `blurhash:<hash>` / `thumbhash:<base64>` (decoded to a small
	 *  PNG in JS) plus any synchronously resolvable `src` grammar (`data:`
	 *  base64, `res://name`, `~/`, file path). Remote URLs are ignored on
	 *  native — a placeholder that must fetch first is pointless. On web any
	 *  `img.src` URL works (e.g. a low-res image). No-op on macOS, where
	 *  image loads are synchronous. Ignored for SVG srcs. */
	placeholder?: string
	/** Item identity for recycled platform-list cells (RecyclerView/UITableView
	 *  rebind the same view). When the key changes between binds, the previous
	 *  bitmap is cleared before the new `src` load starts, so the cell never
	 *  flashes the prior item's image (expo-image's `recyclingKey`). Web and
	 *  macOS leaves ignore it: their lists remount keyed rows rather than
	 *  rebinding a reused host. */
	recyclingKey?: string
	/** Bitmap sizing inside the box — CSS `object-fit`. Default 'cover' on
	 *  every platform (the platform-native defaults disagree: web `img` is
	 *  `fill`, NS stretch is `aspectFit`). */
	contentFit?: ImageContentFit
	/** Bitmap alignment inside the box — CSS `object-position`. Native
	 *  honors it by laying out the image itself (measured path), so
	 *  arbitrary positions match web pixel-for-pixel. */
	contentPosition?: ImageContentPosition
	/** Decode scheduling hint — the HTML `decoding` attribute. 'async'
	 *  (default): the bitmap decodes off the UI thread and may paint a frame
	 *  late. 'sync': decoded during the `src` assignment, blocking the UI
	 *  thread — for small bitmaps that must appear without a flicker.
	 *  Native maps to NS `loadMode` for file/resource/data srcs; remote URLs
	 *  always decode async and font-icon srcs are always sync regardless.
	 *  Web writes the `decoding` attribute. macOS ignores it — AppKit image
	 *  loads are synchronous. */
	decoding?: ImageDecoding
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface ScreenProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
}

// ---------- device seams ----------

export interface SafeAreaProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	/** Do not inset the child away from the system's safe area. */
	ignoreSafeArea?: boolean
	/** NativeScript props applied to the host after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
}

export interface KeyboardAvoidingProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
}

export interface DrawerProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	main?: Renderable
	drawer?: Renderable
	/** Controlled visibility — pair with `onDismiss`. */
	open?: boolean
	/** Initial visibility for uncontrolled use; `open` wins when both are
	 *  set. Uncontrolled dismissal closes the drawer itself. */
	defaultOpen?: boolean
	/** Backdrop tap — the self-drawn leaf fires it on both platforms. */
	onDismiss?: () => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Props accepted by `SideDrawer` (`@octane-xplat/ui/ios`). */
export type SideDrawerProps = PlatformWidgetProps<DrawerProps>
/** Props accepted by `DrawerLayout` (`@octane-xplat/ui/android`). */
export type DrawerLayoutProps = PlatformWidgetProps<DrawerProps>

export interface SwitchProps extends FieldControlProps, TestIDProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Optional explicit accessible name override for the switch. */
	accessibilityLabel?: string
	/** Controlled checked state — pair with `onCheckedChange`. */
	checked?: boolean
	/** Initial checked state for uncontrolled use; `checked` wins when both
	 *  are set. */
	defaultChecked?: boolean
	/** Called with the requested next state when the user toggles. */
	onCheckedChange?: (checked: boolean) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Props for the platform-authentic switches — `UISwitch` (`ui/ios`) and
 *  `MaterialSwitch` (`ui/android`). These are bare OS widgets, so unlike the
 *  shared `SwitchProps` they carry only what the host control can deliver:
 *  `isDisabled` disables it (`isEnabled`), `isReadOnly` blocks toggling
 *  without the disabled appearance, and `label`, `description`,
 *  `disabledMessage`, and the `accessibility*` names resolve to the widget's
 *  spoken name and hint — an enclosing `Field` supplies the same through
 *  context. Visible label, status, sizing, and validation chrome live on
 *  `Field`, not on the widget itself. */
export interface PlatformSwitchProps extends TestIDProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Controlled checked state — pair with `onCheckedChange`. */
	checked?: boolean
	/** Initial checked state for uncontrolled use; `checked` wins when both
	 *  are set. Without `checked` the OS widget owns its state. */
	defaultChecked?: boolean
	/** Called with the requested next state when the user toggles. */
	onCheckedChange?: (checked: boolean) => void
	isDisabled?: boolean
	isReadOnly?: boolean
	/** Spoken name source — the platform widget renders no visible label. */
	label?: string
	/** Folded into the widget's spoken hint. */
	description?: string
	/** Appended to the spoken hint while the widget is disabled. */
	disabledMessage?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Props accepted by `UISwitch` (`@octane-xplat/ui/ios`). */
export type UISwitchProps = PlatformWidgetProps<PlatformSwitchProps>
/** Props accepted by `MaterialSwitch` (`@octane-xplat/ui/android`). */
export type MaterialSwitchProps = PlatformWidgetProps<PlatformSwitchProps>

export interface ActivityIndicatorProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	busy?: boolean
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Props accepted by `UIActivityIndicatorView` (`@octane-xplat/ui/ios`). */
export type UIActivityIndicatorViewProps = PlatformWidgetProps<ActivityIndicatorProps>
/** Props accepted by `CircularProgressIndicator` (`@octane-xplat/ui/android`). */
export type CircularProgressIndicatorProps = PlatformWidgetProps<ActivityIndicatorProps>

/** Meter — a static gauge of a quantity within a known range (disk used,
 *  battery, rating), not task progress; use `ProgressBar` for operations.
 *  Exposes the `meter` accessibility role (`role="meter progressbar"` on web,
 *  matching the React Aria fallback spelling; NativeScript's role enum has no
 *  meter so `progressBar` is the platform fallback, AppKit reports
 *  AXLevelIndicator). */
export interface MeterProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	/** Current quantity, clamped to the [minValue, maxValue] range. */
	value: number
	/** Lower bound of the measured range. @default 0 */
	minValue?: number
	/** Upper bound of the measured range. @default 100 */
	maxValue?: number
	/** @deprecated Use `maxValue`; `maxValue` wins when both are set. */
	max?: number
	/** Human-readable value description reported to assistive technology —
	 *  `aria-valuetext` on web (for example "6 GB of 10 GB used"). */
	valueLabel?: string
	size?: number
	strokeWidth?: number
	color?: string
	trackColor?: string
	accessibilityLabel?: string
}

export interface SliderProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	value: number
	minValue?: number
	maxValue?: number
	disabled?: boolean
	onValueChange?: (value: number) => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Props accepted by `UISlider` (`@octane-xplat/ui/ios`). */
export type UISliderProps = PlatformWidgetProps<SliderProps>
/** Props accepted by `SeekBar` (`@octane-xplat/ui/android`). */
export type SeekBarProps = PlatformWidgetProps<SliderProps>

/** Identifiers of the framework-provided icons — registered automatically
 *  and used by built-in affordances (search/clear glyphs, disclosure and
 *  navigation chevrons, transport and status marks). An app registering
 *  the same name overrides the bundled glyph. */
export type BuiltinIconName =
	| 'xplat-calendar'
	| 'xplat-check'
	| 'xplat-check-double'
	| 'xplat-chevron-down'
	| 'xplat-chevron-left'
	| 'xplat-chevron-right'
	| 'xplat-chevron-up'
	| 'xplat-clear'
	| 'xplat-clock'
	| 'xplat-close'
	| 'xplat-copy'
	| 'xplat-doc-image'
	| 'xplat-error'
	| 'xplat-mic'
	| 'xplat-more-horizontal'
	| 'xplat-pause'
	| 'xplat-play'
	| 'xplat-search'
	| 'xplat-send'
	| 'xplat-stop'
	| 'xplat-upload'
	| 'xplat-volume'
	| 'xplat-volume-off'
	| 'xplat-warning'
	| 'xplat-wrench'

/** Augmentation point for app-registered icon identifiers. Declare module
 *  '@octane-xplat/ui' and add the names your `registerIcon` calls use;
 *  `IconName` then closes to the built-ins plus the declared names and
 *  unregistered identifiers become type errors:
 *
 *  declare module '@octane-xplat/ui' {
 *  	interface IconNameRegistry {
 *  		'my-logo': true
 *  	}
 *  }
 */
export interface IconNameRegistry {}

/** A registered icon identifier. Without augmentation this is the built-in
 *  `xplat-*` names plus any string — registration is runtime, so unlisted
 *  names stay assignable and resolve once registered. Once
 *  `IconNameRegistry` is augmented the union closes to the declared names. */
export type IconName = keyof IconNameRegistry extends never
	? BuiltinIconName | (string & {})
	: BuiltinIconName | (keyof IconNameRegistry & string)

export interface IconProps {
	className?: ClassName
	id?: string
	/** Registered icon identifier — a built-in `xplat-*` name or a name
	 *  registered through `registerIcon`/`registerIcons`. An unregistered
	 *  name renders nothing. */
	name: IconName
	/** Override the registry for this icon. Use IconRegistryProvider to scope
	 *  several icons and components to one registry. */
	registry?: IconRegistry
	size?: number
	color?: string
	/** Accessible name — set it when the icon carries meaning on its own.
	 *  Omitted keeps the glyph decorative (hidden from assistive tech). */
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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

/** Mutable icon lookup scope. Each registry starts with the framework glyphs. */
export interface IconRegistry {
	registerIcon(name: string, glyph: IconGlyph): void
	registerIcons(record: Record<string, IconGlyph>): void
	getIcon(name: string): IconGlyph | undefined
}

export interface IconRegistryProviderProps {
	value: IconRegistry
	children?: Renderable
}

export interface HeadingProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	id?: string
	level?: 1 | 2 | 3 | 4 | 5 | 6
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- overlays ----------

export interface OverlayProps extends TestIDProps {
	/** Accessible name for the modal content surface. */
	accessibilityLabel?: string
	/** Controlled visibility — pair with `onDismiss`. */
	open?: boolean
	/** Initial visibility for uncontrolled use; `open` wins when both are
	 *  set. Uncontrolled dismissal closes the overlay itself. */
	defaultOpen?: boolean
	/** Called when the user requests dismissal (shade tap, Escape). */
	onDismiss?: () => void
	/** Enables a RootLayout shade that dismisses when tapped. */
	shadeCover?: boolean
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'
/** Cross-axis alignment for anchored layers — 'start' (the historical
 *  default) keeps the panel flush with the anchor's start edge. */
export type PopoverAlignment = 'start' | 'center' | 'end'

/** A platform-neutral ref to the host view or element that owns a popover. */
export interface PopoverAnchorRef {
	readonly current: unknown
}

export interface PopoverProps {
	/** Ref to a native view or web element, commonly populated by `ref`. */
	anchor: PopoverAnchorRef
	/** Controlled visibility — pair with `onDismiss`. */
	open?: boolean
	/** Initial visibility for uncontrolled use; `open` wins when both are
	 *  set. Uncontrolled dismissal closes the popover itself. */
	defaultOpen?: boolean
	placement?: PopoverPlacement
	/** Cross-axis alignment within the placement. @default 'start' */
	alignment?: PopoverAlignment
	/** Clearance in dips/px; web also resolves CSS lengths. Native accepts numbers or px strings. @default 8 */
	offset?: number | string
	dismissOnOutsideTap?: boolean
	/** Escape requests dismissal when this is the top layer. False blocks
	 *  Escape from reaching a layer below. @default true */
	dismissOnEscape?: boolean
	/** Return target when popover content received focus (web), or an explicit
	 *  native focus target. Defaults to the anchor on web. */
	finalFocusRef?: { current: HostElement | null }
	onDismiss?: () => void
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- useLayer (Astryx `useLayer`) ----------

/** Logical placement of a layer relative to its anchor (Astryx
 *  `LayerPlacement`). 'above'/'below' are the block sides (top/bottom);
 *  'start'/'end' are the inline sides and mirror under the anchor's RTL direction. Physical `PopoverPlacement`
 *  sides are also accepted wherever a layer placement is taken. */
export type LayerPlacement = 'above' | 'below' | 'start' | 'end'
/** Alignment along the cross axis (Astryx `LayerAlignment`). */
export type LayerAlignment = 'start' | 'center' | 'end'

interface LayerBaseOptions {
	/** Controlled visibility. show/hide request changes through onShow/onHide. */
	isOpen?: boolean
	/** Fires when the layer becomes visible. */
	onShow?: () => void
	/** Fires when the layer hides — including outside dismissal. */
	onHide?: () => void
	/** Dismiss the layer on outside tap/click (and Escape on web).
	 *  @default false */
	lightDismiss?: boolean
	/** Override Escape dismissal independently of outside taps. Defaults to
	 *  lightDismiss; false blocks Escape from closing a layer below. */
	dismissOnEscape?: boolean
}

/** `useLayer` options for anchor-relative positioning (Astryx context mode). */
export interface ContextLayerOptions extends LayerBaseOptions {
	mode: 'context'
	/** Accepted for API parity: layers always mount content only while open,
	 *  so the flag is a no-op in this implementation. */
	lazyMount?: boolean
}

/** `useLayer` options for manual x/y positioning (Astryx fixed mode). */
export interface FixedLayerOptions extends LayerBaseOptions {
	mode: 'fixed'
}

export type LayerOptions = ContextLayerOptions | FixedLayerOptions

/** Render props for `useLayer` context mode — `render(children, props)`. */
export interface ContextRenderProps {
	/** Focus return target; defaults to the anchor on web. */
	finalFocusRef?: { current: HostElement | null }
	/** 'anchor' (default) derives the position from `placement`/`alignment`/
	 *  `offset`. 'custom' authors the position via `style` (web: e.g. CSS
	 *  `anchor()` insets against the returned `anchorId`; native: `left`/`top`
	 *  in page coordinates). */
	positioning?: 'anchor' | 'custom'
	/** Logical (or physical) side of the anchor. @default 'above' */
	placement?: LayerPlacement | PopoverPlacement
	/** Cross-axis alignment. @default 'center' */
	alignment?: LayerAlignment
	/** Clearance from the anchor — a number is dips/px; a web CSS length
	 *  resolves in the anchor writing context. Native accepts numbers or px only. @default 0 */
	offset?: number | string
	/** Accessible name for the layer surface. */
	accessibilityLabel?: string
	/** ARIA role on web (e.g. 'tooltip', 'dialog'). */
	accessibilityRole?: string
	className?: ClassName
	style?: StyleProp
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Render props for `useLayer` fixed mode — `render(children, {x, y})`.
 *  Coordinates are viewport px on web, page dips on native, and top-left-origin
 *  AppKit points on macOS. */
export interface FixedRenderProps {
	x: number
	y: number
	accessibilityLabel?: string
	accessibilityRole?: string
	className?: ClassName
	style?: StyleProp
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

interface LayerReturnBase {
	/** Show the layer. No-op while open. */
	show: () => void
	/** Hide the layer. No-op while closed. */
	hide: () => void
	/** Whether the layer is currently open. */
	isOpen: boolean
	/** Stable id for ARIA relationships (aria-describedby etc.). */
	id: string
}

/** `useLayer` return for context mode. */
export interface ContextLayerReturn extends LayerReturnBase {
	/** Bind callback for the anchor/trigger element or view. On web it also
	 *  stamps `anchor-name` so 'custom' positioning can use CSS anchor(). */
	ref: (el: HostElement) => void
	/** Positioning token identifying the anchor (web: the `anchor-name` CSS
	 *  value applied by `ref`; kept for upstream parity elsewhere). */
	anchorId: string
	/** Render layer content into the anchored surface. */
	render: (children: Renderable, props?: ContextRenderProps) => Renderable
}

/** `useLayer` return for fixed mode. */
export interface FixedLayerReturn extends LayerReturnBase {
	/** No anchor binding in fixed mode. */
	ref: undefined
	/** Render layer content at fixed coordinates. */
	render: (children: Renderable, props: FixedRenderProps) => Renderable
}

export type LayerReturn = ContextLayerReturn | FixedLayerReturn

/** Hover/focus-triggered floating card (Astryx `HoverCard`). The trigger is
 *  `children`; `content` is the card body. Pointer hover opens after
 *  `delay`, focus opens per `focusTrigger`, and on touch platforms a tap on
 *  a non-action trigger opens the card per `touchTrigger`. */
export interface HoverCardProps {
	id?: string
	/** Trigger content. */
	children?: Renderable
	/** Card body shown while open. Required for the card to appear. */
	content?: Renderable
	/** Side of the trigger the card opens on. 'above'/'below' map to
	 *  top/bottom; 'start'/'end' are logical and mirror under RTL on web.
	 *  @default 'above' */
	placement?: HoverCardPlacement
	/** Alignment along the placement axis. @default 'center' */
	alignment?: HoverCardAlignment
	/** Show delay in ms. @default 300 */
	delay?: number
	/** Hide delay after pointer/focus leave in ms. @default 200 */
	hideDelay?: number
	/** When focus opens the card: 'auto' only when the trigger is naturally
	 *  focusable (web: tag/tabIndex sniff; native: never). @default 'auto' */
	focusTrigger?: HoverCardFocusTrigger
	/** Tap behavior where there is no hover: 'auto' opens on tap unless the
	 *  trigger performs its own action (web detects button/link/controls;
	 *  native cannot, so 'auto' behaves as 'tap'), 'tap' always opens,
	 *  'none' never opens on touch. @default 'auto' */
	touchTrigger?: HoverCardTouchTrigger
	/** Enables hover/focus triggers. @default true */
	isEnabled?: boolean
	/** Accessible name for the popup. With a label the web card is a named
	 *  `role="dialog"`; without one it is `role="group"`. */
	label?: string
	/** Called with true/false when the card shows or hides. */
	onOpenChange?: (isOpen: boolean) => void
	/** Dashed-underline affordance on the trigger. 'auto' shows it for
	 *  text-only triggers. @default 'auto' */
	hasHoverIndication?: 'auto' | boolean
	/** Controlled open state — true force-shows, false force-hides,
	 *  undefined leaves hover/focus in charge. */
	isOpen?: boolean
	/** Show on mount (still dismissible). */
	isDefaultOpen?: boolean
	className?: ClassName
	style?: StyleProp
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export type HoverCardPlacement = 'above' | 'below' | 'start' | 'end'
export type HoverCardAlignment = 'start' | 'center' | 'end'
export type HoverCardFocusTrigger = 'auto' | 'always' | 'never'
export type HoverCardTouchTrigger = 'auto' | 'tap' | 'none'

export interface HoverCardOptions {
	placement?: HoverCardPlacement
	alignment?: HoverCardAlignment
	delay?: number
	hideDelay?: number
	focusTrigger?: HoverCardFocusTrigger
	touchTrigger?: HoverCardTouchTrigger
	isEnabled?: boolean
	label?: string
	isOpen?: boolean
	isDefaultOpen?: boolean
	onShow?: () => void
	onHide?: () => void
}

/** Headless hover-card behavior. `ref` binds position AND interaction on one
 *  element; `positionRef`/`interactionRef` split them. `renderHoverCard`
 *  returns the anchored card node (render in the tree). */
export interface HoverCardReturn {
	/** Combined ref callback — position anchor + hover/focus listeners. */
	ref: (el: HostElement) => void
	/** Bind callback for the positioning anchor only. */
	positionRef: (el: HostElement) => void
	/** Bind callback for the interaction (hover/focus/tap) element only. */
	interactionRef: (el: HostElement) => void
	/** Stable id identifying the open card (web: element id for
	 *  aria-controls/aria-describedby composition). */
	id: string
	/** Alias of `id` — the card's accessible-description id. */
	describedBy: string
	/** Web: the anchor element's positioning id (kept for upstream parity —
	 *  equals `id` in this implementation). */
	anchorId: string
	isOpen: boolean
	/** Render the card content into the anchored layer. */
	renderHoverCard: (children: Renderable, props?: Record<string, unknown>) => Renderable
	/** Imperatively show/hide, bypassing the delays. */
	show: () => void
	hide: () => void
}

/** Tooltip — `trigger` is the anchor content, `content` the hint body.
 *  Pointer platforms show the hint after hover/focus intent (web adds
 *  `aria-describedby` + Escape/scroll dismissal; macOS presents an anchored
 *  NSPopover). Touch targets render the trigger and never mount the hint —
 *  keep essential information out of `content`. */
export interface TooltipProps {
	id?: string
	trigger: Renderable
	content: Renderable
	/** Styling for the tooltip panel inside the popover. */
	contentClassName?: ClassName
	contentStyle?: StyleProp
	openDelay?: number
	closeDelay?: number
	placement?: PopoverPlacement
	disabled?: boolean
	className?: ClassName
	style?: StyleProp
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Toast status type — controls the surface tone and live-region urgency
 *  (web: `role="status"`/polite for info, `role="alert"`/assertive for
 *  error; error toasts default to not auto-hiding). */
export type ToastType = 'info' | 'error'

/** Edge the toast stack anchors to (Astryx `ToastViewport` positions). */
export type ToastPosition = 'topStart' | 'topEnd' | 'bottomStart' | 'bottomEnd'

export type ToastDismissReason = 'auto' | 'manual'
export type ToastCollisionBehavior = 'overwrite' | 'ignore'

export interface ToastOptions {
	/** Toast body — text or rendered nodes. */
	body?: Renderable
	/** @default 'info' */
	type?: ToastType
	/** Auto-dismiss after `autoHideDuration`. Defaults true for 'info',
	 *  false for 'error'. */
	isAutoHide?: boolean
	/** Auto-dismiss delay in ms. @default 5000 */
	autoHideDuration?: number
	/** Optional interactive content at the toast's end edge. */
	endContent?: Renderable
	/** Replaces the default surface layout; receives the toast's resolved
	 *  settings and dismiss function (Astryx `renderContent`). */
	renderContent?: ToastContentRenderFn
	/** Identity key: a second toast with the same uniqueID either replaces
	 *  the existing one in place ('overwrite', the default) or is suppressed
	 *  ('ignore'). */
	uniqueID?: string
	/** @default 'overwrite' */
	collisionBehavior?: ToastCollisionBehavior
	/** Called when the toast finishes hiding. `reason` is 'auto' for the
	 *  timer or 'manual' for explicit dismissal. */
	onHide?: (reason: ToastDismissReason) => void
	/** xplat extension: per-toast stack edge override. Defaults to the
	 *  viewport's `position` (or 'bottomEnd' when toasts fall back to the
	 *  auto-mounted viewport). */
	position?: ToastPosition
	/** xplat extension: when set, the toast is positioned by Popover
	 *  relative to this view instead of joining the edge stack. */
	anchor?: PopoverAnchorRef
	/** Placement used with `anchor`; `position` supplies the
	 *  above/below default. */
	placement?: PopoverPlacement
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Programmatic toast dismissal (Astryx `ToastDismissFn`). */
export type ToastDismissFn = () => void

/** Values passed to a custom toast content renderer — see
 *  `ToastOptions.renderContent`. */
export interface ToastContentRenderProps {
	/** Primary message content, as passed to the toast call. */
	body: Renderable
	/** Trailing content, as passed to the toast call. Place it in your layout. */
	endContent?: Renderable
	/** Resolved toast type — `'error'` also makes the live region assertive. */
	type: ToastType
	/** Whether this toast will dismiss itself. */
	isAutoHide: boolean
	/** Milliseconds until auto-dismiss, when `isAutoHide`. */
	autoHideDuration: number
	/** Dismisses this toast with reason `'manual'`. */
	dismiss: ToastDismissFn
}

/** Renders the content of one toast inside the toast surface. */
export type ToastContentRenderFn = (toast: ToastContentRenderProps) => Renderable

/** Owning handle for one toast shown through `useToast()`/`showToast`.
 *  The toast's identity, dismissal, and option updates are scoped to this
 *  instance — concurrent toasts don't share controls. */
export interface ToastHandle {
	/** Stable identity of the queued toast entry. */
	readonly id: string
	/** Dismiss this toast. Idempotent; reports reason 'manual' to
	 *  `onHide`. */
	dismiss: ToastDismissFn
	/** Replace this toast's options while it is queued or showing — same
	 *  identity, new body/type/timing. Include `uniqueID` to keep the
	 *  collision identity. No-op once the toast is dismissing or gone. */
	update(options: ToastOptions): void
}

/** The function `useToast()`/`showToast` returns — shows a toast, returns
 *  its handle, or `null` when a same-`uniqueID` toast with
 *  `collisionBehavior: 'ignore'` suppressed the new one. */
export type ShowToastFn = (options: ToastOptions) => ToastHandle | null

/** One queued/active toast inside a viewport. `viewportId`/`exiting` are
 *  managed by the toast stack — callers never set them. */
export interface ToastEntry {
	id: string
	options: ToastOptions
	/** Owning ToastViewport; absent entries render on the fallback stack. */
	viewportId?: string
	/** Set while the exit presentation runs before removal. */
	exiting?: boolean
}

/** The toast stack container. Render once at the app root — it hosts every
 *  toast pushed through `useToast()`/`showToast`. */
export interface ToastViewportProps {
	/** Edge the stack grows from. @default 'bottomEnd' */
	position?: ToastPosition
	/** Maximum number of visible toasts; older entries evict. @default 5 */
	maxVisible?: number
	/** Extra inset from the safe-area-aware edge gutter. */
	inset?: { top?: number; bottom?: number; start?: number; end?: number }
	/** Web only: promote the viewport into the CSS top layer (above modal
	 *  dialogs). Set false when rendering inside a dialog. @default true */
	isTopLayer?: boolean
	children?: Renderable
	className?: ClassName
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Inline toast card — the same surface ToastViewport renders. Useful for
 *  pinned/inline notifications outside the stack. */
export interface ToastProps {
	/** @default 'info' */
	type?: ToastType
	body?: Renderable
	endContent?: Renderable
	isAutoHide?: boolean
	autoHideDuration?: number
	/** Exiting presentation (collapsed/sliding). Managed by the viewport. */
	isExiting?: boolean
	/** Called with the reason when the toast requests dismissal. */
	onDismiss?: (reason: ToastDismissReason) => void
	renderContent?: ToastContentRenderFn
	className?: ClassName
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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
	/** Pass to a View's `ref` prop. */
	ref: (element: HostElement) => void
	bounds: MeasureBounds | null
}

export interface ModalProps {
	/** Controlled visibility — pair with `onClose`. */
	open?: boolean
	/** Initial visibility for uncontrolled use; `open` wins when both are
	 *  set. Uncontrolled dismissal closes the modal itself. */
	defaultOpen?: boolean
	/** Called with the modal's result value when the host closes it. */
	onClose?: (result?: ModalOpenResult) => void
	fullscreen?: boolean
	/** Native: sheet uses fullscreen=false (iOS form sheet; Android centered
	 *  dialog), fullscreen uses fullscreen=true. Web: dialog is a centered
	 *  card, sheet is bottom-anchored, fullscreen is the default dialog size. */
	presentation?: 'sheet' | 'fullscreen' | 'dialog'
	/** Component reference rendered inside the modal's separate root. When
	 *  both component and children are set, component takes precedence. */
	component?: HostedComponent
	/** Props passed to component. Context and theme do not cross modal roots. */
	params?: Record<string, unknown>
	children?: Renderable
}

/** Props accepted by `UIModal` (`@octane-xplat/ui/ios`). */
export type UIModalProps = ModalProps
/** Props accepted by `MaterialDialog` (`@octane-xplat/ui/android`). */
export type MaterialDialogProps = ModalProps

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

/** Owning handle for one imperative modal opened by `openModal`. It is the
 *  completion promise — `await` resolves with the value passed to
 *  `close(result)` or the presented component's own `close` — plus an
 *  instance-scoped close, so concurrent modals dispose independently. */
export interface ModalHandle extends Promise<ModalOpenResult> {
	/** Close this modal, resolving the handle with `result`. Idempotent —
	 *  a user dismissal or an earlier close wins. */
	close(result?: ModalOpenResult): void
}

/** Public function shape of the imperative modal service. */
export type OpenModal = (
	component: HostedComponent,
	params?: Record<string, unknown>,
	options?: ModalOpenOptions,
) => ModalHandle

// ---------- bottom sheet (in-window bottom panel) ----------

/** A snap stop for `BottomSheet`: a number in (0, 1] is a window-height
 *  fraction (`0.5` = 50%), a larger number is px/dips; a string is a
 *  percentage (`'50%'`) or pixel size (`'320px'`). The sheet's own height
 *  is the largest stop. */
export type BottomSheetSnapPoint = number | string

/** Declarative in-window bottom sheet (Astryx `BottomSheet`): a
 *  bottom-anchored panel on the enclosing screen's RootLayout (native) or a
 *  document-body layer (web). Unlike a routed modal, content stays inside
 *  the app window. When nested inside `BottomSheetSwitcher`, `sheetId`
 *  registers the panel under the switcher's shared host instead of opening
 *  its own overlay. */
export interface BottomSheetProps {
	/** Standalone controlled visibility — pair with `onOpenChange`.
	 *  Required for standalone use unless `defaultOpen` seeds uncontrolled
	 *  state; a `BottomSheetSwitcher` child's `activeSheet` owns visibility
	 *  instead. */
	isOpen?: boolean
	/** Initial standalone visibility for uncontrolled use; `isOpen` wins
	 *  when both are set and switcher children ignore it. Uncontrolled
	 *  dismissal closes the sheet itself. */
	defaultOpen?: boolean
	/** Required accessible name for the panel (web `aria-label`, native
	 *  `accessibilityLabel`). */
	label: string
	/** Called when the sheet is dismissed by the user/platform — scrim tap,
	 *  Escape, swipe-down, or hardware back — not on programmatic
	 *  `isOpen`→false transitions. */
	onOpenChange?: (isOpen: boolean) => void
	children?: Renderable
	/** Height budget: 'hug' sizes to content (≤92% of the window), 'capped'
	 *  at 62%, 'tall' at 92%; a number is px/dips and a string is a CSS/web
	 *  size or percent (percent resolves against the window). @default
	 *  'capped' */
	height?: 'hug' | 'capped' | 'tall' | number | string
	/** Ordered snap stops (see `BottomSheetSnapPoint`). Larger than the
	 *  sheet's height clamps; stops under 25% of the sheet are "peek" —
	 *  the drag cover shows and the scrim thins toward them. */
	snapPoints?: BottomSheetSnapPoint[]
	/** Dimmed scrim + modal dismissal semantics. false keeps the page
	 *  interactive under the panel (non-modal). @default true */
	hasScrim?: boolean
	/** Dismissal discipline (shared with Dialog): 'info' allows every
	 *  dismissal path, 'form' skips the scrim tap, 'required' also blocks
	 *  Escape. @default 'info' */
	purpose?: DialogPurpose
	/** Identifies this sheet to its enclosing `BottomSheetSwitcher`. */
	sheetId?: string
	/** Element to focus when the sheet closes (web focus semantics —
	 *  `{current}`-style object; native ignores). */
	finalFocusRef?: { current: HostElement | null }
	className?: ClassName
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Shared host for a group of `BottomSheet` panels — exactly one child
 *  sheet (by `sheetId`) is visible under `activeSheet`, and sheet changes
 *  animate between panels in the same host instead of closing and
 *  reopening. A null `activeSheet` closes the host. */
export interface BottomSheetSwitcherProps {
	/** Controlled selection — the `sheetId` currently shown, or null for
	 *  closed. Pair with `onActiveSheetChange`. */
	activeSheet?: string | null
	/** Initial selection for uncontrolled use; `activeSheet` wins when both
	 *  are set. Uncontrolled dismissal closes the host itself. */
	defaultActiveSheet?: string | null
	/** Called with the requested sheetId (or null on dismissal) when the
	 *  user changes/dismisses sheets (drag dismiss, scrim tap, Escape). */
	onActiveSheetChange?: (sheetId: string | null) => void
	/** Scrim behavior for the whole switcher. @default true */
	hasScrim?: boolean
	/** The `BottomSheet` children, each with a `sheetId`. */
	children?: Renderable
	className?: ClassName
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Options for the imperative `openBottomSheet` service. */
export interface BottomSheetOpenOptions {
	hasScrim?: boolean
	/** Same contract as `BottomSheetProps.snapPoints`. */
	snapPoints?: BottomSheetSnapPoint[]
	/** Accessible name for the panel. */
	label?: string
}

/** Owning handle for one imperative `openBottomSheet` sheet. It is the
 *  completion promise — `await` resolves with the value passed to
 *  `close(result)` or the content's own `close` — plus an instance-scoped
 *  close, so concurrent sheets dispose independently of
 *  `closeBottomSheet` (which always targets the most recent sheet). */
export interface BottomSheetHandle extends Promise<ModalOpenResult> {
	/** Close this sheet, resolving the handle with `result`. Idempotent —
	 *  a user dismissal or an earlier close wins. */
	close(result?: ModalOpenResult): void
}

/** Imperative sheet: mounts `component` on a dedicated root in a bottom
 *  sheet and returns its handle — awaiting it resolves with the value
 *  passed to `close(result)`. The component receives `{ params, close }`. */
export type OpenBottomSheet = (
	component: HostedComponent,
	params?: Record<string, unknown>,
	options?: BottomSheetOpenOptions,
) => BottomSheetHandle

// ---------- dialog / alert dialog ----------

/** How a Dialog is presented. 'fullscreen' covers the viewport; 'standard'
 *  is a centered (or `position`-placed) panel. @default 'standard' */
export type DialogVariant = 'standard' | 'fullscreen'

/** Dismissal discipline shared by Dialog and BottomSheet:
 *  - 'required': no Escape, no backdrop/scrim tap, no nav click-through
 *  - 'form': Escape allowed, backdrop/scrim tap blocked (guards
 *    partially-entered data)
 *  - 'info': every dismissal path is allowed
 *  @default 'info' */
export type DialogPurpose = 'required' | 'form' | 'info'

/** Dialog anchoring — top/bottom pull the panel off the center on the
 *  block axis; start/end are logical inline offsets (mirror under RTL on
 *  web; native maps start→left, end→right). */
export interface DialogPosition {
	top?: number | string
	bottom?: number | string
	start?: number | string
	end?: number | string
}

/** Modal panel on the enclosing RootLayout (native) or a document-body
 *  `<dialog>` layer (web). The trigger is NOT part of the component —
 *  callers own `isOpen` and restore focus to `finalFocusRef` or the
 *  previously-focused element. */
export interface DialogProps extends AccessibilityProps {
	/** Controlled visibility — pair with `onOpenChange`. Omit for
	 *  uncontrolled use via `defaultOpen`. */
	isOpen?: boolean
	/** Initial visibility for uncontrolled use; `isOpen` wins when both are
	 *  set. Uncontrolled dismissal closes the dialog itself. */
	defaultOpen?: boolean
	/** Called with the requested next state: false on every user dismissal
	 *  path (backdrop, Escape, purpose permitting) — and with true only from
	 *  `DialogHeader`'s close affordance contract. */
	onOpenChange?: (isOpen: boolean) => void
	children?: Renderable
	/** Panel width (px on web, dips on native). @default 400 */
	width?: number | string
	/** Panel max height. @default '75dvh' on web / 75% of the screen on
	 *  native */
	maxHeight?: number | string
	/** Non-centered anchoring. */
	position?: DialogPosition
	variant?: DialogVariant
	purpose?: DialogPurpose
	/** Internal padding, spacing steps (1 step = 4px/dip). @default 5 */
	padding?: number
	/** Render as ordinary inline content — no overlay, backdrop, focus
	 *  management, or dismissal wiring. For docs and previews. */
	isInline?: boolean
	/** Element to focus on close; defaults to the element focused when the
	 *  dialog opened on web/AppKit. `{current}`-style ref; touch targets call
	 *  its focus method when available. */
	finalFocusRef?: { current: HostElement | null }
	className?: ClassName
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** The Dialog/AlertDialog title row. Renders a close affordance when
 *  `onOpenChange` is supplied. In modal mode the web leaf puts
 *  `data-autofocus` on the title so it lands initial focus when no
 *  in-dialog control is marked; `aria-labelledby` points at it when no
 *  explicit accessible name is given. */
export interface DialogHeaderProps {
	title?: Renderable
	subtitle?: Renderable
	/** Supplies the close affordance; called `onOpenChange(false)`. */
	onOpenChange?: (isOpen: boolean) => void
	/** Content before the title. */
	startContent?: Renderable
	/** Content at the end edge (before the close button). */
	endContent?: Renderable
	/** Pull the end content into the panel's padding so icon buttons align
	 *  flush. `inline` shifts both. Web-style cosmetic. */
	endContentEdgeCompensation?: 'inline' | 'block' | 'all'
	/** Hairline under the header. @default true */
	hasDivider?: boolean
	className?: ClassName
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Options accepted by `useImperativeDialog().show()`. */
export type DialogOptions = Omit<DialogProps, 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'children'>

export interface ImperativeDialogReturn {
	/** Opens the dialog with arbitrary content. */
	show: (children: Renderable, options?: DialogOptions) => void
	hide: () => void
	isOpen: boolean
	/** Rendered anywhere in the tree — the dialog itself. */
	element: Renderable
}

/** Confirmation dialog (Astryx `AlertDialog`) — a dialog whose action is
 *  potentially destructive. Renders title/description plus Cancel and a
 *  single action button. Web maps to `role="alertdialog"`. */
export interface AlertDialogProps {
	/** Controlled visibility — pair with `onOpenChange`. Omit for
	 *  uncontrolled use via `defaultOpen`. */
	isOpen?: boolean
	/** Initial visibility for uncontrolled use; `isOpen` wins when both are
	 *  set. Uncontrolled dismissal closes the dialog itself. */
	defaultOpen?: boolean
	/** Called with the requested next state: false on Cancel or user
	 *  dismissal paths. */
	onOpenChange?: (isOpen: boolean) => void
	title: Renderable
	description?: Renderable
	actionLabel: Renderable
	/** Called when the action button is pressed; the caller closes the
	 *  dialog or marks `isActionLoading`. */
	onAction: () => void
	/** @default 'Cancel' */
	cancelLabel?: Renderable
	/** @default 'destructive' */
	actionVariant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
	/** Shows a spinner on the action button and blocks presses. */
	isActionLoading?: boolean
	/** @default 400 */
	width?: number | string
	/** Same as Dialog.isInline — render without overlay/modal behavior. */
	isInline?: boolean
	/** Element to focus on close. `{current}`-style ref; web semantics. */
	finalFocusRef?: { current: HostElement | null }
	className?: ClassName
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface ImperativeAlertDialogReturn {
	/** Opens the dialog with the given confirmation content. */
	show: (options: Omit<AlertDialogProps, 'isOpen' | 'defaultOpen' | 'onOpenChange'>) => void
	hide: () => void
	isOpen: boolean
	/** Rendered anywhere in the tree — the dialog itself. */
	element: Renderable
}

// ---------- carousel ----------

/** Imperative carousel controls (Astryx `CarouselHandle`). Returned through
 *  the component's standard Octane `ref`. */
export interface CarouselHandle {
	scrollNext(): void
	scrollPrev(): void
	scrollTo(index: number): void
	canScrollNext(): boolean
	canScrollPrev(): boolean
}

/** One labelled slide group inside a `Carousel` — plain children are
 *  wrapped automatically, so `items` is not needed; `Carousel` wraps each
 *  top-level child in an `aria-roledescription="slide"` group (web) /
 *  labelled container (native). */
export interface CarouselProps extends AccessibilityProps {
	/** Accessible name for the region (web `aria-label` on
	 *  `aria-roledescription="carousel"`; native `accessibilityLabel`). */
	label?: string
	children?: Renderable
	/** Space between slides, spacing steps (1 step = 4px/dip). @default 2 */
	gap?: number
	/** Slide-size variant. 'dynamic' sizes each slide to its content;
	 *  'proportional' gives every slide an equal share. @default
	 *  'dynamic' */
	variant?: 'dynamic' | 'proportional'
	/** Previous/next overlay buttons. @default false */
	hasButtons?: boolean
	/** Fade the scrolling edges to signal overflow (web mask/gradient;
	 *  native gradient overlays). @default false */
	hasEdgeFade?: boolean
	/** Scroll past the ends wraps around (native repositions to the
	 *  matching offset). @default false */
	hasLoop?: boolean
	/** Snap each slide edge-aligned when scrolling settles (web scroll-snap;
	 *  native settles via animated scroll on release where the platform
	 *  reports scroll end). @default false */
	hasSnap?: boolean
	/** Receives the imperative handle. */
	ref?: Octane.Ref<CarouselHandle>
	className?: ClassName
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- lightbox ----------

export type LightboxMediaType = 'image' | 'video'

export interface LightboxMedia {
	src: string
	/** Accessible description of the media (web `alt`). */
	alt: string
	caption?: Renderable
	/** @default 'image' */
	type?: LightboxMediaType
}

/** Full-screen media viewer (Astryx `Lightbox`). Navigates a `media` array
 *  with prev/next controls, arrow keys (web), and swipe (native);
 *  pinch/double-click zoom applies to images only. `type: 'video'` renders
 *  a real player only on web — native reports it unsupported. */
export interface LightboxProps {
	isOpen: boolean
	onOpenChange: (isOpen: boolean) => void
	media: LightboxMedia[]
	/** Controlled index. */
	index?: number
	/** Uncontrolled initial index. */
	defaultIndex?: number
	onIndexChange?: (index: number) => void
	/** Pinch/click zoom on images. @default true */
	hasZoom?: boolean
	/** Auto-play videos when they are shown. Web only. @default false */
	hasAutoPlay?: boolean
	/** Element to focus on close; defaults to the element focused when the
	 *  lightbox opened. `{current}`-style ref; web semantics. */
	finalFocusRef?: { current: HostElement | null }
	className?: ClassName
	style?: StyleProp
	id?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Props spread onto a media element that should open the lightbox on
 *  press/click. */
export interface LightboxTriggerProps {
	onPress?: () => void
	/** Web cursor hint + native accessibility hint. */
	web?: PlatformProps
}

export interface UseLightboxOptions {
	media: LightboxMedia[]
	index?: number
	defaultIndex?: number
	onIndexChange?: (index: number) => void
	hasZoom?: boolean
	hasAutoPlay?: boolean
	finalFocusRef?: { current: HostElement | null }
}

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

export interface TabSpec {
	/** Stable identity for this tab — selection (`selectedKey`), the
	 *  web tab↔panel ARIA linkage, and pane reconciliation all use it.
	 *  Defaults to the tab's position index. */
	key?: string
	title: string
	/** Registered icon name (see `registerIcons`). The shared self-drawn
	 *  `Tabs` renders the glyph through `Icon` on every platform. The
	 *  platform tab bars (`UITabBar`/`BottomNavigationView` in the ios/
	 *  android subpaths) consume the glyph's `src` (a NativeScript
	 *  iconSource URI — `sys://` SF Symbol, `res://`, `font://`, file
	 *  path) or `font`/`text` representation; `svg`/`markup`-only glyphs
	 *  warn and render title-only there. */
	icon?: IconName
	render: () => Renderable
	/** Named parallel stack — the pane is the route outlet for `stack`
	 *  (pushed screens render in place). The platform tab bars host a real
	 *  Frame per such pane. */
	stack?: string
}

export interface TabsProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	tabs: readonly TabSpec[]
	/** Controlled selection by tab `key` — React Aria `selectedKey`. Wins
	 *  over `selectedIndex` when both are passed. */
	selectedKey?: string
	/** Initial selection for the uncontrolled form — React Aria
	 *  `defaultSelectedKey`. */
	defaultSelectedKey?: string
	/** Reports the selected tab's `key` — React Aria `onSelectionChange`. */
	onSelectionChange?: (key: string) => void
	/** @deprecated Use `selectedKey` — index selection still maps to the
	 *  tab at that position. */
	selectedIndex?: number
	/** @deprecated Use `onSelectionChange`. Fires alongside it with the
	 *  selected tab's position. */
	onSelectedIndexChanged?: (index: number) => void
	/** Renders a pushed route's screen by name (the app owns the table).
	 *  Web: route outlet. Native: pushes render inside the pane's Frame. */
	resolveScreen?: (name: string, params: Record<string, unknown>) => Renderable
}

/** Platform tab-bar item shape. `icon` may be a registered name or a native
 *  asset value returned by `PlatformIcon.select()` from the matching subpath. */
export type PlatformTabSpec = Omit<TabSpec, 'icon'> & {
	icon?: string
}

export type PlatformTabsProps = Omit<TabsProps, 'tabs'> & {
	tabs: readonly PlatformTabSpec[]
	ios?: PlatformProps
	android?: PlatformProps
}

/** Props accepted by `UITabBar` (`@octane-xplat/ui/ios`). */
export type UITabBarProps = PlatformWidgetProps<PlatformTabsProps>
/** Props accepted by `BottomNavigationView` (`@octane-xplat/ui/android`). */
export type BottomNavigationViewProps = PlatformWidgetProps<PlatformTabsProps>

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
	/** Optional URL fragment (without '#') — web serializes it into the
	 *  pushed URL and scrolls to the matching element instead of the top;
	 *  deep links and direct URLs carry it through `matchUrl`. Ignored on
	 *  native. */
	hash?: string
	/** Loader result supplied to the route screen as `data`. */
	loaderData?: unknown
	/** Loader rejection supplied to the route screen as `error`. */
	loaderError?: unknown
	/** Framework-internal: a route whose loader is still in flight at mount
	 *  — only reachable on web direct-URL/history hydration, where the
	 *  screen renders before the loader settles. Surfaces as the screen's
	 *  `pending` prop; pushed routes commit after the loader and never
	 *  carry it. */
	loaderPending?: boolean
	/** Context returned by the route's `beforeLoad` export. It is merged into
	 * screen props and remains available from `useRoute`. */
	context?: RouteContext
}

/** Values shared by a route guard and the screen it admits. */
export type RouteContext = Record<string, unknown>

export interface BeforeLoadArgs<
	Params extends Record<string, unknown> = Record<string, unknown>,
> {
	params: Params
	context: RouteContext
}

export type BeforeLoad<Params extends Record<string, unknown> = Record<string, unknown>> = (
	args: BeforeLoadArgs<Params>,
) => RouteContext | void | Promise<RouteContext | void>

/** The deliberately small cross-platform head surface. `meta` keys become
 * web `<meta name="..." content="...">` tags; native consumes `title`. */
export interface RouteHead {
	title?: string
	meta?: Record<string, string>
}

/** Function form of a route `head` export — a call signature (not a
 *  function-typed property) so a `RouteHeadFn` narrowed to a spec's path
 *  params stays assignable to the loose form under strictFunctionTypes. */
export interface RouteHeadFn<Params extends Record<string, unknown> = Record<string, unknown>> {
	(params: Params): RouteHead
}

export type RouteHeadExport<Params extends Record<string, unknown> = Record<string, unknown>> =
	| RouteHead
	| RouteHeadFn<Params>

/** Props the framework passes to a route's `ErrorBoundary` export when the
 *  route's rendered subtree throws. `reset` clears the caught error and
 *  remounts the subtree with the same props — it does not re-run the
 *  route's `loader` or `beforeLoad` (re-push the route for that), so a
 *  deterministic render error recatches. `route` is the committed Route
 *  the boundary is rendering for. */
export interface RouteErrorBoundaryProps {
	error: unknown
	reset: () => void
	route: Route
}

/** Props for `RouteBoundary` — the framework host that wraps a route's
 *  rendered subtree in its declared `ErrorBoundary`. `boundary` is the
 *  route's declared boundary component (receives
 *  `RouteErrorBoundaryProps`); `route` is the committed Route passed
 *  through to it. */
export interface RouteBoundaryProps {
	boundary?: (props: RouteErrorBoundaryProps) => Renderable
	route: Route
	children?: Renderable
}

export interface LinkProps {
	href: string
	target?: string
	className?: ClassName
	style?: StyleProp
	children?: Renderable
}

export interface NavLinkProps {
	/** Destination the link pushes — checked against the registered route
	 *  schema (see `AppRoutes`/`TypedRoute`). Runtime-computed destinations
	 *  outside the schema assert to `TypedRoute`. */
	route: TypedRoute
	activeClassName?: string
	className?: ClassName
	style?: StyleProp
	children?: Renderable
}

/** name → screen component table for `registerScreens` — the app owns the
 *  route table; native `pushRoute` resolves `route.name` through it and
 *  web outlets fall back to it via `screenFor`. Values are component
 *  functions (`() => Element` / UniversalComponent shapes both fit). */
export type ScreenTable = Record<string, ScreenComponent>

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
	/** Optional `loader` named export — awaited before a pushed route
	 *  commits: the previous screen stays up until it settles, then the
	 *  result lands on the new screen as `data` and a rejection as
	 *  `error`. Web direct-URL and re-parsed history entries mount first
	 *  and run the loader in place — the screen reads `pending` until
	 *  `data`/`error` arrive. Not a data layer: live server state stays
	 *  in `query$`. `dataMode: 'baked'` resolves from `manifest.baked`
	 *  instead of running at navigation. */
	loader?: (params: Record<string, unknown>) => unknown
	/** Optional `ErrorBoundary` named export — a component receiving
	 *  `RouteErrorBoundaryProps`, rendered in place of the route's layout
	 *  chain + screen when that subtree throws during render. Loader
	 *  rejections still surface as the screen's `error` prop — the
	 *  boundary covers render failures, including a screen that crashes
	 *  while handling `error`. Absent a declaration, render errors
	 *  propagate as they always have. */
	errorBoundary?: (props: RouteErrorBoundaryProps) => Renderable
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
	layouts: Record<string, LayoutComponent>
	loaders?: Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>>
	/** Build-time loader output for `dataMode: 'baked'` routes — the
	 *  generated `routes.gen.*` glue assigns it from `routes.gen.data`;
	 *  programmatic hosts pass it on `RouteSpecSet`/`addRoutes` directly. */
	baked?: Record<string, unknown>
}

/** Params record a spec `path` declares — `RouteSpecParams<'docs/:slug'>`
 *  is `{ slug: string }`, optional segments and splats come out `?`d. A
 *  non-literal `string` path stays the loose open record. Use it to type
 *  `loader`/`beforeLoad`/`head` callbacks when authoring specs by hand or
 *  with `satisfies RouteSpec<'docs/:slug'>`. */
export type RouteSpecParams<Path extends string> = string extends Path
	? Record<string, unknown>
	: RouteParamRecord<Path>

/** One programmatic route entry for `defineRoutes` — the manifest fields a
 *  route file would have produced, supplied directly. `path` uses the
 *  route-dir vocabulary: `'docs/:slug'` (or `'docs/[slug]'`), `'index'`/`''`
 *  for the root route. `screen` is the component itself — not a module.
 *  Supplying `Path` (via `satisfies RouteSpec<'docs/:slug'>` or an explicit
 *  annotation) types the `loader`/`beforeLoad`/`head` params from the path;
 *  the callback members are methods so a narrowed spec remains assignable
 *  to the default `RouteSpec` the manifest consumes. */
export interface RouteSpec<Path extends string = string> {
	path: Path
	screen: ScreenComponent
	/** Default presentation, like a `+modal`/`+fade` filename suffix. */
	presentation?: 'push' | 'modal' | 'fade'
	loader?(params: RouteSpecParams<Path>): unknown
	dataMode?: RouteDataMode
	beforeLoad?(
		args: BeforeLoadArgs<RouteSpecParams<Path>>,
	): RouteContext | void | Promise<RouteContext | void>
	head?: RouteHeadExport<RouteSpecParams<Path>>
	/** Component receiving `RouteErrorBoundaryProps` — the spec form of a
	 *  route file's `ErrorBoundary` export. */
	errorBoundary?: (props: RouteErrorBoundaryProps) => Renderable
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
	layouts?: Record<string, LayoutComponent>
	baked?: Record<string, unknown>
}

/** The host-consumable route schema — what `xplat routes` writes to
 *  `routes.gen.manifest.json` and `manifestToJson` produces from any
 *  RouteManifest. Same shape whether the routes came from the file dir
 *  or `defineRoutes`, so an external host (e.g. a web SSR tier) consumes
 *  one normalized list. `loader`/`guard`/`head`/`errorBoundary` are
 *  presence flags — the functions don't cross the JSON boundary. */
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
	errorBoundary: boolean
}

// ---------- route diagnostics ----------

/** Stable, machine-readable identifiers for route-contract diagnostics.
 *  `RouteManifestError.issues` carries them and the matching console
 *  warnings embed the same code, so tooling can key off either channel.
 *  Codes are additive — consumers must tolerate values added later. */
export type RouteDiagnosticCode =
	/** The same route name was produced twice in one authoring pass —
	 *  fatal in `defineRoutes`/`deriveRouteManifest`. */
	| 'route/duplicate-name'
	/** A `defineRoutes` spec (or a field on it) violates its declared
	 *  shape — fatal. */
	| 'route/invalid-spec'
	/** A route has no usable screen component — fatal for specs, a
	 *  skipped-file warning for route-dir files. */
	| 'route/missing-screen'
	/** A route file exports several component-shaped candidates with no
	 *  default or `screen` export to disambiguate — skipped-file warning. */
	| 'route/ambiguous-screen'
	/** A route-file metadata export is present but the wrong shape —
	 *  warning; the export is ignored. */
	| 'route/invalid-export'
	/** A `*` segment sits mid-pattern where it reads as a literal —
	 *  warning. */
	| 'route/mid-path-catchall'
	/** A `dataMode: 'baked'` route also carries a runtime loader —
	 *  warning; the baked path wins. */
	| 'route/baked-with-loader'
	/** A `dataMode: 'baked'` route has no baked data — warning at define
	 *  time, thrown `RouteManifestError` at push time. */
	| 'route/missing-baked-data'
	/** A layout key no route nests beneath — warning; the layout never
	 *  renders. */
	| 'route/unmatched-layout'
	/** A `layouts` key was normalized (edge slashes stripped) —
	 *  warning. */
	| 'route/normalized-layout-key'
	/** A same-name route lost a manifest merge — warning; registration
	 *  order is the documented override channel. */
	| 'route/shadowed-name'
	/** A required `:param` had no value when a URL was built —
	 *  warning; the literal segment survives in the path. */
	| 'route/missing-param'
	/** A param value needed JSON encoding (or failed it) — warning. */
	| 'route/non-scalar-param'
	/** `pushRoute` named a route with no registered screen — warning;
	 *  the push is dropped. */
	| 'route/unregistered-screen'
	/** `pushRoute`/`popRoute` named a stack with no registered Frame —
	 *  warning; the operation is dropped. */
	| 'route/unregistered-stack'
	/** A modal push found no live presenter — warning; the push is
	 *  dropped. */
	| 'route/no-presenter'

/** One route-contract failure, structured for repair: `path` locates the
 *  offending input — `routes[2].screen` for a `defineRoutes` spec, a file
 *  path for the route dir, or a route/stack name for navigation.
 *  `expected` is the shape the contract requires there and `hint` names
 *  the smallest correct edit. `detail` carries what was actually found —
 *  the received value or the colliding source. */
export interface RouteDiagnostic {
	code: RouteDiagnosticCode
	path: string
	expected: string
	hint: string
	detail?: string
}

// ---------- programmatic route typing ----------

/** Phantom key carrying a `defineRoutes` manifest's spec-derived route
 *  types — type-level only, never present at runtime. Module-private so the
 *  published declarations carry no value binding for it. */
declare const specRouteTypes: unique symbol

type TrimSlashes<P extends string> = P extends `/${infer R}`
	? TrimSlashes<R>
	: P extends `${infer R}/`
		? TrimSlashes<R>
		: P

/** Route-dir vocabulary at the type level, mirroring `normSegment` in
 *  route-table.ts: '[id]' → ':id', '[[id]]'/'[id?]' → ':id?',
 *  '[...rest]' → '*rest'. */
type NormSegment<S extends string> = S extends `[${infer P}]`
	? P extends `[...${infer R}]`
		? `*${R}`
		: P extends `[${infer Q}]`
			? `:${Q}?`
			: P extends `...${infer R}`
				? `*${R}`
				: `:${P}`
	: S

/** Normalized segment → param name, split by kind: required params are
 *  non-optional in the params record, optional params and splats are `?`d. */
type ParamOfKind<S extends string, Kind extends 'req' | 'opt' | 'all'> = S extends `*${infer P}`
	? Kind extends 'req'
		? never
		: P extends ''
			? '*'
			: P
	: S extends `:${infer P}`
		? P extends `${infer Q}?`
			? Kind extends 'req'
				? never
				: Q
			: Kind extends 'opt'
				? never
				: P
		: never

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

/** Param names in a spec path by kind — `'docs/[slug]'` and
 *  `'docs/:slug'` both give `'slug'`; static-only paths give `never`. */
type PathParams<Path extends string, Kind extends 'req' | 'opt' | 'all'> =
	TrimSlashes<Path> extends infer P extends string
		? P extends `${infer Head}/${infer Tail}`
			? ParamOfKind<NormSegment<Head>, Kind> | PathParams<Tail, Kind>
			: ParamOfKind<NormSegment<P>, Kind>
		: never

/** Every param name in a spec path — required, optional, and splat. */
export type RoutePathParams<Path extends string> = PathParams<Path, 'all'>

type Simplify<T> = { [K in keyof T]: T[K] } & {}

/** Params record for a spec path: required params are required keys,
 *  optional params (`:x?`) and splats (`*`, `*rest`) are `?` keys —
 *  `':locale?/docs/:doc'` → `{ locale?: string; doc: string }`. */
type RouteParamRecord<Path extends string> = Simplify<
	{ [K in PathParams<Path, 'req'>]: string } & {
		[K in PathParams<Path, 'opt'>]?: string
	}
>

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

// ---------- registered route typing ----------

/** The app's registered route schema — every route source contributes one
 *  member carrying its `{name: params}` map. `xplat routes` emits
 *  `interface AppRoutes { fileRoutes: RouteParams }` into
 *  `routes.gen.types.ts`; a programmatic manifest contributes
 *  `ManifestRouteParams<typeof manifest>` from app code:
 *
 *  ```ts
 *  declare module '@octane-xplat/ui' {
 *  	interface AppRoutes {
 *  		guideRoutes: ManifestRouteParams<typeof guideRoutes>
 *  	}
 *  }
 *  ```
 *
 *  Registered names/params check `pushRoute` and `NavLink`'s `route` (see
 *  `TypedRoute`). Unaugmented (the default) every name takes an open params
 *  record, matching the historical `Route` contract. */
export interface AppRoutes {}

/** name → params record merged across `AppRoutes` contributions. */
export type AppRouteParams = keyof AppRoutes extends never
	? Record<string, Record<string, unknown>>
	: UnionToIntersection<AppRoutes[keyof AppRoutes]>

/** Registered route names — `string` when no source contributed. */
export type AppRouteName = keyof AppRouteParams & string

/** A `Route` narrowed by a `{name: params}` map: `name` is a map key and
 *  `params` is that name's record, so invented names and incompatible
 *  params fail at the callsite. Distributes over `Name`, so `RouteFor<P>`
 *  is the union of every destination `P` describes. */
export type RouteFor<Params, Name extends keyof Params & string = keyof Params & string> =
	Name extends unknown
		? Omit<Route, 'name' | 'params'> & {
				name: Name
				params: Params[Name]
			}
		: never

/** The typed navigation surface — `pushRoute` and `NavLink`'s `route`
 *  take this shape so invented names and incompatible params fail at the
 *  callsite. `redirect` keeps the loose `Route` shape: it is called inside
 *  spec callbacks, and a registry-typed parameter would make a contributed
 *  manifest's type depend on itself. With no `AppRoutes` augmentation it is
 *  assignable to and from `Route`. Destinations only known at runtime
 *  (computed names outside the schema) assert `as TypedRoute`. APIs that
 *  consume an already-committed route — `useRoute`, `currentRoute`,
 *  `matchUrl`, `hrefFor` — keep the realized `Route` shape instead. */
export type TypedRoute<Name extends AppRouteName = AppRouteName> = RouteFor<AppRouteParams, Name>

export interface OpenWindowOptions {
	/** Data handed to the new window's content resolver. Delivered on
	 *  native (`WindowContentResolver` request data), macOS (the
	 *  app-installed window resolver), and Linux (`window.__xplatWindowData`
	 *  in the new root). Web windows cannot receive it — `data` warns and
	 *  is ignored on web. */
	data?: Record<string, unknown>
	/** URL the window loads — web and Linux only. Defaults to the current
	 *  app URL on web; ignored by native/macOS hosts that resolve content
	 *  from `data`. */
	url?: string
	/** Presentation behavior: 'regular' is an independent window, 'dialog'
	 *  is modal to its parent (AppKit sheet, GTK transient window), 'popup'
	 *  is a non-activating child panel. Kinds are behavior semantics, not
	 *  an OS-window promise — hosts without a matching concept fall back
	 *  to 'regular'. @default 'regular' */
	kind?: 'regular' | 'dialog' | 'popup'
	/** Requested window title. Desktop hosts may apply or ignore it. */
	title?: string
	/** Requested content size in px/dips; hosts may clamp. */
	size?: { width: number; height: number }
	/** Owning window for 'dialog'/'popup' kinds — a `WindowHandle` returned
	 *  by `openWindow` or the host's own window/controller object.
	 *  @default the host's key window */
	parent?: unknown
}

/** Owning handle for one window opened by `openWindow` — the created
 *  instance's identity, completion, and close. `openWindow` returns `null`
 *  when the host refuses the request synchronously (web popup blocked, no
 *  AppKit window service installed, a host that cannot open windows).
 *
 *  Native multi-window is device-dependent (iPadOS scenes, experimental
 *  Android activities): a dropped request still returns a handle whose
 *  `closed` never resolves — the host reports no per-request outcome. */
export interface WindowHandle {
	/** Stable identity of the window instance — the host-assigned window id
	 *  where the platform registers one, else a generated token. */
	readonly id: string
	/** Resolves when the window closes for any reason: user close, host
	 *  teardown, or this handle's `close()`. Never resolves when the window
	 *  never opened. */
	readonly closed: Promise<void>
	/** True once the window has closed. */
	readonly isClosed: boolean
	/** Request the window close. No-op once closed. */
	close(): void
	/** Retitle the window. Absent on hosts that cannot retitle (native);
	 *  on web it applies only while the window stays same-origin. */
	setTitle?(title: string): void
	/** Resize the window's content area. Present only on hosts that support
	 *  resizing (macOS, Linux, script-opened web popups). */
	setSize?(size: { width: number; height: number }): void
	/** Veto a user-initiated close request — the callback returning false
	 *  cancels the close. Present only on hosts that report close requests
	 *  (macOS). Returns an unsubscribe function. */
	onCloseRequested?(callback: () => boolean): () => void
}

// ---------- animation ----------

/** Every started run settles once, including replacement and host failure. */
export type AnimationResult =
	| { status: 'finished' }
	| { status: 'cancelled' }
	| { status: 'failed'; error: unknown }

/**
 * Value returned by `useAnimation(initial, prop)`. On web, `prop` supports
 * translateX/translateY/translateZ, scale/scaleX/scaleY, rotate/rotateX/
 * rotateY, and skewX/skewY as CSS transforms, plus `opacity` and other CSS
 * style properties. On NativeScript, `prop` is the name of a NativeScript
 * view property (for example, `translateX` or `opacity`). AppKit supports
 * opacity, translateX/translateY (points, positive Y downward), scale/scaleX/
 * scaleY, and rotate (degrees). The default property is translateX.
 * `to` uses milliseconds (300 by default); spring defaults to damping 14 and
 * stiffness 120. stop freezes the sampled value; a new run replaces playback.
 * The owning hook stops work on disposal. AppKit reduced motion snaps transforms
 * while allowing opacity fades.
 */
export interface AnimatedValue {
	readonly value: number
	/** Attach to a shared view ref; pass null to detach and cancel. */
	ref(el: HostElement): void
	/** Duration is milliseconds. Invalid inputs throw before replacing playback. */
	to(target: number, opts?: { duration?: number }): Promise<AnimationResult>
	spring(target: number, opts?: { damping?: number; stiffness?: number }): Promise<AnimationResult>
	stop(): void
}

// ---------- self-drawn components (Phase 1) ----------

/** Shared resting-elevation scale for floating surfaces. */
export type Elevation = 'none' | 'low' | 'med' | 'high'

/** Button visual variants; apps add more through `.vx-button--variant-{name}`
 *  class hooks (the upstream catalog is open the same way). */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | (string & {})

/** Button composes Pressable — same-props/same-pixels, self-drawn. `isLoading`
 *  shows the spinner and blocks presses. Props follow the Astryx vocabulary
 *  (`label`, `variant`, `size`, `isDisabled`, `isLoading`, `icon`,
 *  `isIconOnly`, `endContent`, `elevation`, `tooltip`, `href`, `clickAction`,
 *  `isInterruptible`) — each state and action has one spelling.
 *  `clickAction` failures report through `onActionError`. */
export interface ButtonProps extends Omit<PressableProps, 'disabled' | 'onPress'> {
	/** Visible label text; `children` takes precedence when both are set. */
	label?: string
	/** Visual variant. @default 'secondary' */
	variant?: ButtonVariant
	/** @default 'md' */
	size?: FieldControlSize
	/** Disabled state — blocks presses and dims the button. */
	isDisabled?: boolean
	/** Loading state — shows the spinner and blocks presses. */
	isLoading?: boolean
	/** Keep the button interactive while a `clickAction` is pending — each
	 *  press then starts another overlapping call without cancelling the
	 *  in-flight one. */
	isInterruptible?: boolean
	/** Action run on press; pending promises show the loading spinner unless
	 *  `isInterruptible` keeps presses live. Presses during a pending call
	 *  are ignored (never queued); retrying a failed action is another
	 *  press. The call's own promise is the completion handle to await. */
	clickAction?: () => void | Promise<void>
	/** Reports a `clickAction` failure — a thrown error or a rejected
	 *  promise. When omitted, failures surface as uncaught asynchronous
	 *  errors rather than being silently swallowed. */
	onActionError?: (error: unknown) => void
	/** Leading icon — a node (e.g. `<Icon />`) or a registered icon name. */
	icon?: Renderable
	/** Square icon-only button; `label` becomes the accessible name. */
	isIconOnly?: boolean
	/** Trailing content slot. */
	endContent?: Renderable
	/** Resting elevation — floating-button shadow. @default 'none' */
	elevation?: Elevation
	/** Hover/focus hint on pointer targets (web/macOS); no touch semantic. */
	tooltip?: string
	/** Navigate on press — web renders a real anchor (new-tab/keyboard intact);
	 *  native opens the URL with the platform browser. Unsafe schemes blocked. */
	href?: string
	/** Link target for `href`. @default '_self' */
	target?: string
}

/** Collapsible shows/hides `children` behind a `trigger`. Controlled via
 *  `open`/`onOpenChange` or uncontrolled via `defaultOpen`. */
export interface CollapsibleProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	trigger?: Renderable
	children?: Renderable
	open?: boolean
	defaultOpen?: boolean
	disabled?: boolean
	onOpenChange?: (open: boolean) => void
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface AccordionItemSpec {
	key: string
	header?: Renderable
	content?: Renderable
	disabled?: boolean
}

/** Accordion — a list of Collapsibles. `open` is the open key (or keys with
 *  `multiple`); omit it for uncontrolled via `defaultOpen`. */
export interface AccordionProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	items: AccordionItemSpec[]
	multiple?: boolean
	open?: string | string[]
	defaultOpen?: string | string[]
	onOpenChange?: (open: string | string[]) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Self-drawn checkbox — box + check mark, identical pixels across targets. */
export interface CheckboxProps extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Controlled checked state — pair with `onCheckedChange`. */
	checked?: boolean
	/** Initial checked state for uncontrolled use; `checked` wins when both
	 *  are set. */
	defaultChecked?: boolean
	/** Partial-selection state (parent-of-a-tree semantics). Renders the
	 *  indicator's `indeterminate` mark and `aria-checked="mixed"` on web;
	 *  NativeScript reports `Partially selected` (no mixed state enum);
	 *  AppKit exposes the semantic mixed checkbox value. */
	indeterminate?: boolean
	/** Called with the requested next state when the user toggles (always
	 *  `true` when leaving `indeterminate`). */
	onCheckedChange?: (checked: boolean) => void
	accessibilityLabel?: string
	accessibilityHint?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface RadioOption {
	value: string
	label?: string
	isDisabled?: boolean
}

/** Self-drawn radio group — dot options in a column/row. */
export interface RadioGroupProps extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	options: RadioOption[]
	/** Controlled selected option — pair with `onValueChange`. */
	value?: string
	/** Initial selected option for uncontrolled use; `value` wins when both
	 *  are set. */
	defaultValue?: string
	horizontal?: boolean
	/** Called with the chosen option's `value`. */
	onValueChange?: (value: string) => void
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Self-drawn segmented control — a row of equal-width segments in a track,
 *  one selected (UISegmentedControl / Material segmented-button shape, no OS
 *  chrome). `value`/`onValueChange` for controlled, `defaultValue` for
 *  uncontrolled; `disabled` on the group or per-option. Sizes come from
 *  className, matching the Button family. */
export interface SegmentedControlProps extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	options: RadioOption[]
	/** Controlled selected segment — pair with `onValueChange`. */
	value?: string
	/** Initial selected segment for uncontrolled use; `value` wins when
	 *  both are set. */
	defaultValue?: string
	/** Called with the chosen segment's `value`. */
	onValueChange?: (value: string) => void
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Data-driven menu row fields shared by the menu families. */
export interface MenuItemData {
	key: string
	label?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	isDisabled?: boolean
	onSelect?: () => void
	hasCloseOnSelect?: boolean
}

export interface MenuActionData extends MenuItemData {
	type?: 'item'
	items?: MenuItem[]
}

export interface MenuDividerData extends MenuItemData {
	type: 'divider'
}

export interface MenuCheckboxData extends MenuItemData {
	type: 'checkbox'
	value: boolean
	onValueChange?: (value: boolean) => void
}

export interface MenuRadioOptionData extends MenuItemData {
	value?: string
}

export interface MenuRadioGroupData extends MenuItemData {
	type: 'radio-group'
	value?: string
	onValueChange?: (value: string) => void
	items: MenuRadioOptionData[]
}

/** Typed choices and nested rows extend the legacy action-array contract. */
export type MenuOption = MenuActionData | MenuDividerData | MenuCheckboxData | MenuRadioGroupData

/** Extendable legacy row contract. Prefer MenuOption for typed choice data. */
export interface MenuItem extends MenuItemData {
	type?: 'item' | 'divider' | 'checkbox' | 'radio-group'
	items?: MenuItem[]
	value?: boolean | string
	/** Legacy rows can represent either kind of choice. Compound props are strictly typed. */
	onValueChange?: (value: boolean | string) => void
}

export interface MenuItemProps {
	id?: string
	ref?: Octane.Ref<HostElement>
	className?: ClassName
	style?: StyleProp
	label: Renderable
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	description?: string
	endContent?: Renderable
	isDisabled?: boolean
	onSelect?: () => void
	hasCloseOnSelect?: boolean
}

export interface MenuCheckboxItemProps extends MenuItemProps {
	/** Caller-owned checked state; updates are requested through onValueChange. */
	value: boolean
	onValueChange?: (value: boolean) => void
}

export interface MenuRadioItemProps extends MenuItemProps {
	value: string
}

export interface MenuRadioGroupProps {
	/** Required accessible name for this set of choices. */
	label: string
	value?: string
	defaultValue?: string
	onValueChange?: (value: string) => void
	isDisabled?: boolean
	hasCloseOnSelect?: boolean
	children?: Renderable
}

export interface MenuDividerProps {
	id?: string
	className?: ClassName
	style?: StyleProp
}

export interface MenuSubMenuProps extends MenuItemProps {
	children?: Renderable
	items?: MenuItem[]
	isOpen?: boolean
	defaultOpen?: boolean
	onOpenChange?: (isOpen: boolean) => void
}

export interface MenuContextValue {
	closeMenu(): void
	menuSize: 'sm' | 'md' | 'lg'
}

/** Internal surface contract shared by every renderer. */
export interface MenuSurfaceProps {
	items?: MenuItem[]
	children?: Renderable
	closeMenu(): void
	closeLevel?: () => void
	initialFocus?: 'first' | 'last' | 'container'
	label?: string
	/** Id of the trigger that opened this surface — the web leaf sets
	 *  `aria-labelledby` so the menu is named by its trigger. Native leaves
	 *  have no trigger↔menu association and ignore it; `label` stays the
	 *  fallback name on every target. */
	labelledBy?: string
}

/** Both data rows and compound children use the same menu contracts. */
export interface DropdownMenuProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Anchor content rendered inside the trigger Pressable. */
	trigger?: Renderable
	/** Accessible trigger name when there is no visible text. */
	accessibilityLabel?: string
	/** Additional trigger chrome (for example a button class). */
	triggerClassName?: ClassName
	/** Additional class for the inherited Popover surface. */
	menuClassName?: ClassName
	items?: MenuItem[]
	children?: Renderable
	/** Caller-owned visibility; onOpenChange requests do not replace this value. */
	isOpen?: boolean
	defaultOpen?: boolean
	onOpenChange?: (isOpen: boolean) => void
	placement?: PopoverPlacement
	alignment?: PopoverAlignment
	isDisabled?: boolean
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Long press/right click, with an optional visible trigger for touch access. */
export interface ContextMenuProps extends Omit<DropdownMenuProps, 'children'> {
	children?: Renderable
	/** Compound menu content (children remain the context target). */
	menu?: Renderable
}

/** Badge — inline label chip. Pure composition, unstyled beyond layout. */
export interface BadgeProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Hairline rule between content. */
export interface SeparatorProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	orientation?: 'horizontal' | 'vertical'
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Skeleton — placeholder block shown while content loads. */
export interface SkeletonProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	width?: number
	height?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Avatar — circular image with a text fallback. */
export interface AvatarProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	src?: string
	alt?: string
	/** Fallback text (initials) shown when `src` is missing/fails. */
	fallback?: string
	size?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** AvatarGroup — overlapping row of avatars with an optional `+N` overflow. */
export interface AvatarGroupProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	/** Max avatars rendered; the rest collapse into a `+N` avatar. */
	max?: number
	size?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- form field layer (Phase 2) ----------

/** FormField wraps a control with a label, description, and validation status.
 *  Children is the control element. */
export interface FormFieldProps extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** ID of the single control associated with this field's label. */
	inputID?: string
	/** ID applied to the label element itself — a grouping host
	 *  (`InputGroup`) references it via `aria-labelledby`. */
	labelID?: string
	/** ID applied to the description element (for `aria-describedby`). */
	descriptionID?: string
	/** ID applied to the status message element (for `aria-describedby`). */
	statusID?: string
	/** Set when the field wraps a group of controls rather than one input —
	 *  the label renders as a span (a `<label>` cannot name a group). */
	isGroupLabel?: boolean
	/** Tooltip text shown via an info affordance at the end of the label. */
	labelTooltip?: string
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** FieldGroup — labeled group of related fields (role=group). */
export interface FieldGroupProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	label?: string
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Shared settings/navigation row, exported as `Item`. Its label,
 *  description, startContent, and endContent roles match `ListItem`; use
 *  `Item.StartContent`/`Content`/`Description`/`EndContent` for custom
 *  composition. `Item` is standalone, while `ListItem` reads list marker
 *  and density context from its parent `List`. */
export interface ItemProps extends AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Primary row text or rich content. */
	label?: Renderable
	/** Secondary text under the label. */
	description?: Renderable
	/** Content before the label/description column. */
	startContent?: Renderable
	/** Content after the label/description column. */
	endContent?: Renderable
	onPress?: () => void
	isDisabled?: boolean
	children?: Renderable
}

export interface ItemSlotProps {
	className?: ClassName
	children?: Renderable
}

export interface ItemComponent {
	(props: ItemProps): unknown
	StartContent: (props: ItemSlotProps) => unknown
	Content: (props: ItemSlotProps) => unknown
	Description: (props: ItemSlotProps) => unknown
	EndContent: (props: ItemSlotProps) => unknown
}

/** InputNumber — normalized TextInput (number keyboard) flanked by −/+
 *  steppers. `value`/`onValueChange` for controlled, `defaultValue` for
 *  uncontrolled. `step` defaults to 1; `min`/`max` clamp. */
export interface InputNumberProps extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	value?: number
	defaultValue?: number
	min?: number
	max?: number
	step?: number
	placeholder?: string
	onValueChange?: (value: number) => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** PinInput — a row of single-character cells that auto-advance on entry.
 *  `onComplete` fires when all `length` cells are filled. */
export interface PinInputProps extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	length?: number
	value?: string
	onValueChange?: (value: string) => void
	onComplete?: (value: string) => void
	secure?: boolean
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface SelectOption {
	value: string
	label?: string
	isDisabled?: boolean
	/** Group heading. Options in the same group retain their input order. */
	group?: string
	/** Supporting text; matching still uses label/value. */
	description?: string
}

/** Select — anchored self-drawn listbox on every target (decision #48).
 *  `multiple` keeps the listbox open and reports string[]; `searchable`
 *  puts a normalized TextInput filter at the top of the listbox. */
export interface SelectProps extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	options: SelectOption[]
	value?: string | string[] | null
	defaultValue?: string | string[] | null
	multiple?: boolean
	searchable?: boolean
	/** Called when the local filter changes, including reset on close. */
	onChangeQuery?: (query: string) => void
	searchPlaceholder?: string
	emptyText?: string
	emptySearchText?: string
	/** Show bulk selection of the visible enabled options in multiple mode. */
	hasSelectAll?: boolean
	selectAllLabel?: string
	/** Multi-value trigger summary. @default 'labels' */
	triggerDisplay?: 'labels' | 'count'
	formatValue?: (items: { value: string; label: string }[]) => string
	/** Async commit after onValueChange. Blocks edits until settled. */
	changeAction?: (value: string | string[] | null) => void | Promise<void>
	/** Called after rejected commits have reconciled the selection. */
	onChangeError?: (error: unknown) => void
	/** Web form name; native keeps selection in application state. */
	htmlName?: string
	/** Maximum list height, in px/dip. @default 280 */
	maxMenuHeight?: number
	placeholder?: string
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	onValueChange?: (value: string | string[] | null) => void
	onClear?: () => void
	hasClear?: boolean
	placement?: PopoverPlacement
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- Astryx parity: typeahead + token selection ----------

/** Minimal item contract for search results feeding the Typeahead family.
 *  `element` is a pre-rendered node that takes priority over `renderItem` and
 *  the default TypeaheadItem row; a string `auxiliaryData.group` groups
 *  results under a shared heading. */
export interface SearchableItem<TAuxData = unknown> {
	id: string
	label: string
	element?: Renderable
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
 *  delivered through `ref`. `setQuery` rewrites the field's query text —
 *  it backs Typeahead's click-to-edit. */
export interface TypeaheadInputHandle {
	focus(): void
	blur(): void
	setQuery(query: string): void
	native: HostElement
}

/** Keydown notification on the typeahead input. Fires with the DOM
 *  KeyboardEvent on web before internal navigation (call `preventDefault`
 *  to suppress it). Never fires on iOS/Android — native text fields emit
 *  no key events — so behavior gated on it (e.g. Tokenizer's
 *  Backspace-removes-last-token) is pointer-platform only. */
/** Portable key event for the typeahead input's `onKeyDown` — the DOM
 *  KeyboardEvent satisfies it on web; other hosts may fire a subset. */
export interface TypeaheadKeyEvent {
	key: string
	isComposing?: boolean
	keyCode?: number
	defaultPrevented?: boolean
	preventDefault(): void
}

export type TypeaheadKeyDownHandler = (event: TypeaheadKeyEvent) => void

/** BaseTypeahead — the unstyled combobox engine under Typeahead and
 *  Tokenizer: bare input + search/bootstrap + keyboard navigation + an
 *  anchored result listbox. It renders no field chrome; callers supply the
 *  visible wrapper and pass `anchor` for dropdown positioning. */
export interface BaseTypeaheadProps<
	T extends SearchableItem = SearchableItem,
> extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	/** Element id applied to the input itself. */
	id?: string
	searchSource: SearchSource<T>
	/** Currently selected item (null = nothing selected). Controlled. */
	value: T | null
	/** Fires when a result is committed (item) or cleared (null). */
	onChange: (item: T | null) => void
	/** Custom option content inside the stable result row. Default:
	 *  TypeaheadItem. `item.element` takes precedence over this. */
	renderItem?: (item: T) => Renderable
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
	ref?: Octane.Ref<TypeaheadInputHandle>
	/** Class/style applied to the input element only. */
	inputClassName?: ClassName
	inputStyle?: StyleProp
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Typeahead — single-selection search-as-you-type field. Renders its Field
 *  chrome (label/description/status), the input wrapper, and the selected
 *  value as a Token over the input; click the token to edit (blur or Escape
 *  restores it). */
export interface TypeaheadProps<
	T extends SearchableItem = SearchableItem,
> extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Accessible label — required by Astryx; kept required here. */
	label: string
	isLabelHidden?: boolean
	searchSource: SearchSource<T>
	value: T | null
	onChange: (item: T | null) => void
	renderItem?: (item: T) => Renderable
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
	startIcon?: Renderable
	/** Field width; numbers are px/dip, strings pass through. */
	width?: number | string
	ref?: Octane.Ref<TypeaheadInputHandle>
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	labelTooltip?: string
}

export interface TypeaheadItemProps<T extends SearchableItem = SearchableItem> {
	className?: ClassName
	style?: StyleProp
	id?: string
	item: T
	/** Leading node — icon, avatar, etc. */
	icon?: Renderable
	/** Supporting text under the label. */
	description?: string
	isDisabled?: boolean
	/** Group label; presentational only — grouping itself is driven by
	 *  `item.auxiliaryData.group`. */
	group?: string
	ref?: Octane.Ref<HostElement>
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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
	className?: ClassName
	style?: StyleProp
	id?: string
	label: string
	size?: TokenSize
	color?: TokenColor
	/** Leading node — icon, avatar, etc. */
	icon?: Renderable
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
	endContent?: Renderable
	/** Hide the label visually; it stays the accessible name. */
	isLabelHidden?: boolean
	ref?: Octane.Ref<HostElement>
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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

/** Imperative handle delivered through Tokenizer's `ref`. */
export interface TokenizerHandle {
	focus(): void
	blur(): void
	/** The root field element/view. */
	native: HostElement
}

/** Tokenizer — multi-select field: Token chips + a BaseTypeahead input.
 *  Selecting adds a token and clears the query; Backspace on an empty input
 *  removes the last token (pointer platforms — native fields emit no key
 *  events); `hasCreate` offers a "Create \"…\"" entry for free text. */
export interface TokenizerProps<
	T extends SearchableItem = SearchableItem,
> extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	label: string
	searchSource: SearchSource<T>
	/** Selected items. Controlled. */
	value: T[]
	onChange: (items: T[], change: TokenizerChange<T>) => void
	renderItem?: (item: T) => Renderable
	/** Custom token renderer — receives the item and its remove callback.
	 *  Default: Token with label + ✕. */
	renderToken?: (item: T, onRemove: () => void) => Renderable
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
	endContent?: Renderable
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
	startIcon?: Renderable
	width?: number | string
	labelTooltip?: string
	ref?: Octane.Ref<TokenizerHandle>
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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

/** Named context passed to `ComplexSelector`'s `children` render function.
 *  `value` is optimistic while `changeAction` is pending; `onChange`
 *  commits a value and `close` closes the surface. */
export interface ComplexSelectorRenderProps<Value> extends ComplexSelectorRenderState {
	value: Value
	onChange: (value: Value) => void
	close: () => void
}

/** Imperative handle delivered through ComplexSelector's `ref`. Drives the
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
 *  pickers. `children` is a render function receiving one named context
 *  with the (optimistic) value, commit and close callbacks, and render
 *  state fields; the component owns the trigger, popover, focus restore,
 *  and async `changeAction` flow. */
export interface ComplexSelectorProps<Value> extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	label: string
	value: Value
	onChange?: (value: Value) => void
	/** Async action run after `onChange`; the surface reports `isBusy` and
	 *  renders `value` optimistically until it settles. */
	changeAction?: (value: Value) => void | Promise<void>
	children: (context: ComplexSelectorRenderProps<Value>) => Renderable
	/** Trigger content while closed; falls back to `placeholder`. */
	triggerLabel?: Renderable
	placeholder?: Renderable
	/** Loading/busy state on the trigger. */
	isLoading?: boolean
	/** 'input' (default) draws the field chrome; 'ghost' a flat
	 *  toolbar-style button. */
	variant?: ComplexSelectorVariant
	startIcon?: Renderable
	width?: number | string
	labelTooltip?: string
	placement?: PopoverPlacement
	alignment?: 'start' | 'center' | 'end'
	ref?: Octane.Ref<ComplexSelectorHandle>
	onOpenChange?: (open: boolean) => void
	contentClassName?: ClassName
	contentStyle?: StyleProp
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** InputRating — row of tappable glyphs reporting a 1..max score. */
export interface InputRatingProps extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	value?: number
	defaultValue?: number
	max?: number
	/** Glyph per cell — a Text character (default ★) or a registered Icon name. */
	icon?: string
	onValueChange?: (value: number) => void
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** CheckboxGroup — multi-select list of self-drawn checkboxes. */
export interface CheckboxGroupProps extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	options: RadioOption[]
	/** Controlled checked values — pair with `onValueChange`. */
	value?: string[]
	/** Initial checked values for uncontrolled use; `value` wins when both
	 *  are set. */
	defaultValue?: string[]
	/** Called with the complete next value array when the user toggles an
	 *  option. */
	onValueChange?: (values: string[]) => void
	horizontal?: boolean
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- navigation & wayfinding (Phase 3) ----------

export interface BreadcrumbItem {
	label: string
	onSelect?: () => void
}

/** Breadcrumb — ancestor trail. Items render as pressable links separated
 *  by `separator` (default /). */
export interface BreadcrumbProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	items: BreadcrumbItem[]
	/** Maximum visible trail items, at least two; hidden ancestors use a menu. */
	maxVisibleItems?: number
	/** Additional overflow actions use the same compound menu parts. */
	overflowMenu?: Renderable
	overflowLabel?: string
	separator?: string
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Pagination — prev/next + a windowed run of page buttons around `page`. */
export interface PaginationProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	page: number
	pageCount: number
	/** Pages shown to each side of `page` (default 1). */
	siblingCount?: number
	onPageChange?: (page: number) => void
	disabled?: boolean
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface StepperStep {
	key: string
	label?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	disabled?: boolean
}

/** Stepper — numbered step row. Steps before `current` show a done mark;
 *  tapping a non-disabled step calls `onStepChange`. */
export interface StepperProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	steps: StepperStep[]
	current?: number
	onStepChange?: (index: number) => void
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface NavigationMenuItem {
	key: string
	label?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	/** Link target — a real anchor on web; deep-link/route-table activation
	 *  on native. */
	href?: string
	active?: boolean
	disabled?: boolean
	onSelect?: () => void
}

/** NavigationMenu — row (or column) of nav items; mostly a desktop/web
 *  idiom — the mobile equivalent is Tabs/Drawer. */
export interface NavigationMenuProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	items: NavigationMenuItem[]
	horizontal?: boolean
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Static command entry; existing MenuItem callsites remain valid. */
export interface CommandPaletteMenuItem extends MenuItem {
	group?: string
	keywords?: string[]
	description?: string
	shortcut?: string
}

/** Source-backed command entry. Metadata grouping uses auxiliaryData.group. */
export interface CommandPaletteItem extends SearchableItem {
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	disabled?: boolean
	description?: string
	shortcut?: string
	onSelect?: () => void
}

/** Searchable commands. Desktop Enter activates the highlighted enabled item;
 * mobile Search submits the query and taps activate rows. Sources own ranking
 * and bootstrap entries. Closing invalidates pending work and resets the query. */
export interface CommandPaletteProps<T extends CommandPaletteItem = CommandPaletteItem> {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Controlled visibility. Defaults to false. */
	open?: boolean
	onOpenChange?: (open: boolean) => void
	/** Static commands; ignored when searchSource is supplied. */
	items?: CommandPaletteMenuItem[]
	/** Sync/async results; bootstrap supplies empty-query entries. */
	searchSource?: SearchSource<T>
	/** Static matching only. Custom sources own their matching policy. */
	searchMode?: 'substring' | 'fuzzy'
	placeholder?: string
	/** Accessible surface and input name. Defaults to Command palette. */
	label?: string
	value?: string
	onValueChange?: (value: string) => void
	/** Inner row content; selection/disabled semantics remain palette-owned. */
	renderItem?: (item: T, isSelected: boolean) => Renderable
	emptySearchText?: string
	emptyBootstrapText?: string
	loadingText?: string
	errorText?: string
	/** Custom footer content; false hides it. Mobile has no default key hints. */
	footer?: Renderable
	width?: number | string
	maxHeight?: number
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- data display (Phase 4) ----------

/** `K` is the row field the column reads — constrained to `keyof T` on
 *  `TableProps`, so a column key that exists in no row fails at the
 *  callsite. Pure display columns (no backing row field) widen the row
 *  type or render through `renderCell`. */
export interface TableColumn<K extends Key = Key> {
	key: K
	label?: string
	/** Column width in dips; omit to share the remaining space evenly. */
	width?: number
	align?: 'left' | 'center' | 'right'
}

/** Named context passed to `Table`'s `renderCell`. `rowIndex` is the row's
 *  current position, not a stable identity; use `idKey` to identify rows. */
export interface TableCellRenderProps<T extends object = Record<string, unknown>> {
	row: T
	column: TableColumn<keyof T & Key>
	rowIndex: number
}

/** Table — self-drawn grid via rows + cells. Bounded and unvirtualized:
 *  large datasets belong to the platform UITableView/RecyclerView
 *  subpaths, not this component. The row generic flows through
 *  `columns`, `renderCell`, `idKey`, and `onRowPress`, so rows keep their
 *  element type and column keys stay row fields; `rowIndex` values
 *  are positional, not identity. */
export interface TableProps<T extends object = Record<string, unknown>> {
	className?: ClassName
	style?: StyleProp
	id?: string
	columns: readonly TableColumn<keyof T & Key>[]
	rows: readonly T[]
	/** Cell override — receives a `TableCellRenderProps` context; default
	 *  renders `row[column.key]` as text. */
	renderCell?: (cell: TableCellRenderProps<T>) => Renderable
	/** Stable row `Key` — a row field name or an extractor (Astryx `idKey`).
	 *  Defaults to the row's `id` or `key` property, then its index. The
	 *  index fallback is positional — supply `idKey` or an `id`/`key` field
	 *  when rows can be reordered. */
	idKey?: keyof T | ((row: T, rowIndex: number) => Key)
	onRowPress?: (row: T, rowIndex: number) => void
	empty?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TimelineItem {
	key: string
	title?: string
	description?: string
	time?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
}

/** Timeline — vertical list of events with dot + connector. */
export interface TimelineProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	items: TimelineItem[]
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** One visual `TreeList` node — the rendered row descriptor, distinct from
 *  the `TreeNode` store wrapper `useTreeData` produces. Carry extra fields
 *  by extending it; `onAction`'s key and `useTreeData`'s `getItem` share
 *  the same `Key` identity. */
export interface TreeListNode {
	key: Key
	label?: string
	children?: TreeListNode[]
	disabled?: boolean
}

/** TreeList — recursive indent + collapse. Expansion is keyed and follows
 *  the shared state contract: `expandedKeys`/`onExpandedChange` for the
 *  controlled form, `defaultExpandedKeys` to seed the uncontrolled form.
 *  Leaf rows can hold a keyed selection under `selectionMode`, matching
 *  `GridList`; `onAction` fires on leaf activation either way. */
export interface TreeProps<T extends TreeListNode = TreeListNode> {
	className?: ClassName
	style?: StyleProp
	id?: string
	nodes: readonly T[]
	/** Controlled expanded keys — pair with `onExpandedChange`. */
	expandedKeys?: Iterable<Key>
	/** Initial expanded keys for uncontrolled use; `expandedKeys` wins when
	 *  both are set. */
	defaultExpandedKeys?: Iterable<Key>
	/** Called with the complete expanded key set when a parent row toggles. */
	onExpandedChange?: (keys: Set<Key>) => void
	/** 'none' (default) disables selection; 'single' and 'multiple' give
	 *  leaf rows a keyed selection with the same contract as `GridList`.
	 *  Parent rows always toggle expansion instead of selecting. */
	selectionMode?: 'none' | 'single' | 'multiple'
	/** Controlled selection — `'all'` or the selected key set. */
	selectedKeys?: 'all' | Iterable<Key>
	/** Initial selection for the uncontrolled form. */
	defaultSelectedKeys?: 'all' | Iterable<Key>
	onSelectionChange?: (keys: Selection) => void
	/** Fires when a leaf row is activated (click/Enter on web, tap on
	 *  native), independent of selection. */
	onAction?: (key: Key) => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Alert — status callout. `tone` maps to a class modifier; error tone
 *  gets role=alert on web, others role=status. */
export interface AlertProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	tone?: 'info' | 'success' | 'warning' | 'error'
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	title?: string
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Card — container with optional header/footer slots, padding scale, and
 *  background variants. `variant` names map to `vx-card--{name}` class hooks:
 *  'default' (bordered), 'muted', 'transparent', and the tint set
 *  (blue/cyan/gray/green/orange/pink/purple/red/teal/yellow) ship in
 *  chrome.css; custom variant names still produce a class an app can skin. */
export interface CardProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	header?: Renderable
	footer?: Renderable
	children?: Renderable
	/** Internal padding in 4px spacing steps. @default 4 */
	padding?: number
	variant?: string
	elevation?: Elevation
	width?: number | string
	height?: number | string
	maxWidth?: number | string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Chip — small action/filter element: pressable, optional selected state,
 *  optional ✕ remove affordance. */
export interface ChipProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	selected?: boolean
	disabled?: boolean
	onSelect?: () => void
	onRemove?: () => void
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Kbd — keyboard key glyph (⌘K styling hook). */
export interface KbdProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Empty — empty-state block: icon + title + description + actions. */
export interface EmptyProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	title?: string
	description?: string
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Banner — inline notice strip with optional dismiss. */
export interface BannerProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	children?: Renderable
	onDismiss?: () => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** User — avatar + name/description row. */
export interface UserProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	name?: string
	description?: string
	src?: string
	fallback?: string
	size?: number
	onSelect?: () => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** ProgressGroup — stacked labeled Meter rows. */
export interface ProgressGroupProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	items: { key: string; label?: string; value: number; max?: number }[]
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- chat ----------

/** Who sent a chat message — drives alignment, bubble styling, and metadata
 *  direction. 'system' messages center and skip the avatar/name affordances. */
export type ChatMessageSender = 'user' | 'assistant' | 'system'

/** Data-side description of a chat message. Presentation components accept
 *  the same fields as props; this type lets agents store/transmit messages
 *  without coupling to rendering. */
export interface ChatMessageData {
	id?: string
	sender: ChatMessageSender
	content: Renderable
	/** Display timestamp — a Date, epoch ms, or ISO string. */
	timestamp?: Date | number | string
	/** Delivery state shown by ChatMessageMetadata. */
	status?: ChatMessageStatus
	/** Footer/metadata row content below the message body. */
	footer?: Renderable
	/** Avatar content; omit to use the sender's default. */
	avatar?: Renderable
	/** Sender name; omit to use the sender's default. */
	name?: Renderable
}

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
	className?: ClassName
	style?: StyleProp
	id?: string
	sender: ChatMessageSender
	children?: Renderable
	avatar?: Renderable
	/** Sender name above the body — prefer the bubble's `name` when the first
	 *  child is a ChatMessageBubble. */
	name?: Renderable
	/** Footer content below the body — prefer the bubble's `metadata` when the
	 *  last child is a ChatMessageBubble. */
	metadata?: Renderable
	/** Defaults to the enclosing ChatMessageList density, then 'balanced'. */
	density?: ChatDensity
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export type ChatMessageBubbleVariant = 'filled' | 'ghost'

/** Styled content container — the chat bubble. Reads sender/density from the
 *  enclosing ChatMessage. `group` tightens sender-side corners for
 *  consecutive bubbles; `width` replaces the default max-width cap. */
export interface ChatMessageBubbleProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	variant?: ChatMessageBubbleVariant
	/** Sender name row above the bubble, aligned to its text column. */
	name?: Renderable
	/** Metadata row below the bubble, aligned to its text column. */
	metadata?: Renderable
	group?: 'first' | 'middle' | 'last'
	/** Bubble width — number (px/dip) or CSS string ('100%'). Replaces the
	 *  default max-width cap when set. */
	width?: number | string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Composable metadata row: timestamp · footer · status. Renders nothing
 *  when all three are absent. */
export interface ChatMessageMetadataProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	timestamp?: Renderable
	footer?: Renderable
	status?: ChatMessageStatus
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export type ChatSystemMessageVariant = 'default' | 'divider'

/** Centered system/notice row — date separators, "conversation started".
 *  `divider` draws hairlines on both sides of the text. */
export interface ChatSystemMessageProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	variant?: ChatSystemMessageVariant
	icon?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Presentational message container. Density flows to children via context;
 *  `align:'bottom'` pads short lists so messages sit above the composer;
 *  `scrollToTopAction` loads older messages (spinner row while pending);
 *  `isStreaming` marks the region busy for assistive tech. Auto-scroll and
 *  the scroll-to-bottom button are owned by ChatLayout or useChatStreamScroll.
 *
 *  Supply either `children` for full JSX control or `messages` + `renderMessage`
 *  for a data-driven list. */
export interface ChatMessageListProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	emptyState?: Renderable
	/** Called when the user scrolls to the top — load older messages. Calls are
	 *  serialized while a returned promise is pending. */
	scrollToTopAction?: () => void | Promise<void>
	density?: ChatDensity
	/** Gap between top-level message rows (px on web, dip on native).
	 *  Defaults to the density's gap. */
	gap?: number
	align?: 'top' | 'bottom'
	isStreaming?: boolean
	/** Data-driven messages — provide either this or `children`. */
	messages?: ChatMessageData[]
	/** Render a data-driven message; defaults to ChatMessage + ChatMessageBubble. */
	renderMessage?: (message: ChatMessageData) => Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export type ChatToolCallStatus = 'pending' | 'running' | 'complete' | 'error'

interface ChatToolCallItemBase {
	name: string
	target?: string
	/** Short qualifier rendered as a chip next to the name (e.g. file part). */
	node?: string
	additions?: number
	deletions?: number
	/** Custom stats content replacing/augmenting additions+deletions. */
	stats?: Renderable
	key?: string
	data?: unknown
	/** Expandable detail content (diff, code block, arguments). */
	resultDetail?: Renderable
}

/** One tool/function call in a ChatToolCalls list — mirrors the shape LLM
 *  streaming APIs return. `status` gates the state fields: `duration` is
 *  rendered only on `complete` (an omitted status reads as `complete`) and
 *  `errorMessage` only on `error`. */
export type ChatToolCallItem = ChatToolCallItemBase &
	(
		| {
				status?: 'complete'
				/** Display-formatted run time (e.g. `'1.2s'`) shown on the row. */
				duration?: string
				errorMessage?: never
			}
		| { status: 'pending' | 'running'; duration?: never; errorMessage?: never }
		| {
				status: 'error'
				duration?: never
				/** Failure detail — announced as the row's accessible name. */
				errorMessage?: string
			}
	)

/** Tool-call list — one call renders inline; several collapse behind a
 *  summary header showing the latest call and the count. */
export interface ChatToolCallsProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	calls: ChatToolCallItem[]
	/** Expanded-state summary label (defaults to "N tool calls"). */
	label?: string
	isExpanded?: boolean
	defaultIsExpanded?: boolean
	onExpandedChange?: (isExpanded: boolean) => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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
	native?: unknown
}

/** A pasted/dropped file. On web `native` is the browser `File`; native
 *  paste/drop file delivery is platform-dependent and may never fire —
 *  treat this as web-real, native-best-effort. */
export interface ChatComposerFile {
	name: string
	/** MIME type ('' when unknown). */
	type: string
	size: number
	native?: unknown
}

/** Portable paste event handed to ChatComposerInput.onPaste. */
export interface ChatComposerPasteEvent {
	preventDefault(): void
	/** The platform event (ClipboardEvent on web; undefined on native). */
	native?: unknown
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
	label?: Renderable
	variant?: ChatComposerTokenVariant
	/** Registered icon name (see registerIcon). */
	icon?: IconName
}

/** Custom-rendered token — full control over the chip's content. */
export interface ChatComposerTokenCustom {
	value: string
	render: () => Renderable
}

/** A token (mention, pasted blob, command argument) embedded in the
 *  composer value. Web renders it as a non-editable inline chip inside the
 *  field; native keeps tokens in a chip row above the field and serializes
 *  them at their recorded insertion offset. */
export type ChatComposerToken = ChatComposerTokenBadge | ChatComposerTokenCustom

/** Serializable representation of a token that can cross storage boundaries.
 *  `render` is omitted because functions cannot be serialized; restore it via
 *  `deserializeChatComposerToken` with a renderer lookup. */
export interface ChatComposerTokenBadgeData {
	kind: 'badge'
	value: string
	label?: string
	variant?: ChatComposerTokenVariant
	icon?: IconName
}

export interface ChatComposerTokenCustomData {
	kind: 'custom'
	value: string
}

export type ChatComposerTokenData = ChatComposerTokenBadgeData | ChatComposerTokenCustomData

/** Serializable composer draft — text plus the token table needed to render
 *  and re-edit it. */
export interface ChatComposerDraft {
	text: string
	tokens: ChatComposerToken[]
}

/** A draft that has been reduced to plain JSON. `tokens` carry only the data
 *  half of each token; render functions are recovered on load. */
export interface ChatComposerDraftData {
	text: string
	tokens: ChatComposerTokenData[]
}

/** Item shape for trigger-menu sources — the portable SearchableItem. */
export interface ChatComposerTriggerItem<TAuxData = unknown> {
	id: string
	label: string
	/** Pre-rendered item content — takes priority over renderItem/label. */
	element?: Renderable
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
	renderItem?: (item: ChatComposerTriggerItem) => Renderable
	/** What to insert on selection — plain text or a token chip. */
	onSelect: (item: ChatComposerTriggerItem) => string | ChatComposerToken
	/** Parse a serialized token back when loading a draft for editing. */
	deserialize?: (value: string) => ChatComposerToken | null
	emptySearchResultsText?: string
	loadingText?: string
	menuLabel?: string
}

/** Imperative surface the composer shell and app code invoke on the input.
 *  Delivered through the input's `ref` prop. */
export interface ChatComposerInputHandle {
	/** Insert a token chip at the current caret position; returns its id. */
	insertToken(token: ChatComposerToken): string | undefined
	/** Replace the token chip with its serialized text value. */
	expandToken(id: string): void
	insertText(text: string): void
	focus(): void
	/** Current serialized value (token values inline). */
	getValue(): string
	/** Current structured draft. */
	getDraft(): ChatComposerDraft
}

/** Registration record for the composer shell → input slot seam: a custom
 *  `input` assigns `{focus}` to `context.inputControlRef.current` so the
 *  shell's click-to-focus works without knowing the input's shape. */
export interface ChatComposerInputControl {
	focus(): void
}

export interface ChatComposerContextValue {
	value: string
	draft: ChatComposerDraft
	onChange: (value: string) => void
	onDraftChange: (draft: ChatComposerDraft) => void
	/** Send the current draft. */
	onSend: (value: string) => void
	/** @deprecated Use onSend. */
	onSubmit: (value: string) => void
	placeholder: string
	isDisabled: boolean
	isStopShown: boolean
	canSend: boolean
	/** Cancel/stop action. */
	onCancel?: () => void
	/** @deprecated Use onCancel. */
	onStop?: () => void
	inputControlRef?: { current: ChatComposerInputControl | null }
}

/** Rich composer field. Web is a real contenteditable with inline token
 *  chips, Enter-to-submit (IME-guarded), submitted-message recall on ArrowUp/Down,
 *  paste interception, and file drop. Native is a TextView plus a chip row
 *  for inserted tokens; serialization matches, mid-text token positions are
 *  approximated by recorded insertion offsets. */
export interface ChatComposerInputProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Exposes the imperative handle through a standard Octane ref. */
	ref?: Octane.Ref<ChatComposerInputHandle>
	/** Serialized string value (legacy) — use draft props instead. */
	value?: string
	onChange?: (value: string) => void
	/** Structured draft value. */
	draft?: ChatComposerDraft
	defaultDraft?: ChatComposerDraft
	onDraftChange?: (draft: ChatComposerDraft) => void
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
	/** Send action — called with the serialized draft text. */
	onSend?: (value: string) => void
	/** @deprecated Use onSend. */
	onSubmit?: (value: string) => void
	/** Runs before built-in Enter/recall handling; preventDefault() to own
	 *  the keystroke. IME composition always suppresses submit. */
	onKeyDown?: (event: ChatComposerKeyEvent) => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface ChatComposerTokenElementProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	token: ChatComposerToken
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Collapsible drawer above the composer input — attachments/context chips.
 *  With `count`, a collapse toggle renders the badge+label summary. */
export interface ChatComposerDrawerProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	count?: number
	label?: string
	collapsedSummary?: Renderable
	isCollapsed?: boolean
	defaultIsCollapsed?: boolean
	onCollapsedChange?: (isCollapsed: boolean) => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Circular send/stop toggle. Reads ChatComposerContext by default; every
 *  context-derived value is prop-overridable for standalone use. */
export interface ChatSendButtonProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	isStopShown?: boolean
	isDisabled?: boolean
	onSend?: () => void
	/** @deprecated Use onCancel. */
	onStop?: () => void
	onCancel?: () => void
	/** Custom send-state icon content (default: registered arrow-up glyph). */
	sendIcon?: Renderable
	stopIcon?: Renderable
	size?: 'sm' | 'md'
	/** Composes after the send/stop action. */
	onPress?: () => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Composer layout shell — slots for drawer, header actions/context, input,
 *  footer actions, send actions/button, and an error/warning status strip.
 *
 *  State: provide either the legacy `value`/`onChange` string props or the
 *  structured `draft`/`onDraftChange` props. Actions: use `onSend` to submit
 *  and `onCancel` to stop; `onSubmit`/`onStop` remain as migration aliases. */
export interface ChatComposerProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Send action — called with the serialized draft text. */
	onSend?: (value: string) => void
	/** @deprecated Use onSend. */
	onSubmit?: (value: string) => void
	/** Cancel/stop action. */
	onCancel?: () => void
	/** @deprecated Use onCancel. */
	onStop?: () => void
	isStopShown?: boolean
	/** Serialized string value (legacy) — use draft props instead. */
	value?: string
	onChange?: (value: string) => void
	/** Structured draft value. */
	draft?: ChatComposerDraft
	defaultDraft?: ChatComposerDraft
	onDraftChange?: (draft: ChatComposerDraft) => void
	placeholder?: string
	isDisabled?: boolean
	density?: ChatComposerDensity
	/** 'low' (default) is the raised surface; 'none' is flat with a border. */
	elevation?: 'none' | 'low'
	drawer?: Renderable
	headerActions?: Renderable
	headerContext?: Renderable
	/** Custom input element — replaces the default ChatComposerInput. */
	input?: Renderable
	footerActions?: Renderable
	sendActions?: Renderable
	sendButton?: Renderable
	status?: ChatComposerStatus
	statusPosition?: 'top' | 'bottom'
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Renders serialized message text with token values replaced by their
 *  chips — share one token table between input and display. */
export interface ChatTokenizedTextProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: string
	tokens?: ChatComposerToken[]
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	/** Composer element docked at the bottom — typically ChatComposer. */
	composer?: Renderable
	emptyState?: Renderable
	/** Custom scroll-to-bottom control, or null to hide. Defaults to
	 *  ChatLayoutScrollButton wired to the layout's scroll state. */
	scrollButton?: Renderable
	/** External scroll container — { current: HTMLElement | NSView }. */
	scrollRef?: { current?: HostElement | null }
	density?: ChatDensity
	/** Keep the viewport following new content (default true). */
	followLatest?: boolean
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface ChatLayoutScrollButtonProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	isVisible: boolean
	/** Optional pill label (e.g. "New messages") — expands the button. */
	label?: string
	onPress?: () => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface ChatScrollToBottomOptions {
	/** 'instant' jumps in one frame (open/restore); default 'spring' animates
	 *  (web spring, NS animated scroll). Reduced-motion web jumps instantly. */
	behavior?: 'instant' | 'spring'
}

/** Owns a scroll container's follow-the-stream behavior. `scrollRef` points
 *  at the DOM scroller on web or the bound NS ScrollView on native. */
export interface UseChatStreamScrollOptions {
	scrollRef: { current?: HostElement | null }
	enabled?: boolean
	/** Keep the viewport following new content (default true). */
	followLatest?: boolean
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
	scrollToMessage(el: HostElement): void
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
	contentRef(el: HostElement): void
}

/** Converts long pastes into token chips. `inputRef` carries the input
 *  handle (the object `ref` delivered). */
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
	editableRef: { current?: HostElement | null }
	onEmitChange(): void
}

export interface TokenPortal {
	id: string
	/** The non-editable span web portals render into (DOM element). */
	span: HostElement
	token: ChatComposerToken
}

export interface UseChatComposerTokensReturn {
	tokenPortals: TokenPortal[]
	expandToken(id: string): void
	insertToken(token: ChatComposerToken): string | undefined
	/** Backspace-near-token interception (web KeyboardEvent). */
	handleKeyDown(e: unknown): boolean
	/** Paste-near-token interception (web ClipboardEvent). */
	handlePaste(e: unknown): boolean
	cleanupPortals(): void
}

// --- dictation (web SpeechRecognition; unsupported on native — isSupported:false) ---

export interface UseSpeechRecognitionOptions {
	lang?: string
	continuous?: boolean
	interimResults?: boolean
	audioContext?: unknown
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
	className?: ClassName
	style?: StyleProp
	id?: string
	dictation: UseSpeechRecognitionReturn
	size?: 'sm' | 'md'
	/** Hide entirely when unsupported (default true) — else show disabled. */
	isHiddenWhenUnsupported?: boolean
	label?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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
	scrollContainerRef: { current?: HostElement | null }
	/** Message-list content element for size observation. */
	contentRef(el: HostElement): void
}

// ---------- Astryx navigation family (parity port) ----------
//
// Prop names and semantics track @astryxdesign/core. `ReactNode` positions are
// `Renderable`; DOM `ref` positions are the leaf's `ref`; React `onClick` item
// callbacks fire on press/tap on native. Anchor-only attributes (`target`,
// `rel`, `download`, `referrerPolicy`) apply on web; native `href` activates
// through the route table (deep link) and falls back to the platform opener
// for absolute URLs.

/** Element size scale shared by the navigation family (`sm`/`md`/`lg`). */
export type NavElementSize = 'sm' | 'md' | 'lg'

/** Custom component rendered in place of the platform link element (the
 *  Astryx `as` escape hatch). Receives the item's portable props
 *  (`href`, `className`, `style`, children) on web; ignored on native, where
 *  activation goes through `followHref`. */
export type NavLinkComponentType = ElementType

// ----- NavIcon -----

export interface NavIconProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Icon content inside the circular container — an element or a
	 *  registered icon name (rendered through `Icon`). */
	icon: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ----- Toolbar -----

export type ToolbarSize = NavElementSize

/** Painted chrome behind the toolbar row — mirrors the upstream Section
 *  delegation: `transparent` (default), `section` (surface paint), `muted`
 *  (secondary wash). */
export type ToolbarVariant = 'transparent' | 'section' | 'muted'

export interface ToolbarProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Content aligned to the start (left in LTR). */
	startContent?: Renderable
	/** Content centered between start and end; switches the row to a
	 *  three-column layout. */
	centerContent?: Renderable
	/** Content aligned to the end (right in LTR). */
	endContent?: Renderable
	/** Accessible label for the toolbar (aria-label on web). Required —
	 *  matches upstream's mandatory `label`. */
	label: string
	/** Toolbar size — controls row minimum height and the intended size of
	 *  contained controls. Astryx cascades it to children via SizeContext;
	 *  this port sets the row height and exposes `useToolbarSize` context
	 *  for family components (Button etc. do not consume it — sibling seam). */
	size?: ToolbarSize
	/** Gap between items within each slot, spacing-scale step. */
	gap?: SpacingStep
	/** Arrow-key direction on web; layout axis on every target. */
	orientation?: 'horizontal' | 'vertical'
	/** Painted chrome behind the row. */
	variant?: ToolbarVariant
	/** Divider edges painted on the outer chrome. */
	dividers?: ('top' | 'bottom' | 'start' | 'end')[]
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ----- TabList / Tab / TabMenu -----

export type TabListSize = NavElementSize
export type TabListLayout = 'hug' | 'fill'
/** Resolved semantics: `nav` landmark (default) or the WAI-ARIA `tabs`
 *  pattern under `role="tablist"`. */
export type TabListPattern = 'nav' | 'tabs'
/** Strip overflow behavior — `auto` currently always resolves to `scroll`. */
export type TabListOverflow = 'auto' | 'scroll' | 'visible'

export interface TabListContextValue {
	value: string
	onChange: (value: string) => void
	size: TabListSize
	layout: TabListLayout
	pattern: TabListPattern
}

export interface TabListProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** The currently selected tab value. */
	value: string
	/** Fires when a tab is selected. */
	onChange: (value: string) => void
	size?: TabListSize
	/** `hug`: each tab wraps its content; `fill`: tabs stretch equally to
	 *  fill the strip width. */
	layout?: TabListLayout
	/** Bottom divider rail under the strip. */
	hasDivider?: boolean
	/** Pulls the strip out to the host's content edges using the
	 *  `--container-padding-inline-*` custom properties a padded host
	 *  publishes. No ancestor publishes them in this framework yet — the
	 *  bleed clamps to zero (Layout/Section seam, sibling task). */
	isFullBleed?: boolean
	/** `'tablist'` selects the WAI-ARIA tabs pattern (role=tab on children,
	 *  aria-selected, `panelId` → aria-controls, `href` ignored). Unset or
	 *  any other value leaves the strip a navigation landmark on web. */
	role?: string
	/** `auto`/`scroll` scroll the strip when tabs overflow; `visible`
	 *  disables overflow handling. The selected tab is scrolled into view. */
	overflow?: TabListOverflow
	/** Tab and TabMenu children. */
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TabProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Unique value matched against TabList `value`. */
	value: string
	/** Disabled tabs cannot navigate, select, or receive keyboard focus. */
	isDisabled?: boolean
	/** Accessible label — visible text by default; `isLabelHidden` makes it
	 *  the aria label only. */
	label: string
	isLabelHidden?: boolean
	/** Link target. Web renders a real anchor; native activates through
	 *  `followHref` (deep link → route table, else platform URL opener).
	 *  Ignored under `role="tablist"`. */
	href?: string
	/** Id of the panel this tab controls → `aria-controls` under the
	 *  tablist pattern; no effect (documented) under the nav pattern. */
	panelId?: string
	/** Custom link component (Astryx `as`) — web only. */
	as?: NavLinkComponentType
	/** Icon content or registered icon name shown when not selected. */
	icon?: Renderable
	/** Icon shown when selected; falls back to `icon`. */
	selectedIcon?: Renderable
	/** Content after the label (badge, status dot). */
	endContent?: Renderable
	/** Extra press callback run before selection reports to the list. */
	onPress?: () => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TabMenuOption {
	value: string
	label: string
	/** Icon content or registered icon name shown before the label. */
	icon?: Renderable
}

/** Overflow menu trigger inside a TabList — opens a dropdown of extra
 *  options; the selected option's label becomes the trigger text. */
export interface TabMenuProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Trigger label when no option is selected + the dropdown heading. */
	label: string
	options: TabMenuOption[]
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ----- AppShell -----

/** Width breakpoint name (`sm` 640, `md` 768, `lg` 1024, `xl` 1280,
 *  `2xl` 1536) or `none` to disable mobile mode. */
export type AppShellBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none'

/** Navigation background style: `wash` nav background, `surface` nav
 *  background, `section` dividers between nav and content, `elevated` wash
 *  nav + elevated surface content. */
export type AppShellVariant = 'wash' | 'surface' | 'section' | 'elevated'

export interface MobileNavConfig {
	/** Auto-render the hamburger toggle (default true). `false` → place
	 *  `MobileNavToggle` yourself. */
	hasToggle?: boolean
	/** Controlled drawer open state. */
	isOpen?: boolean
	onOpenChange?: (isOpen: boolean) => void
	/** Custom drawer content replacing the auto drawer — a `MobileNav`
	 *  element or raw children. Renders below the breakpoint inside the
	 *  managed drawer; the auto toggle stays on unless `hasToggle` is
	 *  false. */
	content?: Renderable
	/** Width point below which mobile nav activates (default `md`;
	 *  `none` disables automatic mobile mode). */
	breakpoint?: AppShellBreakpoint
	/** Initial mobile-layout hint for SSR/first paint. */
	defaultIsMobile?: boolean
}

export interface AppShellMobileContextValue {
	isMobile: boolean
	isMobileNavOpen: boolean
	/** Id of the mobile nav drawer (toggle references it). */
	mobileNavId?: string
	toggleMobileNav: () => void
	openMobileNav: () => void
	closeMobileNav: () => void
	isMobileNavEnabled: boolean
	hasAutoToggle: boolean
}

export interface AppShellProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	variant?: AppShellVariant
	/** Banner slot above the top nav. */
	banner?: Renderable
	/** Main content area. */
	children?: Renderable
	/** Main content padding on the spacing scale. */
	contentPadding?: SpacingStep
	/** `fill`: shell fills viewport and content scrolls internally;
	 *  `auto`: shell grows with content. */
	height?: 'fill' | 'auto'
	/** Mobile navigation behavior. Omit for the default auto drawer;
	 *  `false` disables it; a `MobileNavConfig` customizes it (breakpoint,
	 *  toggle, controlled open state). Set `MobileNavConfig.content` to
	 *  replace the drawer's content with your own — e.g. a `MobileNav`
	 *  element. */
	mobileNav?: false | MobileNavConfig
	/** Side navigation — typically a `SideNav`. */
	sideNav?: Renderable
	/** Top navigation — typically a `TopNav`. */
	topNav?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ----- TopNav -----

export type TopNavRenderMode = 'default' | 'mobile-bar' | 'drawer'
export type TopNavSlot = 'start' | 'center' | 'end'

export interface TopNavProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Heading slot — typically `TopNavHeading`. */
	heading?: Renderable
	/** Start slot — navigation items after the heading. */
	startContent?: Renderable
	/** Alias for `startContent` (startContent wins when both are set). */
	children?: Renderable
	/** Center slot — switches the bar to a three-column layout. */
	centerContent?: Renderable
	/** End slot — search, icons, user profile. */
	endContent?: Renderable
	/** Accessible label for the navigation landmark (default 'Top navigation'). */
	label?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TopNavHeadingProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Logo element before the heading (e.g. `NavIcon`). */
	logo?: Renderable
	/** Accessible name for a linked logo-only heading. */
	logoLabel?: string
	heading?: string
	headingHref?: string
	superheading?: string
	superheadingHref?: string
	subheading?: string
	subheadingHref?: string
	headerEndContent?: Renderable
	/** Menu content shown in a popover from the heading — typically a
	 *  `NavHeadingMenu`. A chevron affordance is added automatically. */
	menu?: Renderable
	as?: NavLinkComponentType
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TopNavItemProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	href?: string
	/** Web anchor attributes; no-op on native. */
	target?: string
	rel?: string
	download?: string | boolean
	referrerPolicy?: string
	as?: NavLinkComponentType
	/** Accessible label; visible text by default, aria label when
	 *  `isIconOnly`. */
	label: string
	isSelected?: boolean
	/** Disabled items cannot navigate and leave the tab order. */
	isDisabled?: boolean
	/** Square icon-only element; requires `icon`. */
	isIconOnly?: boolean
	/** Icon content or registered icon name before the label. */
	icon?: Renderable
	/** Content rendered instead of the label text. */
	children?: Renderable
	/** Size variant — controls drawer-mode height/padding. */
	size?: NavElementSize
	onClick?: () => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TopNavMenuItemData {
	title: string
	description?: string
	icon?: Renderable
	href?: string
	onClick?: () => void
}

/** Trigger that opens a menu popover on hover (pointer platforms) or
 *  press. */
export interface TopNavMenuProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	label: string
	items: TopNavMenuItemData[]
	/** Hover-open delay in ms (pointer platforms). */
	delay?: number
	/** Hover-close delay in ms (pointer platforms). */
	hideDelay?: number
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TopNavMegaMenuProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	label: string
	/** Menu items slot — `TopNavMegaMenuItem` children or custom content. */
	items?: Renderable
	/** Featured panel content (right side on wide layouts, below items in
	 *  the drawer). */
	featured?: Renderable
	delay?: number
	hideDelay?: number
	onOpenChange?: (isOpen: boolean) => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TopNavMegaMenuItemProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	title: string
	description?: string
	icon?: Renderable
	href?: string
	onClick?: () => void
	as?: NavLinkComponentType
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface TopNavMegaMenuFeaturedCardProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	title: string
	description?: string
	/** Decorative image URL shown above the body; `imageAlt` makes it
	 *  informative. */
	image?: string
	imageAlt?: string
	linkLabel?: string
	linkHref?: string
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ----- SideNav -----

export type SideNavRenderMode = 'default' | 'topbar' | 'drawer' | 'drawer-content'
export type NavItemSize = NavElementSize

export interface SideNavCollapseState {
	isCollapsed: boolean
	toggle: () => void
	isCollapsible: boolean
}

export interface SideNavCollapsibleConfig {
	defaultIsCollapsed?: boolean
	isCollapsed?: boolean
	onCollapsedChange?: (isCollapsed: boolean) => void
	/** Render the built-in collapse button (default true). */
	hasButton?: boolean
	/** Accessibility label for the built-in collapse button. */
	buttonLabel?: string
}

export interface SideNavControlledCollapsible extends SideNavCollapsibleConfig {
	isCollapsed: boolean
	onCollapsedChange: (isCollapsed: boolean) => void
}

/** @deprecated Hand the same controlled `collapsible` config to SideNav and
 *  to the outside button instead. */
export interface SideNavImperativeCollapseHandle {
	getCollapseState: () => SideNavCollapseState | null
}

export interface SideNavProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Header area (typically `SideNavHeading`) — sticky at top. */
	header?: Renderable
	/** Content pinned below the header — sticky. */
	topContent?: Renderable
	/** Navigation sections and items — scrollable. */
	children?: Renderable
	/** Footer area above the icon bar. */
	footer?: Renderable
	/** Footer icon bar (help, notifications, avatar, collapse button). */
	footerIcons?: Renderable
	/** Collapse to an icon-only rail: `true` for defaults, or a config
	 *  object (`defaultIsCollapsed`, controlled `isCollapsed` +
	 *  `onCollapsedChange`, `hasButton`, `buttonLabel`). */
	collapsible?: boolean | SideNavCollapsibleConfig
	/** Inline-end resize handle: `true` for defaults (260dip initial,
	 *  180–480 range) or a `ResizableConfig`. */
	resizable?: boolean | ResizableConfig
	/** @deprecated Share one controlled `collapsible` config instead. */
	handleRef?: { current: SideNavImperativeCollapseHandle | null }
	/** Landmark label (default 'Side navigation'). */
	label?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface SideNavSectionProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	title: string
	subtitle?: string
	children?: Renderable
	/** Trailing content in the section header. */
	endContent?: Renderable
	/** Visually hide the header (title stays accessible). */
	isHeaderHidden?: boolean
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface SideNavHeadingProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Product/app icon (e.g. `NavIcon`). */
	icon?: Renderable
	as?: NavLinkComponentType
	heading: string
	headingHref?: string
	superheading?: string
	superheadingHref?: string
	subheading?: string
	subheadingHref?: string
	headerEndContent?: Renderable
	/** Menu popover content (typically `NavHeadingMenu`) — shows a chevron
	 *  affordance. Without hrefs the whole header is the trigger; with hrefs
	 *  the chevron area is. */
	menu?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface SideNavItemProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	as?: NavLinkComponentType
	label: string
	/** Icon (element or registered name) shown when not selected. */
	icon?: Renderable
	/** Icon shown when selected; falls back to `icon`. */
	selectedIcon?: Renderable
	isSelected?: boolean
	isDisabled?: boolean
	href?: string
	onClick?: () => void
	/** Passive trailing content (badges, counts) inside the primary
	 *  element. */
	endContent?: Renderable
	/** Row-level secondary controls rendered as siblings at the trailing
	 *  edge; hidden while the rail is collapsed. */
	actions?: Renderable
	/** Sub-items for nesting. */
	children?: Renderable
	/** Collapse behavior for items with children — `true` (starts expanded)
	 *  or `{ defaultIsCollapsed?, isCollapsed?, onCollapsedChange? }`. */
	collapsible?:
		| boolean
		| {
				defaultIsCollapsed?: boolean
				isCollapsed?: boolean
				onCollapsedChange?: (isCollapsed: boolean) => void
		  }
	size?: NavItemSize
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface SideNavCollapseButtonProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** The same controlled config given to SideNav — needed only when the
	 *  button renders outside this SideNav. */
	collapsible?: SideNavControlledCollapsible
	/** @deprecated Pass `collapsible` instead. */
	handleRef?: { current: SideNavImperativeCollapseHandle | null }
	/** Text label — renders a text+chevron button instead of icon-only. */
	label?: string
	size?: NavElementSize
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ----- MobileNav -----

export interface MobileNavProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Drawer open state — inside `AppShell` it is managed by context. */
	isOpen?: boolean
	onOpenChange?: (isOpen: boolean) => void
	children?: Renderable
	/** Drawer header — a string renders as a heading; an element for custom
	 *  content (logo, `SideNavHeading`, search). */
	header?: Renderable
	/** Drawer width in dips/px. */
	width?: number
	/** Edge the drawer slides from — `auto` resolves from the toggle's
	 *  position on web, and defaults to `start` elsewhere. */
	side?: 'start' | 'end' | 'auto'
	/** Accessible label (falls back to a string `header`, then
	 *  'Navigation'). */
	label?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface MobileNavToggleProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Custom content replacing the default hamburger glyph. */
	children?: Renderable
	/** Accessible label (default 'Open navigation'). */
	label?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ----- NavHeadingMenu (upstream NavMenu module) -----

export type NavHeadingMenuSize = NavElementSize

export interface NavHeadingMenuContextValue {
	size: NavHeadingMenuSize
	closeMenu: () => void
}

/** Close callback supplied by the heading popover hosting the menu. */
export interface NavHeadingCloseContextValue {
	closeMenu: () => void
}

export interface NavHeadingMenuProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** `NavHeadingMenuItem` children, separators, or custom content. */
	children?: Renderable
	size?: NavHeadingMenuSize
	/** Minimum width override (dips/px) — takes precedence over the
	 *  size-based default. */
	minWidth?: number | string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export interface NavHeadingMenuItemProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	icon?: Renderable
	label: Renderable
	description?: Renderable
	href?: string
	onClick?: () => void
	isDisabled?: boolean
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ----- OverflowList -----

export interface OverflowItem {
	/** The caller-supplied element for this item. */
	child: Renderable
	/** Index in the original children list. */
	index: number
}

/** Renders a measured subset of `children`; items that exceed the row (or a
 *  configured count cap) collapse into the `overflowRenderer` indicator. */
export interface OverflowListProps extends LayoutChildProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** One element per item. */
	children?: Renderable
	/** Gap between items, spacing-scale step (default 2). */
	gap?: SpacingStep
	minVisibleItems?: number
	maxVisibleItems?: number
	/** Wrap items across up to this many rows before collapsing. */
	maxRows?: number
	collapseFrom?: 'start' | 'end'
	/** `observeSelf` (default) measures this list's width; `observeParent`
	 *  measures the parent's content width instead. */
	behavior?: 'observeParent' | 'observeSelf'
	/** Renders the overflow indicator for the collapsed items. */
	overflowRenderer?: (overflowItems: OverflowItem[]) => Renderable
	/** Called with the collapsed items whenever that set changes; silent
	 *  while nothing overflows (including mount), and again with `[]` when
	 *  everything fits after having overflowed. */
	onOverflowChange?: (overflowItems: OverflowItem[]) => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ----- Resizable -----

export type ResizableDirection = 'horizontal' | 'vertical'

/** A pixel bound for a percentage size — `pixel(240)`. */
export interface ResizablePixelSize {
	readonly type: 'pixel'
	readonly value: number
}

/** A percentage with exactly one pixel floor or ceiling —
 *  `percent(50, {min: pixel(200)})`. */
export type ResizablePercentSize = {
	readonly type: 'percent'
	readonly value: number
} & (
	| { readonly min: ResizablePixelSize; readonly max?: never }
	| { readonly min?: never; readonly max: ResizablePixelSize }
)

/** A resizable size: px number, exact `Npx`/`N%` strings, `pixel(n)`, or
 *  `percent(n, {min|max})`. Basis-dependent values resolve once against the
 *  `containerRef` element (or the viewport/screen when omitted). */
export type ResizableSize =
	| number
	| `${number}px`
	| `${number}%`
	| ResizablePixelSize
	| ResizablePercentSize

export interface ResizableMinConfig {
	minSize?: ResizableSize
}

export interface ResizableMaxConfig {
	maxSize?: ResizableSize
}

export interface ResizableRegionSizing {
	defaultSize?: ResizableSize
	/** Whether this region can collapse to 0 (default false). */
	collapsible?: boolean
	/** Size in px/dips below which a drag collapses the region (default 40). */
	collapsedSize?: number
	/** Sizes to snap to during resize. */
	snaps?: number[]
	/** Cascade priority — lower numbers shrink first in multi-region layouts. */
	shrinkOrder?: number
}

export type ResizableRegionConfig = ResizableRegionSizing & ResizableMinConfig & ResizableMaxConfig

/** Simplified resize config accepted by a component's `resizable` prop
 *  (e.g. `SideNav`). */
export interface ResizableConfig {
	defaultWidth?: number
	minWidth?: number
	maxWidth?: number
	/** Persistence key — localStorage on web, ApplicationSettings on
	 *  native; in-memory only on the AppKit desktop leaf. */
	autoSaveId?: string
	onWidthChange?: (width: number) => void
	defaultIsCollapsed?: boolean
	isCollapsed?: boolean
	onCollapseChange?: (isCollapsed: boolean) => void
}

export interface UseResizableSingleOptions {
	/** Element/view a percentage resolves against — `{ current }` shaped. */
	containerRef?: { current: HostElement | null }
	/** Axis this region resizes along; must match `ResizeHandle.direction`. */
	direction?: ResizableDirection
	autoSaveId?: string
	defaultIsCollapsed?: boolean
	isCollapsed?: boolean
	onSizeChange?: (size: number) => void
	onCollapseChange?: (isCollapsed: boolean) => void
}

export type UseResizableSingleConfig = ResizableRegionConfig & UseResizableSingleOptions

export interface UseResizableMultiConfig {
	direction?: ResizableDirection
	containerRef?: { current: HostElement | null }
	regions: Record<string, ResizableRegionConfig>
	autoSaveId?: string
}

/** The handle-facing contract produced by `useResizable` — spread onto a
 *  `ResizeHandle`'s `resizable` prop (or a component's `resizable` prop).
 *  Underscore fields are internal plumbing exported for hand-built
 *  integrations. */
export interface ResizableProps {
	_size: number
	_isCollapsed: boolean
	_onResizeStart: () => void
	_onResizeMove: (delta: number) => void
	_onResizeEnd: () => void
	/** Gesture ended without completing (pointercancel/lost capture/handle
	 *  unmounted) — releases the gesture without signalling a resize end. */
	_onResizeCancel?: () => void
	_minSizePx: number
	_maxSizePx: number
	_snaps: number[]
	_collapsedSize: number
	_collapsible: boolean
	_direction?: ResizableDirection
	_isResizableProps: true
}

export interface ResizableRegion {
	/** Current size in px/dips. */
	size: number
	isCollapsed: boolean
	collapse: () => void
	expand: () => void
	resize: (size: number) => void
	/** Props to spread into `ResizeHandle`'s `resizable`. */
	props: ResizableProps
}

export interface ResizeHandleProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Layout direction — determines cursor and indicator orientation
	 *  (default 'horizontal'). */
	direction?: ResizableDirection
	/** `inline` (default) places the handle in flow; `overlay` positions it
	 *  inside the parent panel's edge. */
	position?: 'inline' | 'overlay'
	/** Reverse the drag direction — set when the handle controls a panel on
	 *  the end/right/bottom side. */
	isReversed?: boolean
	isDisabled?: boolean
	/** Paint a hairline divider at the handle position (inline mode). */
	hasDivider?: boolean
	/** Show the pill grip at rest; `false` reveals it on hover/focus. */
	isAlwaysVisible?: boolean
	/** Which side of the divider the pill sits on — `auto` keeps it on the
	 *  panel side, flipping to centre when the panel collapses to 0. */
	pillPlacement?: 'auto' | 'start' | 'end' | 'center'
	/** Accessible label (default 'Resize handle'). */
	label?: string
	/** Region props from `useResizable`. */
	resizable?: ResizableProps
	/** Custom handle content replacing the default pill. */
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- actions & interactive cards (Astryx parity) ----------

/** Icon-only button — `label` is the accessible name and doubles as the
 *  hover/focus tooltip on pointer targets. `icon` is required: a node or a
 *  registered icon name. */
export interface IconButtonProps extends Omit<
	ButtonProps,
	'children' | 'endContent' | 'isIconOnly' | 'label'
> {
	icon: Renderable
	label: string
}

export type ButtonGroupOrientation = 'horizontal' | 'vertical'

/** Shared context Button (and grouped trigger components) read inside a
 *  ButtonGroup — mirrors upstream `useButtonGroup`. */
export interface ButtonGroupContextValue {
	orientation: ButtonGroupOrientation
	isDisabled: boolean
	size?: FieldControlSize
}

/** Connected button row — shared surface, squared inner edges, single tab
 *  stop with arrow-key navigation on web. Children are Buttons/IconButtons/
 *  ToggleButtons or a DropdownMenu trigger member. */
export interface ButtonGroupProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	/** Accessible label for the group (role="group" aria-label). */
	label: string
	/** @default 'horizontal' */
	orientation?: ButtonGroupOrientation
	/** Default size for group members. @default 'md' */
	size?: FieldControlSize
	/** Resting elevation for the shared surface. @default 'none' */
	elevation?: Elevation
	isDisabled?: boolean
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Toggle button — pressed state with `isPressed`/`onPressedChange`, an
 *  optional `pressedChangeAction` run through Button's action transition, and
 *  `pressedIcon` for outline→filled swaps. Inside a ToggleButtonGroup the
 *  group owns pressed state via `value`. */
export interface ToggleButtonProps extends Omit<ButtonProps, 'label' | 'variant' | 'clickAction'> {
	label: string
	isPressed?: boolean
	/** Called with the next pressed state when the button is activated. */
	onPressedChange?: (isPressed: boolean) => void
	/** Action-backed toggle — runs while the pending spinner shows, with an
	 *  optimistic press flip. Ignored when `value` binds group membership.
	 *  Failures report through `onActionError`. */
	pressedChangeAction?: (isPressed: boolean) => void | Promise<void>
	/** Icon shown while pressed (e.g. filled variant); falls back to `icon`. */
	pressedIcon?: Renderable
	/** Member key inside a ToggleButtonGroup. */
	value?: string
}

interface ToggleButtonGroupBaseProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	/** Accessible label for the group (role="group" aria-label). */
	label: string
	orientation?: ButtonGroupOrientation
	size?: FieldControlSize
	isDisabled?: boolean
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Single-select toggle group — clicking the active button deselects. */
export interface ToggleButtonGroupSingleProps extends ToggleButtonGroupBaseProps {
	type?: 'single'
	value: string | null
	onChange: (value: string | null) => void
}

/** Multi-select toggle group. */
export interface ToggleButtonGroupMultipleProps extends ToggleButtonGroupBaseProps {
	type: 'multiple'
	value: string[]
	onChange: (value: string[]) => void
}

export type ToggleButtonGroupProps = ToggleButtonGroupSingleProps | ToggleButtonGroupMultipleProps

/** Interactive card for navigation or action targets. The whole surface is
 *  one press/click target; nested interactive children (buttons, links) still
 *  work independently. `href` gives real link semantics on web (modifier and
 *  middle clicks open a new tab; unsafe URL schemes are refused) and opens
 *  the platform browser on native. */
export interface ClickableCardProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Accessible name for the card's action. */
	label: string
	onPress?: () => void
	href?: string
	target?: string
	isDisabled?: boolean
	children?: Renderable
	/** Internal padding in 4px spacing steps. @default 4 */
	padding?: number
	/** @default 'default' */
	variant?: string
	/** @default 'none' */
	elevation?: Elevation
	width?: number | string
	height?: number | string
	maxWidth?: number | string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Toggle-selection card — same surface contract as ClickableCard with a
 *  checked/selected semantic instead of an action. */
export interface SelectableCardProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Accessible name for the selectable card. */
	label: string
	/** Controlled selection state. */
	isSelected: boolean
	onChange: (isSelected: boolean) => void
	/** Disabled cards stay focusable with a disabled state announced. */
	isDisabled?: boolean
	children?: Renderable
	padding?: number
	variant?: string
	elevation?: Elevation
	width?: number | string
	height?: number | string
	maxWidth?: number | string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

export type MoreMenuPlacement =
	| 'above'
	| 'below'
	| 'start'
	| 'end'
	| 'left'
	| 'right'
	| PopoverPlacement

export type MoreMenuAlignment = PopoverAlignment
/** 'popover' anchors the menu to the trigger; 'bottom-sheet' docks it in the
 *  bottom sheet; 'adaptive' resolves to bottom-sheet on coarse-pointer/touch
 *  targets and popover elsewhere. @default 'popover' */
export type MoreMenuPresentation = 'popover' | 'bottom-sheet' | 'adaptive'

/** Overflow menu — icon-only three-dot trigger feeding a DropdownMenu. */
export interface MoreMenuProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	items: MenuItem[]
	/** Accessible label for the trigger. @default 'More options' */
	label?: string
	/** Trigger button variant. @default 'ghost' */
	variant?: ButtonVariant
	/** Trigger button size. @default 'md' */
	size?: FieldControlSize
	/** Trigger icon override — node or registered name. @default three dots */
	icon?: Renderable
	isDisabled?: boolean
	/** Menu side of the trigger. @default 'below' */
	placement?: MoreMenuPlacement
	/** Menu alignment along the placement axis. @default 'start' */
	alignment?: MoreMenuAlignment
	/** Menu presentation policy. @default 'popover' */
	presentation?: MoreMenuPresentation
	/** Controlled open state. */
	isMenuOpen?: boolean
	onOpenChange?: (isOpen: boolean) => void
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- PowerSearch (Astryx parity) ----------

// Reuse the shared SearchableItem and SearchSource contracts from Typeahead.

// Operator value kinds — what editor a filter value uses.
export interface EmptyOperatorValue {
	readonly type: 'empty'
}

export interface StringOperatorValue {
	readonly type: 'string'
	readonly searchSource?: SearchSource
	readonly isArbitraryStringAllowed?: boolean
}

export interface StringListOperatorValue {
	readonly type: 'string_list'
	readonly searchSource?: SearchSource
	readonly isArbitraryStringAllowed?: boolean
	readonly tokenization?: OperatorTokenizationConfig
}

export interface IntegerOperatorValue {
	readonly type: 'integer'
	readonly minValue?: number
	readonly maxValue?: number
	readonly units?: string
}

export interface FloatOperatorValue {
	readonly type: 'float'
	readonly minValue?: number
	readonly maxValue?: number
	readonly units?: string
}

export interface TimeOperatorValue {
	readonly type: 'time'
	readonly minValue?: string
	readonly maxValue?: string
}

export interface DateAbsoluteOperatorValue {
	readonly type: 'date_absolute'
	/** Date-only editing without a time part. */
	readonly isDateOnly?: boolean
}

export interface DateRelativeOperatorValue {
	readonly type: 'date_relative'
	/** @default true */
	readonly isPastAllowed?: boolean
	/** @default true */
	readonly isFutureAllowed?: boolean
}

export interface DateRangeOperatorValue {
	readonly type: 'date_range'
	readonly intervalDatePresets?: ReadonlyArray<DateRangeFilterPreset>
	readonly relativeDatePresets?: ReadonlyArray<RelativeDateFilterPreset>
}

export interface EnumItem {
	readonly value: string
	readonly label: string
	readonly icon?: Renderable
}

export interface EnumOperatorValue {
	readonly type: 'enum'
	readonly values: ReadonlyArray<EnumItem>
}

export interface EnumListOperatorValue {
	readonly type: 'enum_list'
	readonly values: ReadonlyArray<EnumItem>
}

export interface EntityListOperatorValue {
	readonly type: 'entity_list'
	readonly searchSource?: SearchSource
	readonly isArbitraryStringAllowed?: boolean
	readonly tokenization?: OperatorTokenizationConfig
	readonly renderItem?: (item: SearchableItem) => Renderable
}

/** Props for a caller-supplied `CustomOperatorValue.Editor` — the JSON value
 *  string and its change sink inside the filter editor. */
export interface CustomOperatorEditorProps {
	value: string
	onChange(value: string): void
	placeholder?: string
	isDisabled?: boolean
}

export interface CustomOperatorValue {
	readonly type: 'custom'
	/** Caller editor component: `{value, onChange, placeholder, isDisabled}`. */
	readonly Editor: ElementComponent<CustomOperatorEditorProps>
	/** JSON value → display string for the token. */
	readonly getString: (value: string) => string
}

export interface NestedOperatorValue {
	readonly type: 'nested'
}

export type OperatorValue =
	| EmptyOperatorValue
	| StringOperatorValue
	| StringListOperatorValue
	| IntegerOperatorValue
	| FloatOperatorValue
	| TimeOperatorValue
	| DateAbsoluteOperatorValue
	| DateRelativeOperatorValue
	| DateRangeOperatorValue
	| EnumOperatorValue
	| EnumListOperatorValue
	| EntityListOperatorValue
	| CustomOperatorValue
	| NestedOperatorValue

// Stored filter values.
export interface FilterValueEmpty {
	readonly type: 'empty'
}

export interface FilterValueString {
	readonly type: 'string'
	readonly value: string
}

export interface FilterValueStringList {
	readonly type: 'string_list'
	readonly value: ReadonlyArray<string>
}

export interface FilterValueInteger {
	readonly type: 'integer'
	readonly value: number
}

export interface FilterValueFloat {
	readonly type: 'float'
	readonly value: number
}

export interface FilterValueTime {
	readonly type: 'time'
	readonly value: string
}

export interface FilterValueDateAbsolute {
	readonly type: 'date_absolute'
	readonly unixSeconds: number
}

export interface FilterValueDateRelative {
	readonly type: 'date_relative'
	readonly value: string
}

export interface FilterValueDateRange {
	readonly type: 'date_range'
	readonly value: DateTimeRange
}

export interface FilterValueEnum {
	readonly type: 'enum'
	readonly value: string
}

export interface FilterValueEnumList {
	readonly type: 'enum_list'
	readonly value: ReadonlyArray<string>
}

export interface PowerSearchEntity {
	readonly id: string
	readonly label: string
	readonly photo?: string
}

export interface FilterValueEntityList {
	readonly type: 'entity_list'
	readonly value: ReadonlyArray<PowerSearchEntity>
}

export interface FilterValueCustom {
	readonly type: 'custom'
	readonly value: string
}

export interface FilterValueNested {
	readonly type: 'nested'
	readonly value: ReadonlyArray<PowerSearchFilter>
}

export type FilterValue =
	| FilterValueEmpty
	| FilterValueString
	| FilterValueStringList
	| FilterValueInteger
	| FilterValueFloat
	| FilterValueTime
	| FilterValueDateAbsolute
	| FilterValueDateRelative
	| FilterValueDateRange
	| FilterValueEnum
	| FilterValueEnumList
	| FilterValueEntityList
	| FilterValueCustom
	| FilterValueNested

export interface OperatorTokenizationConfig {
	/** Regex applied to pasted text. */
	readonly regex?: string
	/** Sort tokens after tokenizing. */
	readonly sort?: boolean
}

export type DateTimeRangePart =
	| { readonly type: 'NOW' }
	| { readonly type: 'ABSOLUTE'; readonly unixSeconds: number }
	| {
			readonly type: 'RELATIVE'
			readonly backValue: number
			readonly unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
			readonly anchorKey?: string
	  }

export interface DateTimeRange {
	readonly start: DateTimeRangePart
	readonly end: DateTimeRangePart
}

export interface DateRangeFilterPreset {
	readonly label: string
	readonly value: DateTimeRange
}

export interface RelativeDateFilterPreset {
	readonly label: string
	readonly value: string
}

// Config vocabulary.
export interface PowerSearchOperatorBase {
	readonly key: string
	readonly value: OperatorValue
}

/** Operator with literal label text. */
export interface PowerSearchOperatorWithLabel extends PowerSearchOperatorBase {
	readonly label: string
	readonly i18nKey?: never
}

/** Operator whose label resolves through the PowerSearch string catalog —
 *  `@octane-xplat/ui` ships English defaults for the `@astryx.powersearch.*`
 *  keys; a custom catalog key falls back to the key's last segment. */
export interface PowerSearchOperatorWithI18nKey extends PowerSearchOperatorBase {
	readonly i18nKey: string
	readonly label?: never
}

export type PowerSearchOperator = PowerSearchOperatorWithLabel | PowerSearchOperatorWithI18nKey

export interface PowerSearchField {
	readonly key: string
	readonly label: string
	readonly operators: ReadonlyArray<PowerSearchOperator>
	readonly icon?: Renderable
	/** Default operator key when the field is picked. */
	readonly defaultOperator?: string
	/** Group label organizing fields in the browse menu. */
	readonly group?: string
	readonly description?: string
	/** Extra strings that match this field in the typeahead. */
	readonly typeaheadAliases?: ReadonlyArray<string>
	/** Minimum query length before this field appears in the menu. */
	readonly typeaheadMinQueryLength?: number
	/** Offer value matches for this field. @default true */
	readonly isValueMatchAllowed?: boolean
}

export interface PowerSearchConfig {
	readonly name: string
	readonly fields: ReadonlyArray<PowerSearchField>
	/** Field key receiving free-text search. */
	readonly contentSearchFieldKey?: string
}

export interface PowerSearchFilter {
	readonly field: string
	readonly operator: string
	readonly value: FilterValue
	/** Prevent editing this filter. */
	readonly isReadOnly?: boolean
}

export interface PartialFilter {
	readonly field: string
	readonly operator?: string
	readonly value?: FilterValue
	readonly isReadOnly?: boolean
}

export type PowerSearchChangeType = 'add' | 'edit' | 'remove'

/** Imperative typeahead handle exposed through `handleRef`. */
export interface PowerSearchHandle {
	focusTypeahead(): void
	blurTypeahead(): void
}

export interface PowerSearchAuxData {
	readonly fieldKey: string
	readonly operatorKey?: string
	readonly filterValue?: FilterValue
	readonly filterIndex?: number
	readonly group?: string
}

export type PowerSearchItem = SearchableItem<PowerSearchAuxData>

export type PowerSearchSize = 'sm' | 'md' | 'lg'

/** Props for a custom token pill (`components[type].Token`). */
export interface PowerSearchTokenProps {
	readonly config: PowerSearchConfig
	readonly filter: PowerSearchFilter
	readonly field: PowerSearchField
	readonly operator: PowerSearchOperator
	readonly maxLength: number
	readonly onPress?: () => void
	readonly onRemove?: () => void
	readonly isDisabled?: boolean
	readonly timezoneID?: string
}

/** Props for a custom filter editor (`components[type].Editor`). */
export interface PowerSearchEditorProps {
	readonly config: PowerSearchConfig
	readonly filter: PartialFilter
	readonly mode: 'create' | 'edit'
	readonly onSave: (filter: PowerSearchFilter | null) => void
	readonly onCancel: () => void
	readonly saveButtonLabel?: string
	readonly isReadOnly?: boolean
	readonly timezoneID?: string
}

/** Props for `PowerSearchFilterEditor` — the default filter editor and the
 *  same contract `components[type].Editor` overrides receive. */
export type PowerSearchFilterEditorProps = PowerSearchEditorProps

export interface PowerSearchComponentOverride {
	readonly Token?: ElementComponent<PowerSearchTokenProps>
	readonly Editor?: ElementComponent<PowerSearchEditorProps>
}

export type PowerSearchComponents = Partial<
	Record<OperatorValue['type'], PowerSearchComponentOverride>
>

/** Structured filter bar — pick a field, then operator and value in the
 *  editor popover; committed filters render as removable, editable tokens.
 *  A `config` built by `createPowerSearchConfig` carries its field
 *  definitions, so `filters`/`onChange` only accept field/operator/value
 *  combinations the config declares (see `PowerSearchFilterFor`); a
 *  hand-built `PowerSearchConfig` keeps the loose `PowerSearchFilter`. */
export interface PowerSearchProps<C extends PowerSearchConfig = PowerSearchConfig>
	extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Status layout: overlaps the field below it or occupies its own row. */
	statusVariant?: 'attached' | 'detached'
	/** Field/operator configuration. */
	config: C
	/** Active filters (controlled). */
	filters: ReadonlyArray<PowerSearchFilterFor<C>>
	/** Fires on add/edit/remove with the change type and filter index. */
	onChange: (
		filters: ReadonlyArray<PowerSearchFilterFor<C>>,
		changeType: PowerSearchChangeType,
		index: number,
	) => void
	/** Accessible label. @default 'Search' */
	placeholder?: string
	/** @default false */
	hasAutoFocus?: boolean
	/** Show a clear-all affordance. @default true */
	hasClear?: boolean
	/** Explains the disabled state; shown via the platform hint channel. */
	disabledMessage?: string
	/** Leading icon — node or registered icon name. */
	startIcon?: Renderable
	/** Exact pixel width of the field/suggestion menu. */
	menuWidth?: number
	/** Max display length for token values. @default 40 */
	maxTokenLength?: number
	/** Max suggestions inside value-editor menus. @default 10 */
	maxOperatorMenuItems?: number
	/** Max ranked results for a non-empty query. @default 10 */
	maxSearchResults?: number
	/** Editor save-button label. @default 'Apply' */
	popoverSaveButtonLabel?: string
	/** IANA timezone for absolute-date formatting. */
	timezoneID?: string
	/** Trailing content on the input row. */
	endContent?: Renderable
	/** Match count shown at the end of the bar and announced politely. */
	resultCount?: number | string
	/** Callback adaptation of Astryx's imperative handle ref. */
	handleRef?: (handle: PowerSearchHandle) => void
	onFocus?: () => void
	onBlur?: () => void
	/** Per-operator-value-type Token/Editor component overrides. */
	components?: PowerSearchComponents
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Simplified field definitions → `createPowerSearchConfig`. */
export interface FieldDefinition<
	K extends string = string,
	T extends PowerSearchFieldType = PowerSearchFieldType,
> {
	readonly key: K
	readonly type: T
	readonly label?: string
	/** Required for 'enum'/'enum_list'. */
	readonly enumValues?: ReadonlyArray<EnumItem>
}

export type PowerSearchFieldType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'date'
	| 'enum'
	| 'enum_list'
	| 'string_list'

export type PowerSearchFieldTypeToJS = {
	string: string
	number: number
	boolean: boolean
	date: Date | number
	enum: string
	enum_list: ReadonlyArray<string>
	string_list: ReadonlyArray<string>
}

/** Infers the row type a field-definition tuple describes. */
export type InferData<D extends ReadonlyArray<FieldDefinition>> = {
	[F in D[number] as F['key']]: PowerSearchFieldTypeToJS[F['type']]
}

/** Phantom key carrying a `createPowerSearchConfig` field-definition tuple —
 *  type-level only, never present at runtime. Module-private so the
 *  published declarations carry no value binding for it. */
declare const powerSearchFields: unique symbol

/** The field-definition record `createPowerSearchConfig` brands onto its
 *  config — read it with `PowerSearchFilterFor`, never directly. */
export interface PowerSearchDefInfo<Defs extends readonly FieldDefinition[]> {
	readonly [powerSearchFields]: Defs
}

/** The enum `value` union a definition declares — `as const` definitions
 *  keep literal values; a non-literal `enumValues` degrades to `string`. */
type EnumValuesOf<D> = D extends { readonly enumValues: infer E extends readonly EnumItem[] }
	? E[number]['value']
	: string

/** The `operator`/`value` pairs a field type's generated operators accept —
 *  mirrors `buildField` in power-search-config.ts: string and enum share
 *  `is`/`is_not`, numbers compare, dates bound, booleans and lists use the
 *  empty/list vocabularies. */
type PowerSearchFieldFilter<D extends FieldDefinition> = D extends {
	readonly key: infer K extends string
	readonly type: infer T extends PowerSearchFieldType
}
	? (
			T extends 'string'
				? {
						readonly field: K
						readonly operator:
							| 'contains'
							| 'not_contains'
							| 'starts_with'
							| 'not_starts_with'
							| 'ends_with'
							| 'not_ends_with'
							| 'is'
							| 'is_not'
						readonly value: FilterValueString
					}
				: T extends 'number'
					? {
							readonly field: K
							readonly operator:
								| 'equals'
								| 'not_equals'
								| 'greater_than'
								| 'less_than'
								| 'greater_than_or_equal'
								| 'less_than_or_equal'
							readonly value: FilterValueFloat | FilterValueInteger
						}
					: T extends 'boolean'
						? {
								readonly field: K
								readonly operator: 'is_true' | 'is_false'
								readonly value: FilterValueEmpty
							}
						: T extends 'date'
							?
									| {
											readonly field: K
											readonly operator: 'before' | 'after'
											readonly value: FilterValueDateAbsolute
									  }
									| {
											readonly field: K
											readonly operator: 'between'
											readonly value: FilterValueDateRange
									  }
							: T extends 'enum'
								? {
										readonly field: K
										readonly operator: 'is' | 'is_not'
										readonly value: { readonly type: 'enum'; readonly value: EnumValuesOf<D> }
									}
								: T extends 'enum_list'
									? {
											readonly field: K
											readonly operator: 'is_any_of' | 'is_none_of'
											readonly value: {
												readonly type: 'enum_list'
												readonly value: ReadonlyArray<EnumValuesOf<D>>
											}
										}
									: T extends 'string_list'
										? {
												readonly field: K
												readonly operator: 'is_any_of' | 'is_none_of'
												readonly value: FilterValueStringList
											}
										: never
		) & { readonly isReadOnly?: boolean }
	: never

/** The filter union a schema accepts — pass the `config` from
 *  `createPowerSearchConfig` (`PowerSearchFilterFor<typeof config>`) or a
 *  field-definition tuple directly; anything else resolves to the loose
 *  `PowerSearchFilter`. `field` is a defined key, `operator` one of that
 *  field's operators, and `value` the operator's stored shape — invented
 *  names and incompatible values fail at the callsite. */
export type PowerSearchFilterFor<Source> = Source extends {
	readonly [powerSearchFields]: infer Defs
}
	? Defs extends readonly FieldDefinition[]
		? PowerSearchFieldFilter<Defs[number]>
		: PowerSearchFilter
	: Source extends readonly FieldDefinition[]
		? PowerSearchFieldFilter<Source[number]>
		: PowerSearchFilter

// ---------- theme ----------

export type ColorScheme = 'light' | 'dark'

// ---------- collection identity ----------

/** Stable item identity shared by keyed collections and the collection data
 *  stores — React Aria's `Key`. A key names the item itself and stays valid
 *  across inserts, reorders, and moves; an index is only the item's current
 *  position, so keyed lookups and callbacks take `Key`, not a position. */
export type Key = string | number

/** Selection shared by keyed collections — React Aria's `Selection`:
 *  `'all'` or the set of selected keys. Reported sets are readonly — the
 *  framework owns them; pass them back instead of mutating. */
export type Selection = 'all' | ReadonlySet<Key>

// ---------- styled() ----------

/** One class value in a `styled()` definition — a class string, a list of
 *  class strings, or a falsy value that contributes nothing. Unlike
 *  `ClassName`, keyed objects are not allowed: an object map declares an
 *  enumerated variant instead. */
export type StyledClass = string | readonly string[] | false | null | undefined

/** One `styled()` variant slot. A `StyledClass` value is a boolean
 *  variant — the prop takes a flag and the class applies when truthy. An
 *  option→class record is an enumerated variant — the prop takes one of
 *  its option names. */
export type StyledVariant = StyledClass | { readonly [option: string]: StyledClass }

/** The props a `styled()` component accepts for its variant slots —
 *  `boolean` flags for class variants, option-name unions for enumerated
 *  variants. */
export type StyledVariantSelection<V extends Record<string, StyledVariant>> = {
	[K in keyof V]?: V[K] extends { readonly [option: string]: StyledClass }
		? keyof V[K] & string
		: boolean
}

/** `styled()` definition — `base` classes compose unconditionally, each
 *  `variants` slot adds a typed prop, and `defaultVariants` supplies the
 *  value used when a variant prop is omitted. */
export interface StyledDef<V extends Record<string, StyledVariant>> {
	base?: StyledClass
	variants?: V
	defaultVariants?: StyledVariantSelection<V>
}

// ---------- stores ----------

/** The value a store read hands out — readonly, because mutating it would
 *  bypass the store and leave subscribers stale. Arrays become
 *  `readonly T[]`, maps `ReadonlyMap`, sets `ReadonlySet`; other values get
 *  readonly properties. Write through the store's own methods instead. */
export type StoreSnapshot<T> = T extends ReadonlyMap<infer K, infer V>
	? ReadonlyMap<K, V>
	: T extends ReadonlySet<infer V>
		? ReadonlySet<V>
		: T extends readonly (infer E)[]
			? readonly E[]
			: T extends object
				? Readonly<T>
				: T

/** Minimal external-store contract `useStore` subscribes to — the same
 *  `subscribe` + `getSnapshot` pair `useSyncExternalStore` expects.
 *  `getSnapshot` is a one-time read: it never subscribes the caller, so a
 *  render that reads it directly can go stale on the universal renderer
 *  (retained children do not re-run). A reactive read goes through
 *  `useStore(store)`. */
export interface ReadableStore<T> {
	getSnapshot(): StoreSnapshot<T>
	subscribe(notify: () => void): () => void
}

export interface Store<T> extends ReadableStore<T> {
	/** Assign a value. Updaters belong to `update` — a function passed here
	 *  is stored as the value, never invoked. */
	set(value: T): void
	/** Compute the next value from the current snapshot. */
	update(updater: (prev: StoreSnapshot<T>) => T): void
}

// Astryx-aligned component prop names. The existing interfaces remain the
// source contracts so these aliases preserve the current cross-platform API.
/** Props accepted by `Divider`, using the existing `Separator` contract. */
export type DividerProps = SeparatorProps
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
export type MultiSelectorProps = Omit<
	SelectProps,
	'multiple' | 'value' | 'defaultValue' | 'onValueChange' | 'changeAction'
> & {
	value?: string[]
	defaultValue?: string[]
	onValueChange?: (value: string[]) => void
	changeAction?: (value: string[]) => void | Promise<void>
}

/** Props accepted by `Breadcrumbs`. */
export type BreadcrumbsProps = BreadcrumbProps
/** Props accepted by `TreeList`. */
export type TreeListProps<T extends TreeListNode = TreeListNode> = TreeProps<T>
/** Props accepted by `EmptyState`. */
export type EmptyStateProps = EmptyProps
/** Props accepted by `Spinner`. */
export type SpinnerProps = ActivityIndicatorProps

// ---------- content display (Astryx parity) ----------

/** Semantic text roles used by Timestamp/Timer — the Astryx `type` axis.
 *  `inherit` adopts the surrounding text's metrics. */
export type TextType =
	| 'body'
	| 'large'
	| 'label'
	| 'supporting'
	| 'code'
	| 'display-1'
	| 'display-2'
	| 'display-3'
	| 'inherit'

/** Named size override for `TextType`-bearing components (Astryx scale). */
export type TextSize =
	| '4xs'
	| '3xs'
	| '2xs'
	| 'xsm'
	| 'sm'
	| 'base'
	| 'lg'
	| 'xl'
	| '2xl'
	| '3xl'
	| '4xl'

/** Semantic text colors shared by Timestamp/Timer (Astryx `color` axis). */
export type TextColor = 'primary' | 'secondary' | 'disabled' | 'placeholder' | 'accent' | 'inherit'

/** Font weight axis shared by Timestamp/Timer. */
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'

/** Blockquote — styled quotation with optional `cite` attribution. */
export interface BlockquoteProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	/** Attribution rendered after the quoted content (`<cite>` on web). */
	cite?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Text color for `Code`, mirroring the primary/secondary/inherit subset. */
export type CodeColor = 'primary' | 'secondary' | 'inherit'

/** Font size for `Code` — `'inherit'` adopts the surrounding text metrics. */
export type CodeSize = 'inherit'

/** Code — inline monospace run. Standalone renders a mono chip; nested
 *  inside `Text`/`RichText` it stays an inline run on every target. */
export interface CodeProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	/** @default 'primary' */
	color?: CodeColor
	/** `'inherit'` adopts the surrounding text's font-size and line-height. */
	size?: CodeSize
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** One syntax token. start/end are UTF-16 code-unit offsets relative to
 * its line; start is inclusive and end is exclusive. */
export interface SyntaxToken {
	type: import('./code-tokenizer').SyntaxTokenType
	start: number
	end: number
}

/** Per-line token structure returned by `tokenize`/`tokenizeAsync`. */
export type TokenLine = SyntaxToken[]

/** A custom token with inclusive start/exclusive end UTF-16 offsets in the
 * complete source (including newlines), rather than offsets in one line. */
export interface CodeToken {
	type: import('./code-tokenizer').SyntaxTokenType
	start: number
	end: number
}

/** Custom tokenizer contract for CodeBlock: absolute source offsets. */
export type CodeTokenizer = (code: string, language: string) => CodeToken[]

/** Portable syntax-theme override for one CodeBlock. Token keys are the
 *  `--color-syntax-*` suffixes (keyword, string, comment, number, function,
 *  type, variable, operator, constant, tag, attribute, property, punctuation,
 *  background). Values are color strings or `[light, dark]` tuples resolved
 *  against the active color scheme. On web the map is applied as CSS custom
 *  properties; on native it recolors the emitted text runs directly (native
 *  spans don't resolve CSS vars). */
export interface SyntaxThemeOverride {
	name?: string
	tokens: Record<string, string | [light: string, dark: string]>
}

/** CodeBlock — read-only syntax-highlighted code display. */
export interface CodeBlockProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** The source code to display. */
	code: string
	/** Language identifier (e.g. 'typescript', 'python'). @default 'plaintext' */
	language?: string
	/** Optional title rendered in the header row. */
	title?: string
	/** Show the language label in the header. @default true */
	hasLanguageLabel?: boolean
	/** Show a per-line number gutter. @default false */
	hasLineNumbers?: boolean
	/** 1-based line numbers to highlight. */
	highlightLines?: number[]
	/** Show the copy button. @default true */
	hasCopyButton?: boolean
	/** Fires after a successful clipboard write. */
	onCopy?: () => void
	/** Wrap long lines instead of horizontal scrolling. @default false */
	isWrapped?: boolean
	/** Cap the code area height (dip/px number or CSS length). Overflow scrolls. */
	maxHeight?: number | string
	/** Allow collapsing the code body behind the header when the block is
	 *  longer than `collapsibleThreshold` lines. @default false */
	isCollapsible?: boolean
	/** Minimum line count for the collapse affordance. @default 10 */
	collapsibleThreshold?: number
	/** @default 'md' */
	size?: 'sm' | 'md'
	/**
	 * Width of the block.
	 * - `'fit-content'` (default): shrinks to the longest line (with a floor).
	 * - `'100%'` or any CSS length fills the parent.
	 * On native the block always fills its parent width; 'fit-content'
	 * resolves to the parent's width.
	 */
	width?: string
	/** 'card' (bordered panel, default) or 'section' (transparent, no chrome). */
	container?: 'card' | 'section'
	/** Custom tokenizer returning flat absolute-offset tokens. */
	tokenizer?: CodeTokenizer
	/**
	 * Syntax-color strategy. 'ranges' uses the CSS Custom Highlight API on
	 * web (unsupported engines — and native, always — use styled spans).
	 * @default 'auto'
	 */
	highlightMode?: 'auto' | 'ranges' | 'spans'
	/** Per-instance syntax theme override (see `SyntaxThemeOverride`). */
	syntaxTheme?: SyntaxThemeOverride
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** A fixed target mark drawn on a `ProgressBar` track. */
export interface ProgressBarMark {
	/** Position in the same `0..max` scale as `value`; clamped to the track. */
	value: number
	/** Names the mark — its accessible name and (pointer platforms) tooltip. */
	label: string
}

/** ProgressBar variant names — extendable via module augmentation. */
export interface ProgressBarVariantMap {
	accent: true
	success: true
	warning: true
	neutral: true
	error: true
}

export type ProgressBarVariant = keyof ProgressBarVariantMap

/** ProgressBar — linear determinate or indeterminate progress. `Meter` stays
 *  the ring form; this is the bar. */
export interface ProgressBarProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Current value. Ignored when `isIndeterminate` is true. @default 0 */
	value?: number
	/** @default 100 */
	max?: number
	/** Accessible label (required) — shown above the bar unless `isLabelHidden`. */
	label: string
	/** Visually hide the label; it stays the accessible name. @default false */
	isLabelHidden?: boolean
	/** Show the formatted value beside the label. @default false */
	hasValueLabel?: boolean
	/** @default (value, max) => `${Math.round((value / max) * 100)}%` */
	formatValueLabel?: (value: number, max: number) => string
	/** @default 'accent' */
	variant?: ProgressBarVariant
	/** Animated unknown-progress mode; `value`/`hasValueLabel`/`marks` are
	 *  ignored. @default false */
	isIndeterminate?: boolean
	/** Target marks on the track. Ignored when `isIndeterminate`. */
	marks?: readonly ProgressBarMark[]
	/** Visually disabled (canceled/inactive operations). @default false */
	isDisabled?: boolean
	/** `ref` receives the host element (web) / native view. */
	ref?: Octane.Ref<HostElement>
	accessible?: boolean
	accessibilityLabel?: string
	accessibilityHint?: string
	accessibilityValue?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** StatusDot variant names — extendable via module augmentation. */
export interface StatusDotVariantMap {
	success: true
	warning: true
	error: true
	accent: true
	neutral: true
}

export type StatusDotVariant = keyof StatusDotVariantMap

/** StatusDot — small colored status signal. */
export interface StatusDotProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Semantic color variant (required). */
	variant: StatusDotVariant
	/** Accessible label describing the status (required — it is the dot's
	 *  accessible name). */
	label: string
	/** Pulse to indicate activity; honors reduced-motion. @default false */
	isPulsing?: boolean
	/** Hint text revealed on hover/focus on pointer targets. Never mounts on
	 *  touch targets — keep essential information out of it. */
	tooltip?: string
	/** Optional icon node painted in the dot's ink color (8px field). */
	icon?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Every absolute `Timestamp` display format. */
export type TimestampFormat =
	| 'relative'
	| 'relative_short'
	| 'auto'
	| 'date'
	| 'date_long'
	| 'date_weekday'
	| 'date_time'
	| 'time'
	| 'system_date'
	| 'system_date_time'
	| 'system_time'
	| 'unix_seconds'

/** Formats available to a `Timestamp` tooltip line — every instant-naming
 *  format plus `'full'` ("March 21, 2025 at 2:51:53 PM GMT+1"). */
export type TimestampTooltipFormat =
	| Exclude<TimestampFormat, 'relative' | 'relative_short' | 'auto'>
	| 'full'

/** One line of the `Timestamp` hover card. */
export interface TimestampTooltipEntry {
	/**
	 * IANA time zone identifier, e.g. `'UTC'`, `'America/Los_Angeles'`.
	 * Omit — or pass `'local'` — for the viewer's own zone. Unrecognized
	 * identifiers fall back to the viewer's zone with a console warning.
	 */
	timezoneID?: string
	/** How this line renders the instant. @default 'full' */
	format?: TimestampTooltipFormat
	/** Text shown beside the value, e.g. `'UTC'`. Supplied already translated. */
	label?: string
	/** Show a copy affordance for this row. @default false */
	isCopyable?: boolean
}

/** Timestamp — human-readable instant with relative/absolute formats. */
export interface TimestampProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** The instant to display: Unix seconds (or ms > 1e12) or an ISO 8601 string. */
	value: string | number
	/**
	 * - 'auto': relative for recent times, `date_time` for older (default)
	 * - 'relative': "2 hours ago" / 'relative_short': "2h ago"
	 * - absolute formats: date, date_long, date_weekday, date_time, time,
	 *   system_date, system_date_time, system_time, unix_seconds
	 * @default 'auto'
	 */
	format?: TimestampFormat
	/** Seconds threshold for 'auto' to switch from relative to date_time.
	 *  @default 604800 (7 days) */
	autoThreshold?: number
	/** Show the hover card with the full absolute time on pointer targets.
	 *  Touch targets never mount the card. @default true */
	hasTooltip?: boolean
	/** Custom tooltip rows — one rendered line per entry, in order. An empty
	 *  array is treated as no configuration. */
	tooltipEntries?: readonly TimestampTooltipEntry[]
	/** Append the timezone abbreviation after `date_time`/`time` text.
	 *  system_* formats never carry it. @default false */
	isTimezoneShown?: boolean
	/** Keep relative formats updated live. @default false */
	isLive?: boolean
	/** Semantic text type. @default 'supporting' */
	type?: TextType
	/** Explicit font size override; wins over `type`. */
	size?: TextSize
	/** @default 'secondary' */
	color?: TextColor
	/** Font weight override. */
	weight?: TextWeight
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Timer duration text modes: 'elapsed' = "4m 05s" / 'clock' = "4:05". */
export type TimerFormat = 'elapsed' | 'clock'

/** Timer — live elapsed duration since `startTime` (or mount). */
export interface TimerProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Unix time in milliseconds when the measured operation began. Omit to
	 *  count from this Timer's mount. */
	startTime?: number
	/** @default 'elapsed' */
	format?: TimerFormat
	/** Semantic text type. @default 'supporting' */
	type?: TextType
	/** Explicit font size override; wins over `type`. */
	size?: TextSize
	/** @default 'secondary' */
	color?: TextColor
	/** Font weight override. */
	weight?: TextWeight
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** One cited source for `Citation`. */
export interface CitationSource {
	title?: string
	/** Destination URL. Unsafe schemes (javascript:, vbscript:, data:text/html)
	 *  are blocked — the citation renders inert instead of linking. */
	url?: string
	/** Image URL for a favicon/logo, rendered inside the icon circle. When both
	 *  `src` and a non-string `icon` are provided, `icon` wins. */
	src?: string
	/** Icon node rendered before the label text (label variant). A bare string
	 *  is treated as an image URL (favicon back-compat), not an icon name. */
	icon?: Renderable
}

/** Citation — a superscript number or labelled chip referencing a source. */
export interface CitationProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	source: CitationSource
	number: number
	/** 'label' (icon + title chip, default) or 'number' (accent pill). */
	variant?: 'label' | 'number'
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** How `MetadataList` places each item's label. */
export interface MetadataListLabelConfig {
	/** 'start' = beside the value; 'top' = stacked above it. */
	position: 'start' | 'top'
	/** Custom label column width (dips or CSS length); 'start' only. */
	width?: number | string
}

export type MetadataListColumns = 'multi' | 'single' | number

/** MetadataList — read-only labeled key/value list (definition list). */
export interface MetadataListProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** MetadataListItem children. */
	children?: Renderable
	/** 'single' (default), 'multi' (auto-fill), or a fixed column count. */
	columns?: MetadataListColumns
	/** Label position/width. Defaults to 'top' for multi-column and
	 *  horizontal layouts, 'start' for single-column. */
	label?: MetadataListLabelConfig
	/** Collapse beyond this item count behind a show-more toggle
	 *  (vertical orientation only). */
	maxNumOfItems?: number
	/** 'vertical' (default) or 'horizontal' — items flow in a wrapping row
	 *  with labels stacked above values; `columns`, `label`, and
	 *  `maxNumOfItems` are ignored in horizontal mode. */
	orientation?: 'vertical' | 'horizontal'
	/** Optional title rendered above the list. */
	title?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** One label/value row inside a `MetadataList`. */
export interface MetadataListItemProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	/** Label text for this item. */
	label: string
	/** Icon node rendered before the label text. */
	icon?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Thumbnail — square image preview with loading/error/remove states. */
export interface ThumbnailProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Image source (any `Image` src grammar). Shows the placeholder when
	 *  absent or after a failed load. */
	src?: string
	/** Image description. Omitted = explicitly decorative (hidden from
	 *  assistive tech); pair with `label` to name the thumbnail. */
	alt?: string
	/** Accessible label (e.g. file name). Not rendered visually; pointer
	 *  targets reveal it as a tooltip. */
	label?: string
	/** When set, an overlaid remove button appears (hover/focus, or always on
	 *  touch targets). */
	onRemove?: () => void
	/** When set, the thumbnail acts as a button (opens a detail/lightbox). */
	onPress?: () => void
	/** Loading state: skeleton without `src`, spinner overlay over `src`.
	 *  @default false */
	isLoading?: boolean
	/** @default false */
	isDisabled?: boolean
	/** Remove-button visibility. 'hover' (default) reveals on hover/focus;
	 *  touch targets always show it (same rule upstream uses for coarse
	 *  pointers). 'always' always shows it. */
	showRemoveOn?: 'always' | 'hover'
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** One entry in an `Outline` — a heading link. */
export interface OutlineItem {
	/** Unique id matching the target heading's `id`. */
	id: string
	/** Display text. */
	label: string
	/** Heading depth 1–6; controls indentation. */
	level: number
}

/** Outline — table-of-contents nav with a sliding active indicator. Item
 *  derivation is split by mechanism: `useOutlineFromMarkdown` and
 *  `useOutlineFromDoc` are portable; `useOutlineFromDOM` (live DOM
 *  observation) is web-only under `@octane-xplat/ui/web`; `useOutlineFromView`
 *  (view-tree snapshot) ships under `@octane-xplat/ui/nativescript` and
 *  `@octane-xplat/ui/macos`. */
export interface OutlineProps {
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Ordered heading items to render. */
	items: readonly OutlineItem[]
	/** Currently active item id. Providing it switches the outline to
	 *  controlled mode and disables built-in scroll-spy. */
	activeId?: string
	/** Called when the active item changes (scroll-spy or activation). */
	onActiveIdChange?: (id: string) => void
	/** Accessible label for the nav landmark. @default 'Table of contents' */
	label?: string
	/** 'default' or 'compact' item density. @default 'default' */
	density?: 'default' | 'compact'
	/** Called when navigation to an item begins, before scrolling. */
	onNavigateStart?: (id: string) => void
	/** Called once per navigation when the scroll settles or the user
	 *  interrupts it — every `onNavigateStart` is balanced. */
	onNavigateEnd?: (id: string) => void
	/** Height of a fixed header overlaying the scroll root: shifts both the
	 *  activation line and the scroll landing. @default 0 */
	offset?: number
	/** Scroll container ref (callback or ref object). Default: the nearest
	 *  scrollable ancestor on web / the nearest enclosing ScrollView on
	 *  native, else the viewport/screen. */
	scrollContainerRef?: { current?: HostElement | null }
	/** Whether activating an item smooth-scrolls to it. Set false to own
	 *  scrolling yourself — activation still updates the active item, the
	 *  URL fragment (web), and the navigate callbacks. @default true */
	hasScrollOnClick?: boolean
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

// ---------- markdown ----------

/** One inline run inside a Markdown paragraph/heading/list/quote — the
 *  serialized shape `xplat routes` bakes for `.md` routes and the runtime
 *  `text` parser emits. */
export type MdInline =
	| { t: 'text'; text: string }
	| { t: 'code'; text: string }
	| { t: 'bold'; children: MdInline[] }
	| { t: 'em'; children: MdInline[] }
	| { t: 'link'; text: string; href: string }

/** One block in a Markdown doc. `MdNode` covers what the renderer lowers to
 *  shared primitives; `MdInline` covers text runs inside paragraphs, lists,
 *  and quotes. */
export type MdNode =
	| { t: 'h'; depth: 1 | 2 | 3 | 4 | 5 | 6; children: MdInline[] }
	| { t: 'p'; children: MdInline[] }
	| { t: 'code'; lang?: string; text: string }
	| { t: 'list'; ordered: boolean; items: MdInline[][] }
	| { t: 'quote'; children: MdInline[] }
	| { t: 'hr' }

export interface MdDoc {
	kind: 'octane-xplat/md'
	v: 1
	children: MdNode[]
}

/** `Markdown` with a pre-parsed document — the `MdDoc` AST baked by route
 *  codegen (`routes.gen.data` for a `.md` route). No parser ships in the
 *  bundle for this source, so `isStreaming`/`fadeIn` do not apply. */
export interface MarkdownDataProps {
	data: MdDoc
	text?: never
	isStreaming?: never
	fadeIn?: never
}

/** `Markdown` with raw source parsed at runtime by the package's built-in
 *  subset parser (see docs/content-display.md for the grammar). */
export interface MarkdownTextProps {
	text: string
	data?: never
	/** `text` is a cumulative streaming snapshot that grows in chunks — often
	 *  mid-token with unclosed constructs. Completed blocks parse once and
	 *  are kept mounted; incomplete trailing constructs (an unclosed fence,
	 *  a half-typed `[link](`, a bare `- ` marker) are withheld until they
	 *  close rather than flashing raw markup. @default false */
	isStreaming?: boolean
	/** Fade in newly arrived text while streaming. The fade animates on web
	 *  (suppressed under `prefers-reduced-motion`); native renders new text
	 *  settled. @default true */
	fadeIn?: boolean
}

/** `Markdown` — renders a Markdown doc with the shared vocabulary. Exactly
 *  one source: `data` (a baked `MdDoc` AST) or `text` (raw source parsed at
 *  runtime). */
export type MarkdownProps = MarkdownDataProps | MarkdownTextProps

/** `MarkdownScreen` — the route screen codegen mounts for `.md` route
 *  files; `data` is the route's baked doc (like any route loader result)
 *  and `error` a load failure surfaced to the screen. */
export interface MarkdownScreenProps {
	data?: MdDoc
	error?: unknown
}

// ---------- Astryx parity: layout containers ----------

/** `Center` — flex centering on the main axis (`horizontal` → justify),
 *  cross axis (`vertical` → align-items), or `both` (default). `isInline`
 *  renders `inline-flex` on web; native containers are always block-level,
 *  so it is inert there. */
export type CenterAxis = 'both' | 'horizontal' | 'vertical'

export interface CenterProps extends StackPaddingProps, StackSizeProps, AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	ref?: Octane.Ref<HostElement>
	/** @default 'both' */
	axis?: CenterAxis
	isInline?: boolean
}

/** `Section` — a banded container with a surface/transparent/muted
 *  background, spacing-scale padding, and optional edge dividers. */
export type SectionVariant = 'section' | 'transparent' | 'muted'
export type SectionDividerSide = 'top' | 'bottom' | 'start' | 'end'

export interface SectionProps extends StackPaddingProps, StackSizeProps, AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	ref?: Octane.Ref<HostElement>
	/** @default 'section' */
	variant?: SectionVariant
	/** 'start'/'end' are logical edges — on native they map to left/right. */
	dividers?: SectionDividerSide[]
	/** @default 4 (16px) */
	padding?: SpacingStep
}

/** `VisuallyHidden` — children stay in the accessibility tree but render
 *  invisible. No className/style: styling a hidden node is a mistake. On
 *  native there is no offscreen-a11y primitive; the leaf renders a 1dip,
 *  opacity-0 container (screen-reader exposure is best-effort). */
export interface VisuallyHiddenProps extends AccessibilityProps {
	children?: Renderable
	id?: string
	ref?: Octane.Ref<HostElement>
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	/** Web element tag — 'span' (default) for inline labels, 'div' for block
	 *  content / live regions. Native ignores it. */
	as?: ElementType
}

/** Per-target support for `FocusScope`'s behavior flags, read through
 *  `getFocusScopeCapabilities()`. Web honors all three; native and macOS
 *  leaves render an accessible container only, so every flag is false —
 *  check the capability before relying on containment. */
export interface FocusScopeCapabilities {
	/** Tab/Shift+Tab containment inside the subtree. */
	contain: boolean
	/** Focus the first tab stop (or the scope box when empty) on mount. */
	autoFocus: boolean
	/** On unmount, refocus the element that held focus at mount. */
	restoreFocus: boolean
}

/** `FocusScope` — keyboard focus containment, React Aria's FocusScope. The
 *  web leaf traps Tab inside the subtree (`contain`), can focus the first
 *  tab stop on mount (`autoFocus`), and returns focus to the previously
 *  focused element on unmount (`restoreFocus`). Focus containment is a web
 *  keyboard convention; the native leaf renders a plain accessible
 *  container and the three behavior flags are inert —
 *  `getFocusScopeCapabilities()` reports which flags the target honors. */
export interface FocusScopeProps extends AccessibilityProps {
	children?: Renderable
	id?: string
	ref?: Octane.Ref<HostElement>
	className?: ClassName
	style?: StyleProp
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	/** Trap Tab/Shift+Tab inside the scope and pull outside focus back in. */
	contain?: boolean
	/** On unmount, focus the element that held focus when the scope mounted. */
	restoreFocus?: boolean
	/** On mount, focus the first tab stop (or the scope box when empty). */
	autoFocus?: boolean
}

/** `AspectRatio` — sizes its box from width / `ratio`. Web uses the CSS
 *  `aspect-ratio` property; native measures the laid-out width and derives
 *  the height (one layout pass). `shape="ellipse"` clips to an ellipse;
 *  `fit` controls how the child fills the box (`contain` letterboxing is a
 *  media-level concern — on native `fit="contain"`/`"center"` center the
 *  child without cropping hints). */
export type AspectRatioShape = 'rectangle' | 'ellipse'
export type AspectRatioFit = 'cover' | 'contain' | 'center'

export interface AspectRatioProps extends AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	ref?: Octane.Ref<HostElement>
	/** width / height — e.g. 16/9 ≈ 1.777. Required. */
	ratio: number
	/** @default 'rectangle' */
	shape?: AspectRatioShape
	fit?: AspectRatioFit
}

// ---------- Astryx parity: forms ----------

export type FormLayoutDirection = 'vertical' | 'horizontal' | 'horizontal-labels'

/** Which state a form treats as its default — only the *exception* carries
 *  a visible optional/required indicator. `useFieldControlProps` also
 *  resolves `aria-required` from this so the unmarked majority still
 *  announces correctly. */
export type FormOptionality = 'optional' | 'required'

/** `FormLayout` — arranges `Field`/`FormField`-wrapped controls with
 *  consistent spacing. Renders a neutral container (form submission is a
 *  separate concern; there is no <form> element contract on native).
 *  'horizontal' gives equal-width columns on web and a `*`-column grid on
 *  native; 'horizontal-labels' puts each field's label left of its control
 *  (a per-field row on native — the web grid's shared label column and
 *  480px collapse have no native analog). */
export interface FormLayoutProps extends AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	ref?: Octane.Ref<HostElement>
	/** @default 'vertical' */
	direction?: FormLayoutDirection
	defaultOptionality?: FormOptionality
}

export type InputGroupSize = 'sm' | 'md' | 'lg'

/** `InputGroup` — a labeled group joining an input with prefix/suffix
 *  addons into one visually connected control. Renders a `Field` around a
 *  `role="group"` row (web) / grouped row (native). Member inputs pick up
 *  group styling through `useInputGroup()`. */
export interface InputGroupProps extends FieldControlProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	ref?: Octane.Ref<HostElement>
	/** Group label — required for accessibility. */
	label: string
	/** Tooltip text shown via an info affordance at the end of the label. */
	labelTooltip?: string
	size?: InputGroupSize
}

/** `InputGroupText` — a prefix/suffix text or icon segment inside
 *  `InputGroup` ('$', 'https://', units). */
export interface InputGroupTextProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	ref?: Octane.Ref<HostElement>
}

// ---------- Astryx parity: content lists ----------

export type ListDensity = 'compact' | 'balanced' | 'spacious'
/** Marker style — 'decimal' renders an ordered list (`<ol>` on web) with
 *  numbered markers, 'disc'/'circle' render bullet markers, 'none' none. */
export type ListMarkerStyle = 'none' | 'disc' | 'circle' | 'decimal'
export type ListStyle = ListMarkerStyle

/** `List` — a vertical content list (NOT a virtualized data list — that's
 *  `VirtualList`). Children are `ListItem`s. Renders semantic `ul`/`ol` on
 *  web; a column container on native (NativeScript has no list role —
 *  marker/divider visuals are drawn by the leaf instead). */
export interface ListProps extends AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	ref?: Octane.Ref<HostElement>
	/** @default 'balanced' */
	density?: ListDensity
	hasDividers?: boolean
	/** Compensates for each item's inline inset up to the container padding
	 *  on each edge (aligns rows with sibling headings). Reads the
	 *  `--vx-item-inset-inline` / `--vx-container-padding-*` custom
	 *  properties; inert where no container padding is declared. Web only. */
	edgeCompensation?: 'inline'
	/** Header content rendered above the list (aria-labelledby on web). */
	header?: Renderable
	/** @default 'none' */
	listStyle?: ListMarkerStyle
	/** Starting number for 'decimal' lists. @default 1 */
	start?: number
	'data-testid'?: string
}

/** `ListItem` — one row inside `List`: optional marker + startContent +
 *  label/description + endContent. `onPress`/`href` make the row
 *  interactive (invisible button/anchor on web, tap handling on native).
 *  `delegateRef` points at a nested control that owns keyboard access and
 *  the action — the row forwards surface presses to it and adds no second
 *  stop (upstream `interactiveRef`). */
export interface ListItemProps extends AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	ref?: Octane.Ref<HostElement>
	/** Primary text (string truncates to one line) or rich content. */
	label: Renderable
	description?: Renderable
	startContent?: Renderable
	endContent?: Renderable
	onPress?: () => void
	/** Extra app content rendered inside the row's label area. */
	delegateRef?: { current: HostElement | null }
	/** Link target: web renders a real anchor; native navigates via the
	 *  registered deep-link table, falling back to opening the URL. */
	href?: string
	target?: '_blank' | '_self' | string
	rel?: string
	isDisabled?: boolean
	isSelected?: boolean
}

/** `GridList` — interactive 2D cell collection, React Aria's GridList.
 *  Not virtualized (that's `VirtualList`, which stays 1D): items render
 *  eagerly into a CSS grid on web (`role="grid"` > `role="row"` >
 *  `role="gridcell"`, roving tabindex, arrows move by measured column
 *  count) and a wrapping flexboxlayout of Pressable cells on native.
 *  Selection mirrors RA: `selectionMode` gates it, `selectedKeys` is the
 *  controlled form (`'all' | Iterable<Key>`), `onAction` fires on
 *  activation whether or not selection is enabled. */
export interface GridListProps<T = unknown> extends LayoutChildProps, AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
	ref?: Octane.Ref<HostElement>
	items: readonly T[]
	/** Returns each item's stable `Key`; must be unique and survive reorder.
	 *  Defaults to `defaultItemKey` — the item's `id` or `key` property;
	 *  items without either throw instead of guessing a positional key. */
	keyExtractor?: (item: T, index: number) => Key
	renderItem: (item: T, index: number) => Renderable
	/** Content rendered when `items` is empty (RA `renderEmptyState`). */
	renderEmpty?: () => Renderable
	/** 'grid' (default) lays items out by columns; 'stack' is a
	 *  single-column list layout — RA's `layout` prop. */
	layout?: 'grid' | 'stack'
	/** Fixed column count. When unset, web auto-fills columns via CSS grid
	 *  and measures the rendered count for arrow-key navigation; native
	 *  wraps by content width. */
	columns?: number
	selectionMode?: 'none' | 'single' | 'multiple'
	/** 'toggle' (default): click toggles membership, Shift+click extends the
	 *  range. 'replace': click selects only the pressed key. */
	selectionBehavior?: 'toggle' | 'replace'
	/** Controlled selection — `'all'` or the selected key set. */
	selectedKeys?: 'all' | Iterable<Key>
	/** Initial selection for the uncontrolled form. */
	defaultSelectedKeys?: 'all' | Iterable<Key>
	/** Reports the resolved selection — `'all'` or a readonly key set owned
	 *  by the framework; pass it back through `selectedKeys`, never mutate. */
	onSelectionChange?: (keys: Selection) => void
	/** Keys that cannot be selected, focused, or actioned. */
	disabledKeys?: Iterable<Key>
	/** Block deselecting the last selected key. */
	disallowEmptySelection?: boolean
	/** Fires when a row is activated (click/Enter on web, tap on native),
	 *  independent of selection. */
	onAction?: (key: Key) => void
	/** 'arrow' (default): single Tab stop + arrow-key navigation.
	 *  'tab': every row is a Tab stop and arrows are left to content —
	 *  use when cells contain interactive controls. Web only: grid
	 *  keyboard navigation has no native counterpart (reported by
	 *  `useGridList().isSupported`); native keeps tap selection and
	 *  `onAction`. */
	keyboardNavigationBehavior?: 'arrow' | 'tab'
	testID?: string
}

// ---------- Astryx parity: indicators ----------

/** Indicator families fix the state space a visual can draw — single
 *  selection (unchecked/checked) vs multi selection (with indeterminate).
 *  A replacement registered under a name is checked against its family's
 *  state space. */
export interface IndicatorFamilyMap {
	singleSelection: 'unchecked' | 'checked'
	multiSelection: 'unchecked' | 'checked' | 'indeterminate'
}

export type IndicatorFamily = keyof IndicatorFamilyMap & string
export type IndicatorState<F extends IndicatorFamily = IndicatorFamily> = IndicatorFamilyMap[F]
export type IndicatorSize = 'sm' | 'md'
export type IndicatorPosition = 'start' | 'end'

/** Props every indicator accepts. Indicators are decorative — the owning
 *  control keeps role/focus/state; the indicator renders `aria-hidden` on
 *  web and draws the picture for `state`. `children` replaces the state
 *  mark inside the indicator chrome (busy spinners). */
export interface IndicatorProps<F extends IndicatorFamily = IndicatorFamily> {
	className?: ClassName
	style?: StyleProp
	id?: string
	ref?: Octane.Ref<HostElement>
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	state: IndicatorState<F>
	/** @default 'md' */
	size?: IndicatorSize
	isDisabled?: boolean
	children?: Renderable
}

export type IndicatorComponent<F extends IndicatorFamily = IndicatorFamily> = (
	props: IndicatorProps<F>,
) => Renderable

/** The named indicators an app can replace, mapped to their family. */
export interface IndicatorMap {
	/** The mark on a chosen option — a checkmark by default. */
	check: 'singleSelection'
	/** The filled circle of a radio control. */
	radio: 'singleSelection'
	/** The box of a checkbox control, including its partial state. */
	checkbox: 'multiSelection'
}

export type IndicatorName = keyof IndicatorMap & string
export type IndicatorNameOfFamily<F extends IndicatorFamily> = {
	[N in IndicatorName]: IndicatorMap[N] extends F ? N : never
}[IndicatorName]

/** App-provided indicator overrides, keyed by indicator name — the
 *  `indicators` half of Astryx's theme replace seam, registered through
 *  `registerIndicators`. */
export type IndicatorRegistry = {
	[N in IndicatorName]?: IndicatorComponent<IndicatorMap[N]>
}
