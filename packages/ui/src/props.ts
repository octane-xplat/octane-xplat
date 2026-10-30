import type { ClassValue, CSSProperties, Octane } from 'octane/jsx-runtime'

/** Shared prop/type contract — the single source of truth for the public
 *  API surface. Platform leaves import these types so prop shapes cannot
 *  drift across .web/native-default, and `tsrx-typegen` emits the package's
 *  declarations from its public entrypoints and component leaves. The Octane
 *  import is type-only; shared contracts stay platform-agnostic. */

/** Octane's class composition contract, shared unchanged across platforms. */
export type { ClassValue } from 'octane/jsx-runtime'

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

/** A component function whose props vary by the owning slot. Method syntax
 *  keeps custom components with narrower props assignable to open slots. */
type ComponentFunction<Props> = {
	/** Method-style signature keeping prop types bivariant — the standard
	 *  function-component assignability pattern. */
	bivarianceHack(props: Props): Renderable
}['bivarianceHack']

/** Shared scroll hooks preserve platform event objects without normalizing
 *  the DOM, NativeScript, and AppKit payloads into a misleading shape. */
type ScrollableAreaEventHandler = {
	/** Method-style signature keeping the event parameter bivariant. */
	bivarianceHack(event: unknown): void
}['bivarianceHack']

/** A component reference — a function component or (web) an intrinsic tag
 *  name. The contract for `as`-style customization slots. */
export type ElementType = string | ComponentFunction<object>

/** A function component usable from JSX — `P` plus Octane's JSX attributes
 *  (`key`). The contract for `components`-style override slots. */
export type ElementComponent<P> = (props: P & Octane.Attributes) => Renderable

/** Props delivered to components mounted imperatively by `openModal` /
 *  `openBottomSheet`, or by `Modal`'s `component` prop: `params` plus a
 *  `close` that resolves the host with an optional result. Supply the
 *  component's parameter shape as `TParams`; `params` is `undefined` when
 *  the caller opens the surface without one.
 *
 * @example
 * ```tsx
 * import { Text } from '@octane-xplat/ui'
 * import type { HostedComponentProps } from '@octane-xplat/ui'
 *
 * type EditParams = { id: number }
 * function EditForm({ params }: HostedComponentProps<EditParams>) {
 * 	return <Text>{params?.id ?? 'New item'}</Text>
 * }
 * ```
 */
export interface HostedComponentProps<TParams = unknown> {
	/** Parameters forwarded to the hosted component when it is opened. */
	params: TParams | undefined
	/** Closes the hosted surface; `result` flows back to the opener. */
	close(result?: unknown): void
}

/** A component mounted on a dedicated root — `openModal`/`openBottomSheet`
 *  arguments and `Modal`'s `component` prop. */
export type HostedComponent<TParams = unknown> = ComponentFunction<HostedComponentProps<TParams>>

/** A screen receiving structured params, search, data and context. File screens
 * use generated RouteProps; programmatic screens attach after preparation inference. */
export type ScreenComponent = ComponentFunction<Record<string, unknown>>

/** A route layout component — renders the route subtree through `children`. */
export type LayoutComponent = ComponentFunction<{ /** Route subtree rendered inside the layout. */ children?: Renderable }>

// ---------- gestures ----------

/** Pan phase; cancellation never implies a completed drag. */
export type PanState = 'began' | 'moved' | 'ended' | 'cancelled'

/** Cumulative translation from gesture start (x/dx and y/dy are aliases),
 * in CSS pixels on web or logical DIPs/points on native. Velocity uses
 * those same units per second; target is the attached host. */
export interface PanEvent {
	/** Current point in the attached host's top-left logical coordinates.
	 * Currently supplied by AppKit only; use dx/dy for portable dragging. */
	locationX?: number
	/** Vertical point in the attached host's top-left logical coordinates — AppKit only; prefer dx/dy for portable dragging. */
	locationY?: number
	/** Normalized horizontal position within the host (0–1). */
	x: number
	/** Normalized vertical position within the host (0–1). */
	y: number
	/** Horizontal translation since gesture start, in DIPs. */
	dx: number
	/** Vertical translation since gesture start, in DIPs. */
	dy: number
	/** Horizontal velocity in DIPs per second. */
	vx: number
	/** Vertical velocity in DIPs per second. */
	vy: number
	/** Gesture phase — began → moved → ended/cancelled. */
	state: PanState
	/** The host element the gesture is attached to. */
	target: HostElement
}

/** NativeScript swipe direction flags: right=1, left=2, up=4, down=8.
 * Swipe callbacks attach to native gesture-capable primitives; web does not
 * synthesize swipe events. Use onPan for portable dragging. */
export interface SwipeEvent {
	/** NativeScript direction bitmask: right=1, left=2, up=4, down=8. */
	direction: 1 | 2 | 4 | 8
}

/** Public shape of `setTranslate` — the imperative translate write on a
 *  bound view (a leaf's `ref` target). Web composes into the element's
 *  `transform`; native sets the view's translateX/translateY props.
 *  Both axes default to 0, so `setTranslate(el)` resets. */
export type SetTranslate = (el: HostElement, x?: number, y?: number) => void

// ---------- primitives ----------

/** Metadata read by parent layouts. Native forwards NativeScript attached
 *  attributes; web folds the CSS equivalents into the child's style.
 *  `row`/`col` are zero-based track indices into the parent `Grid`'s
 *  `rows`/`columns` lists — the first declared track is index 0 on every
 *  platform, never CSS's one-based line numbering. `rowSpan`/`colSpan`
 *  count tracks (default 1). A child with no index flows into the next
 *  free cell in row order. */
export interface LayoutChildProps {
	/** Zero-based row index in the parent `Grid`; non-integer and negative
	 *  values are contract violations. */
	row?: number
	/** Zero-based column index in the parent `Grid`. */
	col?: number
	/** Row tracks to span, >= 1. */
	rowSpan?: number
	/** Column tracks to span, >= 1. */
	colSpan?: number
	/** Dock edge inside a DockLayout parent; ignored elsewhere. */
	dock?: 'left' | 'top' | 'right' | 'bottom'
	/** Absolute x offset in a FixedLayout/AbsoluteLayout parent, in DIPs. */
	left?: number
	/** Absolute y offset in a FixedLayout/AbsoluteLayout parent, in DIPs. */
	top?: number
	/** Flex grow factor consumed by the parent container. */
	flexGrow?: number
	/** Flex shrink factor consumed by the parent container. */
	flexShrink?: number
	/** Per-child cross-axis alignment overriding the parent's alignItems. */
	alignSelf?: string
	/** Paint/layout order override consumed by the parent container. */
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
	| {
			/** Style-application discriminator. */
			type: 'style'
			/** Style key/value pairs applied by the modifier. */
			values: Record<string, NativeModifierValue | undefined>
	  }
	| {
			/** Property-set discriminator. */
			type: 'property'
			/** Native property name to assign. */
			name: string
			/** Value assigned to the property. */
			value: NativeModifierValue
	  }

/** Adds the native-only modifier escape hatch to an OS-backed widget's props. */
export type PlatformWidgetProps<Props> = Props & {
	/** Native modifier array applied after shared props (platform subpaths only). */
	modifiers?: readonly NativeModifier[]
}

/** Native glyph names for the OS-authentic UI subpaths. */
export interface PlatformIconChoice {
	/** Icon name used on iOS/macOS. */
	ios: string
	/** Icon name used on Android. */
	android: string
}

/** Flex-container props shared by View/Row/Pressable — RN vocabulary, applied
 *  to the host masonview natively and the element's style on web.
 *  `gap` is a dip number (px on web); NS supports it on FlexboxLayout only
 *  (GridLayout has no gap). */
export interface FlexContainerProps {
	/** Main-axis distribution for the container's children. */
	justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
	/** Cross-axis alignment for the container's children. */
	alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
	/** Wrap behavior; `true` equals `wrap`. */
	flexWrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse'
	/** Shorthand for rowGap + columnGap between children, in DIPs or CSS units. */
	gap?: number | string
	/** Vertical gap between wrapped rows. */
	rowGap?: number | string
	/** Horizontal gap between children. */
	columnGap?: number | string
}

/** Liquid Glass material config. Native maps it to `iosGlassEffect`
 *  (iOS 26+; inert on Android and older iOS), web to the `vx-glass`
 *  backdrop-filter approximation. `variant:'clear'` is the faint,
 *  mostly-transparent glass; `'regular'` is Apple's default. */
export interface GlassConfig {
	/** Glass material — `clear` is faint/mostly transparent, `regular` is Apple's default; `identity`/`none` opt out. */
	variant?: 'regular' | 'clear' | 'identity' | 'none'
	/** Touch-tracking highlight — only meaningful on <LiquidGlass>; the
	 *  per-view glass applied by `glass` never receives touches upstream. */
	interactive?: boolean
	/** Tint color blended into the glass material. */
	tint?: string
	/** (LiquidGlassContainer only) merge distance between glass siblings. */
	spacing?: number
	/** Effect-change animation in ms (default 300). */
	animateChangeDuration?: number
}

/** One `Grid` track: `'auto'` sizes to content, a number (or numeric
 *  string) is a fixed length in dips — px on web — and `'*'`/`'N*'` is a
 *  weighted share of the space left after fixed and auto tracks. */
export type GridTrack = number | 'auto' | '*' | `${number}` | `${number}*`

/** The bounded track grammar `Grid` accepts on every platform. A string
 *  is a list of `GridTrack` tokens separated by commas or whitespace
 *  (`'auto,120,2*'`); an array carries the same tokens typed
 *  (`['auto', 120, '2*']`). `'Npx'` and `'Nfr'` spellings normalize to
 *  the equivalent dip length and star weight. Tokens outside the grammar
 *  — `minmax`, `repeat`, `%`, line names, `min-content`, and the rest of
 *  the CSS-only syntax — are contract violations: the host reports a
 *  `[Grid]` diagnostic and treats the token as `'auto'`. */
export type GridTrackList = string | readonly GridTrack[]

/** Track-based container (Astryx `Grid`). `rows`/`columns` take the bounded
 *  `GridTrackList` grammar; children place themselves with `LayoutChildProps`
 *  `row`/`col`/`rowSpan`/`colSpan` (zero-based) or flow into free cells in
 *  row order. Track tokens outside the grammar report a `[Grid]` diagnostic
 *  and fall back to `'auto'`. For main-axis flow use `Stack`; for overlap
 *  use `Absolute`.
 *
 *  @example
 *  ```tsx
 *  import { Grid, View } from '@octane-xplat/ui'
 *
 *  <Grid rows="auto,*" columns={[120, '*']}>
 *  	<View row={0} col={0} rowSpan={2}>{nav}</View>
 *  	<View row={0} col={1}>{header}</View>
 *  	<View row={1} col={1}>{content}</View>
 *  </Grid>
 *  ```
 *  @see GridTrackList for the track grammar, LayoutChildProps for placement. */
/** Responsive column rule (Astryx `{minWidth,max?,repeat?}`) — auto-fill/fit
 *  tracks of at least `minWidth` dips. Web only; native leaves report a
 *  `[Grid]` diagnostic and fall back to a single 'auto' column. */
export interface GridResponsiveColumns {
	/** Minimum track width in DIPs before the column count steps down. */
	minWidth: number
	/** Upper bound on the generated column count. */
	max?: number
	/** `fill` packs as many tracks as fit; `fit` stretches fewer tracks to fill the row. */
	repeat?: 'fill' | 'fit'
}

export interface GridProps extends AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Row track list — a CSS grid-template-rows string or GridTrack array. */
	rows?: GridTrackList
	/** Track grammar, a fixed column count (equal tracks), or a responsive
	 *  `{minWidth}` rule (Astryx `columns`). */
	columns?: GridTrackList | number | GridResponsiveColumns
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
}

/** GridSpan — a `Grid` child that spans tracks (Astryx `GridSpan`).
 *  `columns`/`rows` take a track count or `'full'` (columns only: all tracks).
 *  Implemented through `LayoutChildProps` `colSpan`/`rowSpan`; `'full'` needs
 *  the grid's declared column count (a `Grid`-parented child on web uses
 *  `grid-column: 1 / -1`). */
export interface GridSpanProps extends AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Column span, or `full` to span every track. */
	columns?: number | 'full'
	/** Row span. */
	rows?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
}

/** Astryx spacing scale — `step * 4` density-independent pixels (dips;
 *  CSS pixels on web). Shared by `Stack`, `Center`,
 *  `Section`, and `FormLayout` gap/padding props. */
export type SpacingStep = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10

/** Numeric sizes are dips (CSS pixels on web); strings are CSS lengths used
 *  as-is (for example `'100%'` or `'12em'`). */
export type SizeValue = number | string

/** Flow direction for `Stack` — also selects which of `hAlign`/`vAlign` is
 *  the main axis. */
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

/** `Stack` line wrapping — mirrors CSS `flex-wrap`. @default 'nowrap' */
export type StackWrap = 'nowrap' | 'wrap' | 'wrap-reverse'

/** Padding props shared by the flow layout components. Per edge, most
 *  specific wins: edge → axis → `padding`. */
export interface StackPaddingProps {
	/** Uniform inner padding on the SpacingStep scale (×4 DIP). */
	padding?: SpacingStep
	/** Inline axis (horizontal in LTR). Overrides `padding` on both inline edges. */
	paddingInline?: SpacingStep
	/** Inline-start edge — left in LTR. Native maps logical edges to physical left/right. */
	paddingInlineStart?: SpacingStep
	/** End-edge inline padding; resolves against writing direction. */
	paddingInlineEnd?: SpacingStep
	/** Block axis (vertical). Overrides `padding` on both block edges. */
	paddingBlock?: SpacingStep
	/** Top block-edge padding. */
	paddingBlockStart?: SpacingStep
	/** Bottom block-edge padding. */
	paddingBlockEnd?: SpacingStep
}

/** Explicit size constraints shared by the flow layout components. Numeric
 *  sizes are dips (CSS pixels on web); strings are CSS lengths used as-is. */
export interface StackSizeProps {
	/** Fixed width — number is DIPs, string is a CSS length. */
	width?: SizeValue
	/** Fixed height — number is DIPs, string is a CSS length. */
	height?: SizeValue
	/** Maximum width constraint. */
	maxWidth?: SizeValue
	/** Minimum height constraint. */
	minHeight?: SizeValue
}

/** Astryx flow Stack — a flex container, NOT an overlap layer. For children
 *  stacked in the same cell use `Absolute`. `hAlign`/`vAlign` map to
 *  main/cross axis by direction; `justify`/`align` are the CSS-named aliases.
 *  `as` picks the web element tag; native always renders the platform
 *  container (no semantic HTML exists there). `isScrollable` wraps content
 *  in a ScrollView on native and overflow:auto on web.
 *
 *  @example
 *  ```tsx
 *  import { Stack, Heading, FormLayout } from '@octane-xplat/ui'
 *
 *  <Stack direction="vertical" gap={2} padding={4} vAlign="start">
 *  	<Heading>Settings</Heading>
 *  	<FormLayout>{fields}</FormLayout>
 *  </Stack>
 *  ```
 *  @see HStackProps and VStackProps for the axis-locked presets,
 *  StackItemProps for per-child overrides, AbsoluteProps for overlap. */
export interface StackProps
	extends StackPaddingProps, StackSizeProps, AccessibilityProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** @default 'vertical' */
	direction?: StackDirection
	/** Horizontal alignment shorthand — main-axis in horizontal stacks, cross-axis in vertical. */
	hAlign?: StackAlignment
	/** Vertical alignment shorthand — cross-axis in horizontal stacks, main-axis in vertical. */
	vAlign?: StackAlignment
	/** Main-axis distribution along `direction`. */
	justify?: StackMainAlignment
	/** Cross-axis alignment of children. */
	align?: StackCrossAlignment
	/** Gap between children on the SpacingStep scale. */
	gap?: SpacingStep
	/** Wrap behavior when children overflow the main axis. */
	wrap?: StackWrap
	/** Wraps children in a scroll container when they overflow. */
	isScrollable?: boolean
	/** Host element override — render as a different element/component type. */
	as?: ElementType
	/** Pan gesture callback — fires through began/moved/ended/cancelled with translation and velocity. */
	onPan?: (e: PanEvent) => void
	/** Swipe gesture callback — fires once per completed swipe with direction and velocity. */
	onSwipe?: (e: SwipeEvent) => void
}

/** Cross-axis self-alignment for a `StackItem` — mirrors `align-self`. */
export type StackItemCrossAlignSelf = 'start' | 'center' | 'end' | 'stretch'
/** `StackItem` sizing on the main axis: `'static'` keeps content size,
 *  `'fill'` grows into the stack's remaining space (shared evenly). */
export type StackItemSize = 'static' | 'fill'

/** Per-child overrides inside a `Stack`. `size="fill"` grows into the
 *  remaining space (splits evenly between fill siblings). On web the item
 *  carries the flex `min-width/min-height: 0` reset so a fill child can
 *  become a scroll region; native flex children already shrink to zero.
 *
 *  @example
 *  ```tsx
 *  import { Stack, StackItem } from '@octane-xplat/ui'
 *
 *  <Stack direction="horizontal">
 *  	<StackItem>{sidebar}</StackItem>
 *  	<StackItem size="fill">{detail}</StackItem>
 *  </Stack>
 *  ```
 *  @see StackProps */
export interface StackItemProps extends AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Cross-axis self alignment, overriding the stack's cross alignment. */
	crossAlignSelf?: StackItemCrossAlignSelf
	/** @default 'static' */
	size?: StackItemSize
	/** overflow:auto on web; wraps in a ScrollView on native. */
	isScrollable?: boolean
	/** Host element override for the stack item wrapper. */
	as?: ElementType
	/** Pan gesture callback — fires through began/moved/ended/cancelled with translation and velocity. */
	onPan?: (e: PanEvent) => void
	/** Swipe gesture callback — fires once per completed swipe with direction and velocity. */
	onSwipe?: (e: SwipeEvent) => void
}

/** Horizontal flow stack — `Stack` with `direction="horizontal"`. `hAlign`
 *  is the main axis, `vAlign` the cross axis.
 *
 * @example
 * ```tsx
 * import { HStack, Icon, Text } from '@octane-xplat/ui'
 *
 * <HStack gap={2} vAlign="center">
 * 	<Icon name="check" />
 * 	<Text>{label}</Text>
 * </HStack>
 * ```
 * @see StackProps, VStackProps. */
export interface HStackProps extends Omit<StackProps, 'direction' | 'hAlign' | 'vAlign'> {
	/** Main-axis alignment (horizontal distribution). */
	hAlign?: StackMainAlignment
	/** Cross-axis alignment (vertical). */
	vAlign?: StackCrossAlignment
}

/** Vertical flow stack — `Stack` with `direction="vertical"`. `vAlign` is
 *  the main axis, `hAlign` the cross axis.
 *
 * @example
 * ```tsx
 * import { VStack } from '@octane-xplat/ui'
 *
 * <VStack gap={3} padding={4}>
 * 	{rows}
 * </VStack>
 * ```
 * @see StackProps, HStackProps. */
export interface VStackProps extends Omit<StackProps, 'direction' | 'hAlign' | 'vAlign'> {
	/** Cross-axis alignment (horizontal). */
	hAlign?: StackCrossAlignment
	/** Main-axis alignment (vertical distribution). */
	vAlign?: StackMainAlignment
}

/** Overlap layer — children position themselves with `LayoutChildProps` `left`/`top` (dips, measured from the container's top-left) or `dock` to an edge; later siblings paint above earlier ones. For main-axis flow use `Stack`; for track placement use `Grid`.
 *
 * @example
 * ```tsx
 * import { Absolute, View } from '@octane-xplat/ui'
 *
 * <Absolute>
 * 	<View left={12} top={12}>{badge}</View>
 * 	<View dock="bottom">{caption}</View>
 * </Absolute>
 * ```
 * @see StackProps for flow layout, GridProps for tracks.
 */
export interface AbsoluteProps extends AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
}

/** Interactive glass surface — the element root IS the platform's glass
 *  effect view (NS `LiquidGlass`, a UIVisualEffectView hosting children).
 *  Real material on iOS 26+; inert layout on Android and older iOS;
 *  backdrop-filter approximation on web.
 *
 * @example
 * ```tsx
 * import { LiquidGlass } from '@octane-xplat/ui/ios'
 *
 * <LiquidGlass variant="regular" interactive>
 * 	{content}
 * </LiquidGlass>
 * ```
 * @see GlassConfig, LiquidGlassContainerProps. */
export interface LiquidGlassProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** `regular` is the standard material; `clear` is the faint variant. */
	variant?: 'regular' | 'clear'
	/** iOS 26+ glass touch tracking. Default false; child touch behavior with
	 * explicit true is not device-qualified. Earlier iOS uses system material blur. */
	interactive?: boolean
	/** Tint color blended into the glass. */
	tint?: string
	/** Effect-change animation in ms (default 300). */
	animateChangeDuration?: number
	/** Native modifier array applied after shared props. */
	modifiers?: readonly NativeModifier[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Merged-glass region — sibling glass elements inside morph together
 *  across `spacing` dips (NS `LiquidGlassContainer`, an AbsoluteLayout:
 *  children position via left/top).
 *
 * @example
 * ```tsx
 * import { LiquidGlass, LiquidGlassContainer } from '@octane-xplat/ui/ios'
 *
 * <LiquidGlassContainer spacing={16}>
 * 	<LiquidGlass left={0} top={0}>{a}</LiquidGlass>
 * 	<LiquidGlass left={64} top={0}>{b}</LiquidGlass>
 * </LiquidGlassContainer>
 * ```
 * @see LiquidGlassProps, GlassConfig. */
export interface LiquidGlassContainerProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Merge distance in DIPs between glass siblings inside the container. */
	spacing?: number
	/** Native modifier array applied after shared props. */
	modifiers?: readonly NativeModifier[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Flexible empty space inside a `Stack` — grows along the main axis to push siblings apart (flex-grow:1). Takes no children; fixed gaps belong in the container's `gap`/`padding`.
 *
 * @example
 * ```tsx
 * import { HStack, Spacer, Text } from '@octane-xplat/ui'
 *
 * <HStack>
 * 	<Text>Inbox</Text>
 * 	<Spacer />
 * 	<Text>{count}</Text>
 * </HStack>
 * ```
 * @see StackProps
 */
export interface SpacerProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
}

/** Optional automation identity on supported host components. */
export interface TestIDProps {
	/** Stable semantic automation name, independent of `id` and spoken labels.
	 * Supported hosts map to data-testid on web and NativeScript testID on
	 * iOS/Android. Inputs target the editable host; Overlay targets its content.
	 * Other components/platforms are not automatically supported by inheritance.
	 * Keep IDs unique among mounted targets and stable across localization.
	 * @see docs/testing/test-identifiers.md for qualified hosts and precedence. */
	testID?: string
}

/** The shared accessibility prop set — `Role` and friends are declared
 *  below; containers and leaf components carry the same names so ARIA on
 *  web and NativeScript's accessibility properties stay aligned. */
export interface AccessibilityProps {
	/** Groups the subtree into a single accessibility element on native. */
	accessible?: boolean
	/** Accessible name announced by assistive technology in place of derived text. */
	accessibilityLabel?: string
	/** Semantic role (ARIA spelling; native maps e.g. `heading` → `header`). */
	accessibilityRole?: Role
	/** Describes the result of activating; announced after the label. */
	accessibilityHint?: string
	/** Current value text for adjustable/progress elements. */
	accessibilityValue?: string
	/** State flags reported to assistive technology (disabled, selected, checked, …). */
	accessibilityState?: {
		/** Marks the element disabled to assistive tech. */
		disabled?: boolean
		/** Marks the element as the current selection. */
		selected?: boolean
		/** Reports checked/unchecked (or mixed where supported). */
		checked?: boolean
		/** Toggle-button pressed state — `aria-pressed` on web; reported as
		 *  checked/unchecked where the platform a11y model has no pressed. */
		pressed?: boolean
		/** Reports expanded/collapsed for disclosure elements. */
		expanded?: boolean
		/** Marks the region busy — announcements defer until it clears. */
		busy?: boolean
		/** Marks the value invalid for assistive tech. */
		invalid?: boolean
		/** Marks the input required for assistive tech. */
		required?: boolean
	}
	/** Politeness for announcing content changes — `none` keeps the region inert. */
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
}

/** Neutral host container — a `div` on web, a NativeScript view on iOS/Android, an AppKit view on macOS. Carries the shared layout-child, flex, accessibility, and test-id props; parent layouts consume the placement metadata (`row`/`col`, `dock`, `left`/`top`, `flexGrow`). The escape bags `ios`/`android`/`web` apply after shared props.
 *
 * @example
 * ```tsx
 * import { View } from '@octane-xplat/ui'
 *
 * <View style={{ borderRadius: 8 }} gap={8}>
 * 	{children}
 * </View>
 * ```
 * @see StackProps for flow layout, AccessibilityProps, LayoutChildProps.
 */
export interface ViewProps
	extends LayoutChildProps, FlexContainerProps, AccessibilityProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Pan gesture callback — fires through began/moved/ended/cancelled with translation and velocity. */
	onPan?: (e: PanEvent) => void
	/** Swipe gesture callback — fires once per completed swipe with direction and velocity. */
	onSwipe?: (e: SwipeEvent) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** The `Row` leaf's contract — the same layout/flex prop set as `View`. `Row` itself is not exported on the public barrel; use `HStack` (or `Stack` with `direction="horizontal"`) for horizontal flow. Exported for wrappers that forward to the leaf.
 */
export interface RowProps
	extends LayoutChildProps, FlexContainerProps, AccessibilityProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Pan gesture callback — fires through began/moved/ended/cancelled with translation and velocity. */
	onPan?: (e: PanEvent) => void
	/** Swipe gesture callback — fires once per completed swipe with direction and velocity. */
	onSwipe?: (e: SwipeEvent) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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
	| 'status'

/** Display-scale visual variants for `Heading` (Astryx `HeadingType`) — larger,
 *  lighter `--text-display-*` sizing while `level` keeps semantic meaning. */
export type HeadingType = 'display-1' | 'display-2' | 'display-3'

/** Text label — a `span`-class text host (NS `Label`/`TextView` on native). `type`
 *  applies the Astryx type scale (`--text-<type>-*` theme tokens), `size`/`color`/
 *  `weight` refine it, and `maxLines` truncates with an ellipsis (single-line
 *  clip at 1, line-clamp beyond — replaces the earlier `numberOfLines`/`ellipsize`
 *  props). Omit `type` (or pass `'inherit'`) to keep ambient typography; use
 *  `Heading` for semantic levels and `RichText`/`RichTextSpan` for mixed-format runs.
 *
 * @example
 * ```tsx
 * import { Text } from '@octane-xplat/ui'
 *
 * <Text type="body" size="sm" color="secondary" maxLines={2}>{summary}</Text>
 * ```
 * @see HeadingProps, RichTextProps.
 */
export interface TextProps extends LayoutChildProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Astryx type-scale slot (`--text-<type>-*` theme tokens); `inherit` keeps ambient typography. */
	type?: TextType
	/** Size override refining the `type` slot. */
	size?: TextSize
	/** Theme text color token. */
	color?: TextColor
	/** Font weight override. */
	weight?: TextWeight
	/** Line cap before ellipsis truncation; 0/unset = no truncation. */
	maxLines?: number
	/** Groups the text into a single accessibility element on native. */
	accessible?: boolean
	/** Optional explicit accessible name override for the text block. */
	accessibilityLabel?: string
	/** Semantic role override (rarely needed — Text infers `text`). */
	accessibilityRole?: Role
	/** Describes the result of interacting; announced after the label. */
	accessibilityHint?: string
	/** Value text reported to assistive technology. */
	accessibilityValue?: string
	/** State flags reported to assistive technology. */
	accessibilityState?: {
		/** Marks the element disabled to assistive tech. */
		disabled?: boolean
		/** Marks the element as the current selection. */
		selected?: boolean
		/** Reports checked/unchecked state. */
		checked?: boolean
		/** Toggle-button pressed state — `aria-pressed` on web; reported as
		 *  checked/unchecked where the platform a11y model has no pressed. */
		pressed?: boolean
		/** Reports expanded/collapsed for disclosure elements. */
		expanded?: boolean
		/** Marks the region busy — announcements defer until it clears. */
		busy?: boolean
		/** Marks the content invalid for assistive tech. */
		invalid?: boolean
		/** Marks the element required for assistive tech. */
		required?: boolean
	}
	/** Politeness for announcing text changes (live regions on web). */
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Inline rich text container. Children should be RichTextSpan components so
 * the native leaf can preserve each run as a NativeScript Span.
 *
 * @example
 * ```tsx
 * import { RichText, RichTextSpan } from '@octane-xplat/ui'
 *
 * <RichText>
 * 	<RichTextSpan>Plain </RichTextSpan>
 * 	<RichTextSpan style={{ fontWeight: 'bold' }}>bold</RichTextSpan>
 * </RichText>
 * ```
 * @see RichTextSpanProps, TextProps. */
export interface RichTextProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Optional explicit accessible name override for the text block. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One styled or tappable inline run inside RichText. `text` is an explicit
 * native-safe escape hatch; a single string child is also accepted.
 * @see RichTextProps for the enclosing container and a composition example. */
export interface RichTextSpanProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Literal text content of the span. */
	text?: string
	/** Makes the span a link — fires on activation. */
	onPress?: () => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Portable interaction primitive — a host view that reports `onPress` (tap/click/Enter), `onLongPress` (~500ms hold), `onDoublePress`, press lifecycle (`onPressIn`/`onPressOut`), and gesture events (`onPan`, native-only `onSwipe`). `disabled` suppresses activation; `hitSlop` expands the tappable area in dips. Prefer `Button` for labeled actions — Pressable is the unstyled base.
 *
 * @example
 * ```tsx
 * import { Pressable, Text } from '@octane-xplat/ui'
 *
 * <Pressable onPress={select} accessibilityRole="button">
 * 	<Text>{title}</Text>
 * </Pressable>
 * ```
 * @see ButtonProps, PanEvent.
 */
export interface PressableProps extends LayoutChildProps, FlexContainerProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Prevents interaction and applies the disabled appearance. */
	disabled?: boolean
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Pan gesture callback — fires through began/moved/ended/cancelled with translation and velocity. */
	onPan?: (e: PanEvent) => void
	/** Swipe gesture callback — fires once per completed swipe with direction and velocity. */
	onSwipe?: (e: SwipeEvent) => void
	/** Activation callback — tap/click or keyboard activation. */
	onPress?: () => void
	/** ~500ms press-and-hold (web: timer over pointerdown/up). */
	onLongPress?: () => void
	/** Groups the subtree into a single accessibility element on native. */
	accessible?: boolean
	/** Accessible name announced by assistive technology. */
	accessibilityLabel?: string
	/** Semantic role override (defaults to `button` when onPress is set). */
	accessibilityRole?: Role
	/** Fires when the press starts (touch down), before activation. */
	onPressIn?: () => void
	/** Fires when the press is released, whether or not it activated. */
	onPressOut?: () => void
	/** Double-tap callback; may delay `onPress` while waiting for a second tap on platforms that serialize gestures. */
	onDoublePress?: () => void
	/** Extra touch target around the element in DIPs without changing layout. */
	hitSlop?: number
	/** Describes the result of activating; announced after the label. */
	accessibilityHint?: string
	/** Value text reported to assistive technology. */
	accessibilityValue?: string
	/** State flags reported to assistive technology. */
	accessibilityState?: {
		/** Marks the element disabled to assistive tech. */
		disabled?: boolean
		/** Marks the element as the current selection. */
		selected?: boolean
		/** Reports checked/unchecked — toggles report pressed as checked on native. */
		checked?: boolean
		/** Toggle-button pressed state — `aria-pressed` on web; reported as
		 *  checked/unchecked where the platform a11y model has no pressed. */
		pressed?: boolean
		/** Reports expanded/collapsed for disclosure triggers. */
		expanded?: boolean
		/** Marks the region busy — announcements defer until it clears. */
		busy?: boolean
		/** Marks the value invalid for assistive tech. */
		invalid?: boolean
		/** Marks the element required for assistive tech. */
		required?: boolean
	}
	/** Politeness for announcing content changes. */
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Imperative handle delivered through `ref` on `TextInput`, `TextArea`, and `SearchInput` — `focus`/`blur` plus `native`, the raw platform host (HTMLInputElement on web, NS TextField/TextView on native) for escape-hatch access.
 */
export interface TextInputHandle {
	/** Moves focus into the field. */
	focus(): void
	/** Removes focus from the field. */
	blur(): void
	/** The platform text-input host (DOM input / native field) — surfaces differ per platform. */
	native: HostElement
}

/** Severity of a field status message — `'warning'`, `'error'`, or `'success'`; drives the status glyph and tone.
 */
export type FieldStatusType = 'warning' | 'error' | 'success'

/** Portable validation status shared by field controls. */
export interface FieldStatus {
	/** Status tone — selects the icon and color treatment. */
	type: FieldStatusType
	/** Status text shown beside/below the field. */
	message?: string
}

/** Shared control size scale for field controls (`'sm' | 'md' | 'lg'`). Drives height, text size, and padding; an enclosing `SizeProvider` (Toolbar/ButtonGroup/InputGroup) or a `Field`/`InputGroup` context can supply it when the prop is unset.
 */
export type FieldControlSize = 'sm' | 'md' | 'lg'

/** Astryx name for `FieldControlSize` — the shared `'sm' | 'md' | 'lg'` element scale cascaded by `SizeProvider`.
 */
export type ElementSize = FieldControlSize

/** How a field status message is placed (Astryx parity):
 *  - `attached`: the message border-merges with the control below it
 *  - `detached`: a separate message under the control
 *  - `tooltip`: no message box; the status glyph reveals the message on
 *    hover/focus. Touch platforms (iOS/Android) have no hover/focus
 *    surfaces — `tooltip` degrades to `detached` there. */
export type FieldStatusVariant = 'attached' | 'detached' | 'tooltip'

/** Shared, platform-neutral field vocabulary — label, description, status,
 *  required/disabled/loading state, and sizing. Carried by every field
 *  control (`TextInput`, `Switch`, `Select`, date inputs, ...).
 *  @see TextInputProps for a concrete control and preferred composition,
 *  FieldStatus for the `status` shape. */
export interface FieldControlProps {
	/** Visible label text bound to the control. */
	label?: string
	/** Helper text under the label, above the control. */
	description?: string
	/** Keeps the label for assistive tech but removes it visually. */
	isLabelHidden?: boolean
	/** Prevents interaction and applies the disabled styling. */
	isDisabled?: boolean
	/** Why the field is disabled. Web shows it as a hover/focus tooltip on the
	 *  control (which stays focusable via `aria-disabled`); native appends it
	 *  to the control's accessibility hint instead. */
	disabledMessage?: string
	/** Shows the value without allowing edits. */
	isReadOnly?: boolean
	/** Indicates asynchronous work associated with the field. */
	isLoading?: boolean
	/** Marks the field required — adds the required affordance to the label. */
	isRequired?: boolean
	/** Marks the field optional (overrides the form's default marker). */
	isOptional?: boolean
	/** Control size on the shared FieldControlSize scale. */
	size?: FieldControlSize
	/** Validation/status message shown under the control. */
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

/** Single-line text entry (chrome-reset OS control). State is controlled by `value`+`onChange` or uncontrolled via `defaultValue`; `value` wins when both are set, `onChange` reports every user edit, and `onSubmit` fires on the return key (see `returnKeyType`). `secure` masks input; `hasClear` adds a clear affordance that fires `onChange('')` then `onClear`. The field vocabulary (`label`, `description`, `status`, `isDisabled`, ...) comes from `FieldControlProps`; the `ref` handle is `TextInputHandle`.
 *
 * @example
 * ```tsx
 * import { TextInput } from '@octane-xplat/ui'
 *
 * <TextInput label="Email" value={email} onChange={setEmail} keyboardType="email" />
 * ```
 * @see FieldControlProps for the field vocabulary, TextAreaProps for multi-line, SearchInputProps for search.
 */
export interface TextInputProps extends FieldControlProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Controlled text — pair with `onChange`. */
	value?: string
	/** Initial text for uncontrolled use; `value` wins when both are set. */
	defaultValue?: string
	/** Text shown while the field is empty. */
	placeholder?: string
	/** Reports the field's text after each user edit (and after `hasClear`).
	 *  Programmatic `value` writes do not fire it. */
	onChange?: (value: string) => void
	/** Optional explicit accessible name override for the input. */
	accessibilityLabel?: string
	/** Exposes the imperative handle through a standard Octane ref; cleared on unmount. */
	ref?: Octane.Ref<TextInputHandle>
	/** Masks input characters (password entry). */
	secure?: boolean
	/** Virtual keyboard variant requested on touch platforms. */
	keyboardType?: 'default' | 'email' | 'number' | 'decimal' | 'phone' | 'url'
	/** Label for the keyboard's submit/return key. */
	returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send'
	/** Fires when the field is submitted (return key). */
	onSubmit?: () => void
	/** Fires when the field gains focus. */
	onFocus?: () => void
	/** Fires when the field loses focus. */
	onBlur?: () => void
	/** Draw a clear action while the field has a value. Defaults to false. */
	hasClear?: boolean
	/** Called after a clear action reports an empty value. */
	onClear?: () => void
	/** Leading glyph inside the input — a registered `IconName` or a node
	 *  (Astryx `startIcon`). */
	startIcon?: Renderable
	/** Color for the placeholder text only. */
	placeholderTextColor?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Multi-line text entry — `TextInput` minus the clear affordance. `rows` sets the height in text rows; `autoGrow` grows with content up to `maxRows` rows (native TextViews grow by default, so `autoGrow` is what keeps the platforms matching). Submit semantics differ: native fires `onSubmit` only when `returnKeyType` is `done`/`send` (other keys insert newlines), web on Cmd/Ctrl+Enter.
 *
 * @example
 * ```tsx
 * import { TextArea } from '@octane-xplat/ui'
 *
 * <TextArea label="Notes" value={notes} onChange={setNotes} autoGrow maxRows={8} />
 * ```
 * @see TextInputProps.
 */
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
	/** Character cap — web enforces it via `maxlength` and draws the live
	 *  `n/max` counter (Astryx `maxLength`); native clamps input. */
	maxLength?: number
	/** Leading glyph inside the field (Astryx `startIcon`). */
	startIcon?: Renderable
}

/** Chrome-reset search field — TextInput with a leading glyph and a clear
 *  affordance, normalized: the web leaf is `<input type="search">` with the
 *  engine's own clear button hidden (the leaf draws the same one native
 *  gets), the native leaf is a styled TextField with `returnKeyType`
 *  `'search'`. Not UISearchBar — OS search chrome is deliberately absent.
 *
 * @example
 * ```tsx
 * import { SearchInput } from '@octane-xplat/ui'
 *
 * <SearchInput placeholder="Search…" value={query} onChange={setQuery} onSubmit={runSearch} />
 * ```
 * @see TextInputProps. */
export interface SearchInputProps extends FieldControlProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** Fires when the field gains focus. */
	onFocus?: () => void
	/** Fires when the field loses focus. */
	onBlur?: () => void
	/** Text shown while the field is empty. */
	placeholder?: string
	/** Shows a clear button that empties the query. */
	hasClear?: boolean
	/** Leading glyph — a registered icon name. Defaults to the built-in
	 *  `'xplat-search'` glyph; `false` renders no glyph. */
	icon?: IconName | false
	/** Exposes the imperative handle through a standard Octane ref; cleared on unmount. */
	ref?: Octane.Ref<TextInputHandle>
	/** Accessible name for the search field. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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

/** ISO 8601 instant with an explicit UTC marker or numeric offset.
 *  Unlike `ISODateTimeString`, this value identifies one point on the timeline. */
export type ISOInstantString =
	`${ISODateString}T${ISOTimeString}${'' | `.${number}`}${'Z' | `${'+' | '-'}${number}${number}:${number}${number}`}`

/** Weekday index — `0` is Sunday (the `Date.getDay()` ordering). Used by `weekStartsOn` on Calendar and the date inputs.
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6
/** Three-letter weekday name accepted by `weekStartsOn` as an alternative to the numeric `DayOfWeek`.
 */
export type DayOfWeekName = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

/** Inclusive ISO date range. */
export interface DateRange {
	/** Inclusive range start (ISO date). */
	start: ISODateString
	/** Inclusive range end (ISO date). */
	end: ISODateString
}

/** Quick-select range beside a `DateRangeInput` calendar. A preset is
 *  disabled when it violates min/max/dateConstraints or the span bounds. */
export interface DateRangePreset {
	/** Preset name shown in the picker. */
	label: string
	/** Computes the preset's range at selection time (evaluated lazily so relative presets stay current). */
	getRange: () => DateRange
}

/** Immutable Gregorian calendar day — the unit all calendar math uses. */
export interface PlainDate {
	/** Full calendar year. */
	readonly year: number
	/** Calendar month, 1–12. */
	readonly month: number
	/** Day of month, 1–31. */
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

/** `InputPresentation` minus `'text-input'` — the surfaces available to inputs that always open a picker.
 */
export type PickerPresentation = Exclude<InputPresentation, 'text-input'>
/** Picker surfaces a `DateInput` can open — see `InputPresentation` for each value's meaning.
 */
export type DateInputPresentation = PickerPresentation
/** Surfaces a `TimeInput` can open, including `'text-input'` (typed entry only, no picker). See `InputPresentation`.
 */
export type TimeInputPresentation = InputPresentation
/** Picker surfaces a `DateTimeInput` can open — see `InputPresentation`.
 */
export type DateTimeInputPresentation = PickerPresentation

/** Imperative calendar navigation — obtained via `ref`.
 *
 * @example
 * ```tsx
 * import { Calendar, type CalendarHandle } from '@octane-xplat/ui'
 *
 * const cal = useRef<CalendarHandle>()
 * cal.current?.navigateTo('2026-06-01')
 * <Calendar ref={cal} value={day} onChange={setDay} />
 * ```
 */
export interface CalendarHandle {
	/** Moves the displayed month to the given ISO date. */
	navigateTo(date: ISODateString): void
}

/** App-owned translations for date-family chrome and state announcements.
 * Dates passed to message functions are already formatted in `locale`. */
export interface DateInputMessages {
	/** Accessible label for the previous-month button. */
	previousMonth: string
	/** Accessible label for the next-month button. */
	nextMonth: string
	/** Accessible label for opening the calendar popover. */
	openCalendar: string
	/** Accessible label for closing the calendar popover. */
	closeCalendar: string
	/** Accessible label for opening the time picker. */
	openTimePicker: string
	/** Accessible label for closing the time picker. */
	closeTimePicker: string
	/** Validation message for an unparseable date. */
	invalidDate: string
	/** Validation message for an unparseable time. */
	invalidTime: string
	/** Validation message for an unparseable date-time. */
	invalidDateTime: string
	/** Accessible announcement for a selected date. */
	selected: (date: string) => string
	/** Accessible announcement for a chosen range start. */
	rangeStart: (date: string) => string
	/** Accessible announcement for a chosen range end. */
	rangeEnd: (date: string) => string
	/** Accessible announcement for dates inside the selected range. */
	inRange: (date: string) => string
	/** Accessible announcement for a completed range. */
	rangeSelected: (start: string, end: string) => string
	/** Accessible announcement when the range is cleared. */
	rangeCleared: string
	/** Accessible announcement when the value is cleared. */
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
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives `{ navigateTo }` for imperative month navigation. */
	ref?: Octane.Ref<CalendarHandle>
	/** Month panes shown side by side. @default 1 */
	numberOfMonths?: 1 | 2
	/** Earliest selectable date (inclusive, ISO). */
	min?: ISODateString
	/** Latest selectable date (inclusive, ISO). */
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
	/** Fires as the calendar's keyboard focus date moves. */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Single-day `Calendar` — `value`/`defaultValue`/`onChange` carry one `ISODateString`; `onChange` also passes a local-midnight `Date` convenience. `mode` may be omitted (`'single'` is the default).
 */
export interface CalendarSingleProps extends CalendarBaseProps {
	/** Single-date selection mode discriminator. */
	mode?: 'single'
	/** A selected local calendar date, or `null` for an explicitly empty calendar. */
	value?: ISODateString | null
	/** Initial selected date; `null` starts with no selected date. */
	defaultValue?: ISODateString | null
	/** Fires with the ISO day plus a local-midnight `Date` convenience. */
	onChange?: (value: ISODateString, valueAsDate: Date) => void
}

/** Range `Calendar` — `mode="range"` is required; `value`/`defaultValue`/`onChange` carry an inclusive `DateRange`. `minRangeSpan`/`maxRangeSpan` bound the selectable span.
 */
export interface CalendarRangeProps extends CalendarBaseProps {
	/** Range selection mode discriminator. */
	mode: 'range'
	/** A selected local date range, or `null` for an explicitly empty calendar. */
	value?: DateRange | null
	/** Initial selected range; `null` starts with no selected range. */
	defaultValue?: DateRange | null
	/** Fires with the committed range (start may precede end only after both picks). */
	onChange?: (value: DateRange) => void
}

/** A self-drawn month calendar — same value model on every target. Keyboard
 *  grid navigation is implemented on web; AppKit adapts the same model with
 *  native delivery/focus still unqualified. NativeScript hardware keys are not
 *  bound. Native cells expose `accessibility*` props rather than ARIA.
 *
 * @example
 * ```tsx
 * import { Calendar } from '@octane-xplat/ui'
 *
 * <Calendar value={day} onChange={(iso) => setDay(iso)} min="2026-01-01" />
 *
 * <Calendar mode="range" value={range} onChange={setRange} maxRangeSpan={14} />
 * ```
 * `null` is an explicit empty value; omitting `value` leaves selection
 * uncontrolled. The change callback reports selections, not clears.
 * @see CalendarSingleProps, CalendarRangeProps, DateInputProps.
 */
export type CalendarProps = CalendarSingleProps | CalendarRangeProps

/** Built-in closed-field date formats: `'date'` (short), `'date_long'`, `'date_weekday'`, `'system_date'` (the platform's own short-date style). A custom mapper `(iso) => string` is also accepted.
 */
export type SharedDateFormat = 'date' | 'date_long' | 'date_weekday' | 'system_date'

// Public Astryx names stay available even where the shared field layer owns
// the underlying type contract.
/** Astryx name for `FieldControlSize` on `DateInput`.
 */
export type DateInputSize = FieldControlSize
/** Astryx name for `FieldControlSize` on `TimeInput`.
 */
export type TimeInputSize = FieldControlSize
/** Astryx name for `FieldControlSize` on `DateTimeInput`.
 */
export type DateTimeInputSize = FieldControlSize
/** Astryx name for `FieldControlSize` on `DateRangeInput`.
 */
export type DateRangeInputSize = FieldControlSize
/** Closed-field format for `DateInput` — a `SharedDateFormat` name or `(iso: ISODateString) => string`.
 */
export type DateInputFormat = SharedDateFormat
/** Clock convention for `TimeInput` — `'12h'` (AM/PM) or `'24h'`. @default '12h'
 */
export type TimeInputHourFormat = '12h' | '24h'
/** Clock convention for `DateTimeInput`'s time segment — same values as `TimeInputHourFormat`.
 */
export type DateTimeInputHourFormat = TimeInputHourFormat
/** Allowed arrow-key minute steps for `DateTimeInput`'s time segment (minutes). @default 1
 */
export type DateTimeInputTimeIncrement = 1 | 5 | 10 | 15 | 30
/** Allowed cadences (minutes) for `DateTimeInput`'s preset-time option list.
 */
export type DateTimeInputTimeOptionInterval = 5 | 10 | 15 | 30 | 60
/** Astryx name for `FieldStatus` on `DateInput`.
 */
export type DateInputStatus = FieldStatus
/** Astryx name for `FieldStatusType` on `DateInput`.
 */
export type DateInputStatusType = FieldStatusType
/** Astryx name for `FieldStatus` on `TimeInput`.
 */
export type TimeInputStatus = FieldStatus
/** Astryx name for `FieldStatusType` on `TimeInput`.
 */
export type TimeInputStatusType = FieldStatusType
/** Astryx name for `FieldStatus` on `DateTimeInput`.
 */
export type DateTimeInputStatus = FieldStatus
/** Astryx name for `FieldStatusType` on `DateTimeInput`.
 */
export type DateTimeInputStatusType = FieldStatusType
/** Astryx name for `FieldStatus` on `DateRangeInput`.
 */
export type DateRangeInputStatus = FieldStatus
/** Astryx name for `FieldStatusType` on `DateRangeInput`.
 */
export type DateRangeInputStatusType = FieldStatusType
/** Typed date entry + calendar. `null` is the explicit empty value; omitting
 *  `value` leaves the field uncontrolled. The default `presentation` is
 *  `adaptive-native`: fine pointers get the typed field + calendar popover,
 *  coarse pointers the platform picker (web) or the self-drawn sheet
 *  (native).
 *
 * @example
 * ```tsx
 * import { DateInput } from '@octane-xplat/ui'
 *
 * <DateInput label="Due" value={due} onChange={setDue} min="2026-01-01" hasClear />
 * ```
 * @see CalendarProps, DateRangeInputProps, InputPresentation.
 */
export interface DateInputProps extends FieldControlProps, DateLocaleProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Accessible name for the date field. */
	accessibilityLabel?: string
	/** Describes the calendar interaction; announced after the label. */
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value?: ISODateString | null
	/** Fires with the ISO date on commit; `null` when cleared. */
	onChange?: (value: ISODateString | null) => void
	/** Async follow-up after `onChange`; the field stays busy until it
	 *  resolves. */
	changeAction?: (value: ISODateString | null) => void | Promise<void>
	/** Earliest selectable date (inclusive, ISO). */
	min?: ISODateString
	/** Latest selectable date (inclusive, ISO). */
	max?: ISODateString
	/** Extra predicates — a date failing any is unselectable. */
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>
	/** Closed-value format — a named shared format or a mapper from ISO.
	 *  @default 'date_long' */
	format?: DateInputFormat | ((iso: ISODateString) => string)
	/** Shows a clear button that empties the field. */
	hasClear?: boolean
	/** Focuses the field on mount. */
	hasAutoFocus?: boolean
	/** Picker surface — popover calendar vs inline/native presentation. */
	presentation?: DateInputPresentation
	/** Text shown while the field is empty. */
	placeholder?: string
	/** Exposes the imperative handle through a standard Octane ref; cleared on unmount. */
	ref?: Octane.Ref<TextInputHandle>
	/** Calendar popover pane count. Ignored by the `native` surface.
	 *  @default 1 */
	numberOfMonths?: 1 | 2
	/** First weekday column in the calendar grid. */
	weekStartsOn?: DayOfWeek | DayOfWeekName
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Wall-clock time entry (`ISOTimeString`, `HH:MM[:SS]`). `null` is the
 *  explicit empty value; omitting `value` leaves the field uncontrolled.
 *  `hasSeconds` adds a seconds segment, `increment` is the arrow-key minute
 *  step, and `presentation` picks the surface — including `'text-input'` for
 *  typed entry with no picker.
 *
 * @example
 * ```tsx
 * import { TimeInput } from '@octane-xplat/ui'
 *
 * <TimeInput label="Starts" value={start} onChange={setStart} increment={15} />
 * ```
 * @see DateInputProps, InputPresentation.
 */
export interface TimeInputProps extends FieldControlProps, DateLocaleProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Accessible name for the time field. */
	accessibilityLabel?: string
	/** Describes the picker interaction; announced after the label. */
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value?: ISOTimeString | null
	/** Fires with the ISO time on commit; `null` when cleared. */
	onChange?: (value: ISOTimeString | null) => void
	/** Async commit hook — may return a Promise the control awaits before settling. */
	changeAction?: (value: ISOTimeString | null) => void | Promise<void>
	/** Earliest selectable time (ISO). */
	min?: ISOTimeString
	/** Latest selectable time (ISO). */
	max?: ISOTimeString
	/** Include a seconds segment. @default false */
	hasSeconds?: boolean
	/** Shows a clear button that empties the field. */
	hasClear?: boolean
	/** Focuses the field on mount. */
	hasAutoFocus?: boolean
	/** Display format of the closed field. @default '12h' */
	hourFormat?: TimeInputHourFormat
	/** Arrow-key / stepper minute increment. @default 1 */
	increment?: number
	/** @default 'adaptive-native' */
	presentation?: TimeInputPresentation
	/** Text shown while the field is empty. */
	placeholder?: string
	/** Exposes the imperative handle through a standard Octane ref; cleared on unmount. */
	ref?: Octane.Ref<TextInputHandle>
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Date and time under one label — a date segment and a time segment whose
 *  commits combine into the local `ISODateTimeString` value. `null` is the
 *  explicit empty value; omitting `value` leaves it uncontrolled.
 *
 * @example
 * ```tsx
 * import { DateTimeInput } from '@octane-xplat/ui'
 *
 * <DateTimeInput label="Starts at" value={startsAt} onChange={setStartsAt} timeOptionInterval={15} />
 * ```
 * @see DateInputProps, TimeInputProps.
 */
export interface DateTimeInputProps extends FieldControlProps, DateLocaleProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Accessible name for the date-time field. */
	accessibilityLabel?: string
	/** Describes the picker interaction; announced after the label. */
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value?: ISODateTimeString | null
	/** Fires with the ISO date-time on commit; `null` when cleared. */
	onChange: (value: ISODateTimeString | null) => void
	/** Async commit hook — may return a Promise the control awaits before settling. */
	changeAction?: (value: ISODateTimeString | null) => void | Promise<void>
	/** Earliest selectable local date-time — constrains the calendar and (when
	 *  the picked day equals `min`'s day) the time segment. */
	min?: ISODateTimeString
	/** Latest selectable local date-time. */
	max?: ISODateTimeString
	/** Extra predicates — a date failing any is unselectable. */
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>
	/** Includes a seconds segment in the time part. */
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
	/** Shows a clear button that empties the field. */
	hasClear?: boolean
	/** Text shown while the field is empty. */
	placeholder?: string
	/** Time segment placeholder. @default "Select a time" */
	timePlaceholder?: string
	/** Accessible name of the time segment. @default `${label} time` */
	timeLabel?: string
	/** @default 'adaptive-native' */
	presentation?: DateTimeInputPresentation
	/** Exposes the imperative handle through a standard Octane ref; cleared on unmount. */
	ref?: Octane.Ref<TextInputHandle>
	/** Calendar pane count on the popover/sheet surface. @default 1 */
	numberOfMonths?: 1 | 2
	/** First weekday column in the calendar grid. */
	weekStartsOn?: DayOfWeek | DayOfWeekName
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Trigger + range calendar. Always controlled: `value` is the committed
 *  range or null, `onChange` reports commits and clears.
 *
 * @example
 * ```tsx
 * import { DateRangeInput } from '@octane-xplat/ui'
 *
 * <DateRangeInput label="Trip" value={trip} onChange={setTrip} />
 * ```
 * @see DateRange, DateRangePreset, CalendarProps.
 */
export interface DateRangeInputProps extends FieldControlProps, DateLocaleProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Accessible name for the range field. */
	accessibilityLabel?: string
	/** Describes the picker interaction; announced after the label. */
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value: DateRange | null
	/** Fires with the committed range; `null` when cleared. */
	onChange: (value: DateRange | null) => void
	/** Async commit hook — may return a Promise the control awaits before settling. */
	changeAction?: (value: DateRange | null) => void | Promise<void>
	/** Earliest selectable date (inclusive, ISO). */
	min?: ISODateString
	/** Latest selectable date (inclusive, ISO). */
	max?: ISODateString
	/** Extra predicates — a date failing any is unselectable. */
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>
	/** Longest selectable span in days. */
	maxRangeSpan?: number
	/** Shortest selectable span in days. */
	minRangeSpan?: number
	/** Quick ranges beside the calendar. Invalid endpoint/span selections
	 *  are disabled; an accepted preset closes the picker. */
	presets?: ReadonlyArray<DateRangePreset>
	/** @default true */
	hasClear?: boolean
	/** Text shown while the field is empty. */
	placeholder?: string
	/** @default 2 */
	numberOfMonths?: 1 | 2
	/** First weekday column in the calendar grid. */
	weekStartsOn?: DayOfWeek | DayOfWeekName
	/** Exposes the imperative handle through a standard Octane ref; cleared on unmount. */
	ref?: Octane.Ref<TextInputHandle>
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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
	/** The data item currently in the viewport. */
	item: T
	/** Index of the item in the data array. */
	index: number
}

/** A change to the set of rows that meet the configured viewability rules. */
export interface ListViewabilityChange<T = unknown> extends ListVisibleItem<T> {
	/** Whether the item crossed into viewability (true) or out of it. */
	isViewable: boolean
}

/** Current viewable rows and the rows that entered or left in this update.
 *  Both arrays are ordered by data index. */
export interface ListViewabilityInfo<T = unknown> {
	/** Snapshot of items meeting the viewability threshold. */
	viewableItems: readonly ListVisibleItem<T>[]
	/** Items whose viewability flipped since the last report. */
	changed: readonly ListViewabilityChange<T>[]
}

/** Percentage of each row that must intersect the list viewport and how
 *  long it must remain visible before it is reported. Defaults match the
 *  NativeScript feed contract: 50 percent for 250 milliseconds. */
export interface ListViewabilityConfig {
	/** Percent of the item that must be visible to count (0–100). */
	itemVisiblePercentThreshold?: number
	/** Dwell time in ms before a visible item counts as viewable. */
	minimumViewTime?: number
}

/** Imperative operations exposed by `UITableView` and `RecyclerView`. */
export interface PlatformListHandle {
	/** Scroll to a valid item index. Invalid or unavailable indexes are no-ops. */
	scrollToIndex(index: number, options?: { /** Animates the scroll. */ animated?: boolean }): void
}

/** Props for platform-authentic list widgets (`UITableView`/`RecyclerView`).
 *  Shared content `List` has its own `ListProps` below.
 *
 * @example
 * ```tsx
 * import { UITableView } from '@octane-xplat/ui/ios'
 * import { Item } from '@octane-xplat/ui'
 *
 * <UITableView items={rows} renderItem={(row) => <Item>{row.name}</Item>} onRefresh={reload} refreshing={reloading} />
 * ```
 * @see VirtualListProps for the shared virtualized list.
 */
export interface PlatformListProps<T = unknown> extends RefreshProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Data array rendered through `renderItem`. */
	items: T[]
	/** Renders one row; called per visible item. */
	renderItem: (item: T, index: number) => Renderable
	/** Rendered when `items` is empty. */
	renderEmpty?: () => Renderable
	/** Ref to a platform-neutral list handle. It is cleared on unmount. */
	ref?: Octane.Ref<PlatformListHandle>
	/** Initial row to scroll to after the list mounts. Invalid indexes are
	 *  ignored. */
	initialScrollIndex?: number
	/** Rows crossing the threshold and dwell time are reported by logical data
	 *  index, not by recycled native cell identity. */
	viewabilityConfig?: ListViewabilityConfig
	/** Fires when the viewable set changes, honoring the configured thresholds. */
	onViewableItemsChanged?: (info: ListViewabilityInfo<T>) => void
	/** iOS row-height estimate (UITableView only). */
	estimatedItemHeight?: number
	/** Called when the list approaches its end. */
	onEndReached?: () => void
	/** Platform escape hatches, applied after the shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Props accepted by `UITableView` (`@octane-xplat/ui/ios`). */
export type UITableViewProps<T = unknown> = PlatformWidgetProps<PlatformListProps<T>>
/** Handle exposed by `UITableView`'s `ref` (`@octane-xplat/ui/ios`). */
export type UITableViewHandle = PlatformListHandle
/** Props accepted by `RecyclerView` (`@octane-xplat/ui/android`). */
export type RecyclerViewProps<T = unknown> = PlatformWidgetProps<PlatformListProps<T>>
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
	| { /** Keyboard-scroll ownership marker — the content element. */ owner: 'content' }
	| {
			/** Keyboard-scroll ownership marker — the viewport element. */
			owner: 'viewport'
			/** Accessible label for the scrollable region. */
			label: string
			/** ARIA role for the scroll region element. */
			role?: 'group' | 'region'
	  }
	| {
			/** Keyboard-scroll ownership marker — either element. */
			owner: 'contentOrViewport'
			/** Accessible label for the scrollable region. */
			label: string
			/** ARIA role for the scroll region element. */
			role?: 'group' | 'region'
	  }

/** Live per-axis overflow/edge state — `isScrollable`, `atStart`, `atEnd`. Part of `ScrollableAreaState`.
 */
export interface ScrollAxisState {
	/** The axis currently overflows its viewport on an allowed axis. */
	isScrollable: boolean
	/** The viewport is at the axis's start edge (or the axis is not scrollable). */
	atStart: boolean
	/** The viewport is at the axis's end edge (or the axis is not scrollable). */
	atEnd: boolean
}

/** Live scroll state of a `ScrollableArea` viewport, keyed by logical axis (`inline`/`block`). Returned by `useScrollableArea` and readable for edge effects or scroll-affordance UI.
 */
export interface ScrollableAreaState {
	/** Scroll metrics for the inline axis (horizontal in LTR). */
	inline: ScrollAxisState
	/** Scroll metrics for the block axis (vertical). */
	block: ScrollAxisState
}

/** Options for `useScrollableArea` — allowed logical `axis` (default `'block'`), `overscroll` chaining, `stickyContainment`, and web-only `keyboardAccess` tab-stop ownership.
 */
export interface UseScrollableAreaOptions {
	/** Logical axis or axes where scrolling is allowed. @default 'block' */
	axis?: ScrollAxis
	/** Keyboard/tab-stop ownership. Web only. */
	keyboardAccess?: ScrollKeyboardAccess
	/** Overscroll behavior at content edges (contain/none/auto semantics). */
	overscroll?: ScrollOverscroll
	/** How sticky children are contained within the scroll viewport. */
	stickyContainment?: ScrollStickyContainment
}

/** Props returned for the viewport box by `useScrollableArea`.
 *  `TElement` identifies the host receiving the composed ref and defaults to
 *  `HostElement` when the caller does not need host-specific ref typing. */
export interface UseScrollableAreaViewportProps<TElement extends object = object> {
	/** Attach to the viewport element — the measured scroll container. */
	ref: Octane.Ref<TElement>
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Scroll-event handler invoked by the hook's internal binding. */
	onScroll?: ScrollableAreaEventHandler
	/** Layout-change handler (resize/remeasure) invoked by the hook. */
	onLayoutChanged?: ScrollableAreaEventHandler
	/** ARIA role for the scroll region. */
	role?: string
	/** Accessible label for the scroll region (web). */
	'aria-label'?: string
	/** Tab order for keyboard scrolling (usually 0). */
	tabIndex?: number
	/** Scrollable axis — horizontal, vertical, or both. */
	orientation?: 'horizontal' | 'vertical' | 'both'
	/** Marker attribute enabling horizontal scrolling. */
	'data-scrollable-x'?: boolean
	/** Marker attribute enabling vertical scrolling. */
	'data-scrollable-y'?: boolean
	/** Marker attribute — scrolled to the horizontal start. */
	'data-at-start-x'?: boolean
	/** Marker attribute — scrolled to the horizontal end. */
	'data-at-end-x'?: boolean
	/** Marker attribute — scrolled to the vertical start. */
	'data-at-start-y'?: boolean
	/** Marker attribute — scrolled to the vertical end. */
	'data-at-end-y'?: boolean
	/** Marker attribute recording the sticky-containment mode. */
	'data-sticky-containment'?: string
}

/** Props returned for the observed content box by `useScrollableArea`. */
export interface UseScrollableAreaContentProps<TElement extends object = object> {
	/** Attach to the content element — the measured scrollable child. */
	ref: Octane.Ref<TElement>
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Layout-change handler invoked when content resizes. */
	onLayoutChanged?: ScrollableAreaEventHandler
	/** ARIA role for the content wrapper. */
	role?: string
	/** Accessible label for the content wrapper (web). */
	'aria-label'?: string
	/** Tab order for the content element. */
	tabIndex?: number
}

/** `useScrollableArea` result — the getters merge behavior-owned props into
 *  each box and preserve any additional caller props. `TElement` lets a
 *  platform leaf or consumer specify the host receiving each composed ref.
 *
 * @example
 * ```tsx
 * import { useScrollableArea } from '@octane-xplat/ui'
 *
 * const area = useScrollableArea<HTMLElement>({ axis: 'block' })
 * const content = <span>Scrollable content</span>
 * <div {...area.getViewportProps()}>
 * 	<div {...area.getContentProps()}>{content}</div>
 * </div>
 * ```
 */
export interface UseScrollableAreaResult<TElement extends object = object> {
	/** Merges behavior-owned props (ref/role/tabIndex/overflow/data attrs)
	 *  into caller props for the viewport element or native scroll view. */
	getViewportProps<P extends object = {}>(
		/** Extra props merged onto the viewport element. */
		props?: P & Partial<UseScrollableAreaViewportProps<TElement>>,
	): Omit<P, keyof UseScrollableAreaViewportProps<TElement>> &
		UseScrollableAreaViewportProps<TElement>
	/** Merges the observed-content marker + ref into the content box props. */
	getContentProps<P extends object = {}>(
		/** Extra props merged onto the content element. */
		props?: P & Partial<UseScrollableAreaContentProps<TElement>>,
	): Omit<P, keyof UseScrollableAreaContentProps<TElement>> &
		UseScrollableAreaContentProps<TElement>
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
	 *  platform's scroll animation where the leaf provides one. Mason iOS
	 *  currently writes instantly even when animated is true. */
	scrollToOffset(
		/** Target scroll offset per logical axis. */
		offset: {
			/** Offset on the inline axis. */
			inline?: number
			/** Offset on the block axis. */
			block?: number
		},
		/** Scroll behavior options (`animated` smooth-scrolls). */
		options?: { /** Smooth-scrolls instead of jumping. */ animated?: boolean },
	): void
	/** The platform scroll viewport (`HTMLElement`, Mason `Scroll` on
	 *  iOS/Android/Windows, or AppKit `NSScrollView`). Mason does not expose
	 *  NativeScript ScrollView's offset methods; prefer scrollToOffset.
	 *  This escape hatch covers behavior outside the shared contract. */
	native: HostElement
}

/** A native scroll viewport with axis-aware accessibility (Astryx
 *  `ScrollableArea`). The root is the scroll container; children render
 *  inside a content box. Pull-to-refresh props (`refreshing`, `onRefresh`,
 *  `refreshThreshold`) are an xplat extension with no upstream equivalent —
 *  they only apply on the block axis on web/iOS/Android. macOS does not
 *  support pull-to-refresh; use an app-owned refresh action.
 *
 * @example
 * ```tsx
 * import { ScrollableArea } from '@octane-xplat/ui'
 *
 * <ScrollableArea axis="block" refreshing={reloading} onRefresh={reload}>
 * 	{rows}
 * </ScrollableArea>
 * ```
 * @see VirtualListProps for keyed virtualized content, useScrollableArea for the hook form.
 */
export interface ScrollableAreaProps
	extends LayoutChildProps, AccessibilityProps, RefreshProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Logical axis or axes where scrolling is allowed. @default 'block' */
	axis?: ScrollAxis
	/** Accessible name for the viewport; used as the scroll region's label
	 *  (web `aria-label`, native `accessibilityLabel`). */
	label?: string
	/** Semantics for the named scroll viewport. Web emits ARIA `role`;
	 *  native has no group/region role and ignores this. @default 'group' */
	role?: 'group' | 'region'
	/** Overscroll behavior at content edges. */
	overscroll?: ScrollOverscroll
	/** Viewport sizing; numbers are CSS px on web, dips on mobile, points on macOS. */
	width?: number | string
	/** Viewport height — number is DIPs, string is a CSS length. */
	height?: number | string
	/** Maximum viewport width. */
	maxWidth?: number | string
	/** Minimum viewport height. */
	minHeight?: number | string
	/** How sticky children are contained within the viewport. */
	stickyContainment?: ScrollStickyContainment
	/** Content padding on every edge, in spacing steps (1 step = 4px/dip). */
	padding?: number
	/** Uniform inline-axis padding inside the viewport. */
	paddingInline?: number
	/** Start-edge inline padding; resolves against writing direction. */
	paddingInlineStart?: number
	/** End-edge inline padding; resolves against writing direction. */
	paddingInlineEnd?: number
	/** Uniform block-axis padding inside the viewport. */
	paddingBlock?: number
	/** Top block-edge padding. */
	paddingBlockStart?: number
	/** Bottom block-edge padding. */
	paddingBlockEnd?: number
	/** Web only: escape inherited container padding on the viewport's block
	 *  edges via negative margins. Inert on native. @default false */
	isFullBleed?: boolean
	/** Ref to a portable `ScrollableAreaHandle` — logical-axis scrolling plus
	 *  `native` for the raw platform viewport. It is cleared on unmount. */
	ref?: Octane.Ref<ScrollableAreaHandle>
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Options accepted by the `VirtualList` key/index seeks. */
export interface VirtualListScrollOptions {
	/** Animates the scroll instead of jumping. */
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
	scrollToOffset(
		offset: number,
		options?: { /** Animates the scroll instead of jumping. */ animated?: boolean },
	): void
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
	native: HostElement
}

/** Shared virtualized vertical list. Item keys must be unique and stable
 *  across inserts and reorders. Rows outside the rendered window unmount;
 *  keep durable row state keyed by item identity outside the row component.
 *
 * @example
 * ```tsx
 * import { VirtualList, ListItem } from '@octane-xplat/ui'
 *
 * <VirtualList items={items} renderItem={(item) => <ListItem label={item.name} />} />
 * ```
 * @see VirtualListHandle for scroll seeks, ListProps for a non-virtualized list.
 */
export interface VirtualListProps<T = unknown>
	extends LayoutChildProps, AccessibilityProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Ref to a platform-neutral scroll handle. It is cleared on unmount. */
	ref?: Octane.Ref<VirtualListHandle>
	/** Data array rendered through `renderItem`. */
	items: readonly T[]
	/** Returns each item's stable `Key`; must be unique and survive reorder.
	 *  Defaults to `defaultItemKey` — the item's `id` or `key` property;
	 *  items without either throw instead of guessing a positional key. */
	keyExtractor?: (item: T, index: number) => Key
	/** Recycling key — items sharing a type reuse host elements; defaults to index. */
	getItemType?: (item: T, index: number) => Key
	/** Renders one row; called per visible item plus overscan. */
	renderItem: (item: T, index: number) => Renderable
	/** Rendered when `items` is empty. */
	renderEmpty?: () => Renderable
	/** Static content above the item rows. */
	renderHeader?: () => Renderable
	/** Static content below the item rows. */
	renderFooter?: () => Renderable
	/** Content rendered between rows (not before the first or after the last). */
	renderSeparator?: () => Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Imperative handle on `WebView` — `reload`, frame-local `goBack`/`goForward`, `stopLoading`, and `native` for the raw platform view.
 */
export interface WebViewHandle {
	/** Re-request the current document. */
	reload(): void
	/** Frame-local history navigation. */
	goBack(): void
	/** Navigates forward in the webview history. */
	goForward(): void
	/** Aborts the in-flight page load. */
	stopLoading(): void
	/** The platform view (`HTMLIFrameElement` / NS `WebView` / AppKit `WKWebView`). */
	native: HostElement
}

/** Payload for `WebView`'s `onLoad`/`onError` — `url` where the platform reports one (absent for `html` documents); `error` only on the failure path.
 */
export interface WebViewLoadEvent {
	/** The loaded document URL when the platform reports one — absent for
	 *  `html` documents. */
	url?: string
	/** Failure description; present only on the `onError` path. */
	error?: string
}

/** Document size reported to `WebView.onLayoutContent` — CSS px on web, dips/points on native.
 */
export interface WebViewContentSize {
	/** Measured content width in CSS px. */
	width: number
	/** Measured content height in CSS px. */
	height: number
}

/** Payload for `WebView`'s `onMessage` — `data` is the JSON-serializable
 *  value the embedded document passed to `postToHost`; `url`/`origin`
 *  report the sender where the platform exposes them.
 */
export interface WebViewMessageEvent {
	/** The value the embedded document posted — a JSON-serializable value. */
	data: unknown
	/** The document URL where the platform reports one — absent for `html`
	 *  documents. */
	url?: string
	/** Sender origin — the browser `message` event's `event.origin`
	 *  (`'null'` for opaque origins); unavailable on native transports. */
	origin?: string
}

interface WebViewBaseProps extends LayoutChildProps, AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** Embedded document → host events. The page posts with `postToHost`
	 *  from `@octane-xplat/ui`; payloads are JSON-serializable values —
	 *  ordered, at-least-once, no reply. Intended for trusted/app-embedded
	 *  content: `origin`/`data` validation stays with the app. Native
	 *  delivery is poll-drained (~200 ms) since WKScriptMessageHandler
	 *  cannot be registered from JS on the NS WKWebView; browser frames
	 *  deliver through `postMessage`. */
	onMessage?: (e: WebViewMessageEvent) => void
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
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Embedded web document — hosted bucket: web renders a sandboxed
 *  `<iframe>`, native renders the OS web view (`webview` → WKWebView /
 *  android.webkit.WebView). The *frame* is normalized; the document's
 *  pixels belong to each platform's engine, same as TextInput's IME.
 *  Page→host messaging is the bounded `onMessage`/`postToHost` contract —
 *  one page-side function over per-engine transports — not a general JS
 *  bridge; richer seams still go through the escape bags.
 *
 *  Exactly one source is required: `src` or `html`.
 *
 * @example
 * ```tsx
 * import { WebView } from '@octane-xplat/ui'
 *
 * <WebView src="https://example.com" onError={(e) => report(e.error)} />
 * ```
 * @see WebViewHandle.
 */
export type WebViewProps = WebViewBaseProps &
	(
		| {
				/** Remote document URL. Native also accepts `~/` bundle paths and
				 *  absolute file paths (NS `src` grammar). AppKit resolves `~/`
				 *  relative to the app bundle resources and permits reads in the
				 *  file's directory. */
				src: string
				/** Unused with `src` — the two content sources are exclusive. */
				html?: never
		  }
		| {
				/** Inline HTML document — web `srcdoc`; native loads it through
				 *  the `src` property's data path
				 *  (`loadHTMLString`/`loadDataWithBaseURL`). Treated as trusted
				 *  content — the default web sandbox keeps `allow-same-origin`,
				 *  so a srcdoc document can reach the embedding page. */
				html: string
				/** Unused with `html` — the two content sources are exclusive. */
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
	/** Image URL or asset specifier. */
	uri: string
	/** Intrinsic image width for layout before load. */
	width?: number
	/** Intrinsic image height for layout before load. */
	height?: number
	/** Pixel-density multiplier for the asset. */
	scale?: number
}

/** How the bitmap is sized inside the element's box — the CSS `object-fit`
 *  vocabulary (same contract as expo-image `contentFit`). Default 'cover'. */
export type ImageContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'

/** One edge value in a `contentPosition`: dips from the named edge, a
 *  percentage of the free space along that axis, or 'center' (= '50%'). */
export type ImageContentPositionValue = number | `${number}%` | 'center'

/** Object form of `Image.contentPosition` — name one horizontal and one vertical edge with a dip or percentage offset.
 */
export interface ImageContentPositionObject {
	/** Offset from the top edge (object-position). */
	top?: ImageContentPositionValue
	/** Offset from the right edge (object-position). */
	right?: ImageContentPositionValue
	/** Offset from the bottom edge (object-position). */
	bottom?: ImageContentPositionValue
	/** Offset from the left edge (object-position). */
	left?: ImageContentPositionValue
}

/** Keyword form of `Image.contentPosition` — CSS `object-position` spellings (`'center'`, `'top left'`, ...).
 */
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

/** Bitmap image (chrome-reset OS image view). `src` takes a `res://name`, `~/` bundle path, file path, URL, `data:` URI, or a resolution-qualified `ImageSourceLike[]` (closest pixel count wins — the `srcset` model). `contentFit`/`contentPosition` follow CSS `object-fit`/`object-position`; `placeholder` paints inside the same view while loading; `alt` names meaningful images (omit for decorative).
 *
 * @example
 * ```tsx
 * import { Image } from '@octane-xplat/ui'
 *
 * <Image src="https://example.com/photo.jpg" alt="Trailhead" style={{ width: 120, height: 80 }} />
 * ```
 * @see ImageSourceLike, ImageContentFit, ImageContentPosition.
 */
export interface ImageProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** A single source — `res://name`, `~/bundle-path`, file path, remote
	 *  URL, or data:/inline-SVG URI — or a resolution-qualified array
	 *  (closest pixel count wins; the `srcset` model). */
	src: string | ImageSourceLike[]
	/** Alternative text for the image — required for assistive technology; empty string marks it decorative. */
	alt?: string
	/** Placeholder shown while `src` loads — painted inside the same image
	 *  view so the swap can't blank or mismatch fit (expo-image study L5).
	 *  Accepts `blurhash:<hash>` / `thumbhash:<base64>` (decoded to a small
	 *  PNG in JS) plus any synchronously resolvable `src` grammar (`data:`
	 *  base64, `res://name`, `~/`, file path). Remote URLs are ignored on
	 *  native and macOS — a placeholder that must fetch first is pointless.
	 *  On web any `img.src` URL works (e.g. a low-res image). Ignored for
	 *  SVG srcs. */
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
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** The app-level screen shell — the native root layout overlay and sheet services mount onto (RootLayout), and the web page container. One per screen; route screens render inside it.
 *
 * @example
 * ```tsx
 * import { Screen, VStack } from '@octane-xplat/ui'
 *
 * <Screen>
 * 	<VStack padding={4}>{content}</VStack>
 * </Screen>
 * ```
 */
export interface ScreenProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
}

// ---------- device seams ----------

/** A screen edge that can carry a system safe-area inset —
 *  react-native-safe-area-context vocabulary. */
export type SafeAreaEdge = 'top' | 'right' | 'bottom' | 'left'

/** Container that consumes system safe-area insets as padding. `edges` selects which edges (default all four); each inset is consumed once — nested SafeAreas pad only for what's left, and `KeyboardAvoiding` subtracts a consumed bottom inset. `edges={[]}` makes it neutral; `ignoreSafeArea` is the deprecated spelling of that.
 *
 * @example
 * ```tsx
 * import { SafeArea } from '@octane-xplat/ui'
 *
 * <SafeArea edges={['top', 'bottom']}>{screen}</SafeArea>
 * ```
 * @see KeyboardAvoidingProps, useSafeAreaInsets.
 */
export interface SafeAreaProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Safe-area edges this container consumes as padding — defaults to all
	 *  four. Each edge's inset is consumed once: a nested `SafeArea` pads
	 *  only for what its ancestors left, and `KeyboardAvoiding` subtracts
	 *  a consumed bottom inset from the keyboard inset. `edges={[]}` makes
	 *  the wrapper neutral; `edges` wins over `ignoreSafeArea` when both
	 *  are set. */
	edges?: readonly SafeAreaEdge[]
	/** @deprecated Use `edges` — `ignoreSafeArea` is `edges={[]}`. */
	ignoreSafeArea?: boolean
	/** NativeScript props applied to the host after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
}

/** Keyboard-avoidance wrapper (shared root API, decisions #46/#69): a
 *  scrollable column that keeps its contents above the software keyboard.
 *  Mobile hosts pad only their remaining bottom overlap. Android also leases
 *  `adjustResize` for the owning Activity window while mounted; a resized
 *  host needs no duplicate keyboard padding. Safe-area space and avoidance
 *  already supplied by ancestors in the same window are consumed once.
 *  Floating/narrow keyboards do not produce full-width bottom padding.
 *  Targets without a software keyboard (web, macOS)
 *  keep the neutral column wrapper and accept `enabled`/
 *  `keyboardVerticalOffset` as inert props.
 *
 * @example
 * ```tsx
 * import { KeyboardAvoiding, ChatMessageList, ChatComposer } from '@octane-xplat/ui'
 *
 * <KeyboardAvoiding>
 * 	<ChatMessageList />
 * 	<ChatComposer />
 * </KeyboardAvoiding>
 * ```
 * @see useKeyboardInset for reading the raw inset.
 */
export interface KeyboardAvoidingProps {
	/** Underlying platform host; cleared on removal. */
	ref?: Octane.Ref<object>
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Set false to keep the layout wrapper without avoidance — no inset
	 *  subscription or Android window-resize lease runs. @default true */
	enabled?: boolean
	/** Extra dips to hold contents above the keyboard's top edge, added to
	 *  the measured inset (React Native `keyboardVerticalOffset`).
	 *  @default 0 */
	keyboardVerticalOffset?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
}

/** Options for `useKeyboardInset`. */
export interface UseKeyboardInsetOptions {
	/** Set false to read 0 without subscribing — no iOS frame observer or
	 *  Android window-resize lease runs while disabled. @default true */
	enabled?: boolean
}

/** Shared self-drawn switch — identical pixels on every target (the `Switch` parity class). Controlled `value`+`onChange`, or uncontrolled `defaultValue`; field vocabulary (`label`, `status`, `isDisabled`) via `FieldControlProps`. For the OS widget use `UISwitch`/`MaterialSwitch`.
 *
 * @example
 * ```tsx
 * import { Switch } from '@octane-xplat/ui'
 *
 * <Switch label="Notifications" value={enabled} onChange={setEnabled} />
 * ```
 * @see PlatformSwitchProps.
 */
export interface SwitchProps extends FieldControlProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Optional explicit accessible name override for the switch. */
	accessibilityLabel?: string
	/** Controlled checked state — pair with `onChange`. */
	value?: boolean
	/** Initial checked state for uncontrolled use; `value` wins when both
	 *  are set. */
	defaultValue?: boolean
	/** Called with the requested next state when the user toggles. */
	onChange?: (checked: boolean) => void
	/** Async action fired after `onChange`. While it runs the switch shows
	 *  the loading state; a rejection reverts the toggle and reports the
	 *  previous value through `onChange` again. */
	changeAction?: (checked: boolean) => void | Promise<void>
	/** Which side of the track the label column sits on. @default 'end' */
	labelPosition?: 'start' | 'end'
	/** `'hug'` keeps the label beside the track; `'spread'` pushes it to the
	 *  field's opposite edge. @default 'hug' */
	labelSpacing?: 'hug' | 'spread'
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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
 *  `Field`, not on the widget itself.
 *
 * @example
 * ```tsx
 * import { UISwitch } from '@octane-xplat/ui/ios'
 *
 * <UISwitch value={on} onChange={setOn} label="Wi-Fi" />
 * ```
 * @see SwitchProps for the self-drawn shared switch.
 */
export interface PlatformSwitchProps extends TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Controlled checked state — pair with `onChange`. */
	value?: boolean
	/** Initial checked state for uncontrolled use; `value` wins when both
	 *  are set. Without `value` the OS widget owns its state. */
	defaultValue?: boolean
	/** Called with the requested next state when the user toggles. */
	onChange?: (checked: boolean) => void
	/** Prevents toggling and applies the disabled styling. */
	isDisabled?: boolean
	/** Shows the state without allowing changes. */
	isReadOnly?: boolean
	/** Spoken name source — the platform widget renders no visible label. */
	label?: string
	/** Folded into the widget's spoken hint. */
	description?: string
	/** Appended to the spoken hint while the widget is disabled. */
	disabledMessage?: string
	/** Accessible name for the switch. */
	accessibilityLabel?: string
	/** Describes the toggled outcome; announced after the label. */
	accessibilityHint?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Props accepted by `UISwitch` (`@octane-xplat/ui/ios`). */
export type UISwitchProps = PlatformWidgetProps<PlatformSwitchProps>
/** Props accepted by `MaterialSwitch` (`@octane-xplat/ui/android`). */
export type MaterialSwitchProps = PlatformWidgetProps<PlatformSwitchProps>

/** Loading spinner — self-drawn ring with a `busy` flag (exported as `ActivityIndicator`; `Spinner` on the macOS barrel). OS-authentic forms: `UIActivityIndicatorView` (iOS), `CircularProgressIndicator` (Android).
 *
 * @example
 * ```tsx
 * import { Spinner } from '@octane-xplat/ui'
 *
 * <Spinner busy={loading} />
 * ```
 */
export interface ActivityIndicatorProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Toggles the spinning indicator; hidden when false. */
	busy?: boolean
	/** Accessible name announced when the platform exposes it. */
	accessibilityLabel?: string
	/** Named size (Astryx `Spinner size`). @default 'md' */
	size?: 'xsm' | 'sm' | 'md' | 'lg' | 'xl'
	/** Contrast shade for placement on imagery (Astryx `shade`). @default 'default' */
	shade?: 'default' | 'onMedia'
	/** Label content rendered beside/under the spinner (Astryx `label`). */
	label?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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
 *  AXLevelIndicator).
 *
 * @example
 * ```tsx
 * import { Meter } from '@octane-xplat/ui'
 *
 * <Meter value={6} maxValue={10} valueLabel="6 GB of 10 GB used" accessibilityLabel="Storage" />
 * ```
 * @see ProgressBarProps for task progress.
 */
export interface MeterProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
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
	/** Ring diameter in DIPs. */
	size?: number
	/** Ring stroke width in DIPs. */
	strokeWidth?: number
	/** Filled-arc color. */
	color?: string
	/** Unfilled-arc (track) color. */
	trackColor?: string
	/** Accessible name for the meter. */
	accessibilityLabel?: string
}

/** Value slider — `value` clamped to [`minValue`,`maxValue`] (defaults 0–100), `onValueChange` reports user changes. Web Slider supports Tab, Arrow keys (1% of the range), Home and End; disabled controls are skipped. Shared value contract for the self-drawn `Slider` and the OS widgets `UISlider`/`SeekBar`.
 *
 * @example
 * ```tsx
 * import { Slider } from '@octane-xplat/ui'
 *
 * <Slider value={volume} minValue={0} maxValue={1} onValueChange={setVolume} />
 * ```
 */
/** One labeled stop drawn on a `Slider` track (Astryx `marks`). */
export interface SliderMark {
	/** Scale position of the mark. */
	value: number
	/** Text shown at the mark. */
	label?: string
}

/** Slider — self-drawn track + thumb(s) with the shared field vocabulary.
 *  `value` is one number or a `[low, high]` range (two thumbs; upstream
 *  `SliderRangeSlider`). `formatValue` renders the readout and `marks` draw
 *  labeled stops. Web, AppKit and experimental Windows leaves render ranges,
 *  marks and formatted readouts; other native leaves retain their
 *  single-value widget subset. AppKit and Windows runtime qualification
 *  remains open; see the platform guides. */
export interface SliderProps extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Controlled value — `number` or `[low, high]` for a range. */
	value?: number | [number, number]
	/** Initial value for uncontrolled use; `value` wins when both are set. */
	defaultValue?: number | [number, number]
	/** Minimum value (default 0). */
	min?: number
	/** Maximum value (default 100). */
	max?: number
	/** @deprecated use `min` */
	minValue?: number
	/** @deprecated use `max` */
	maxValue?: number
	/** Quantization step between values. */
	step?: number
	/** Prevents interaction and applies the disabled styling. */
	disabled?: boolean
	/** Labeled stops drawn on the track. */
	marks?: SliderMark[]
	/** How the current value shows — `'text'` prints it beside the label,
	 *  `'tooltip'` shows it on the thumb, `'none'` hides it.
	 *  @default 'none' */
	valueDisplay?: 'text' | 'tooltip' | 'none'
	/** Format each numeric readout; ranges format both endpoints separately. */
	formatValue?: (value: number) => string
	/** Called while the user drags/keys — receives the new value. */
	onValueChange?: (value: number | [number, number]) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Props accepted by `UISlider` (`@octane-xplat/ui/ios`). */
export type UISliderProps = PlatformWidgetProps<SliderProps>
/** Props accepted by `SeekBar` (`@octane-xplat/ui/android`). */
export type SeekBarProps = PlatformWidgetProps<SliderProps>

/** Shared color-value contract — output hex is lowercase '#rrggbb'; input
 *  also accepts '#rgb', any case, and a missing '#'. */
export interface ColorValueProps {
	/** Controlled color. */
	value?: string
	/** Initial color for uncontrolled use. */
	defaultValue?: string
	/** Continuous changes — drag moves, keyboard steps, field commits. */
	onChange?: (hex: string) => void
	/** Committed changes — drag end, keyboard step, field commit. */
	onChangeEnd?: (hex: string) => void
	/** Prevents interaction and applies the disabled styling. */
	isDisabled?: boolean
}

export interface ColorBaseProps {
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Stable semantic automation name, independent of `id` and spoken labels. */
	testID?: string
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Accessible name for the color control. */
	accessibilityLabel?: string
}

/** Small color chip — `color` accepts the shared hex forms. */
export interface ColorSwatchProps extends ColorBaseProps {
	/** Swatch fill color. */
	color: string
	/** Swatch edge size in DIPs. */
	size?: number
}

/** 2D saturation/brightness area for the current hue — x = saturation,
 *  y = brightness (HSB). Drag is delta-based from the value at gesture
 *  start; there is no tap-to-position. */
export interface ColorAreaProps extends ColorValueProps, ColorBaseProps {}

/** Single-channel slider. `hue` is the documented channel subset for v1. */
export interface ColorSliderProps extends ColorValueProps, ColorBaseProps {
	/** Color channel the slider edits (currently `hue` only). */
	channel: 'hue'
}

/** Hex text field — commits on submit/blur; invalid input restores the
 *  current value. */
export interface ColorFieldProps extends ColorValueProps, ColorBaseProps {
	/** Channel label shown beside the field. */
	label?: string
}

/** Fixed composite picker — ColorArea + hue ColorSlider + a row of
 *  ColorSwatch and ColorField. React Aria's children-composition picker is
 *  deferred. */
export interface ColorPickerProps extends ColorValueProps, ColorBaseProps {}

/** Identifiers of the framework-provided icons — registered automatically
 *  and used by built-in affordances (search/clear glyphs, disclosure and
 *  navigation chevrons, transport and status marks). An app registering
 *  the same name overrides the bundled glyph. */
export type BuiltinIconName =
	| 'xplat-arrow-down'
	| 'xplat-arrow-up'
	| 'xplat-arrows-up-down'
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
	| 'xplat-funnel'
	| 'xplat-info'
	| 'xplat-mic'
	| 'xplat-more-horizontal'
	| 'xplat-pause'
	| 'xplat-play'
	| 'xplat-search'
	| 'xplat-send'
	| 'xplat-stop'
	| 'xplat-success'
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

/** A registered icon glyph — `name` is a built-in `xplat-*` id or an app-registered `IconName`. Unregistered names render nothing. `size` (dips) and `color` style the glyph; `accessibilityLabel` makes a meaningful icon audible (omit for decorative). `registry` overrides the lookup scope — prefer `IconRegistryProvider` for groups.
 *
 * @example
 * ```tsx
 * import { Icon } from '@octane-xplat/ui'
 *
 * <Icon name="xplat-search" size={16} />
 * ```
 * @see IconRegistry, IconGlyph, IconName.
 */
export interface IconProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Registered icon identifier — a built-in `xplat-*` name or a name
	 *  registered through `registerIcon`/`registerIcons`. An unregistered
	 *  name renders nothing. */
	name: IconName
	/** Override the registry for this icon. Use IconRegistryProvider to scope
	 *  several icons and components to one registry. */
	registry?: IconRegistry
	/** Glyph size in DIPs. */
	size?: number
	/** Glyph color. */
	color?: string
	/** Accessible name — set it when the icon carries meaning on its own.
	 *  Omitted keeps the glyph decorative (hidden from assistive tech). */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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
	/** Raw SVG source for the glyph. */
	svg?: string
	/** Pre-rendered markup alternative. */
	markup?: string
	/** SVG viewBox used to scale the glyph. */
	viewBox?: string
	/** Text-glyph content when the icon is a font/codepoint glyph. */
	text?: string
	/** Font family + codepoint for font-based glyphs. */
	font?: {
		/** Font family containing the glyph. */
		family: string
		/** Codepoint/ligature within the font. */
		glyph: string
	}
	/** Raster/vector asset URL for image glyphs. */
	src?: string
}

/** Mutable icon lookup scope. Each registry starts with the framework glyphs. */
export interface IconRegistry {
	/** Registers one glyph under `name`. */
	registerIcon(name: string, glyph: IconGlyph): void
	/** Registers a name→glyph map at once. */
	registerIcons(record: Record<string, IconGlyph>): void
	/** Looks up a registered glyph; undefined when unregistered. */
	getIcon(name: string): IconGlyph | undefined
}

/** Provides an `IconRegistry` to descendant `Icon`s and icon-reading controls — scope app icon sets without touching the global registry.
 *
 * @example
 * ```tsx
 * import { IconRegistryProvider, createIconRegistry } from '@octane-xplat/ui'
 *
 * const icons = createIconRegistry()
 * <IconRegistryProvider value={icons}>{app}</IconRegistryProvider>
 * ```
 */
export interface IconRegistryProviderProps {
	/** Registry instance made available to descendant Icons. */
	value: IconRegistry
	/** Content rendered inside the element. */
	children?: Renderable
}

/** Semantic section heading — `level` (1–6) is the semantic level and selects the
 *  Astryx `--text-heading-<level>-*` scale (size/weight/leading); `type` swaps in
 *  the display scale instead. Web renders `h1`–`h6`; native reports the `header`
 *  accessibility trait.
 *
 * @example
 * ```tsx
 * import { Heading } from '@octane-xplat/ui'
 *
 * <Heading level={2}>Details</Heading>
 * <Heading level={1} type="display-1">Hero</Heading>
 * ```
 * @see TextProps.
 */
export interface HeadingProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Semantic heading level 1–6 (h1–h6). */
	level?: 1 | 2 | 3 | 4 | 5 | 6
	/** Display-scale visual override; `level` still owns semantics. */
	type?: HeadingType
	/** Theme text color token. */
	color?: TextColor
	/** Font weight override. */
	weight?: TextWeight
	/** Line cap before ellipsis truncation; 0/unset = no truncation. */
	maxLines?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ---------- overlays ----------

/** Low-level layer — a dimmed, dismissible surface over the screen (`open`/`defaultOpen`/`onDismiss`, `shadeCover` for the tap-to-dismiss shade). `Dialog` is the complete modal path; use `Overlay` when building a custom modal surface.
 *
 * @example
 * ```tsx
 * import { Overlay, Card } from '@octane-xplat/ui'
 *
 * <Overlay open={open} onDismiss={() => setOpen(false)} shadeCover>
 * 	<Card>{content}</Card>
 * </Overlay>
 * ```
 * @see DialogProps, PopoverProps.
 */
export interface OverlayProps extends TestIDProps {
	/** Web modal title element IDs, separated by spaces. Overrides the literal
	 * accessibilityLabel on web. Native hosts use accessibilityLabel instead. */
	accessibilityLabelledBy?: string
	/** Web modal description element IDs, separated by spaces. Native hosts
	 * do not implement DOM ID-based description associations. */
	accessibilityDescribedBy?: string
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
	/** Makes the overlay a modal layer without a shade: web focus isolation
	 *  and Escape dismissal, Android back dismissal, and iOS modal
	 *  accessibility. `shadeCover` implies this. macOS ignores it. */
	isModal?: boolean
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Side of the anchor the popover opens on — `'top' | 'bottom' | 'left' | 'right'`.
 */
export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'
/** Cross-axis alignment for anchored layers — 'start' (the historical
 *  default) keeps the panel flush with the anchor's start edge.
 */
export type PopoverAlignment = 'start' | 'center' | 'end'

/** A platform-neutral ref to the host view or element that owns a popover. */
export interface PopoverAnchorRef {
	/** The measured anchor host; set by the trigger binding. */
	readonly current: unknown
}

/** Anchored floating panel — `anchor` is a ref to the owning host (commonly a `ref` on a View); `open`/`defaultOpen`/`onDismiss` own visibility, `placement`/`alignment`/`offset` position it (offset in dips, default 8). `dismissOnOutsideTap`/`dismissOnEscape` control light-dismiss; `finalFocusRef` picks the focus-return target. For the hook form with render props use `useLayer`.
 *
 * @example
 * ```tsx
 * import { Popover, Button } from '@octane-xplat/ui'
 *
 * const anchor = useRef()
 * <>
 * 	<Button ref={anchor} label="Filter" />
 * 	<Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)} placement="bottom">
 * 		{panel}
 * 	</Popover>
 * </>
 * ```
 * @see PopoverAnchorRef, useLayer, HoverCardProps.
 */
export interface PopoverProps {
	/** Ref to a native view or web element, commonly populated by `ref`. */
	anchor: PopoverAnchorRef
	/** Controlled visibility — pair with `onDismiss`. */
	open?: boolean
	/** Initial visibility for uncontrolled use; `open` wins when both are
	 *  set. Uncontrolled dismissal closes the popover itself. */
	defaultOpen?: boolean
	/** Preferred side/alignment of the popover relative to its anchor. */
	placement?: PopoverPlacement
	/** Cross-axis alignment within the placement. @default 'start' */
	alignment?: PopoverAlignment
	/** Clearance in dips/px; web also resolves CSS lengths. Native accepts numbers or px strings. @default 8 */
	offset?: number | string
	/** Dismisses when the user taps outside the popover. */
	dismissOnOutsideTap?: boolean
	/** Escape requests dismissal when this is the top layer. False blocks
	 *  Escape from reaching a layer below. @default true */
	dismissOnEscape?: boolean
	/** Return target when popover content received focus (web), or an explicit
	 *  native focus target. Defaults to the anchor on web. */
	finalFocusRef?: { /** Live slot for the host element; null before mount or after unmount. */ current: HostElement | null }
	/** Fires when the popover requests dismissal (outside tap/Escape). */
	onDismiss?: () => void
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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
	/** `context` positions the layer relative to its anchor context. */
	mode: 'context'
	/** Accepted for API parity: layers always mount content only while open,
	 *  so the flag is a no-op in this implementation. */
	lazyMount?: boolean
}

/** `useLayer` options for manual x/y positioning (Astryx fixed mode). */
export interface FixedLayerOptions extends LayerBaseOptions {
	/** `fixed` positions the layer at explicit coordinates. */
	mode: 'fixed'
}

/** `useLayer` options — `mode: 'context'` positions relative to a bound anchor (`ContextLayerOptions`), `mode: 'fixed'` positions at explicit coordinates (`FixedLayerOptions`).
 */
export type LayerOptions = ContextLayerOptions | FixedLayerOptions

/** Render props for `useLayer` context mode — `render(children, props)`. */
export interface ContextRenderProps {
	/** Focus return target; defaults to the anchor on web. */
	finalFocusRef?: { /** Live slot for the host element; null before mount or after unmount. */ current: HostElement | null }
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
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Render props for `useLayer` fixed mode — `render(children, {x, y})`.
 *  Coordinates are viewport px on web, page dips on native, and top-left-origin
 *  AppKit points on macOS. */
export interface FixedRenderProps {
	/** X coordinate in DIPs for the layer. */
	x: number
	/** Y coordinate in DIPs for the layer. */
	y: number
	/** Accessible name for the layer surface. */
	accessibilityLabel?: string
	/** ARIA role for the layer surface. */
	accessibilityRole?: string
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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

/** `useLayer` result — `ContextLayerReturn` for anchor-relative mode (bind `ref` to the anchor, `render` content into the layer), `FixedLayerReturn` for fixed coordinates.
 */
export type LayerReturn = ContextLayerReturn | FixedLayerReturn

// ---------- LayerProvider (Astryx `LayerProvider`) ----------

/** Toast configuration carried by `LayerProvider` — the same fields
 *  `ToastViewport` accepts, forwarded to the provider-mounted stack. */
export interface LayerToastConfig {
	/** Edge the toast stack anchors to. @default 'bottomEnd' */
	position?: ToastPosition
	/** Maximum number of visible toasts; older entries evict. @default 5 */
	maxVisible?: number
	/** Extra inset from the safe-area-aware edge gutter. */
	inset?: {
		/** Top inset in DIPs. */
		top?: number
		/** Bottom inset in DIPs. */
		bottom?: number
		/** Inline-start inset. */
		start?: number
		/** Inline-end inset. */
		end?: number
	}
}

/** Value published by `LayerProvider` — read with `useLayerContext`. */
export interface LayerContextValue {
	/** Resolved toast configuration for the provider-mounted viewport. */
	toastConfig: LayerToastConfig
	/** Distinguishes a real provider from the no-provider fallback. */
	isProvider: true
}

/** App-level provider for layer systems (Astryx `LayerProvider`) — mounts a
 *  `ToastViewport` configured by `toast` around `children` so `useToast()`/
 *  `showToast()` calls anywhere in the subtree dock there. Optional: without
 *  a provider the toast stack lazily self-mounts at defaults. Nested
 *  providers pass through unchanged (the outermost wins).
 *
 * @example
 * ```tsx
 * <LayerProvider toast={{ position: 'topEnd', maxVisible: 3 }}>
 * 	<App />
 * </LayerProvider>
 * ```
 * @see ToastViewportProps, LayerToastConfig.
 */
export interface LayerProviderProps {
	/** Content rendered inside the element. */
	children?: Renderable
	/** Toast configuration for the provider-mounted viewport. */
	toast?: LayerToastConfig
}

/** Headless popover (Astryx `usePopover`) — owns open state and an anchored
 *  layer; the trigger binds `triggerRef` (+ `triggerProps` ARIA) and
 *  `render(children, position)` mounts panel content while open.
 */
export interface UsePopoverOptions {
	/** Accessible name for the popover surface (web `aria-label` on the
	 *  `role="dialog"` panel, native accessibilityLabel). */
	dialogLabel?: string
	/** Fires when the popover becomes visible. */
	onShow?: () => void
	/** Fires when the popover hides — including outside/Escape dismissal. */
	onHide?: () => void
	/** Outside tap/click (and default Escape) dismisses. @default true */
	hasLightDismiss?: boolean
	/** Escape dismissal independent of light dismiss. @default true */
	hasEscapeDismiss?: boolean
	/** Extra class on the popover surface. */
	className?: ClassValue
	/** Extra style on the popover surface. */
	style?: StyleProp
}

/** `usePopover` return — bind `triggerRef`/`triggerProps` to the trigger and
 *  render panel content through `render`. */
export interface UsePopoverReturn {
	/** Bind callback for the trigger element/view (positions the panel). */
	triggerRef: (el: HostElement) => void
	/** ARIA props to spread on the trigger (`aria-haspopup`/`aria-expanded`/
	 *  `aria-controls` on web; `expanded` accessibility state elsewhere). */
	triggerProps: Record<string, unknown>
	/** Positioning token identifying the anchor (web `anchor-name` value). */
	anchorId: string
	/** Unique id for `aria-controls`/`aria-describedby` composition. */
	id: string
	/** Current open state. */
	isOpen: boolean
	/** Opens the popover. */
	show: () => void
	/** Closes the popover. */
	hide: () => void
	/** Toggles open state. */
	toggle: () => void
	/** Render popover content into the anchored layer. */
	render: (children: Renderable, props?: ContextRenderProps) => Renderable
}

/** Options for `useMediaQuery` — none; the query string is the input. */

/** Focus trigger behavior for `useTooltip` — `'auto'` attaches only to
 *  naturally focusable triggers, `'always'`/`'never'` override. */
export type TooltipFocusTrigger = 'auto' | 'always' | 'never'

/** Tap behavior on touch pointers — `'auto'` skips triggers that perform
 *  their own action, `'tap'` always opens, `'none'` never opens on touch. */
export type TooltipTouchTrigger = 'auto' | 'tap' | 'none'

/** Options for `useTooltip` (Astryx `TooltipOptions`). */
export interface TooltipOptions {
	/** Logical side of the trigger. @default 'above' */
	placement?: LayerPlacement | PopoverPlacement
	/** Cross-axis alignment. @default 'center' */
	alignment?: LayerAlignment
	/** Hover delay before showing (ms). @default 200 */
	delay?: number
	/** Delay before hiding after pointer/focus leave (ms). @default 0 */
	hideDelay?: number
	/** Focus behavior that shows the tooltip. */
	focusTrigger?: TooltipFocusTrigger
	/** Touch behavior that shows the tooltip (long-press, tap, …). */
	touchTrigger?: TooltipTouchTrigger
	/** Enables hover/focus triggers. @default true */
	isEnabled?: boolean
	/** Controlled open state — hover/focus hides are suppressed while set. */
	isOpen?: boolean
	/** Show on mount (still dismissible). */
	isDefaultOpen?: boolean
	/** Fires when the tooltip becomes visible. */
	onShow?: () => void
	/** Fires when the tooltip hides. */
	onHide?: () => void
}

/** `useTooltip` return (Astryx `TooltipReturn`) — `ref` binds position and
 *  interaction on one element; `positionRef`/`interactionRef` split them.
 *  `describedBy` is the tooltip's id for `aria-describedby`. Touch targets
 *  bind the refs but never mount the hint — matching `Tooltip`. */
export interface TooltipReturn {
	/** Attach to the element that triggers the tooltip. */
	ref: (el: HostElement) => void
	/** Attach to the tooltip element that gets positioned. */
	positionRef: (el: HostElement) => void
	/** Attach to the element receiving hover/focus listeners. */
	interactionRef: (el: HostElement) => void
	/** Id placed on the tooltip for aria anchoring. */
	anchorId: string
	/** Id the trigger uses in `aria-describedby`. */
	describedBy: string
	/** Render the tooltip content into the anchored layer. */
	renderTooltip: (
		/** Anchor content the tooltip binds to. */
		children: Renderable,
		/** Context render props minus positioning (supplied internally). */
		props?: Omit<ContextRenderProps, 'positioning'>,
	) => Renderable
}

/** Hover/focus-triggered floating card (Astryx `HoverCard`). The trigger is
 *  `children`; `content` is the card body. Pointer hover opens after
 *  `delay`, focus opens per `focusTrigger`, and on touch platforms a tap on
 *  a non-action trigger opens the card per `touchTrigger`.
 *
 * @example
 * ```tsx
 * import { HoverCard, Text } from '@octane-xplat/ui'
 *
 * <HoverCard content={<Text>{bio}</Text>} placement="below" delay={200}>
 * 	<Text>{name}</Text>
 * </HoverCard>
 * ```
 * @see useHoverCard for the headless form, TooltipProps for a passive hint.
 */
export interface HoverCardProps {
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Side of the trigger the card opens on — logical `'above'|'below'|'start'|'end'` (inline sides mirror under RTL on web). @default 'above'
 */
export type HoverCardPlacement = 'above' | 'below' | 'start' | 'end'
/** Cross-axis alignment of the card against its trigger. @default 'center'
 */
export type HoverCardAlignment = 'start' | 'center' | 'end'
/** When keyboard focus opens the card — `'auto'` only for naturally focusable triggers (native: never), `'always'`, `'never'`. @default 'auto'
 */
export type HoverCardFocusTrigger = 'auto' | 'always' | 'never'
/** Tap behavior on touch platforms — `'auto'` opens unless the trigger has its own action (web detects controls; native treats `'auto'` as `'tap'`), `'tap'` always opens, `'none'` never. @default 'auto'
 */
export type HoverCardTouchTrigger = 'auto' | 'tap' | 'none'

/** Options for `useHoverCard` — placement/alignment, `delay`/`hideDelay` (ms), `focusTrigger`/`touchTrigger`, `isEnabled`, accessible `label`, open-state (`isOpen`/`isDefaultOpen`), and `onShow`/`onHide` notifications.
 */
export interface HoverCardOptions {
	/** Preferred side of the card relative to its anchor. */
	placement?: HoverCardPlacement
	/** Alignment along the placement axis. */
	alignment?: HoverCardAlignment
	/** Hover dwell in ms before the card opens. */
	delay?: number
	/** Grace period in ms before the card closes after hover leaves. */
	hideDelay?: number
	/** Focus behavior that opens the card. */
	focusTrigger?: HoverCardFocusTrigger
	/** Touch behavior that opens the card. */
	touchTrigger?: HoverCardTouchTrigger
	/** Master switch — disabled suppresses open entirely. */
	isEnabled?: boolean
	/** Accessible label for the card region. */
	label?: string
	/** Controlled open state. */
	isOpen?: boolean
	/** Initial open state for uncontrolled usage. */
	isDefaultOpen?: boolean
	/** Fires when the card opens. */
	onShow?: () => void
	/** Fires when the card closes. */
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
	/** Current open state. */
	isOpen: boolean
	/** Render the card content into the anchored layer. */
	renderHoverCard: (children: Renderable, props?: Record<string, unknown>) => Renderable
	/** Imperatively show/hide, bypassing the delays. */
	show: () => void
	/** Closes the card. */
	hide: () => void
}

/** Tooltip — `trigger` is the anchor content, `content` the hint body.
 *  Pointer platforms show the hint after hover/focus intent (web adds
 *  `aria-describedby` + Escape/scroll dismissal; macOS presents an anchored
 *  NSPopover). Touch targets render the trigger and never mount the hint —
 *  keep essential information out of `content`.
 *
 * @example
 * ```tsx
 * import { Tooltip, Icon } from '@octane-xplat/ui'
 *
 * <Tooltip trigger={<Icon name="xplat-wrench" />} content="Settings" />
 * ```
 * @see HoverCardProps for interactive rich content.
 */
export interface TooltipProps {
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Element that shows the tooltip on hover/focus. */
	trigger: Renderable
	/** Tooltip body content. */
	content: Renderable
	/** Styling for the tooltip panel inside the popover. */
	contentClassName?: ClassValue
	/** Inline style for the tooltip surface. */
	contentStyle?: StyleProp
	/** Dwell in ms before the tooltip opens. */
	openDelay?: number
	/** Grace period in ms before the tooltip closes. */
	closeDelay?: number
	/** Preferred side of the tooltip relative to the trigger. */
	placement?: PopoverPlacement
	/** Suppresses the tooltip entirely. */
	disabled?: boolean
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Toast status type — controls the surface tone and live-region urgency
 *  (web: `role="status"`/polite for info, `role="alert"`/assertive for
 *  error; error toasts default to not auto-hiding).
 */
export type ToastType = 'info' | 'error'

/** Edge the toast stack anchors to (Astryx `ToastViewport` positions).
 */
export type ToastPosition = 'topStart' | 'topEnd' | 'bottomStart' | 'bottomEnd'

/** Why a toast hid — `'auto'` (the `autoHideDuration` timer) or `'manual'` (explicit dismissal).
 */
export type ToastDismissReason = 'auto' | 'manual'
/** What a second toast with the same `uniqueID` does — `'overwrite'` replaces in place (default), `'ignore'` suppresses the new one.
 */
export type ToastCollisionBehavior = 'overwrite' | 'ignore'

/** One toast's content and behavior for `showToast`/`useToast().show`/`handle.update` — `body`/`endContent`/`renderContent` are the content sources (use one; `renderContent` owns the layout), `type` picks info vs error tone (error defaults to persistent), `autoHideDuration` is ms (default 5000), `uniqueID`+`collisionBehavior` handle repeats, `position`/`anchor`/`placement` override where it lands. Requires a `ToastViewport` — when none is mounted the leaf auto-mounts one at `bottomEnd`.
 *
 * @example
 * ```tsx
 * import { showToast } from '@octane-xplat/ui'
 *
 * const toast = showToast({ body: 'Saved', type: 'info' })
 * toast.update({ body: 'Syncing…' }) // same identity, new content
 * toast.dismiss()
 * ```
 * @see ToastHandle, ToastViewportProps.
 */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Programmatic toast dismissal (Astryx `ToastDismissFn`). */
export type ToastDismissFn = () => void

/** Values passed to a custom toast content renderer — see
 *  `ToastOptions.renderContent`.
 */
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
	/** Generated id for this queued toast. */
	id: string
	/** Options the toast was shown with. */
	options: ToastOptions
	/** Owning ToastViewport; absent entries render on the fallback stack. */
	viewportId?: string
	/** Set while the exit presentation runs before removal. */
	exiting?: boolean
}

/** The toast stack container. Render once at the app root — it hosts every
 *  toast pushed through `useToast()`/`showToast`.
 *
 * @example
 * ```tsx
 * import { ToastViewport, showToast } from '@octane-xplat/ui'
 *
 * // render once at the app root, then push toasts from anywhere
 * <ToastViewport position="bottomEnd" />
 * showToast({ body: 'Saved' })
 * ```
 * @see ToastOptions, ToastHandle.
 */
export interface ToastViewportProps {
	/** Edge the stack grows from. @default 'bottomEnd' */
	position?: ToastPosition
	/** Maximum number of visible toasts; older entries evict. @default 5 */
	maxVisible?: number
	/** Extra inset from the safe-area-aware edge gutter. */
	inset?: {
		/** Top inset in DIPs. */
		top?: number
		/** Bottom inset in DIPs. */
		bottom?: number
		/** Inline-start inset. */
		start?: number
		/** Inline-end inset. */
		end?: number
	}
	/** Web only: promote the viewport into the CSS top layer (above modal
	 *  dialogs). Set false when rendering inside a dialog. @default true */
	isTopLayer?: boolean
	/** Content rendered inside the element. */
	children?: Renderable
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Inline toast card — the same surface ToastViewport renders. Useful for
 *  pinned/inline notifications outside the stack.
 *
 * @example
 * ```tsx
 * import { Toast } from '@octane-xplat/ui'
 *
 * <Toast type="error" body="Upload failed" />
 * ```
 * @see ToastViewportProps for the queued stack.
 */
export interface ToastProps {
	/** @default 'info' */
	type?: ToastType
	/** Toast content. */
	body?: Renderable
	/** Trailing content (actions, close affordance). */
	endContent?: Renderable
	/** Dismisses automatically after `autoHideDuration`. */
	isAutoHide?: boolean
	/** Milliseconds before auto-dismiss (when isAutoHide). */
	autoHideDuration?: number
	/** Exiting presentation (collapsed/sliding). Managed by the viewport. */
	isExiting?: boolean
	/** Called with the reason when the toast requests dismissal. */
	onDismiss?: (reason: ToastDismissReason) => void
	/** Custom renderer for the toast body — overrides `body`. */
	renderContent?: ToastContentRenderFn
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ---------- measurement ----------

/** Rect in the app-surface coordinate space: `(0,0)` is the top-left of
 *  the viewport on web, the window content area on AppKit macOS, and the
 *  app's top-level layout surface on iOS/Android — all in dips (px on
 *  web), y growing downward. Split-screen, freeform, and Stage Manager
 *  windows report the same space, so a value means the same thing on
 *  every target. */
export interface MeasureBounds {
	/** Left edge in DIPs. */
	x: number
	/** Top edge in DIPs. */
	y: number
	/** Measured width in DIPs. */
	width: number
	/** Measured height in DIPs. */
	height: number
}

/** Options for `useMeasure` — `observe` (default true) re-measures on layout/resize/scroll/content-size changes; `false` takes a single read once the host lays out.
 */
export interface UseMeasureOptions {
	/** Re-measure on layout, resize, ancestor scroll, and content-size
	 *  changes; `false` takes a single read once the host lays out.
	 *  @default true */
	observe?: boolean
}

/** `useMeasure` result — `ref` attaches to a leaf's `ref` prop; `bounds` is the latest `MeasureBounds` in app-surface dips, or `null` until the host reports a usable layout (the readiness signal).
 *
 * @example
 * ```tsx
 * import { useMeasure, View } from '@octane-xplat/ui'
 *
 * const { ref, bounds } = useMeasure()
 * <View ref={ref}>{bounds ? `${bounds.width}×${bounds.height}` : 'measuring…'}</View>
 * ```
 */
export interface MeasureResult {
	/** Attach to a `View`'s (or any leaf's) `ref` prop; receives the
	 *  platform host (`HostElement` — `HTMLElement` on web, the native
	 *  view elsewhere) or `null` on detach. */
	ref: (element: HostElement) => void
	/** Latest bounds, or `null` until the attached host reports a usable
	 *  layout. `bounds === null` is the readiness signal — render
	 *  fallbacks while it holds. */
	bounds: MeasureBounds | null
}

/** Native modal sheet/dialog — the contract shared by `UIModal` (`@octane-xplat/ui/ios`), `MaterialDialog` (`@octane-xplat/ui/android`), and `openModal`. `open`/`defaultOpen`/`onClose` own visibility; `presentation` picks sheet/fullscreen/dialog chrome; `component`+`params` render a hosted component on the modal's own root (context/theme do not cross) — `component` beats `children` when both are set. `onClose` reports the result value.
 *
 * @example
 * ```tsx
 * import { UIModal } from '@octane-xplat/ui/ios'
 * import { FormLayout } from '@octane-xplat/ui'
 *
 * <UIModal open={open} onClose={(result) => setOpen(false)} presentation="sheet">
 * 	<FormLayout>{fields}</FormLayout>
 * </UIModal>
 * ```
 * @see ModalHandle, OpenModal.
 */
export interface ModalProps {
	/** Controlled visibility — pair with `onClose`. */
	open?: boolean
	/** Initial visibility for uncontrolled use; `open` wins when both are
	 *  set. Uncontrolled dismissal closes the modal itself. */
	defaultOpen?: boolean
	/** Called with the modal's result value when the host closes it. */
	onClose?: (result?: ModalOpenResult) => void
	/** Covers the full window instead of a centered surface. */
	fullscreen?: boolean
	/** Native: sheet uses fullscreen=false (iOS form sheet; Android centered
	 *  dialog), fullscreen uses fullscreen=true. Web: dialog is a centered
	 *  card, sheet is bottom-anchored, fullscreen is the default dialog size. */
	presentation?: 'sheet' | 'fullscreen' | 'dialog'
	/** Component rendered inside the modal portal with params as props. When
	 *  both component and children are set, component takes precedence. */
	component?: (props: any) => any
	/** Props passed to component. */
	params?: Record<string, unknown>
	/** Content rendered inside the element. */
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
	/** Surface treatment — sheet, fullscreen, or dialog. */
	presentation?: 'sheet' | 'fullscreen' | 'dialog'
	/** Covers the full window; overrides `presentation` sizing. */
	fullscreen?: boolean
	/** Animates the open/close transition. */
	animated?: boolean
}

/** Value supplied to a modal close callback and returned by `openModal`. */
export type ModalOpenResult = unknown

/** Owning handle for one imperative modal opened by `openModal`. It is the
 *  completion promise — `await` resolves with the value passed to
 *  `close(result)` or the presented component's own `close` — plus an
 *  instance-scoped close, so concurrent modals dispose independently.
 *
 * @example
 * ```tsx
 * import { openModal } from '@octane-xplat/ui/ios'
 * import { Text } from '@octane-xplat/ui'
 *
 * const result = await openModal(() => <Text>Delete item?</Text>, { id: 3 }, { presentation: 'sheet' })
 * ```
 */
export interface ModalHandle extends Promise<ModalOpenResult> {
	/** Close this modal, resolving the handle with `result`. Idempotent —
	 *  a user dismissal or an earlier close wins. */
	close(result?: ModalOpenResult): void
}

/** Public function shape of the imperative modal service.
 *
 * @example
 * ```tsx
 * import { openModal } from '@octane-xplat/ui/ios'
 *
 * const modal = openModal(EditForm, { id })  // EditForm: your screen component
 * modal.close() // or await it for the close result
 * ```
 */
export type OpenModal = <TParams>(
	/** Component rendered inside the modal. */
	component: HostedComponent<TParams>,
	/** Params forwarded to the component. */
	params?: TParams,
	/** Presentation options for this open call. */
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
 *  its own overlay.
 *
 * @example
 * ```tsx
 * import { BottomSheet } from '@octane-xplat/ui'
 *
 * <BottomSheet isOpen={open} onOpenChange={setOpen} label="Share" snapPoints={['50%']}>
 * 	{shareForm}
 * </BottomSheet>
 * ```
 * @see BottomSheetSwitcherProps for panels that share one host, openBottomSheet for the imperative service.
 */
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
	/** Content rendered inside the element. */
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
	/** Element to focus when the sheet closes (`{current}`-style object).
	 * Native hosts call the target's focus method when available; supply this
	 * explicitly when a native input should regain editing focus. */
	finalFocusRef?: { /** Live slot for the host element; null before mount or after unmount. */ current: HostElement | null }
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Shared host for a group of `BottomSheet` panels — exactly one child
 *  sheet (by `sheetId`) is visible under `activeSheet`, and sheet changes
 *  animate between panels in the same host instead of closing and
 *  reopening. A null `activeSheet` closes the host.
 *
 * @example
 * ```tsx
 * import { BottomSheetSwitcher, BottomSheet } from '@octane-xplat/ui'
 *
 * <BottomSheetSwitcher activeSheet={sheet} onActiveSheetChange={setSheet}>
 * 	<BottomSheet sheetId="edit" label="Edit">{editForm}</BottomSheet>
 * 	<BottomSheet sheetId="share" label="Share">{shareForm}</BottomSheet>
 * </BottomSheetSwitcher>
 * ```
 * @see BottomSheetProps.
 */
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
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Options for the imperative `openBottomSheet` service. */
export interface BottomSheetOpenOptions {
	/** Shows a dimming scrim behind the sheet. */
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
 *  passed to `close(result)`. The component receives `{ params, close }`.
 *
 * @example
 * ```tsx
 * import { openBottomSheet } from '@octane-xplat/ui'
 *
 * const result = await openBottomSheet(ShareSheet, { docId })  // ShareSheet: your component
 * ```
 */
export type OpenBottomSheet = <TParams>(
	/** Component rendered inside the sheet. */
	component: HostedComponent<TParams>,
	/** Params forwarded to the component. */
	params?: TParams,
	/** Presentation options for this open call. */
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
	/** Offset from the top edge (number is DIPs). */
	top?: number | string
	/** Offset from the bottom edge (number is DIPs). */
	bottom?: number | string
	/** Offset from the inline-start edge. */
	start?: number | string
	/** Offset from the inline-end edge. */
	end?: number | string
}

/** Modal panel on the enclosing RootLayout (native) or a document-body
 *  `<dialog>` layer (web). The trigger is NOT part of the component —
 *  callers own `isOpen` and restore focus to `finalFocusRef` or the
 *  previously-focused element.
 *
 * @example
 * ```tsx
 * import { Dialog, DialogHeader, Button } from '@octane-xplat/ui'
 *
 * <Dialog isOpen={open} onOpenChange={setOpen}>
 * 	<DialogHeader title="Rename" onOpenChange={setOpen} />
 * 	{form}
 * </Dialog>
 * ```
 * @see DialogHeaderProps, AlertDialogProps for confirmations, useImperativeDialog.
 */
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
	/** Content rendered inside the element. */
	children?: Renderable
	/** Panel width (px on web, dips on native). @default 400 */
	width?: number | string
	/** Panel max height. @default '75dvh' on web / 75% of the screen on
	 *  native */
	maxHeight?: number | string
	/** Non-centered anchoring. */
	position?: DialogPosition
	/** Visual variant of the dialog surface. */
	variant?: DialogVariant
	/** Semantic purpose — drives default actions/emphasis (e.g. destructive confirmations). */
	purpose?: DialogPurpose
	/** Internal padding, spacing steps (1 step = 4px/dip). @default 5 */
	padding?: number
	/** Render as ordinary inline content — no overlay, backdrop, focus
	 *  management, or dismissal wiring. For docs and previews. */
	isInline?: boolean
	/** Element to focus on close; defaults to the element focused when the
	 *  dialog opened on web/AppKit. `{current}`-style ref; touch targets call
	 *  its focus method when available. */
	finalFocusRef?: { /** Live slot for the host element; null before mount or after unmount. */ current: HostElement | null }
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** The Dialog/AlertDialog title row. Renders a close affordance when
 *  `onOpenChange` is supplied. In modal mode the web leaf puts
 *  `data-autofocus` on the title so it lands initial focus when no
 *  in-dialog control is marked; `aria-labelledby` points at it when no
 *  explicit accessible name is given.
 *
 * @see DialogProps — renders the title row (and close affordance) inside it.
 */
export interface DialogHeaderProps {
	/** Header title content. */
	title?: Renderable
	/** Secondary header content under the title. */
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
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Options accepted by `useImperativeDialog().show()`.
 *
 * @see useImperativeDialog — `show(children, options)` takes these.
 */
export type DialogOptions = Omit<
	DialogProps,
	'isOpen' | 'defaultOpen' | 'onOpenChange' | 'children'
>

/** Return of `useImperativeDialog` — `show(children, options)` opens, `hide` closes, `isOpen` reflects state, and `element` is the dialog node to render in the tree.
 */
export interface ImperativeDialogReturn {
	/** Opens the dialog with arbitrary content. */
	show: (children: Renderable, options?: DialogOptions) => void
	/** Closes this dialog instance. */
	hide: () => void
	/** Current open state of this dialog. */
	isOpen: boolean
	/** Rendered anywhere in the tree — the dialog itself. */
	element: Renderable
}

/** Confirmation dialog (Astryx `AlertDialog`) — a dialog whose action is
 *  potentially destructive. Renders title/description plus Cancel and a
 *  single action button. Web maps to `role="alertdialog"`.
 *
 * @example
 * ```tsx
 * import { AlertDialog } from '@octane-xplat/ui'
 *
 * <AlertDialog
 * 	isOpen={confirming}
 * 	onOpenChange={setConfirming}
 * 	title="Delete draft?"
 * 	description="This cannot be undone."
 * 	actionLabel="Delete"
 * 	onAction={deleteDraft}
 * />
 * ```
 * @see DialogProps, useImperativeAlertDialog.
 */
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
	/** Dialog title content. */
	title: Renderable
	/** Body copy explaining the alert. */
	description?: Renderable
	/** Label for the confirming action. */
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
	finalFocusRef?: { /** Live slot for the host element; null before mount or after unmount. */ current: HostElement | null }
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Return of `useImperativeAlertDialog` — `show(options)` opens with `AlertDialogProps` minus the visibility props, `hide` closes, `element` is the dialog node to render.
 */
export interface ImperativeAlertDialogReturn {
	/** Opens the dialog with the given confirmation content. */
	show: (options: Omit<AlertDialogProps, 'isOpen' | 'defaultOpen' | 'onOpenChange'>) => void
	/** Closes this alert instance. */
	hide: () => void
	/** Current open state of this alert. */
	isOpen: boolean
	/** Rendered anywhere in the tree — the dialog itself. */
	element: Renderable
}

// ---------- carousel ----------

/** Imperative carousel controls (Astryx `CarouselHandle`). Returned through
 *  the component's standard Octane `ref`.
 *
 * @example
 * ```tsx
 * import { Carousel, Button, type CarouselHandle } from '@octane-xplat/ui'
 * import { useRef } from 'octane'
 *
 * const carousel = useRef<CarouselHandle>()
 * <Carousel ref={carousel}>{slides}</Carousel>
 * <Button label="Next" clickAction={() => carousel.current?.scrollNext()} />
 * ```
 */
export interface CarouselHandle {
	/** Advances to the next page. */
	scrollNext(): void
	/** Goes back to the previous page. */
	scrollPrev(): void
	/** Jumps to a specific page index. */
	scrollTo(index: number): void
	/** Whether a next page exists. */
	canScrollNext(): boolean
	/** Whether a previous page exists. */
	canScrollPrev(): boolean
}

/** One labelled slide group inside a `Carousel` — plain children are
 *  wrapped automatically, so `items` is not needed; `Carousel` wraps each
 *  top-level child in an `aria-roledescription="slide"` group (web) /
 *  labelled container (native).
 *
 * @example
 * ```tsx
 * import { Carousel, Image } from '@octane-xplat/ui'
 *
 * <Carousel label="Screenshots" hasButtons hasSnap>
 * 	{shots.map((s) => <Image key={s.id} src={s.url} alt={s.name} />)}
 * </Carousel>
 * ```
 * @see CarouselHandle for imperative paging.
 */
export interface CarouselProps extends AccessibilityProps {
	/** Accessible name for the region (web `aria-label` on
	 *  `aria-roledescription="carousel"`; native `accessibilityLabel`). */
	label?: string
	/** Content rendered inside the element. */
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
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ---------- lightbox ----------

/** Kind of a `LightboxMedia` entry — `'image'` (default) or `'video'` (real player on web only; native reports it unsupported).
 */
export type LightboxMediaType = 'image' | 'video'

/** One `Lightbox` entry — `src` URI, required `alt` description, optional `caption`, and `type`.
 */
export interface LightboxMedia {
	/** Media URL shown in the viewer. */
	src: string
	/** Accessible description of the media (web `alt`). */
	alt: string
	/** Caption rendered under the media. */
	caption?: Renderable
	/** @default 'image' */
	type?: LightboxMediaType
}

/** Full-screen media viewer (Astryx `Lightbox`). Navigates a `media` array
 *  with prev/next controls, arrow keys (web), and swipe (native);
 *  pinch/double-click zoom applies to images only. `type: 'video'` renders
 *  a real player only on web — native reports it unsupported.
 *
 * @example
 * ```tsx
 * import { Lightbox } from '@octane-xplat/ui'
 *
 * <Lightbox
 * 	isOpen={viewing}
 * 	onOpenChange={setViewing}
 * 	media={[{ src: photo.url, alt: photo.name }]}
 * />
 * ```
 * @see LightboxMedia, useLightbox.
 */
export interface LightboxProps {
	/** Controlled open state. */
	isOpen: boolean
	/** Reports requested open-state changes. */
	onOpenChange: (isOpen: boolean) => void
	/** Media items navigable inside the lightbox. */
	media: LightboxMedia[]
	/** Controlled index. */
	index?: number
	/** Uncontrolled initial index. */
	defaultIndex?: number
	/** Fires when the displayed media index changes. */
	onIndexChange?: (index: number) => void
	/** Pinch/click zoom on images. @default true */
	hasZoom?: boolean
	/** Auto-play videos when they are shown. Web only. @default false */
	hasAutoPlay?: boolean
	/** Element to focus on close; defaults to the element focused when the
	 *  lightbox opened. `{current}`-style ref; web semantics. */
	finalFocusRef?: { /** Live slot for the host element; null before mount or after unmount. */ current: HostElement | null }
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Props spread onto a media element that should open the lightbox on
 *  press/click.
 *
 * @see UseLightboxReturn.getTriggerProps — these props come from `useLightbox`.
 */
export interface LightboxTriggerProps {
	/** Custom activation handler — overrides the default open behavior. */
	onPress?: () => void
	/** Web cursor hint + native accessibility hint. */
	web?: PlatformProps
}

/** Options for `useLightbox` — the `media` array, controlled `index`/`onIndexChange` or `defaultIndex`, and zoom/autoplay flags matching `LightboxProps`.
 */
export interface UseLightboxOptions {
	/** Media items navigable inside the lightbox. */
	media: LightboxMedia[]
	/** Controlled displayed index. */
	index?: number
	/** Initial index for uncontrolled usage. */
	defaultIndex?: number
	/** Fires when the displayed index changes. */
	onIndexChange?: (index: number) => void
	/** Enables pinch/double-tap zoom on the media. */
	hasZoom?: boolean
	/** Auto-advances through the media on a timer. */
	hasAutoPlay?: boolean
	/** Element focus returns to on close. */
	finalFocusRef?: { /** Live slot for the host element; null before mount or after unmount. */ current: HostElement | null }
}

/** `useLightbox` result — `open(index)`/`close`, live `isOpen`/`index`, and `element`: the `Lightbox` node to render in the tree.
 */
export interface UseLightboxReturn {
	/** Open at `index` (default 0). */
	open: (index?: number) => void
	/** Closes the lightbox. */
	close: () => void
	/** Current open state. */
	isOpen: boolean
	/** Currently displayed media index. */
	index: number
	/** The lightbox node — render it once in the tree. */
	element: Renderable
	/** Props for a plain trigger element that opens index 0. */
	triggerProps: LightboxTriggerProps
	/** Props for a trigger bound to a specific media index. */
	getTriggerProps: (index: number) => LightboxTriggerProps
}

/** One `Tabs` entry — `title` plus `render()` for the pane; `key` is the stable selection/ARIA identity (defaults to position). `icon` is a registered `IconName`; platform tab bars consume its `src`/`font`/`text` forms. `stack` names a parallel navigation stack whose pushed routes render inside the pane.
 */
export interface TabSpec {
	/** Stable identity for this tab — selection (`selectedKey`), the
	 *  web tab↔panel ARIA linkage, and pane reconciliation all use it.
	 *  Defaults to the tab's position index. */
	key?: string
	/** Tab label text. */
	title: string
	/** Registered icon name (see `registerIcons`). The shared self-drawn
	 *  `Tabs` renders the glyph through `Icon` on every platform. The
	 *  platform tab bars (`UITabBar`/`BottomNavigationView` in the ios/
	 *  android subpaths) consume the glyph's `src` (a NativeScript
	 *  iconSource URI — `sys://` SF Symbol, `res://`, `font://`, file
	 *  path) or `font`/`text` representation; `svg`/`markup`-only glyphs
	 *  warn and render title-only there. */
	icon?: IconName
	/** Lazily renders the tab panel content — invoked when the tab activates. */
	render: () => Renderable
	/** Named parallel stack — the pane is the route outlet for `stack`
	 *  (pushed screens render in place). The platform tab bars host a real
	 *  Frame per such pane. */
	stack?: string
}

/** Self-drawn tab strip + panes (Astryx `Tabs`). `tabs` supplies `TabSpec`s; selection is controlled by `selectedKey`+`onSelectionChange` or uncontrolled via `defaultSelectedKey`, keyed by `TabSpec.key`. Named `stack` panes render their routes through the canonical router.
 *
 * @example
 * ```tsx
 * import { Tabs, Text } from '@octane-xplat/ui'
 *
 * <Tabs
 * 	tabs={[
 * 		{ key: 'inbox', title: 'Inbox', render: () => <Text>Inbox</Text> },
 * 		{ key: 'sent', title: 'Sent', render: () => <Text>Sent items</Text> },
 * 	]}
 * 	selectedKey={tab}
 * 	onSelectionChange={setTab}
 * />
 * ```
 * @see TabSpec, TabListProps for a standalone strip, PlatformTabsProps for the OS tab bars.
 */
export interface TabsProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Tab descriptors rendered by the platform tab bar. */
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
}

/** Platform tab-bar item shape. `icon` may be a registered name or a native
 *  asset value returned by `PlatformIcon.select()` from the matching subpath. */
export type PlatformTabSpec = Omit<TabSpec, 'icon'> & {
	/** Icon name for the tab. */
	icon?: string
}

/** The OS tab bars' contract — `TabsProps` with `PlatformTabSpec` items (icon may be a registered name or a native asset string from `PlatformIcon.select`). Consumed by `UITabBar` (`ui/ios`) and `BottomNavigationView` (`ui/android`); each pane with `stack` hosts a real navigation Frame natively.
 */
export type PlatformTabsProps = Omit<TabsProps, 'tabs'> & {
	/** Tab descriptors rendered by the platform tab bar. */
	tabs: readonly PlatformTabSpec[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
}

/** Props accepted by `UITabBar` (`@octane-xplat/ui/ios`). */
export type UITabBarProps = PlatformWidgetProps<PlatformTabsProps>
/** Props accepted by `BottomNavigationView` (`@octane-xplat/ui/android`). */
export type BottomNavigationViewProps = PlatformWidgetProps<PlatformTabsProps>

// ---------- routes ----------

/** Runtime destination boundary consumed by host-independent preparation.
 * Typed application destinations narrow this shape through their route catalog.
 * Prepared data and context are deliberately not navigation input. */
export interface RouteDestinationInput {
	/** Route name or path to navigate to. */
	to: string
	/** Path-parameter values for the destination. */
	params?: Record<string, string | undefined>
	/** Query-string values merged into the destination. */
	search?: Record<string, unknown>
	/** Target stack id for multi-pane routing. */
	stack?: string
	/** Fragment appended to the destination URL. */
	hash?: string
	/** `push` adds a history entry; `modal` presents over the stack. */
	presentation?: 'push' | 'modal'
	/** Named transition used for this navigation. */
	transition?: string
	/** Replaces the current history entry instead of pushing. */
	replace?: boolean
}

interface RouteCancellationSignalLike {
	/** Set when the destination was rejected before commit. */
	readonly aborted: boolean
	/** Registers an abort listener (AbortSignal-compatible). */
	addEventListener(
		/** Event name — only `abort` is supported. */
		type: 'abort',
		/** Callback fired when the signal aborts. */
		listener: () => void,
		options?: { /** Removes the listener after its first invocation. */ once?: boolean },
	): void
	/** Unregisters an abort listener. */
	removeEventListener(type: 'abort', listener: () => void): void
}

/** The host's standard AbortSignal when its type exists, including compatibility
 * with fetch. Hosts without that global use the minimal cancellation contract;
 * core never imports a DOM API or fabricates a standard signal. */
export type RouteCancellationSignal = typeof globalThis extends {
	/** Captures the platform AbortSignal interface for typing. */
	AbortSignal: { prototype: infer Signal }
}
	? Signal & RouteCancellationSignalLike
	: RouteCancellationSignalLike

/** Host-provided cancellation primitive; creation belongs to the platform adapter. */
export interface RouteCancellationController {
	/** Signal aborted when the navigation is superseded or cancelled. */
	readonly signal: RouteCancellationSignal
	/** Cancels the navigation and fires the signal. */
	abort(): void
}

/** Validated inputs shared by a route's guard and loader in the refined contract. */
export interface RoutePreparationArgs {
	/** Resolved path params for the incoming route. */
	params: Record<string, string>
	/** Validated search params for the incoming route. */
	search: Record<string, unknown>
	/** Shared route context carried through preparation. */
	context: RouteContext
	/** Aborts when the navigation is superseded — check before committing async work. */
	signal?: RouteCancellationSignal
}

/** Executable behavior shared by every route authoring style. File generation
 * and programmatic inference adapt their declarations to this internal boundary. */
export interface RoutePreparationGroup {
	/** Group identity — preparations in a group share lifecycle. */
	readonly id: string
	/** Guard run before the group's loaders. */
	readonly beforeLoad?: RoutePreparationBehavior['beforeLoad']
	/** Loader run for this group. */
	readonly loader?: RoutePreparationBehavior['loader']
}

export interface RoutePreparationBehavior {
	/** Ordered preparation groups for a route name. */
	readonly groups?: readonly RoutePreparationGroup[]
	/** Schema validator for this route's search params. */
	validateSearch?(
		/** Raw search record before validation — guards see the unvalidated shape. */
		raw: Record<string, unknown>,
	): Record<string, unknown> | Promise<Record<string, unknown>>
	/** Guard run before the loader — may redirect or abort. */
	beforeLoad?(args: RoutePreparationArgs): RouteGuardResult | Promise<RouteGuardResult>
	/** Data loader run during preparation. */
	loader?(args: RoutePreparationArgs): unknown
}

/** A host-free prepared match. The context and data here are not automatically
 * safe to serialize; SSR must project an explicitly declared public payload. */
export interface PreparedRouteMatch {
	/** Path the match was prepared from. */
	to: string
	/** Route name the match resolved to. */
	name: string
	/** Stack the match belongs to. */
	stack: string
	/** Resolved path params. */
	params: Record<string, string>
	/** Validated search params. */
	search: Record<string, unknown>
	/** Route context carried into the screen. */
	context: RouteContext
	/** Loader result for this route. */
	data: unknown
	/** Resolved URL for the match. */
	href: string
	/** Fragment carried into the resolved URL. */
	hash?: string
	/** Resolved presentation (push/modal). */
	presentation?: 'push' | 'modal'
	/** Named transition chosen for this navigation. */
	transition?: string
}

/** Terminal preparation outcomes, before browser/native/HTTP commitment.
 * Error objects stay local to the host and must not be dumped into hydration JSON. */
export type RoutePreparationResult =
	| {
			/** Ready discriminator — preparation produced a match. */
			status: 'ready'
			/** Prepared match for the route. */
			match: PreparedRouteMatch
			/** True when a guard redirected during preparation. */
			redirected: boolean
	  }
	| {
			/** Redirect discriminator — a guard sent the navigation elsewhere. */
			status: 'redirect'
			/** Where the redirect points. */
			destination: RouteDestinationInput
	  }
	| {
			/** Not-found discriminator — no route matched. */
			status: 'not-found'
			/** Why the route did not resolve (pattern/resource/unavailable). */
			reason: 'pattern' | 'resource' | 'unavailable'
	  }
	| { /** Forbidden discriminator — a guard denied the navigation. */ status: 'forbidden' }
	| {
			/** Invalid-input discriminator — params or search failed validation. */
			status: 'invalid-input'
			/** Path that failed to resolve. */
			path: string
			/** The thrown or returned failure value. */
			error: unknown
	  }
	| {
			/** Failure discriminator for preparation outcomes. */
			status: 'failed'
			/** Which preparation phase failed (module/context/guard/loader/redirect). */
			phase: 'module' | 'context' | 'guard' | 'loader' | 'redirect'
			/** The thrown or returned failure value. */
			error: unknown
	  }
	| {
			/** Cancelled discriminator — the navigation was superseded or aborted. */
			status: 'cancelled'
			/** Why the navigation was cancelled. */
			reason: 'superseded' | 'disposed' | 'aborted' | 'registry-changed'
	  }

/** A strict URL/destination match without executing guards or loading data. */
export type RouteResolution =
	| {
			/** Matched discriminator — the URL resolved to a route. */
			status: 'matched'
			/** Destination input for the matched route. */
			destination: RouteDestinationInput
			/** Resolved route name. */
			name: string
			/** Resolved URL. */
			href: string
	  }
	| Extract<RoutePreparationResult, { /** Matched discriminator — the URL resolved to a route. */ status: 'not-found' | 'invalid-input' }>

declare const validatedDestinationTypes: unique symbol
/** Opaque, instance-bound destination produced by validateDestination(). Pass
 * the original value to navigation/href or NavLink's to prop. Choose route
 * options before validation; copying or serializing this value loses its proof. */
export interface ValidatedDestination {
	readonly [validatedDestinationTypes]: true
}

/** A declared request or an opaque destination checked by this router. */
export type NavigationDestination<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = DestinationFor<Contracts, keyof Contracts & string, Stacks, Transitions> | ValidatedDestination

/** Search/schema validation without guards, context or loading data. Success is
 * a destination snapshot, never permission to skip preparation on navigation. */
export type DestinationValidationResult<Value = ValidatedDestination> =
	| {
			/** Valid discriminator — the destination passed validation. */
			status: 'valid'
			/** Validated destination value. */
			destination: Value
			/** Resolved URL for the destination. */
			href: string
	  }
	| Extract<RoutePreparationResult, { /** Valid discriminator — the destination passed validation. */ status: 'not-found' | 'invalid-input' | 'cancelled' }>
	| {
			/** Failed discriminator — validation threw. */
			status: 'failed'
			/** Phase that failed (module load). */
			phase: 'module'
			/** The thrown failure value. */
			error: unknown
	  }

/** Code warming only: no validation, request context, guards, data or host effects. */
export type RoutePreloadResult =
	| {
			/** Preloaded discriminator — module and data are warm. */
			status: 'preloaded'
			/** Resolved URL that was preloaded. */
			href: string
	  }
	| Extract<RoutePreparationResult, { /** Preloaded discriminator — module and data are warm. */ status: 'not-found' | 'invalid-input' | 'cancelled' }>
	| {
			/** Failed discriminator — preload threw. */
			status: 'failed'
			/** Phase that failed (module load). */
			phase: 'module'
			/** The thrown failure value. */
			error: unknown
	  }

/** Instance-local preparation settings. Definitions are snapshotted; context is
 * read once per attempt. Linear clients supersede all pending navigation, while
 * independent native flows may prepare concurrently. No host is created here. */
export interface RoutePreparationOptions {
	/** Route manifest supplying route metadata. */
	catalog: RouteManifest
	/** Guard/loader groups keyed by route name. */
	behaviors?: Readonly<Record<string, RoutePreparationBehavior>>
	/** @internal Client effect names; server preparation can omit motion policy. */
	transitionNames?: readonly string[]
	/** @internal Identity for opaque client destinations; never a request service. */
	destinationOwner?: object
	/** Shallow root snapshot per attempt. Synchronous sources are copied before
	 * yielding; async sources must resolve a consistent record. Services retain
	 * identity. Changing this source does not invalidate retained entries. */
	context?: object | (() => object | Promise<object>)
	/** Base path the app is served under. */
	base?: string
	/** Trusted HTTP(S) origins for incoming links. Relative URLs are always accepted. */
	allowedOrigins?: readonly string[]
	/** Application schemes whose authority is the first route segment. */
	allowedSchemes?: readonly string[]
	/** Named flows use /@name/... URLs, separate from root route patterns. */
	stacks?: readonly string[]
	/** `linear` keeps one history per session; `independent` keeps per-stack history. */
	history?: 'linear' | 'independent'
	/** Factory for navigation cancellation signals. */
	createCancellationController?: () => RouteCancellationController
}

/** Structural Standard Schema v1 interoperability; validation libraries stay
 * application-owned. Input/output phantom types preserve coercion/default typing.
 * @see https://standardschema.dev/ */
export interface RouteSearchSchema<Input = unknown, Output = unknown> {
	/** Standard-schema vendor interface marker. */
	readonly '~standard': {
		/** Standard-schema spec version — always 1. */
		readonly version: 1
		/** Schema library identifier (zod/valibot/arktype/…). */
		readonly vendor: string
		/** Phantom type carrier for input/output inference — not present at runtime. */
		readonly types?: { readonly input: Input; readonly output: Output }
		/** Validates a raw value; returns the typed output or issues. */
		readonly validate: (value: unknown) =>
			| { readonly value: Output; /** Validation failures reported by the schema. */ readonly issues?: undefined }
			| {
					/** Validation failures reported by the schema. */
					readonly issues: readonly {
						/** Human-readable failure description. */
						readonly message: string
						/** Path to the failing value (keys or key objects). */
						readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[]
					}[]
			  }
			| Promise<
					| { readonly value: Output; /** Validation failures reported by the schema. */ readonly issues?: undefined }
					| {
							/** Validation failures reported by the schema. */
							readonly issues: readonly {
								/** Human-readable failure description. */
								readonly message: string
								/** Path to the failing value (keys or key objects). */
								readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[]
							}[]
					  }
			  >
	}
}

declare const decodedRouteSearch: unique symbol
/** A schema with an explicit decoder from URL strings to its navigation input.
 * Created by withSearchDecoder; numeric/boolean schema inputs require this
 * adapter unless the schema already accepts decoded URL strings. */
export interface DecodedRouteSearchSchema<Input, Output> extends RouteSearchSchema<Input, Output> {
	readonly [decodedRouteSearch]: true
}

/** Decoded URL fields before validation. Repeated keys remain arrays. */
export type RawRouteSearch = Readonly<Record<string, string | readonly string[] | undefined>>

type SearchFieldAcceptsUrl<Value> = unknown extends Value
	? true
	: [Exclude<Value, undefined>] extends [string | readonly string[]]
		? true
		: string extends Value
			? true
			: false

type SearchInputAcceptsUrl<Input> = unknown extends Input
	? true
	: Input extends object
		? false extends {
				[Key in keyof Input]-?: SearchFieldAcceptsUrl<Input[Key]>
			}[keyof Input]
			? false
			: true
		: false

/** Generated and programmatic checks keep schema inputs aligned with URL decoding.
 * A decoder is necessary when a validator requires numbers, booleans or other
 * values that the URL parser does not produce. */
export type RouteSearchValidationCheck<Validator> = Validator extends {
	readonly [decodedRouteSearch]: true
}
	? true
	: Validator extends RouteSearchSchema<infer Input, unknown>
		? SearchInputAcceptsUrl<Input> extends true
			? true
			: 'Use withSearchDecoder for non-string search inputs'
		: Validator extends (raw: infer Input) => unknown
			? SearchInputAcceptsUrl<Input> extends true
				? true
				: 'Search parsers receive decoded URL strings'
			: true

type CheckedSearchValidator<Validator> = Validator &
	(RouteSearchValidationCheck<NoInfer<Validator>> extends true
		? unknown
		: { readonly 'Search input requires an explicit URL decoder': never })

/** A validated search field bag. Ordinary interfaces need no string index
 * signature. Collection/coercion/function protocols cannot establish that bag;
 * runtime validation also rejects non-record objects from JavaScript callers. */
export type RouteSearchRecord = object & {
	readonly [
		Key in
			| typeof Symbol.iterator
			| typeof Symbol.toPrimitive
			| typeof Symbol.toStringTag
			| typeof Symbol.hasInstance
			| typeof Symbol.match
	]?: never
}

/** Search validation accepts a plain parser or an application-owned Standard Schema.
 * Parsers receive untrusted decoded values, including arrays for repeated keys.
 * A callable Standard Schema uses its v1 protocol, matching its inferred types,
 * rather than its ordinary function call signature. The protocol must return a
 * search object; a callable's ordinary return cannot establish that contract. */
export type RouteSearchValidator =
	| (((raw: Record<string, unknown>) => RouteSearchRecord | Promise<RouteSearchRecord>) & {
			/** Optional standard-schema marker — absent on plain validators. */
			readonly '~standard'?: never
	  })
	| RouteSearchSchema<unknown, RouteSearchRecord>

type RequiredRouteKeys<Value> = {
	[Key in keyof Value]-?: {} extends Pick<Value, Key> ? never : Key
}[keyof Value]

type ParsedSearch<Validator> =
	Validator extends RouteSearchSchema<unknown, infer Output>
		? Output extends RouteSearchRecord
			? Output
			: never
		: Validator extends (...args: any[]) => infer Output
			? Awaited<Output> extends RouteSearchRecord
				? Awaited<Output>
				: never
			: {}

type ParserSearchInput<Input, Output> = {
	[Key in keyof Output as Key extends RequiredRouteKeys<Input> ? Key : never]: Output[Key]
} & {
	[Key in keyof Output as Key extends RequiredRouteKeys<Input> ? never : Key]?: Output[Key]
}

/** Validated output read by loaders and screens. */
export type RouteSearchOutput<Validator> = ParsedSearch<Validator>

/** Navigation search input, distinct from output after coercion and defaults.
 * Plain parsers preserve their declared input optionality and output value types. */
export type RouteSearchInputOf<Validator> =
	Validator extends RouteSearchSchema<infer Input, unknown>
		? Input
		: Validator extends (raw: infer Input) => unknown
			? ParserSearchInput<Input, ParsedSearch<Validator>>
			: Record<string, never>

/** Absolute public path corresponding to a file or programmatic route pattern. */
export type AbsoluteRoutePath<Path extends string> =
	RouteNameOfPath<Path> extends infer Name extends string
		? Name extends 'index'
			? '/'
			: `/${Name}`
		: never

/** Inferred contract for one destination; the values are type metadata, not
 * objects applications construct. Separate search input from parsed output. */
export interface RouteContract<
	Params = Record<string, string>,
	SearchInput = Record<string, never>,
	Search = SearchInput extends Record<string, never> ? {} : SearchInput,
	Data = undefined,
	Context = RouteContext,
	RootContext = object,
> {
	/** Param schema/parser for this route family. */
	params: Params
	/** Search-param input schema (pre-validation shape). */
	searchInput: SearchInput
	/** Search-param output type after validation. */
	search: Search
	/** Loader-data type carried by this route family. */
	data: Data
	/** Context type injected into route callbacks. */
	context: Context
	/** Type metadata for dependencies supplied before guards add context. */
	readonly rootContext?: RootContext
}

/** Generated contributions of complete route contracts; application authors do
 * not write augmentation. An empty registry provides no unchecked string destination fallback. */
export interface AppRouteContracts {}

/** Generated/declared navigation flow names. The root flow always exists. */
export interface AppRouteStacks {
	/** The default/root stack contract — app-declared stacks merge onto this. */
	root: unknown
}

/** Generated custom transition names, supplied by configured transition exports. */
export interface AppRouteTransitions {}

/** Presets available without registering an application effect. */
export type BuiltinRouteTransitionName = 'default' | 'none' | 'fade'

/** Built-in presets plus the generated application's custom motion names. */
export type RouteTransitionName = BuiltinRouteTransitionName | (keyof AppRouteTransitions & string)

declare const defaultRouteContractScope: unique symbol
/** The current application's inferred contracts. Shared facade destinations
 * require a screen on every generated target; platform-only routes require
 * `validateDestination` proof or an explicit target-catalog instance. */
export type RegisteredRouteContracts = keyof AppRouteContracts extends never
	? {}
	: UnionToIntersection<AppRouteContracts[keyof AppRouteContracts]> & {
			readonly [defaultRouteContractScope]: true
		}

/** The ambient facade is shared across targets. Explicit instance catalogs
 * already describe their own platform and retain all of their declared paths. */
type StaticDestinationScope<
	Contracts,
	Name extends keyof Contracts,
> = typeof defaultRouteContractScope extends keyof Contracts
	? Contracts[Name] extends { readonly platformOnly: true }
		? never
		: unknown
	: unknown

type ParamsPart<Value> =
	RequiredRouteKeys<Value> extends never
		? { params?: keyof Value extends never ? Record<string, never> : Value }
		: { params: Value }

type SearchPart<Value> =
	RequiredRouteKeys<Value> extends never
		? { search?: keyof Value extends never ? Record<string, never> : Value }
		: { search: Value }

/** One typed navigation request. Its route union preserves correlations between
 * to/params/search; prepared data/context are excluded. */
export type DestinationFor<
	Contracts,
	Name extends keyof Contracts & string = keyof Contracts & string,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = Name extends unknown
	? Contracts[Name] extends { /** Params shape inferred from the destination contract. */ params: infer Params; /** Search-input shape inferred from the destination contract. */ searchInput: infer Input }
		? {
				/** Destination route name — constrained by the Contracts generic. */
				to: Name
				/** Target stack for the navigation. */
				stack?: Stacks
				/** Presentation for the navigation (push/modal). */
				presentation?: 'push' | 'modal'
				/** Transition name for the navigation. */
				transition?: Transitions
				/** Fragment appended to the destination URL. */
				hash?: string
				/** Replaces the current history entry instead of pushing. */
				replace?: boolean
			} & ParamsPart<Params> &
				SearchPart<Input> &
				StaticDestinationScope<Contracts, Name>
		: never
	: never

/** Typed destination from generated file/programmatic contributions. */
export type Destination<
	Name extends keyof RegisteredRouteContracts & string = keyof RegisteredRouteContracts & string,
> = DestinationFor<RegisteredRouteContracts, Name>

/** Structured props from a route contract, finished definition or preparation
 * builder. Use a builder for its own named screen to avoid a self-reference.
 */
export type RouteScreenProps<Source> =
	Source extends RouteContract<infer Params, any, infer Search, infer Data, infer Context>
		? { /** Resolved params delivered to the screen factory. */ params: Params; /** Validated search delivered to the screen factory. */ search: Search; /** Loader data delivered to the screen factory. */ data: Data; /** Merged context delivered to the screen factory. */ context: Context }
		: Source extends { readonly [routeDefinitionTypes]: infer Contract }
			? RouteScreenProps<Contract>
			: Source extends {
						/** Binds the screen component; its props are inferred for the route contract. */
						readonly screen: (component: (props: infer Props) => Renderable) => unknown
				  }
				? Props
				: never

/** Generated screen inputs, inferred from route declarations and loader output. */
export type RouteProps<Name extends keyof RegisteredRouteContracts & string> = RouteScreenProps<
	RegisteredRouteContracts[Name]
>

declare const routeDefinitionTypes: unique symbol
type AddedRouteContext<Value> = Value extends object ? Value : {}
type ContextFields<Context> = {
	[
		Key in keyof Context as string extends Key
			? never
			: number extends Key
				? never
				: symbol extends Key
					? never
					: Key
	]: Context[Key]
}

type ContextIndexes<Context> = {
	[
		Key in keyof Context as string extends Key
			? Key
			: number extends Key
				? Key
				: symbol extends Key
					? Key
					: never
	]: Context[Key]
}

/** Preserve named parent fields when a root context also has an index signature. */
export type MergedRouteContext<Context, Added> = Omit<
	ContextFields<Context>,
	keyof AddedRouteContext<Added>
> &
	ContextIndexes<Context> &
	AddedRouteContext<Added>

/** Contextual callback inputs inferred by defineRoute for programmatic routes. */
export interface RouteDefinitionArgs<Path extends string, Validator, Context> {
	/** Resolved path params passed to the screen. */
	params: RouteSpecParams<Path>
	/** Validated search passed to the screen. */
	search: RouteSearchOutput<Validator>
	/** Route context passed to the screen. */
	context: Context
	/** Aborts when the navigation is superseded. */
	signal?: RouteCancellationSignal
}

/** Resolved beforeLoad output: a plain context object or no additions. Results
 * are awaited, so a thenable must resolve to context rather than become context.
 * Ordinary interfaces need no string index signature. Runtime preparation also
 * rejects arrays and non-plain objects before loading.
 */
export type RouteGuardResult = (object & { /** Thenable-poisoning guard — a Result must not satisfy PromiseLike. */ readonly then?: never }) | void

type InferredRouteCallbackSearch<Validator> = [RouteSearchOutput<Validator>] extends [never]
	? Record<string, unknown>
	: RouteSearchOutput<Validator>

type RouteDefinitionCallbackArgs<Path extends string, Validator, Context> = {
	/** Params a guard may rewrite before commit. */
	params: NoInfer<RouteSpecParams<Path>>
	/** Search a guard may rewrite before commit. */
	search: NoInfer<InferredRouteCallbackSearch<Validator>>
	/** Context a guard may extend before commit. */
	context: Context
	/** Aborts when the navigation is superseded. */
	signal?: RouteCancellationSignal
}

/** Programmatic preparation input. Attach a screen to the returned builder
 * after these contracts have been inferred. Use withContext for root services. */
export interface RouteDefinitionInput<Path extends string, Validator, Context, Added, Data> {
	/** Route path pattern (params as `:name`). */
	path: Path
	/** Search-param validator for this route. */
	validateSearch?: CheckedSearchValidator<Validator>
	/** Guard run before the loader — may redirect or abort. */
	beforeLoad?: (
		/** Callback args passed to `loader`/`beforeLoad` (params, search, context, signal). */
		args: RouteDefinitionCallbackArgs<Path, Validator, Context>,
	) => Added | Promise<Added>
	/** Data loader run during preparation. */
	loader?: (
		/** Callback args including context merged from earlier guards. */
		args: RouteDefinitionCallbackArgs<Path, Validator, MergedRouteContext<Context, NoInfer<Added>>>,
	) => Data
	/** Default presentation for this route. */
	presentation?: 'push' | 'modal'
	/** Default transition for this route. */
	transition?: RouteTransitionName
	/** Head metadata (title/meta) for this route. */
	head?: RouteHeadExport<
		RouteSpecParams<Path>,
		NoInfer<RouteSearchOutput<Validator>>,
		MergedRouteContext<Context, NoInfer<Added>>,
		Awaited<NoInfer<Data>>
	>
	/** Boundary rendered when the screen or loader throws. */
	errorBoundary?: (props: RouteErrorBoundaryProps) => Renderable
	/** Originating module specifier — used for diagnostics/HMR. */
	source?: string
}

/** A preparation contract whose screen has not been attached. An unfinished
 * builder cannot enter a catalog. Each screen attachment creates a fresh,
 * immutable definition using the captured preparation options.
 * @example
 * import { defineRoute } from '@octane-xplat/ui/routing/core'
 * const item = defineRoute({ path: '/items/:id', loader: ({ params }) => params.id })
 *   .screen(({ data }) => data)
 */
export interface RouteDefinitionBuilder<
	Path extends string,
	Validator,
	Context,
	Added,
	Data,
	Root = Context,
> {
	/** Finalizes the route — binds the screen component. */
	readonly screen: (
		/** Screen component receiving the resolved route props. */
		component: (props: {
			/** Resolved path params delivered to the screen. */
			params: RouteSpecParams<Path>
			/** Validated search delivered to the screen. */
			search: RouteSearchOutput<Validator>
			/** Awaited loader data delivered to the screen. */
			data: Awaited<Data>
			/** Merged route context delivered to the screen. */
			context: MergedRouteContext<Context, Added>
		}) => Renderable,
	) => DefinedRoute<Path, Validator, Context, Added, Data, Root>
}

/** Require an actual loader when inferring loaded data. Loader-free builders
 * have undefined data and cannot select an unchecked data generic. */
export type RouteDefinitionWithLoader<
	Path extends string,
	Validator,
	Context,
	Added,
	Data,
> = RouteDefinitionInput<Path, Validator, Context, Added, Data> & {
	/** The route's data loader. */
	loader: NonNullable<RouteDefinitionInput<Path, Validator, Context, Added, Data>['loader']>
}

/** A definition ready for manifest assembly, carrying complete inferred metadata. */
export type DefinedRoute<
	Path extends string,
	Validator,
	Context,
	Added,
	Data,
	Root = Context,
> = Readonly<Omit<RouteSpec, 'screen' | 'preparation'>> & {
	/** Route path pattern. */
	readonly path: Path
	/** Guard/loader groups bound to this route. */
	readonly preparation?: Readonly<RoutePreparationBehavior>
	/** Screen component factory bound by the builder. */
	readonly screen: Parameters<
		RouteDefinitionBuilder<Path, Validator, Context, Added, Data, Root>['screen']
	>[0]
	readonly [routeDefinitionTypes]: RouteContract<
		RouteSpecParams<Path>,
		RouteSearchInputOf<Validator>,
		RouteSearchOutput<Validator>,
		Awaited<Data>,
		MergedRouteContext<Context, Added>,
		Root
	>
}

type ContractForSpec<Spec, Baked = Record<string, unknown>> = Spec extends {
	readonly [routeDefinitionTypes]: infer Contract
}
	? Contract
	: Spec extends { /** Route path pattern. */ path: infer Path extends string }
		? FileRouteContract<
				Path,
				Spec,
				RouteContext,
				RouteNameOfPath<Path> extends keyof Baked ? Baked[RouteNameOfPath<Path>] : unknown
			>
		: never

/** Finite keys require properties; open string/template indexes accept {}.
 * Runtime-discovered paths stay available through URL validation. */
export type FiniteRoutePath<Path extends string> = Path extends unknown
	? {} extends Record<Path, never>
		? never
		: Path
	: never

/** Deliberately runtime-only catalog: dependencies remain typed, paths do not. */
export type RuntimeRouteCatalog<Specs extends readonly RouteSpec[]> = RouteCatalog<{
	readonly [runtimeRouteContractTypes]: ContractForSpec<Specs[number]>
}>

/** Reject open path indexes in the ordinary declared catalog builder. */
export type DeclaredRouteSpecs<Specs extends readonly RouteSpec[]> =
	Exclude<Specs[number]['path'], FiniteRoutePath<Specs[number]['path']>> extends never
		? unknown
		: {
				/** Compile-time guard rejecting widened string paths. */
				readonly 'Preserve literal paths with as const, or use defineRuntimeRoutes for computed paths': never
			}

declare const runtimeRouteContractTypes: unique symbol
/** Preserve runtime-route dependencies without exposing another string name. */
type RuntimeRouteContracts<Spec, Path extends string> = [
	Exclude<Path, FiniteRoutePath<Path>>,
] extends [never]
	? {}
	: { readonly [runtimeRouteContractTypes]: ContractForSpec<Spec> }

type ContractEntry<Spec, Baked = Record<string, unknown>> = Spec extends {
	/** Path pattern captured for param inference. */
	path: infer Path extends string
}
	? {
			[Name in AbsoluteRoutePath<FiniteRoutePath<Path>>]: Omit<
				ContractForSpec<Spec, Baked>,
				'params'
			> & {
				/** Param record inferred from the path pattern. */
				params: RouteSpecParams<Name>
			}
		} & RuntimeRouteContracts<Spec, Path>
	: never

/** Complete contract map inferred from a programmatic route list. */
export type RouteContractsFromSpecs<
	Specs extends readonly RouteSpec[],
	Baked = Record<string, unknown>,
> = [Specs[number]] extends [never] ? {} : UnionToIntersection<ContractEntry<Specs[number], Baked>>

declare const routeCatalogTypes: unique symbol
declare const routeContractVariance: unique symbol

/** Reusable definitions with inferred destination metadata. Generated file
 * catalogs and manifest composition carry this brand only at the type level. */
export type RouteCatalog<Contracts> = RouteManifest & {
	readonly [routeCatalogTypes]: Contracts
	readonly [routeContractVariance]: (contracts: Contracts) => Contracts
}

/** Executable contract-bearing inputs. Erasing a catalog to RouteManifest also
 * erases the right to compose it into a declared contract map. */
export type ContractRouteManifest = RouteManifest & {
	readonly [routeContractVariance]: (contracts: never) => unknown
}

/** Reject erased catalog views at boundaries that depend on their contracts. */
export type KnownRouteCatalog<Catalog> =
	unknown extends ContractsOf<Catalog>
		? { /** Compile-time guard against widening the catalog. */ readonly 'Preserve the inferred catalog type': never }
		: unknown

type KeysOfRouteMaps<Maps> = Maps extends unknown ? keyof Maps : never
type ValueOfRouteMaps<Maps, Key> = Maps extends unknown
	? Key extends keyof Maps
		? Maps[Key]
		: never
	: never

type MergeRouteContractPair<Left, Right> = Omit<Left, keyof Right> &
	Right &
	// Runtime paths cannot be proven to replace one another; both need context.
	(Left extends { readonly [runtimeRouteContractTypes]: infer Earlier }
		? Right extends { readonly [runtimeRouteContractTypes]: infer Later }
			? { readonly [runtimeRouteContractTypes]: Earlier & Later }
			: {}
		: {})

/** Merge contract maps in registration order. Later declarations replace the
 * earlier contract for the same public pattern, matching runtime precedence. */
export type MergeRouteContracts<
	Maps extends readonly unknown[],
	Accumulator = {},
> = number extends Maps['length']
	? { [Key in KeysOfRouteMaps<Maps[number]>]: ValueOfRouteMaps<Maps[number], Key> }
	: Maps extends readonly [infer Head, ...infer Tail]
		? MergeRouteContracts<Tail, MergeRouteContractPair<Accumulator, Head>>
		: Accumulator

/** Read inferred contracts from a manifest or individual definition for generated
 * registration, without evaluating its module. */
export type ContractsOf<Value> = Value extends {
	readonly [routeContractVariance]: (contracts: never) => infer Contracts
}
	? Contracts
	: Value extends {
				readonly [specRouteTypes]: { /** Route contracts captured for inference. */ contracts: infer Contracts }
		  }
		? Contracts
		: Value extends { readonly [routeDefinitionTypes]: unknown; /** Path key inside the contract map. */ path: string }
			? ContractEntry<Value>
			: {}

type FileSearchValidator<Module> = Module extends { validateSearch: infer Validator }
	? Validator
	: undefined

type FileGuardContext<Module> = Module extends { beforeLoad: (...args: any[]) => infer Added }
	? AddedRouteContext<Awaited<Added>>
	: {}

/** Root context inferred from a configured context factory or object export. */
export type RouteRootContext<Value> = Value extends (...args: any[]) => infer Context
	? Awaited<Context>
	: Value

declare const routeGroupTypes: unique symbol
/** Parent lifecycle metadata. Create groups with defineRouteGroup. */
export interface RouteGroup<Context = RouteContext, Root = Context> {
	readonly [routeGroupTypes]: { /** Context contributed by this group. */ readonly context: Context; /** Root context the group merges over. */ readonly rootContext: Root }
}

type FileGroupContext<Module> = Module extends { group: RouteGroup<infer Context, any> }
	? Context
	: {}

type FileGroupRoot<Module> = Module extends { group: RouteGroup<any, infer Root> } ? Root : {}
type FileRootContext<Module, Context> = string extends keyof Context
	? FileGroupRoot<Module>
	: Context & FileGroupRoot<Module>

/** Generated guard inputs depend only on the route's path, search validator and
 * root context. They deliberately exclude the guard's own return type. */
export type FileRouteGuardArgs<
	Path extends string,
	Module,
	Context = RouteContext,
> = RouteDefinitionArgs<
	Path,
	FileSearchValidator<Module>,
	MergedRouteContext<Context, FileGroupContext<Module>>
>

/** Generated loader inputs add the context returned by this route's guard. */
export type FileRouteLoaderArgs<
	Path extends string,
	Module,
	Context = RouteContext,
> = RouteDefinitionArgs<
	Path,
	FileSearchValidator<Module>,
	MergedRouteContext<
		MergedRouteContext<Context, FileGroupContext<Module>>,
		FileGuardContext<Module>
	>
>

/** Build-only sibling output. Generated contracts reference the module through
 * types only; runtime catalogs never import or execute it. */
export type RouteBakedLoaderData<Module> = Module extends { /** Named loader export captured from the module. */ loader: (...args: any[]) => infer Data }
	? Awaited<Data>
	: Module extends { /** Default export captured from the module. */ default: (...args: any[]) => infer Data }
		? Awaited<Data>
		: unknown

type RouteLoaderOutput<Loader> = Loader extends (...args: any[]) => infer Data
	? Awaited<Data>
	: undefined

type RouteModuleLiveData<Module> = 'loader' extends keyof Module
	? RouteLoaderOutput<Module['loader']>
	: undefined

type RouteModuleData<Module, Baked> = Module extends { dataMode: 'baked' }
	? Baked
	: 'dataMode' extends keyof Module
		? 'baked' extends Module['dataMode']
			? Baked | RouteModuleLiveData<Module>
			: RouteModuleLiveData<Module>
		: RouteModuleLiveData<Module>

/** A named-export route contract inferred without depending on its screen or
 * the application's ambient registry. Generated glue supplies path/module and
 * the separately inferred baked output when applicable. */
export type FileRouteContract<
	Path extends string,
	Module,
	Context = RouteContext,
	BakedData = unknown,
> = RouteContract<
	RouteSpecParams<Path>,
	RouteSearchInputOf<FileSearchValidator<Module>>,
	RouteSearchOutput<FileSearchValidator<Module>>,
	RouteModuleData<Module, BakedData>,
	MergedRouteContext<
		MergedRouteContext<Context, FileGroupContext<Module>>,
		FileGuardContext<Module>
	>,
	FileRootContext<Module, Context>
>

type DeclaredRootContext<Contract> =
	Contract extends RouteContract<any, any, any, any, any, infer Root>
		? Root extends object
			? string extends keyof Root
				? {}
				: Root
			: {}
		: {}

/** Root dependencies required by this catalog, excluding guard additions. */
export type RouterRootContext<Contracts> =
	UnionToIntersection<
		{
			[Name in keyof Contracts]: DeclaredRootContext<Contracts[Name]>
		}[keyof Contracts]
	> extends infer Context extends object
		? Context
		: object

type RouterContextOptions<Context extends object> = {} extends Context
	? { context?: Context | (() => Context | Promise<Context>) }
	: { context: Context | (() => Context | Promise<Context>) }

/** Inferred match union. A route identity narrows params, search and loader data
 * together; callers cannot select arbitrary data with a generic assertion. */
export type RouteMatchFor<
	Contracts,
	Name extends keyof Contracts & string = keyof Contracts & string,
> = Name extends unknown
	? Contracts[Name] extends RouteContract<
			infer Params,
			any,
			infer Search,
			infer Data,
			infer Context
		>
		? Omit<PreparedRouteMatch, 'to' | 'params' | 'search' | 'data' | 'context'> & {
				/** Discriminates declared routes from manifest/baked matches. */
				contract: 'declared'
				/** Route name this match resolves to. */
				to: Name
				/** Resolved path params for the match. */
				params: Params
				/** Validated search params for the match. */
				search: Search
				/** Loader data carried by the match. */
				data: Data
				/** Route context carried by the match. */
				context: Context
			}
		: never
	: never

/** Aggregate reads include runtime registrations. Declared matches retain their
 * inferred union; runtime matches keep data unknown. Named accessors check this
 * boundary automatically for the rendering entry. */
export type RouterMatch<Contracts = RegisteredRouteContracts> =
	| ([FiniteRoutePath<keyof Contracts & string>] extends [never]
			? PreparedRouteMatch & { /** Declared-route discriminator. */ readonly contract: 'declared' }
			: RouteMatchFor<Contracts>)
	| (PreparedRouteMatch & { /** Runtime/manifest-route discriminator. */ readonly contract: 'runtime' })

/** Animation settlement is independent from a successful navigation commit. */
export type RouteTransitionResult =
	| { /** Completed discriminator — the transition finished. */ status: 'completed' }
	| { /** Skipped discriminator — no transition ran. */ status: 'skipped'; /** Why the transition was skipped. */ reason: 'disabled' | 'reduced-motion' | 'unsupported' | 'interrupted' }
	| { /** Failed discriminator — the transition errored. */ status: 'failed'; /** The thrown failure value. */ error: unknown }

/** Motion receives prepared matches; it cannot decide when navigation commits. */
export interface RouteTransitionContext {
	/** `forward` on push, `back` on pop. */
	direction: 'forward' | 'back'
	/** Host command driving the transition. */
	action: RouterHostCommand['action'] | 'forward'
	/** Route being left, or null on first mount. */
	from: PreparedRouteMatch | null
	/** Route being entered, or null on dismissal. */
	to: PreparedRouteMatch | null
}

/** CSS supplies the visual effect selected by these browser transition types. */
export interface WebTransitionOptions {
	/** View-transition type list, or a function computing it per navigation. */
	types?: readonly string[] | ((context: RouteTransitionContext) => readonly string[])
	/** `skip` honors prefers-reduced-motion; `allow` plays anyway. */
	reducedMotion?: 'skip' | 'allow'
	/** Behavior when view transitions are unavailable (`skip` only). */
	unsupported?: 'skip'
}

/** Numeric starting values for a router-owned native view. The effect ends at
 * opacity/scale 1 and translation/rotation 0 without changing screen styles.
 * Translations use layout units (DIP on NativeScript), rotation uses degrees
 * and opacity ranges 0–1. */
export interface NativeViewTransitionValues {
	/** Alpha applied to the transitioning view. */
	opacity?: number
	/** Horizontal offset in DIPs. */
	translateX?: number
	/** Vertical offset in DIPs. */
	translateY?: number
	/** Horizontal scale factor. */
	scaleX?: number
	/** Vertical scale factor. */
	scaleY?: number
	/** Rotation in degrees. */
	rotate?: number
}

/** AppKit shares the flat native view vocabulary. */
export type AppKitTransitionValues = NativeViewTransitionValues

/** Incoming-view animation on AppKit; NativeScript Frames and browser View
 * Transitions use their respective platform helpers. */
export interface AppKitTransitionOptions {
	/** Start values for the incoming view — static or computed per navigation. */
	from:
		| Readonly<AppKitTransitionValues>
		| ((context: RouteTransitionContext) => Readonly<AppKitTransitionValues>)
	/** Animation duration in ms. */
	duration?: number
	/** `skip` honors reduced-motion; `allow` plays anyway. */
	reducedMotion?: 'skip' | 'allow'
}

/** Platform leaves return the same definition contract. A skipped leaf is an
 * explicit fallback for a target without the application's visual effect. */
export type TransitionDefinition =
	| { /** Web view-transition discriminator. */ readonly kind: 'web'; /** View-transition options for the web leaf. */ readonly options: Readonly<WebTransitionOptions> }
	| { /** Skip discriminator — no transition runs. */ readonly kind: 'skip' }
	| NativeTransitionDefinition

declare const nativeTransitionTypes: unique symbol
/** Opaque native effect created by a platform integration helper. Portable
 * routing contracts do not import the platform's view or animation types. */
export interface NativeTransitionDefinition {
	/** Marks this transition as native-rendered (vs web view-transition). */
	readonly kind: 'native'
	readonly [nativeTransitionTypes]: true
}

/** Named client effects, resolved by platform leaves and generated registration. */
export type TransitionRegistry = Readonly<Record<string, TransitionDefinition>>

/** Finite declared names only; runtime maps cannot widen generated motion keys. */
export type TransitionNames<Definitions> = FiniteRoutePath<keyof Definitions & string>

/** Result of a client navigation. Expected refusals/cancellation settle normally;
 * local errors are retained for diagnostics and must not be serialized blindly. */
export type NavigationResult<Contracts = RegisteredRouteContracts> =
	| {
			/** Committed discriminator for navigation outcomes. */
			status: 'committed'
			/** The committed match — null when navigation left no route (e.g. dismissed to empty). */
			route: RouterMatch<Contracts> | null
			/** True when a guard redirected before commit. */
			redirected: boolean
			/** Resolves when the transition animation completes. */
			finished: Promise<RouteTransitionResult>
	  }
	| Exclude<RoutePreparationResult, { /** Committed discriminator for navigation outcomes. */ status: 'ready' }>
	| { /** Ready discriminator — the navigation prepared successfully. */ status: 'failed'; /** Phase that failed (commit). */ phase: 'commit'; /** The thrown failure value. */ error: unknown }
	| { /** Failed discriminator — the navigation threw during commit. */ status: 'blocked'; /** Why the host could not commit. */ reason?: 'host-not-ready' | 'missing-outlet' | 'at-base' | 'busy' }
	| { /** Blocked discriminator — a blocker is holding the navigation. */ status: 'unsupported'; /** Operation the host rejected. */ operation: string }
	| { /** Unsupported discriminator — the host cannot perform the action. */ status: 'at-base' | 'not-modal' | 'unmatched' }

/** A navigation refusal or failure suitable for local recovery UI. Error
 * objects remain local; expected missing/forbidden outcomes need no exception. */
export type NavigationFailure = Extract<
	NavigationResult,
	{
		/** Failure discriminator — why the navigation did not commit. */
		status: 'failed' | 'not-found' | 'forbidden' | 'invalid-input' | 'blocked' | 'unsupported'
	}
>

/** Readonly URL inputs captured for navigation feedback; search is unvalidated
 * input and never a route's inferred successful output. */
export type NavigationDestinationSnapshot = Omit<
	Readonly<RouteDestinationInput>,
	'params' | 'search'
> & {
	/** Param snapshot for the destination. */
	readonly params?: Readonly<Record<string, string | undefined>>
	/** Search snapshot for the destination. */
	readonly search?: Readonly<Record<string, unknown>>
}

/** Reactive work and failure feedback for one rendering flow. A committed
 * screen stays visible while another destination prepares or fails.
 * @example
 * import { useNavigation } from '@octane-xplat/ui/routing'
 * const navigation = useNavigation()
 * if (navigation.status === 'failed') console.error(navigation.result.status)
 */
export type RouterNavigationState =
	| { /** `pending` while a navigation is in flight. */ readonly status: 'idle' }
	| {
			/** `pending` while a navigation is in flight. */
			readonly status: 'pending'
			/** Host command driving the in-flight navigation. */
			readonly action: RouterHostCommand['action']
			/** Snapshot of where the navigation is going. */
			readonly destination: NavigationDestinationSnapshot | null
	  }
	| {
			/** `failed` when the navigation did not commit. */
			readonly status: 'failed'
			/** Host command that failed. */
			readonly action: RouterHostCommand['action']
			/** Snapshot of the failed destination. */
			readonly destination: NavigationDestinationSnapshot | null
			/** Failure detail for the last navigation. */
			readonly result: Readonly<NavigationFailure>
	  }

/** Enable confirmation before this visible rendering entry leaves its flow.
 * Client navigation only: this does not intercept document unload or OS exit.
 * @example
 * import { useNavigationBlocker } from '@octane-xplat/ui/routing'
 * const blocker = useNavigationBlocker({ when: hasUnsavedChanges })
 */
export interface NavigationBlockerOptions {
	/** Ask while true. Changing to false cancels a still-blocked request. */
	when: boolean
}

/** Confirmation for one navigation attempt. Obsolete controls become inert;
 * proceed resumes preparation with current context and reset cancels the attempt.
 * @example
 * if (blocker.status === 'blocked') blocker.reset()
 */
export type NavigationBlockerState =
	| { /** `blocked` — a guard is holding the navigation pending a decision. */ readonly status: 'idle' }
	| {
			/** `blocked` — a guard is holding the navigation pending a decision. */
			readonly status: 'blocked'
			/** Host command being held. */
			readonly action: RouterHostCommand['action']
			/** Snapshot of the held destination. */
			readonly destination: NavigationDestinationSnapshot | null
			/** Releases the held navigation to continue. */
			readonly proceed: () => void
			/** Cancels the held navigation and unblocks. */
			readonly reset: () => void
	  }
	| {
			/** `proceeding` — the blocked navigation was released. */
			readonly status: 'proceeding'
			/** Host command that was released. */
			readonly action: RouterHostCommand['action']
			/** Snapshot of the released destination. */
			readonly destination: NavigationDestinationSnapshot | null
	  }

/** Snapshot of the owning navigation flow. Pending work leaves the current
 * committed match visible. Snapshots are stable until the instance changes. */
export interface RouterState<Contracts = RegisteredRouteContracts> {
	/** Current prepared match, or null before the first commit. */
	route: RouterMatch<Contracts> | null
	/** In-flight navigation state (idle/loading/…). */
	navigation: RouterNavigationState
	/** Whether back navigation is currently possible. */
	canGoBack: boolean
	/** Whether the top entry is presented modally. */
	modal: boolean
}

/** Familiar, bound navigation operations. Hooks bind this surface to the
 * rendering flow; the ordinary client facade defaults to the root flow. Explicit
 * instances carry their configured stack union through every destination. */
export interface RouterNavigator<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> {
	/** Pushes a destination onto history. */
	push(
		/** Navigation target for `push`. */
		destination: NavigationDestination<Contracts, Stacks, Transitions>,
	): Promise<NavigationResult<Contracts>>
	/** Replaces the current history entry with a destination. */
	replace(
		/** Navigation target for `replace`. */
		destination: NavigationDestination<Contracts, Stacks, Transitions>,
	): Promise<NavigationResult<Contracts>>
	/** Navigates honoring the destination's presentation defaults. */
	navigate(
		/** Navigation target for `navigate`. */
		destination: NavigationDestination<Contracts, Stacks, Transitions>,
	): Promise<NavigationResult<Contracts>>
	/** Navigates to a raw URL resolved through the router. */
	navigateUrl(
		/** URL resolved through the router's catalog. */
		url: string,
		/** `replace: true` swaps the current entry instead of pushing. */
		options?: { /** Swap the current entry instead of pushing. */ replace?: boolean },
	): Promise<NavigationResult<Contracts>>
	/** Resets history to a single destination. */
	reset(
		/** Navigation target for `reset` (becomes the new root). */
		destination: NavigationDestination<Contracts, Stacks, Transitions>,
	): Promise<NavigationResult<Contracts>>
	/** Goes back one entry, or to `fallback` when none exists. */
	back(options?: {
		/** Destination used when the host cannot go back. */
		fallback?: NavigationDestination<Contracts, Stacks, Transitions>
	}): Promise<NavigationResult<Contracts>>
	/** Dismisses the current modal entry. */
	dismiss(): Promise<NavigationResult<Contracts>>
	/** Re-runs preparation for the current route. */
	refresh(): Promise<NavigationResult<Contracts>>
	/** Retries the last failed navigation. */
	retry(): Promise<NavigationResult<Contracts>>
	/** Dismiss this flow's failure and retry target without cancelling work.
	 * @example
	 * import { router } from '@octane-xplat/ui/routing'
	 * router.clearFailure()
	 */
	clearFailure(): void
	/** Resolves a destination to a URL without navigating. */
	href(destination: NavigationDestination<Contracts, Stacks, Transitions>): string
	/** Resolves a URL to a route without navigating. */
	resolveUrl(url: string): RouteResolution
	/** Import route code without preparing data or changing navigation state. */
	preload(
		/** Navigation target to preload. */
		destination: NavigationDestination<Contracts, Stacks, Transitions>,
		/** `signal` aborts the preload. */
		options?: { /** Aborts the navigation when the signal fires. */ signal?: RouteCancellationSignal },
	): Promise<RoutePreloadResult>
	/** Check raw values and the route's async search schema without loading data.
	 * Successful navigation always rechecks the current catalog and guards.
	 * @example
	 * import { router } from '@octane-xplat/ui/routing'
	 * const checked = await router.validateDestination({ to: '/items/:id', params: { id: 'coat' } })
	 * if (checked.status === 'valid') await router.push(checked.destination)
	 */
	validateDestination(
		/** Raw destination value to check. */
		value: unknown,
		/** `signal` aborts the validation. */
		options?: { /** Aborts the navigation when the signal fires. */ signal?: RouteCancellationSignal },
	): Promise<DestinationValidationResult>
	/** Current router state for external stores. */
	getSnapshot(): RouterState<Contracts>
	/** Subscribes to router state changes; returns an unsubscribe. */
	subscribe(listener: () => void): () => void
}

/** A provider binds hooks to an instance and an explicitly named flow. It does
 * not own/dispose the instance or infer the last active tab. */
export interface RouterProviderProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> {
	/** Router instance provided to the subtree. */
	router: RouterInstance<Contracts, Stacks, Transitions>
	/** Stack registry the router manages. */
	stack?: NoInfer<Stacks>
	/** App content rendered inside the provider. */
	children?: any
}

declare const paneRouterHostTypes: unique symbol

/** An original retained-pane host. Give host to createRouter, then attach that
 * same instance before mounting RouterPane. One host belongs to one instance.
 * Instance disposal releases the host; it cannot be recycled for another owner.
 */
export interface PaneRouterHost {
	/** Router host bound to this pane. */
	readonly host: RouterHost
	/** Binds the host to a router instance and stack. */
	readonly attach: <Contracts, Stacks extends string, Transitions extends string>(
		/** Router instance bound by `attach`. */
		router: RouterInstance<Contracts, Stacks, Transitions>,
	) => void
	readonly [paneRouterHostTypes]: true
}

/** A retained pane belonging to an explicit router instance. Stack names come
 * from that instance; host attachment must name the same instance. The creator
 * disposes the instance, while pane removal releases its owned rendering flow.
 * This host keeps independent history without browser URLs or native Frames.
 * @see createPaneRouterHost in @octane-xplat/ui/routing.
 */
export interface RouterPaneProps<Contracts, Stacks extends string, Transitions extends string> {
	/** Router instance driving this pane. */
	router: RouterInstance<Contracts, Stacks, Transitions>
	/** Pane host receiving route commands. */
	host: PaneRouterHost
	/** Declared stack to render. @default 'root' */
	stack?: NoInfer<Stacks>
	/** Retained content shown when the pane returns to its base entry. */
	children?: Renderable
}

/** Replace a route's entire search input, or derive it from validated output.
 * Omitted fields are removed; preservation is explicit in the callback.
 * The callback belongs to its rendering entry and refuses stale edits. */
export type RouteSearchUpdater<Contracts, Name extends keyof Contracts & string> = (
	/** New search value, or an updater receiving the previous validated search. */
	search:
		| (Contracts[Name] extends { /** Search-input shape captured for the updater signature. */ searchInput: infer Input } ? Input : never)
		| ((
				/** The rendering entry's previous validated search. */
				previous: Readonly<RouteMatchFor<Contracts, Name>['search']>,
		  ) => Contracts[Name] extends { /** Search-input shape captured for the updater signature. */ searchInput: infer Input } ? Input : never),
	/** `replace: false` creates a Back destination instead of replacing the history entry (default). */
	options?: { /** `false` creates a Back destination instead of replacing the entry. */ replace?: boolean },
) => Promise<NavigationResult<Contracts>>

/** Reads are inferred together from one route identity. A hook throws when
 * that route is absent from the rendering entry; it never borrows another
 * retained entry's data. */
export interface RouteApi<Contracts, Name extends keyof Contracts & string> {
	/** Subscribes to the full match for this route. */
	useMatch(): RouteMatchFor<Contracts, Name>
	/** Subscribes to the match's params. */
	useParams(): RouteMatchFor<Contracts, Name>['params']
	/** Subscribes to the match's validated search. */
	useSearch(): RouteMatchFor<Contracts, Name>['search']
	/** Subscribes to the match's loader data. */
	useLoaderData(): RouteMatchFor<Contracts, Name>['data']
	/** Subscribes to the match's context. */
	useContext(): RouteMatchFor<Contracts, Name>['context']
	/** Edit this rendering entry's filters. Replaces history by default; loaders
	 * and guards rerun. Pass replace:false to create a Back destination. */
	useUpdateSearch(): RouteSearchUpdater<Contracts, Name>
}

/** An explicitly owned router. Dispose the whole instance at its app/window or
 * request boundary; individual screen hooks only receive RouterNavigator. The
 * createRouter factory infers Stacks from its configuration, always including root. */
export interface RouterInstance<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> extends RouterNavigator<Contracts, Stacks, Transitions> {
	forStack(stack: Stacks): RouterNavigator<Contracts, Stacks, Transitions>
	/** Runtime layers do not widen this instance's compile-time destination union.
	 * Reusing an id replaces that contribution; an older disposer stays inert. */
	addRoutes<const Catalog extends ContractRouteManifest>(
		/** Route manifest the instance was created from (intersected with registered contracts). */
		catalog: Catalog &
			KnownRouteCatalog<NoInfer<Catalog>> &
			(RouterRootContext<Contracts> extends RouterRootContext<ContractsOf<Catalog>>
				? unknown
				: never),
		/** Registration options for the route. */
		options: RouteRegistrationOptions,
	): RouteRegistration
	/** Tears down the router — unsubscribes hosts and releases resources. */
	dispose(): void
}

export interface RouteRegistrationOptions {
	/** Registration id used to dedupe/unregister. */
	id: string
	/** Collisions fail by default. Replace shadows runtime layers; an instance's
	 * declared contracts cannot be replaced by runtime registration. */
	conflict?: 'error' | 'replace'
}

export interface RouteRegistration {
	/** Unregisters the route. */
	dispose(): void
}

/** Adapter snapshot: host history is authoritative, including OS/browser Back.
 * The adapter keeps entry identity and retained screen ownership. */
export interface RouterHostSnapshot {
	/** Permanently ended identity; hosts must not reuse it for another flow. */
	disposed?: boolean
	/** Currently committed route, or null. */
	route: PreparedRouteMatch | null
	/** Whether back is possible on this host. */
	canGoBack: boolean
	/** Whether the host's top entry is modal. */
	modal: boolean
}

/** Accepted browser/OS traversal invalidates pending work. Ordinary commits
 * publish without external so they do not cancel their own request. */
export interface RouterHostChange {
	/** Permanent flow disposal, distinct from hiding/unmounting retained history.
	 * The host also reports disposed in later snapshots for that identity. */
	flowDisposed?: boolean
	/** Owner removal cancels only that flow's unaccepted work. It is not an
	 * external history traversal: a commit may itself remove source outlets. */
	ownerDisposed?: boolean
	/** True when the change came from outside the router (e.g. browser back). */
	external?: boolean
	/** Flow id grouping this change. */
	flow?: string
}

/** Executable render selection from the instance's current catalog. This never
 * crosses URL, browser history state, or server transfer boundaries. */
export interface RouterHostContent {
	/** Screen component to render. */
	screen: ScreenComponent
	/** Layout chain wrapping the screen. */
	layouts: LayoutComponent[]
	/** Error boundary configured for this route. */
	boundary?: RouteMeta['errorBoundary']
	/** Props forwarded to the screen. */
	props: Record<string, unknown>
	/** Resolved head metadata for the route. */
	head?: RouteHead
}

/** @internal Rendering bindings shared by platform hosts and owned outlets. */
export interface ClientRouterHost {
	/** Underlying router host implementation. */
	host: RouterHost
	/** Binds the host to a router instance. */
	attach(router: RouterInstance<any, any, any>): void
	/** Render scope for a flow id. */
	scope(flow: string): import('./routing/router-render-scope').RouterRenderScope
	/** Mounts a flow's outlet under the given owner. */
	mount(flow: string, owner: import('./components/overlays/owned-content').ContentOwner): () => void | Promise<void>
	/** Render host for a flow, when the host supports render targets. */
	getRenderHost?(flow: string): import('./routing/render-router-host').RenderRouterHost | undefined
	/** Whether a flow renders in the modal layer. */
	isModalFlow?(flow: string): boolean
	/** Visibility belongs to the declaring pane and guides native activity Back. */
	setFlowActive?(flow: string, active: boolean): void
}

/** @internal Owner-preserving platform outlet; applications use RouteOutlet. */
export interface ClientRouteOutletProps extends Pick<
	RouteOutletProps,
	'authority' | 'resumeUrl' | 'onResume'
> {
	/** Client host supplying the rendered route content. */
	host: ClientRouterHost
	/** Flow id this outlet renders. */
	flow?: string
	/** Fallback/inner content. */
	children?: any
}

/** @internal Retained pane outlet, including a base-less modal history. */
export interface RenderRouteOutletProps {
	/** Render host supplying route content. */
	host: import('./routing/render-router-host').RenderRouterHost
	/** Flow id this outlet renders. */
	flow?: string
	/** Whether the outlet renders the modal layer. */
	modal?: boolean
	/** Fallback/inner content. */
	children?: any
}

/** @internal Retained routing pane. Inactive content keeps its component state
 * while the platform removes it from layout and native visibility. */
export interface RoutePaneProps {
	/** Whether this pane is the active one — inactive panes stay mounted but hidden. */
	active: boolean
	/** Internal wrapper ref; applications retain their own screen refs. */
	viewRef?: (view: unknown) => void
	/** Pane content. */
	children?: any
}

/** Internal host command. Deferred renderer/animation callbacks must check
 * isCurrent immediately before mutating history or rendering a destination. */
export interface RouterHostCommand {
	/** Navigation verb applied by the host. */
	action: 'push' | 'replace' | 'reset' | 'refresh' | 'back' | 'forward' | 'dismiss'
	/** Flow id grouping the command. */
	flow: string
	/** Prepared match the command targets. */
	route?: PreparedRouteMatch
	/** Resolved content rendered for the route. */
	content?: RouterHostContent
	/** Transition applied for this command. */
	transition?: TransitionDefinition
	/** A history handoff keeps the receiving flow's existing presentation. Route
	 * defaults must not reopen an already-owned modal during replace/refresh. */
	restore?: boolean
	/** Prepare a retained history target inside this same navigation attempt.
	 * Call before beginCommit; multiple calls share one root context snapshot.
	 * Hosts must honor a non-ready result before moving history or showing data. */
	prepare?(destination: unknown, flow?: string): Promise<RouterHostPreparation>
	/** Whether the command still describes the host's current entry — stale commands must not re-commit. */
	isCurrent(): boolean
	/** Atomically claim irreversible host work. Check the returned boolean before
	 * mutating history/Frames. Supersession after this point cannot cancel an
	 * accepted navigation; disposal and external traversal can still abort it. */
	beginCommit(): boolean
	/** Cancels unaccepted readiness/staging waits without fabricating an AbortSignal. */
	cancellation?: Promise<Extract<RouterHostResult, { /** Cancelled discriminator — the command was superseded. */ status: 'cancelled' }>>
	/** Adapter composition barrier. After host-specific staging and claiming a
	 * commit, await this before history/visibility mutation and recheck ownership and
	 * isCurrent. For example, close a presenter-owned modal only after a candidate
	 * Page has rendered successfully. Core supplies no barrier by default. */
	beforeMutation?(): void | Promise<void>
}

/** Host acceptance means both navigation state and rendering have committed.
 * finished may settle later; a failed/skipped effect does not undo the commit. */
export type RouterHostResult =
	| {
			/** Return a ready value from this command's prepare callback. Core
			 * releases the source host queue before committing the new owner. */
			status: 'handoff'
			/** The ready preparation result — routes, content, and transition resolved. */
			prepared: Extract<RouterHostPreparation, { /** Committed discriminator for host results. */ status: 'ready' }>
			/** History action applied on commit (push/replace/refresh). */
			action: 'push' | 'replace' | 'refresh'
			/** Hook fired immediately before the host mutates state. */
			beforeMutation?: RouterHostCommand['beforeMutation']
	  }
	| {
			/** Committed discriminator for host results. */
			status: 'committed'
			/** Committed match, or null on dismissal to empty. */
			route: PreparedRouteMatch | null
			/** Resolves when the transition completes. */
			finished?: Promise<RouteTransitionResult>
	  }
	| { /** Blocked discriminator — the host is holding the command. */ status: 'blocked'; /** Why the host could not commit. */ reason?: 'host-not-ready' | 'missing-outlet' | 'at-base' | 'busy' }
	| { /** Unsupported discriminator — the host cannot perform the action. */ status: 'unsupported'; /** Operation the host rejected. */ operation: string }
	| { /** Cancelled discriminator — the command was superseded. */ status: 'cancelled'; /** Why the command was cancelled. */ reason: 'superseded' | 'disposed' | 'aborted' | 'registry-changed' }
	| Exclude<RoutePreparationResult, { /** Ready discriminator — the host committed. */ status: 'ready' }>
	| { /** Failed discriminator — commit threw. */ status: 'failed'; /** Phase that failed (commit). */ phase: 'commit'; /** The thrown failure value. */ error: unknown }

/** @internal Prepared retained content; never a URL or serialized host payload. */
export type RouterHostPreparation =
	| {
			/** Ready discriminator for host preparations. */
			status: 'ready'
			/** Flow id grouping the preparation. */
			flow: string
			/** Prepared match for the command. */
			route: PreparedRouteMatch
			/** Resolved content for the route. */
			content: RouterHostContent
			/** Transition resolved for the command. */
			transition?: TransitionDefinition
			/** True when a guard redirected during preparation. */
			redirected: boolean
	  }
	| Exclude<RoutePreparationResult, { /** Ready discriminator for host preparations. */ status: 'ready' }>
	| { /** Unsupported discriminator — the host cannot prepare the command. */ status: 'unsupported'; /** Operation the host rejected. */ operation: string }
	| { /** Failed discriminator — preparation threw. */ status: 'failed'; /** Phase that failed (commit). */ phase: 'commit'; /** The thrown failure value. */ error: unknown }

/** Platform boundary for an isolated instance. Core never reads browser globals,
 * Frames, or renderer state. Adapters declare history/reset capabilities rather
 * than silently ignoring an unsupported operation. Each host belongs to one
 * instance for its lifetime, including after disposal. */
export interface RouterHost {
	/** History mode the host maintains. */
	readonly history: 'linear' | 'independent'
	/** Whether the host supports reset commands. */
	readonly canReset: boolean
	/** Current host state for a flow. */
	getSnapshot(flow: string): RouterHostSnapshot
	/** Subscribes to host changes; returns an unsubscribe. */
	subscribe(listener: (change?: RouterHostChange) => void): () => void
	/** Applies a route command — may complete asynchronously. */
	commit(command: RouterHostCommand): RouterHostResult | Promise<RouterHostResult>
	/** Tears down the host. */
	dispose?(): void
}

/** Explicit instance construction. Supplying a host avoids an accidental memory
 * router that reports success without changing the requested target. */
export type RouterOptions<
	Catalog extends RouteManifest = RouteManifest,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends TransitionRegistry = TransitionRegistry,
> = Omit<
	RoutePreparationOptions,
	| 'catalog'
	| 'history'
	| 'context'
	| 'stacks'
	| 'behaviors'
	| 'transitionNames'
	| 'destinationOwner'
> &
	RouterContextOptions<RouterRootContext<ContractsOf<Catalog>>> & {
		/** Route manifest the router prepares matches from. */
		catalog: Catalog
		/** Extra flow names inferred by createRouter; root is always available. */
		stacks?: readonly Stacks[]
		/** Optional named effects. Built-in default/none/fade need no registration. */
		transitions?: Transitions
		/** Host receiving route commands (web history, native frames, panes). */
		host: RouterHost
		/** Error hook for listener exceptions — keeps one bad subscriber from breaking dispatch. */
		onSubscriberError?(error: unknown): void
	}

type CompatibleDefaultRoute<Actual, Expected> =
	Actual extends RouteContract<infer P, infer I, infer S, infer D, infer C>
		? Expected extends {
				/** Extra params contract merged into route inference. */
				params: infer EP
				/** Extra search-input contract merged into route inference. */
				searchInput: infer EI
				/** Extra search-output contract merged into route inference. */
				search: infer ES
				/** Extra data contract merged into route inference. */
				data: infer ED
				/** Extra context contract merged into route inference. */
				context: infer EC
			}
			? EP extends P
				? EI extends I
					? S extends ES
						? D extends ED
							? C extends EC
								? true
								: false
							: false
						: false
					: false
				: false
			: false
		: false

type IncompatibleDefaultRoutes<Contracts> = {
	[Name in keyof Contracts & keyof RegisteredRouteContracts & string]: CompatibleDefaultRoute<
		Contracts[Name],
		RegisteredRouteContracts[Name]
	> extends true
		? never
		: Name
}[keyof Contracts & keyof RegisteredRouteContracts & string]

/** @internal Generated default setup must agree with registered contracts.
 * Raw manifests remain available to host-free preparation, with unknown output. */
export type DefaultRouterContractCheck<Catalog> = Catalog extends ContractRouteManifest
	? [IncompatibleDefaultRoutes<ContractsOf<Catalog>>] extends [never]
		? KnownRouteCatalog<Catalog>
		: never
	: never

/** Default client setup. The platform host
 * belongs to the client and is created lazily when the router is used.
 * @example
 * import { configureRouter, defineRoute, defineRoutes } from '@octane-xplat/ui/routing'
 * configureRouter({ catalog: defineRoutes([defineRoute({ path: '/help' }).screen(() => null)]) })
 */
export type RouterConfiguration<
	Catalog extends RouteManifest = RouteManifest,
	Stacks extends string = string,
> = Omit<RouterOptions<Catalog, Stacks>, 'host'>

/** Values shared by a route guard and the screen it admits. */
export type RouteContext = Record<string, unknown>

/** The deliberately small cross-platform head surface. `meta` keys become
 * web `<meta name="..." content="...">` tags; native consumes `title`.
 *
 * @see RouteHeadFn, RouteHeadExport.
 */
export interface RouteHead {
	/** Document/screen title. */
	title?: string
	/** Name→content map emitted as meta tags on web. */
	meta?: Record<string, string>
}

/** Prepared inputs shared with the screen. Head functions run synchronously
 * after validation, guards and loading; load asynchronous metadata in a loader. */
export interface RouteHeadArgs<
	Params = Record<string, unknown>,
	Search = Record<string, unknown>,
	Context = RouteContext,
	Data = unknown,
> {
	/** Route params available to the head factory. */
	readonly params: Params
	/** Validated search available to the head factory. */
	readonly search: Search
	/** Route context available to the head factory. */
	readonly context: Context
	/** Loader data available to the head factory. */
	readonly data: Data
}

/** Compute title and metadata from the prepared route snapshot. */
export interface RouteHeadFn<
	Params = Record<string, unknown>,
	Search = Record<string, unknown>,
	Context = RouteContext,
	Data = unknown,
> {
	(args: RouteHeadArgs<Params, Search, Context, Data>): RouteHead
}

/** A static head declaration or a synchronous prepared-input callback. */
export type RouteHeadExport<
	Params = Record<string, unknown>,
	Search = Record<string, unknown>,
	Context = RouteContext,
	Data = unknown,
> = RouteHead | RouteHeadFn<Params, Search, Context, Data>

/** Props the framework passes to a route's `ErrorBoundary` export when the
 *  route's rendered subtree throws. `reset` clears the caught error and
 *  remounts the subtree with the same props — it does not re-run the
 *  route's `loader` or `beforeLoad` (re-push the route for that), so a
 *  deterministic render error recatches. `route` is the committed Route
 *  the boundary is rendering for. */
export interface RouteErrorBoundaryProps {
	/** The thrown value captured by the boundary. */
	error: unknown
	/** Retries the route — clears the error and re-runs preparation. */
	reset: () => void
	/** Match whose screen failed. */
	route: PreparedRouteMatch
}

/** Props for `RouteBoundary` — the framework host that wraps a route's
 *  rendered subtree in its declared `ErrorBoundary`. `boundary` is the
 *  route's declared boundary component (receives
 *  `RouteErrorBoundaryProps`); `route` is the committed Route passed
 *  through to it.
 *
 * @see RouteErrorBoundaryProps — the props the declared boundary receives.
 */
export interface RouteBoundaryProps {
	/** Boundary component wrapping this route. */
	boundary?: (props: RouteErrorBoundaryProps) => Renderable
	/** Match the boundary guards. */
	route: PreparedRouteMatch
	/** Content rendered inside the element. */
	children?: Renderable
}

/** Anchor to a URL — external links and web navigation; `href` is the destination, `target` the browsing context (web `_blank` etc.). For in-app route navigation prefer `NavLink`, which type-checks destinations against the route schema.
 *
 * @example
 * ```tsx
 * import { Link } from '@octane-xplat/ui'
 *
 * <Link href="https://example.com/docs">Docs</Link>
 * ```
 * @see NavLinkProps.
 */
export interface LinkProps {
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Raw URL — bypasses the router and navigates directly. */
	href: string
	/** Anchor target (e.g. `_blank`). */
	target?: string
	/** External-destination treatment — new tab + indicator (Astryx `isExternalLink`). */
	isExternalLink?: boolean
	/** Standalone (non-inline) presentation (Astryx `isStandalone`). */
	isStandalone?: boolean
	/** Force underline (Astryx `hasUnderline`). */
	hasUnderline?: boolean
	/** Hover/focus hint (Astryx `tooltip`). */
	tooltip?: string
	/** Text color token name or CSS color (Astryx `color`). */
	color?: string
	/** Custom link element for this instance (Astryx `as`) — overrides the
	 *  `LinkProvider` default. Receives `href`, `className`, `style`,
	 *  children. */
	as?: NavLinkComponentType
	/** Override the platform link role when composing a link into another
	 *  interaction pattern such as a menu. */
	accessibilityRole?: 'link' | 'menuitem'
	/** Runs when the user activates the link, before navigation. */
	onPress?: () => void
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
}

/** Cancellable activation shared by browser and native navigation items. */
export interface NavigationActivationEvent {
	/** Set once the activation has been consumed — prevents the default navigation. */
	readonly defaultPrevented: boolean
	/** Consumes the activation — prevents the default navigation. */
	preventDefault(): void
	/** Pointer button that activated (0 = primary). */
	readonly button?: number
	/** Whether Cmd/⌘ was held — conventionally opens in a new context. */
	readonly metaKey?: boolean
	/** Whether Ctrl was held. */
	readonly ctrlKey?: boolean
	/** Whether Shift was held. */
	readonly shiftKey?: boolean
	/** Whether Alt/⌥ was held. */
	readonly altKey?: boolean
}

/** Presentation and activation options for typed navigation links. */
export interface NavLinkOptions {
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Class applied while the link's route is active. */
	activeClassName?: string
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Exact route by default; prefix includes descendant paths. */
	match?: 'exact' | 'prefix'
	/** Ignore search by default, or compare all/selected fields. */
	matchSearch?: boolean | readonly string[]
	/** Includes the hash when deciding whether the link is active. */
	matchHash?: boolean
	/** Renders inert — no navigation on activation. */
	disabled?: boolean
	/** Runs before routing. preventDefault() cancels activation on every target. */
	onPress?: (event: NavigationActivationEvent) => void
	/** Browser browsing context. Native targets navigate within the owning flow. */
	target?: string
	/** Browser anchor relationship and download semantics. */
	rel?: string
	/** Marks the link a download; string sets the suggested filename. */
	download?: boolean | string
}

/** In-app link with an inferred declared request or an opaque checked value
 * supplied through to={checked.destination}. Web retains real anchors and
 * modified-click behavior.
 *
 * @example
 * ```tsx
 * <NavLink to="/items/:id" params={{ id: 'coat' }}>Coat</NavLink>
 * ```
 */
export type NavLinkProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = (
	| DestinationFor<
			NoInfer<Contracts>,
			NoInfer<keyof Contracts & string>,
			NoInfer<Stacks>,
			NoInfer<Transitions>
	  >
	| { /** Validated destination for the link. */ to: ValidatedDestination }
) &
	NavLinkOptions & {
		/** Infer destinations from an explicitly owned instance, when supplied. */
		router?: RouterInstance<Contracts, Stacks, Transitions>
	}

/** Shared link destination fields for navigation chrome. Use a typed route
 * request or a raw URL, never both. A fieldless value remains an action item. */
export type NavigationTargetProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = (
	| ((
			| DestinationFor<
					NoInfer<Contracts>,
					NoInfer<keyof Contracts & string>,
					NoInfer<Stacks>,
					NoInfer<Transitions>
			  >
			| { /** Unused on the `href` variant — `to` discriminates the route-name form. */ to: ValidatedDestination }
	  ) & {
			/** Router instance to navigate with (defaults to the provider's). */
			router?: RouterInstance<Contracts, Stacks, Transitions>
			/** Unused on the `to` variant — `href` discriminates the raw-URL form. */
			href?: never
			/** Controls when the link counts as active (exact/prefix predicate). */
			match?: NavLinkOptions['match']
			/** Search params included in the active-match comparison. */
			matchSearch?: NavLinkOptions['matchSearch']
			/** Includes the hash in the active-match comparison. */
			matchHash?: boolean
	  })
	| {
			/** Raw URL — bypasses router resolution and navigates directly. */
			href?: string
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			to?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			params?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			search?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			stack?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			hash?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			presentation?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			transition?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			replace?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			router?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			match?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			matchSearch?: never
			/** Unused on the `href` variant — `to` discriminates the route-name form. */
			matchHash?: never
	  }
) &
	Pick<NavLinkOptions, 'target' | 'rel' | 'download'>

/** A navigation item that always represents a URL or typed route link. */
export type NavigationLinkTargetProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = NavigationTargetProps<Contracts, Stacks, Transitions> &
	({ /** Raw URL — bypasses router resolution. */ href: string } | { /** Route name or validated destination — `to` discriminates the router form. */ to: string | ValidatedDestination })

/** Route identity to screen component table owned by a canonical catalog. */
export type ScreenTable = Record<string, ScreenComponent>

type RoutePlatform = 'web' | 'ios' | 'android' | 'mobile' | 'macos' | 'windows' | 'linux'

/** One route file's entry in the derived manifest. `name` is the file
 *  path under the route dir with `[param]` segments normalized to
 *  `:param` (`app/demo/[id].tsrx` → `demo/:id`); `segments` is the URL
 *  pattern used for web path matching/substitution. */
export interface RouteMeta {
	/** @internal Generated module identity; caches code only, never prepared inputs. */
	loadModule?: () => Promise<{ /** Route metadata entry. */ meta: RouteMeta; /** Screen component for the route. */ screen: ScreenComponent }>
	/** Route name derived from the path. */
	name: string
	/** Generated file availability; platform readiness and authorization remain runtime checks. */
	platforms?: readonly RoutePlatform[]
	/** Host-free refined behavior, attached by inferred route definitions. */
	preparation?: RoutePreparationBehavior
	/** Animation is independent of page or modal presentation. */
	transition?: RouteTransitionName
	/** Path split into segments. */
	segments: string[]
	/** Param names declared by the path pattern. */
	params: string[]
	/** Source file (glob key) — diagnostics only. */
	file: string
	/** Declared default presentation — set by a `+modal`/`+push` filename
	 *  suffix (`app/settings+modal.tsrx` → route 'settings', modal). */
	presentation?: 'push' | 'modal'
	/** Loader metadata used for discovery and baking. Canonical preparation
	 * invokes the structured callback attached to `preparation` before commit.
	 * Runtime failures return a navigation result and retain committed content. */
	loader?: (params: Record<string, unknown>) => unknown
	/** Optional `ErrorBoundary` named export — a component receiving
	 *  `RouteErrorBoundaryProps`, rendered in place of the route's layout
	 *  chain + screen when that subtree throws during render. Loader
	 *  failures are navigation results; this boundary covers rendering. Absent a declaration, render errors
	 *  propagate as they always have. */
	errorBoundary?: (props: RouteErrorBoundaryProps) => Renderable
	/** Data provenance: 'live' (default) runs `loader` at navigation;
	 *  'baked' reads build-time output from the manifest's `baked` map —
	 *  for file routes the loader lives in a `<route>.loader.ts` sibling
	 *  that `xplat routes`/`xplat build` executes and never bundles. */
	dataMode?: RouteDataMode
	/** Optional guard awaited before a push commits. A thrown `redirect(...)`
	 * short-circuits the attempted route. */
	beforeLoad?: RoutePreparationBehavior['beforeLoad']
	/** Optional route title/meta declaration computed from prepared inputs. */
	head?: RouteHeadExport<any, any, any, any>
}

/** How a route's data is produced — `'live'` runs the loader at navigation,
 *  `'baked'` freezes loader output into the bundle at build time. */
export type RouteDataMode = 'live' | 'baked'

/** Normalized catalog of screens, preparation metadata, layouts and baked data. */
export interface RouteManifest {
	/** Name → screen component table. */
	screens: ScreenTable
	/** Route metadata entries. */
	routes: RouteMeta[]
	/** Name → layout component map. */
	layouts: Record<string, LayoutComponent>
	/** Name → loader function map. */
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
	/** Path pattern for the spec. */
	path: Path
	/** @internal Inferred executable behavior assembled by defineRoute. */
	preparation?: RoutePreparationBehavior
	/** Independent animation preset; presentation continues to describe the host. */
	transition?: RouteTransitionName
	/** Screen rendered for the spec. */
	screen: ScreenComponent
	/** Default presentation, like a `+modal`/`+push` filename suffix. */
	presentation?: 'push' | 'modal'
	/** Optional data loader for the spec. */
	loader?(args: RouteDefinitionArgs<Path, undefined, RouteContext>): unknown
	/** Where route data resolves (server/client/static). */
	dataMode?: RouteDataMode
	/** Optional guard for the spec. */
	beforeLoad?(
		/** Args passed to the optional `head` factory. */
		args: RouteDefinitionArgs<Path, undefined, RouteContext>,
	): RouteGuardResult | Promise<RouteGuardResult>
	/** Head metadata factory for the spec. */
	head?: RouteHeadExport<RouteSpecParams<Path>, any, any, any>
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
	/** Specs in declaration order. */
	routes: readonly RouteSpec[]
	/** Layout map the specs reference. */
	layouts?: Record<string, LayoutComponent>
	/** Pre-computed values baked in at build time. */
	baked?: Record<string, unknown>
}

/** The host-consumable route schema — what `xplat routes` writes to
 *  `routes.gen.manifest.json` and `manifestToJson` produces from any
 *  RouteManifest. Same shape whether the routes came from the file dir
 *  or `defineRoutes`, so an external host (e.g. a web SSR tier) consumes
 *  one normalized list. `loader`/`guard`/`head`/`errorBoundary` are
 *  presence flags — the functions don't cross the JSON boundary. */
export interface RouteManifestJson {
	/** Manifest schema version — always 1. */
	version: 1
	/** Layout dirs present, '' = the root `_layout` — sorted. */
	layouts: string[]
	/** Registered screen names, including any without a URL pattern. */
	screens: string[]
	/** Serialized route entries. */
	routes: RouteJson[]
}

/** Serializable catalog metadata used by `manifestToJson` and external tooling. Contains no prepared data or executable route behavior.
 */
export interface RouteJson {
	/** Present for lazy routes. Callback flags are unknown/omitted until loaded. */
	moduleLoaded?: boolean
	/** Route name. */
	name: string
	/** Optional generated target availability, including missing-screen metadata. */
	platforms?: readonly RoutePlatform[]
	/** Colon-syntax path — 'docs/:slug', '' for the root index. */
	path: string
	/** Param names in path order. */
	params: string[]
	/** Default presentation. */
	presentation?: 'push' | 'modal'
	/** Default transition. */
	transition?: RouteTransitionName
	/** Where route data resolves. */
	dataMode?: RouteDataMode
	/** Layout dirs applying to this route, root '' first, innermost last. */
	layouts: string[]
	/** Source label — file path or `programmatic:<path>`. */
	source: string
	/** Whether the route declares a loader. */
	loader?: boolean
	/** Whether the route declares a guard. */
	guard?: boolean
	/** Whether the route declares head metadata. */
	head?: boolean
	/** Whether the route declares an error boundary. */
	errorBoundary?: boolean
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
	/** A route-file metadata export has the wrong shape — fatal. Invalid guards
	 * cannot be discarded while allowing a route's loader to run. */
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
	/** A destination has no registered screen. */
	| 'route/unregistered-screen'
	/** A destination names a stack with no mounted host. */
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
	/** Diagnostic code identifying the problem class. */
	code: RouteDiagnosticCode
	/** Path or route name the diagnostic applies to. */
	path: string
	/** What the route was expected to provide. */
	expected: string
	/** Suggested fix shown to the author. */
	hint: string
	/** Additional context (found value, offending spec). */
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
	/** Per-route param record captured by the union-to-intersection helper. */
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
	/** Path pattern captured for presentation inference. */
	path: infer P extends string
	/** Declared presentation captured per path. */
	presentation: infer Pr
}
	? { [N in RouteNameOfPath<P>]: Pr }
	: {}

/** name → declared presentation map inferred from a `defineRoutes` spec list — pairs with `RouteParamsFromSpecs` inside `SpecRouteInfo`.
 */
export type RoutePresentationsFromSpecs<Specs extends readonly RouteSpec[]> = UnionToIntersection<
	SpecPresentations<Specs[number]>
>

/** The spec-derived typing record `defineRoutes` brands onto its manifest
 *  return — read it with the `ManifestRoute*` helpers, never directly. */
export interface SpecRouteInfo<
	Specs extends readonly RouteSpec[],
	Baked = Record<string, unknown>,
> {
	readonly [routeContractVariance]: (
		/** Route contracts inferred from the spec list. */
		contracts: RouteContractsFromSpecs<Specs, Baked>,
	) => RouteContractsFromSpecs<Specs, Baked>
	readonly [specRouteTypes]: {
		/** Contracts the lookup helpers are keyed by. */
		contracts: RouteContractsFromSpecs<Specs, Baked>
		/** name → params map for the spec list. */
		params: RouteParamsFromSpecs<Specs>
		/** name → declared-presentation map for the spec list. */
		presentations: RoutePresentationsFromSpecs<Specs>
	}
}

/** Inspect the internal name-to-params map of inferred definitions or a
 * composed catalog. An untagged RouteManifest extracts to {}. Application
 * registration is generated; use ContractsOf and DestinationFor for public
 * destination contracts, which retain absolute patterns and search fields. */
export type ManifestRouteParams<M> = M extends { readonly [routeCatalogTypes]: infer Contracts }
	? {
			[
				Path in keyof Contracts & string as {} extends Record<Path, never>
					? never
					: RouteNameOfPath<Path>
			]: Contracts[Path] extends { /** Param record captured for manifest inference. */ params: infer Params } ? Params : never
		}
	: M extends { readonly [specRouteTypes]: { /** Param record captured for manifest inference. */ params: infer P } }
		? P
		: {}

/** Inspect catalog internal names; never for an untagged RouteManifest.
 * Public navigation uses inferred absolute patterns through DestinationFor. */
export type ManifestRouteNames<M> = keyof ManifestRouteParams<M> & string

/** name → presentation map extracted from a `defineRoutes` manifest brand — `{}` for untagged manifests.
 */
export type ManifestRoutePresentations<M> = M extends {
	readonly [specRouteTypes]: { /** Presentation map captured for manifest inference. */ presentations: infer P }
}
	? P
	: {}

/** Options for `openWindow` — `data` handed to the window's content resolver (native/macOS/Linux; ignored on web), `url` for web/Linux, `kind` presentation semantics ('regular' independent, 'dialog' modal-to-parent, 'popup' non-activating panel; unsupported kinds fall back to 'regular'), `title`, `size` (px/dips), and `parent` owner.
 *
 * @example
 * ```ts
 * import { openWindow } from '@octane-xplat/ui'
 *
 * const win = openWindow({ data: { docId }, title: 'Preview', size: { width: 480, height: 640 } })
 * await win?.closed
 * ```
 * @see WindowHandle.
 */
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
	size?: { /** Requested window width in px. */ width: number; /** Requested window height in px. */ height: number }
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
	setSize?(size: { /** Current window width in px. */ width: number; /** Current window height in px. */ height: number }): void
	/** Veto a user-initiated close request — the callback returning false
	 *  cancels the close. Present only on hosts that report close requests
	 *  (macOS). Returns an unsubscribe function. */
	onCloseRequested?(callback: () => boolean): () => void
}

// ---------- animation ----------

/** Every started run settles once, including replacement and host failure. */
export type AnimationResult =
	| { /** Finished discriminator — the animation completed. */ status: 'finished' }
	| { /** Cancelled discriminator — the animation was interrupted. */ status: 'cancelled' }
	| { /** Failed discriminator — the animation threw. */ status: 'failed'; /** The thrown failure value. */ error: unknown }

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
	/** Current animated scalar. */
	readonly value: number
	/** Attach to a shared view ref; pass null to detach and cancel. */
	ref(el: HostElement): void
	/** Duration is milliseconds. Invalid inputs throw before replacing playback. */
	to(target: number, opts?: { /** Tween duration in ms for `to`-style updates. */ duration?: number }): Promise<AnimationResult>
	/** Animates toward `target` with spring physics. */
	spring(target: number, opts?: { /** Spring damping — higher settles sooner with less overshoot. */ damping?: number; /** Spring stiffness — higher tracks faster. */ stiffness?: number }): Promise<AnimationResult>
	/** Halts the current animation at its latest value. */
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
 *  `clickAction` failures report through `onActionError`.
 *
 * @example
 * ```tsx
 * import { Button } from '@octane-xplat/ui'
 *
 * <Button label="Save" variant="primary" clickAction={save} onActionError={showError} />
 * ```
 * @see PressableProps for the interaction base, IconButtonProps, ButtonGroupProps.
 */
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
 *  `open`/`onOpenChange` or uncontrolled via `defaultOpen`.
 *
 * @example
 * ```tsx
 * import { Collapsible, Text } from '@octane-xplat/ui'
 *
 * <Collapsible trigger={<Text>Advanced</Text>} open={open} onOpenChange={setOpen}>
 * 	{details}
 * </Collapsible>
 * ```
 * @see AccordionProps for a labelled multi-section form.
 */
export interface CollapsibleProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content that toggles the collapsible region. */
	trigger?: Renderable
	/** Key inside a `CollapsibleGroup` — the group owns which value is open
	 *  (Astryx `value`). Standalone collapsibles ignore it. */
	value?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Controlled open state. */
	open?: boolean
	/** Initial open state for uncontrolled usage. */
	defaultOpen?: boolean
	/** Prevents toggling and applies the disabled styling. */
	disabled?: boolean
	/** Reports requested open-state changes. */
	onOpenChange?: (open: boolean) => void
	/** Accessible name for the trigger. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** CollapsibleGroup — coordinates `Collapsible` children by their `value`:
 *  `type="single"` opens one at a time, `"multiple"` toggles each
 *  independently (Astryx `CollapsibleGroup`). `value`/`defaultValue`/
 *  `onChange` carry the open key (single) or keys (multiple). `hasDividers`
 *  paints hairlines between the grouped rows. */
export interface CollapsibleGroupProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** `single` keeps at most one item open; `multiple` allows many. */
	type?: 'single' | 'multiple'
	/** Controlled open item key(s). */
	value?: string | string[]
	/** Initial open key(s) for uncontrolled usage. */
	defaultValue?: string | string[]
	/** Fires with the new open key(s). */
	onChange?: (value: string | string[]) => void
	/** Draws separators between items. */
	hasDividers?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One `Accordion` section — stable `key` (selection identity), `header` row content, `content` body, `disabled`.
 */
export interface AccordionItemSpec {
	/** Stable key identifying the item (used for open state). */
	key: string
	/** Header content rendered in the trigger row. */
	header?: Renderable
	/** Body content revealed when open. */
	content?: Renderable
	/** Locks the item in its current state. */
	disabled?: boolean
}

/** Accordion — a list of Collapsibles. `open` is the open key (or keys with
 *  `multiple`); omit it for uncontrolled via `defaultOpen`.
 *
 * @example
 * ```tsx
 * import { Accordion, Text } from '@octane-xplat/ui'
 *
 * <Accordion
 * 	items={[{ key: 'faq-1', header: 'Shipping?', content: <Text>{answer}</Text> }]}
 * 	open={open}
 * 	onOpenChange={setOpen}
 * />
 * ```
 * @see AccordionItemSpec, CollapsibleProps.
 */
export interface AccordionBaseProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Item descriptors rendered by the accordion. */
	items: AccordionItemSpec[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Single-open disclosure state. `null` means that no section is open. */
export interface AccordionSingleProps extends AccordionBaseProps {
	/** Single-open mode discriminator — `false` fixes this variant. */
	multiple?: false
	/** Controlled open item key, or null when collapsed. */
	open?: string | null
	/** Initial open key for uncontrolled usage. */
	defaultOpen?: string | null
	/** Reports requested open-key changes. */
	onOpenChange?: (open: string | null) => void
}

/** Multi-open disclosure state. */
export interface AccordionMultipleProps extends AccordionBaseProps {
	/** Multi-open mode discriminator — `true` fixes this variant. */
	multiple: true
	/** Controlled open item keys. */
	open?: string[]
	/** Initial open keys for uncontrolled usage. */
	defaultOpen?: string[]
	/** Reports requested open-key changes. */
	onOpenChange?: (open: string[]) => void
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps

/** Self-drawn checkbox — box + check mark, identical pixels across targets.
 *
 * @example
 * ```tsx
 * import { CheckboxInput } from '@octane-xplat/ui'
 *
 * <CheckboxInput label="Subscribe" value={subscribed} onChange={setSubscribed} />
 * ```
 * @see CheckboxGroupProps (`CheckboxList`) for multi-choice lists.
 */
export interface CheckboxProps extends FieldControlProps, TestIDProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Controlled state — pair with `onChange`. `'indeterminate'` is the
	 *  partial-selection state (parent-of-a-tree semantics): it renders the
	 *  indicator's `indeterminate` mark and the DOM `indeterminate` property
	 *  on web; NativeScript reports `Partially selected` (no mixed state
	 *  enum); AppKit exposes the semantic mixed checkbox value. */
	value?: boolean | 'indeterminate'
	/** Initial state for uncontrolled use; `value` wins when both are set. */
	defaultValue?: boolean | 'indeterminate'
	/** Called with the requested next state when the user toggles (always
	 *  `true` when leaving `'indeterminate'`). */
	onChange?: (checked: boolean) => void
	/** Async action fired after `onChange`. While it runs the checkbox shows
	 *  the loading state; a rejection reverts the toggle and reports the
	 *  previous value through `onChange` again. */
	changeAction?: (checked: boolean) => void | Promise<void>
	/** Accessible name for the checkbox. */
	accessibilityLabel?: string
	/** Describes the toggled outcome; announced after the label. */
	accessibilityHint?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One option of `RadioList`/`SegmentedControl` — `value` is the selection identity, `label` the text, `isDisabled` blocks the single option.
 */
export interface RadioOption {
	/** Value submitted when this option is selected. */
	value: string
	/** Text shown beside the option. */
	label?: string
	/** Makes the option unselectable while keeping it visible. */
	isDisabled?: boolean
	/** Supporting text under the label (Astryx item `description`). */
	description?: string
	/** Trailing node — badge, icon, price (Astryx item `endContent`). */
	endContent?: Renderable
}

/** Self-drawn radio group — dot options in a column/row.
 *
 * @example
 * ```tsx
 * import { RadioList } from '@octane-xplat/ui'
 *
 * <RadioList
 * 	label="Size"
 * 	options={[{ value: 's', label: 'Small' }, { value: 'l', label: 'Large' }]}
 * 	value={size}
 * 	onValueChange={setSize}
 * />
 * ```
 * @see SegmentedControlProps, SelectProps (`Selector`).
 */
export interface RadioGroupProps extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Options rendered as radio rows. */
	options?: RadioOption[]
	/** Controlled selected option — pair with `onValueChange`. */
	value?: string
	/** Initial selected option for uncontrolled use; `value` wins when both
	 *  are set. */
	defaultValue?: string
	/** Lays options out in a row instead of a column. */
	horizontal?: boolean
	/** Called with the chosen option's `value`. */
	onValueChange?: (value: string) => void
	/** Accessible name for the radio group. */
	accessibilityLabel?: string
	/** `RadioListItem` children — the Astryx child-part alternative to
	 *  `options`; items read selection state from the group context. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** `RadioListItem` — one option inside a `RadioList` (Astryx child part).
 *  Selection state comes from the enclosing group's context; standalone use
 *  renders a presentational row. */
export interface RadioListItemProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Value submitted when this item is selected. */
	value: string
	/** Primary text for the item row. */
	label?: string
	/** Secondary text under the label. */
	description?: string
	/** Content rendered at the row's trailing edge. */
	endContent?: Renderable
	/** Makes the item unselectable while keeping it visible. */
	isDisabled?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Self-drawn segmented control — a row of equal-width segments in a track,
 *  one selected (UISegmentedControl / Material segmented-button shape, no OS
 *  chrome). `value`/`onValueChange` for controlled, `defaultValue` for
 *  uncontrolled; `disabled` on the group or per-option. Sizes come from
 *  className, matching the Button family.
 *
 * @example
 * ```tsx
 * import { SegmentedControl } from '@octane-xplat/ui'
 *
 * <SegmentedControl
 * 	options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]}
 * 	value={mode}
 * 	onValueChange={setMode}
 * />
 * ```
 * @see RadioGroupProps (`RadioList`).
 */
export interface SegmentedControlProps extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Options rendered as segments. */
	options?: RadioOption[]
	/** Controlled selected segment — pair with `onValueChange`. */
	value?: string
	/** Initial selected segment for uncontrolled use; `value` wins when
	 *  both are set. */
	defaultValue?: string
	/** Called with the chosen segment's `value`. */
	onValueChange?: (value: string) => void
	/** Accessible name for the control. */
	accessibilityLabel?: string
	/** `'fill'` stretches segments to share the full track width.
	 *  @default 'hug' */
	layout?: 'hug' | 'fill'
	/** `SegmentedControlItem` children — the Astryx child-part alternative
	 *  to `options`; items read selection state from the control context. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** `SegmentedControlItem` — one segment inside a `SegmentedControl`
 *  (Astryx child part). `icon` leads the label; `isLabelHidden` renders an
 *  icon-only segment while `label` stays the accessible name. */
export interface SegmentedControlItemProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Value this segment selects. */
	value: string
	/** Text shown inside the segment. */
	label?: string
	/** Icon shown inside the segment. */
	icon?: Renderable
	/** Keeps the label for assistive tech but renders only the icon. */
	isLabelHidden?: boolean
	/** Makes the segment unselectable. */
	isDisabled?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Data-driven menu row fields shared by the menu families. */
export interface MenuItemData {
	/** Stable key identifying the item. */
	key: string
	/** Text shown for the item. */
	label?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	/** Secondary text under the label (Astryx item `description`). */
	description?: string
	/** Dims the item and blocks selection. */
	isDisabled?: boolean
	/** Fires when the item is chosen. */
	onSelect?: () => void
	/** Closes the menu after selection (default behavior; set false to keep open). */
	hasCloseOnSelect?: boolean
	/** Row tone — 'destructive' renders label/description/icon in the error
	 *  color (Astryx `variant`). @default 'default' */
	variant?: 'default' | 'destructive'
}

/** An action menu row. */
export interface MenuActionData extends MenuItemData {
	/** Action-row discriminator — a command, not a link. */
	type: 'action'
	/** Unused on action rows — `type` discriminates. */
	items?: never
	/** Unused on action rows — `type` discriminates. */
	href?: never
}

/** A link row that retains normal link navigation. */
interface MenuLinkDataBase extends Omit<MenuItemData, 'onSelect'> {
	/** Fires with the activation event — cancelable before navigation. */
	onSelect?: (event: NavigationActivationEvent) => void
	/** Link-row discriminator — retains normal link navigation. */
	type: 'link'
	/** Anchor target for the link row. */
	target?: string
	/** Unused on link rows — `type` discriminates. */
	items?: never
}

/** A menu link with required typed destination or raw URL and cancellable selection. */
export type MenuLinkData<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = MenuLinkDataBase & NavigationLinkTargetProps<Contracts, Stacks, Transitions>

/** A non-actionable, accessible group of nested menu rows. */
export interface MenuSectionData<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> extends MenuItemData {
	/** Section-header discriminator. */
	type: 'section'
	/** Section heading text. */
	label: string
	/** Items grouped under this section. */
	items: readonly MenuOption<Contracts, Stacks, Transitions>[]
	/** Unused on sections — `type` discriminates. */
	icon?: never
	/** Unused on sections — `type` discriminates. */
	isDisabled?: never
	/** Unused on sections — `type` discriminates. */
	onSelect?: never
	/** Unused on sections — `type` discriminates. */
	hasCloseOnSelect?: never
	/** Unused on sections — `type` discriminates. */
	href?: never
}

/** A semantic separator with no label or activation behavior. */
export interface MenuSeparatorData {
	/** Stable key identifying the separator. */
	key: string
	/** Separator discriminator. */
	type: 'separator'
	/** Unused on separators — `type` discriminates. */
	label?: never
	/** Unused on separators — `type` discriminates. */
	icon?: never
	/** Unused on separators — `type` discriminates. */
	isDisabled?: never
	/** Unused on separators — `type` discriminates. */
	onSelect?: never
	/** Unused on separators — `type` discriminates. */
	hasCloseOnSelect?: never
	/** Unused on separators — `type` discriminates. */
	items?: never
	/** Unused on separators — `type` discriminates. */
	href?: never
}

/** @deprecated Use `MenuSeparatorData` with `type: 'separator'`. */
export type MenuDividerData = MenuSeparatorData

/** A toggleable menu row — `type: 'checkbox'`, caller-owned `value`, `onValueChange` requests the next state.
 */
export interface MenuCheckboxData extends MenuItemData {
	/** Checkbox-row discriminator. */
	type: 'checkbox'
	/** Controlled checked state. */
	value: boolean
	/** Fires with the toggled value. */
	onValueChange?: (value: boolean) => void
}

/** One choice inside a `MenuRadioGroupData` — `value` is its selection identity.
 */
export interface MenuRadioOptionData extends MenuItemData {
	/** Value this option contributes when selected. */
	value?: string
}

/** A single-choice group in menu data — `type: 'radio-group'`, shared `value`/`onValueChange`, `items` of `MenuRadioOptionData`.
 */
export interface MenuRadioGroupData extends MenuItemData {
	/** Radio-group discriminator. */
	type: 'radio-group'
	/** Controlled selected value. */
	value?: string
	/** Fires with the new selected value. */
	onValueChange?: (value: string) => void
	/** Options inside the group. */
	items: MenuRadioOptionData[]
}

/** A submenu row that owns a separately rendered menu surface. */
export interface MenuSubMenuData<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> extends MenuItemData {
	/** Submenu discriminator. */
	type: 'submenu'
	/** Nested menu items revealed on hover/focus. */
	items: readonly MenuOption<Contracts, Stacks, Transitions>[]
	/** Unused on submenus — opening is the interaction. */
	onSelect?: never
	/** Unused on submenus — `type` discriminates. */
	href?: never
}

/** Public menu data union: each row kind has an explicit discriminant. */
export type MenuOption<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> =
	| MenuActionData
	| MenuLinkData<Contracts, Stacks, Transitions>
	| MenuSectionData<Contracts, Stacks, Transitions>
	| MenuSeparatorData
	| MenuCheckboxData
	| MenuRadioGroupData
	| MenuSubMenuData<Contracts, Stacks, Transitions>

/** @deprecated Use `MenuOption`, whose entry kinds have explicit discriminants. */
export type MenuItem<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = MenuOption<Contracts, Stacks, Transitions>

/** One row in a compound menu (`DropdownMenu`/`ContextMenu` children) — `label`, optional `icon`/`description`/`endContent`, `isDisabled`, `onSelect`; `hasCloseOnSelect` keeps the menu open after selection when false.
 */
export interface MenuItemProps {
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Item content. */
	label: Renderable
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	/** Secondary text under the label. */
	description?: string
	/** Content at the row's trailing edge (shortcut, checkmark, …). */
	endContent?: Renderable
	/** Dims the item and blocks selection. */
	isDisabled?: boolean
	/** Fires when the item is chosen. */
	onSelect?: () => void
	/** Closes the menu after selection. */
	hasCloseOnSelect?: boolean
	/** Row tone — 'destructive' renders label/description/icon in the error
	 *  color (Astryx `variant`). @default 'default' */
	variant?: 'default' | 'destructive'
}

/** Props for an actionable link inside a menu. */
interface MenuLinkPropsBase extends Omit<MenuItemProps, 'onSelect'> {
	/** Anchor target when the item navigates. */
	target?: string
	/** Fires with the activation event — cancelable before navigation. */
	onSelect?: (event: NavigationActivationEvent) => void
}

/** Compound menu link props; selected routes and activation share the owning flow. */
export type MenuLinkProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = MenuLinkPropsBase & NavigationLinkTargetProps<Contracts, Stacks, Transitions>

/** Accessible, non-actionable group inside a menu. */
export interface MenuSectionProps {
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Section heading text. */
	label: string
	/** Content rendered inside the element. */
	children?: Renderable
}

/** A compound-menu checkbox row — `value` is caller-owned, `onValueChange` requests the next state.
 */
export interface MenuCheckboxItemProps extends MenuItemProps {
	/** Caller-owned checked state; updates are requested through onValueChange. */
	value: boolean
	/** Fires with the toggled value. */
	onValueChange?: (value: boolean) => void
}

/** One choice inside a compound `MenuRadioGroup` — `value` is the selection identity.
 */
export interface MenuRadioItemProps extends MenuItemProps {
	/** Value this item contributes when selected. */
	value: string
}

/** A single-choice group inside a compound menu — `label` is its required accessible name; `value`/`defaultValue`/`onValueChange` own selection; children are `MenuRadioItem`s.
 */
export interface MenuRadioGroupProps {
	/** Required accessible name for this set of choices. */
	label: string
	/** Controlled selected value. */
	value?: string
	/** Initial value for uncontrolled usage. */
	defaultValue?: string
	/** Fires with the new selected value. */
	onValueChange?: (value: string) => void
	/** Disables the whole group. */
	isDisabled?: boolean
	/** Closes the menu after a selection. */
	hasCloseOnSelect?: boolean
	/** Content rendered inside the element. */
	children?: Renderable
}

/** A separator between compound-menu rows.
 */
export interface MenuSeparatorProps {
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
}

/** @deprecated Use `MenuSeparatorProps`. */
export type MenuDividerProps = MenuSeparatorProps

/** A compound-menu row that opens a nested menu — `children` or `items` supply the submenu; `isOpen`/`defaultOpen`/`onOpenChange` own its visibility.
 */
export interface MenuSubMenuProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> extends MenuItemProps {
	/** Content rendered inside the element. */
	children?: Renderable
	/** Nested items revealed on hover/focus. */
	items?: readonly MenuOption<Contracts, Stacks, Transitions>[]
	/** Controlled open state. */
	isOpen?: boolean
	/** Initial open state for uncontrolled usage. */
	defaultOpen?: boolean
	/** Reports requested open-state changes. */
	onOpenChange?: (isOpen: boolean) => void
}

/** Menu context available to descendants — `closeMenu()` dismisses the whole menu; `menuSize` is the inherited size.
 */
export interface MenuContextValue {
	/** Closes the open menu surface. */
	closeMenu(): void
	/** Size variant propagated to menu parts. */
	menuSize: 'sm' | 'md' | 'lg'
}

/** Internal surface contract shared by every renderer. */
export interface MenuSurfaceProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Content rendered inside the element. */
	children?: Renderable
	/** Closes the menu surface. */
	closeMenu(): void
	/** Closes this menu level (for nested submenus). */
	closeLevel?: () => void
	/** Where focus lands when the menu opens. */
	initialFocus?: 'first' | 'last' | 'container'
	/** Accessible label for the menu surface. */
	label?: string
	/** Id of the trigger that opened this surface — the web leaf sets
	 *  `aria-labelledby` so the menu is named by its trigger. Native leaves
	 *  have no trigger↔menu association and ignore it; `label` stays the
	 *  fallback name on every target. */
	labelledBy?: string
}

/** The `DropdownMenu` trigger described as shared-`Button` props — every
 *  `ButtonProps` field except the press handler, which the menu owns
 *  (Astryx `DropdownMenuButtonProps`). */
export type DropdownMenuButtonProps = Omit<ButtonProps, 'clickAction'>

/** Both data rows and compound children use the same menu contracts.
 *
 * @example
 * ```tsx
 * import { DropdownMenu } from '@octane-xplat/ui'
 *
 * <DropdownMenu
 * 	button={{ label: 'Actions' }}
 * 	items={[
 * 		{ type: 'action', key: 'rename', label: 'Rename', onSelect: rename },
 * 		{ type: 'separator', key: 'd' },
 * 		{ type: 'action', key: 'delete', label: 'Delete', onSelect: remove },
 * 	]}
 * />
 * ```
 * @see MenuItem, MenuOption, ContextMenuProps.
 */
export interface DropdownMenuProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> {
	/** Applied to the menu surface (Astryx `className`). */
	className?: ClassValue
	/** Applied to the menu surface (Astryx `style`). */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Trigger rendered as the shared `Button` — `label`, `icon`, `variant`,
	 *  `size`, `isIconOnly`, `isDisabled`, `endContent`, `tooltip`, …
	 *  (Astryx `button`). @default { label: 'Menu' } */
	button?: DropdownMenuButtonProps
	/** Minimum popover width — px number or CSS length/keyword; the menu may
	 *  grow for its content but is capped to the viewport. Defaults to the
	 *  trigger width. Ignored by bottom-sheet presentation (Astryx
	 *  `menuWidth`). Web resolves CSS keywords and `min()` clamps; native
	 *  applies numeric values only. */
	menuWidth?: number | string
	/** Append a chevron to a labelled trigger — skipped for `isIconOnly`
	 *  buttons (Astryx `hasChevron`). @default true */
	hasChevron?: boolean
	/** Additional class for the inherited Popover surface. */
	menuClassName?: ClassValue
	/** Menu items/sections rendered by the dropdown. */
	items?: readonly MenuOption<Contracts, Stacks, Transitions>[]
	/** Content rendered inside the element. */
	children?: Renderable
	/** Caller-owned visibility; onOpenChange requests do not replace this value. */
	isOpen?: boolean
	/** Initial open state for uncontrolled usage. */
	defaultOpen?: boolean
	/** Reports requested open-state changes. */
	onOpenChange?: (isOpen: boolean) => void
	/** Preferred side of the menu relative to the trigger. */
	placement?: PopoverPlacement
	/** Alignment along the placement axis. */
	alignment?: PopoverAlignment
	/** Disables the trigger. */
	isDisabled?: boolean
	/** Surface presenting the items: anchored 'popover' (default), a modal
	 *  'bottom-sheet', or 'adaptive' (bottom-sheet on compact coarse-pointer
	 *  viewports, popover elsewhere — mobile resolves to sheet). Compound
	 *  `children` menus are popover-only, matching upstream. */
	presentation?: MoreMenuPresentation
	/** Accessible name for the menu surface — the BottomSheet label under
	 *  sheet presentation and the trigger/menu fallback. */
	label?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Long press/right click, with an optional visible trigger for touch access.
 *
 * @example
 * ```tsx
 * import { ContextMenu, Text } from '@octane-xplat/ui'
 *
 * <ContextMenu items={[{ type: 'action', key: 'copy', label: 'Copy', onSelect: copy }]}>
 * 	<Text>{row}</Text>
 * </ContextMenu>
 * ```
 * @see DropdownMenuProps.
 */
export interface ContextMenuProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> extends Omit<
	DropdownMenuProps<Contracts, Stacks, Transitions>,
	'children' | 'button' | 'hasChevron'
> {
	/** Content rendered inside the element. */
	children?: Renderable
	/** Compound menu content (children remain the context target). */
	menu?: Renderable
	/** Optional visible trigger for touch access — the long-press/right-click
	 *  target stays `children`. */
	trigger?: Renderable
	/** Accessible trigger name when there is no visible text. */
	accessibilityLabel?: string
	/** Menu item size (Astryx `size`). @default 'md' */
	size?: FieldControlSize
}

/** Badge — inline label chip. Pure composition, unstyled beyond layout.
 *
 * @example
 * ```tsx
 * import { Badge } from '@octane-xplat/ui'
 *
 * <Badge>{count} new</Badge>
 * ```
 */
/** Astryx `Badge` tone — five semantic variants plus the categorical palette. */
export type BadgeVariant =
	| 'neutral'
	| 'info'
	| 'success'
	| 'warning'
	| 'error'
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

/** Badge — small status/category pill. `label` is the pill text; `children`
 *  win when both are set (Astryx `Badge`). */
export interface BadgeProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Pill text (Astryx `label`). */
	label?: string | number
	/** Semantic or categorical color. @default 'neutral' */
	variant?: BadgeVariant
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Hairline rule between content.
 *
 * @example
 * ```tsx
 * import { Divider } from '@octane-xplat/ui'
 *
 * <Divider />
 * ```
 */
export interface SeparatorProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Axis the separator runs perpendicular to. */
	orientation?: 'horizontal' | 'vertical'
	/** Stroke weight — 'subtle' hairline (default) or 'strong' (Astryx Divider variant). */
	variant?: 'subtle' | 'strong'
	/** Optional label centered on the rule (Astryx `Divider label`). */
	label?: Renderable
	/** Escape the parent's inline padding so the rule spans edge to edge. */
	isFullBleed?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Skeleton — placeholder block shown while content loads.
 *
 * @example
 * ```tsx
 * import { Skeleton } from '@octane-xplat/ui'
 *
 * <Skeleton width={120} height={16} />
 * ```
 */
export interface SkeletonProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Placeholder width — number is DIPs, string is a CSS length. */
	width?: number | string
	/** Placeholder height — number is DIPs, string is a CSS length. */
	height?: number | string
	/** Corner shape (Astryx `radius`): 'rounded' (default square-ish element
	 *  radius) or 'circle' for avatar-like placeholders. */
	radius?: 'rounded' | 'circle' | 'square'
	/** Stagger index — delays the shimmer per sibling (Astryx `index`). */
	index?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Avatar — circular image with a text fallback.
 *
 * @example
 * ```tsx
 * import { Avatar } from '@octane-xplat/ui'
 *
 * <Avatar src={user.photo} alt={user.name} fallback="AL" size={32} />
 * ```
 * @see AvatarGroupProps, UserProps.
 */
/** Astryx avatar size names → px (xsm 16, sm 24, md 32, lg 40, xl 48). */
export type AvatarSize = 'xsm' | 'sm' | 'md' | 'lg' | 'xl' | number

export interface AvatarProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Image URL for the avatar. */
	src?: string
	/** Accessible description of the avatar image. */
	alt?: string
	/** Person name — derives initials for the fallback and the accessible
	 *  name when `alt`/`fallback` are unset (Astryx `name`). */
	name?: string
	/** Fallback text (initials) shown when `src` is missing/fails. */
	fallback?: string
	/** Avatar size token. */
	size?: AvatarSize
	/** Status dot rendered on the avatar's end edge — an `AvatarStatusDot`
	 *  element (Astryx `status`) or a variant name. */
	status?: AvatarStatusDotVariant | Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** AvatarGroup — overlapping row of avatars with an optional `+N` overflow.
 *
 * @example
 * ```tsx
 * import { AvatarGroup, Avatar } from '@octane-xplat/ui'
 *
 * <AvatarGroup max={4}>
 * 	{members.map((m) => <Avatar key={m.id} src={m.photo} fallback={m.initials} />)}
 * </AvatarGroup>
 * ```
 * @see AvatarProps.
 */
export interface AvatarGroupProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Max avatars rendered; the rest collapse into a `+N` avatar. */
	max?: number
	/** Avatar size applied to every member of the group. */
	size?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Status tones for `AvatarStatusDot` — same map as `StatusDot`. */
export type AvatarStatusDotVariant = StatusDotVariant

/** AvatarStatusDot — the status dot part that overlays an `Avatar` (Astryx
 *  `AvatarStatusDot`, also exposed as `Avatar status`). `label` is the
 *  accessible status name. */
export interface AvatarStatusDotProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Status meaning — picks the dot color. */
	variant?: AvatarStatusDotVariant
	/** Accessible name for the status (e.g. "Online"). */
	label?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** AvatarGroupOverflow — the `+N` counter part inside `AvatarGroup` (Astryx).
 *  `count` is the number of hidden members; `label` overrides the rendered
 *  text (`+{count}` default). */
export interface AvatarGroupOverflowProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Overflow count rendered in the chip (e.g. "+3"). */
	count?: number
	/** Custom overflow content — overrides `count`. */
	label?: Renderable
	/** Size matching the grouped avatars. */
	size?: AvatarSize
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ---------- form field layer (Phase 2) ----------

/** FormField wraps a control with a label, description, and validation status.
 *  Children is the control element.
 *
 * @example
 * ```tsx
 * import { Field, TextInput } from '@octane-xplat/ui'
 *
 * <Field label="Email" description="We never share it" status={{ type: 'error', message: 'Required' }}>
 * 	<TextInput value={email} onChange={setEmail} />
 * </Field>
 * ```
 * @see FieldControlProps — standalone controls carry the same vocabulary inline.
 */
export interface FormFieldProps extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** `FieldLabel` — a standalone field label (Astryx part): the label text
 *  plus the required/optional marker, tooltip, and description row, without
 *  the wrapping `Field` chrome. `inputID` binds it to its control. */
export interface FieldLabelProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Label text bound to the field. */
	label: string
	/** Id of the input the label points at (for/id linking on web). */
	inputID?: string
	/** Adds the required marker. */
	isRequired?: boolean
	/** Adds the optional marker. */
	isOptional?: boolean
	/** Applies the disabled label styling. */
	isDisabled?: boolean
	/** Helper text rendered under the label. */
	description?: string
	/** Tooltip content on the label's info affordance. */
	labelTooltip?: string
	/** Leading node in the label row (Astryx `labelIcon`). */
	labelIcon?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** `FieldStatus` — a standalone status message (Astryx part): the severity
 *  glyph plus message text, for fields that own their chrome. */
export interface FieldStatusComponentProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Status tone — selects icon and color. */
	type: FieldStatusType
	/** Status text rendered. */
	message?: string
	/** @default 'detached' */
	variant?: FieldStatusVariant
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** FieldGroup — labeled group of related fields (role=group).
 *
 * @example
 * ```tsx
 * import { FieldGroup, TextInput } from '@octane-xplat/ui'
 *
 * <FieldGroup label="Address">
 * 	<TextInput placeholder="Street" />
 * 	<TextInput placeholder="City" />
 * </FieldGroup>
 * ```
 * @see FormFieldProps (`Field`).
 */
export interface FieldGroupProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Group heading text. */
	label?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Shared settings/navigation row, exported as `Item`. Its label,
 *  description, startContent, and endContent roles match `ListItem`; use
 *  `Item.StartContent`/`Content`/`Description`/`EndContent` for custom
 *  composition. `Item` is standalone, while `ListItem` reads list marker
 *  and density context from its parent `List`.
 *
 * @example
 * ```tsx
 * import { Item, Icon } from '@octane-xplat/ui'
 *
 * <Item label="Notifications" description="Push and email" startContent={<Icon name="xplat-error" />} onPress={open} />
 * ```
 * @see ItemComponent for the slot composition, ListItemProps for list-context rows.
 */
export interface ItemProps extends AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Primary row text or rich content. */
	label?: Renderable
	/** Secondary text under the label. */
	description?: Renderable
	/** Content before the label/description column. */
	startContent?: Renderable
	/** Content after the label/description column. */
	endContent?: Renderable
	/** Activation callback — makes the row pressable. */
	onPress?: () => void
	/** Dims the row and blocks activation. */
	isDisabled?: boolean
	/** Selected row state (Astryx `isSelected`). */
	isSelected?: boolean
	/** Highlighted row tint (Astryx `isHighlighted`). */
	isHighlighted?: boolean
	/** Row density (Astryx `density`). @default 'balanced' */
	density?: ListDensity
	/** Clamp the description text to N lines (Astryx `descriptionLines`). */
	descriptionLines?: number
	/** Content rendered inside the element. */
	children?: Renderable
}

/** Props of the `Item` slot components (`Item.StartContent`/`Content`/`Description`/`EndContent`) — `className` plus children.
 */
export interface ItemSlotProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Content rendered inside the element. */
	children?: Renderable
}

/** The `Item` export's callable shape — the row component plus its named slot components (`StartContent`, `Content`, `Description`, `EndContent`) for custom composition.
 */
export interface ItemComponent {
	(props: ItemProps): unknown
	/** Slot component for the leading region. */
	StartContent: (props: ItemSlotProps) => unknown
	/** Slot component for the main region. */
	Content: (props: ItemSlotProps) => unknown
	/** Slot component for the secondary text region. */
	Description: (props: ItemSlotProps) => unknown
	/** Slot component for the trailing region. */
	EndContent: (props: ItemSlotProps) => unknown
}

/** InputNumber — normalized TextInput (number keyboard) flanked by −/+
 *  steppers. `value`/`onValueChange` for controlled, `defaultValue` for
 *  uncontrolled. `step` defaults to 1; `min`/`max` clamp.
 *
 * @example
 * ```tsx
 * import { NumberInput } from '@octane-xplat/ui'
 *
 * <NumberInput label="Quantity" value={qty} onValueChange={setQty} min={0} max={99} step={1} />
 * ```
 */
export interface InputNumberProps extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Controlled number; `null` is the explicit empty value. */
	value?: number | null
	/** Initial number or empty value for uncontrolled use. */
	defaultValue?: number | null
	/** Minimum accepted value. */
	min?: number
	/** Maximum accepted value. */
	max?: number
	/** Increment applied by the spin buttons/arrow keys. */
	step?: number
	/** Text shown while the field is empty. */
	placeholder?: string
	/** Trailing unit text inside the field (Astryx `units`). */
	units?: string
	/** Format the committed value in the display field — receives the
	 *  number, returns the shown text (Astryx `formatValue`). */
	formatValue?: (value: number) => string
	/** Draw the −/+ stepper buttons (Astryx `hasNumberSteppers`). When
	 *  unset, steppers show by default. */
	hasNumberSteppers?: boolean
	/** Draw a clear action while the field has a value (Astryx `hasClear`). */
	hasClear?: boolean
	/** Called after a clear action reports `null`. */
	onClear?: () => void
	/** Requests a number or `null` when the input is cleared. */
	onValueChange?: (value: number | null) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** PinInput — a row of single-character cells that auto-advance on entry.
 *  `onComplete` fires when all `length` cells are filled.
 *
 * @example
 * ```tsx
 * import { PinInput } from '@octane-xplat/ui'
 *
 * <PinInput label="Code" length={6} onComplete={verify} />
 * ```
 */
export interface PinInputProps extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Number of digit cells. */
	length?: number
	/** Controlled entered value. */
	value?: string
	/** Fires as digits are entered/cleared. */
	onValueChange?: (value: string) => void
	/** Fires once every cell is filled. */
	onComplete?: (value: string) => void
	/** Masks the entered digits. */
	secure?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One `Selector`/`MultiSelector` option — `value` is the selection identity, `label` the shown text (defaults to `value`), `group` a shared heading, `description` supporting text (not matched by search), `isDisabled` blocks it.
 */
export interface SelectOption {
	/** Value committed when the option is chosen. */
	value: string
	/** Text shown for the option. */
	label?: string
	/** Makes the option unselectable. */
	isDisabled?: boolean
	/** Group heading. Options in the same group retain their input order. */
	group?: string
	/** Supporting text; matching still uses label/value. */
	description?: string
	/** Leading node — icon, avatar, etc. (Astryx `renderOption` icon lane). */
	icon?: Renderable
}

/** Surface a `Selector`/`MultiSelector` listbox opens on — `'popover'` anchors
 *  it to the trigger, `'bottom-sheet'` presents it in a `BottomSheet`,
 *  `'adaptive'` resolves per pointer (sheet on coarse/touch, popover on fine).
 *  @default 'popover' on web, 'adaptive' (always-sheet) on mobile. */
export type SelectPresentation = 'popover' | 'bottom-sheet' | 'adaptive'

/** Trigger chrome for `Selector`/`MultiSelector` — `'input'` field styling or
 *  `'ghost'` borderless toolbar styling. @default 'input' */
export type SelectVariant = 'input' | 'ghost'

/** Select — anchored self-drawn listbox on every target (decision #48).
 *  `selectionMode` determines the selected value and change-event shape;
 *  `searchable`
 *  puts a normalized TextInput filter at the top of the listbox.
 *
 * @example
 * ```tsx
 * import { Selector, MultiSelector } from '@octane-xplat/ui'
 *
 * <Selector
 * 	label="Assignee"
 * 	options={people.map((p) => ({ value: p.id, label: p.name }))}
 * 	value={assignee}
 * 	onValueChange={setAssignee}
 * />
 *
 * <MultiSelector options={tags} value={selected} onValueChange={setSelected} />
 * ```
 * @see SelectOption, MultiSelectorProps — `MultiSelector` is the multi-select preset.
 */
export interface SelectBaseProps extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Options rendered in the dropdown. */
	options: SelectOption[]
	/** Adds a filter field inside the dropdown. */
	searchable?: boolean
	/** Called when the local filter changes, including reset on close. */
	onChangeQuery?: (query: string) => void
	/** Placeholder for the dropdown's filter field. */
	searchPlaceholder?: string
	/** Text shown when there are no options. */
	emptyText?: string
	/** Text shown when filtering matches nothing. */
	emptySearchText?: string
	/** Called after rejected commits have reconciled the selection. */
	onChangeError?: (error: unknown) => void
	/** Web form name; native keeps selection in application state. */
	htmlName?: string
	/** Maximum list height, in px/dip. @default 280 */
	maxMenuHeight?: number
	/** Text shown in the trigger before selection. */
	placeholder?: string
	/** Controlled open state of the dropdown. */
	open?: boolean
	/** Initial open state for uncontrolled usage. */
	defaultOpen?: boolean
	/** Reports requested open-state changes. */
	onOpenChange?: (open: boolean) => void
	/** Fires when the selection is cleared. */
	onClear?: () => void
	/** Shows a clear affordance in the trigger. */
	hasClear?: boolean
	/** Preferred side of the dropdown relative to the trigger. */
	placement?: PopoverPlacement
	/** Surface the listbox opens on — see `SelectPresentation`. */
	presentation?: SelectPresentation
	/** Trigger chrome — `'ghost'` renders the borderless toolbar variant. */
	variant?: SelectVariant
	/** Custom row content for one listbox option — receives the resolved
	 *  `SelectOption`; default renders label/description/icon lanes.
	 *  (Astryx `renderOption`.) */
	renderOption?: (option: SelectOption) => Renderable
	/** Custom trigger content for the selected option — receives the
	 *  resolved `SelectOption`; default shows its label. (Astryx
	 *  `renderValue`.) */
	renderValue?: (option: SelectOption) => Renderable
	/** Accessible name for the select. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** `SelectorOption` — the styled option row used by `renderOption`/
 *  `renderValue` renderers (Astryx part): icon lane, label, description. */
export interface SelectorOptionProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Icon shown beside the option. */
	icon?: Renderable
	/** Text shown for the option. */
	label?: string
	/** Secondary text under the option. */
	description?: string
	/** Makes the option unselectable. */
	isDisabled?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Single-value Selector contract. `null` means no selected option. */
export interface SelectSingleProps extends SelectBaseProps {
	/** Single-select discriminator — `single` fixes this variant. */
	selectionMode?: 'single'
	/** Controlled selected value, or null. */
	value?: string | null
	/** Initial value for uncontrolled usage. */
	defaultValue?: string | null
	/** Fires with the new value (or null when cleared). */
	onValueChange?: (value: string | null) => void
	/** Async commit after `onValueChange`. Blocks edits until settled. */
	changeAction?: (value: string | null) => void | Promise<void>
	/** Unused in single mode — `selectionMode` discriminates. */
	hasSelectAll?: never
	/** Unused in single mode — `selectionMode` discriminates. */
	selectAllLabel?: never
	/** Unused in single mode — `selectionMode` discriminates. */
	triggerDisplay?: never
	/** Unused in single mode — `selectionMode` discriminates. */
	formatValue?: never
}

/** Multi-value Selector contract. Its callback always receives the selected
 *  values as an array, including an empty array after clearing. */
export interface SelectMultipleProps extends SelectBaseProps {
	/** Multi-select discriminator — `multiple` fixes this variant. */
	selectionMode: 'multiple'
	/** Controlled selected values. */
	value?: string[]
	/** Initial values for uncontrolled usage. */
	defaultValue?: string[]
	/** Fires with the new value array. */
	onValueChange?: (value: string[]) => void
	/** Show bulk selection of the visible enabled options. */
	hasSelectAll?: boolean
	/** Label for the select-all row. */
	selectAllLabel?: string
	/** Multi-value trigger summary — `'labels'` joins selected labels,
	 *  `'count'` shows `N selected`, `'badges'` renders removable tokens.
	 *  @default 'labels' */
	triggerDisplay?: 'labels' | 'count' | 'badges'
	/** Formats the selection summary shown in the trigger. */
	formatValue?: (
		items: {
			/** Option value. */
			value: string
			/** Option display text. */
			label: string
		}[],
	) => string
	/** Async commit after `onValueChange`. Blocks edits until settled. */
	changeAction?: (value: string[]) => void | Promise<void>
}

export type SelectProps = SelectSingleProps | SelectMultipleProps

// ---------- Astryx parity: typeahead + token selection ----------

/** Minimal item contract for search results feeding the Typeahead family.
 *  `element` is a pre-rendered node that takes priority over `renderItem` and
 *  the default TypeaheadItem row; a string `auxiliaryData.group` groups
 *  results under a shared heading.
 *
 * @see SearchSource — the search contract these items arrive through; createStaticSource builds one from an array.
 */
export interface SearchableItem<TAuxData = unknown> {
	/** Stable identity used for selection and keys. */
	id: string
	/** Text matched against the query and displayed. */
	label: string
	/** Custom rendered content for the item row — overrides `label`. */
	element?: Renderable
	/** Caller data carried through to `renderItem`/selection unchanged. */
	auxiliaryData?: TAuxData
}

/** One in-flight `SearchSource` call. `signal` aborts when the request is
 *  superseded or abandoned — every call gets a fresh signal, so consumers
 *  sharing one source cannot cancel each other's work. */
export interface SearchRequest {
	/** Aborts the request when superseded by a newer query. */
	readonly signal: AbortSignal
}

/** Supplies items to Typeahead/Tokenizer. `search` runs on (debounced) query
 *  changes and `bootstrap` on focus when `hasEntriesOnFocus` is set. Both
 *  receive a request whose `signal` aborts superseded in-flight work —
 *  optional for sources that do no async work; stale results are discarded
 *  when they resolve.
 *
 * @example
 * ```ts
 * import { createStaticSource } from '@octane-xplat/ui'
 *
 * // static list — or hand-write search/bootstrap honoring request.signal
 * const source = createStaticSource([
 * 	{ id: '1', label: 'Ada' },
 * 	{ id: '2', label: 'Grace' },
 * ])
 * ```
 * @see createStaticSource, SearchableItem, SearchRequest.
 */
export interface SearchSource<T extends SearchableItem = SearchableItem> {
	/** Resolves suggestions for a query — may be sync or async; `signal` aborts stale calls. */
	search(query: string, request?: SearchRequest): Promise<T[]> | T[]
	/** Suggestions shown before any query — defaults to `search("")` when absent. */
	bootstrap(request?: SearchRequest): Promise<T[]> | T[]
}

/** Options for `createStaticSource` — `keywords(item)` supplies extra matched terms alongside `label`.
 *
 * @example
 * ```ts
 * import { createStaticSource } from '@octane-xplat/ui'
 *
 * const source = createStaticSource(items, {
 * 	keywords: (item) => [item.id],
 * })
 * ```
 * @see SearchSource.
 */
export interface CreateStaticSourceOptions<T extends SearchableItem = SearchableItem> {
	/** Extra search terms per item, matched alongside `label`. */
	keywords?: (item: T) => string[]
}

/** Imperative handle for the text input inside the Typeahead family,
 *  delivered through `ref`. `setQuery` rewrites the field's query text —
 *  it backs Typeahead's click-to-edit.
 *
 * @see BaseTypeaheadProps.ref.
 */
export interface TypeaheadInputHandle {
	/** Moves focus into the field. */
	focus(): void
	/** Removes focus from the field. */
	blur(): void
	/** Sets the query text imperatively. */
	setQuery(query: string): void
	/** The platform input host — surfaces differ per platform. */
	native: HostElement
}

/** Keydown notification on the typeahead input. Fires with the DOM
 *  KeyboardEvent on web, or the native key payload on AppKit, before internal
 *  navigation (call `preventDefault`
 *  to suppress it). Never fires on iOS/Android — native text fields emit
 *  no key events — so behavior gated on it (e.g. Tokenizer's
 *  Backspace-removes-last-token) is pointer-platform only. */
/** Portable key event for the typeahead input's `onKeyDown` — the DOM
 *  KeyboardEvent satisfies it on web; other hosts may fire a subset. */
export interface TypeaheadKeyEvent {
	/** DOM `key` value for the pressed key. */
	key: string
	/** True while an IME composition is in progress — handlers should ignore. */
	isComposing?: boolean
	/** Legacy key code for the pressed key. */
	keyCode?: number
	/** Set when the default navigation/editing behavior was consumed. */
	defaultPrevented?: boolean
	/** Consumes the key — prevents the typeahead's default handling. */
	preventDefault(): void
}

/** `onKeyDown` signature for the typeahead-family input — receives `TypeaheadKeyEvent`; web/AppKit fire it before internal navigation (`preventDefault` suppresses), iOS/Android never emit it.
 */
export type TypeaheadKeyDownHandler = (event: TypeaheadKeyEvent) => void

/** BaseTypeahead — the unstyled combobox engine under Typeahead and
 *  Tokenizer: bare input + search/bootstrap + keyboard navigation + an
 *  anchored result listbox. It renders no field chrome; callers supply the
 *  visible wrapper and pass `anchor` for dropdown positioning.
 *
 * @example
 * ```tsx
 * import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
 *
 * <BaseTypeahead
 * 	searchSource={source}
 * 	value={picked}
 * 	onChange={setPicked}
 * 	placeholder="Search…"
 * />
 * ```
 * @see TypeaheadProps for the field-chromed version.
 */
export interface BaseTypeaheadProps<
	T extends SearchableItem = SearchableItem,
> extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Element id applied to the input itself. */
	id?: string
	/** Async/search provider supplying suggestion items. */
	searchSource: SearchSource<T>
	/** Currently selected item (null = nothing selected). Controlled. */
	value: T | null
	/** Fires when a result is committed (item) or cleared (null). */
	onChange: (item: T | null) => void
	/** Custom option content inside the stable result row. Default:
	 *  TypeaheadItem. `item.element` takes precedence over this. */
	renderItem?: (item: T) => Renderable
	/** Text shown while the field is empty. */
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
	/** Focuses the field on mount. */
	hasAutoFocus?: boolean
	/** Fires as the query text changes. */
	onChangeQuery?: (query: string) => void
	/** Reports requested open-state changes for the suggestion menu. */
	onOpenChange?: (open: boolean) => void
	/** Debounce before `search` after typing; 0 runs synchronously.
	 *  Default 150. */
	debounceMs?: number
	/** Anchor the dropdown to this ref's element/view instead of the input. */
	anchorRef?: PopoverAnchorRef
	/** Preferred side of the menu relative to the input. */
	placement?: PopoverPlacement
	/** Id applied to the inner input element. */
	inputId?: string
	/** Extra ids wired into the input's aria-describedby. */
	ariaDescribedBy?: string
	/** Ids wired into the input's aria-labelledby. */
	ariaLabelledBy?: string
	/** Tab order override for the inner input. */
	inputTabIndex?: number
	/** Key handler invoked before the typeahead's own handling. */
	onKeyDown?: TypeaheadKeyDownHandler
	/** Fires when the field gains focus. */
	onFocus?: () => void
	/** Fires when the field loses focus. */
	onBlur?: () => void
	/** Exposes the imperative handle through a standard Octane ref; cleared on unmount. */
	ref?: Octane.Ref<TypeaheadInputHandle>
	/** Class/style applied to the input element only. */
	inputClassName?: ClassValue
	/** Inline style applied to the inner input only. */
	inputStyle?: StyleProp
	/** Accessible name for the input. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Typeahead — single-selection search-as-you-type field. Renders its Field
 *  chrome (label/description/status), the input wrapper, and the selected
 *  value as a Token over the input; click the token to edit (blur or Escape
 *  restores it).
 *
 * @example
 * ```tsx
 * import { Typeahead, createStaticSource } from '@octane-xplat/ui'
 *
 * const people = createStaticSource([{ id: '1', label: 'Ada' }])
 * <Typeahead label="Assignee" searchSource={people} value={assignee} onChange={setAssignee} />
 * ```
 * @see BaseTypeaheadProps for the unstyled engine, TokenizerProps for multi-select.
 */
export interface TypeaheadProps<
	T extends SearchableItem = SearchableItem,
> extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Accessible label — required by Astryx; kept required here. */
	label: string
	/** Keeps the label for assistive tech but removes it visually. */
	isLabelHidden?: boolean
	/** Async/search provider supplying suggestion items. */
	searchSource: SearchSource<T>
	/** Controlled selected item, or null. */
	value: T | null
	/** Fires when an item is chosen (or cleared). */
	onChange: (item: T | null) => void
	/** Renders one suggestion row. */
	renderItem?: (item: T) => Renderable
	/** Text shown while the field is empty. */
	placeholder?: string
	/** Opens the menu on focus before any query is typed. */
	hasEntriesOnFocus?: boolean
	/** Cap on suggestions rendered at once. */
	maxMenuItems?: number
	/** Minimum query length before the source is queried. */
	minQueryLength?: number
	/** Text shown when the query matches nothing. */
	emptySearchResultsText?: string
	/** Why the field is disabled; shown as a tooltip on pointer platforms
	 *  while the input stays focusable. */
	disabledMessage?: string
	/** Show the clear button while a value is selected. Default true. */
	hasClear?: boolean
	/** Focuses the field on mount. */
	hasAutoFocus?: boolean
	/** Query debounce in ms before hitting the source. */
	debounceMs?: number
	/** Fires as the query text changes. */
	onChangeQuery?: (query: string) => void
	/** Reports requested open-state changes for the menu. */
	onOpenChange?: (open: boolean) => void
	/** Leading glyph — a registered Icon name or a node. */
	startIcon?: Renderable
	/** Field width; numbers are px/dip, strings pass through. */
	width?: number | string
	/** Exposes the imperative handle through a standard Octane ref; cleared on unmount. */
	ref?: Octane.Ref<TypeaheadInputHandle>
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Tooltip content on the label's info affordance. */
	labelTooltip?: string
}

/** Default result-row content for the Typeahead family — `item`, optional leading `icon`/`description`, `isDisabled`, presentational `group` label. Swap via `renderItem` on `BaseTypeahead`/`Typeahead`/`Tokenizer`.
 */
export interface TypeaheadItemProps<T extends SearchableItem = SearchableItem> {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** The suggestion rendered by this row. */
	item: T
	/** Leading node — icon, avatar, etc. */
	icon?: Renderable
	/** Supporting text under the label. */
	description?: string
	/** Makes the suggestion unselectable. */
	isDisabled?: boolean
	/** Group label; presentational only — grouping itself is driven by
	 *  `item.auxiliaryData.group`. */
	group?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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

/** Astryx name for `FieldControlSize` on `Token`.
 */
export type TokenSize = FieldControlSize

/** Token — inline chip for an entity: label + optional icon, end content,
 *  and a remove affordance. `onClick` makes the whole chip a button;
 *  `href` makes it a link (web `<a>`, native opens the URL); with both
 *  `href` and `onRemove` the link and the remove button render as siblings
 *  and the rest of the chip surface activates the link.
 *
 * @example
 * ```tsx
 * import { Token } from '@octane-xplat/ui'
 *
 * <Token label={user.name} color="blue" onRemove={() => remove(user.id)} />
 * ```
 * @see TokenizerProps — a field of editable tokens.
 */
export interface TokenProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Text shown inside the token chip. */
	label: string
	/** Token size variant. */
	size?: TokenSize
	/** Token color variant. */
	color?: TokenColor
	/** Leading node — icon, avatar, etc. */
	icon?: Renderable
	/** Dims the token and blocks removal/interaction. */
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
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Change metadata passed to Tokenizer's `onChange`. */
export type TokenizerChange<T extends SearchableItem = SearchableItem> =
	| { /** Item the change applies to. */ item: T; /** Add discriminator — an existing item was chosen. */ type: 'add' }
	| { /** Item the change applies to. */ item: T; /** Create discriminator — a new item was minted from the query. */ type: 'create' }
	| { /** Item the change applies to. */ item: T; /** Remove discriminator — the item was deleted. */ type: 'remove' }
	| { /** Reorder discriminator — item positions changed. */ type: 'reorder' }

/** Astryx name for `FieldControlSize` on `Tokenizer`.
 */
export type TokenizerSize = FieldControlSize

/** Token overflow when the field is too narrow: 'none' wraps (default);
 *  'unfocusedInline' collapses to one clipped line with a "+N more" count
 *  until the field is focused; 'unfocusedLayer' does the same but expands
 *  in an anchored overlay instead of reflowing the field. */
export type TokenizerOverflowBehavior = 'none' | 'unfocusedInline' | 'unfocusedLayer'

/** Imperative handle delivered through Tokenizer's `ref`. */
export interface TokenizerHandle {
	/** Moves focus into the field. */
	focus(): void
	/** Removes focus from the field. */
	blur(): void
	/** The root field element/view. */
	native: HostElement
}

/** Tokenizer — multi-select field: Token chips + a BaseTypeahead input.
 *  Selecting adds a token and clears the query; Backspace on an empty input
 *  removes the last token on web and experimental AppKit (native OS
 *  delivery remains unqualified; iOS/Android use token remove buttons); `hasCreate` offers a "Create \"…\"" entry for free text.
 *
 * @example
 * ```tsx
 * import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
 *
 * <Tokenizer
 * 	label="Tags"
 * 	searchSource={tagSource}
 * 	value={tags}
 * 	onChange={(items, change) => setTags(items)}
 * 	hasCreate
 * />
 * ```
 * @see TokenProps, TokenizerChange.
 */
export interface TokenizerProps<
	T extends SearchableItem = SearchableItem,
> extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Label for the tokenizing field. */
	label: string
	/** Provider supplying token suggestions. */
	searchSource: SearchSource<T>
	/** Selected items. Controlled. */
	value: T[]
	/** Fires with the full token list plus the change that produced it. */
	onChange: (items: T[], change: TokenizerChange<T>) => void
	/** Renders one suggestion row. */
	renderItem?: (item: T) => Renderable
	/** Custom token renderer — receives the item and its remove callback.
	 *  Default: Token with label + ✕. */
	renderToken?: (item: T, onRemove: () => void) => Renderable
	/** Cap on selections; the input collapses at the cap. */
	maxEntries?: number
	/** Text shown while the field is empty. */
	placeholder?: string
	/** Opens the menu on focus before any query is typed. */
	hasEntriesOnFocus?: boolean
	/** Cap on suggestions rendered at once. */
	maxMenuItems?: number
	/** Fixed dropdown width (px/dip); never below the field width. */
	menuWidth?: number
	/** Minimum query length before the source is queried. */
	minQueryLength?: number
	/** Text shown when the query matches nothing. */
	emptySearchResultsText?: string
	/** Why the field is disabled; tooltip on pointer platforms. */
	disabledMessage?: string
	/** Show a clear-all button while tokens exist. Default false. */
	hasClear?: boolean
	/** Content in the field's inline-end lane (with the spinner/clear). */
	endContent?: Renderable
	/** Focuses the field on mount. */
	hasAutoFocus?: boolean
	/** What happens when tokens exceed the field width (wrap/truncate/popover). */
	tokenOverflowBehavior?: TokenizerOverflowBehavior
	/** Query debounce in ms before hitting the source. */
	debounceMs?: number
	/** Offer "Create \"query\"" for unmatched free text. */
	hasCreate?: boolean
	/** HTML form name — web only: renders hidden `<input>`s carrying one
	 *  entry per selected item id. No-op on native. */
	htmlName?: string
	/** Fires as the query text changes. */
	onChangeQuery?: (query: string) => void
	/** Focus enters/leaves the field (no event object — portable). */
	onFocus?: () => void
	/** Fires when the field loses focus. */
	onBlur?: () => void
	/** Icon rendered at the field's leading edge. */
	startIcon?: Renderable
	/** Field width — number is DIPs, string is a CSS length. */
	width?: number | string
	/** Tooltip content on the label's info affordance. */
	labelTooltip?: string
	/** Exposes the imperative handle through a standard Octane ref; cleared on unmount. */
	ref?: Octane.Ref<TokenizerHandle>
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Trigger chrome for `ComplexSelector` — `'input'` (field styling) or `'ghost'`.
 */
export type ComplexSelectorVariant = 'input' | 'ghost'
/** Astryx name for `FieldControlSize` on `ComplexSelector`.
 */
export type ComplexSelectorSize = FieldControlSize

/** Render state passed to the ComplexSelector surface builder. */
export interface ComplexSelectorRenderState {
	/** Whether the selector surface is open. */
	isOpen: boolean
	/** Whether the selector is loading. */
	isBusy: boolean
	/** Id linking the trigger to the surface. */
	triggerId: string
	/** Id of the surface element. */
	contentId: string
}

/** Named context passed to `ComplexSelector`'s `children` render function.
 *  `value` is optimistic while `changeAction` is pending; `onChange`
 *  commits a value and `close` closes the surface. */
export interface ComplexSelectorRenderProps<Value> extends ComplexSelectorRenderState {
	/** Current value passed to the render function. */
	value: Value
	/** Commits a new value from inside the surface. */
	onChange: (value: Value) => void
	/** Closes the surface. */
	close: () => void
}

/** Imperative handle delivered through ComplexSelector's `ref`. Drives the
 *  same popover machinery as the trigger — prefer it over mirroring open
 *  state in the parent. */
export interface ComplexSelectorHandle {
	/** Opens the selector surface. */
	open(): void
	/** Closes the surface and restores focus to the trigger. */
	close(): void
	/** Toggles the selector surface. */
	toggle(): void
	/** Reads the current open state. */
	isOpen(): boolean
}

/** ComplexSelector — a field + trigger + anchored surface for rich custom
 *  pickers. `children` is a render function receiving one named context
 *  with the (optimistic) value, commit and close callbacks, and render
 *  state fields; the component owns the trigger, popover, focus restore,
 *  and async `changeAction` flow.
 *
 * @example
 * ```tsx
 * import { ComplexSelector, RadioList } from '@octane-xplat/ui'
 *
 * <ComplexSelector label="Color" value={color} onChange={setColor}>
 * 	{({ value, onChange, close }) => (
 * 		<RadioList
 * 			options={colors}
 * 			value={value}
 * 			onValueChange={(c) => { onChange(c); close() }}
 * 		/>
 * 	)}
 * </ComplexSelector>
 * ```
 * @see ComplexSelectorRenderProps for the children context, ComplexSelectorHandle.
 */
export interface ComplexSelectorProps<Value> extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Label for the selector field. */
	label: string
	/** Controlled selected value. */
	value: Value
	/** Fires when a value is committed. */
	onChange?: (value: Value) => void
	/** Async action run after `onChange`; the surface reports `isBusy` and
	 *  renders `value` optimistically until it settles. */
	changeAction?: (value: Value) => void | Promise<void>
	/** Render function receiving the selector's render props. */
	children: (context: ComplexSelectorRenderProps<Value>) => Renderable
	/** Trigger content while closed; falls back to `placeholder`. */
	triggerLabel?: Renderable
	/** Content shown in the trigger before selection. */
	placeholder?: Renderable
	/** Loading/busy state on the trigger. */
	isLoading?: boolean
	/** 'input' (default) draws the field chrome; 'ghost' a flat
	 *  toolbar-style button. */
	variant?: ComplexSelectorVariant
	/** Icon at the trigger's leading edge. */
	startIcon?: Renderable
	/** Trigger width — number is DIPs, string is a CSS length. */
	width?: number | string
	/** Tooltip content on the label's info affordance. */
	labelTooltip?: string
	/** Preferred side of the surface relative to the trigger. */
	placement?: PopoverPlacement
	/** Alignment of the surface along the placement axis. */
	alignment?: 'start' | 'center' | 'end'
	/** Exposes the imperative handle through a standard Octane ref; cleared on unmount. */
	ref?: Octane.Ref<ComplexSelectorHandle>
	/** Reports requested open-state changes. */
	onOpenChange?: (open: boolean) => void
	/** Classes applied to the surface element. */
	contentClassName?: ClassValue
	/** Inline style applied to the surface element. */
	contentStyle?: StyleProp
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** InputRating — row of tappable glyphs reporting a 1..max score.
 *
 * @example
 * ```tsx
 * import { InputRating } from '@octane-xplat/ui'
 *
 * <InputRating label="Rating" value={stars} onValueChange={setStars} max={5} />
 * ```
 */
export interface InputRatingProps extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Controlled rating value. */
	value?: number
	/** Initial value for uncontrolled usage. */
	defaultValue?: number
	/** Highest rating (number of stars). */
	max?: number
	/** Glyph per cell — a Text character (default ★) or a registered Icon name. */
	icon?: string
	/** Fires with the new rating. */
	onValueChange?: (value: number) => void
	/** Accessible name for the rating control. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** CheckboxGroup — multi-select list of self-drawn checkboxes.
 *
 * @example
 * ```tsx
 * import { CheckboxList } from '@octane-xplat/ui'
 *
 * <CheckboxList
 * 	label="Channels"
 * 	options={[{ value: 'push' }, { value: 'email' }]}
 * 	value={channels}
 * 	onValueChange={setChannels}
 * />
 * ```
 * @see CheckboxProps (`CheckboxInput`), RadioGroupProps.
 */
export interface CheckboxGroupProps extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Options rendered as checkbox rows. */
	options?: RadioOption[]
	/** Controlled checked values — pair with `onValueChange`. */
	value?: string[]
	/** Initial checked values for uncontrolled use; `value` wins when both
	 *  are set. */
	defaultValue?: string[]
	/** Called with the complete next value array when the user toggles an
	 *  option. */
	onValueChange?: (values: string[]) => void
	/** Lays options out in a row instead of a column. */
	horizontal?: boolean
	/** Row density for the list items — 'compact' renders sm checkboxes. */
	density?: ListDensity
	/** Hairline between rows. @default false */
	hasDividers?: boolean
	/** Accessible name for the group. */
	accessibilityLabel?: string
	/** `CheckboxListItem` children — the Astryx child-part alternative to
	 *  `options`; items read checked state from the group context. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** `CheckboxListItem` — one row inside a `CheckboxList` (Astryx child
 *  part). With `value` it joins the group's checked set; without `value`,
 *  `isChecked`/`onCheck` make it a standalone item (select-all pattern). */
export interface CheckboxListItemProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Group membership key — join the parent `CheckboxList` value set. */
	value?: string
	/** Primary text for the row. */
	label?: string
	/** Secondary text under the label. */
	description?: string
	/** Content at the row's trailing edge. */
	endContent?: Renderable
	/** Makes the row unselectable. */
	isDisabled?: boolean
	/** Standalone checked state (no group `value`). */
	isChecked?: boolean | 'indeterminate'
	/** Standalone toggle callback (no group `value`). */
	onCheck?: (checked: boolean) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ---------- navigation & wayfinding (Phase 3) ----------

/** One `Breadcrumbs` trail entry — `label` plus `onSelect` to navigate; the last item renders as the current location.
 */
/** One `BreadcrumbItem menu` option — a labeled action or a divider row
 *  (Astryx `BreadcrumbMenuOption`). */
export type BreadcrumbMenuOption = { /** Text shown for the menu entry. */ label: string; /** Handler fired when the entry is chosen. */ onClick?: () => void } | { /** Divider discriminator — renders a separator instead of an entry. */ type: 'divider' }

/** `Breadcrumbs` trail visual weight (Astryx `variant`). */
export type BreadcrumbsVariant = 'default' | 'supporting'

interface BreadcrumbItemBase {
	/** Link text for the breadcrumb entry. */
	label: string
	/** Renders the entry inert (current page). */
	isDisabled?: boolean
	/** Fires when the entry is activated. */
	onSelect?: () => void
	/** Leading icon content (Astryx `startIcon`). */
	startIcon?: Renderable
	/** Dropdown options turning this crumb into a menu trigger (Astryx `menu`). */
	menu?: BreadcrumbMenuOption[]
	/** Mark this crumb the current location explicitly (Astryx `isCurrent`);
	 *  without it the last item is current. */
	isCurrent?: boolean
	/** Custom link element for this item's anchor (Astryx `as`) — overrides
	 *  the `LinkProvider` default. */
	as?: NavLinkComponentType
}

/** An ancestor with a typed route, raw URL, local action, or static label. */
export type BreadcrumbEntry<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = BreadcrumbItemBase & NavigationTargetProps<Contracts, Stacks, Transitions>

/** Breadcrumb — ancestor trail. Items render as pressable links separated
 *  by `separator` (default /).
 *
 * @example
 * ```tsx
 * import { Breadcrumbs } from '@octane-xplat/ui'
 *
 * <Breadcrumbs items={[{ label: 'Docs', onSelect: toDocs }, { label: 'Guide' }]} />
 * ```
 * @see BreadcrumbItem.
 */
export interface BreadcrumbProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Ordered breadcrumb entries, root first. */
	items?: readonly BreadcrumbEntry<Contracts, Stacks, Transitions>[]
	/** Maximum visible trail items, at least two; hidden ancestors use a menu. */
	maxVisibleItems?: number
	/** Additional overflow actions use the same compound menu parts. */
	overflowMenu?: Renderable
	/** Accessible label for the overflow menu. */
	overflowLabel?: string
	/** Separator between crumbs — text or element (Astryx `separator`,
	 *  default '/'). */
	separator?: string | Renderable
	/** Trail visual weight (Astryx `variant`). */
	variant?: BreadcrumbsVariant
	/** `BreadcrumbItem` part children (Astryx composition) — combined with
	 *  `items`, which render first. */
	children?: Renderable
	/** Accessible name for the nav landmark. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Pagination — prev/next + a windowed run of page buttons around `page`.
 *
 * @example
 * ```tsx
 * import { Pagination } from '@octane-xplat/ui'
 *
 * <Pagination page={page} pageCount={total} onPageChange={setPage} />
 * ```
 */
export interface PaginationProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Controlled current page (1-based). */
	page: number
	/** Total number of pages. */
	pageCount: number
	/** Pages shown to each side of `page` (default 1). */
	siblingCount?: number
	/** Fires with the requested page. */
	onPageChange?: (page: number) => void
	/** Disables all page controls. */
	disabled?: boolean
	/** Accessible name for the pagination nav. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One `Stepper` entry — stable `key`, `label`, optional `icon` (registered `IconName`), `disabled` blocks tapping it.
 */
export interface StepperStep {
	/** Stable key identifying the step. */
	key: string
	/** Step title text. */
	label?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	/** Blocks navigating to this step. */
	disabled?: boolean
}

/** Stepper — numbered step row. Steps before `current` show a done mark;
 *  tapping a non-disabled step calls `onStepChange`.
 *
 * @example
 * ```tsx
 * import { Stepper } from '@octane-xplat/ui'
 *
 * <Stepper steps={[{ key: 'account' }, { key: 'profile' }, { key: 'done' }]} current={step} />
 * ```
 * @see StepperStep.
 */
export interface StepperProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Data-driven steps — the flat alternative to `Step` children. */
	steps?: StepperStep[]
	/** Controlled current step index. */
	current?: number
	/** Fires when a step is activated. */
	onStepChange?: (index: number) => void
	/** Accessible name for the stepper. */
	accessibilityLabel?: string
	/** Active step index for the `Step` child-part contract (Astryx
	 *  `activeStep`). */
	activeStep?: number
	/** Called with a step's `step` index when it is activated (Astryx
	 *  `onStepClick`). */
	onStepClick?: (step: number) => void
	/** @default 'horizontal' */
	orientation?: 'horizontal' | 'vertical'
	/** Indicator placement for the child-part contract. @default 'off-track' */
	indicatorPosition?: 'off-track' | 'on-track'
	/** Width-collapse hints for horizontal steppers (Astryx
	 *  `horizontalOptions`). */
	horizontalOptions?: {
		/** Smallest width per step in DIPs before collapsing. */
		minimumStepWidth?: number
		/** Presentation when the stepper overflows — labeled controls vs steps only. */
		collapsedVariant?: 'withLabelAndControls' | 'steps'
	}
	/** `Step` children — the Astryx child-part alternative to `steps`. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** `Step` — one node in a `Stepper` (Astryx child part). Its state derives
 *  from comparing `step` against the Stepper's `activeStep`: below is
 *  completed, equal is current, above is upcoming. Children render as the
 *  step's content slot. */
export interface StepProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Position this step claims in the parent's progress. */
	step: number
	/** Step title text. */
	label?: string
	/** Secondary text under the step title. */
	description?: string
	/** `'auto'` (number → check when passed), `'number'`, `'none'`, or a
	 *  node rendered as the indicator. */
	indicator?: 'auto' | 'number' | 'none' | Renderable
	/** Status tint — `'accent'` marks the in-progress step without error. */
	status?: 'success' | 'warning' | 'error' | 'accent'
	/** Marks the step skippable. */
	isOptional?: boolean
	/** Blocks navigating to this step. */
	isDisabled?: boolean
	/** Content at the step row's trailing edge. */
	endContent?: Renderable
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One `NavigationMenu` entry — `key`, `label`, optional `icon`, `href` link target (real anchor on web; route-table activation on native), `active` marks the current item, `onSelect` handles custom activation.
 */
interface NavigationMenuItemBase {
	/** Stable key identifying the step. */
	key: string
	/** Step title text. */
	label?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	/** Whether this step is the current one. */
	active?: boolean
	/** Blocks navigating to this step. */
	disabled?: boolean
	/** Fires with the activation event when the step is chosen. */
	onSelect?: (event: NavigationActivationEvent) => void
}

/** A strip item with an inferred route destination, raw URL, or action. */
export type NavigationMenuItem<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = NavigationMenuItemBase & NavigationTargetProps<Contracts, Stacks, Transitions>

/** NavigationMenu — row (or column) of nav items; mostly a desktop/web
 *  idiom — the mobile equivalent is Tabs/Drawer.
 *
 * @example
 * ```tsx
 * import { NavigationMenu } from '@octane-xplat/ui'
 *
 * <NavigationMenu items={[{ key: 'home', label: 'Home', href: '/' }, { key: 'docs', label: 'Docs', href: '/docs' }]} />
 * ```
 * @see NavigationMenuItem.
 */
export interface NavigationMenuProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Menu entries rendered by the nav menu. */
	items: readonly NavigationMenuItem<Contracts, Stacks, Transitions>[]
	/** Lays the menu out in a row (default column). */
	horizontal?: boolean
	/** Accessible name for the nav landmark. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Static action entry for CommandPalette's search results. */
export interface CommandPaletteMenuItem extends MenuItemData {
	/** Section the item is grouped under. */
	group?: string
	/** Extra terms matched during search. */
	keywords?: string[]
	/** Secondary text under the item. */
	description?: string
	/** Shortcut hint rendered at the trailing edge. */
	shortcut?: string
}

/** Source-backed command entry. Metadata grouping uses auxiliaryData.group. */
export interface CommandPaletteItem extends SearchableItem {
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	/** Dims the item and blocks selection. */
	disabled?: boolean
	/** Secondary text under the item. */
	description?: string
	/** Shortcut hint rendered at the trailing edge. */
	shortcut?: string
	/** Fires when the command is chosen. */
	onSelect?: () => void
}

/** Searchable commands. Desktop Enter activates the highlighted enabled item;
 * mobile Search submits the query and taps activate rows. Sources own ranking
 * and bootstrap entries. Closing invalidates pending work and resets the query.
 *
 * @example
 * ```tsx
 * import { CommandPalette } from '@octane-xplat/ui'
 *
 * <CommandPalette
 * 	open={open}
 * 	onOpenChange={setOpen}
 * 	items={[{ key: 'reload', label: 'Reload data', onSelect: reload, shortcut: '⌘R' }]}
 * />
 * ```
 * @see CommandPaletteItem, CommandPaletteMenuItem, SearchSource.
 */
export interface CommandPaletteProps<T extends CommandPaletteItem = CommandPaletteItem> {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Controlled visibility. Defaults to false. */
	open?: boolean
	/** Reports requested open-state changes. */
	onOpenChange?: (open: boolean) => void
	/** Static commands; ignored when searchSource is supplied. */
	items?: CommandPaletteMenuItem[]
	/** Sync/async results; bootstrap supplies empty-query entries. */
	searchSource?: SearchSource<T>
	/** Static matching only. Custom sources own their matching policy. */
	searchMode?: 'substring' | 'fuzzy'
	/** Text shown in the query field while empty. */
	placeholder?: string
	/** Accessible surface and input name. Defaults to Command palette. */
	label?: string
	/** Controlled query text. */
	value?: string
	/** Fires as the query changes. */
	onValueChange?: (value: string) => void
	/** Inner row content; selection/disabled semantics remain palette-owned. */
	renderItem?: (item: T, isSelected: boolean) => Renderable
	/** Text shown when the query matches nothing. */
	emptySearchText?: string
	/** Text shown before any query is typed. */
	emptyBootstrapText?: string
	/** Text shown while results load. */
	loadingText?: string
	/** Text shown when result loading fails. */
	errorText?: string
	/** Custom footer content; false hides it. Mobile has no default key hints. */
	footer?: Renderable
	/** Palette width — number is DIPs, string is a CSS length. */
	width?: number | string
	/** Maximum result-list height in DIPs. */
	maxHeight?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ---------- data display (Phase 4) ----------

// ---------- Table (Astryx contract — data-driven + plugin pipeline) ----------

/** Horizontal text alignment for a table column (header and body cells). */
export type TableColumnAlign = 'start' | 'center' | 'end'

/** Vertical alignment for table body row cells. @default 'middle' */
export type TableVerticalAlign = 'middle' | 'top' | 'bottom'

/** A proportional (fr-like) column width — created by `proportional()`. */
export interface ProportionalWidth {
	/** Width-unit discriminator — value is a flex proportion. */
	type: 'proportional'
	/** Proportion weight relative to siblings. */
	value: number
	/** Minimum width in pixels; defaults to `DEFAULT_MIN_COLUMN_WIDTH` (120). */
	minWidth?: number
}

/** A fixed pixel column width — created by `pixel()`. */
export interface PixelWidth {
	/** Width-unit discriminator — value is fixed pixels. */
	type: 'pixel'
	/** Fixed width in px. */
	value: number
}

/** Column width — either `proportional()` or `pixel()`. Omitting `width`
 *  distributes as `proportional(1)` but with no minimum-width floor. */
export type ColumnWidth = ProportionalWidth | PixelWidth

/** Sortable configuration for a column — `sortKey` decouples the sort
 *  identity from the column key (defaults to the column key). */
export interface TableSortableColumnConfig {
	/** Data key (or explicit key) sorted on; defaults to the column key. */
	sortKey?: string
}

/** Reference to a field in a shared `PowerSearchConfig`, resolved by
 *  `useTableFiltering` — a bare field key (uses `defaultOperator`) or
 *  `{ field, operator }` for an explicit operator. */
export interface TableFilterFieldRef {
	/** Field key the filter targets. */
	field: string
	/** Operator key applied to the field. */
	operator?: string
}

/** Column definition for data-driven table rendering (Astryx `TableColumn`).
 *  `key` is the row field the column reads by default; `renderCell` overrides
 *  cell content with a per-item renderer. `sortable`/`resizable`/`filter` are
 *  inert column metadata — the matching `useTable*` plugins act on them. */
export interface TableColumn<T extends Record<string, unknown> = Record<string, unknown>> {
	/** Data key bound to the column; also the default header/sort id. */
	key: string
	/** Header content; defaults to the column key. */
	header?: Renderable
	/** `proportional()` / `pixel()` width — see `resolveColumnWidths`. */
	width?: ColumnWidth
	/** Cell content alignment for the column. */
	align?: TableColumnAlign
	/** `true` sorts by the column key; `{ sortKey }` sorts by another key. */
	sortable?: boolean | TableSortableColumnConfig
	/** `false` locks the column against `useTableColumnResize`. @default true */
	resizable?: boolean
	/** Field ref (or bare field key) resolved by `useTableFiltering`. */
	filter?: TableFilterFieldRef | string
	/** Custom cell renderer — receives the row item. */
	renderCell?: (item: T) => Renderable
}

/** Row density controlling cell padding and font size. @default 'balanced' */
export type TableDensity = 'compact' | 'balanced' | 'spacious'

/** Divider style between cells. @default 'rows' */
export type TableDividers = 'rows' | 'columns' | 'grid' | 'none'

/** How default-rendered body cell text behaves when it exceeds column width.
 *  @default 'wrap' */
export type TableTextOverflow = 'wrap' | 'truncate'

/** Table — a styled, data-driven table (Astryx `Table`). Bounded and
 *  unvirtualized: large datasets belong to the platform list widgets.
 *
 *  Two modes: `data` + `columns` runs the plugin pipeline (selection,
 *  sortable, pagination, column settings/resize, filtering); `children`
 *  composes `TableHeader`/`TableBody`/`TableRow`/`TableCell` parts directly.
 *
 * @example
 * ```tsx
 * <Table
 * 	data={users}
 * 	columns={[
 * 		{ key: 'name', header: 'Name', width: proportional(1) },
 * 		{ key: 'age', header: 'Age', width: pixel(80), sortable: true },
 * 	]}
 * 	idKey="id"
 * 	hasHover
 * 	plugins={{ sort: sortPlugin }}
 * />
 * ```
 * @see TableColumn, TablePlugin, useTableSelectionState, useTableSortableState.
 */
export interface TableProps<T extends Record<string, unknown> = Record<string, unknown>> {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the table host through a standard Octane ref (`<table>` on
	 *  web). On native it reaches the wrapper only in children mode — the
	 *  data-mode wrapper's ref slot is consumed applying platform props. */
	ref?: Octane.Ref<object>
	/** Row data — rendered as body rows in data mode. */
	data?: T[]
	/** Column definitions; auto-generated from data keys when omitted. */
	columns?: TableColumn<T>[]
	/** Stable row key — a row field name or an extractor; defaults to index. */
	idKey?: (keyof T & string) | ((item: T) => string | number)
	/** Named plugins (`useTable*` hooks) keyed by behavior name. */
	plugins?: Record<string, import('./table/types').TablePlugin<T>>
	/** Row height/padding density. */
	density?: TableDensity
	/** Which grid lines are drawn. */
	dividers?: TableDividers
	/** Alternating row background. */
	isStriped?: boolean
	/** Highlights the row under the pointer. */
	hasHover?: boolean
	/** Vertical alignment of cell content. */
	verticalAlign?: TableVerticalAlign
	/** Overflow behavior for cell text (wrap/ellipsis). */
	textOverflow?: TableTextOverflow
	/** Content for the empty-data row; `false` disables it. Default renders a
	 *  compact "No data" `EmptyState`. */
	emptyState?: Renderable | false
	/** 1-based ARIA row index of the first body row; opts the table into
	 *  `aria-rowindex` (with `rowCount`, `aria-rowcount`). */
	rowIndexStart?: number
	/** Total body rows across all pages for `aria-rowcount`. */
	rowCount?: number
	/** Children mode — `TableHeader`/`TableBody`/`TableRow`/`TableCell`
	 *  composition; bypasses the data pipeline. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Props for `TableHeader` — the `<thead>` equivalent. */
export interface TableHeaderProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Props for `TableBody` — the `<tbody>` equivalent. */
export interface TableBodyProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Props for `TableFooter` — the `<tfoot>` equivalent. */
export interface TableFooterProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Props for `TableRow` — `<tr>` equivalent; reads density/striping from the
 *  enclosing `Table` context, `isHeaderRow` opts out of body-row styling. */
export interface TableRowProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Renders the row in the header section with header semantics. */
	isHeaderRow?: boolean
	/** Context-menu actions attached to the row. */
	contextMenuActions?: import('./table/types').TableContextActions
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	[key: string]: any
}

/** Props for `TableCell` — `<td>` equivalent. */
export interface TableCellProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Header scope for assistive technology (col/row/group). */
	scope?: 'col' | 'row' | 'colgroup' | 'rowgroup'
	/** Space-separated ids of header cells this cell is described by. */
	headers?: string
	/** Number of columns the cell spans. */
	colSpan?: number
	/** Number of rows the cell spans. */
	rowSpan?: number
	/** Context-menu actions attached to the cell. */
	contextMenuActions?: import('./table/types').TableContextActions
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	[key: string]: any
}

/** Props for `TableHeaderCell` — `<th>` equivalent. */
export interface TableHeaderCellProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Header scope for assistive technology. */
	scope?: 'col' | 'row' | 'colgroup' | 'rowgroup'
	/** Ids of higher headers this cell is described by. */
	headers?: string
	/** Number of columns the header spans. */
	colSpan?: number
	/** Number of rows the header spans. */
	rowSpan?: number
	/** Context-menu actions attached to the header cell. */
	contextMenuActions?: import('./table/types').TableContextActions
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	[key: string]: any
}

/** Props for `TableSelectionToolbar` — the selection-aware action surface
 *  rendered above a table; `selection` is the `TableSelectionState` returned
 *  by `useTableSelectionState`. */
export interface TableSelectionToolbarProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Selection state the toolbar summarizes. */
	selection: import('./table/types').TableSelectionState
	/** Accessible label for the toolbar. @default 'Bulk actions' */
	label?: string
	/** Override the selected-count content. */
	renderSelectionLabel?: (selectedCount: number) => Renderable
	/** Visible label for the clear-selection command. @default 'Unselect All' */
	clearLabel?: string
	/** Toolbar `startContent` slot (actions). */
	startContent?: Renderable
	/** Toolbar size variant. */
	size?: ToolbarSize
	/** Toolbar visual variant. */
	variant?: ToolbarVariant
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One `Timeline` entry — see `TimelineProps` for the shared content slots.
 */
export interface TimelineItem {
	/** Stable key identifying the entry. */
	key: string
	/** Entry title text. */
	title?: string
	/** Secondary text under the title. */
	description?: string
	/** Timestamp text shown for the entry. */
	time?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
}

/** Timeline — vertical list of events with dot + connector.
 *
 * @example
 * ```tsx
 * import { Timeline } from '@octane-xplat/ui'
 *
 * <Timeline items={[{ key: '1', title: 'Created', time: '9:00' }, { key: '2', title: 'Shipped', time: '14:30' }]} />
 * ```
 * @see TimelineItem.
 */
export interface TimelineProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Chronological entries rendered top to bottom. */
	items: TimelineItem[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One visual `TreeList` node — the rendered row descriptor, distinct from
 *  the `TreeNode` store wrapper `useTreeData` produces. Carry extra fields
 *  by extending it; `onAction`'s key and `useTreeData`'s `getItem` share
 *  the same `Key` identity. */
export interface TreeListNode {
	/** Stable key identifying the node. */
	key: Key
	/** Text shown for the node. */
	label?: string
	/** Nested child nodes. */
	children?: TreeListNode[]
	/** Makes the node unselectable (children stay expandable). */
	disabled?: boolean
	/** Leaf destination — the row renders as a link where the host supports
	 *  anchors (resolving `LinkProvider`/`as` on web); activation still
	 *  reports through `onAction` for non-anchor paths like keyboard
	 *  activation of the row itself. */
	href?: string
}

/** TreeList — recursive indent + collapse. Expansion is keyed and follows
 *  the shared state contract: `expandedKeys`/`onExpandedChange` for the
 *  controlled form, `defaultExpandedKeys` to seed the uncontrolled form.
 *  Leaf rows can hold a keyed selection under `selectionMode`, matching
 *  `GridList`; `onAction` fires on leaf activation either way.
 *
 * @example
 * ```tsx
 * import { TreeList } from '@octane-xplat/ui'
 *
 * <TreeList
 * 	nodes={[{ key: 'src', label: 'src', children: [{ key: 'app', label: 'app' }] }]}
 * 	expandedKeys={expanded}
 * 	onExpandedChange={setExpanded}
 * />
 * ```
 * @see TreeListNode, useTreeData for the store-backed form.
 */
export interface TreeProps<T extends TreeListNode = TreeListNode> {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Root nodes rendered by the tree. */
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
	/** Fires with the new selection key set. */
	onSelectionChange?: (keys: Selection) => void
	/** Fires when a leaf row is activated (click/Enter on web, tap on
	 *  native), independent of selection. */
	onAction?: (key: Key) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Alert — status callout. `tone` maps to a class modifier; error tone
 *  gets role=alert on web, others role=status.
 *
 * @example
 * ```tsx
 * import { Alert } from '@octane-xplat/ui'
 *
 * <Alert tone="warning" title="Trial ends soon">{upgradeLink}</Alert>
 * ```
 * @see BannerProps, EmptyProps.
 */
export interface AlertProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Severity tone — picks colors and default icon. */
	tone?: 'info' | 'success' | 'warning' | 'error'
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
	/** Heading text inside the alert. */
	title?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Card — container with optional header/footer slots, padding scale, and
 *  background variants. `variant` names map to `vx-card--{name}` class hooks:
 *  'default' (bordered), 'muted', 'transparent', and the tint set
 *  (blue/cyan/gray/green/orange/pink/purple/red/teal/yellow) ship in
 *  chrome.css; custom variant names still produce a class an app can skin.
 *
 * @example
 * ```tsx
 * import { Card, Text } from '@octane-xplat/ui'
 *
 * <Card header={<Text>Account</Text>} footer={actions} padding={4}>
 * 	{content}
 * </Card>
 * ```
 */
export interface CardProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered in the card header region. */
	header?: Renderable
	/** Content rendered in the card footer region. */
	footer?: Renderable
	/** Content rendered inside the element. */
	children?: Renderable
	/** Internal padding in 4px spacing steps. Omit it and the card takes the
	 *  theme's card padding (upstream `--astryx-card-padding`; 16px minus the
	 *  1px border with no theme), so passing a step overrides the theme rather
	 *  than restating the default. */
	padding?: number
	/** Visual variant of the card surface. */
	variant?: string
	/** Shadow depth level. */
	elevation?: Elevation
	/** Card width — number is DIPs, string is a CSS length. */
	width?: number | string
	/** Card height — number is DIPs, string is a CSS length. */
	height?: number | string
	/** Maximum card width. */
	maxWidth?: number | string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Chip — small action/filter element: pressable, optional selected state,
 *  optional ✕ remove affordance.
 *
 * @example
 * ```tsx
 * import { Chip } from '@octane-xplat/ui'
 *
 * <Chip selected={active} onSelect={toggle} onRemove={clear}>{tag}</Chip>
 * ```
 */
export interface ChipProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Controlled selected state. */
	selected?: boolean
	/** Dims the chip and blocks interaction. */
	disabled?: boolean
	/** Fires when the chip is activated. */
	onSelect?: () => void
	/** Shows a remove affordance and fires on its activation. */
	onRemove?: () => void
	/** Accessible name for the chip. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Kbd — keyboard key glyph (⌘K styling hook).
 *
 * @example
 * ```tsx
 * import { Kbd } from '@octane-xplat/ui'
 *
 * <Kbd>⌘K</Kbd>
 * ```
 */
export interface KbdProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Chord string like 'mod+k' — split on '+', each segment renders a key
	 *  cap; 'mod' resolves to the platform modifier glyph (Astryx `keys`). */
	keys?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Empty — empty-state block: icon + title + description + actions.
 *
 * @example
 * ```tsx
 * import { EmptyState, Button } from '@octane-xplat/ui'
 *
 * <EmptyState icon="xplat-doc-image" title="No results" description="Try a different query">
 * 	<Button label="Clear filters" clickAction={clear} />
 * </EmptyState>
 * ```
 */
export interface EmptyProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Registered icon name (see `registerIcon`) or an icon element. */
	icon?: IconName | Renderable
	/** Primary empty-state message. */
	title?: string
	/** Secondary guidance text. */
	description?: string
	/** Action row rendered below the description (Astryx `actions`). */
	actions?: Renderable
	/** Tighter vertical rhythm (Astryx `isCompact`). */
	isCompact?: boolean
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Banner — inline notice strip with optional dismiss.
 *
 * @example
 * ```tsx
 * import { Banner } from '@octane-xplat/ui'
 *
 * <Banner icon="xplat-warning" onDismiss={dismiss}>Offline — changes will sync later.</Banner>
 * ```
 * @see AlertProps.
 */
/** Banner status tones (Astryx `status`). */
export type BannerStatus = 'info' | 'success' | 'warning' | 'error'

export interface BannerProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Status tone — paints the strip and picks the default glyph (Astryx). */
	status?: BannerStatus
	/** Headline text (Astryx `title`). */
	title?: Renderable
	/** Supporting text under the title (Astryx `description`). */
	description?: Renderable
	/** Registered icon name (see `registerIcon`) or icon element. */
	icon?: IconName | Renderable
	/** Trailing header content — typically action buttons (Astryx `endContent`). */
	endContent?: Renderable
	/** Show the dismiss affordance (Astryx `isDismissable`). */
	isDismissable?: boolean
	/** Detached floating presentation (Astryx `variant="floating"`). */
	variant?: 'inline' | 'floating'
	/** Resting shadow (Astryx `elevation`). */
	elevation?: Elevation
	/** Section-chrome container (Astryx `container="section"`). */
	container?: 'banner' | 'section'
	/** Body content collapse behavior (Astryx): true/{defaultIsOpen} wraps
	 *  children behind a toggle; false keeps them always visible. */
	collapsible?: boolean | { /** Initial visibility for uncontrolled usage. */ defaultIsOpen?: boolean }
	/** Content rendered inside the element. */
	children?: Renderable
	/** Shows a dismiss affordance and fires on its activation. */
	onDismiss?: () => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** User — avatar + name/description row.
 *
 * @example
 * ```tsx
 * import { User } from '@octane-xplat/ui'
 *
 * <User name={user.name} description={user.role} src={user.photo} onSelect={openProfile} />
 * ```
 * @see AvatarProps.
 */
export interface UserProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Display name. */
	name?: string
	/** Secondary line (role, email, …). */
	description?: string
	/** Avatar image URL. */
	src?: string
	/** Initials/text shown when no image is available. */
	fallback?: string
	/** Avatar size in DIPs. */
	size?: number
	/** Activation callback — makes the row pressable. */
	onSelect?: () => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** ProgressGroup — stacked labeled Meter rows.
 *
 * @example
 * ```tsx
 * import { ProgressGroup } from '@octane-xplat/ui'
 *
 * <ProgressGroup items={[{ key: 'cpu', label: 'CPU', value: 40 }, { key: 'mem', label: 'Memory', value: 72 }]} />
 * ```
 * @see MeterProps, ProgressBarProps.
 */
export interface ProgressGroupProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Progress entries rendered as labeled bars. */
	items: { /** Stable key for the entry. */ key: string; /** Text shown beside the bar. */ label?: string; /** Current progress value. */ value: number; /** Value that fills the bar (default 100). */ max?: number }[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ---------- chat ----------

/** Who sent a chat message — drives alignment, bubble styling, and metadata
 *  direction. 'system' messages center and skip the avatar/name affordances. */
export type ChatMessageSender = 'user' | 'assistant' | 'system'

/** Data-side description of a chat message. Presentation components accept
 *  the same fields as props; this type lets agents store/transmit messages
 *  without coupling to rendering.
 *
 * @see ChatMessageListProps.messages — the data-driven form.
 */
export interface ChatMessageData {
	/** Stable unique identity for history anchoring. Omitted ids use object identity. */
	id?: string
	/** Who sent the message — drives alignment and styling. */
	sender: ChatMessageSender
	/** Message body content. */
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

/** Visual density shared across the chat family.
 *
 * @see ChatMessageListProps.density.
 */
export type ChatDensity = 'compact' | 'balanced' | 'spacious'

/** ChatComposer accepts the same density scale; kept as its own alias so the
 *  public name matches upstream.
 *
 * @see ChatDensity.
 */
export type ChatComposerDensity = ChatDensity

/** Delivery state shown by ChatMessageMetadata.
 *
 * @see ChatMessageMetadataProps.status.
 */
export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error'

/** Sender context wrapper for one message. Renders the optional avatar, name,
 *  children (usually ChatMessageBubble), and trailing metadata column.
 *
 * @example
 * ```tsx
 * import { ChatMessage, ChatMessageBubble, ChatMessageMetadata } from '@octane-xplat/ui'
 *
 * <ChatMessage sender="user">
 * 	<ChatMessageBubble name="Alec" metadata={<ChatMessageMetadata timestamp="9:41" />}>
 * 		{body}
 * 	</ChatMessageBubble>
 * </ChatMessage>
 * ```
 * @see ChatMessageBubbleProps, ChatMessageListProps.
 */
export interface ChatMessageProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Who sent the message — drives alignment and styling. */
	sender: ChatMessageSender
	/** Content rendered inside the element. */
	children?: Renderable
	/** Avatar content beside the message. */
	avatar?: Renderable
	/** Sender name above the body — prefer the bubble's `name` when the first
	 *  child is a ChatMessageBubble. */
	name?: Renderable
	/** Footer content below the body — prefer the bubble's `metadata` when the
	 *  last child is a ChatMessageBubble. */
	metadata?: Renderable
	/** Defaults to the enclosing ChatMessageList density, then 'balanced'. */
	density?: ChatDensity
	/** Accessible name for the message group. */
	accessibilityLabel?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Bubble chrome — `'filled'` (tinted surface) or `'ghost'` (flat).
 */
export type ChatMessageBubbleVariant = 'filled' | 'ghost'

/** Styled content container — the chat bubble. Reads sender/density from the
 *  enclosing ChatMessage. `group` tightens sender-side corners for
 *  consecutive bubbles; `width` replaces the default max-width cap. */
export interface ChatMessageBubbleProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Bubble style variant (filled/outline/etc.). */
	variant?: ChatMessageBubbleVariant
	/** Sender name row above the bubble, aligned to its text column. */
	name?: Renderable
	/** Metadata row below the bubble, aligned to its text column. */
	metadata?: Renderable
	/** Position within a same-sender run — shapes the bubble corners. */
	group?: 'first' | 'middle' | 'last'
	/** Bubble width — number (px/dip) or CSS string ('100%'). Replaces the
	 *  default max-width cap when set. */
	width?: number | string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Composable metadata row: timestamp · footer · status. Renders nothing
 *  when all three are absent. */
export interface ChatMessageMetadataProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Timestamp content under the message. */
	timestamp?: Renderable
	/** Extra footer content under the message. */
	footer?: Renderable
	/** Delivery status rendered with the metadata. */
	status?: ChatMessageStatus
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** System-message presentation — see `ChatSystemMessageProps`.
 */
export type ChatSystemMessageVariant = 'default' | 'divider'

/** Centered system/notice row — date separators, "conversation started".
 *  `divider` draws hairlines on both sides of the text. */
export interface ChatSystemMessageProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** System-message style variant. */
	variant?: ChatSystemMessageVariant
	/** Icon shown with the system message. */
	icon?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Presentational message container. Density flows to children via context;
 *  `align:'bottom'` pads short lists so messages sit above the composer;
 *  `scrollToTopAction` loads older messages (spinner row while pending);
 *  `isStreaming` marks the region busy for assistive tech. Auto-scroll and
 *  the scroll-to-bottom button are owned by ChatLayout or useChatStreamScroll.
 *
 *  Supply either `children` for full JSX control or `messages` + `renderMessage`
 *  for a data-driven list.
 *
 * @example
 * ```tsx
 * import { ChatMessageList, EmptyState } from '@octane-xplat/ui'
 *
 * <ChatMessageList
 * 	messages={messages}
 * 	scrollToTopAction={loadOlder}
 * 	emptyState={<EmptyState title="No messages" />}
 * />
 * ```
 * @see ChatMessageProps, ChatLayoutProps — the layout owns auto-scroll.
 */
export interface ChatMessageListProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Content rendered when there are no messages. */
	emptyState?: Renderable
	/** Called when the user scrolls to the top — load older messages. Calls are
	 *  serialized while a returned promise is pending. */
	scrollToTopAction?: () => void | Promise<void>
	/** Message spacing density. */
	density?: ChatDensity
	/** Gap between top-level message rows (px on web, dip on native).
	 *  Defaults to the density's gap. */
	gap?: number
	/** `bottom` pins content to the viewport end (chat convention); `top` flows normally. */
	align?: 'top' | 'bottom'
	/** Marks the list busy for assistive tech while a response streams. */
	isStreaming?: boolean
	/** Data-driven messages — provide either this or `children`. */
	messages?: ChatMessageData[]
	/** Render a data-driven message; defaults to ChatMessage + ChatMessageBubble. */
	renderMessage?: (message: ChatMessageData) => Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Lifecycle of a tool-call row — `'pending' | 'running' | 'complete' | 'error'`; gates which fields render (`duration` on complete, `errorMessage` on error). An omitted status reads as `'complete'`.
 */
export type ChatToolCallStatus = 'pending' | 'running' | 'complete' | 'error'

interface ChatToolCallItemBase {
	/** Tool or action name. */
	name: string
	/** What the tool acted on (file, query, …). */
	target?: string
	/** Short qualifier rendered as a chip next to the name (e.g. file part). */
	node?: string
	/** Added-line count for edit-style calls. */
	additions?: number
	/** Removed-line count for edit-style calls. */
	deletions?: number
	/** Custom stats content replacing/augmenting additions+deletions. */
	stats?: Renderable
	/** Stable key identifying the call. */
	key?: string
	/** Raw payload the call produced, passed through to renderers. */
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
				/** Completion discriminator for the call. */
				status?: 'complete'
				/** Display-formatted run time (e.g. `'1.2s'`) shown on the row. */
				duration?: string
				/** Unused on completed calls — `status` discriminates. */
				errorMessage?: never
		  }
		| { /** Completion discriminator for the call. */ status: 'pending' | 'running'; /** Unused on failed calls — `status` discriminates. */ duration?: never; /** Unused while in flight — `status` discriminates. */ errorMessage?: never }
		| {
				/** Error discriminator for the call. */
				status: 'error'
				/** Unused on failed calls — `status` discriminates. */
				duration?: never
				/** Failure detail — announced as the row's accessible name. */
				errorMessage?: string
		  }
	)

/** Tool-call list — one call renders inline; several collapse behind a
 *  summary header showing the latest call and the count.
 *
 * @example
 * ```tsx
 * import { ChatToolCalls } from '@octane-xplat/ui'
 *
 * <ChatToolCalls calls={[{ name: 'read', status: 'complete', duration: '0.3s' }]} />
 * ```
 * @see ChatToolCallItem — `status` gates which fields render.
 */
export interface ChatToolCallsProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Tool calls rendered in the collapsible list. */
	calls: ChatToolCallItem[]
	/** Expanded-state summary label (defaults to "N tool calls"). */
	label?: string
	/** Controlled expanded state. */
	isExpanded?: boolean
	/** Initial expanded state for uncontrolled usage. */
	defaultIsExpanded?: boolean
	/** Reports expanded-state changes. */
	onExpandedChange?: (isExpanded: boolean) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// --- composer ---

/** Composer status line shown under the field — `{ type: 'error' | 'warning', message? }`.
 */
export type ChatComposerStatus = { /** Severity of the status line. */ type: 'error' | 'warning'; /** Status text shown. */ message?: string }

/** Portable key event for the composer input — the seam for app-specific key
 *  handling. `native` carries the platform event (KeyboardEvent on web).
 *
 * @see ChatComposerInputProps.onKeyDown.
 */
export interface ChatComposerKeyEvent {
	/** DOM `key` value for the pressed key. */
	key: string
	/** Whether Shift was held. */
	shiftKey: boolean
	/** Whether Ctrl was held. */
	ctrlKey: boolean
	/** Whether Cmd/⌘ was held. */
	metaKey: boolean
	/** Whether Alt/⌥ was held. */
	altKey: boolean
	/** True while an IME composition is active — Enter never submits. */
	isComposing: boolean
	/** Set when the default key behavior was consumed. */
	defaultPrevented: boolean
	/** Consumes the key — prevents the composer's default handling. */
	preventDefault(): void
	/** The underlying platform event object. */
	native?: unknown
}

/** A pasted/dropped file. On web `native` is the browser `File`; native
 *  paste/drop file delivery is platform-dependent and may never fire —
 *  treat this as web-real, native-best-effort.
 *
 * @see ChatComposerInputProps paste/drop seams.
 */
export interface ChatComposerFile {
	/** File name shown in the attachment chip. */
	name: string
	/** MIME type ('' when unknown). */
	type: string
	/** File size in bytes. */
	size: number
	/** The underlying platform file/blob object. */
	native?: unknown
}

/** Portable paste event handed to ChatComposerInput.onPaste.
 *
 * @see ChatComposerInputProps.onPaste, useChatPasteAsToken.
 */
export interface ChatComposerPasteEvent {
	/** Consumes the paste — prevents default insertion. */
	preventDefault(): void
	/** The platform event (ClipboardEvent on web; undefined on native). */
	native?: unknown
}

/** Tone palette for a `ChatComposerTokenBadge` chip — 'neutral' plus the status and hue names.
 */
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
 *  serializes into the submitted string.
 *
 * @see ChatComposerToken, serializeChatComposerToken.
 */
export interface ChatComposerTokenBadge {
	/** Token value committed to the draft. */
	value: string
	/** Badge content shown inside the token. */
	label?: Renderable
	/** Badge color variant. */
	variant?: ChatComposerTokenVariant
	/** Registered icon name (see registerIcon). */
	icon?: IconName
}

/** Custom-rendered token — full control over the chip's content.
 *
 * @see ChatComposerToken — `render` does not serialize; persist the `ChatComposerTokenCustomData` half.
 */
export interface ChatComposerTokenCustom {
	/** Token value committed to the draft. */
	value: string
	/** Custom renderer for the token chip. */
	render: () => Renderable
}

/** A token (mention, pasted blob, command argument) embedded in the
 *  composer value. Web renders it as a non-editable inline chip inside the
 *  field; native keeps tokens in a chip row above the field and serializes
 *  them at their recorded insertion offset.
 *
 * @see ChatComposerTokenBadge, ChatComposerTokenCustom, ChatComposerTokenData for the serializable form.
 */
export type ChatComposerToken = ChatComposerTokenBadge | ChatComposerTokenCustom

/** Serializable representation of a token that can cross storage boundaries.
 *  `render` is omitted because functions cannot be serialized; restore it via
 *  `deserializeChatComposerToken` with a renderer lookup. */
export interface ChatComposerTokenBadgeData {
	/** Badge-token discriminator. */
	kind: 'badge'
	/** Token value committed to the draft. */
	value: string
	/** Badge text inside the token. */
	label?: string
	/** Badge color variant. */
	variant?: ChatComposerTokenVariant
	/** Icon shown inside the badge. */
	icon?: IconName
}

/** Serializable form of a custom composer token — `kind: 'custom'` plus the serialized `value`; its render function is restored on load via `deserializeChatComposerToken`.
 */
export interface ChatComposerTokenCustomData {
	/** Custom-token discriminator. */
	kind: 'custom'
	/** Token value committed to the draft. */
	value: string
}

/** Serializable token union (`badge` | `custom`) — the `tokens` half of `ChatComposerDraftData`.
 */
export type ChatComposerTokenData = ChatComposerTokenBadgeData | ChatComposerTokenCustomData

/** Serializable composer draft — text plus the token table needed to render
 *  and re-edit it.
 *
 * @see serializeChatComposerDraft / deserializeChatComposerDraft for the JSON-safe form.
 */
export interface ChatComposerDraft {
	/** Plain-text content of the draft. */
	text: string
	/** Structured tokens interleaved in the draft. */
	tokens: ChatComposerToken[]
}

/** A draft that has been reduced to plain JSON. `tokens` carry only the data
 *  half of each token; render functions are recovered on load.
 *
 * @see serializeChatComposerDraft / deserializeChatComposerDraft.
 */
export interface ChatComposerDraftData {
	/** Plain-text content of the draft. */
	text: string
	/** Serializable token data interleaved in the draft. */
	tokens: ChatComposerTokenData[]
}

/** Item shape for trigger-menu sources — the portable SearchableItem.
 *
 * @see SearchableItem — same shape; used by composer trigger sources.
 */
export interface ChatComposerTriggerItem<TAuxData = unknown> {
	/** Stable identity for the trigger item. */
	id: string
	/** Text shown in the trigger menu. */
	label: string
	/** Pre-rendered item content — takes priority over renderItem/label. */
	element?: Renderable
	/** Caller data carried through to `renderItem`. */
	auxiliaryData?: TAuxData
}

/** Sync or async item source for a trigger menu — the portable SearchSource.
 *  `search`/`bootstrap` receive a `SearchRequest` whose `signal` aborts
 *  superseded calls; sharing one source across triggers or composers never
 *  cancels a sibling's in-flight request. */
export interface ChatComposerSearchSource<
	T extends ChatComposerTriggerItem = ChatComposerTriggerItem,
> {
	/** Resolves trigger items for a query — sync or async. */
	search(query: string, request?: SearchRequest): Promise<T[]> | T[]
	/** Items shown before any query — optional. */
	bootstrap?(request?: SearchRequest): Promise<T[]> | T[]
}

/** One trigger (`@`, `/`, …) activating an autocomplete menu in the input. */
export interface ChatComposerTrigger {
	/** Character that activates the menu (e.g. '@', '/'). */
	character: string
	/** Provider supplying trigger items for the menu. */
	searchSource: ChatComposerSearchSource
	/** Renders one trigger-menu row. */
	renderItem?: (item: ChatComposerTriggerItem) => Renderable
	/** What to insert on selection — plain text or a token chip. */
	onSelect: (item: ChatComposerTriggerItem) => string | ChatComposerToken
	/** Parse a serialized token back when loading a draft for editing. */
	deserialize?: (value: string) => ChatComposerToken | null
	/** Text shown when the trigger query matches nothing. */
	emptySearchResultsText?: string
	/** Text shown while trigger items load. */
	loadingText?: string
	/** Accessible label for the trigger menu. */
	menuLabel?: string
}

/** Imperative surface the composer shell and app code invoke on the input.
 *  Delivered through the input's `ref` prop. */
export interface ChatComposerInputHandle {
	/** Insert a token chip at the current caret position; returns its id. */
	insertToken(token: ChatComposerToken): string | undefined
	/** Replace the token chip with its serialized text value. */
	expandToken(id: string): void
	/** Inserts text at the caret. */
	insertText(text: string): void
	/** Moves focus into the composer input. */
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
	/** Moves focus into the composer input. */
	focus(): void
}

/** Composer context read via `useChatComposerContext` inside `ChatComposer` slots — `value`/`draft`, `onChange`/`onDraftChange`, `onSend`, `placeholder`, `isDisabled`, `isStopShown`, `canSend`, cancel. `onSubmit` is the deprecated `onSend` alias.
 */
export interface ChatComposerContextValue {
	/** Current plain-text value. */
	value: string
	/** Current structured draft (text + tokens). */
	draft: ChatComposerDraft
	/** Commits a new plain-text value. */
	onChange: (value: string) => void
	/** Commits a new structured draft. */
	onDraftChange: (draft: ChatComposerDraft) => void
	/** Send the current draft. */
	onSend: (value: string) => void
	/** @deprecated Use onSend. */
	onSubmit: (value: string) => void
	/** Text shown while the input is empty. */
	placeholder: string
	/** Disables editing and send affordances. */
	isDisabled: boolean
	/** Shows the stop button instead of send (streaming). */
	isStopShown: boolean
	/** Whether the current draft is sendable. */
	canSend: boolean
	/** Cancel/stop action. */
	onCancel?: () => void
	/** @deprecated Use onCancel. */
	onStop?: () => void
	/** Handle for focusing/controlling the inner input. */
	inputControlRef?: { /** Live input-control slot; null before mount. */ current: ChatComposerInputControl | null }
}

/** Rich composer field. Web is a real contenteditable with inline token
 *  chips, Enter-to-submit (IME-guarded), submitted-message recall on ArrowUp/Down,
 *  paste interception, and file drop. Native is a TextView plus a chip row
 *  for inserted tokens; serialization matches, mid-text token positions are
 *  approximated by recorded insertion offsets. */
export interface ChatComposerInputProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Exposes the imperative handle through a standard Octane ref. */
	ref?: Octane.Ref<ChatComposerInputHandle>
	/** Serialized string value (legacy) — use draft props instead. */
	value?: string
	/** Fires as the plain-text value changes. */
	onChange?: (value: string) => void
	/** Structured draft value. */
	draft?: ChatComposerDraft
	/** Initial draft for uncontrolled usage. */
	defaultDraft?: ChatComposerDraft
	/** Fires with the structured draft on each edit. */
	onDraftChange?: (draft: ChatComposerDraft) => void
	/** Text shown while the input is empty. */
	placeholder?: string
	/** Height cap in lines before the field scrolls internally. */
	maxRows?: number
	/** Trigger definitions (@-mention, /-command, …). */
	triggers?: ChatComposerTrigger[]
	/** Debounce in ms applied to change callbacks. */
	debounceMs?: number
	/** ArrowUp/ArrowDown recall of submitted messages — keyboard platforms. */
	hasHistory?: boolean
	/** Accessible name for the field. */
	label?: string
	/** Disables editing. */
	isDisabled?: boolean
	/** Plain-text paste interception — return true to take over insertion. */
	onPaste?: (event: ChatComposerPasteEvent, text: string) => boolean | void
	/** Long-paste → token conversion; pass a useChatPasteAsToken result to
	 *  customize, false to disable. Web only — native has no paste event. */
	pasteAsToken?: { /** Paste interceptor — return false to take over insertion (e.g. tokenize). */ onPaste: (event: ChatComposerPasteEvent, text: string) => boolean } | false
	/** File drop/paste (web only — see ChatComposerFile). */
	onFiles?: (files: ChatComposerFile[]) => void
	/** Send action — called with the serialized draft text. */
	onSend?: (value: string) => void
	/** @deprecated Use onSend. */
	onSubmit?: (value: string) => void
	/** Runs before built-in Enter/recall handling; preventDefault() to own
	 *  the keystroke. IME composition always suppresses submit. */
	onKeyDown?: (event: ChatComposerKeyEvent) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Props for `ChatComposerTokenElement` — renders one `ChatComposerToken` chip (`token` is required).
 */
export interface ChatComposerTokenElementProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** The token this element renders. */
	token: ChatComposerToken
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Collapsible drawer above the composer input — attachments/context chips.
 *  With `count`, a collapse toggle renders the badge+label summary. */
export interface ChatComposerDrawerProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Badge count shown on the drawer toggle. */
	count?: number
	/** Drawer heading text. */
	label?: string
	/** Content previewed while the drawer is collapsed. */
	collapsedSummary?: Renderable
	/** Controlled collapsed state. */
	isCollapsed?: boolean
	/** Initial collapsed state for uncontrolled usage. */
	defaultIsCollapsed?: boolean
	/** Reports collapsed-state changes. */
	onCollapsedChange?: (isCollapsed: boolean) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Circular send/stop toggle. Reads ChatComposerContext by default; every
 *  context-derived value is prop-overridable for standalone use. */
export interface ChatSendButtonProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Shows the stop affordance instead of send. */
	isStopShown?: boolean
	/** Disables the button. */
	isDisabled?: boolean
	/** Fires on send activation. */
	onSend?: () => void
	/** @deprecated Use onCancel. */
	onStop?: () => void
	/** Fires on stop activation (when isStopShown). */
	onCancel?: () => void
	/** Custom send-state icon content (default: registered arrow-up glyph). */
	sendIcon?: Renderable
	/** Custom stop affordance content. */
	stopIcon?: Renderable
	/** Button size. */
	size?: 'sm' | 'md'
	/** Composes after the send/stop action. */
	onPress?: () => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Composer layout shell — slots for drawer, header actions/context, input,
 *  footer actions, send actions/button, and an error/warning status strip.
 *
 *  State: provide either the legacy `value`/`onChange` string props or the
 *  structured `draft`/`onDraftChange` props. Actions: use `onSend` to submit
 *  and `onCancel` to stop; `onSubmit`/`onStop` remain as migration aliases.
 *
 * @example
 * ```tsx
 * import { ChatComposer } from '@octane-xplat/ui'
 *
 * <ChatComposer value={draft} onChange={setDraft} onSend={send} placeholder="Message…" />
 * ```
 * @see ChatComposerProps slots and useChatComposerContext.
 */
export interface ChatComposerProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Send action — called with the serialized draft text. */
	onSend?: (value: string) => void
	/** @deprecated Use onSend. */
	onSubmit?: (value: string) => void
	/** Cancel/stop action. */
	onCancel?: () => void
	/** @deprecated Use onCancel. */
	onStop?: () => void
	/** Shows the stop affordance instead of send. */
	isStopShown?: boolean
	/** Serialized string value (legacy) — use draft props instead. */
	value?: string
	/** Fires as the plain-text value changes. */
	onChange?: (value: string) => void
	/** Structured draft value. */
	draft?: ChatComposerDraft
	/** Initial draft for uncontrolled usage. */
	defaultDraft?: ChatComposerDraft
	/** Fires with the structured draft on each edit. */
	onDraftChange?: (draft: ChatComposerDraft) => void
	/** Text shown while the input is empty. */
	placeholder?: string
	/** Disables editing and send affordances. */
	isDisabled?: boolean
	/** Composer spacing density. */
	density?: ChatComposerDensity
	/** 'low' (default) is the raised surface; 'none' is flat with a border. */
	elevation?: 'none' | 'low'
	/** Collapsible drawer content (attachments, previews). */
	drawer?: Renderable
	/** Action buttons in the composer header. */
	headerActions?: Renderable
	/** Context content in the composer header. */
	headerContext?: Renderable
	/** Custom input element — replaces the default ChatComposerInput. */
	input?: Renderable
	/** Action buttons in the composer footer. */
	footerActions?: Renderable
	/** Content beside the send button. */
	sendActions?: Renderable
	/** Custom send-button content — overrides the default. */
	sendButton?: Renderable
	/** Status line rendered with the composer. */
	status?: ChatComposerStatus
	/** Whether the status sits above or below the input. */
	statusPosition?: 'top' | 'bottom'
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Renders serialized message text with token values replaced by their
 *  chips — share one token table between input and display. */
export interface ChatTokenizedTextProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Raw text containing token markup. */
	children?: string
	/** Tokens resolved against the text. */
	tokens?: ChatComposerToken[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// --- chat layout & scrolling ---

/** Page-style chat shell: messages in a scroll area, composer docked at the
 *  bottom behind a blur strip, scroll-to-bottom button above it. Without
 *  `scrollRef` the layout root is the scroller (sticky dock); with an
 *  external scroll container ref the dock floats fixed above the page and
 *  the scroll hooks target that container. On iOS/Android the dock overlays
 *  the layout bottom. macOS keeps the dock in flow beneath a flexing viewport.
 *  Native targets have no backdrop blur; `scrollRef` is populated with the
 *  layout's own scroll viewport so callers can hand it to the hooks. */
export interface ChatLayoutProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Composer element docked at the bottom — typically ChatComposer. */
	composer?: Renderable
	/** Content rendered when the chat has no messages. */
	emptyState?: Renderable
	/** Custom scroll-to-bottom control, or null to hide. Defaults to
	 *  ChatLayoutScrollButton wired to the layout's scroll state. */
	scrollButton?: Renderable
	/** External scroll container — { current: HTMLElement | NSView }. */
	scrollRef?: { /** Live slot for the host element; unset until bound. */ current?: HostElement | null }
	/** Chat spacing density. */
	density?: ChatDensity
	/** Keep the viewport following new content (default true). */
	followLatest?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Follow keyboard movement always, only from the conversation end, or never.
	 * This controls scrolling; the composer still avoids the keyboard. Web and
	 * desktop keep neutral software-keyboard behavior. @default 'when-at-end' */
	keyboardFollow?: 'never' | 'always' | 'when-at-end'
	/** Height of a custom panel already rendered inside composer. Match the panel's
	 * actual height in device-independent layout units so keyboard/panel space
	 * is counted once. Must be finite and nonnegative. @default 0 */
	bottomPanelHeight?: number
}

/** The floating 'scroll to bottom' pill rendered by `ChatLayout` — `isVisible` toggles it, `label` expands it, `onPress` scrolls.
 */
export interface ChatLayoutScrollButtonProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Toggles the scroll-to-latest button. */
	isVisible: boolean
	/** Optional pill label (e.g. "New messages") — expands the button. */
	label?: string
	/** Fires when the button is activated. */
	onPress?: () => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Options for `scrollToBottom` — `behavior: 'instant'` jumps in one frame; `'spring'` (default) animates (web spring, NS animated scroll; reduced-motion web jumps instantly).
 */
export interface ChatScrollToBottomOptions {
	/** 'instant' jumps in one frame (open/restore); default 'spring' animates
	 *  (web spring, NS animated scroll). Reduced-motion web jumps instantly. */
	behavior?: 'instant' | 'spring'
}

/** Owns a scroll container's follow-the-stream behavior. `scrollRef` points
 *  at the DOM scroller on web or the bound NS ScrollView on native.
 *
 * @see UseChatStreamScrollReturn — the hook owns ChatLayout's follow-the-stream behavior.
 */
export interface UseChatStreamScrollOptions {
	/** Scroll viewport the hook drives. */
	scrollRef: { /** Live slot for the host element; unset until bound. */ current?: HostElement | null }
	/** Toggles stream-following behavior. */
	enabled?: boolean
	/** Keep the viewport following new content (default true). */
	followLatest?: boolean
	/** Distance from bottom within which scroll-end re-locks (default 10). */
	lockThreshold?: number
	/** Distance from bottom beyond which the button shows (default 100). */
	buttonThreshold?: number
	/** Web spring parameters; native scroll uses the OS animation. */
	damping?: number
	/** Spring stiffness for follow scrolling. */
	stiffness?: number
	/** Spring mass for follow scrolling. */
	mass?: number
}

/** `useChatStreamScroll` result — `isScrolledUp`/`isLocked` state, `scrollToBottom`/`scrollToMessage`/`scrollToLastMessage` seeks, `lock`/`unlock` follow control, and `scrollIfLocked` to call on content growth.
 */
export interface UseChatStreamScrollReturn {
	/** Whether the viewport is away from the latest content. */
	isScrolledUp: boolean
	/** Whether scroll is locked to the latest content (follows streaming). */
	isLocked: boolean
	/** Scrolls to the latest content. */
	scrollToBottom(options?: ChatScrollToBottomOptions): void
	/** Scroll so the given message element/view tops the visible area. */
	scrollToMessage(el: HostElement): void
	/** Locks scroll-following regardless of position. */
	lock(): void
	/** Releases the scroll lock. */
	unlock(): void
	/** Follow growth only while locked — call on content resize. */
	scrollIfLocked(): void
	/** Scrolls the latest message into view. */
	scrollToLastMessage(): void
}

/** Options for `useChatNewMessages` — `isLocked` (locked scroll means new arrivals don't flag) and `onResize` fired on content height changes.
 */
export interface UseChatNewMessagesOptions {
	/** Optional containing viewport: preserve retained message rows during prepend. */
	scrollRef?: { /** Live slot for the host element; unset until bound. */ current?: HostElement | null }
	/** When the scroll is locked, new arrivals don't flag — the user is
	 *  already at the bottom. */
	isLocked: boolean
	/** Fires on every content height change (new message, streaming growth). */
	onResize?: () => void
}

/** `useChatNewMessages` result — `hasNewMessages` flag, `dismiss()`, and `contentRef` to attach to the message-list content element (ResizeObserver on web, layoutChanged on native).
 */
export interface UseChatNewMessagesReturn {
	/** Whether unseen messages arrived while scrolled up. */
	hasNewMessages: boolean
	/** Dismisses the new-messages indicator. */
	dismiss(): void
	/** Attach to the message-list content element — ResizeObserver on web,
	 *  layoutChanged on native. */
	contentRef(el: HostElement): void
}

/** Converts long pastes into token chips. `inputRef` carries the input
 *  handle (the object `ref` delivered). */
export interface UseChatPasteAsTokenOptions {
	/** Composer input handle the paste hook drives. */
	inputRef: { /** Live input-handle slot; null before mount. */ current: ChatComposerInputHandle | null }
	/** Character threshold — pastes longer than this become tokens (200). */
	threshold?: number
	/** Converts pasted text into a token. */
	toToken?: (text: string) => ChatComposerToken
}

/** `useChatPasteAsToken` result — `onPaste(event, text)` to wire into `ChatComposerInput`'s paste seam; returns true when the paste became a token.
 */
export interface UseChatPasteAsTokenReturn {
	/** Wire as ChatComposerInput's pasteAsToken/onPaste — true means the
	 *  paste became a token. */
	onPaste(event: ChatComposerPasteEvent, text: string): boolean
}

/** Token bookkeeping inside a composer input. `editableRef` is the editable
 *  div on web; on native it's the host object the native input installs.
 *
 * @see UseChatComposerTokensReturn.
 */
export interface UseChatComposerTokensOptions {
	/** Editable element whose tokens are tracked. */
	editableRef: { /** Live slot for the host element; unset until bound. */ current?: HostElement | null }
	/** Fires when the emitted token set changes. */
	onEmitChange(): void
}

/** One mounted token chip inside a composer input — `id`, the `span` host the web portal renders into, and the `token` data.
 */
export interface TokenPortal {
	/** Stable id for the token portal. */
	id: string
	/** The non-editable span web portals render into (DOM element). */
	span: HostElement
	/** Token rendered through the portal. */
	token: ChatComposerToken
}

/** `useChatComposerTokens` result — `tokenPortals` to render, `insertToken`/`expandToken` editing ops, `handleKeyDown`/`handlePaste` interception (web events), `cleanupPortals`.
 */
export interface UseChatComposerTokensReturn {
	/** Portals to mount for rendered tokens. */
	tokenPortals: TokenPortal[]
	/** Expands a collapsed token by id. */
	expandToken(id: string): void
	/** Inserts a token at the caret; returns its portal id. */
	insertToken(token: ChatComposerToken): string | undefined
	/** Backspace-near-token interception (web KeyboardEvent). */
	handleKeyDown(e: unknown): boolean
	/** Paste-near-token interception (web ClipboardEvent). */
	handlePaste(e: unknown): boolean
	/** Removes portals for deleted tokens. */
	cleanupPortals(): void
}

// --- dictation (web SpeechRecognition; unsupported on native — isSupported:false) ---

/** Options for `useSpeechRecognition` — `lang`, `continuous`, `interimResults`, `transformTranscript`, and transcript/start/end/error callbacks. Web SpeechRecognition only — native reports `isSupported: false` and never starts.
 */
export interface UseSpeechRecognitionOptions {
	/** BCP-47 language tag for recognition. */
	lang?: string
	/** Keeps listening across utterances instead of stopping at the first result. */
	continuous?: boolean
	/** Delivers interim hypotheses via `onTranscript`, not just finals. */
	interimResults?: boolean
	/** Optional shared AudioContext used for metering. */
	audioContext?: unknown
	/** Post-processor applied to each transcript before callbacks. */
	transformTranscript?: (text: string) => string
	/** Fires per result — `isFinal` distinguishes committed text from interim. */
	onTranscript?: (transcript: string, isFinal: boolean) => void
	/** Fires with each final transcript. */
	onResult?: (transcript: string) => void
	/** Fires on recognition errors. */
	onError?: (error: { /** Platform error code from the recognizer. */ error: string; /** Human-readable error detail when provided. */ message?: string }) => void
	/** Fires when capture begins. */
	onStart?: () => void
	/** Fires when capture ends (natural or stopped). */
	onEnd?: () => void
}

/** `useSpeechRecognition` result — `isSupported` (check first; false on native), `isListening`/`isSpeaking`, `volume`/`bands`/`rawBands` metering, `interimTranscript`, and `start`/`stop`/`abort`/`toggle`.
 */
export interface UseSpeechRecognitionReturn {
	/** Whether the platform exposes speech recognition. */
	isSupported: boolean
	/** Whether capture is active. */
	isListening: boolean
	/** Whether speech energy is currently detected. */
	isSpeaking: boolean
	/** Current input level (0–1). */
	volume: number
	/** Smoothed frequency-band energies for visualization. */
	bands: number[]
	/** Unsmoothed frequency-band energies. */
	rawBands: number[]
	/** Latest interim (uncommitted) transcript. */
	interimTranscript: string
	/** Begins capture. */
	start(): void
	/** Ends capture gracefully — pending finals still arrive. */
	stop(): void
	/** Ends capture immediately, discarding pending results. */
	abort(): void
	/** Toggles capture on/off. */
	toggle(): void
}

/** Options for `useChatDictation` — `UseSpeechRecognitionOptions` plus `hasSounds` (web start/stop cues) and `inputRef` to pipe transcripts into a `ChatComposerInput`.
 */
export interface UseChatDictationOptions extends UseSpeechRecognitionOptions {
	/** Start/stop audio cues (default false). Web only. */
	hasSounds?: boolean
	/** Input handle ref — when set, interim/final transcripts are inserted
	 *  into the composer input. */
	inputRef?: { /** Live input-handle slot; null before mount. */ current: ChatComposerInputHandle | null }
}

/** `useChatDictation` result — the `UseSpeechRecognitionReturn` surface; `isSupported` is false on native.
 */
export interface UseChatDictationReturn extends UseSpeechRecognitionReturn {}

/** Mic button bound to a useChatDictation/useSpeechRecognition result.
 *
 * @see useChatDictation — pass its return as `dictation`.
 */
export interface ChatDictationButtonProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Speech-recognition state/actions the button drives. */
	dictation: UseSpeechRecognitionReturn
	/** Button size. */
	size?: 'sm' | 'md'
	/** Hide entirely when unsupported (default true) — else show disabled. */
	isHiddenWhenUnsupported?: boolean
	/** Accessible name for the button. */
	label?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Values flowing from ChatMessageList/ChatLayout to their children. */
export interface ChatMessageContextValue {
	/** Sender propagated to message parts. */
	sender: ChatMessageSender
	/** Density propagated to message parts. */
	density: ChatDensity
}

/** Density context `ChatMessageList` provides to descendants — `{ density }`.
 */
export interface ChatListContextValue {
	/** Density propagated to message parts. */
	density: ChatDensity
}

/** Scroll wiring `ChatLayout` provides — `scrollContainerRef` (the scroller host) and `contentRef` (attach to the list content for size observation).
 */
export interface ChatLayoutContextValue {
	/** The scrollable container — DOM element on web, NS ScrollView natively. */
	scrollContainerRef: { /** Live slot for the host element; unset until bound. */ current?: HostElement | null }
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

/** The injected/polymorphic link component contract (Astryx
 *  `LinkComponentType`) — the same shape as `NavLinkComponentType`: an
 *  element tag ('a') or a function component accepting `href`,
 *  `className`, `style`, and children. */
export type LinkComponentType = NavLinkComponentType

/** `LinkProvider` props — `component` becomes the default link element for
 *  every link-capable component in the subtree. `useLinkComponent` resolves
 *  a per-component `as` prop first, then this default, then the platform
 *  element. */
export interface LinkProviderProps {
	/** Link component for the subtree — e.g. a router link. */
	component: LinkComponentType
	/** Content rendered inside the element. */
	children?: Renderable
}

// ----- NavIcon -----

/** Circular icon button for navigation chrome (Astryx `NavIcon`) — `icon` is an element or registered `IconName` rendered through `Icon`.
 *
 * @example
 * ```tsx
 * import { NavIcon } from '@octane-xplat/ui'
 *
 * <NavIcon icon="xplat-search" />
 * ```
 */
export interface NavIconProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Icon content inside the circular container — an element or a
	 *  registered icon name (rendered through `Icon`). */
	icon: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ----- Toolbar -----

/** Astryx name for `NavElementSize` on `Toolbar`.
 */
export type ToolbarSize = NavElementSize

/** Painted chrome behind the toolbar row — mirrors the upstream Section
 *  delegation: `transparent` (default), `section` (surface paint), `muted`
 *  (secondary wash). */
export type ToolbarVariant = 'transparent' | 'section' | 'muted'

/** Chrome row with `startContent`/`centerContent`/`endContent` slots (Astryx `Toolbar`). `label` is a required accessible name; `size` sets row height, `gap` the intra-slot spacing (spacing steps), `orientation` the arrow-key direction on web and layout axis elsewhere, `variant`/`dividers` the painted chrome.
 *
 * @example
 * ```tsx
 * import { Toolbar, Button } from '@octane-xplat/ui'
 *
 * <Toolbar label="Editor" startContent={<Button label="Back" />} endContent={<Button label="Save" variant="primary" />} />
 * ```
 * @see ToolbarSize, ToolbarVariant.
 */
export interface ToolbarProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** Toolbar size — controls row minimum height and cascades to contained
	 *  controls as their default via the shared `SizeProvider` (Astryx
	 *  `SizeContext`); an explicit control `size` prop always wins. */
	size?: ToolbarSize
	/** Gap between items within each slot, spacing-scale step. */
	gap?: SpacingStep
	/** Arrow-key direction on web; layout axis on every target. */
	orientation?: 'horizontal' | 'vertical'
	/** Painted chrome behind the row. */
	variant?: ToolbarVariant
	/** Divider edges painted on the outer chrome. */
	dividers?: ('top' | 'bottom' | 'start' | 'end')[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ----- TabList / Tab / TabMenu -----

/** Astryx name for `NavElementSize` on `TabList`.
 */
export type TabListSize = NavElementSize
/** `TabList` sizing — `'hug'` wraps each tab's content, `'fill'` stretches tabs equally across the strip.
 */
export type TabListLayout = 'hug' | 'fill'
/** Resolved semantics: `nav` landmark (default) or the WAI-ARIA `tabs`
 *  pattern under `role="tablist"`. */
export type TabListPattern = 'nav' | 'tabs'
/** Strip overflow behavior — `auto` currently always resolves to `scroll`. */
export type TabListOverflow = 'auto' | 'scroll' | 'visible'

/** Context `TabList` provides to `Tab`/`TabMenu` children — current `value`, `onChange`, `size`, `layout`, and resolved `pattern` (nav landmark vs ARIA tabs).
 */
export interface TabListContextValue {
	/** Controlled selected tab value. */
	value: string
	/** Fires when the selection changes. */
	onChange: (value: string) => void
	/** Tab size variant propagated to tabs. */
	size: TabListSize
	/** Layout variant propagated to tabs. */
	layout: TabListLayout
	/** Interaction pattern propagated to tabs. */
	pattern: TabListPattern
	/** Internal plumbing — the strip's registered tab views for
	 *  scroll-selected-into-view. */
	_tabViews?: Map<string, unknown>
}

/** Standalone tab strip (Astryx `TabList`) — children are `Tab`/`TabMenu`; `value`+`onChange` own selection by the tab's `value`. `layout` picks hug/fill, `hasDivider` the bottom rail, `role="tablist"` selects the WAI-ARIA tabs pattern (else it's a nav landmark), `overflow` controls strip overflow (`auto` resolves to `scroll`).
 *
 * @example
 * ```tsx
 * import { TabList, Tab } from '@octane-xplat/ui'
 *
 * <TabList value={tab} onChange={setTab}>
 * 	<Tab value="overview" label="Overview" />
 * 	<Tab value="specs" label="Specs" />
 * </TabList>
 * ```
 * @see TabProps, TabMenuProps, TabsProps for the strip+panels component.
 */
export interface TabListProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** The currently selected tab value. */
	value: string
	/** Fires when a tab is selected. */
	onChange: (value: string) => void
	/** Tab size variant. */
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
	 *  aria-selected, `panelId` → aria-controls, `href` ignored, `to` rejected). Unset or
	 *  any other value leaves the strip a navigation landmark on web. */
	role?: string
	/** `auto`/`scroll` scroll the strip when tabs overflow; `visible`
	 *  disables overflow handling. The selected tab is scrolled into view. */
	overflow?: TabListOverflow
	/** Tab and TabMenu children. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One `TabList` tab. `to` checks route inputs and selects from the current
 * route; `href` opens a raw URL. `value` remains a stable selection key.
 * Under `role="tablist"`, use `panelId` and local selection: `to` throws and
 * `href` is ignored. `as` changes the web link element.
 *
 * @see TabListProps.
 */
interface TabPropsBase {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Unique value matched against TabList `value`. */
	value: string
	/** Disabled tabs cannot navigate, select, or receive keyboard focus. */
	isDisabled?: boolean
	/** Accessible label — visible text by default; `isLabelHidden` makes it
	 *  the aria label only. */
	label: string
	/** Keeps tab labels for assistive tech but renders icons only. */
	isLabelHidden?: boolean
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
	onPress?: NavLinkOptions['onPress']
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** A navigation tab with inferred route inputs; panel tabs use local selection. */
export type TabProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = TabPropsBase & NavigationTargetProps<Contracts, Stacks, Transitions>

/** One `TabMenu` dropdown option — `value`, `label`, optional leading `icon`.
 */
export interface TabMenuOption {
	/** Value this option selects. */
	value: string
	/** Text shown for the option. */
	label: string
	/** Icon content or registered icon name shown before the label. */
	icon?: Renderable
}

/** Overflow menu trigger inside a TabList — opens a dropdown of extra
 *  options; the selected option's label becomes the trigger text. */
export interface TabMenuProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Trigger label when no option is selected + the dropdown heading. */
	label: string
	/** Options rendered in the tab overflow menu. */
	options: TabMenuOption[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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

/** AppShell's mobile-nav configuration — `hasToggle` auto-renders the hamburger (default true; place `MobileNavToggle` yourself when false), `isOpen`/`onOpenChange` control the drawer, `content` replaces the auto drawer, `breakpoint` sets where mobile nav activates (default `md`, `none` disables), `defaultIsMobile` is the SSR/first-paint hint.
 */
export interface MobileNavConfig {
	/** Auto-render the hamburger toggle (default true). `false` → place
	 *  `MobileNavToggle` yourself. */
	hasToggle?: boolean
	/** Controlled drawer open state. */
	isOpen?: boolean
	/** Reports requested open-state changes for the mobile nav. */
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

/** Context `AppShell` publishes (read via `useAppShellMobile`) — `isMobile`, drawer state (`isMobileNavOpen`, `mobileNavId`), open/close/toggle operations, and `isMobileNavEnabled`/`hasAutoToggle`.
 */
export interface AppShellMobileContextValue {
	/** Whether the shell is in the mobile breakpoint. */
	isMobile: boolean
	/** Whether the mobile nav sheet is open. */
	isMobileNavOpen: boolean
	/** Id of the mobile nav drawer (toggle references it). */
	mobileNavId?: string
	/** Toggles the mobile nav sheet. */
	toggleMobileNav: () => void
	/** Opens the mobile nav sheet. */
	openMobileNav: () => void
	/** Closes the mobile nav sheet. */
	closeMobileNav: () => void
	/** Whether mobile nav is enabled at all (vs desktop nav only). */
	isMobileNavEnabled: boolean
	/** Whether the nav auto-closes on navigation. */
	hasAutoToggle: boolean
}

/** Application shell — top-nav + content frame with a `variant` background treatment, `banner` slot, `contentPadding` (spacing steps), `height` fill/auto, and `mobileNav` config that swaps the nav for a drawer below a width breakpoint.
 *
 * @example
 * ```tsx
 * import { AppShell, TopNav } from '@octane-xplat/ui'
 *
 * <AppShell variant="section" mobileNav={{ breakpoint: 'md' }}>
 * 	<TopNav label="App">{items}</TopNav>
 * 	{content}
 * </AppShell>
 * ```
 * @see MobileNavConfig, TopNavProps, SideNavProps.
 */
export interface AppShellProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Shell layout variant. */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ----- TopNav -----

/** Resolved `TopNav` presentation — `'default'` desktop bar, `'mobile-bar'`, or `'drawer'`; read via `useTopNavRenderMode` inside nav content.
 */
export type TopNavRenderMode = 'default' | 'mobile-bar' | 'drawer'
/** Named `TopNav` slot — `'start' | 'center' | 'end'`.
 */
export type TopNavSlot = 'start' | 'center' | 'end'

/** Top navigation bar (Astryx `TopNav`) — `heading` (typically `TopNavHeading`), `startContent`/`centerContent`/`endContent` slots (`children` aliases `startContent`), `label` for the nav landmark. Inside `AppShell` it renders as the mobile bar/drawer under the breakpoint.
 *
 * @example
 * ```tsx
 * import { TopNav, TopNavItem, TopNavHeading } from '@octane-xplat/ui'
 *
 * <TopNav
 * 	heading={<TopNavHeading heading="Acme" headingHref="/" />}
 * 	startContent={<TopNavItem label="Docs" href="/docs" />}
 * />
 * ```
 * @see TopNavHeadingProps, TopNavItemProps, AppShellProps.
 */
export interface TopNavProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** The brand/heading block inside `TopNav` — `logo`, `heading`/`superheading`/`subheading` (+Href links), `headerEndContent`, and `menu` for a heading popover (typically `NavHeadingMenu`, chevron added). `as` swaps the link element on web.
 *
 * @see TopNavProps, NavHeadingMenuProps.
 */
export interface TopNavHeadingProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Logo element before the heading (e.g. `NavIcon`). */
	logo?: Renderable
	/** Accessible name for a linked logo-only heading. */
	logoLabel?: string
	/** Primary heading text. */
	heading?: string
	/** URL the heading links to. */
	headingHref?: string
	/** Kicker text above the heading. */
	superheading?: string
	/** URL the superheading links to. */
	superheadingHref?: string
	/** Secondary text under the heading. */
	subheading?: string
	/** URL the subheading links to. */
	subheadingHref?: string
	/** Content at the header row's trailing edge. */
	headerEndContent?: Renderable
	/** Menu content shown in a popover from the heading — typically a
	 *  `NavHeadingMenu`. A chevron affordance is added automatically. */
	menu?: Renderable
	/** Component used to render the link. */
	as?: NavLinkComponentType
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One `TopNav` link/action — `label` required (visible text, or aria name under `isIconOnly`), `href` navigation (anchor attrs `target`/`rel`/`download`/`referrerPolicy` are web-only), `isSelected`/`isDisabled`, `icon`, `size`, `onClick`.
 *
 * @see TopNavProps.
 */
interface TopNavItemPropsBase {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Web anchor attributes; no-op on native. */
	target?: string
	/** Anchor rel attribute. */
	rel?: string
	/** Marks the link a download; string sets the filename. */
	download?: string | boolean
	/** Referrer policy for the link. */
	referrerPolicy?: string
	/** Component used to render the nav item. */
	as?: NavLinkComponentType
	/** Accessible label; visible text by default, aria label when
	 *  `isIconOnly`. */
	label: string
	/** Marks the item as the current page. */
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
	/** Activation handler — receives the navigation event. */
	onClick?: NavLinkOptions['onPress']
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** A top-bar link or action; typed destinations infer route params and search. */
export type TopNavItemProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = TopNavItemPropsBase & NavigationTargetProps<Contracts, Stacks, Transitions>

/** One `TopNavMenu` data row — `title`, `description`, `icon`, `href`, `onClick`.
 */
interface TopNavMenuItemDataBase {
	/** Item title text. */
	title: string
	/** Dims the item and blocks activation. */
	isDisabled?: boolean
	/** Secondary text under the title. */
	description?: string
	/** Icon shown beside the item. */
	icon?: Renderable
	/** Activation handler — receives the navigation event. */
	onClick?: NavLinkOptions['onPress']
}

/** A top-bar menu row with typed destination, raw URL, or action. */
export type TopNavMenuItemData<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = TopNavMenuItemDataBase & NavigationTargetProps<Contracts, Stacks, Transitions>

/** Trigger that opens a menu popover on hover (pointer platforms) or
 *  press.
 *
 * @see TopNavMenuItemData — the data form; `TopNavMegaMenu` for a composed panel.
 */
export interface TopNavMenuProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Trigger label text. */
	label: string
	/** Entries rendered in the menu. */
	items: readonly TopNavMenuItemData<Contracts, Stacks, Transitions>[]
	/** Hover-open delay in ms (pointer platforms). */
	delay?: number
	/** Hover-close delay in ms (pointer platforms). */
	hideDelay?: number
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** A `TopNav` trigger that opens a wide mega-menu — `items` (`TopNavMegaMenuItem` children or custom content), `featured` panel, hover `delay`/`hideDelay` (ms) on pointer platforms, `onOpenChange`.
 */
export interface TopNavMegaMenuProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Trigger label text. */
	label: string
	/** Menu items slot — `TopNavMegaMenuItem` children or custom content. */
	items?: Renderable
	/** Featured panel content (right side on wide layouts, below items in
	 *  the drawer). */
	featured?: Renderable
	/** Hover dwell in ms before the menu opens. */
	delay?: number
	/** Grace period in ms before the menu closes. */
	hideDelay?: number
	/** Reports requested open-state changes. */
	onOpenChange?: (isOpen: boolean) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One `TopNavMegaMenu` entry — `title`, `description`, `icon`, `href`/`onClick` activation, `as` link override (web).
 */
interface TopNavMegaMenuItemPropsBase {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Item title text. */
	title: string
	/** Dims the item and blocks activation. */
	isDisabled?: boolean
	/** Marks the item as the current page. */
	isSelected?: boolean
	/** Secondary text under the title. */
	description?: string
	/** Icon shown beside the item. */
	icon?: Renderable
	/** Activation handler — receives the navigation event. */
	onClick?: NavLinkOptions['onPress']
	/** Component used to render the item. */
	as?: NavLinkComponentType
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** A composed mega-menu link with inferred route inputs and cancellable activation. */
export type TopNavMegaMenuItemProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = TopNavMegaMenuItemPropsBase & NavigationTargetProps<Contracts, Stacks, Transitions>

/** The featured card inside `TopNavMegaMenu` — `title`, `description`, decorative `image`/`imageAlt`, `linkLabel`/`linkHref`, `children`.
 */
export interface TopNavMegaMenuFeaturedCardProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Card title text. */
	title: string
	/** Secondary text under the title. */
	description?: string
	/** Decorative image URL shown above the body; `imageAlt` makes it
	 *  informative. */
	image?: string
	/** Accessible description of the card image. */
	imageAlt?: string
	/** Link text on the card. */
	linkLabel?: string
	/** URL the card links to. */
	linkHref?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ----- SideNav -----

/** Resolved `SideNav` presentation — `'default'` rail, `'topbar'`, `'drawer'`, or `'drawer-content'`; read via `useSideNavRenderMode`.
 */
export type SideNavRenderMode = 'default' | 'topbar' | 'drawer' | 'drawer-content'
/** Astryx name for `NavElementSize` on nav items.
 */
export type NavItemSize = NavElementSize

/** Live collapse state shared from a `SideNav` — `isCollapsed`, `toggle()`, `isCollapsible`.
 */
export interface SideNavCollapseState {
	/** Whether the side nav is collapsed. */
	isCollapsed: boolean
	/** Toggles the collapsed state. */
	toggle: () => void
	/** Whether collapsing is available. */
	isCollapsible: boolean
}

/** Collapse behavior for `SideNav` — `defaultIsCollapsed` (uncontrolled) or `isCollapsed`+`onCollapsedChange` (controlled), `hasButton` renders the built-in collapse affordance (default true), `buttonLabel` names it.
 */
export interface SideNavCollapsibleConfig {
	/** Initial collapsed state for uncontrolled usage. */
	defaultIsCollapsed?: boolean
	/** Controlled collapsed state. */
	isCollapsed?: boolean
	/** Reports collapsed-state changes. */
	onCollapsedChange?: (isCollapsed: boolean) => void
	/** Render the built-in collapse button (default true). */
	hasButton?: boolean
	/** Accessibility label for the built-in collapse button. */
	buttonLabel?: string
}

/** `SideNavCollapsibleConfig` with the controlled fields required — `isCollapsed` + `onCollapsedChange`.
 */
export interface SideNavControlledCollapsible extends SideNavCollapsibleConfig {
	/** Controlled collapsed state. */
	isCollapsed: boolean
	/** Reports collapsed-state changes. */
	onCollapsedChange: (isCollapsed: boolean) => void
}

/** @deprecated Hand the same controlled `collapsible` config to SideNav and
 *  to the outside button instead. */
export interface SideNavImperativeCollapseHandle {
	/** Reads the current collapse state; null when not collapsible. */
	getCollapseState: () => SideNavCollapseState | null
}

/** Side navigation rail (Astryx `SideNav`) — `header`/`topContent`/`children`/`footer`/`footerIcons` slots, `collapsible` (true for defaults or a config; controlled via `isCollapsed`+`onCollapsedChange`), `resizable` inline-end drag handle, `label` landmark name.
 *
 * @example
 * ```tsx
 * import { SideNav, SideNavItem, SideNavSection, SideNavHeading } from '@octane-xplat/ui'
 *
 * <SideNav header={<SideNavHeading heading="Acme" />} collapsible>
 * 	<SideNavSection title="Main">
 * 		<SideNavItem label="Home" href="/" />
 * 	</SideNavSection>
 * </SideNav>
 * ```
 * @see SideNavCollapsibleConfig, SideNavItemProps, SideNavSectionProps.
 */
export interface SideNavProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	handleRef?: { /** Live collapse-handle slot; null before mount. */ current: SideNavImperativeCollapseHandle | null }
	/** Landmark label (default 'Side navigation'). */
	label?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** A titled group inside `SideNav` — `title` (+`subtitle`, `endContent`), `isHeaderHidden` keeps the title accessible but invisible; children are `SideNavItem`s.
 */
export interface SideNavSectionProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Section heading text. */
	title: string
	/** Secondary text under the heading. */
	subtitle?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Trailing content in the section header. */
	endContent?: Renderable
	/** Visually hide the header (title stays accessible). */
	isHeaderHidden?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** The brand/heading block inside `SideNav` — `icon`, `heading`/`superheading`/`subheading` (+Href), `headerEndContent`, `menu` heading popover (typically `NavHeadingMenu`), `as` link override on web.
 */
export interface SideNavHeadingProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Product/app icon (e.g. `NavIcon`). */
	icon?: Renderable
	/** Component used to render the heading link. */
	as?: NavLinkComponentType
	/** Primary heading text. */
	heading: string
	/** URL the heading links to. */
	headingHref?: string
	/** Kicker text above the heading. */
	superheading?: string
	/** URL the superheading links to. */
	superheadingHref?: string
	/** Secondary text under the heading. */
	subheading?: string
	/** URL the subheading links to. */
	subheadingHref?: string
	/** Content at the header row's trailing edge. */
	headerEndContent?: Renderable
	/** Menu popover content (typically `NavHeadingMenu`) — shows a chevron
	 *  affordance. Without hrefs the whole header is the trigger; with hrefs
	 *  the chevron area is. */
	menu?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One `SideNav` row — `label` required; `href`/`onClick` activation; `icon`/`selectedIcon`; `isSelected`/`isDisabled`; `endContent` passive trailing content; `actions` row-level controls (hidden while collapsed); `children` sub-items with their own `collapsible` config; `size`.
 *
 * @see SideNavProps, SideNavSectionProps.
 */
interface SideNavItemPropsBase {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Component used to render the item link. */
	as?: NavLinkComponentType
	/** Item label text. */
	label: string
	/** Icon (element or registered name) shown when not selected. */
	icon?: Renderable
	/** Icon shown when selected; falls back to `icon`. */
	selectedIcon?: Renderable
	/** Marks the item as the current page. */
	isSelected?: boolean
	/** Dims the item and blocks activation. */
	isDisabled?: boolean
	/** Activation handler — receives the navigation event. */
	onClick?: NavLinkOptions['onPress']
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
				/** Initial collapsed state for uncontrolled usage. */
				defaultIsCollapsed?: boolean
				/** Controlled collapsed state. */
				isCollapsed?: boolean
				/** Reports collapsed-state changes. */
				onCollapsedChange?: (isCollapsed: boolean) => void
		  }
	/** Item size variant. */
	size?: NavItemSize
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** A sidebar link or action with inferred route inputs and active state. */
export type SideNavItemProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = SideNavItemPropsBase & NavigationTargetProps<Contracts, Stacks, Transitions>

/** The rail collapse/expand button — reads the enclosing `SideNav`'s collapse state; `collapsible` passes a controlled `SideNavControlledCollapsible` only when the button renders outside its SideNav. `label` switches icon-only → text+chevron.
 */
export interface SideNavCollapseButtonProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** The same controlled config given to SideNav — needed only when the
	 *  button renders outside this SideNav. */
	collapsible?: SideNavControlledCollapsible
	/** @deprecated Pass `collapsible` instead. */
	handleRef?: { /** Live collapse-handle slot; null before mount. */ current: SideNavImperativeCollapseHandle | null }
	/** Text label — renders a text+chevron button instead of icon-only. */
	label?: string
	/** Button size variant. */
	size?: NavElementSize
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ----- MobileNav -----

/** Drawer-form navigation (Astryx `MobileNav`) — `header` (string → heading, or an element), drawer `side` ('start'/'end'/'auto'), `width` in dips, `isOpen`/`onOpenChange` (managed by AppShell context inside a shell), `label`. Preferred usage is via `AppShell`'s `mobileNav` config rather than standalone.
 *
 * @example
 * ```tsx
 * import { MobileNav, SideNavItem } from '@octane-xplat/ui'
 *
 * <MobileNav isOpen={open} onOpenChange={setOpen} header="Acme">
 * 	<SideNavItem label="Home" href="/" />
 * </MobileNav>
 * ```
 * @see MobileNavConfig, AppShellProps.
 */
export interface MobileNavProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Drawer open state — inside `AppShell` it is managed by context. */
	isOpen?: boolean
	/** Reports requested open-state changes. */
	onOpenChange?: (isOpen: boolean) => void
	/** Content rendered inside the element. */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** The hamburger button that opens the `MobileNav` drawer — `children` replace the glyph, `label` names it (default 'Open navigation'). Auto-rendered by `AppShell` unless `mobileNav.hasToggle` is false.
 */
export interface MobileNavToggleProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Custom content replacing the default hamburger glyph. */
	children?: Renderable
	/** Accessible label (default 'Open navigation'). */
	label?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ----- NavHeadingMenu (upstream NavMenu module) -----

/** Astryx name for `NavElementSize` on `NavHeadingMenu`.
 */
export type NavHeadingMenuSize = NavElementSize

/** Context `NavHeadingMenu` provides to its items — inherited `size` and `closeMenu()`.
 */
export interface NavHeadingMenuContextValue {
	/** Menu size variant propagated to items. */
	size: NavHeadingMenuSize
	/** Closes the open menu. */
	closeMenu: () => void
}

/** Close callback supplied by the heading popover hosting the menu. */
export interface NavHeadingCloseContextValue {
	/** Closes the open menu. */
	closeMenu: () => void
}

/** Menu popover content for `TopNavHeading`/`SideNavHeading` (`menu` slot) — `NavHeadingMenuItem` children, separators, or custom content; `size`, `minWidth` override (dips).
 */
export interface NavHeadingMenuProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** `NavHeadingMenuItem` children, separators, or custom content. */
	children?: Renderable
	/** Menu size variant. */
	size?: NavHeadingMenuSize
	/** Minimum width override (dips/px) — takes precedence over the
	 *  size-based default. */
	minWidth?: number | string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One `NavHeadingMenu` row — `label` required, `icon`, `description`, `href`/`onClick` activation, `isDisabled`.
 */
interface NavHeadingMenuItemPropsBase {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Icon shown beside the item. */
	icon?: Renderable
	/** Item label content. */
	label: Renderable
	/** Secondary text under the label. */
	description?: Renderable
	/** Activation handler — receives the navigation event. */
	onClick?: NavLinkOptions['onPress']
	/** Dims the item and blocks activation. */
	isDisabled?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** A heading-menu link or action bound to the rendering navigation flow. */
export type NavHeadingMenuItemProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = NavHeadingMenuItemPropsBase & NavigationTargetProps<Contracts, Stacks, Transitions>

// ----- OverflowList -----

/** One collapsed `OverflowList` entry handed to `overflowRenderer`/`onOverflowChange` — the caller's `child` element plus its original `index`.
 */
export interface OverflowItem {
	/** The caller-supplied element for this item. */
	child: Renderable
	/** Index in the original children list. */
	index: number
}

/** Renders a measured subset of `children`; items that exceed the row (or a
 *  configured count cap) collapse into the `overflowRenderer` indicator.
 *
 * @example
 * ```tsx
 * import { OverflowList, Tab, MoreMenu } from '@octane-xplat/ui'
 *
 * <OverflowList
 * 	overflowRenderer={(items) => <MoreMenu items={items.map((i) => ({ type: 'action', key: String(i.index), label: `Item ${i.index}` }))} />}
 * >
 * 	{tabs}
 * </OverflowList>
 * ```
 * @see OverflowItem.
 */
export interface OverflowListProps extends LayoutChildProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** One element per item. */
	children?: Renderable
	/** Gap between items, spacing-scale step (default 2). */
	gap?: SpacingStep
	/** Items always kept visible even in tight space. */
	minVisibleItems?: number
	/** Items shown before overflow begins. */
	maxVisibleItems?: number
	/** Wrap items across up to this many rows before collapsing. */
	maxRows?: number
	/** Which end items collapse into overflow from. */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ----- Resizable -----

/** Axis a resize runs along — `'horizontal'` (width) or `'vertical'` (height); a `ResizeHandle`'s direction must match its region's.
 */
export type ResizableDirection = 'horizontal' | 'vertical'

/** A pixel bound for a percentage size — `pixel(240)`. The number is dips
 *  (CSS pixels on web). */
export interface ResizablePixelSize {
	/** Size-unit discriminator — value is fixed px. */
	readonly type: 'pixel'
	/** Size in px. */
	readonly value: number
}

/** A percentage with exactly one pixel floor or ceiling —
 *  `percent(50, {min: pixel(200)})`. The number is a percentage of its
 *  resize basis; the optional pixel bound is dips (CSS pixels on web). */
export type ResizablePercentSize = {
	/** Size-unit discriminator — value is a container percentage. */
	readonly type: 'percent'
	/** Percentage of the container (0–100). */
	readonly value: number
} & (
	| { /** Pixel floor for the percent size. */ readonly min: ResizablePixelSize; /** Unused with `min` — the two bounds are exclusive. */ readonly max?: never }
	| { /** Unused with `max` — the two bounds are exclusive. */ readonly min?: never; /** Pixel ceiling for the percent size. */ readonly max: ResizablePixelSize }
)

/** A resizable size: numeric dips (CSS pixels on web), exact `Npx`/`N%`
 *  strings, `pixel(n)`, or `percent(n, {min|max})`. Basis-dependent values resolve once against the
 *  `containerRef` element (or the viewport/screen when omitted).
 *
 * @see pixel, percent — the constructors for bounded sizes.
 */
export type ResizableSize =
	| number
	| `${number}px`
	| `${number}%`
	| ResizablePixelSize
	| ResizablePercentSize

/** The `minSize` half of a region config — a `ResizableSize` floor.
 */
export interface ResizableMinConfig {
	/** Smallest size the region can be resized to. */
	minSize?: ResizableSize
}

/** The `maxSize` half of a region config — a `ResizableSize` ceiling.
 */
export interface ResizableMaxConfig {
	/** Largest size the region can be resized to. */
	maxSize?: ResizableSize
}

/** Per-region sizing behavior — `defaultSize`, `collapsible`, `collapsedSize`
 *  drag threshold in dips (CSS pixels on web, default 40), `snaps` sizes in
 *  the same unit, and `shrinkOrder` cascade priority (lower shrinks first).
 */
export interface ResizableRegionSizing {
	/** Initial size before user resizing. */
	defaultSize?: ResizableSize
	/** Whether this region can collapse to 0 (default false). */
	collapsible?: boolean
	/** Size in dips (CSS pixels on web) below which a drag collapses the region
	 *  (default 40). */
	collapsedSize?: number
	/** Snap sizes in dips (CSS pixels on web). */
	snaps?: number[]
	/** Cascade priority — lower numbers shrink first in multi-region layouts. */
	shrinkOrder?: number
}

/** Full config for one `useResizable` region — sizing (`ResizableRegionSizing`) plus `minSize`/`maxSize` bounds.
 */
export type ResizableRegionConfig = ResizableRegionSizing & ResizableMinConfig & ResizableMaxConfig

/** Simplified resize config accepted by a component's `resizable` prop
 *  (e.g. `SideNav`). */
export interface ResizableConfig {
	/** Numeric widths are dips (CSS pixels on web). */
	defaultWidth?: number
	/** Numeric width bound in dips (CSS pixels on web). */
	minWidth?: number
	/** Numeric width bound in dips (CSS pixels on web). */
	maxWidth?: number
	/** Persistence key — localStorage on web, ApplicationSettings on
	 *  native; in-memory only on the AppKit desktop leaf. */
	autoSaveId?: string
	/** Fires during resize with the current width. */
	onWidthChange?: (width: number) => void
	/** Initial collapsed state for uncontrolled usage. */
	defaultIsCollapsed?: boolean
	/** Controlled collapsed state. */
	isCollapsed?: boolean
	/** Reports collapsed-state changes. */
	onCollapseChange?: (isCollapsed: boolean) => void
}

/** Options for single-region `useResizable` — `containerRef` (the element percentages resolve against; viewport/screen when omitted), `direction`, `autoSaveId` persistence key, collapse state (`defaultIsCollapsed` or `isCollapsed`+`onCollapseChange`), `onSizeChange`.
 */
export interface UseResizableSingleOptions {
	/** Element/view a percentage resolves against — `{ current }` shaped. */
	containerRef?: { /** Live slot for the host element; null before mount or after unmount. */ current: HostElement | null }
	/** Axis this region resizes along; must match `ResizeHandle.direction`. */
	direction?: ResizableDirection
	/** Persists size across sessions under this storage key. */
	autoSaveId?: string
	/** Initial collapsed state for uncontrolled usage. */
	defaultIsCollapsed?: boolean
	/** Controlled collapsed state. */
	isCollapsed?: boolean
	/** Fires when the size settles after a resize. */
	onSizeChange?: (size: number) => void
	/** Reports collapsed-state changes. */
	onCollapseChange?: (isCollapsed: boolean) => void
}

/** Single-region `useResizable` config — `ResizableRegionConfig` sizing plus `UseResizableSingleOptions` host wiring.
 */
export type UseResizableSingleConfig = ResizableRegionConfig & UseResizableSingleOptions

/** Multi-region `useResizable` config — named `regions` map (`Record<string, ResizableRegionConfig>`), shared `direction`/`containerRef`/`autoSaveId`.
 */
export interface UseResizableMultiConfig {
	/** Axis the regions resize along. */
	direction?: ResizableDirection
	/** Container element the regions are measured against. */
	containerRef?: { /** Live slot for the host element; null before mount or after unmount. */ current: HostElement | null }
	/** Per-region sizing config keyed by region id. */
	regions: Record<string, ResizableRegionConfig>
	/** Persists sizes across sessions under this storage key. */
	autoSaveId?: string
}

/** The handle-facing contract produced by `useResizable` — spread onto a
 *  `ResizeHandle`'s `resizable` prop (or a component's `resizable` prop).
 *  Underscore fields are internal plumbing exported for hand-built
 *  integrations. */
export interface ResizableProps {
	/** Internal — current size injected by the Resizable parent. */
	_size: number
	/** Internal — collapsed state injected by the Resizable parent. */
	_isCollapsed: boolean
	/** Internal — resize-start hook from the parent. */
	_onResizeStart: () => void
	/** Internal — resize-move hook receiving pointer deltas. */
	_onResizeMove: (delta: number) => void
	/** Internal — resize-end hook from the parent. */
	_onResizeEnd: () => void
	/** Gesture ended without completing (pointercancel/lost capture/handle
	 *  unmounted) — releases the gesture without signalling a resize end. */
	_onResizeCancel?: () => void
	/** Internal — resolved minimum size in px. */
	_minSizePx: number
	/** Internal — resolved maximum size in px. */
	_maxSizePx: number
	/** Internal — snap points in px. */
	_snaps: number[]
	/** Internal — size applied while collapsed. */
	_collapsedSize: number
	/** Internal — whether the region may collapse. */
	_collapsible: boolean
	/** Internal — resize axis. */
	_direction?: ResizableDirection
	/** Internal marker discriminating injected props. */
	_isResizableProps: true
}

/** One live region from multi-region `useResizable` — current `size` (px/dips), `isCollapsed`, `collapse`/`expand`/`resize` operations, and `props` to spread into a `ResizeHandle`.
 */
export interface ResizableRegion {
	/** Current size in px/dips. */
	size: number
	/** Whether the region is currently collapsed. */
	isCollapsed: boolean
	/** Collapses the region. */
	collapse: () => void
	/** Expands the region from collapsed. */
	expand: () => void
	/** Sets the region size directly. */
	resize: (size: number) => void
	/** Props to spread into `ResizeHandle`'s `resizable`. */
	props: ResizableProps
}

/** The drag handle between resizable regions — `resizable` takes the `ResizableProps` a `useResizable` region emits (or a component's `resizable` config object); `direction` must match the region's axis.
 */
export interface ResizeHandleProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** Disables dragging. */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ---------- actions & interactive cards (Astryx parity) ----------

/** Icon-only button — `label` is the accessible name and doubles as the
 *  hover/focus tooltip on pointer targets. `icon` is required: a node or a
 *  registered icon name.
 *
 * @example
 * ```tsx
 * import { IconButton } from '@octane-xplat/ui'
 *
 * <IconButton icon="xplat-close" label="Close" clickAction={close} />
 * ```
 * @see ButtonProps.
 */
export interface IconButtonProps extends Omit<
	ButtonProps,
	'children' | 'endContent' | 'isIconOnly' | 'label'
> {
	/** Glyph rendered inside the button. */
	icon: Renderable
	/** Accessible name (required — icon-only buttons have no visible text). */
	label: string
}

/** Axis of a `ButtonGroup`/`ToggleButtonGroup` — `'horizontal'` (default) or `'vertical'`.
 */
export type ButtonGroupOrientation = 'horizontal' | 'vertical'

/** Shared context Button (and grouped trigger components) read inside a
 *  ButtonGroup — mirrors upstream `useButtonGroup`. */
export interface ButtonGroupContextValue {
	/** Axis the group lays out on, propagated to buttons. */
	orientation: ButtonGroupOrientation
	/** Disables every button in the group. */
	isDisabled: boolean
	/** Size variant propagated to buttons. */
	size?: FieldControlSize
}

/** Connected button row — shared surface, squared inner edges, single tab
 *  stop with arrow-key navigation on web. Children are Buttons/IconButtons/
 *  ToggleButtons or a DropdownMenu trigger member.
 *
 * @example
 * ```tsx
 * import { ButtonGroup, Button } from '@octane-xplat/ui'
 *
 * <ButtonGroup label="File actions">
 * 	<Button label="Save" />
 * 	<Button label="Revert" />
 * </ButtonGroup>
 * ```
 * @see ButtonGroupContextValue, ButtonGroupOrientation.
 */
export interface ButtonGroupProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Accessible label for the group (role="group" aria-label). */
	label: string
	/** @default 'horizontal' */
	orientation?: ButtonGroupOrientation
	/** Default size for group members. @default 'md' */
	size?: FieldControlSize
	/** Resting elevation for the shared surface. @default 'none' */
	elevation?: Elevation
	/** Disables every button in the group. */
	isDisabled?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Toggle button — pressed state with `isPressed`/`onPressedChange`, an
 *  optional `pressedChangeAction` run through Button's action transition, and
 *  `pressedIcon` for outline→filled swaps. Inside a ToggleButtonGroup the
 *  group owns pressed state via `value`.
 *
 * @example
 * ```tsx
 * import { ToggleButton } from '@octane-xplat/ui'
 *
 * <ToggleButton label="Bold" isPressed={bold} onPressedChange={setBold} />
 * ```
 * @see ToggleButtonGroupProps for grouped selection.
 */
export interface ToggleButtonProps extends Omit<ButtonProps, 'label' | 'variant' | 'clickAction'> {
	/** Button text. */
	label: string
	/** Controlled pressed state. */
	isPressed?: boolean
	/** Called with the next pressed state when the button is activated. */
	onPressedChange?: (isPressed: boolean) => void
	/** Action-backed toggle — runs while the pending spinner shows, with an
	 *  optimistic press flip. Ignored when `value` binds group membership.
	 *  Failures report through `onActionError`. */
	pressedChangeAction?: (isPressed: boolean) => void | Promise<void>
	/** Icon shown while pressed (e.g. filled variant); falls back to `icon`. */
	pressedIcon?: Renderable
	/** Accent color applied while pressed (Astryx `color`). */
	color?: 'accent' | 'success' | 'warning' | 'error'
	/** Member key inside a ToggleButtonGroup. */
	value?: string
}

interface ToggleButtonGroupBaseProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Accessible label for the group (role="group" aria-label). */
	label: string
	/** Axis override when the button sits in a group. */
	orientation?: ButtonGroupOrientation
	/** Size variant. */
	size?: FieldControlSize
	/** Disables the button. */
	isDisabled?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Single-select toggle group — clicking the active button deselects. */
export interface ToggleButtonGroupSingleProps extends ToggleButtonGroupBaseProps {
	/** Single-select discriminator — `single` fixes this variant. */
	type?: 'single'
	/** Controlled pressed value, or null when none. */
	value: string | null
	/** Fires with the new value (null when toggled off). */
	onChange: (value: string | null) => void
}

/** Multi-select toggle group. */
export interface ToggleButtonGroupMultipleProps extends ToggleButtonGroupBaseProps {
	/** Multi-select discriminator — `multiple` fixes this variant. */
	type: 'multiple'
	/** Controlled pressed values. */
	value: string[]
	/** Fires with the new value array. */
	onChange: (value: string[]) => void
}

/** `ToggleButtonGroup` — single-select (`type: 'single'` default, `value: string | null`; tapping the active member deselects) or multi-select (`type: 'multiple'`, `value: string[]`). Members are `ToggleButton`s keyed by their `value` prop.
 *
 * @example
 * ```tsx
 * import { ToggleButtonGroup, ToggleButton } from '@octane-xplat/ui'
 *
 * <ToggleButtonGroup label="Align" value={align} onChange={setAlign}>
 * 	<ToggleButton value="left" label="Left" />
 * 	<ToggleButton value="right" label="Right" />
 * </ToggleButtonGroup>
 * ```
 * @see ToggleButtonGroupSingleProps, ToggleButtonGroupMultipleProps, ToggleButtonProps.
 */
export type ToggleButtonGroupProps = ToggleButtonGroupSingleProps | ToggleButtonGroupMultipleProps

/** Interactive card for navigation or action targets. The whole surface is
 *  one press/click target; nested interactive children (buttons, links) still
 *  work independently. `href` gives real link semantics on web (modifier and
 *  middle clicks open a new tab; unsafe URL schemes are refused) and opens
 *  the platform browser on native.
 *
 * @example
 * ```tsx
 * import { ClickableCard, Text } from '@octane-xplat/ui'
 *
 * <ClickableCard label="Open report" href={`/reports/${id}`}>
 * 	<Text>{title}</Text>
 * </ClickableCard>
 * ```
 * @see SelectableCardProps, CardProps.
 */
export interface ClickableCardProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Accessible name for the card's action. */
	label: string
	/** Activation callback — makes the whole card pressable. */
	onPress?: () => void
	/** Turns the card into a link to this URL. */
	href?: string
	/** Anchor target when `href` is set. */
	target?: string
	/** Dims the card and blocks activation. */
	isDisabled?: boolean
	/** Content rendered inside the element. */
	children?: Renderable
	/** Internal padding in 4px spacing steps. @default 4 */
	padding?: number
	/** @default 'default' */
	variant?: string
	/** @default 'none' */
	elevation?: Elevation
	/** Card width — number is DIPs, string is a CSS length. */
	width?: number | string
	/** Card height — number is DIPs, string is a CSS length. */
	height?: number | string
	/** Maximum card width. */
	maxWidth?: number | string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Toggle-selection card — same surface contract as ClickableCard with a
 *  checked/selected semantic instead of an action.
 *
 * @example
 * ```tsx
 * import { SelectableCard, Text } from '@octane-xplat/ui'
 *
 * <SelectableCard label="Basic plan" isSelected={plan === 'basic'} onChange={() => setPlan('basic')}>
 * 	<Text>{details}</Text>
 * </SelectableCard>
 * ```
 * @see ClickableCardProps.
 */
export interface SelectableCardProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Accessible name for the selectable card. */
	label: string
	/** Controlled selection state. */
	isSelected: boolean
	/** Fires with the new selected state. */
	onChange: (isSelected: boolean) => void
	/** Disabled cards stay focusable with a disabled state announced. */
	isDisabled?: boolean
	/** Content rendered inside the element. */
	children?: Renderable
	/** Inner padding in DIPs. */
	padding?: number
	/** Visual variant of the card surface. */
	variant?: string
	/** Shadow depth level. */
	elevation?: Elevation
	/** Card width — number is DIPs, string is a CSS length. */
	width?: number | string
	/** Card height — number is DIPs, string is a CSS length. */
	height?: number | string
	/** Maximum card width. */
	maxWidth?: number | string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Menu side of the `MoreMenu` trigger — logical (`above`/`below`/`start`/`end`) or physical (`left`/`right`/`top`/`bottom`) sides. @default 'below'
 */
export type MoreMenuPlacement =
	| 'above'
	| 'below'
	| 'start'
	| 'end'
	| 'left'
	| 'right'
	| PopoverPlacement

/** Menu alignment along the placement axis — `PopoverAlignment`. @default 'start'
 */
export type MoreMenuAlignment = PopoverAlignment
/** 'popover' anchors the menu to the trigger; 'bottom-sheet' docks it in the
 *  bottom sheet; 'adaptive' resolves to bottom-sheet on coarse-pointer/touch
 *  targets and popover elsewhere. @default 'popover' */
export type MoreMenuPresentation = 'popover' | 'bottom-sheet' | 'adaptive'

/** Overflow menu — icon-only three-dot trigger feeding a DropdownMenu.
 *
 * @example
 * ```tsx
 * import { MoreMenu } from '@octane-xplat/ui'
 *
 * <MoreMenu items={[{ type: 'action', key: 'share', label: 'Share', onSelect: share }]} />
 * ```
 * @see MenuActionData, DropdownMenuProps.
 */
export interface MoreMenuProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** This compact overflow menu contains action rows only. Use DropdownMenu
	 *  for links, sections, separators, and other row kinds. */
	items: MenuActionData[]
	/** Accessible label for the trigger. @default 'More options' */
	label?: string
	/** Trigger button variant. @default 'ghost' */
	variant?: ButtonVariant
	/** Trigger button size. @default 'md' */
	size?: FieldControlSize
	/** Trigger icon override — node or registered name. @default three dots */
	icon?: Renderable
	/** Disables the trigger. */
	isDisabled?: boolean
	/** Menu side of the trigger. @default 'below' */
	placement?: MoreMenuPlacement
	/** Menu alignment along the placement axis. @default 'start' */
	alignment?: MoreMenuAlignment
	/** Menu presentation policy. @default 'popover' */
	presentation?: MoreMenuPresentation
	/** Controlled open state. */
	isMenuOpen?: boolean
	/** Reports requested open-state changes. */
	onOpenChange?: (isOpen: boolean) => void
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ---------- PowerSearch (Astryx parity) ----------

// Reuse the shared SearchableItem and SearchSource contracts from Typeahead.

// Operator value kinds — what editor a filter value uses.
/** PowerSearch operator that takes no value (e.g. 'is empty').
 */
export interface EmptyOperatorValue {
	/** Operator carrying no value (e.g. `is_empty`). */
	readonly type: 'empty'
}

/** PowerSearch operator taking one string; `searchSource` supplies completions, `isArbitraryStringAllowed` permits free text.
 */
export interface StringOperatorValue {
	/** String-value operator discriminator. */
	readonly type: 'string'
	/** Provider supplying value suggestions. */
	readonly searchSource?: SearchSource
	/** Permits free-form values outside the suggestion list. */
	readonly isArbitraryStringAllowed?: boolean
}

/** PowerSearch operator taking a string list — `searchSource` completions, `isArbitraryStringAllowed` free entries, `tokenization` paste rules.
 */
export interface StringListOperatorValue {
	/** String-list operator discriminator. */
	readonly type: 'string_list'
	/** Provider supplying value suggestions. */
	readonly searchSource?: SearchSource
	/** Permits free-form values outside the suggestion list. */
	readonly isArbitraryStringAllowed?: boolean
	/** How typed text splits into list tokens. */
	readonly tokenization?: OperatorTokenizationConfig
}

/** PowerSearch operator taking an integer, optionally `minValue`/`maxValue` bounded with `units` label.
 */
export interface IntegerOperatorValue {
	/** Integer-value operator discriminator. */
	readonly type: 'integer'
	/** Minimum accepted value. */
	readonly minValue?: number
	/** Maximum accepted value. */
	readonly maxValue?: number
	/** Unit suffix displayed beside the value. */
	readonly units?: string
}

/** PowerSearch operator taking a float, optionally `minValue`/`maxValue` bounded with `units` label.
 */
export interface FloatOperatorValue {
	/** Float-value operator discriminator. */
	readonly type: 'float'
	/** Minimum accepted value. */
	readonly minValue?: number
	/** Maximum accepted value. */
	readonly maxValue?: number
	/** Unit suffix displayed beside the value. */
	readonly units?: string
}

/** PowerSearch operator taking a wall-clock time string, optionally `minValue`/`maxValue` bounded.
 */
export interface TimeOperatorValue {
	/** Time-value operator discriminator. */
	readonly type: 'time'
	/** Earliest accepted time. */
	readonly minValue?: string
	/** Latest accepted time. */
	readonly maxValue?: string
}

/** PowerSearch operator taking an absolute date — `isDateOnly` drops the time part.
 */
export interface DateAbsoluteOperatorValue {
	/** Absolute-date operator discriminator. */
	readonly type: 'date_absolute'
	/** Date-only editing without a time part. */
	readonly isDateOnly?: boolean
}

/** PowerSearch operator taking a relative date expression — `isPastAllowed`/`isFutureAllowed` gate direction (default both true).
 */
export interface DateRelativeOperatorValue {
	/** Relative-date operator discriminator. */
	readonly type: 'date_relative'
	/** @default true */
	readonly isPastAllowed?: boolean
	/** @default true */
	readonly isFutureAllowed?: boolean
}

/** PowerSearch operator taking a `DateTimeRange` — `intervalDatePresets`/`relativeDatePresets` supply quick picks.
 */
export interface DateRangeOperatorValue {
	/** Date-range operator discriminator. */
	readonly type: 'date_range'
	/** Named fixed-range presets shown in the editor. */
	readonly intervalDatePresets?: ReadonlyArray<DateRangeFilterPreset>
	/** Named relative-range presets (e.g. "last 7 days"). */
	readonly relativeDatePresets?: ReadonlyArray<RelativeDateFilterPreset>
}

/** One fixed choice for enum-valued PowerSearch operators — `value`, `label`, optional `icon`.
 */
export interface EnumItem {
	/** Value committed when the option is chosen. */
	readonly value: string
	/** Text shown for the option. */
	readonly label: string
	/** Icon shown beside the option. */
	readonly icon?: Renderable
}

/** PowerSearch operator taking one `EnumItem.value` from `values`.
 */
export interface EnumOperatorValue {
	/** Single-enum operator discriminator. */
	readonly type: 'enum'
	/** Options the value may take. */
	readonly values: ReadonlyArray<EnumItem>
}

/** PowerSearch operator taking several `EnumItem.value`s from `values`.
 */
export interface EnumListOperatorValue {
	/** Enum-list operator discriminator. */
	readonly type: 'enum_list'
	/** Options the values may take. */
	readonly values: ReadonlyArray<EnumItem>
}

/** PowerSearch operator taking a list of entity picks — `searchSource` resolves them, `tokenization` handles pastes, `renderItem` customizes rows.
 */
export interface EntityListOperatorValue {
	/** Entity-list operator discriminator. */
	readonly type: 'entity_list'
	/** Provider supplying entity suggestions. */
	readonly searchSource?: SearchSource
	/** Permits free-form entries outside the suggestion list. */
	readonly isArbitraryStringAllowed?: boolean
	/** How typed text splits into list tokens. */
	readonly tokenization?: OperatorTokenizationConfig
	/** Renders one entity suggestion row. */
	readonly renderItem?: (item: SearchableItem) => Renderable
}

/** Props for a caller-supplied `CustomOperatorValue.Editor` — the JSON value
 *  string and its change sink inside the filter editor. */
export interface CustomOperatorEditorProps {
	/** Current editor value. */
	value: string
	/** Commits editor value changes. */
	onChange(value: string): void
	/** Text shown while the editor is empty. */
	placeholder?: string
	/** Disables the editor. */
	isDisabled?: boolean
}

/** PowerSearch operator with a caller-supplied editor — `Editor` gets `CustomOperatorEditorProps`; `getString` renders the stored JSON value as token text.
 */
export interface CustomOperatorValue {
	/** Custom operator discriminator — the app supplies the editor. */
	readonly type: 'custom'
	/** Caller editor component: `{value, onChange, placeholder, isDisabled}`. */
	readonly Editor: ElementComponent<CustomOperatorEditorProps>
	/** JSON value → display string for the token. */
	readonly getString: (value: string) => string
}

/** PowerSearch operator taking a nested filter list (`FilterValueNested`).
 */
export interface NestedOperatorValue {
	/** Nested-filter operator discriminator. */
	readonly type: 'nested'
}

/** Union of every PowerSearch operator value kind — discriminated on `type`; determines the editor a filter value uses.
 */
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
/** Stored PowerSearch value: none (empty operators).
 */
export interface FilterValueEmpty {
	/** Empty-value discriminator (operators with no operand). */
	readonly type: 'empty'
}

/** Stored PowerSearch value: one string.
 */
export interface FilterValueString {
	/** String-value discriminator. */
	readonly type: 'string'
	/** The string operand. */
	readonly value: string
}

/** Stored PowerSearch value: a string list.
 */
export interface FilterValueStringList {
	/** String-list discriminator. */
	readonly type: 'string_list'
	/** The string operands. */
	readonly value: ReadonlyArray<string>
}

/** Stored PowerSearch value: an integer.
 */
export interface FilterValueInteger {
	/** Integer-value discriminator. */
	readonly type: 'integer'
	/** The integer operand. */
	readonly value: number
}

/** Stored PowerSearch value: a float.
 */
export interface FilterValueFloat {
	/** Float-value discriminator. */
	readonly type: 'float'
	/** The float operand. */
	readonly value: number
}

/** Stored PowerSearch value: a wall-clock time string.
 */
export interface FilterValueTime {
	/** Time-value discriminator. */
	readonly type: 'time'
	/** The time operand. */
	readonly value: string
}

/** Stored PowerSearch value: an instant as `unixSeconds`.
 */
export interface FilterValueDateAbsolute {
	/** Absolute-date discriminator. */
	readonly type: 'date_absolute'
	/** The instant as Unix seconds. */
	readonly unixSeconds: number
}

/** Stored PowerSearch value: a relative-date expression string.
 */
export interface FilterValueDateRelative {
	/** Relative-date discriminator. */
	readonly type: 'date_relative'
	/** Relative offset descriptor (e.g. "P7D"). */
	readonly value: string
}

/** Stored PowerSearch value: a `DateTimeRange`.
 */
export interface FilterValueDateRange {
	/** Date-range discriminator. */
	readonly type: 'date_range'
	/** The range operand. */
	readonly value: DateTimeRange
}

/** Stored PowerSearch value: one enum `value`.
 */
export interface FilterValueEnum {
	/** Single-enum discriminator. */
	readonly type: 'enum'
	/** The chosen enum value. */
	readonly value: string
}

/** Stored PowerSearch value: enum `value`s.
 */
export interface FilterValueEnumList {
	/** Enum-list discriminator. */
	readonly type: 'enum_list'
	/** The chosen enum values. */
	readonly value: ReadonlyArray<string>
}

/** An entity pick stored in a filter — `id`, `label`, optional `photo`.
 */
export interface PowerSearchEntity {
	/** Stable identity for the entity. */
	readonly id: string
	/** Text shown for the entity. */
	readonly label: string
	/** Avatar/thumbnail URL for the entity. */
	readonly photo?: string
}

/** Stored PowerSearch value: picked `PowerSearchEntity` items.
 */
export interface FilterValueEntityList {
	/** Entity-list discriminator. */
	readonly type: 'entity_list'
	/** The chosen entities. */
	readonly value: ReadonlyArray<PowerSearchEntity>
}

/** Stored PowerSearch value: a custom operator's JSON string.
 */
export interface FilterValueCustom {
	/** Custom-value discriminator. */
	readonly type: 'custom'
	/** The custom operand — interpreted by the app's editor. */
	readonly value: string
}

/** Stored PowerSearch value: a nested `PowerSearchFilter` list.
 */
export interface FilterValueNested {
	/** Nested-filter discriminator. */
	readonly type: 'nested'
	/** Child filters under this node. */
	readonly value: ReadonlyArray<PowerSearchFilter>
}

/** Union of every stored PowerSearch filter value — discriminated on `type`, mirroring `OperatorValue`.
 */
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

/** Paste tokenization for list-valued operators — `regex` splits pasted text, `sort` orders the tokens.
 */
export interface OperatorTokenizationConfig {
	/** Regex applied to pasted text. */
	readonly regex?: string
	/** Sort tokens after tokenizing. */
	readonly sort?: boolean
}

/** One endpoint of a `DateTimeRange` — `NOW`, an `ABSOLUTE` instant (`unixSeconds`), or `RELATIVE` (`backValue`+`unit`, optional `anchorKey`).
 */
export type DateTimeRangePart =
	| { /** Relative-part discriminator (vs an absolute instant). */ readonly type: 'NOW' }
	| { /** Now-anchor discriminator — the part resolves to the current instant. */ readonly type: 'ABSOLUTE'; /** The instant as Unix seconds. */ readonly unixSeconds: number }
	| {
			/** Relative-part discriminator (vs an absolute instant). */
			readonly type: 'RELATIVE'
			/** Magnitude of the backward offset. */
			readonly backValue: number
			/** Time unit the offset counts in. */
			readonly unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
			/** Anchor preset key the offset is relative to. */
			readonly anchorKey?: string
	  }

/** An absolute-or-relative time range — `start`/`end` as `DateTimeRangePart`s; the stored form for `date_range` filters and presets.
 */
export interface DateTimeRange {
	/** Range start part. */
	readonly start: DateTimeRangePart
	/** Range end part. */
	readonly end: DateTimeRangePart
}

/** A named absolute-range quick pick — `label` + `DateTimeRange` value.
 */
export interface DateRangeFilterPreset {
	/** Preset name shown in the editor. */
	readonly label: string
	/** Range the preset resolves to. */
	readonly value: DateTimeRange
}

/** A named relative-range quick pick — `label` + relative expression `value`.
 */
export interface RelativeDateFilterPreset {
	/** Preset name shown in the editor. */
	readonly label: string
	/** Relative offset descriptor the preset resolves to. */
	readonly value: string
}

// Config vocabulary.
/** Shared operator fields — `key` (identity) and `value` (the `OperatorValue` editor kind).
 */
export interface PowerSearchOperatorBase {
	/** Operator id used in filter values. */
	readonly key: string
	/** Value-editor spec for the operator. */
	readonly value: OperatorValue
}

/** Operator with literal label text. */
export interface PowerSearchOperatorWithLabel extends PowerSearchOperatorBase {
	/** Literal display label for the operator. */
	readonly label: string
	/** Unused when `label` is given — the two are exclusive. */
	readonly i18nKey?: never
}

/** Operator whose label resolves through the PowerSearch string catalog —
 *  `@octane-xplat/ui` ships English defaults for the `@astryx.powersearch.*`
 *  keys; a custom catalog key falls back to the key's last segment. */
export interface PowerSearchOperatorWithI18nKey extends PowerSearchOperatorBase {
	/** Message-catalog key for the operator label. */
	readonly i18nKey: string
	/** Unused when `i18nKey` is given — the two are exclusive. */
	readonly label?: never
}

/** A field operator — label inline (`PowerSearchOperatorWithLabel`) or via the i18n catalog (`PowerSearchOperatorWithI18nKey`); never both.
 */
export type PowerSearchOperator = PowerSearchOperatorWithLabel | PowerSearchOperatorWithI18nKey

/** One searchable field — `key`, `label`, its `operators`, `defaultOperator`, `group`/`description`/`typeaheadAliases` for browsing and matching.
 */
export interface PowerSearchField {
	/** Field id used in filter values. */
	readonly key: string
	/** Field name shown in the UI. */
	readonly label: string
	/** Operators available for this field. */
	readonly operators: ReadonlyArray<PowerSearchOperator>
	/** Icon shown beside the field name. */
	readonly icon?: Renderable
	/** Default operator key when the field is picked. */
	readonly defaultOperator?: string
	/** Group label organizing fields in the browse menu. */
	readonly group?: string
	/** Secondary text describing the field. */
	readonly description?: string
	/** Extra strings that match this field in the typeahead. */
	readonly typeaheadAliases?: ReadonlyArray<string>
	/** Minimum query length before this field appears in the menu. */
	readonly typeaheadMinQueryLength?: number
	/** Offer value matches for this field. @default true */
	readonly isValueMatchAllowed?: boolean
}

/** Field/operator schema driving `PowerSearch` — `name`, `fields`, and `contentSearchFieldKey` (the field free text binds to). Build it with `createPowerSearchConfig` to keep `filters`/`onChange` typed to the declared combinations.
 *
 * @see PowerSearchField, PowerSearchOperator, createPowerSearchConfig.
 */
export interface PowerSearchConfig {
	/** Config identity — scopes persistence and labels. */
	readonly name: string
	/** Fields available for filtering. */
	readonly fields: ReadonlyArray<PowerSearchField>
	/** Field key receiving free-text search. */
	readonly contentSearchFieldKey?: string
}

/** One committed filter — `field`/`operator` keys plus a typed `value`; `isReadOnly` blocks editing. With a config from `createPowerSearchConfig`, use `PowerSearchFilterFor<C>` to constrain combinations to the declared schema.
 */
export interface PowerSearchFilter {
	/** Field key the filter applies to. */
	readonly field: string
	/** Operator key applied to the field. */
	readonly operator: string
	/** Operand the operator evaluates. */
	readonly value: FilterValue
	/** Prevent editing this filter. */
	readonly isReadOnly?: boolean
}

/** An in-progress filter inside the editor — `field` required, `operator`/`value` optional until complete.
 */
export interface PartialFilter {
	/** Field key the in-progress filter targets. */
	readonly field: string
	/** Operator key chosen so far. */
	readonly operator?: string
	/** Operand collected so far. */
	readonly value?: FilterValue
	/** Locks the filter for display (no editing). */
	readonly isReadOnly?: boolean
}

/** What a `PowerSearch` `onChange` reports — `'add'`, `'edit'`, or `'remove'`, with the filter index.
 */
export type PowerSearchChangeType = 'add' | 'edit' | 'remove'

/** Imperative typeahead handle exposed through `handleRef`.
 *
 * @see PowerSearchProps.handleRef.
 */
export interface PowerSearchHandle {
	/** Focuses the filter-input field. */
	focusTypeahead(): void
	/** Removes focus from the filter-input field. */
	blurTypeahead(): void
}

/** Suggestion metadata inside `PowerSearchItem.auxiliaryData` — which field/operator/value/filter index an entry refers to, and its browse `group`.
 */
export interface PowerSearchAuxData {
	/** Field key attached to the token. */
	readonly fieldKey: string
	/** Operator key attached to the token. */
	readonly operatorKey?: string
	/** Operand attached to the token. */
	readonly filterValue?: FilterValue
	/** Index of the filter in the applied list. */
	readonly filterIndex?: number
	/** Group the filter belongs to. */
	readonly group?: string
}

/** A `PowerSearch` suggestion row — `SearchableItem` carrying `PowerSearchAuxData`.
 */
export type PowerSearchItem = SearchableItem<PowerSearchAuxData>

/** Size scale for the `PowerSearch` bar — `'sm' | 'md' | 'lg'`.
 */
export type PowerSearchSize = 'sm' | 'md' | 'lg'

/** Props for a custom token pill (`components[type].Token`).
 *
 * @see PowerSearchComponents — supply a `Token` override per operator type.
 */
export interface PowerSearchTokenProps {
	/** Active PowerSearch config. */
	readonly config: PowerSearchConfig
	/** Filter this token represents. */
	readonly filter: PowerSearchFilter
	/** Field definition for the token. */
	readonly field: PowerSearchField
	/** Operator definition for the token. */
	readonly operator: PowerSearchOperator
	/** Label length cap before truncation. */
	readonly maxLength: number
	/** Fires on token activation (opens the editor). */
	readonly onPress?: () => void
	/** Fires on the remove affordance. */
	readonly onRemove?: () => void
	/** Dims the token and blocks interaction. */
	readonly isDisabled?: boolean
	/** IANA zone used to render date operands. */
	readonly timezoneID?: string
}

/** Props for a custom filter editor (`components[type].Editor`). */
export interface PowerSearchEditorProps {
	/** Active PowerSearch config. */
	readonly config: PowerSearchConfig
	/** In-progress filter being edited. */
	readonly filter: PartialFilter
	/** `create` starts a new filter; `edit` modifies an existing one. */
	readonly mode: 'create' | 'edit'
	/** Commits the filter — null removes it. */
	readonly onSave: (filter: PowerSearchFilter | null) => void
	/** Abandons the edit. */
	readonly onCancel: () => void
	/** Label for the commit button. */
	readonly saveButtonLabel?: string
	/** Renders the editor for display only. */
	readonly isReadOnly?: boolean
	/** IANA zone used to render date operands. */
	readonly timezoneID?: string
}

/** Props for `PowerSearchFilterEditor` — the default filter editor and the
 *  same contract `components[type].Editor` overrides receive. */
export type PowerSearchFilterEditorProps = PowerSearchEditorProps

/** Per-operator-type component overrides — `Token` (the filter pill) and/or `Editor` (the popover editor).
 */
export interface PowerSearchComponentOverride {
	/** Component replacing the default token renderer. */
	readonly Token?: ElementComponent<PowerSearchTokenProps>
	/** Component replacing the default filter editor. */
	readonly Editor?: ElementComponent<PowerSearchEditorProps>
}

/** `PowerSearch.components` — maps an `OperatorValue['type']` to its `Token`/`Editor` overrides.
 */
export type PowerSearchComponents = Partial<
	Record<OperatorValue['type'], PowerSearchComponentOverride>
>

/** Structured filter bar — pick a field, then operator and value in the
 *  editor popover; committed filters render as removable, editable tokens.
 *  A `config` built by `createPowerSearchConfig` carries its field
 *  definitions, so `filters`/`onChange` only accept field/operator/value
 *  combinations the config declares (see `PowerSearchFilterFor`); a
 *  hand-built `PowerSearchConfig` keeps the loose `PowerSearchFilter`.
 *
 * @example
 * ```tsx
 * import { PowerSearch, createPowerSearchConfig } from '@octane-xplat/ui'
 *
 * const { config } = createPowerSearchConfig([
 * 	{ key: 'name', type: 'string', label: 'Name' },
 * 	{ key: 'status', type: 'enum', label: 'Status', enumValues: [{ value: 'open', label: 'Open' }] },
 * ] as const)
 *
 * <PowerSearch config={config} filters={filters} onChange={(next) => setFilters(next)} />
 * ```
 * @see PowerSearchConfig, PowerSearchFilterFor, PowerSearchComponents.
 */
export interface PowerSearchProps<
	C extends PowerSearchConfig = PowerSearchConfig,
> extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Status layout: overlaps the field below it or occupies its own row. */
	statusVariant?: 'attached' | 'detached'
	/** Field/operator configuration. */
	config: C
	/** Active filters (controlled). */
	filters: ReadonlyArray<PowerSearchFilterFor<C>>
	/** Fires on add/edit/remove with the change type and filter index. */
	onChange: (
		/** Current filter list — notified through this callback. */
		filters: ReadonlyArray<PowerSearchFilterFor<C>>,
		/** What kind of edit produced the change. */
		changeType: PowerSearchChangeType,
		/** Index of the filter the change applied to. */
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
	/** Fires when the search field gains focus. */
	onFocus?: () => void
	/** Fires when the search field loses focus. */
	onBlur?: () => void
	/** Per-operator-value-type Token/Editor component overrides. */
	components?: PowerSearchComponents
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Simplified field definitions → `createPowerSearchConfig`. */
export interface FieldDefinition<
	K extends string = string,
	T extends PowerSearchFieldType = PowerSearchFieldType,
> {
	/** Field id used in filter values. */
	readonly key: K
	/** Field type — selects the JS value type and generated operators. */
	readonly type: T
	/** Field name shown in the UI. */
	readonly label?: string
	/** Required for 'enum'/'enum_list'. */
	readonly enumValues?: ReadonlyArray<EnumItem>
}

/** Field kinds `createPowerSearchConfig` accepts — string, number, boolean, date, enum, enum_list, string_list.
 */
export type PowerSearchFieldType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'date'
	| 'enum'
	| 'enum_list'
	| 'string_list'

/** Maps a `PowerSearchFieldType` to its stored JS value type — drives `InferData` and typed filter values.
 */
export type PowerSearchFieldTypeToJS = {
	/** JS value type for `string` fields. */
	string: string
	/** JS value type for `number` fields. */
	number: number
	/** JS value type for `boolean` fields. */
	boolean: boolean
	/** JS value type for `date` fields (Date or epoch ms). */
	date: Date | number
	/** JS value type for `enum` fields. */
	enum: string
	/** JS value type for `enum_list` fields. */
	enum_list: ReadonlyArray<string>
	/** JS value type for `string_list` fields. */
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
	/** Field key captured for narrowing. */
	readonly key: infer K extends string
	/** Field type captured for narrowing. */
	readonly type: infer T extends PowerSearchFieldType
}
	? (T extends 'string'
			? {
					/** Field key constrained to this definition. */
					readonly field: K
					/** Operators valid for this field type. */
					readonly operator:
						| 'contains'
						| 'not_contains'
						| 'starts_with'
						| 'not_starts_with'
						| 'ends_with'
						| 'not_ends_with'
						| 'is'
						| 'is_not'
					/** Operand shape for the field/operator pair. */
					readonly value: FilterValueString
				}
			: T extends 'number'
				? {
						/** Field key constrained to this definition. */
						readonly field: K
						/** Numeric comparison operators for this field type. */
						readonly operator:
							| 'equals'
							| 'not_equals'
							| 'greater_than'
							| 'less_than'
							| 'greater_than_or_equal'
							| 'less_than_or_equal'
						/** Numeric operand for the field/operator pair. */
						readonly value: FilterValueFloat | FilterValueInteger
					}
				: T extends 'boolean'
					? {
							/** Field key constrained to this definition. */
							readonly field: K
							/** Operators valid for this field type. */
							readonly operator: 'is_true' | 'is_false'
							/** Empty operand — boolean operators take no value. */
							readonly value: FilterValueEmpty
						}
					: T extends 'date'
						?
								| {
										/** Field key constrained to this definition. */
										readonly field: K
										/** Numeric comparison operators for this field type. */
										readonly operator: 'before' | 'after'
										/** Absolute-date operand for the field/operator pair. */
										readonly value: FilterValueDateAbsolute
								  }
								| {
										/** Field key constrained to this definition. */
										readonly field: K
										/** Boolean-state operators for this field type. */
										readonly operator: 'between'
										/** Date-range operand for the field/operator pair. */
										readonly value: FilterValueDateRange
								  }
						: T extends 'enum'
							? {
									/** Field key constrained to this definition. */
									readonly field: K
									/** Date ordering operators for this field type. */
									readonly operator: 'is' | 'is_not'
									/** Single-enum operand narrowed to the field's values. */
									readonly value: { /** Field type captured for narrowing. */ readonly type: 'enum'; /** Operand shape for the field/operator pair. */ readonly value: EnumValuesOf<D> }
								}
							: T extends 'enum_list'
								? {
										/** Field key constrained to this definition. */
										readonly field: K
										/** Range operator for this field type. */
										readonly operator: 'is_any_of' | 'is_none_of'
										/** Enum-list operand narrowed to the field's values. */
										readonly value: {
											/** Field type captured for narrowing. */
											readonly type: 'enum_list'
											/** Enum values narrowed to the field's options. */
											readonly value: ReadonlyArray<EnumValuesOf<D>>
										}
									}
								: T extends 'string_list'
									? {
											/** Field key constrained to this definition. */
											readonly field: K
											/** Enum equality operators for this field type. */
											readonly operator: 'is_any_of' | 'is_none_of'
											/** String-list operand for the field/operator pair. */
											readonly value: FilterValueStringList
										}
									: never) & { readonly isReadOnly?: boolean }
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

/** Resolved color scheme — `'light' | 'dark'`. See `useColorScheme`/`getColorScheme` for reading it and `setThemePreference` for the user's preference.
 */
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
 *  `ClassValue`, keyed objects are not allowed: an object map declares an
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
	/** Classes always applied by the styled component. */
	base?: StyledClass
	/** Variant name → option → class map. */
	variants?: V
	/** Variant selection used when the prop is omitted. */
	defaultVariants?: StyledVariantSelection<V>
}

// ---------- stores ----------

/** The value a store read hands out — readonly, because mutating it would
 *  bypass the store and leave subscribers stale. Arrays become
 *  `readonly T[]`, maps `ReadonlyMap`, sets `ReadonlySet`; other values get
 *  readonly properties. Write through the store's own methods instead. */
export type StoreSnapshot<T> =
	T extends ReadonlyMap<infer K, infer V>
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
	/** Current store snapshot for external reads. */
	getSnapshot(): StoreSnapshot<T>
	/** Subscribes to store changes; returns an unsubscribe. */
	subscribe(notify: () => void): () => void
}

/** A writable reactive store (from `createStore`) — `ReadableStore` plus `set(value)` for assignment and `update(fn)` for computed writes. Reads through `useStore` stay reactive on every target.
 *
 * @example
 * ```ts
 * import { createStore, useStore } from '@octane-xplat/ui'
 *
 * const count = createStore(0)
 * count.update((n) => n + 1)
 * // in a component:
 * const n = useStore(count)
 * ```
 * @see ReadableStore, StoreSnapshot, createStore.
 */
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
export type MultiSelectorProps = Omit<SelectMultipleProps, 'selectionMode'> & {
	/** Multi-select discriminator — `multiple` fixes this variant. */
	selectionMode?: 'multiple'
}

/** Props accepted by `Breadcrumbs`. */
export type BreadcrumbsProps<
	Contracts = RegisteredRouteContracts,
	Stacks extends string = keyof AppRouteStacks & string,
	Transitions extends string = RouteTransitionName,
> = BreadcrumbProps<Contracts, Stacks, Transitions>

/** Props accepted by `TreeList`. */
export type TreeListProps<T extends TreeListNode = TreeListNode> = TreeProps<T>
/** Props accepted by `EmptyState`. */
export type EmptyStateProps = EmptyProps
/** Props accepted by `Spinner`. */
export type SpinnerProps = ActivityIndicatorProps

// ---------- content display (Astryx parity) ----------

/** Semantic text roles — the Astryx `type` axis (shared by `Text`, Timestamp,
 *  Timer). `inherit` adopts the surrounding text's metrics. */
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

/** Semantic text colors — the Astryx `color` axis (`placeholder` shares the
 *  secondary token upstream). */
export type TextColor = 'primary' | 'secondary' | 'disabled' | 'placeholder' | 'accent' | 'inherit'

/** Font weight axis — the `--font-weight-*` token suffix. */
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'

/** Blockquote — styled quotation with optional `cite` attribution.
 *
 * @example
 * ```tsx
 * import { Blockquote } from '@octane-xplat/ui'
 *
 * <Blockquote cite="Design notes">{quote}</Blockquote>
 * ```
 */
export interface BlockquoteProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Attribution rendered after the quoted content (`<cite>` on web). */
	cite?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Text color for `Code`, mirroring the primary/secondary/inherit subset. */
export type CodeColor = 'primary' | 'secondary' | 'inherit'

/** Font size for `Code` — `'inherit'` adopts the surrounding text metrics. */
export type CodeSize = 'inherit'

/** Code — inline monospace run. Standalone renders a mono chip; nested
 *  inside `Text`/`RichText` it stays an inline run on every target.
 *
 * @example
 * ```tsx
 * import { Code, Text } from '@octane-xplat/ui'
 *
 * <Text>Run <Code>pnpm dev</Code> to start.</Text>
 * ```
 * @see CodeBlockProps for multi-line display.
 */
export interface CodeProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** @default 'primary' */
	color?: CodeColor
	/** `'inherit'` adopts the surrounding text's font-size and line-height. */
	size?: CodeSize
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One syntax token. start/end are UTF-16 code-unit offsets relative to
 * its line; start is inclusive and end is exclusive. */
export interface SyntaxToken {
	/** Token classification from the code tokenizer. */
	type: import('./markdown/code-tokenizer').SyntaxTokenType
	/** Start offset in the source string. */
	start: number
	/** End offset in the source string. */
	end: number
}

/** Per-line token structure returned by `tokenize`/`tokenizeAsync`. */
export type TokenLine = SyntaxToken[]

/** A custom token with inclusive start/exclusive end UTF-16 offsets in the
 * complete source (including newlines), rather than offsets in one line. */
export interface CodeToken {
	/** Token classification from the code tokenizer. */
	type: import('./markdown/code-tokenizer').SyntaxTokenType
	/** Start offset in the source string. */
	start: number
	/** End offset in the source string. */
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
	/** Theme name the override applies to. */
	name?: string
	/** Token-type → color map; tuple gives [light, dark]. */
	tokens: Record<string, string | [light: string, dark: string]>
}

/** CodeBlock — read-only syntax-highlighted code display.
 *
 * @example
 * ```tsx
 * import { CodeBlock } from '@octane-xplat/ui'
 *
 * <CodeBlock code={source} language="typescript" title="example.ts" hasLineNumbers />
 * ```
 * @see CodeTokenizer, SyntaxThemeOverride.
 */
export interface CodeBlockProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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
	/** Enables the `accent` variant. */
	accent: true
	/** Enables the `success` variant. */
	success: true
	/** Enables the `warning` variant. */
	warning: true
	/** Enables the `neutral` variant. */
	neutral: true
	/** Enables the `error` variant. */
	error: true
}

/** `ProgressBar` tone — keys of `ProgressBarVariantMap` (accent/success/warning/neutral/error); augment the map to add variants.
 */
export type ProgressBarVariant = keyof ProgressBarVariantMap

/** ProgressBar — linear determinate or indeterminate progress. `Meter` stays
 *  the ring form; this is the bar.
 *
 * @example
 * ```tsx
 * import { ProgressBar } from '@octane-xplat/ui'
 *
 * <ProgressBar label="Uploading" value={done} max={total} hasValueLabel />
 * ```
 * @see MeterProps for a static gauge, ProgressGroupProps.
 */
export interface ProgressBarProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	ref?: Octane.Ref<object>
	/** Groups the bar into a single accessibility element on native. */
	accessible?: boolean
	/** Accessible name for the progress bar. */
	accessibilityLabel?: string
	/** Describes the progress meaning; announced after the label. */
	accessibilityHint?: string
	/** Value text reported to assistive technology (e.g. "45%"). */
	accessibilityValue?: string
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** StatusDot variant names — extendable via module augmentation. */
export interface StatusDotVariantMap {
	/** Enables the `success` variant. */
	success: true
	/** Enables the `warning` variant. */
	warning: true
	/** Enables the `error` variant. */
	error: true
	/** Enables the `accent` variant. */
	accent: true
	/** Enables the `neutral` variant. */
	neutral: true
}

/** `StatusDot` tone — keys of `StatusDotVariantMap` (success/warning/error/accent/neutral); augment the map to add variants.
 */
export type StatusDotVariant = keyof StatusDotVariantMap

/** StatusDot — small colored status signal.
 *
 * @example
 * ```tsx
 * import { StatusDot } from '@octane-xplat/ui'
 *
 * <StatusDot variant="success" label="Operational" />
 * ```
 */
export interface StatusDotProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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

/** Units for numeric `Timestamp.value`. */
export type TimestampValueUnit = 'unix-seconds' | 'unix-milliseconds'

/** Shared display props for the two explicit Timestamp value forms. */
export interface TimestampBaseProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
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
	autoThresholdSeconds?: number
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Timestamp — human-readable instant with relative/absolute formats.
 *
 * @example
 * ```tsx
 * import { Timestamp } from '@octane-xplat/ui'
 *
 * <Timestamp value={createdAt} format="relative" isLive />
 * ```
 * @see TimestampFormat, TimestampTooltipEntry, TimestampValueUnit. ISO values
 *  must carry a timezone; numeric values require an explicit unit.
 */
export type TimestampProps = TimestampBaseProps &
	(
		| { /** Timestamp as an ISO instant string. */ value: ISOInstantString; /** Unused with ISO strings — the unit only applies to numeric values. */ valueUnit?: never }
		| { /** Timestamp as a number in `valueUnit`. */ value: number; /** Unit for the numeric timestamp (s/ms/etc.). */ valueUnit: TimestampValueUnit }
	)

/** Timer duration text modes: 'elapsed' = "4m 05s" / 'clock' = "4:05". */
export type TimerFormat = 'elapsed' | 'clock'

/** Timer — live elapsed duration since `startTimeMs` (or mount).
 *
 * @example
 * ```tsx
 * import { Timer } from '@octane-xplat/ui'
 *
 * <Timer startTimeMs={startedAt} format="elapsed" />
 * ```
 * @see TimestampProps — `startTimeMs` and generated timestamps use Unix milliseconds.
 */
export interface TimerProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Unix time in milliseconds when the measured operation began. Omit to
	 *  count from this Timer's mount. */
	startTimeMs?: number
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One cited source for `Citation`. */
export interface CitationSource {
	/** Source title shown in the citation. */
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

/** Citation — a superscript number or labelled chip referencing a source.
 *
 * @example
 * ```tsx
 * import { Citation } from '@octane-xplat/ui'
 *
 * <Citation number={1} source={{ title: 'Spec', url: 'https://example.com/spec' }} />
 * ```
 * @see CitationSource.
 */
export interface CitationProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Source the citation points to. */
	source: CitationSource
	/** Footnote number rendered. */
	number: number
	/** 'label' (icon + title chip, default) or 'number' (accent pill). */
	variant?: 'label' | 'number'
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** How `MetadataList` places each item's label. */
export interface MetadataListLabelConfig {
	/** 'start' = beside the value; 'top' = stacked above it. */
	position: 'start' | 'top'
	/** Custom label column width (dips or CSS length); 'start' only. */
	width?: number | string
}

/** `MetadataList` column policy — `'single'` (default), `'multi'` (auto-fill), or a fixed column count.
 */
export type MetadataListColumns = 'multi' | 'single' | number

/** MetadataList — read-only labeled key/value list (definition list).
 *
 * @example
 * ```tsx
 * import { MetadataList, MetadataListItem } from '@octane-xplat/ui'
 *
 * <MetadataList title="Details">
 * 	<MetadataListItem label="Created">{created}</MetadataListItem>
 * 	<MetadataListItem label="Owner">{owner}</MetadataListItem>
 * </MetadataList>
 * ```
 * @see MetadataListItemProps, MetadataListColumns.
 */
export interface MetadataListProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** One label/value row inside a `MetadataList`.
 *
 * @see MetadataListProps — render inside it.
 */
export interface MetadataListItemProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Label text for this item. */
	label: string
	/** Icon node rendered before the label text. */
	icon?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Thumbnail — square image preview with loading/error/remove states.
 *
 * @example
 * ```tsx
 * import { Thumbnail } from '@octane-xplat/ui'
 *
 * <Thumbnail src={file.preview} label={file.name} onPress={open} onRemove={remove} />
 * ```
 */
export interface ThumbnailProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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

/** Native-view outline discovery support returned by
 *  `getOutlineFromViewCapabilities()`. Supported targets return a snapshot;
 *  unsupported targets should use portable document data or explicit items. */
export interface OutlineFromViewCapabilities {
	/** Whether this target can read `Heading` semantics from its native tree. */
	isSupported: boolean
	/** `snapshot` reads the tree once; `unsupported` cannot identify headings. */
	mode: 'snapshot' | 'unsupported'
}

/** Outline — table-of-contents nav with a sliding active indicator. Item
 *  derivation is split by mechanism: `useOutlineFromMarkdown` and
 *  `useOutlineFromDoc` are portable; `useOutlineFromDOM` (live DOM
 *  observation) is web-only under `@octane-xplat/ui/web`; `useOutlineFromView`
 *  ships under NativeScript and macOS subpaths. Check
 *  `getOutlineFromViewCapabilities()` before using native-view discovery;
 *  macOS snapshots require the renderer heading-reader bridge.
 *
 * @example
 * ```tsx
 * import { Outline, useOutlineFromMarkdown } from '@octane-xplat/ui'
 *
 * const items = useOutlineFromMarkdown(doc)
 * <Outline items={items} activeId={active} onActiveIdChange={setActive} />
 * ```
 * @see OutlineItem, OutlineFromViewCapabilities — item derivation is
 *  platform-specific while the resulting data stays portable.
 */
export interface OutlineProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
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
	scrollContainerRef?: { /** Live slot for the host element; unset until bound. */ current?: HostElement | null }
	/** Whether activating an item smooth-scrolls to it. Set false to own
	 *  scrolling yourself — activation still updates the active item, the
	 *  URL fragment (web), and the navigate callbacks. @default true */
	hasScrollOnClick?: boolean
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

// ---------- markdown ----------

/** One inline run inside a Markdown paragraph/heading/list/quote — the
 *  serialized shape `xplat routes` bakes for `.md` routes and the runtime
 *  `text` parser emits.
 *
 * @see MdDoc — canonical import '@octane-xplat/ui/markdown'.
 */
export type MdInline =
	| { /** Text-node tag. */ t: 'text'; /** Literal text content. */ text: string }
	| { /** Inline-code tag. */ t: 'code'; /** Code content — not re-parsed. */ text: string }
	| { /** Bold tag. */ t: 'bold'; /** Nested inline content. */ children: MdInline[] }
	| { /** Emphasis tag. */ t: 'em'; /** Nested inline content. */ children: MdInline[] }
	| { /** Strikethrough tag. */ t: 'strike'; /** Nested inline content. */ children: MdInline[] }
	| { /** Link tag. */ t: 'link'; /** Link text. */ text: string; /** Link destination. */ href: string }

/** One block in a Markdown doc. `MdNode` covers what the renderer lowers to
 *  shared primitives; `MdInline` covers text runs inside paragraphs, lists,
 *  and quotes.
 *
 * @see MdDoc, MdInline — canonical import '@octane-xplat/ui/markdown'.
 */
export type MdNode =
	| { /** Table-node tag. */ t: 'h'; /** Heading level 1–6. */ depth: 1 | 2 | 3 | 4 | 5 | 6; children: MdInline[] }
	| { /** Heading tag. */ t: 'p'; children: MdInline[] }
	| { /** Paragraph tag. */ t: 'code'; /** Language hint for syntax highlighting. */ lang?: string; /** Raw code content. */ text: string }
	| { /** Code-block tag. */ t: 'list'; /** Ordered (numbered) vs unordered list. */ ordered: boolean; /** List items — each an array of inline content. */ items: MdInline[][]; /** Task-list checkbox state per item; null = not a task item. */ checked?: (boolean | null)[] }
	| {
			/** Table-node tag. */
			t: 'table'
			/** Header-cell inline content, one entry per column. */
			header: MdInline[][]
			/** Body rows — each an array of cell inline content. */
			rows: MdInline[][][]
			/** Per-column alignment from the delimiter row. */
			align: ('left' | 'center' | 'right')[]
	  }
	| { /** List tag. */ t: 'quote'; children: MdInline[] }
	| { /** Blockquote tag. */ t: 'hr' }

/** A parsed Markdown document — the versioned AST (`kind: 'octane-xplat/md'`, `v: 1`) produced by `parseMdDoc`/`createMarkdownStreamParser` and consumed by `Markdown`'s `data` prop. Canonical import: `@octane-xplat/ui/markdown` (root re-export is a migration alias).
 *
 * @see MdNode, MdInline, MarkdownDataProps.
 */
export interface MdDoc {
	/** Document kind tag for the serialized markdown format. */
	kind: 'octane-xplat/md'
	/** Format version — always 1. */
	v: 1
	/** Top-level markdown nodes. */
	children: MdNode[]
}

/** `Markdown` with a pre-parsed document — the `MdDoc` AST baked by route
 *  codegen (`routes.gen.data` for a `.md` route). No parser ships in the
 *  bundle for this source, so `isStreaming`/`fadeIn` do not apply.
 *
 * @see MarkdownProps — the union this feeds; canonical import '@octane-xplat/ui/markdown'.
 */
export interface MarkdownDataProps {
	/** Pre-parsed document — skips the tokenizer. */
	data: MdDoc
	/** Unused with `data` — the two sources are exclusive. */
	text?: never
	/** Unused with `data` — the two sources are exclusive. */
	isStreaming?: never
	/** Unused with `data` — the two sources are exclusive. */
	fadeIn?: never
}

/** `Markdown` with raw source parsed at runtime by the package's built-in
 *  subset parser (see docs/content-display.md for the grammar).
 *
 * @see MarkdownProps — the union this feeds; canonical import '@octane-xplat/ui/markdown'.
 */
export interface MarkdownTextProps {
	/** Markdown source parsed and rendered. */
	text: string
	/** Unused with `text` — the two sources are exclusive. */
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
 *  runtime).
 *
 * @example
 * ```tsx
 * import { Markdown } from '@octane-xplat/ui/markdown'
 *
 * <Markdown text={source} isStreaming />
 * // or a pre-parsed doc (e.g. a baked .md route):
 * <Markdown data={doc} />
 * ```
 * @see MarkdownDataProps, MarkdownTextProps, createMarkdownStreamParser.
 */
export interface MarkdownPresentationProps {
	/** Compact paragraph/block spacing for assistant responses. */
	density?: 'default' | 'compact'
	/** Minimum heading level (1..6). Markdown heading depths are shifted accordingly. */
	headingLevelStart?: 1 | 2 | 3 | 4 | 5 | 6
	/** Citation ids referenced as [id] in text. Unknown ids remain literal. */
	sources?: Record<string, CitationSource>
}

export type MarkdownProps = (MarkdownDataProps | MarkdownTextProps) & MarkdownPresentationProps

/** `MarkdownScreen` — the route screen codegen mounts for `.md` route
 *  files; `data` is the route's baked doc (like any route loader result)
 *  and `error` a load failure surfaced to the screen.
 *
 * @see MarkdownProps — canonical import '@octane-xplat/ui/markdown'.
 */
export interface MarkdownScreenProps {
	/** Parsed document for the screen to render. */
	data?: MdDoc
	/** Load/parse failure shown instead of the document. */
	error?: unknown
}

// ---------- Astryx parity: layout containers ----------

/** `Center` — flex centering on the main axis (`horizontal` → justify),
 *  cross axis (`vertical` → align-items), or `both` (default). `isInline`
 *  renders `inline-flex` on web; native containers are always block-level,
 *  so it is inert there. */
export type CenterAxis = 'both' | 'horizontal' | 'vertical'

/** `Center` — centers children on `axis` ('both' default, or 'horizontal'/'vertical'); `isInline` renders inline-flex on web (inert on native). Carries the stack padding/size props.
 *
 * @example
 * ```tsx
 * import { Center } from '@octane-xplat/ui'
 *
 * <Center axis="both">{content}</Center>
 * ```
 * @see StackProps.
 */
export interface CenterProps extends StackPaddingProps, StackSizeProps, AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** @default 'both' */
	axis?: CenterAxis
	/** Renders as an inline-level box instead of a block. */
	isInline?: boolean
}

/** `Section` — a banded container with a surface/transparent/muted
 *  background, spacing-scale padding, and optional edge dividers. */
export type SectionVariant = 'section' | 'transparent' | 'muted'
/** Edge a `Section` divider paints on — physical `top`/`bottom` or logical `start`/`end` (native maps them to left/right).
 */
export type SectionDividerSide = 'top' | 'bottom' | 'start' | 'end'

/** `Section` — a banded container: `variant` picks the background ('section' default, 'transparent', 'muted'), `padding` is spacing steps (default 4 = 16px), `dividers` paint hairlines on the given edges.
 *
 * @example
 * ```tsx
 * import { Section } from '@octane-xplat/ui'
 *
 * <Section variant="muted" padding={6} dividers={['top']}>
 * 	{content}
 * </Section>
 * ```
 * @see SectionVariant, SectionDividerSide.
 */
export interface SectionProps extends StackPaddingProps, StackSizeProps, AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** @default 'section' */
	variant?: SectionVariant
	/** 'start'/'end' are logical edges — on native they map to left/right. */
	dividers?: SectionDividerSide[]
	/** @default 4 (16px) */
	padding?: SpacingStep
}

/** `Layout` height behavior — `'fill'` fills the container height and
 *  `LayoutContent` scrolls internally; `'auto'` grows with content so the
 *  host (page or parent scroller) scrolls. */
export type LayoutHeight = 'fill' | 'auto'

/** ARIA landmark roles `LayoutHeader`/`LayoutContent` accept — the same set
 *  `useLandmark` registers. */
export type LayoutRole =
	| 'main'
	| 'navigation'
	| 'search'
	| 'form'
	| 'region'
	| 'banner'
	| 'contentinfo'
	| 'complementary'

/** `Layout` — Astryx's five-slot region primitive: `header`, logical `start`
 *  and `end` panels, `content`, and `footer`. Slots take arbitrary content;
 *  the `LayoutHeader`/`LayoutContent` region components carry the matching
 *  anatomy (padding collapse, divider, scroll containment). `children` is a
 *  shorthand for `content`; `content` wins when both are given. `padding`
 *  sets the layout's outer-edge padding (`--layout-padding-outer-*` on web)
 *  that header/content read as their container-edge defaults.
 *
 * @example
 * ```tsx
 * import { Layout, LayoutHeader, LayoutContent, Heading } from '@octane-xplat/ui'
 *
 * <Layout
 * 	header={<LayoutHeader hasDivider padding={6}><Heading level={1}>Title</Heading></LayoutHeader>}
 * 	content={<LayoutContent padding={6}>{body}</LayoutContent>}
 * />
 * ```
 * @see LayoutHeaderProps, LayoutContentProps.
 */
export interface LayoutProps extends AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Shorthand for the `content` slot — `content` wins when both are set. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Top region — typically a `LayoutHeader`. */
	header?: Renderable
	/** Logical-start panel (left in LTR). */
	start?: Renderable
	/** Center region — typically a `LayoutContent`. */
	content?: Renderable
	/** Logical-end panel (right in LTR). */
	end?: Renderable
	/** Bottom region. */
	footer?: Renderable
	/** Maximum width of the aligned content across the middle lane and the
	 *  region insets; numbers are px/dips, strings are CSS lengths on web.
	 *  The web leaf keeps `LayoutContent`'s scrollport full width and aligns
	 *  its children internally when the value can share a CSS arithmetic
	 *  basis (Astryx's edge-scrolling path); native/macOS constrain the
	 *  middle lane instead. */
	contentWidth?: SizeValue
	/** @default 'fill' */
	height?: LayoutHeight
	/** Outer-edge padding in spacing steps — header/footer/content read it as
	 *  the padding on edges that touch the layout's boundary. `0` docks every
	 *  region against the layout edges. */
	padding?: SpacingStep
	/** Default divider visibility for `LayoutHeader` (and a future
	 *  `LayoutFooter`) children that don't pass `hasDivider` explicitly.
	 *  @default false */
	defaultHasDividers?: boolean
}

/** `LayoutHeader` — the `header` region of `Layout`: a fixed top band whose
 *  inner box owns the padding (`--layout-padding-outer-*` on edges that
 *  touch the layout boundary, inner padding below) plus an optional
 *  block-end divider. `hasDivider` falls back to the parent Layout's
 *  `defaultHasDividers`, then false.
 *
 * @example
 * ```tsx
 * <LayoutHeader hasDivider padding={6}><Heading level={1}>Settings</Heading></LayoutHeader>
 * ```
 * @see LayoutProps.
 */
export interface LayoutHeaderProps extends StackSizeProps, AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Themed hairline on the block-end edge. @default false (or the parent
	 *  Layout's `defaultHasDividers`). */
	hasDivider?: boolean
	/** Internal padding in spacing steps — overrides the layout-provided
	 *  outer/inner padding on all four edges. `0` docks children on the
	 *  header's edges (e.g. a TopNav that manages its own padding). */
	padding?: SpacingStep
	/** Block-end padding override — wins over `padding` on that edge only, so
	 *  a tab strip's underline can meet `hasDivider` with no margin hacks. */
	paddingBlockEnd?: SpacingStep
	/** Accessible label for the landmark — required when `role` is set and
	 *  multiple landmarks of the same type exist. `accessibilityLabel` wins
	 *  when both are given. */
	label?: string
	/** ARIA landmark role on web ('banner' only for site-wide headers, not in
	 *  nested layouts); native leaves have no landmark concept and ignore it. */
	role?: LayoutRole
}

/** `LayoutContent` — the `content` region of `Layout`: the scrollable main
 *  area with context-aware padding (layout outer padding on edges that
 *  touch the layout boundary, inner padding otherwise) and `isScrollable`
 *  scroll containment on web and a scroll host on native/macOS.
 *
 * @example
 * ```tsx
 * <LayoutContent padding={6}>{body}</LayoutContent>
 * ```
 * @see LayoutProps.
 */
export interface LayoutContentProps extends StackSizeProps, AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Internal padding in spacing steps — overrides the layout-provided
	 *  outer/inner padding on all four edges. `0` gives edge-to-edge content. */
	padding?: SpacingStep
	/** Scrollable overflow for the content area. `false` clips instead —
	 *  for `height="auto"` layouts where sticky children must reach the
	 *  parent scroller. @default true */
	isScrollable?: boolean
	/** Accessible label for the landmark — `accessibilityLabel` wins when
	 *  both are given. */
	label?: string
	/** ARIA landmark role on web ('main' only for the primary page content);
	 *  native leaves have no landmark concept and ignore it. */
	role?: LayoutRole
}

/** `LayoutFooter` — the `footer` region of `Layout`: fixed bottom band for
 *  actions/status; `hasDivider` paints a block-start hairline (falls back to
 *  the parent Layout's `defaultHasDividers`). Padding resolves like
 *  `LayoutHeader` (outer channel on boundary edges). */
export interface LayoutFooterProps extends StackSizeProps, AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Themed hairline on the block-start edge. @default false */
	hasDivider?: boolean
	/** Internal padding in spacing steps; `0` docks children on the edges. */
	padding?: SpacingStep
	/** Accessible landmark label — `accessibilityLabel` wins when both set. */
	label?: string
	/** ARIA landmark role on web ('contentinfo' only for site-wide footers). */
	role?: LayoutRole
}

/** `LayoutPanel` — a fixed-width side panel for `Layout`'s `start`/`end`
 *  slots (Astryx). `hasDivider` paints the edge facing the content lane;
 *  `resizable` accepts the `useResizable` handle's `props` bag so an adjacent
 *  `ResizeHandle` drives `width`. */
export interface LayoutPanelProps extends StackSizeProps, AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Hairline on the edge facing the content lane. @default false */
	hasDivider?: boolean
	/** Internal padding in spacing steps (outer channel applies). */
	padding?: SpacingStep
	/** Scrollable overflow. @default true */
	isScrollable?: boolean
	/** Which layout slot this panel mounts in — auto-detected from `Layout`
	 *  slot context; pass to render a panel outside a Layout. */
	area?: 'start' | 'end'
	/** `useResizable` props bag — overrides `width` with the live size. */
	resizable?: ResizableProps
	/** Accessible landmark label. */
	label?: string
	/** ARIA landmark role on web ('navigation'/'complementary' for top-level). */
	role?: LayoutRole
}

/** `VisuallyHidden` — children stay in the accessibility tree but render
 *  invisible. No className/style: styling a hidden node is a mistake. On
 *  native there is no offscreen-a11y primitive; the leaf renders a 1dip,
 *  opacity-0 container (screen-reader exposure is best-effort).
 *
 * @example
 * ```tsx
 * import { VisuallyHidden } from '@octane-xplat/ui'
 *
 * <VisuallyHidden>Results update as you type</VisuallyHidden>
 * ```
 */
export interface VisuallyHiddenProps extends AccessibilityProps {
	/** Content rendered inside the element. */
	children?: Renderable
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Web element tag — 'span' (default) for inline labels, 'div' for block
	 *  content / live regions. Native ignores it. */
	as?: ElementType
}

/** Per-target support for `FocusScope` behavior, read through
 *  `getFocusScopeCapabilities()`. Web honors containment, autofocus, and
 *  restoration but does not stack nested scopes. AppKit implements all four
 *  when its native bridge is available; the default mobile leaf is inert.
 *  Capability presence is separate from actual OS-input qualification. */
export interface FocusScopeCapabilities {
	/** Tab/Shift+Tab containment inside the subtree. */
	contain: boolean
	/** Focus the first tab stop (or the scope box when empty) on mount. */
	autoFocus: boolean
	/** On unmount, refocus the element that held focus at mount. */
	restoreFocus: boolean
	/** Whether nested scopes stack so only the innermost scope contains focus. */
	nestedScopes: boolean
}

/** `FocusScope` — keyboard focus containment, React Aria's FocusScope. The
 *  web leaf traps Tab inside the subtree (`contain`), can focus the first
 *  tab stop on mount (`autoFocus`), and returns focus to the previously
 *  focused element on unmount (`restoreFocus`). The web leaf does not stack
 *  nested scopes. AppKit uses native descendant traversal, per-window nested
 *  ownership and first-responder restoration when its bridge is available.
 *  The default mobile leaf renders a plain container with inert flags.
 *  `getFocusScopeCapabilities()` reports available behavior, not OS-input proof.
 *
 * @example
 * ```tsx
 * import { FocusScope } from '@octane-xplat/ui'
 *
 * <FocusScope contain restoreFocus autoFocus>{dialogBody}</FocusScope>
 * ```
 * @see FocusScopeCapabilities — check it before relying on target behavior.
 */
export interface FocusScopeProps extends AccessibilityProps {
	/** Content rendered inside the element. */
	children?: Renderable
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
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
/** How an `AspectRatio` child fills the box — `'cover'`, `'contain'`, or `'center'` (the latter two center without cropping hints on native).
 */
export type AspectRatioFit = 'cover' | 'contain' | 'center'

/** `AspectRatio` — sizes its box from width / `ratio` (required, e.g. 16/9). `shape="ellipse"` clips to an ellipse; `fit` controls how the child fills. Web uses CSS `aspect-ratio`; native measures the laid-out width.
 *
 * @example
 * ```tsx
 * import { AspectRatio, Image } from '@octane-xplat/ui'
 *
 * <AspectRatio ratio={16 / 9}>
 * 	<Image src={poster.url} />
 * </AspectRatio>
 * ```
 */
export interface AspectRatioProps extends AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** width / height — e.g. 16/9 ≈ 1.777. Required. */
	ratio: number
	/** @default 'rectangle' */
	shape?: AspectRatioShape
	/** How content fits the ratio box (cover/contain semantics). */
	fit?: AspectRatioFit
}

// ---------- Astryx parity: forms ----------

/** `FormLayout` arrangement — `'vertical'` (default), `'horizontal'` equal columns, `'horizontal-labels'` label left of each control.
 */
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
 *  480px collapse have no native analog).
 *
 * @example
 * ```tsx
 * import { FormLayout, Field, TextInput } from '@octane-xplat/ui'
 *
 * <FormLayout>
 * 	<Field label="Name"><TextInput value={name} onChange={setName} /></Field>
 * 	<Field label="Email"><TextInput value={email} onChange={setEmail} /></Field>
 * </FormLayout>
 * ```
 * @see FormLayoutDirection, FormFieldProps (`Field`).
 */
export interface FormLayoutProps extends AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** @default 'vertical' */
	direction?: FormLayoutDirection
	/** Default required/optional marker policy for fields in the form. */
	defaultOptionality?: FormOptionality
}

/** Size scale for `InputGroup` — `'sm' | 'md' | 'lg'`.
 */
export type InputGroupSize = 'sm' | 'md' | 'lg'

/** `InputGroup` — a labeled group joining an input with prefix/suffix
 *  addons into one visually connected control. Renders a `Field` around a
 *  `role="group"` row (web) / grouped row (native). Member inputs pick up
 *  group styling through `useInputGroup()`.
 *
 * @example
 * ```tsx
 * import { InputGroup, InputGroupText, TextInput } from '@octane-xplat/ui'
 *
 * <InputGroup label="Price">
 * 	<InputGroupText>$</InputGroupText>
 * 	<TextInput value={price} onChange={setPrice} />
 * </InputGroup>
 * ```
 * @see InputGroupTextProps.
 */
export interface InputGroupProps extends FieldControlProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Group label — required for accessibility. */
	label: string
	/** Tooltip text shown via an info affordance at the end of the label. */
	labelTooltip?: string
	/** Size variant applied to grouped inputs. */
	size?: InputGroupSize
}

/** `InputGroupText` — a prefix/suffix text or icon segment inside
 *  `InputGroup` ('$', 'https://', units).
 *
 * @see InputGroupProps — renders a prefix/suffix segment inside it.
 */
export interface InputGroupTextProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
}

// ---------- Astryx parity: content lists ----------

/** Row density for `List`/`ListItem` — `'compact' | 'balanced' | 'spacious'` (default 'balanced').
 */
export type ListDensity = 'compact' | 'balanced' | 'spacious'
/** Marker style — 'decimal' renders an ordered list (`<ol>` on web) with
 *  numbered markers, 'disc'/'circle' render bullet markers, 'none' none. */
export type ListMarkerStyle = 'none' | 'disc' | 'circle' | 'decimal'
/** `List` marker style — alias of `ListMarkerStyle` ('none' default, 'disc', 'circle', 'decimal').
 */
export type ListStyle = ListMarkerStyle

/** `List` — a vertical content list (NOT a virtualized data list — that's
 *  `VirtualList`). Children are `ListItem`s. Renders semantic `ul`/`ol` on
 *  web; a column container on native (NativeScript has no list role —
 *  marker/divider visuals are drawn by the leaf instead).
 *
 * @example
 * ```tsx
 * import { List, ListItem } from '@octane-xplat/ui'
 *
 * <List hasDividers>
 * 	<ListItem label="General" onPress={openGeneral} />
 * 	<ListItem label="Account" onPress={openAccount} />
 * </List>
 * ```
 * @see ListItemProps, VirtualListProps for large data sets.
 */
export interface ListProps extends AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** @default 'balanced' */
	density?: ListDensity
	/** Draws separators between list rows. */
	hasDividers?: boolean
	/** Compensates for each item's inline inset up to the container padding
	 *  on each edge (aligns rows with sibling headings). Reads the
	 *  `--vx-item-inset-inline` / `--container-padding-*` custom
	 *  properties; inert where no container padding is declared. Web only. */
	edgeCompensation?: 'inline'
	/** Header content rendered above the list (aria-labelledby on web). */
	header?: Renderable
	/** @default 'none' */
	listStyle?: ListMarkerStyle
	/** Starting number for 'decimal' lists. @default 1 */
	start?: number
	/** Test id applied to the list host on web. */
	'data-testid'?: string
}

/** `ListItem` — one row inside `List`: optional marker + startContent +
 *  label/description + endContent. `onPress`/`href` make the row
 *  interactive (invisible button/anchor on web, tap handling on native).
 *  `delegateRef` points at a nested control that owns keyboard access and
 *  the action — the row forwards surface presses to it and adds no second
 *  stop (upstream `interactiveRef`).
 *
 * @see ListProps — render inside it.
 */
export interface ListItemProps extends AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Primary text (string truncates to one line) or rich content. */
	label: Renderable
	/** Secondary text under the title. */
	description?: Renderable
	/** Content at the row's leading edge. */
	startContent?: Renderable
	/** Content at the row's trailing edge. */
	endContent?: Renderable
	/** Activation callback — makes the row pressable. */
	onPress?: () => void
	/** Extra app content rendered inside the row's label area. */
	delegateRef?: { /** Live slot for the host element; null before mount or after unmount. */ current: HostElement | null }
	/** Link target: web renders a real anchor; native navigates via the
	 *  registered deep-link table, falling back to opening the URL. */
	href?: string
	/** Anchor target when the row navigates. */
	target?: '_blank' | '_self' | string
	/** Anchor rel attribute. */
	rel?: string
	/** Dims the row and blocks activation. */
	isDisabled?: boolean
	/** Marks the row as the current selection. */
	isSelected?: boolean
}

/** `GridList` — interactive 2D cell collection, React Aria's GridList.
 *  Not virtualized (that's `VirtualList`, which stays 1D): items render
 *  eagerly into a CSS grid on web (`role="grid"` > `role="row"` >
 *  `role="gridcell"`, roving tabindex, arrows move by measured column
 *  count) and a wrapping masonry flex container of Pressable cells on native.
 *  Selection mirrors RA: `selectionMode` gates it, `selectedKeys` is the
 *  controlled form (`'all' | Iterable<Key>`), `onAction` fires on
 *  activation whether or not selection is enabled.
 *
 * @example
 * ```tsx
 * import { GridList, Image } from '@octane-xplat/ui'
 *
 * <GridList
 * 	items={photos}
 * 	renderItem={(p) => <Image src={p.url} />}
 * 	selectionMode="multiple"
 * 	selectedKeys={selected}
 * 	onSelectionChange={setSelected}
 * />
 * ```
 * @see Selection, Key — selection contract; `useGridList` reports `isSupported` for grid keyboard nav.
 */
export interface GridListProps<T = unknown> extends LayoutChildProps, AccessibilityProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Content rendered inside the element. */
	children?: Renderable
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Data array rendered through `renderItem`. */
	items: readonly T[]
	/** Returns each item's stable `Key`; must be unique and survive reorder.
	 *  Defaults to `defaultItemKey` — the item's `id` or `key` property;
	 *  items without either throw instead of guessing a positional key. */
	keyExtractor?: (item: T, index: number) => Key
	/** Renders one cell; called per item. */
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
	/** Selection policy for cells (none/single/multiple). */
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
	/** Fires when a row is activated (click/Enter on web and AppKit, tap on
	 * mobile), independent of selection. Space selects without activation. */
	onAction?: (key: Key) => void
	/** 'arrow' (default): single Tab stop + arrow-key navigation.
	 * 'tab': every row is a Tab stop and arrows are left to content —
	 * use when cells contain interactive controls. Implemented by the web
	 * and AppKit GridList components; mobile keeps tap selection/onAction.
	 * The selector-based useGridList hook remains unsupported on AppKit. */
	keyboardNavigationBehavior?: 'arrow' | 'tab'
	/** Stable semantic automation name, independent of `id` and spoken labels. */
	testID?: string
}

// ---------- Astryx parity: indicators ----------

/** Indicator families fix the state space a visual can draw — single
 *  selection (unchecked/checked) vs multi selection (with indeterminate).
 *  A replacement registered under a name is checked against its family's
 *  state space. */
export interface IndicatorFamilyMap {
	/** Glyph used for single-select states. */
	singleSelection: 'unchecked' | 'checked'
	/** Glyph used for multi-select states (adds indeterminate). */
	multiSelection: 'unchecked' | 'checked' | 'indeterminate'
}

/** Indicator state-space family — keys of `IndicatorFamilyMap` ('singleSelection', 'multiSelection').
 */
export type IndicatorFamily = keyof IndicatorFamilyMap & string
/** The drawable states of an indicator family — `'unchecked' | 'checked'`, plus `'indeterminate'` for `multiSelection`.
 */
export type IndicatorState<F extends IndicatorFamily = IndicatorFamily> = IndicatorFamilyMap[F]
/** Indicator glyph size — `'sm' | 'md'` (default 'md').
 */
export type IndicatorSize = 'sm' | 'md'
/** Which edge a control places its indicator on — `'start' | 'end'`.
 */
export type IndicatorPosition = 'start' | 'end'

/** Props every indicator accepts. Indicators are decorative — the owning
 *  control keeps role/focus/state; the indicator renders `aria-hidden` on
 *  web and draws the picture for `state`. `children` replaces the state
 *  mark inside the indicator chrome (busy spinners).
 *
 * @see IndicatorMap, IndicatorComponent — register replacements with `registerIndicator`/`registerIndicators`.
 */
export interface IndicatorProps<F extends IndicatorFamily = IndicatorFamily> {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Receives the underlying host through a standard Octane ref. */
	ref?: Octane.Ref<object>
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
	/** Current indicator state. */
	state: IndicatorState<F>
	/** @default 'md' */
	size?: IndicatorSize
	/** Dims the indicator. */
	isDisabled?: boolean
	/** Content rendered inside the element. */
	children?: Renderable
}

/** A replacement indicator's signature — renders `IndicatorProps<F>` for its family.
 */
export type IndicatorComponent<F extends IndicatorFamily = IndicatorFamily> = (
	/** Props forwarded to the indicator renderer. */
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

/** The replaceable indicator names — keys of `IndicatorMap` ('check', 'radio', 'checkbox').
 */
export type IndicatorName = keyof IndicatorMap & string
/** The `IndicatorName`s belonging to one `IndicatorFamily`.
 */
export type IndicatorNameOfFamily<F extends IndicatorFamily> = {
	[N in IndicatorName]: IndicatorMap[N] extends F ? N : never
}[IndicatorName]

/** App-provided indicator overrides, keyed by indicator name — the
 *  `indicators` half of Astryx's theme replace seam, registered through
 *  `registerIndicators`. */
export type IndicatorRegistry = {
	[N in IndicatorName]?: IndicatorComponent<IndicatorMap[N]>
}

/** An owner-scoped modal opener. Keep element rendered beneath the providers to inherit. */
export interface ImperativeModalReturn {
	/** Opens a modal and returns its instance handle. */
	open: OpenModal
	/** Element to mount that hosts the imperative modals. */
	element: Renderable
}

/** An owner-scoped sheet opener. Removing element closes every owned handle. */
export interface ImperativeBottomSheetReturn {
	/** Opens a bottom sheet and returns its instance handle. */
	open: OpenBottomSheet
	/** Element to mount that hosts the imperative sheets. */
	element: Renderable
}

/** Placement of client route content beneath its owning provider tree. */
export interface RouteOutletProps {
	/** Change this token when account identity or permissions change. Retires this
	 * outlet's owned screens, nested panes, modals and pending preparation. */
	authority?: string | number
	/** One URL handoff per authority lifetime, after startup settles. */
	resumeUrl?: string
	/** Reports the handoff result only while its owner is still mounted. */
	onResume?: (result: NavigationResult<unknown>) => void
	/** Stack id this outlet renders. */
	stack?: string
	/** Content rendered inside the element. */
	children?: Renderable
}

// Media luminance and secondary-action reveal contracts.
/** Normalized image coordinates, each in the range 0–1. */
export interface ImageSampleRegion {
	/** Sample region left edge in DIPs. */
	x: number
	/** Sample region top edge in DIPs. */
	y: number
	/** Sample region width in DIPs. */
	width: number
	/** Sample region height in DIPs. */
	height: number
}

export interface UseImageModeOptions {
	/** Sample this area instead of the whole image. */
	region?: ImageSampleRegion
	/** APCA perceptual lightness split; values above it are light. @default 0.5 */
	threshold?: number
	/** Used while loading, on failure, and on unsupported native hosts. @default null */
	fallback?: 'dark' | 'light' | null
}

/** Exercised subset of Astryx's container reveal contract. */
export interface UseContainerRevealOptions {
	/** Toggles reveal behavior — disabled leaves content always revealed. */
	isEnabled?: boolean
}

export interface ContainerRevealProps {
	/** Classes applied to the reveal wrapper. */
	className?: string
}

export interface UseContainerRevealReturn {
	/** Props to spread on the container that triggers the reveal. */
	getContainerProps: () => ContainerRevealProps
	/** Props to spread on the content being revealed. */
	getContentRevealProps: () => ContainerRevealProps
}

/** `BreadcrumbItem` part — one trail entry inside `Breadcrumbs` (Astryx).
 *  `children` are the label; `href`/`to`/`onPress` navigate, `isCurrent`
 *  marks the current location, `startIcon` leads the label, `menu` turns
 *  the crumb into a dropdown trigger. */
export interface BreadcrumbItemProps {
	/** CSS classes applied to the host element — the preferred channel for static styles; `style` is for dynamic values. */
	className?: ClassValue
	/** Inline style applied after `className` — use for dynamic values; static styles belong in classes. */
	style?: StyleProp
	/** Stable id forwarded to the host element (the DOM `id` on web). */
	id?: string
	/** Content rendered inside the element. */
	children?: Renderable
	/** Inert navigation target (label-only crumbs pass no href). */
	href?: string
	/** Route the crumb links to. */
	to?: string
	/** Activation handler for the crumb. */
	onPress?: () => void
	/** Raw click handler for the crumb. */
	onClick?: () => void
	/** Marks the crumb as the current page (aria-current, no link). */
	isCurrent?: boolean
	/** Icon rendered before the crumb label. */
	startIcon?: Renderable
	/** Sibling entries shown in the crumb's dropdown. */
	menu?: BreadcrumbMenuOption[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	android?: PlatformProps
	/** Platform-specific properties are applied after shared props. */
	web?: PlatformProps
}

/** Static UI message catalogs. ICU formatting is not part of this subset. */
export type InternationalizationMessages = Record<
	string,
	Readonly<Record<string, string | { /** Fallback text when the active locale lacks the key. */ defaultMessage: string }>>
>

/** Locale/catalog scope for built-in Selector and Pagination static strings.
 * Nested providers replace the parent scope; set host dir separately. */
export interface InternationalizationProviderProps {
	/** Active BCP-47 locale. */
	locale: string
	/** Text direction override; defaults to the locale's direction. */
	dir?: 'ltr' | 'rtl'
	/** Message catalog for the active locale. */
	messages?: InternationalizationMessages
	/** Per-key message overrides merged over `messages`. */
	overrides?: InternationalizationMessages
	/** Content rendered inside the element. */
	children?: Renderable
}
