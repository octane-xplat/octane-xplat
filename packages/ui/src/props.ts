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
export interface StackProps extends StackPaddingProps, StackSizeProps, AccessibilityProps {
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
	/** `ref` is runtime-reserved on component elements — leaves expose
	 *  `bind` to reach the native/DOM node. */
	bind?: (el: any) => void
	/** @default 'vertical' */
	direction?: StackDirection
	hAlign?: StackAlignment
	vAlign?: StackAlignment
	justify?: StackMainAlignment
	align?: StackCrossAlignment
	gap?: SpacingStep
	wrap?: StackWrap
	isScrollable?: boolean
	as?: any
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
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
	bind?: (el: any) => void
	/** Cross-axis self alignment, overriding the stack's cross alignment. */
	crossAlignSelf?: StackItemCrossAlignSelf
	/** @default 'static' */
	size?: StackItemSize
	/** overflow:auto on web; wraps in a ScrollView on native. */
	isScrollable?: boolean
	as?: any
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
		/** Toggle-button pressed state — `aria-pressed` on web; reported as
		 *  checked/unchecked where the platform a11y model has no pressed. */
		pressed?: boolean
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
		/** Toggle-button pressed state — `aria-pressed` on web; reported as
		 *  checked/unchecked where the platform a11y model has no pressed. */
		pressed?: boolean
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
		/** Toggle-button pressed state — `aria-pressed` on web; reported as
		 *  checked/unchecked where the platform a11y model has no pressed. */
		pressed?: boolean
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

// ---------- date / time / file entry (Astryx parity) ----------

/** ISO 8601 calendar date `YYYY-MM-DD`. Date/time inputs and Calendar carry
 *  ISO strings — never `Date` — so values serialize losslessly and ignore
 *  zones. `Date` appears only in `dateConstraints` callbacks and Calendar's
 *  single-mode `onChange` second argument. */
export type ISODateString = `${number}${number}${number}${number}-${number}${number}-${number}${number}`

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

/** Imperative calendar navigation — obtained via `bind`. */
export interface CalendarHandle {
	navigateTo(date: ISODateString): void
}

interface CalendarBaseProps {
	className?: any
	style?: any
	id?: string
	/** Receives `{ navigateTo }` for imperative month navigation. */
	bind?: (h: CalendarHandle) => void
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
	ios?: any
	android?: any
	web?: any
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
 *  grid navigation is web/macOS; native cells announce through
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
export type FileInputStatus = FieldStatus
export type FileInputStatusType = FieldStatusType

/** Typed date entry + calendar. The default `presentation` is
 *  `adaptive-native`: fine pointers get the typed field + calendar popover,
 *  coarse pointers the platform picker (web) or the self-drawn sheet
 *  (native). */
export interface DateInputProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
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
	bind?: (h: TextInputHandle) => void
	/** Calendar popover pane count. Ignored by the `native` surface.
	 *  @default 1 */
	numberOfMonths?: 1 | 2
	weekStartsOn?: DayOfWeek | DayOfWeekName
	ios?: any
	android?: any
	web?: any
}

export interface TimeInputProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
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
	bind?: (h: TextInputHandle) => void
	ios?: any
	android?: any
	web?: any
}

/** Date and time under one label — a date segment and a time segment whose
 *  commits combine into the ISODateTimeString value. */
export interface DateTimeInputProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
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
	bind?: (h: TextInputHandle) => void
	/** Calendar pane count on the popover/sheet surface. @default 1 */
	numberOfMonths?: 1 | 2
	weekStartsOn?: DayOfWeek | DayOfWeekName
	ios?: any
	android?: any
	web?: any
}

/** Trigger + range calendar. Always controlled: `value` is the committed
 *  range or null, `onChange` reports commits and clears. */
export interface DateRangeInputProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	value: DateRange | null
	onChange: (value: DateRange | null) => void
	changeAction?: (value: DateRange | null) => void | Promise<void>
	min?: ISODateString
	max?: ISODateString
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>
	maxRangeSpan?: number
	minRangeSpan?: number
	/** Quick ranges beside the calendar. */
	presets?: ReadonlyArray<DateRangePreset>
	/** @default true */
	hasClear?: boolean
	placeholder?: string
	/** @default 2 */
	numberOfMonths?: 1 | 2
	weekStartsOn?: DayOfWeek | DayOfWeekName
	bind?: (h: TextInputHandle) => void
	ios?: any
	android?: any
	web?: any
}

/** A picked file, portable shape. `uri` is an opaque reference — a
 *  blob/object URL on web, a filesystem path or `content://` URI on native
 *  (`@octane-xplat/files` `FileRef`-compatible: `{name, uri}` is assignable
 *  to it). Browser `File` objects don't exist on native targets, so the
 *  shared contract carries this reference instead; on web `file` also holds
 *  the picked `File` for FormData/upload use. Read via `fetch(uri)` on web
 *  or the platform file service on native. */
export interface FileInputFile {
	name: string
	uri: string
	/** Bytes when known (native pickers may not report one). */
	size?: number
	/** MIME type when known (native pickers may not report one). */
	mimeType?: string
	/** Web only: the browser `File` behind `uri`. */
	file?: any
}

/** Native picker seam: `FileInput` calls the registered picker or per-instance
 *  `pick` prop. Adapt `@octane-xplat/files` with
 *  `registerFilePicker(({ accept }) => files.pick(accept))`; that service's
 *  `pick` selects one file, so multi-file apps provide a picker returning an
 *  array. Web always uses the browser file dialog (and dropzone drag/drop). */
export type FileInputPick = (options: {
	accept?: string
	multiple?: boolean
}) => Promise<FileInputFile[] | FileInputFile | null>

export interface FileInputHandle {
	open(): void
	native: any
}

export interface FileInputProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	/** `input` is a compact field row; `dropzone` a larger target that
	 *  accepts drag/drop on pointer platforms. @default 'input' */
	mode?: 'input' | 'dropzone'
	value: FileInputFile | FileInputFile[] | null
	onChange: (value: FileInputFile | FileInputFile[] | null) => void
	changeAction?: (value: FileInputFile | FileInputFile[] | null) => void | Promise<void>
	/** `accept`-style filter: `.ext`, `type/subtype`, wildcard subtype, any. */
	accept?: string
	/** When true, `value` and `onChange` use file arrays. */
	isMultiple?: boolean
	/** Max bytes per file; skipped for refs without a `size`. */
	maxSize?: number
	maxFiles?: number
	placeholder?: string
	/** Per-instance override of the registered native picker. */
	pick?: FileInputPick
	bind?: (h: FileInputHandle) => void
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

/** Props for platform-authentic list widgets (`UITableView`/`RecyclerView`).
 *  Shared content `List` has its own `ListProps` below. */
export interface PlatformListProps extends RefreshProps {
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

/** Along-axis alignment of the panel against the anchor. 'start' aligns the
 *  panel start with the anchor start (the previous fixed behavior). */
export type PopoverAlignment = 'start' | 'center' | 'end'

/** A platform-neutral ref to the host view or element that owns a popover. */
export interface PopoverAnchorRef {
	readonly current: unknown
}

export interface PopoverProps {
	/** Ref to a native view or web element, commonly populated by `bind`. */
	anchor: PopoverAnchorRef
	open?: boolean
	placement?: PopoverPlacement
	/** Align the panel along the placement axis. @default 'start' */
	alignment?: PopoverAlignment
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

/** Shared resting-elevation scale for floating surfaces. */
export type Elevation = 'none' | 'low' | 'med' | 'high'

/** Button visual variants; apps add more through `.vx-button--variant-{name}`
 *  class hooks (the upstream catalog is open the same way). */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | (string & {})

/** Button composes Pressable — same-props/same-pixels, self-drawn. `loading`
 *  shows the spinner and blocks presses. Also accepts the Astryx vocabulary
 *  (`label`, `variant`, `size`, `isDisabled`, `isLoading`, `icon`,
 *  `isIconOnly`, `endContent`, `elevation`, `tooltip`, `href`, `clickAction`,
 *  `isInterruptible`); the legacy `disabled`/`loading`/`leading`/`trailing`
 *  names keep working and the Astryx names win when both are set. */
export interface ButtonProps extends PressableProps {
	loading?: boolean
	/** Content rendered before children (e.g. an Icon). */
	leading?: any
	/** Content rendered after children. */
	trailing?: any
	/** Visible label text; `children` takes precedence when both are set. */
	label?: string
	/** Visual variant. @default 'secondary' */
	variant?: ButtonVariant
	/** @default 'md' */
	size?: FieldControlSize
	/** Disabled state (merges with `disabled`). */
	isDisabled?: boolean
	/** Loading state (merges with `loading`). */
	isLoading?: boolean
	/** Keep the button interactive while a `clickAction` is pending. */
	isInterruptible?: boolean
	/** Action run on press; pending promises show the loading spinner unless
	 *  `isInterruptible` keeps presses live. */
	clickAction?: () => void | Promise<void>
	/** Leading icon — a node (e.g. `<Icon />`) or a registered icon name. */
	icon?: any
	/** Square icon-only button; `label` becomes the accessible name. */
	isIconOnly?: boolean
	/** Trailing content slot (merges with `trailing`). */
	endContent?: any
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
	/** Partial-selection state (parent-of-a-tree semantics). Renders the
	 *  indicator's `indeterminate` mark and `aria-checked="mixed"` on web. */
	indeterminate?: boolean
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
	/** Accessible name for the trigger when it carries no visible text. */
	accessibilityLabel?: string
	/** Class merged onto the trigger Pressable (e.g. `vx-button` chrome for an
	 *  icon-only overflow trigger). */
	triggerClassName?: any
	/** Class merged onto the anchored menu panel (the Popover surface). */
	menuClassName?: any
	items: MenuItem[]
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	placement?: PopoverPlacement
	/** Panel alignment along the placement axis. @default 'start' */
	alignment?: PopoverAlignment
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

/** Shared settings/navigation row, exported as `Item`. Use the four
 *  shorthand props for common rows, or `Item.Leading`/`Content`/
 *  `Supporting`/`Trailing` children when the row needs custom composition.
 *  This is the pre-parity settings row; the Astryx `Item` contract
 *  (label/description/startContent/endContent) is a separate family's
 *  migration — `ListItem` inside `List` carries its own row layout. */
export interface ItemProps extends AccessibilityProps {
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

export interface ItemSlotProps {
	className?: any
	children?: any
}

export interface ItemComponent {
	(props: ItemProps): unknown
	Leading: (props: ItemSlotProps) => unknown
	Content: (props: ItemSlotProps) => unknown
	Supporting: (props: ItemSlotProps) => unknown
	Trailing: (props: ItemSlotProps) => unknown
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

/** Card — container with optional header/footer slots, padding scale, and
 *  background variants. `variant` names map to `vx-card--{name}` class hooks:
 *  'default' (bordered), 'muted', 'transparent', and the tint set
 *  (blue/cyan/gray/green/orange/pink/purple/red/teal/yellow) ship in
 *  chrome.css; custom variant names still produce a class an app can skin. */
export interface CardProps {
	className?: any
	style?: any
	id?: string
	header?: any
	footer?: any
	children?: any
	/** Internal padding in 4px spacing steps. @default 4 */
	padding?: number
	variant?: string
	elevation?: Elevation
	width?: number | string
	height?: number | string
	maxWidth?: number | string
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

// ---------- actions & interactive cards (Astryx parity) ----------

/** Icon-only button — `label` is the accessible name and doubles as the
 *  hover/focus tooltip on pointer targets. `icon` is required: a node or a
 *  registered icon name. */
export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'endContent' | 'isIconOnly' | 'label'> {
	icon: any
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
	className?: any
	style?: any
	id?: string
	children?: any
	/** Accessible label for the group (role="group" aria-label). */
	label: string
	/** @default 'horizontal' */
	orientation?: ButtonGroupOrientation
	/** Default size for group members. @default 'md' */
	size?: FieldControlSize
	/** Resting elevation for the shared surface. @default 'none' */
	elevation?: Elevation
	isDisabled?: boolean
	ios?: any
	android?: any
	web?: any
}

/** Toggle button — pressed state with `isPressed`/`onPressedChange`, an
 *  optional `pressedChangeAction` run through Button's action transition, and
 *  `pressedIcon` for outline→filled swaps. Inside a ToggleButtonGroup the
 *  group owns pressed state via `value`. */
export interface ToggleButtonProps extends Omit<ButtonProps, 'label' | 'variant'> {
	label: string
	isPressed?: boolean
	/** Called with the next pressed state when the button is activated. */
	onPressedChange?: (isPressed: boolean) => void
	/** Action-backed toggle — runs while the pending spinner shows, with an
	 *  optimistic press flip. Ignored when `value` binds group membership. */
	pressedChangeAction?: (isPressed: boolean) => void | Promise<void>
	/** Icon shown while pressed (e.g. filled variant); falls back to `icon`. */
	pressedIcon?: any
	/** Member key inside a ToggleButtonGroup. */
	value?: string
}

interface ToggleButtonGroupBaseProps {
	className?: any
	style?: any
	id?: string
	children?: any
	/** Accessible label for the group (role="group" aria-label). */
	label: string
	orientation?: ButtonGroupOrientation
	size?: FieldControlSize
	isDisabled?: boolean
	ios?: any
	android?: any
	web?: any
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
	className?: any
	style?: any
	id?: string
	/** Accessible name for the card's action. */
	label: string
	onPress?: () => void
	href?: string
	target?: string
	isDisabled?: boolean
	children?: any
	/** Internal padding in 4px spacing steps. @default 4 */
	padding?: number
	/** @default 'default' */
	variant?: string
	/** @default 'none' */
	elevation?: Elevation
	width?: number | string
	height?: number | string
	maxWidth?: number | string
	ios?: any
	android?: any
	web?: any
}

/** Toggle-selection card — same surface contract as ClickableCard with a
 *  checked/selected semantic instead of an action. */
export interface SelectableCardProps {
	className?: any
	style?: any
	id?: string
	/** Accessible name for the selectable card. */
	label: string
	/** Controlled selection state. */
	isSelected: boolean
	onChange: (isSelected: boolean) => void
	/** Disabled cards stay focusable with a disabled state announced. */
	isDisabled?: boolean
	children?: any
	padding?: number
	variant?: string
	elevation?: Elevation
	width?: number | string
	height?: number | string
	maxWidth?: number | string
	ios?: any
	android?: any
	web?: any
}

export type MoreMenuPlacement = 'above' | 'below' | 'start' | 'end' | 'left' | 'right' | PopoverPlacement
export type MoreMenuAlignment = PopoverAlignment
/** 'popover' anchors the menu to the trigger; 'bottom-sheet' docks it in the
 *  bottom sheet; 'adaptive' resolves to bottom-sheet on coarse-pointer/touch
 *  targets and popover elsewhere. @default 'popover' */
export type MoreMenuPresentation = 'popover' | 'bottom-sheet' | 'adaptive'

/** Overflow menu — icon-only three-dot trigger feeding a DropdownMenu. */
export interface MoreMenuProps {
	className?: any
	style?: any
	id?: string
	items: MenuItem[]
	/** Accessible label for the trigger. @default 'More options' */
	label?: string
	/** Trigger button variant. @default 'ghost' */
	variant?: ButtonVariant
	/** Trigger button size. @default 'md' */
	size?: FieldControlSize
	/** Trigger icon override — node or registered name. @default three dots */
	icon?: any
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
	ios?: any
	android?: any
	web?: any
}

// ---------- PowerSearch (Astryx parity) ----------

// Reuse the shared SearchableItem and SearchSource contracts from Typeahead.

// Operator value kinds — what editor a filter value uses.
export interface EmptyOperatorValue { readonly type: 'empty' }
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
	readonly icon?: any
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
	readonly renderItem?: (item: SearchableItem) => any
}

export interface CustomOperatorValue {
	readonly type: 'custom'
	/** Caller editor component: `{value, onChange, placeholder, isDisabled}`. */
	readonly Editor: any
	/** JSON value → display string for the token. */
	readonly getString: (value: string) => string
}

export interface NestedOperatorValue { readonly type: 'nested' }

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
export interface FilterValueEmpty { readonly type: 'empty' }
export interface FilterValueString { readonly type: 'string'; readonly value: string }
export interface FilterValueStringList { readonly type: 'string_list'; readonly value: ReadonlyArray<string> }
export interface FilterValueInteger { readonly type: 'integer'; readonly value: number }
export interface FilterValueFloat { readonly type: 'float'; readonly value: number }
export interface FilterValueTime { readonly type: 'time'; readonly value: string }
export interface FilterValueDateAbsolute { readonly type: 'date_absolute'; readonly unixSeconds: number }
export interface FilterValueDateRelative { readonly type: 'date_relative'; readonly value: string }
export interface FilterValueDateRange { readonly type: 'date_range'; readonly value: DateTimeRange }
export interface FilterValueEnum { readonly type: 'enum'; readonly value: string }
export interface FilterValueEnumList { readonly type: 'enum_list'; readonly value: ReadonlyArray<string> }
export interface PowerSearchEntity {
	readonly id: string
	readonly label: string
	readonly photo?: string
}

export interface FilterValueEntityList { readonly type: 'entity_list'; readonly value: ReadonlyArray<PowerSearchEntity> }
export interface FilterValueCustom { readonly type: 'custom'; readonly value: string }
export interface FilterValueNested { readonly type: 'nested'; readonly value: ReadonlyArray<PowerSearchFilter> }

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
	readonly icon?: any
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

export interface PowerSearchComponentOverride {
	readonly Token?: any
	readonly Editor?: any
}

export type PowerSearchComponents = Partial<Record<OperatorValue['type'], PowerSearchComponentOverride>>

/** Structured filter bar — pick a field, then operator and value in the
 *  editor popover; committed filters render as removable, editable tokens. */
export interface PowerSearchProps extends FieldControlProps {
	className?: any
	style?: any
	id?: string
	/** Status layout: overlaps the field below it or occupies its own row. */
	statusVariant?: 'attached' | 'detached'
	/** Field/operator configuration. */
	config: PowerSearchConfig
	/** Active filters (controlled). */
	filters: ReadonlyArray<PowerSearchFilter>
	/** Fires on add/edit/remove with the change type and filter index. */
	onChange: (
		filters: ReadonlyArray<PowerSearchFilter>,
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
	startIcon?: any
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
	endContent?: any
	/** Match count shown at the end of the bar and announced politely. */
	resultCount?: number | string
	/** Callback adaptation of Astryx's imperative handle ref. */
	handleRef?: (handle: PowerSearchHandle) => void
	onFocus?: () => void
	onBlur?: () => void
	/** Per-operator-value-type Token/Editor component overrides. */
	components?: PowerSearchComponents
	ios?: any
	android?: any
	web?: any
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
export type TextColor =
	| 'primary'
	| 'secondary'
	| 'disabled'
	| 'placeholder'
	| 'accent'
	| 'inherit'

/** Font weight axis shared by Timestamp/Timer. */
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'

/** Blockquote — styled quotation with optional `cite` attribution. */
export interface BlockquoteProps {
	className?: any
	style?: any
	id?: string
	children?: any
	/** Attribution rendered after the quoted content (`<cite>` on web). */
	cite?: any
	/** Platform-specific properties are applied after shared props. */
	ios?: any
	android?: any
	web?: any
}

/** Text color for `Code`, mirroring the primary/secondary/inherit subset. */
export type CodeColor = 'primary' | 'secondary' | 'inherit'

/** Font size for `Code` — `'inherit'` adopts the surrounding text metrics. */
export type CodeSize = 'inherit'

/** Code — inline monospace run. Standalone renders a mono chip; nested
 *  inside `Text`/`RichText` it stays an inline run on every target. */
export interface CodeProps {
	className?: any
	style?: any
	id?: string
	children?: any
	/** @default 'primary' */
	color?: CodeColor
	/** `'inherit'` adopts the surrounding text's font-size and line-height. */
	size?: CodeSize
	ios?: any
	android?: any
	web?: any
}

/** One syntax token with line-relative offsets (0 = start of line). */
export interface SyntaxToken {
	type: string
	start: number
	end: number
}

/** Per-line token structure returned by `tokenize`/`tokenizeAsync`. */
export type TokenLine = SyntaxToken[]

/** Custom tokenizer contract for `CodeBlock.tokenizer` — absolute offsets in,
 *  split per line internally (legacy flat form, converted by
 *  `flatTokensToLines`). */
export type CodeTokenizer = (
	code: string,
	language: string,
) => { type: string; start: number; end: number }[]

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
	className?: any
	style?: any
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
	ios?: any
	android?: any
	web?: any
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
	className?: any
	style?: any
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
	/** `bind` receives the host element (web) / native view. */
	bind?: (el: any) => void
	accessible?: boolean
	accessibilityLabel?: string
	accessibilityHint?: string
	accessibilityValue?: string
	ios?: any
	android?: any
	web?: any
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
	className?: any
	style?: any
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
	icon?: any
	ios?: any
	android?: any
	web?: any
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
	className?: any
	style?: any
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
	ios?: any
	android?: any
	web?: any
}

/** Timer duration text modes: 'elapsed' = "4m 05s" / 'clock' = "4:05". */
export type TimerFormat = 'elapsed' | 'clock'

/** Timer — live elapsed duration since `startTime` (or mount). */
export interface TimerProps {
	className?: any
	style?: any
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
	ios?: any
	android?: any
	web?: any
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
	icon?: any
}

/** Citation — a superscript number or labelled chip referencing a source. */
export interface CitationProps {
	className?: any
	style?: any
	id?: string
	source: CitationSource
	number: number
	/** 'label' (icon + title chip, default) or 'number' (accent pill). */
	variant?: 'label' | 'number'
	ios?: any
	android?: any
	web?: any
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
	className?: any
	style?: any
	id?: string
	/** MetadataListItem children. */
	children?: any
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
	title?: any
	ios?: any
	android?: any
	web?: any
}

/** One label/value row inside a `MetadataList`. */
export interface MetadataListItemProps {
	className?: any
	style?: any
	id?: string
	children?: any
	/** Label text for this item. */
	label: string
	/** Icon node rendered before the label text. */
	icon?: any
	ios?: any
	android?: any
	web?: any
}

/** Thumbnail — square image preview with loading/error/remove states. */
export interface ThumbnailProps {
	className?: any
	style?: any
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
	ios?: any
	android?: any
	web?: any
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

/** Options for `useOutlineFromDOM`. `root` accepts a web ParentNode at runtime;
 *  it is `unknown` in the shared contract because NativeScript uses a view ref. */
export interface OutlineFromDOMOptions {
	selector?: string
	root?: unknown
}

/** Outline — table-of-contents nav with a sliding active indicator. */
export interface OutlineProps {
	className?: any
	style?: any
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
	/** Scroll container ref (`bind`/`ref` object). Default: the nearest
	 *  scrollable ancestor on web / the nearest enclosing ScrollView on
	 *  native, else the viewport/screen. */
	scrollContainerRef?: { current?: any }
	/** Whether activating an item smooth-scrolls to it. Set false to own
	 *  scrolling yourself — activation still updates the active item, the
	 *  URL fragment (web), and the navigate callbacks. @default true */
	hasScrollOnClick?: boolean
	ios?: any
	android?: any
	web?: any
}

// ---------- Astryx parity: layout containers ----------

/** `Center` — flex centering on the main axis (`horizontal` → justify),
 *  cross axis (`vertical` → align-items), or `both` (default). `isInline`
 *  renders `inline-flex` on web; native containers are always block-level,
 *  so it is inert there. */
export type CenterAxis = 'both' | 'horizontal' | 'vertical'

export interface CenterProps extends StackPaddingProps, StackSizeProps, AccessibilityProps {
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
	bind?: (el: any) => void
	/** @default 'both' */
	axis?: CenterAxis
	isInline?: boolean
}

/** `Section` — a banded container with a surface/transparent/muted
 *  background, spacing-scale padding, and optional edge dividers. */
export type SectionVariant = 'section' | 'transparent' | 'muted'
export type SectionDividerSide = 'top' | 'bottom' | 'start' | 'end'

export interface SectionProps extends StackPaddingProps, StackSizeProps, AccessibilityProps {
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
	bind?: (el: any) => void
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
	children?: any
	id?: string
	bind?: (el: any) => void
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	/** Web element tag — 'span' (default) for inline labels, 'div' for block
	 *  content / live regions. Native ignores it. */
	as?: any
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
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
	bind?: (el: any) => void
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
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
	bind?: (el: any) => void
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
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
	bind?: (el: any) => void
	/** Group label — required for accessibility. */
	label: string
	/** Tooltip text shown via an info affordance at the end of the label. */
	labelTooltip?: string
	size?: InputGroupSize
}

/** `InputGroupText` — a prefix/suffix text or icon segment inside
 *  `InputGroup` ('$', 'https://', units). */
export interface InputGroupTextProps {
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
	bind?: (el: any) => void
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
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
	bind?: (el: any) => void
	/** @default 'balanced' */
	density?: ListDensity
	hasDividers?: boolean
	/** Compensates for each item's inline inset up to the container padding
	 *  on each edge (aligns rows with sibling headings). Reads the
	 *  `--vx-item-inset-inline` / `--vx-container-padding-*` custom
	 *  properties; inert where no container padding is declared. Web only. */
	edgeCompensation?: 'inline'
	/** Header content rendered above the list (aria-labelledby on web). */
	header?: any
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
	className?: any
	style?: any
	children?: any
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	id?: string
	bind?: (el: any) => void
	/** Primary text (string truncates to one line) or rich content. */
	label: any
	description?: any
	startContent?: any
	endContent?: any
	onPress?: () => void
	/** Extra app content rendered inside the row's label area. */
	delegateRef?: { current: any }
	/** Link target: web renders a real anchor; native navigates via the
	 *  registered deep-link table, falling back to opening the URL. */
	href?: string
	target?: '_blank' | '_self' | string
	rel?: string
	isDisabled?: boolean
	isSelected?: boolean
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
	className?: any
	style?: any
	id?: string
	bind?: (el: any) => void
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
	state: IndicatorState<F>
	/** @default 'md' */
	size?: IndicatorSize
	isDisabled?: boolean
	children?: any
}

export type IndicatorComponent<F extends IndicatorFamily = IndicatorFamily> = (
	props: IndicatorProps<F>,
) => any

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
