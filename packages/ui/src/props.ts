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

/** A component function whose props vary by the owning slot. Method syntax
 *  keeps custom components with narrower props assignable to open slots. */
type ComponentFunction<Props> = {
	bivarianceHack(props: Props): Renderable
}['bivarianceHack']

/** Shared scroll hooks preserve platform event objects without normalizing
 *  the DOM, NativeScript, and AppKit payloads into a misleading shape. */
type ScrollableAreaEventHandler = {
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
	params: TParams | undefined
	close(result?: unknown): void
}

/** A component mounted on a dedicated root — `openModal`/`openBottomSheet`
 *  arguments and `Modal`'s `component` prop. */
export type HostedComponent<TParams = unknown> = ComponentFunction<HostedComponentProps<TParams>>

/** A route screen component — receives the route's params as props. */
export type ScreenComponent = ComponentFunction<Record<string, unknown>>

/** A route layout component — renders the route subtree through `children`. */
export type LayoutComponent = ComponentFunction<{ children?: Renderable }>

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
 *  to the host masonview natively and the element's style on web.
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
export interface GridProps extends AccessibilityProps {
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	rows?: GridTrackList
	columns?: GridTrackList
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
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

/** Explicit size constraints shared by the flow layout components. Numeric
 *  sizes are dips (CSS pixels on web); strings are CSS lengths used as-is. */
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
	hAlign?: StackMainAlignment
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
	hAlign?: StackCrossAlignment
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

/** The `Row` leaf's contract — the same layout/flex prop set as `View`. `Row` itself is not exported on the public barrel; use `HStack` (or `Stack` with `direction="horizontal"`) for horizontal flow. Exported for wrappers that forward to the leaf.
 */
export interface RowProps
	extends LayoutChildProps, FlexContainerProps, AccessibilityProps, TestIDProps {
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

/** Text label — a `span`-class text host (NS `Label`/`TextView` on native). `numberOfLines` truncates with an ellipsis (web uses line-clamp); `ellipsize` shrinks the box instead of wrapping. Typography comes from `className`/theme tokens; use `Heading` for semantic levels and `RichText`/`RichTextSpan` for mixed-format runs.
 *
 * @example
 * ```tsx
 * import { Text } from '@octane-xplat/ui'
 *
 * <Text numberOfLines={2}>{summary}</Text>
 * ```
 * @see HeadingProps, RichTextProps.
 */
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
 * native-safe escape hatch; a single string child is also accepted.
 * @see RichTextProps for the enclosing container and a composition example. */
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

/** Imperative handle delivered through `ref` on `TextInput`, `TextArea`, and `SearchInput` — `focus`/`blur` plus `native`, the raw platform host (HTMLInputElement on web, NS TextField/TextView on native) for escape-hatch access.
 */
export interface TextInputHandle {
	focus(): void
	blur(): void
	native: HostElement
}

/** Severity of a field status message — `'warning'`, `'error'`, or `'success'`; drives the status glyph and tone.
 */
export type FieldStatusType = 'warning' | 'error' | 'success'

/** Portable validation status shared by field controls. */
export interface FieldStatus {
	type: FieldStatusType
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

/** Single-day `Calendar` — `value`/`defaultValue`/`onChange` carry one `ISODateString`; `onChange` also passes a local-midnight `Date` convenience. `mode` may be omitted (`'single'` is the default).
 */
export interface CalendarSingleProps extends CalendarBaseProps {
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
	mode: 'range'
	/** A selected local date range, or `null` for an explicitly empty calendar. */
	value?: DateRange | null
	/** Initial selected range; `null` starts with no selected range. */
	defaultValue?: DateRange | null
	onChange?: (value: DateRange) => void
}

/** A self-drawn month calendar — same value model on every target. Keyboard
 *  grid navigation is web; native hardware-key delivery is not implemented. Native cells announce through
 *  `accessibility*` props rather than ARIA.
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
	className?: ClassName
	style?: StyleProp
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value?: ISODateString | null
	onChange?: (value: ISODateString | null) => void
	/** Async follow-up after `onChange`; the field stays busy until it
	 *  resolves. */
	changeAction?: (value: ISODateString | null) => void | Promise<void>
	min?: ISODateString
	max?: ISODateString
	dateConstraints?: ReadonlyArray<(date: Date) => boolean>
	/** Closed-value format — a named shared format or a mapper from ISO.
	 *  @default 'date_long' */
	format?: DateInputFormat | ((iso: ISODateString) => string)
	hasClear?: boolean
	hasAutoFocus?: boolean
	presentation?: DateInputPresentation
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
	className?: ClassName
	style?: StyleProp
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value?: ISOTimeString | null
	onChange?: (value: ISOTimeString | null) => void
	changeAction?: (value: ISOTimeString | null) => void | Promise<void>
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
	placeholder?: string
	ref?: Octane.Ref<TextInputHandle>
	ios?: PlatformProps
	android?: PlatformProps
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
	className?: ClassName
	style?: StyleProp
	id?: string
	accessibilityLabel?: string
	accessibilityHint?: string
	/** Parent-owned committed value. Echo accepted edits in `onChange`;
	 *  resets and corrections replace the displayed value. */
	value?: ISODateTimeString | null
	onChange: (value: ISODateTimeString | null) => void
	changeAction?: (value: ISODateTimeString | null) => void | Promise<void>
	/** Earliest selectable local date-time — constrains the calendar and (when
	 *  the picked day equals `min`'s day) the time segment. */
	min?: ISODateTimeString
	/** Latest selectable local date-time. */
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
	ref?: Octane.Ref<TextInputHandle>
	/** Calendar pane count on the popover/sheet surface. @default 1 */
	numberOfMonths?: 1 | 2
	weekStartsOn?: DayOfWeek | DayOfWeekName
	ios?: PlatformProps
	android?: PlatformProps
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
	| { owner: 'content' }
	| { owner: 'viewport'; label: string; role?: 'group' | 'region' }
	| { owner: 'contentOrViewport'; label: string; role?: 'group' | 'region' }

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
	inline: ScrollAxisState
	block: ScrollAxisState
}

/** Options for `useScrollableArea` — allowed logical `axis` (default `'block'`), `overscroll` chaining, `stickyContainment`, and web-only `keyboardAccess` tab-stop ownership.
 */
export interface UseScrollableAreaOptions {
	/** Logical axis or axes where scrolling is allowed. @default 'block' */
	axis?: ScrollAxis
	/** Keyboard/tab-stop ownership. Web only. */
	keyboardAccess?: ScrollKeyboardAccess
	overscroll?: ScrollOverscroll
	stickyContainment?: ScrollStickyContainment
}

/** Props returned for the viewport box by `useScrollableArea`.
 *  `TElement` identifies the host receiving the composed ref and defaults to
 *  `HostElement` when the caller does not need host-specific ref typing. */
export interface UseScrollableAreaViewportProps<TElement = HostElement> {
	ref: Octane.Ref<TElement>
	className?: ClassName
	style?: StyleProp
	onScroll?: ScrollableAreaEventHandler
	onLayoutChanged?: ScrollableAreaEventHandler
	role?: string
	'aria-label'?: string
	tabIndex?: number
	orientation?: 'horizontal' | 'vertical' | 'both'
	'data-scrollable-x'?: boolean
	'data-scrollable-y'?: boolean
	'data-at-start-x'?: boolean
	'data-at-end-x'?: boolean
	'data-at-start-y'?: boolean
	'data-at-end-y'?: boolean
	'data-sticky-containment'?: string
}

/** Props returned for the observed content box by `useScrollableArea`. */
export interface UseScrollableAreaContentProps<TElement = HostElement> {
	ref: Octane.Ref<TElement>
	className?: ClassName
	style?: StyleProp
	onLayoutChanged?: ScrollableAreaEventHandler
	role?: string
	'aria-label'?: string
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
export interface UseScrollableAreaResult<TElement = HostElement> {
	/** Merges behavior-owned props (ref/role/tabIndex/overflow/data attrs)
	 *  into caller props for the viewport element or native scroll view. */
	getViewportProps<P extends object = {}>(
		props?: P & Partial<UseScrollableAreaViewportProps<TElement>>,
	): Omit<P, keyof UseScrollableAreaViewportProps<TElement>> &
		UseScrollableAreaViewportProps<TElement>
	/** Merges the observed-content marker + ref into the content box props. */
	getContentProps<P extends object = {}>(
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
	 *  platform's scroll animation where the leaf provides one. */
	scrollToOffset(
		offset: { inline?: number; block?: number },
		options?: { animated?: boolean },
	): void
	/** The platform scroll viewport (`HTMLElement` / NS `ScrollView` / AppKit
	 *  `NSScrollView`) — escape hatch for anything the shared contract does
	 *  not cover. */
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

/** Imperative handle on `WebView` — `reload`, frame-local `goBack`/`goForward`, `stopLoading`, and `native` for the raw platform view.
 */
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

/** Object form of `Image.contentPosition` — name one horizontal and one vertical edge with a dip or percentage offset.
 */
export interface ImageContentPositionObject {
	top?: ImageContentPositionValue
	right?: ImageContentPositionValue
	bottom?: ImageContentPositionValue
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
	android?: PlatformProps
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
	className?: ClassName
	style?: StyleProp
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
	android?: PlatformProps
	web?: PlatformProps
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
	ref?: Octane.Ref<HostElement>
	className?: ClassName
	style?: StyleProp
	children?: Renderable
	/** Set false to keep the layout wrapper without avoidance — no inset
	 *  subscription or Android window-resize lease runs. @default true */
	enabled?: boolean
	/** Extra dips to hold contents above the keyboard's top edge, added to
	 *  the measured inset (React Native `keyboardVerticalOffset`).
	 *  @default 0 */
	keyboardVerticalOffset?: number
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
	id?: string
}

/** Options for `useKeyboardInset`. */
export interface UseKeyboardInsetOptions {
	/** Set false to read 0 without subscribing — no iOS frame observer or
	 *  Android window-resize lease runs while disabled. @default true */
	enabled?: boolean
}

/** Slide-over drawer (self-drawn). `main`/`drawer` are the two surfaces; `open`+`onDismiss` control visibility (`defaultOpen` for uncontrolled), and a backdrop tap fires `onDismiss`. For OS-authentic drawers use `SideDrawer` (`ui/ios`) or `DrawerLayout` (`ui/android`).
 *
 * @example
 * ```tsx
 * import { Drawer, NavigationMenu, View } from '@octane-xplat/ui'
 *
 * <Drawer open={open} onDismiss={() => setOpen(false)} main={<View />} drawer={<NavigationMenu items={navItems} />} />
 * ```
 */
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

/** Shared self-drawn switch — identical pixels on every target (the `Switch` parity class). Controlled `checked`+`onCheckedChange`, or uncontrolled `defaultChecked`; field vocabulary (`label`, `status`, `isDisabled`) via `FieldControlProps`. For the OS widget use `UISwitch`/`MaterialSwitch`.
 *
 * @example
 * ```tsx
 * import { Switch } from '@octane-xplat/ui'
 *
 * <Switch label="Notifications" checked={enabled} onCheckedChange={setEnabled} />
 * ```
 * @see PlatformSwitchProps.
 */
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
 *  `Field`, not on the widget itself.
 *
 * @example
 * ```tsx
 * import { UISwitch } from '@octane-xplat/ui/ios'
 *
 * <UISwitch checked={on} onCheckedChange={setOn} label="Wi-Fi" />
 * ```
 * @see SwitchProps for the self-drawn shared switch.
 */
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

/** Value slider — `value` clamped to [`minValue`,`maxValue`] (defaults 0–100), `onValueChange` reports user drags. Shared contract for the self-drawn `Slider` and the OS widgets `UISlider`/`SeekBar`.
 *
 * @example
 * ```tsx
 * import { Slider } from '@octane-xplat/ui'
 *
 * <Slider value={volume} minValue={0} maxValue={1} onValueChange={setVolume} />
 * ```
 */
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
	value: IconRegistry
	children?: Renderable
}

/** Semantic section heading — `level` (1–6) is the semantic level, not a size; visual size comes from `className`/theme. Web renders `h1`–`h6`; native reports the `header` accessibility trait.
 *
 * @example
 * ```tsx
 * import { Heading } from '@octane-xplat/ui'
 *
 * <Heading level={2}>Details</Heading>
 * ```
 * @see TextProps.
 */
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

/** Side of the anchor the popover opens on — `'top' | 'bottom' | 'left' | 'right'`.
 */
export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'
/** Cross-axis alignment for anchored layers — 'start' (the historical
 *  default) keeps the panel flush with the anchor's start edge.
 */
export type PopoverAlignment = 'start' | 'center' | 'end'

/** A platform-neutral ref to the host view or element that owns a popover. */
export interface PopoverAnchorRef {
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

/** `useLayer` options — `mode: 'context'` positions relative to a bound anchor (`ContextLayerOptions`), `mode: 'fixed'` positions at explicit coordinates (`FixedLayerOptions`).
 */
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

/** `useLayer` result — `ContextLayerReturn` for anchor-relative mode (bind `ref` to the anchor, `render` content into the layer), `FixedLayerReturn` for fixed coordinates.
 */
export type LayerReturn = ContextLayerReturn | FixedLayerReturn

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
	ios?: PlatformProps
	android?: PlatformProps
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
	id: string
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

/** Rect in the app-surface coordinate space: `(0,0)` is the top-left of
 *  the viewport on web, the window content area on AppKit macOS, and the
 *  app's top-level layout surface on iOS/Android — all in dips (px on
 *  web), y growing downward. Split-screen, freeform, and Stage Manager
 *  windows report the same space, so a value means the same thing on
 *  every target. */
export interface MeasureBounds {
	x: number
	y: number
	width: number
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
	component: HostedComponent<TParams>,
	params?: TParams,
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
	component: HostedComponent<TParams>,
	params?: TParams,
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
 *  explicit accessible name is given.
 *
 * @see DialogProps — renders the title row (and close affordance) inside it.
 */
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
	hide: () => void
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

/** Return of `useImperativeAlertDialog` — `show(options)` opens with `AlertDialogProps` minus the visibility props, `hide` closes, `element` is the dialog node to render.
 */
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
	scrollNext(): void
	scrollPrev(): void
	scrollTo(index: number): void
	canScrollNext(): boolean
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

/** Kind of a `LightboxMedia` entry — `'image'` (default) or `'video'` (real player on web only; native reports it unsupported).
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
 *  press/click.
 *
 * @see UseLightboxReturn.getTriggerProps — these props come from `useLightbox`.
 */
export interface LightboxTriggerProps {
	onPress?: () => void
	/** Web cursor hint + native accessibility hint. */
	web?: PlatformProps
}

/** Options for `useLightbox` — the `media` array, controlled `index`/`onIndexChange` or `defaultIndex`, and zoom/autoplay flags matching `LightboxProps`.
 */
export interface UseLightboxOptions {
	media: LightboxMedia[]
	index?: number
	defaultIndex?: number
	onIndexChange?: (index: number) => void
	hasZoom?: boolean
	hasAutoPlay?: boolean
	finalFocusRef?: { current: HostElement | null }
}

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

/** One `Tabs` entry — `title` plus `render()` for the pane; `key` is the stable selection/ARIA identity (defaults to position). `icon` is a registered `IconName`; platform tab bars consume its `src`/`font`/`text` forms. `stack` names a parallel navigation stack whose pushed routes render inside the pane.
 */
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

/** Self-drawn tab strip + panes (Astryx `Tabs`). `tabs` supplies `TabSpec`s; selection is controlled by `selectedKey`+`onSelectionChange` or uncontrolled via `defaultSelectedKey`, keyed by `TabSpec.key`. The index spellings (`selectedIndex`, `onSelectedIndexChanged`) are deprecated aliases. `resolveScreen` renders pushed routes inside `stack` panes.
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

/** The OS tab bars' contract — `TabsProps` with `PlatformTabSpec` items (icon may be a registered name or a native asset string from `PlatformIcon.select`). Consumed by `UITabBar` (`ui/ios`) and `BottomNavigationView` (`ui/android`); each pane with `stack` hosts a real navigation Frame natively.
 */
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

/** A resolved navigation destination — `stack` (the owning stack), `name` (the route id), `params`, optional `presentation` ('push' default, 'modal' own root, 'fade' push-with-fade), `hash` fragment (web), and loader/beforeLoad results (`loaderData`/`loaderError`/`context`). Produced by `routeFor`/`currentRoute`/matchers; consumed by `pushRoute` and `NavLink`.
 */
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

/** Arguments to a route's `beforeLoad` export — resolved `params` plus the accumulated `context` from upstream guards.
 */
export interface BeforeLoadArgs<Params extends Record<string, unknown> = Record<string, unknown>> {
	params: Params
	context: RouteContext
}

/** Route guard signature — runs before a route commits; returns `RouteContext` merged into the screen's props (and `useRoute().context`), or nothing. Async allowed; a thrown/redirect result aborts the navigation.
 */
export type BeforeLoad<Params extends Record<string, unknown> = Record<string, unknown>> = (
	args: BeforeLoadArgs<Params>,
) => RouteContext | void | Promise<RouteContext | void>

/** The deliberately small cross-platform head surface. `meta` keys become
 * web `<meta name="..." content="...">` tags; native consumes `title`.
 *
 * @see RouteHeadFn, RouteHeadExport.
 */
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

/** A route module's `head` export — a static `RouteHead` or a `RouteHeadFn` computed from the route's params.
 */
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
 *  through to it.
 *
 * @see RouteErrorBoundaryProps — the props the declared boundary receives.
 */
export interface RouteBoundaryProps {
	boundary?: (props: RouteErrorBoundaryProps) => Renderable
	route: Route
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
	id?: string
	href: string
	target?: string
	/** Override the platform link role when composing a link into another
	 *  interaction pattern such as a menu. */
	accessibilityRole?: 'link' | 'menuitem'
	/** Runs when the user activates the link, before navigation. */
	onPress?: () => void
	className?: ClassName
	style?: StyleProp
	children?: Renderable
}

/** In-app navigation link — `route` is a `TypedRoute` checked against the registered schema (`AppRoutes`); runtime-computed destinations assert via `TypedRoute(...)`. Preserves browser link semantics (real `<a>` on web) while pushing the route natively.
 *
 * @example
 * ```tsx
 * import { NavLink } from '@octane-xplat/ui'
 *
 * <NavLink route={{ name: 'settings', stack: 'root', params: {} }}>Settings</NavLink>
 * ```
 * @see LinkProps, TypedRoute, Route.
 */
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

/** Serializable form of a `Route`/`route manifest` entry — used by `manifestToJson`, deep links, and persisted navigation state.
 */
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

/** name → declared presentation map inferred from a `defineRoutes` spec list — pairs with `RouteParamsFromSpecs` inside `SpecRouteInfo`.
 */
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

/** Route names a `defineRoutes` manifest's brand contributes — `never` for an untagged `RouteManifest` (file-route names still flow through `AppRoutes`).
 */
export type ManifestRouteNames<M> = keyof ManifestRouteParams<M> & string

/** name → presentation map extracted from a `defineRoutes` manifest brand — `{}` for untagged manifests.
 */
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
export type RouteFor<
	Params,
	Name extends keyof Params & string = keyof Params & string,
> = Name extends unknown
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

/** One `Accordion` section — stable `key` (selection identity), `header` row content, `content` body, `disabled`.
 */
export interface AccordionItemSpec {
	key: string
	header?: Renderable
	content?: Renderable
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
	className?: ClassName
	style?: StyleProp
	id?: string
	items: AccordionItemSpec[]
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Single-open disclosure state. `null` means that no section is open. */
export interface AccordionSingleProps extends AccordionBaseProps {
	multiple?: false
	open?: string | null
	defaultOpen?: string | null
	onOpenChange?: (open: string | null) => void
}

/** Multi-open disclosure state. */
export interface AccordionMultipleProps extends AccordionBaseProps {
	multiple: true
	open?: string[]
	defaultOpen?: string[]
	onOpenChange?: (open: string[]) => void
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps

/** Self-drawn checkbox — box + check mark, identical pixels across targets.
 *
 * @example
 * ```tsx
 * import { CheckboxInput } from '@octane-xplat/ui'
 *
 * <CheckboxInput label="Subscribe" checked={subscribed} onCheckedChange={setSubscribed} />
 * ```
 * @see CheckboxGroupProps (`CheckboxList`) for multi-choice lists.
 */
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

/** One option of `RadioList`/`SegmentedControl` — `value` is the selection identity, `label` the text, `isDisabled` blocks the single option.
 */
export interface RadioOption {
	value: string
	label?: string
	isDisabled?: boolean
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

/** An action menu row. */
export interface MenuActionData extends MenuItemData {
	type: 'action'
	items?: never
	href?: never
}

/** A link row that retains normal link navigation. */
export interface MenuLinkData extends MenuItemData {
	type: 'link'
	href: string
	target?: string
	isDisabled?: never
	items?: never
}

/** A non-actionable, accessible group of nested menu rows. */
export interface MenuSectionData extends MenuItemData {
	type: 'section'
	label: string
	items: MenuOption[]
	icon?: never
	isDisabled?: never
	onSelect?: never
	hasCloseOnSelect?: never
	href?: never
}

/** A semantic separator with no label or activation behavior. */
export interface MenuSeparatorData {
	key: string
	type: 'separator'
	label?: never
	icon?: never
	isDisabled?: never
	onSelect?: never
	hasCloseOnSelect?: never
	items?: never
	href?: never
}

/** @deprecated Use `MenuSeparatorData` with `type: 'separator'`. */
export type MenuDividerData = MenuSeparatorData

/** A toggleable menu row — `type: 'checkbox'`, caller-owned `value`, `onValueChange` requests the next state.
 */
export interface MenuCheckboxData extends MenuItemData {
	type: 'checkbox'
	value: boolean
	onValueChange?: (value: boolean) => void
}

/** One choice inside a `MenuRadioGroupData` — `value` is its selection identity.
 */
export interface MenuRadioOptionData extends MenuItemData {
	value?: string
}

/** A single-choice group in menu data — `type: 'radio-group'`, shared `value`/`onValueChange`, `items` of `MenuRadioOptionData`.
 */
export interface MenuRadioGroupData extends MenuItemData {
	type: 'radio-group'
	value?: string
	onValueChange?: (value: string) => void
	items: MenuRadioOptionData[]
}

/** A submenu row that owns a separately rendered menu surface. */
export interface MenuSubMenuData extends MenuItemData {
	type: 'submenu'
	items: MenuOption[]
	onSelect?: never
	href?: never
}

/** Public menu data union: each row kind has an explicit discriminant. */
export type MenuOption =
	| MenuActionData
	| MenuLinkData
	| MenuSectionData
	| MenuSeparatorData
	| MenuCheckboxData
	| MenuRadioGroupData
	| MenuSubMenuData

/** @deprecated Use `MenuOption`, whose entry kinds have explicit discriminants. */
export type MenuItem = MenuOption

/** One row in a compound menu (`DropdownMenu`/`ContextMenu` children) — `label`, optional `icon`/`description`/`endContent`, `isDisabled`, `onSelect`; `hasCloseOnSelect` keeps the menu open after selection when false.
 */
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

/** Props for an actionable link inside a menu. */
export interface MenuLinkProps extends Omit<MenuItemProps, 'onSelect' | 'isDisabled'> {
	href: string
	target?: string
	onSelect?: () => void
}

/** Accessible, non-actionable group inside a menu. */
export interface MenuSectionProps {
	id?: string
	label: string
	children?: Renderable
}

/** A compound-menu checkbox row — `value` is caller-owned, `onValueChange` requests the next state.
 */
export interface MenuCheckboxItemProps extends MenuItemProps {
	/** Caller-owned checked state; updates are requested through onValueChange. */
	value: boolean
	onValueChange?: (value: boolean) => void
}

/** One choice inside a compound `MenuRadioGroup` — `value` is the selection identity.
 */
export interface MenuRadioItemProps extends MenuItemProps {
	value: string
}

/** A single-choice group inside a compound menu — `label` is its required accessible name; `value`/`defaultValue`/`onValueChange` own selection; children are `MenuRadioItem`s.
 */
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

/** A separator between compound-menu rows.
 */
export interface MenuSeparatorProps {
	id?: string
	className?: ClassName
	style?: StyleProp
}

/** @deprecated Use `MenuSeparatorProps`. */
export type MenuDividerProps = MenuSeparatorProps

/** A compound-menu row that opens a nested menu — `children` or `items` supply the submenu; `isOpen`/`defaultOpen`/`onOpenChange` own its visibility.
 */
export interface MenuSubMenuProps extends MenuItemProps {
	children?: Renderable
	items?: MenuOption[]
	isOpen?: boolean
	defaultOpen?: boolean
	onOpenChange?: (isOpen: boolean) => void
}

/** Menu context available to descendants — `closeMenu()` dismisses the whole menu; `menuSize` is the inherited size.
 */
export interface MenuContextValue {
	closeMenu(): void
	menuSize: 'sm' | 'md' | 'lg'
}

/** Internal surface contract shared by every renderer. */
export interface MenuSurfaceProps {
	items?: MenuOption[]
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

/** Both data rows and compound children use the same menu contracts.
 *
 * @example
 * ```tsx
 * import { DropdownMenu, Button } from '@octane-xplat/ui'
 *
 * <DropdownMenu
 * 	trigger={<Button label="Actions" />}
 * 	items={[
 * 		{ type: 'action', key: 'rename', label: 'Rename', onSelect: rename },
 * 		{ type: 'separator', key: 'd' },
 * 		{ type: 'action', key: 'delete', label: 'Delete', onSelect: remove },
 * 	]}
 * />
 * ```
 * @see MenuItem, MenuOption, ContextMenuProps.
 */
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
	/** Trigger size — wins over ButtonGroup membership and inherited `SizeContext`
	 *  size (Astryx trigger-Button `size`). @default resolved via `useSize` */
	size?: FieldControlSize
	/** Additional class for the inherited Popover surface. */
	menuClassName?: ClassName
	items?: MenuOption[]
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
export interface ContextMenuProps extends Omit<DropdownMenuProps, 'children'> {
	children?: Renderable
	/** Compound menu content (children remain the context target). */
	menu?: Renderable
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
	className?: ClassName
	style?: StyleProp
	id?: string
	orientation?: 'horizontal' | 'vertical'
	/** Platform-specific properties are applied after shared props. */
	ios?: PlatformProps
	android?: PlatformProps
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

/** Props of the `Item` slot components (`Item.StartContent`/`Content`/`Description`/`EndContent`) — `className` plus children.
 */
export interface ItemSlotProps {
	className?: ClassName
	children?: Renderable
}

/** The `Item` export's callable shape — the row component plus its named slot components (`StartContent`, `Content`, `Description`, `EndContent`) for custom composition.
 */
export interface ItemComponent {
	(props: ItemProps): unknown
	StartContent: (props: ItemSlotProps) => unknown
	Content: (props: ItemSlotProps) => unknown
	Description: (props: ItemSlotProps) => unknown
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
	className?: ClassName
	style?: StyleProp
	id?: string
	/** Controlled number; `null` is the explicit empty value. */
	value?: number | null
	/** Initial number or empty value for uncontrolled use. */
	defaultValue?: number | null
	min?: number
	max?: number
	step?: number
	placeholder?: string
	/** Requests a number or `null` when the input is cleared. */
	onValueChange?: (value: number | null) => void
	ios?: PlatformProps
	android?: PlatformProps
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

/** One `Selector`/`MultiSelector` option — `value` is the selection identity, `label` the shown text (defaults to `value`), `group` a shared heading, `description` supporting text (not matched by search), `isDisabled` blocks it.
 */
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
	className?: ClassName
	style?: StyleProp
	id?: string
	options: SelectOption[]
	searchable?: boolean
	/** Called when the local filter changes, including reset on close. */
	onChangeQuery?: (query: string) => void
	searchPlaceholder?: string
	emptyText?: string
	emptySearchText?: string
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
	onClear?: () => void
	hasClear?: boolean
	placement?: PopoverPlacement
	accessibilityLabel?: string
	ios?: PlatformProps
	android?: PlatformProps
	web?: PlatformProps
}

/** Single-value Selector contract. `null` means no selected option. */
export interface SelectSingleProps extends SelectBaseProps {
	selectionMode?: 'single'
	value?: string | null
	defaultValue?: string | null
	onValueChange?: (value: string | null) => void
	/** Async commit after `onValueChange`. Blocks edits until settled. */
	changeAction?: (value: string | null) => void | Promise<void>
	hasSelectAll?: never
	selectAllLabel?: never
	triggerDisplay?: never
	formatValue?: never
}

/** Multi-value Selector contract. Its callback always receives the selected
 *  values as an array, including an empty array after clearing. */
export interface SelectMultipleProps extends SelectBaseProps {
	selectionMode: 'multiple'
	value?: string[]
	defaultValue?: string[]
	onValueChange?: (value: string[]) => void
	/** Show bulk selection of the visible enabled options. */
	hasSelectAll?: boolean
	selectAllLabel?: string
	/** Multi-value trigger summary. @default 'labels' */
	triggerDisplay?: 'labels' | 'count'
	formatValue?: (items: { value: string; label: string }[]) => string
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
	id: string
	label: string
	element?: Renderable
	auxiliaryData?: TAuxData
}

/** One in-flight `SearchSource` call. `signal` aborts when the request is
 *  superseded or abandoned — every call gets a fresh signal, so consumers
 *  sharing one source cannot cancel each other's work. */
export interface SearchRequest {
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
	search(query: string, request?: SearchRequest): Promise<T[]> | T[]
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

/** `onKeyDown` signature for the typeahead-family input — receives `TypeaheadKeyEvent`; web fires it before internal navigation (`preventDefault` suppresses), iOS/Android never emit it.
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

/** Default result-row content for the Typeahead family — `item`, optional leading `icon`/`description`, `isDisabled`, presentational `group` label. Swap via `renderItem` on `BaseTypeahead`/`Typeahead`/`Tokenizer`.
 */
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
	focus(): void
	blur(): void
	/** The root field element/view. */
	native: HostElement
}

/** Tokenizer — multi-select field: Token chips + a BaseTypeahead input.
 *  Selecting adds a token and clears the query; Backspace on an empty input
 *  removes the last token (pointer platforms — native fields emit no key
 *  events); `hasCreate` offers a "Create \"…\"" entry for free text.
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

/** Trigger chrome for `ComplexSelector` — `'input'` (field styling) or `'ghost'`.
 */
export type ComplexSelectorVariant = 'input' | 'ghost'
/** Astryx name for `FieldControlSize` on `ComplexSelector`.
 */
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

/** One `Breadcrumbs` trail entry — `label` plus `onSelect` to navigate; the last item renders as the current location.
 */
export interface BreadcrumbItem {
	label: string
	onSelect?: () => void
}

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

/** One `Stepper` entry — stable `key`, `label`, optional `icon` (registered `IconName`), `disabled` blocks tapping it.
 */
export interface StepperStep {
	key: string
	label?: string
	/** Registered icon name — see `registerIcon`. */
	icon?: IconName
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

/** One `NavigationMenu` entry — `key`, `label`, optional `icon`, `href` link target (real anchor on web; route-table activation on native), `active` marks the current item, `onSelect` handles custom activation.
 */
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

/** Static action entry for CommandPalette's search results. */
export interface CommandPaletteMenuItem extends MenuItemData {
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
 *  are positional, not identity.
 *
 * @example
 * ```tsx
 * import { Table } from '@octane-xplat/ui'
 *
 * <Table
 * 	columns={[{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }]}
 * 	rows={users}
 * 	idKey="id"
 * 	onRowPress={(row) => open(row.id)}
 * />
 * ```
 * @see TableColumn, TableCellRenderProps; VirtualListProps for large datasets.
 */
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

/** One `Timeline` entry — see `TimelineProps` for the shared content slots.
 */
export interface TimelineItem {
	key: string
	title?: string
	description?: string
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
	className?: ClassName
	style?: StyleProp
	id?: string
	children?: Renderable
	ios?: PlatformProps
	android?: PlatformProps
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
 *  without coupling to rendering.
 *
 * @see ChatMessageListProps.messages — the data-driven form.
 */
export interface ChatMessageData {
	/** Stable unique identity for history anchoring. Omitted ids use object identity. */
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

/** Bubble chrome — `'filled'` (tinted surface) or `'ghost'` (flat).
 */
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

/** System-message presentation — see `ChatSystemMessageProps`.
 */
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

/** Lifecycle of a tool-call row — `'pending' | 'running' | 'complete' | 'error'`; gates which fields render (`duration` on complete, `errorMessage` on error). An omitted status reads as `'complete'`.
 */
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

/** Composer status line shown under the field — `{ type: 'error' | 'warning', message? }`.
 */
export type ChatComposerStatus = { type: 'error' | 'warning'; message?: string }

/** Portable key event for the composer input — the seam for app-specific key
 *  handling. `native` carries the platform event (KeyboardEvent on web).
 *
 * @see ChatComposerInputProps.onKeyDown.
 */
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
 *  treat this as web-real, native-best-effort.
 *
 * @see ChatComposerInputProps paste/drop seams.
 */
export interface ChatComposerFile {
	name: string
	/** MIME type ('' when unknown). */
	type: string
	size: number
	native?: unknown
}

/** Portable paste event handed to ChatComposerInput.onPaste.
 *
 * @see ChatComposerInputProps.onPaste, useChatPasteAsToken.
 */
export interface ChatComposerPasteEvent {
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
	value: string
	label?: Renderable
	variant?: ChatComposerTokenVariant
	/** Registered icon name (see registerIcon). */
	icon?: IconName
}

/** Custom-rendered token — full control over the chip's content.
 *
 * @see ChatComposerToken — `render` does not serialize; persist the `ChatComposerTokenCustomData` half.
 */
export interface ChatComposerTokenCustom {
	value: string
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
	kind: 'badge'
	value: string
	label?: string
	variant?: ChatComposerTokenVariant
	icon?: IconName
}

/** Serializable form of a custom composer token — `kind: 'custom'` plus the serialized `value`; its render function is restored on load via `deserializeChatComposerToken`.
 */
export interface ChatComposerTokenCustomData {
	kind: 'custom'
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
	text: string
	tokens: ChatComposerToken[]
}

/** A draft that has been reduced to plain JSON. `tokens` carry only the data
 *  half of each token; render functions are recovered on load.
 *
 * @see serializeChatComposerDraft / deserializeChatComposerDraft.
 */
export interface ChatComposerDraftData {
	text: string
	tokens: ChatComposerTokenData[]
}

/** Item shape for trigger-menu sources — the portable SearchableItem.
 *
 * @see SearchableItem — same shape; used by composer trigger sources.
 */
export interface ChatComposerTriggerItem<TAuxData = unknown> {
	id: string
	label: string
	/** Pre-rendered item content — takes priority over renderItem/label. */
	element?: Renderable
	auxiliaryData?: TAuxData
}

/** Sync or async item source for a trigger menu — the portable SearchSource.
 *  `search`/`bootstrap` receive a `SearchRequest` whose `signal` aborts
 *  superseded calls; sharing one source across triggers or composers never
 *  cancels a sibling's in-flight request. */
export interface ChatComposerSearchSource<
	T extends ChatComposerTriggerItem = ChatComposerTriggerItem,
> {
	search(query: string, request?: SearchRequest): Promise<T[]> | T[]
	bootstrap?(request?: SearchRequest): Promise<T[]> | T[]
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

/** Composer context read via `useChatComposerContext` inside `ChatComposer` slots — `value`/`draft`, `onChange`/`onDraftChange`, `onSend`, `placeholder`, `isDisabled`, `isStopShown`, `canSend`, cancel. `onSubmit` is the deprecated `onSend` alias.
 */
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

/** Props for `ChatComposerTokenElement` — renders one `ChatComposerToken` chip (`token` is required).
 */
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
 *  the scroll hooks target that container. On iOS/Android the dock overlays
 *  the layout bottom. macOS keeps the dock in flow beneath a flexing viewport.
 *  Native targets have no backdrop blur; `scrollRef` is populated with the
 *  layout's own scroll viewport so callers can hand it to the hooks. */
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

/** `useChatStreamScroll` result — `isScrolledUp`/`isLocked` state, `scrollToBottom`/`scrollToMessage`/`scrollToLastMessage` seeks, `lock`/`unlock` follow control, and `scrollIfLocked` to call on content growth.
 */
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

/** Options for `useChatNewMessages` — `isLocked` (locked scroll means new arrivals don't flag) and `onResize` fired on content height changes.
 */
export interface UseChatNewMessagesOptions {
	/** Optional containing viewport: preserve retained message rows during prepend. */
	scrollRef?: { current?: HostElement | null }
	/** When the scroll is locked, new arrivals don't flag — the user is
	 *  already at the bottom. */
	isLocked: boolean
	/** Fires on every content height change (new message, streaming growth). */
	onResize?: () => void
}

/** `useChatNewMessages` result — `hasNewMessages` flag, `dismiss()`, and `contentRef` to attach to the message-list content element (ResizeObserver on web, layoutChanged on native).
 */
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
	editableRef: { current?: HostElement | null }
	onEmitChange(): void
}

/** One mounted token chip inside a composer input — `id`, the `span` host the web portal renders into, and the `token` data.
 */
export interface TokenPortal {
	id: string
	/** The non-editable span web portals render into (DOM element). */
	span: HostElement
	token: ChatComposerToken
}

/** `useChatComposerTokens` result — `tokenPortals` to render, `insertToken`/`expandToken` editing ops, `handleKeyDown`/`handlePaste` interception (web events), `cleanupPortals`.
 */
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

/** Options for `useSpeechRecognition` — `lang`, `continuous`, `interimResults`, `transformTranscript`, and transcript/start/end/error callbacks. Web SpeechRecognition only — native reports `isSupported: false` and never starts.
 */
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

/** `useSpeechRecognition` result — `isSupported` (check first; false on native), `isListening`/`isSpeaking`, `volume`/`bands`/`rawBands` metering, `interimTranscript`, and `start`/`stop`/`abort`/`toggle`.
 */
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

/** Options for `useChatDictation` — `UseSpeechRecognitionOptions` plus `hasSounds` (web start/stop cues) and `inputRef` to pipe transcripts into a `ChatComposerInput`.
 */
export interface UseChatDictationOptions extends UseSpeechRecognitionOptions {
	/** Start/stop audio cues (default false). Web only. */
	hasSounds?: boolean
	/** Input handle ref — when set, interim/final transcripts are inserted
	 *  into the composer input. */
	inputRef?: { current: ChatComposerInputHandle | null }
}

/** `useChatDictation` result — the `UseSpeechRecognitionReturn` surface; `isSupported` is false on native.
 */
export interface UseChatDictationReturn extends UseSpeechRecognitionReturn {}

/** Mic button bound to a useChatDictation/useSpeechRecognition result.
 *
 * @see useChatDictation — pass its return as `dictation`.
 */
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

/** Density context `ChatMessageList` provides to descendants — `{ density }`.
 */
export interface ChatListContextValue {
	density: ChatDensity
}

/** Scroll wiring `ChatLayout` provides — `scrollContainerRef` (the scroller host) and `contentRef` (attach to the list content for size observation).
 */
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
	ios?: PlatformProps
	android?: PlatformProps
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
	value: string
	onChange: (value: string) => void
	size: TabListSize
	layout: TabListLayout
	pattern: TabListPattern
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

/** One `TabList` tab — `value` matches the list's selected value; `label` is required (hide it with `isLabelHidden`). `href` makes it a link (real anchor on web; route-table activation on native — ignored under the `tablist` pattern); `panelId` links it to its panel via `aria-controls`. `icon`/`selectedIcon`/`endContent` fill the slots; `as` swaps the link element on web.
 *
 * @see TabListProps.
 */
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

/** One `TabMenu` dropdown option — `value`, `label`, optional leading `icon`.
 */
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

/** AppShell's mobile-nav configuration — `hasToggle` auto-renders the hamburger (default true; place `MobileNavToggle` yourself when false), `isOpen`/`onOpenChange` control the drawer, `content` replaces the auto drawer, `breakpoint` sets where mobile nav activates (default `md`, `none` disables), `defaultIsMobile` is the SSR/first-paint hint.
 */
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

/** Context `AppShell` publishes (read via `useAppShellMobile`) — `isMobile`, drawer state (`isMobileNavOpen`, `mobileNavId`), open/close/toggle operations, and `isMobileNavEnabled`/`hasAutoToggle`.
 */
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

/** The brand/heading block inside `TopNav` — `logo`, `heading`/`superheading`/`subheading` (+Href links), `headerEndContent`, and `menu` for a heading popover (typically `NavHeadingMenu`, chevron added). `as` swaps the link element on web.
 *
 * @see TopNavProps, NavHeadingMenuProps.
 */
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

/** One `TopNav` link/action — `label` required (visible text, or aria name under `isIconOnly`), `href` navigation (anchor attrs `target`/`rel`/`download`/`referrerPolicy` are web-only), `isSelected`/`isDisabled`, `icon`, `size`, `onClick`.
 *
 * @see TopNavProps.
 */
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

/** One `TopNavMenu` data row — `title`, `description`, `icon`, `href`, `onClick`.
 */
export interface TopNavMenuItemData {
	title: string
	description?: string
	icon?: Renderable
	href?: string
	onClick?: () => void
}

/** Trigger that opens a menu popover on hover (pointer platforms) or
 *  press.
 *
 * @see TopNavMenuItemData — the data form; `TopNavMegaMenu` for a composed panel.
 */
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

/** A `TopNav` trigger that opens a wide mega-menu — `items` (`TopNavMegaMenuItem` children or custom content), `featured` panel, hover `delay`/`hideDelay` (ms) on pointer platforms, `onOpenChange`.
 */
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

/** One `TopNavMegaMenu` entry — `title`, `description`, `icon`, `href`/`onClick` activation, `as` link override (web).
 */
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

/** The featured card inside `TopNavMegaMenu` — `title`, `description`, decorative `image`/`imageAlt`, `linkLabel`/`linkHref`, `children`.
 */
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

/** Resolved `SideNav` presentation — `'default'` rail, `'topbar'`, `'drawer'`, or `'drawer-content'`; read via `useSideNavRenderMode`.
 */
export type SideNavRenderMode = 'default' | 'topbar' | 'drawer' | 'drawer-content'
/** Astryx name for `NavElementSize` on nav items.
 */
export type NavItemSize = NavElementSize

/** Live collapse state shared from a `SideNav` — `isCollapsed`, `toggle()`, `isCollapsible`.
 */
export interface SideNavCollapseState {
	isCollapsed: boolean
	toggle: () => void
	isCollapsible: boolean
}

/** Collapse behavior for `SideNav` — `defaultIsCollapsed` (uncontrolled) or `isCollapsed`+`onCollapsedChange` (controlled), `hasButton` renders the built-in collapse affordance (default true), `buttonLabel` names it.
 */
export interface SideNavCollapsibleConfig {
	defaultIsCollapsed?: boolean
	isCollapsed?: boolean
	onCollapsedChange?: (isCollapsed: boolean) => void
	/** Render the built-in collapse button (default true). */
	hasButton?: boolean
	/** Accessibility label for the built-in collapse button. */
	buttonLabel?: string
}

/** `SideNavCollapsibleConfig` with the controlled fields required — `isCollapsed` + `onCollapsedChange`.
 */
export interface SideNavControlledCollapsible extends SideNavCollapsibleConfig {
	isCollapsed: boolean
	onCollapsedChange: (isCollapsed: boolean) => void
}

/** @deprecated Hand the same controlled `collapsible` config to SideNav and
 *  to the outside button instead. */
export interface SideNavImperativeCollapseHandle {
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

/** A titled group inside `SideNav` — `title` (+`subtitle`, `endContent`), `isHeaderHidden` keeps the title accessible but invisible; children are `SideNavItem`s.
 */
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

/** The brand/heading block inside `SideNav` — `icon`, `heading`/`superheading`/`subheading` (+Href), `headerEndContent`, `menu` heading popover (typically `NavHeadingMenu`), `as` link override on web.
 */
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

/** One `SideNav` row — `label` required; `href`/`onClick` activation; `icon`/`selectedIcon`; `isSelected`/`isDisabled`; `endContent` passive trailing content; `actions` row-level controls (hidden while collapsed); `children` sub-items with their own `collapsible` config; `size`.
 *
 * @see SideNavProps, SideNavSectionProps.
 */
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

/** The rail collapse/expand button — reads the enclosing `SideNav`'s collapse state; `collapsible` passes a controlled `SideNavControlledCollapsible` only when the button renders outside its SideNav. `label` switches icon-only → text+chevron.
 */
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

/** The hamburger button that opens the `MobileNav` drawer — `children` replace the glyph, `label` names it (default 'Open navigation'). Auto-rendered by `AppShell` unless `mobileNav.hasToggle` is false.
 */
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

/** Astryx name for `NavElementSize` on `NavHeadingMenu`.
 */
export type NavHeadingMenuSize = NavElementSize

/** Context `NavHeadingMenu` provides to its items — inherited `size` and `closeMenu()`.
 */
export interface NavHeadingMenuContextValue {
	size: NavHeadingMenuSize
	closeMenu: () => void
}

/** Close callback supplied by the heading popover hosting the menu. */
export interface NavHeadingCloseContextValue {
	closeMenu: () => void
}

/** Menu popover content for `TopNavHeading`/`SideNavHeading` (`menu` slot) — `NavHeadingMenuItem` children, separators, or custom content; `size`, `minWidth` override (dips).
 */
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

/** One `NavHeadingMenu` row — `label` required, `icon`, `description`, `href`/`onClick` activation, `isDisabled`.
 */
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

/** Axis a resize runs along — `'horizontal'` (width) or `'vertical'` (height); a `ResizeHandle`'s direction must match its region's.
 */
export type ResizableDirection = 'horizontal' | 'vertical'

/** A pixel bound for a percentage size — `pixel(240)`. The number is dips
 *  (CSS pixels on web). */
export interface ResizablePixelSize {
	readonly type: 'pixel'
	readonly value: number
}

/** A percentage with exactly one pixel floor or ceiling —
 *  `percent(50, {min: pixel(200)})`. The number is a percentage of its
 *  resize basis; the optional pixel bound is dips (CSS pixels on web). */
export type ResizablePercentSize = {
	readonly type: 'percent'
	readonly value: number
} & (
	| { readonly min: ResizablePixelSize; readonly max?: never }
	| { readonly min?: never; readonly max: ResizablePixelSize }
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
	minSize?: ResizableSize
}

/** The `maxSize` half of a region config — a `ResizableSize` ceiling.
 */
export interface ResizableMaxConfig {
	maxSize?: ResizableSize
}

/** Per-region sizing behavior — `defaultSize`, `collapsible`, `collapsedSize`
 *  drag threshold in dips (CSS pixels on web, default 40), `snaps` sizes in
 *  the same unit, and `shrinkOrder` cascade priority (lower shrinks first).
 */
export interface ResizableRegionSizing {
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
	onWidthChange?: (width: number) => void
	defaultIsCollapsed?: boolean
	isCollapsed?: boolean
	onCollapseChange?: (isCollapsed: boolean) => void
}

/** Options for single-region `useResizable` — `containerRef` (the element percentages resolve against; viewport/screen when omitted), `direction`, `autoSaveId` persistence key, collapse state (`defaultIsCollapsed` or `isCollapsed`+`onCollapseChange`), `onSizeChange`.
 */
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

/** Single-region `useResizable` config — `ResizableRegionConfig` sizing plus `UseResizableSingleOptions` host wiring.
 */
export type UseResizableSingleConfig = ResizableRegionConfig & UseResizableSingleOptions

/** Multi-region `useResizable` config — named `regions` map (`Record<string, ResizableRegionConfig>`), shared `direction`/`containerRef`/`autoSaveId`.
 */
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

/** One live region from multi-region `useResizable` — current `size` (px/dips), `isCollapsed`, `collapse`/`expand`/`resize` operations, and `props` to spread into a `ResizeHandle`.
 */
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

/** The drag handle between resizable regions — `resizable` takes the `ResizableProps` a `useResizable` region emits (or a component's `resizable` config object); `direction` must match the region's axis.
 */
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
	icon: Renderable
	label: string
}

/** Axis of a `ButtonGroup`/`ToggleButtonGroup` — `'horizontal'` (default) or `'vertical'`.
 */
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
	className?: ClassName
	style?: StyleProp
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
/** PowerSearch operator that takes no value (e.g. 'is empty').
 */
export interface EmptyOperatorValue {
	readonly type: 'empty'
}

/** PowerSearch operator taking one string; `searchSource` supplies completions, `isArbitraryStringAllowed` permits free text.
 */
export interface StringOperatorValue {
	readonly type: 'string'
	readonly searchSource?: SearchSource
	readonly isArbitraryStringAllowed?: boolean
}

/** PowerSearch operator taking a string list — `searchSource` completions, `isArbitraryStringAllowed` free entries, `tokenization` paste rules.
 */
export interface StringListOperatorValue {
	readonly type: 'string_list'
	readonly searchSource?: SearchSource
	readonly isArbitraryStringAllowed?: boolean
	readonly tokenization?: OperatorTokenizationConfig
}

/** PowerSearch operator taking an integer, optionally `minValue`/`maxValue` bounded with `units` label.
 */
export interface IntegerOperatorValue {
	readonly type: 'integer'
	readonly minValue?: number
	readonly maxValue?: number
	readonly units?: string
}

/** PowerSearch operator taking a float, optionally `minValue`/`maxValue` bounded with `units` label.
 */
export interface FloatOperatorValue {
	readonly type: 'float'
	readonly minValue?: number
	readonly maxValue?: number
	readonly units?: string
}

/** PowerSearch operator taking a wall-clock time string, optionally `minValue`/`maxValue` bounded.
 */
export interface TimeOperatorValue {
	readonly type: 'time'
	readonly minValue?: string
	readonly maxValue?: string
}

/** PowerSearch operator taking an absolute date — `isDateOnly` drops the time part.
 */
export interface DateAbsoluteOperatorValue {
	readonly type: 'date_absolute'
	/** Date-only editing without a time part. */
	readonly isDateOnly?: boolean
}

/** PowerSearch operator taking a relative date expression — `isPastAllowed`/`isFutureAllowed` gate direction (default both true).
 */
export interface DateRelativeOperatorValue {
	readonly type: 'date_relative'
	/** @default true */
	readonly isPastAllowed?: boolean
	/** @default true */
	readonly isFutureAllowed?: boolean
}

/** PowerSearch operator taking a `DateTimeRange` — `intervalDatePresets`/`relativeDatePresets` supply quick picks.
 */
export interface DateRangeOperatorValue {
	readonly type: 'date_range'
	readonly intervalDatePresets?: ReadonlyArray<DateRangeFilterPreset>
	readonly relativeDatePresets?: ReadonlyArray<RelativeDateFilterPreset>
}

/** One fixed choice for enum-valued PowerSearch operators — `value`, `label`, optional `icon`.
 */
export interface EnumItem {
	readonly value: string
	readonly label: string
	readonly icon?: Renderable
}

/** PowerSearch operator taking one `EnumItem.value` from `values`.
 */
export interface EnumOperatorValue {
	readonly type: 'enum'
	readonly values: ReadonlyArray<EnumItem>
}

/** PowerSearch operator taking several `EnumItem.value`s from `values`.
 */
export interface EnumListOperatorValue {
	readonly type: 'enum_list'
	readonly values: ReadonlyArray<EnumItem>
}

/** PowerSearch operator taking a list of entity picks — `searchSource` resolves them, `tokenization` handles pastes, `renderItem` customizes rows.
 */
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

/** PowerSearch operator with a caller-supplied editor — `Editor` gets `CustomOperatorEditorProps`; `getString` renders the stored JSON value as token text.
 */
export interface CustomOperatorValue {
	readonly type: 'custom'
	/** Caller editor component: `{value, onChange, placeholder, isDisabled}`. */
	readonly Editor: ElementComponent<CustomOperatorEditorProps>
	/** JSON value → display string for the token. */
	readonly getString: (value: string) => string
}

/** PowerSearch operator taking a nested filter list (`FilterValueNested`).
 */
export interface NestedOperatorValue {
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
	readonly type: 'empty'
}

/** Stored PowerSearch value: one string.
 */
export interface FilterValueString {
	readonly type: 'string'
	readonly value: string
}

/** Stored PowerSearch value: a string list.
 */
export interface FilterValueStringList {
	readonly type: 'string_list'
	readonly value: ReadonlyArray<string>
}

/** Stored PowerSearch value: an integer.
 */
export interface FilterValueInteger {
	readonly type: 'integer'
	readonly value: number
}

/** Stored PowerSearch value: a float.
 */
export interface FilterValueFloat {
	readonly type: 'float'
	readonly value: number
}

/** Stored PowerSearch value: a wall-clock time string.
 */
export interface FilterValueTime {
	readonly type: 'time'
	readonly value: string
}

/** Stored PowerSearch value: an instant as `unixSeconds`.
 */
export interface FilterValueDateAbsolute {
	readonly type: 'date_absolute'
	readonly unixSeconds: number
}

/** Stored PowerSearch value: a relative-date expression string.
 */
export interface FilterValueDateRelative {
	readonly type: 'date_relative'
	readonly value: string
}

/** Stored PowerSearch value: a `DateTimeRange`.
 */
export interface FilterValueDateRange {
	readonly type: 'date_range'
	readonly value: DateTimeRange
}

/** Stored PowerSearch value: one enum `value`.
 */
export interface FilterValueEnum {
	readonly type: 'enum'
	readonly value: string
}

/** Stored PowerSearch value: enum `value`s.
 */
export interface FilterValueEnumList {
	readonly type: 'enum_list'
	readonly value: ReadonlyArray<string>
}

/** An entity pick stored in a filter — `id`, `label`, optional `photo`.
 */
export interface PowerSearchEntity {
	readonly id: string
	readonly label: string
	readonly photo?: string
}

/** Stored PowerSearch value: picked `PowerSearchEntity` items.
 */
export interface FilterValueEntityList {
	readonly type: 'entity_list'
	readonly value: ReadonlyArray<PowerSearchEntity>
}

/** Stored PowerSearch value: a custom operator's JSON string.
 */
export interface FilterValueCustom {
	readonly type: 'custom'
	readonly value: string
}

/** Stored PowerSearch value: a nested `PowerSearchFilter` list.
 */
export interface FilterValueNested {
	readonly type: 'nested'
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
	| { readonly type: 'NOW' }
	| { readonly type: 'ABSOLUTE'; readonly unixSeconds: number }
	| {
			readonly type: 'RELATIVE'
			readonly backValue: number
			readonly unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
			readonly anchorKey?: string
	  }

/** An absolute-or-relative time range — `start`/`end` as `DateTimeRangePart`s; the stored form for `date_range` filters and presets.
 */
export interface DateTimeRange {
	readonly start: DateTimeRangePart
	readonly end: DateTimeRangePart
}

/** A named absolute-range quick pick — `label` + `DateTimeRange` value.
 */
export interface DateRangeFilterPreset {
	readonly label: string
	readonly value: DateTimeRange
}

/** A named relative-range quick pick — `label` + relative expression `value`.
 */
export interface RelativeDateFilterPreset {
	readonly label: string
	readonly value: string
}

// Config vocabulary.
/** Shared operator fields — `key` (identity) and `value` (the `OperatorValue` editor kind).
 */
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

/** A field operator — label inline (`PowerSearchOperatorWithLabel`) or via the i18n catalog (`PowerSearchOperatorWithI18nKey`); never both.
 */
export type PowerSearchOperator = PowerSearchOperatorWithLabel | PowerSearchOperatorWithI18nKey

/** One searchable field — `key`, `label`, its `operators`, `defaultOperator`, `group`/`description`/`typeaheadAliases` for browsing and matching.
 */
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

/** Field/operator schema driving `PowerSearch` — `name`, `fields`, and `contentSearchFieldKey` (the field free text binds to). Build it with `createPowerSearchConfig` to keep `filters`/`onChange` typed to the declared combinations.
 *
 * @see PowerSearchField, PowerSearchOperator, createPowerSearchConfig.
 */
export interface PowerSearchConfig {
	readonly name: string
	readonly fields: ReadonlyArray<PowerSearchField>
	/** Field key receiving free-text search. */
	readonly contentSearchFieldKey?: string
}

/** One committed filter — `field`/`operator` keys plus a typed `value`; `isReadOnly` blocks editing. With a config from `createPowerSearchConfig`, use `PowerSearchFilterFor<C>` to constrain combinations to the declared schema.
 */
export interface PowerSearchFilter {
	readonly field: string
	readonly operator: string
	readonly value: FilterValue
	/** Prevent editing this filter. */
	readonly isReadOnly?: boolean
}

/** An in-progress filter inside the editor — `field` required, `operator`/`value` optional until complete.
 */
export interface PartialFilter {
	readonly field: string
	readonly operator?: string
	readonly value?: FilterValue
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
	focusTypeahead(): void
	blurTypeahead(): void
}

/** Suggestion metadata inside `PowerSearchItem.auxiliaryData` — which field/operator/value/filter index an entry refers to, and its browse `group`.
 */
export interface PowerSearchAuxData {
	readonly fieldKey: string
	readonly operatorKey?: string
	readonly filterValue?: FilterValue
	readonly filterIndex?: number
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

/** Per-operator-type component overrides — `Token` (the filter pill) and/or `Editor` (the popover editor).
 */
export interface PowerSearchComponentOverride {
	readonly Token?: ElementComponent<PowerSearchTokenProps>
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
	? (T extends 'string'
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
	getSnapshot(): StoreSnapshot<T>
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
	selectionMode?: 'multiple'
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

/** Units for numeric `Timestamp.value`. */
export type TimestampValueUnit = 'unix-seconds' | 'unix-milliseconds'

/** Shared display props for the two explicit Timestamp value forms. */
export interface TimestampBaseProps {
	className?: ClassName
	style?: StyleProp
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
	ios?: PlatformProps
	android?: PlatformProps
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
		| { value: ISOInstantString; valueUnit?: never }
		| { value: number; valueUnit: TimestampValueUnit }
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
	className?: ClassName
	style?: StyleProp
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

/** One label/value row inside a `MetadataList`.
 *
 * @see MetadataListProps — render inside it.
 */
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
 *  macOS currently reports it unsupported.
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
 *  `text` parser emits.
 *
 * @see MdDoc — canonical import '@octane-xplat/ui/markdown'.
 */
export type MdInline =
	| { t: 'text'; text: string }
	| { t: 'code'; text: string }
	| { t: 'bold'; children: MdInline[] }
	| { t: 'em'; children: MdInline[] }
	| { t: 'link'; text: string; href: string }

/** One block in a Markdown doc. `MdNode` covers what the renderer lowers to
 *  shared primitives; `MdInline` covers text runs inside paragraphs, lists,
 *  and quotes.
 *
 * @see MdDoc, MdInline — canonical import '@octane-xplat/ui/markdown'.
 */
export type MdNode =
	| { t: 'h'; depth: 1 | 2 | 3 | 4 | 5 | 6; children: MdInline[] }
	| { t: 'p'; children: MdInline[] }
	| { t: 'code'; lang?: string; text: string }
	| { t: 'list'; ordered: boolean; items: MdInline[][] }
	| { t: 'quote'; children: MdInline[] }
	| { t: 'hr' }

/** A parsed Markdown document — the versioned AST (`kind: 'octane-xplat/md'`, `v: 1`) produced by `parseMdDoc`/`createMarkdownStreamParser` and consumed by `Markdown`'s `data` prop. Canonical import: `@octane-xplat/ui/markdown` (root re-export is a migration alias).
 *
 * @see MdNode, MdInline, MarkdownDataProps.
 */
export interface MdDoc {
	kind: 'octane-xplat/md'
	v: 1
	children: MdNode[]
}

/** `Markdown` with a pre-parsed document — the `MdDoc` AST baked by route
 *  codegen (`routes.gen.data` for a `.md` route). No parser ships in the
 *  bundle for this source, so `isStreaming`/`fadeIn` do not apply.
 *
 * @see MarkdownProps — the union this feeds; canonical import '@octane-xplat/ui/markdown'.
 */
export interface MarkdownDataProps {
	data: MdDoc
	text?: never
	isStreaming?: never
	fadeIn?: never
}

/** `Markdown` with raw source parsed at runtime by the package's built-in
 *  subset parser (see docs/content-display.md for the grammar).
 *
 * @see MarkdownProps — the union this feeds; canonical import '@octane-xplat/ui/markdown'.
 */
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
export type MarkdownProps = MarkdownDataProps | MarkdownTextProps

/** `MarkdownScreen` — the route screen codegen mounts for `.md` route
 *  files; `data` is the route's baked doc (like any route loader result)
 *  and `error` a load failure surfaced to the screen.
 *
 * @see MarkdownProps — canonical import '@octane-xplat/ui/markdown'.
 */
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

/** Per-target support for `FocusScope` behavior, read through
 *  `getFocusScopeCapabilities()`. Web honors containment, autofocus, and
 *  restoration but does not stack nested scopes. Native and macOS leaves
 *  render an accessible container only. */
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
 *  nested scopes; native leaves render a plain accessible container and the
 *  three behavior flags are inert. `getFocusScopeCapabilities()` reports
 *  which behaviors the target honors.
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
 *  `InputGroup` ('$', 'https://', units).
 *
 * @see InputGroupProps — renders a prefix/suffix segment inside it.
 */
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
 *  stop (upstream `interactiveRef`).
 *
 * @see ListProps — render inside it.
 */
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

/** A replacement indicator's signature — renders `IndicatorProps<F>` for its family.
 */
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
	open: OpenModal
	element: Renderable
}

/** An owner-scoped sheet opener. Removing element closes every owned handle. */
export interface ImperativeBottomSheetReturn {
	open: OpenBottomSheet
	element: Renderable
}

/** Placement of native route content within the app's provider tree. */
export interface RouteOutletProps {
	stack?: string
	children?: Renderable
}

/** Native Frame navigation whose content is owned by element. Removing the owner returns its stack to the declaring Page. */
export interface NativeRouteNavigatorReturn {
	push(route: { [Name in AppRouteName]: Omit<TypedRoute<Name>, 'stack'> }[AppRouteName]): void
	pop(): void
	element: Renderable
}
