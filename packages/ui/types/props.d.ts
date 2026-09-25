/** Shared prop/type contract — the single source of truth for the public
 *  API surface. Platform leaves import these types so prop shapes cannot
 *  drift across .web/.native, and `tsc --emitDeclarationOnly` emits this
 *  file into the published package's boundary types (tsrx can't emit
 *  declarations — pure .ts is what escapes that). No imports here:
 *  everything must stay dependency-free and platform-agnostic. */
export interface PanEvent {
    x: number;
    y: number;
    dx: number;
    dy: number;
    vx: number;
    vy: number;
    state: string;
    target: any;
}
export interface SwipeEvent {
    direction: number;
}
/** Metadata read by parent layouts. Native forwards NativeScript attached
 *  attributes; web folds the CSS equivalents into the child's style. */
export interface LayoutChildProps {
    row?: number;
    col?: number;
    rowSpan?: number;
    colSpan?: number;
    dock?: 'left' | 'top' | 'right' | 'bottom';
    left?: number;
    top?: number;
    flexGrow?: number;
    flexShrink?: number;
    alignSelf?: string;
    order?: number;
}
/** Flex-container props shared by View/Row/Pressable — RN vocabulary, applied
 *  to the host flexboxlayout natively and the element's style on web.
 *  `gap` is a dip number (px on web); NS supports it on FlexboxLayout only
 *  (GridLayout has no gap). */
export interface FlexContainerProps {
    justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    flexWrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse';
    gap?: number | string;
    rowGap?: number | string;
    columnGap?: number | string;
}
/** Liquid Glass material config. Native maps it to `iosGlassEffect`
 *  (iOS 26+; inert on Android and older iOS), web to the `vx-glass`
 *  backdrop-filter approximation. `variant:'clear'` is the faint,
 *  mostly-transparent glass; `'regular'` is Apple's default. */
export interface GlassConfig {
    variant?: 'regular' | 'clear' | 'identity' | 'none';
    /** Touch-tracking highlight — only meaningful on <LiquidGlass>; the
     *  per-view glass applied by `glass` never receives touches upstream. */
    interactive?: boolean;
    tint?: string;
    /** (LiquidGlassContainer only) merge distance between glass siblings. */
    spacing?: number;
    /** Effect-change animation in ms (default 300). */
    animateChangeDuration?: number;
}
/** `glass` surface prop value: `true`/string shorthand or a config object.
 *  `'none'`/`'identity'`/`false` mean no glass. */
export type GlassProp = boolean | 'regular' | 'clear' | 'identity' | 'none' | GlassConfig;
/** Static glass material on container primitives — background glass behind
 *  the view's content. Interactive glass needs <LiquidGlass>. */
export interface GlassSurfaceProps {
    glass?: GlassProp;
}
export interface GridProps extends GlassSurfaceProps {
    className?: any;
    style?: any;
    children?: any;
    rows?: string;
    columns?: string;
    gap?: number | string;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
    id?: string;
}
export interface StackProps extends GlassSurfaceProps {
    className?: any;
    style?: any;
    children?: any;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
    id?: string;
}
export interface AbsoluteProps extends GlassSurfaceProps {
    className?: any;
    style?: any;
    children?: any;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
    id?: string;
}
/** Interactive glass surface — the element root IS the platform's glass
 *  effect view (NS `LiquidGlass`, a UIVisualEffectView hosting children).
 *  Real material on iOS 26+; inert layout on Android and older iOS;
 *  backdrop-filter approximation on web. */
export interface LiquidGlassProps extends LayoutChildProps {
    className?: any;
    style?: any;
    children?: any;
    id?: string;
    variant?: 'regular' | 'clear';
    interactive?: boolean;
    tint?: string;
    animateChangeDuration?: number;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
/** Merged-glass region — sibling glass elements inside morph together
 *  across `spacing` dips (NS `LiquidGlassContainer`, an AbsoluteLayout:
 *  children position via left/top). */
export interface LiquidGlassContainerProps extends LayoutChildProps {
    className?: any;
    style?: any;
    children?: any;
    id?: string;
    spacing?: number;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface SpacerProps {
    className?: any;
    style?: any;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
    id?: string;
}
export interface ViewProps extends LayoutChildProps, FlexContainerProps, GlassSurfaceProps {
    className?: any;
    style?: any;
    children?: any;
    id?: string;
    /** `ref` is runtime-reserved on component elements — leaves expose
     *  `bind` to reach the native/DOM node. */
    bind?: (el: any) => void;
    onPan?: (e: PanEvent) => void;
    onSwipe?: (e: SwipeEvent) => void;
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
export interface RowProps extends LayoutChildProps, FlexContainerProps, GlassSurfaceProps {
    className?: any;
    style?: any;
    children?: any;
    id?: string;
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
/** Shared accessibility roles. The native leaf maps the ARIA spellings that
 * NativeScript names differently (for example `heading` → `header`). */
export type Role = 'button' | 'link' | 'search' | 'image' | 'heading' | 'adjustable' | 'summary' | 'text' | 'none' | 'progressbar' | 'checkbox' | 'switch' | 'radio' | 'spinbutton' | 'tab';
export interface TextProps extends LayoutChildProps {
    className?: any;
    style?: any;
    children?: any;
    id?: string;
    numberOfLines?: number;
    /** Native Label does not expose text selection; implemented with CSS on web. */
    selectable?: boolean;
    ellipsize?: boolean;
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityRole?: Role;
    accessibilityHint?: string;
    accessibilityValue?: string;
    /** NativeScript supports one state at a time (disabled/selected/checked); busy and expanded are web-only. */
    accessibilityState?: {
        disabled?: boolean;
        selected?: boolean;
        checked?: boolean;
        busy?: boolean;
        expanded?: boolean;
    };
    accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
/** Inline rich text container. Children should be RichTextSpan components so
 * the native leaf can preserve each run as a NativeScript Span. */
export interface RichTextProps extends LayoutChildProps {
    className?: any;
    style?: any;
    children?: any;
    id?: string;
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
/** One styled or tappable inline run inside RichText. `text` is an explicit
 * native-safe escape hatch; a single string child is also accepted. */
export interface RichTextSpanProps {
    className?: any;
    style?: any;
    children?: any;
    text?: string;
    onPress?: () => void;
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
export interface PressableProps extends LayoutChildProps, FlexContainerProps, GlassSurfaceProps {
    className?: any;
    style?: any;
    children?: any;
    id?: string;
    disabled?: boolean;
    onPress?: () => void;
    /** ~500ms press-and-hold (web: timer over pointerdown/up). */
    onLongPress?: () => void;
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityRole?: Role;
    onPressIn?: () => void;
    onPressOut?: () => void;
    onDoublePress?: () => void;
    hitSlop?: number;
    /** NativeScript supports a per-view TouchManager animation opt-out; web has no press scaling. */
    ignoreTouchAnimation?: boolean;
    accessibilityHint?: string;
    accessibilityValue?: string;
    /** NativeScript supports one state at a time (disabled/selected/checked); busy and expanded are web-only. */
    accessibilityState?: {
        disabled?: boolean;
        selected?: boolean;
        checked?: boolean;
        busy?: boolean;
        expanded?: boolean;
    };
    accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
export interface TextInputHandle {
    focus(): void;
    blur(): void;
    native: any;
}
export interface TextInputProps {
    className?: any;
    style?: any;
    id?: string;
    value?: string;
    placeholder?: string;
    /** NativeScript's term for placeholder — web maps hint → placeholder. */
    hint?: string;
    onChange?: (value: string) => void;
    bind?: (h: TextInputHandle) => void;
    secure?: boolean;
    keyboardType?: 'default' | 'email' | 'number' | 'decimal' | 'phone' | 'url';
    returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send';
    onSubmit?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    editable?: boolean;
    placeholderTextColor?: string;
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
export interface TextAreaProps extends TextInputProps {
    /** Submit on native only when `returnKeyType` is `done` or `send`; other
     * returns insert newlines because TextView emits returnPress per newline.
     * Web submits on Cmd/Ctrl+Enter. */
    /** Height in text rows. Web: the `rows` attr (fixed box); native:
     *  minHeight at the widget's measured line height. With `autoGrow` it
     *  becomes the starting height instead of a fixed one. */
    rows?: number;
    /** Grow to fit content, capped by `maxRows`. Native TextView grows by
     *  default — this prop exists so web (<textarea> is fixed-rows) matches;
     *  without it, native gets a fixed `rows`-high box like web. */
    autoGrow?: boolean;
    /** Growth cap in rows — past it the field scrolls internally. Native:
     *  maxHeight at measured line height (TextView's own `maxLines` only
     *  sets truncation on iOS — not a cap). */
    maxRows?: number;
}
export interface ListProps {
    className?: any;
    style?: any;
    id?: string;
    items: any[];
    renderItem: (item: any, index: number) => any;
    renderEmpty?: () => any;
    /** Stable item key for web reconciliation. Falls back to `item.id`; native
     *  ListView recycles by index and does not consume keys. */
    keyFor?: (item: any) => string | number;
    /** Native iOS row-height estimate. Web virtualization is not enabled in v1. */
    estimatedItemHeight?: number;
    /** Called when the list approaches its end. */
    onEndReached?: () => void;
    /** Platform escape hatches, applied after the shared props. */
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface ScrollViewProps extends LayoutChildProps, GlassSurfaceProps {
    className?: any;
    style?: any;
    id?: string;
    horizontal?: boolean;
    children?: any;
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
/** Scrollable ordinary content on web. Native is an inline flex container so
 * a child ListView can own the scrolling without nesting recycling views in a
 * native ScrollView. */
export interface ScrollBoxProps extends LayoutChildProps, GlassSurfaceProps {
    className?: any;
    style?: any;
    id?: string;
    children?: any;
    /** Platform-specific properties are applied after the shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
export interface ImageProps extends LayoutChildProps {
    className?: any;
    style?: any;
    id?: string;
    src: string;
    alt?: string;
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
export interface ScreenProps {
    className?: any;
    style?: any;
    children?: any;
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
    id?: string;
}
export interface SafeAreaProps {
    className?: any;
    style?: any;
    children?: any;
    /** NativeScript props applied to the host after shared props. */
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
    id?: string;
}
export interface KeyboardAvoidingProps {
    className?: any;
    style?: any;
    children?: any;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
    id?: string;
}
export interface DrawerProps {
    className?: any;
    style?: any;
    id?: string;
    main?: any;
    drawer?: any;
    open?: boolean;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface SwitchProps {
    className?: any;
    style?: any;
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    /** Platform-specific properties are applied after shared props. */
    ios?: any;
    android?: any;
    web?: any;
}
export interface ActivityIndicatorProps {
    className?: any;
    style?: any;
    id?: string;
    busy?: boolean;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface MeterProps {
    className?: any;
    style?: any;
    id?: string;
    children?: any;
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    trackColor?: string;
    accessibilityLabel?: string;
}
export interface SliderProps {
    className?: any;
    style?: any;
    id?: string;
    value: number;
    minValue?: number;
    maxValue?: number;
    disabled?: boolean;
    onValueChange?: (value: number) => void;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface IconProps {
    className?: any;
    id?: string;
    name: string;
    size?: number;
    color?: string;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
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
    svg?: string;
    markup?: string;
    viewBox?: string;
    text?: string;
    font?: {
        family: string;
        glyph: string;
    };
    src?: string;
}
export interface HeadingProps {
    className?: any;
    style?: any;
    children?: any;
    id?: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface PlatformBadgeProps {
    className?: any;
}
export interface OverlayProps {
    open?: boolean;
    onDismiss?: () => void;
    /** Enables a RootLayout shade that dismisses when tapped. */
    shadeCover?: boolean;
    className?: any;
    style?: any;
    children?: any;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';
/** A platform-neutral ref to the host view or element that owns a popover. */
export interface PopoverAnchorRef {
    readonly current: unknown;
}
export interface PopoverProps {
    /** Ref to a native view or web element, commonly populated by `bind`. */
    anchor: PopoverAnchorRef;
    open?: boolean;
    placement?: PopoverPlacement;
    dismissOnOutsideTap?: boolean;
    onDismiss?: () => void;
    className?: any;
    style?: any;
    children?: any;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface HoverableProps {
    /** Content shown after the pointer rests over the children on web. */
    card: any;
    /** Styling for the card's wrapper view inside the popover — e.g. a
     *  pointer bridge covering the anchor↔card gap or a positional offset. */
    cardClassName?: any;
    cardStyle?: any;
    children?: any;
    openDelay?: number;
    closeDelay?: number;
    placement?: PopoverPlacement;
    className?: any;
    style?: any;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export type ToastContent = string | (() => any);
export type ToastPosition = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';
export interface ToastOptions {
    duration?: number;
    position?: ToastPosition;
    /** When set, the toast is positioned by Popover relative to this view. */
    anchor?: PopoverAnchorRef;
    /** Placement used with `anchor`; `position` supplies the top/bottom default. */
    placement?: PopoverPlacement;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface MeasureBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface UseMeasureOptions {
    /** Re-measure on layout, resize, scroll, and content-size changes. Defaults to true. */
    observe?: boolean;
}
export interface MeasureResult {
    /** Pass to a View's `bind` prop. */
    bind: (element: any) => void;
    bounds: MeasureBounds | null;
}
export interface ModalProps {
    open?: boolean;
    onClose?: (result?: ModalOpenResult) => void;
    fullscreen?: boolean;
    /** Native: sheet uses fullscreen=false (iOS form sheet; Android centered
     *  dialog), fullscreen uses fullscreen=true. Web: dialog is a centered
     *  card, sheet is bottom-anchored, fullscreen is the default dialog size. */
    presentation?: 'sheet' | 'fullscreen' | 'dialog';
    /** Component reference rendered inside the modal's separate root. When
     *  both component and children are set, component takes precedence. */
    component?: any;
    /** Props passed to component. Context and theme do not cross modal roots. */
    params?: any;
    children?: any;
}
/** Options for `openModal`. `fullscreen` is retained for callers using the
 *  NativeScript option directly; `presentation` takes precedence when set.
 *  Android's non-fullscreen modal is a centered dialog, not a bottom sheet. */
export interface ModalOpenOptions {
    presentation?: 'sheet' | 'fullscreen' | 'dialog';
    fullscreen?: boolean;
    animated?: boolean;
}
/** Value supplied to a modal close callback and returned by `openModal`. */
export type ModalOpenResult = unknown;
/** Public function shape of the imperative modal service. */
export type OpenModal = (component: any, params?: any, options?: ModalOpenOptions) => Promise<ModalOpenResult>;
/** Declarative in-window sheet: bottom-anchored panel on the enclosing
 *  screen's RootLayout (native) or a document-body portal layer (web).
 *  Unlike `Modal presentation='sheet'` (system modal), content stays
 *  inside the app window — same window region as the declaring page. */
export interface SheetProps {
    open?: boolean;
    /** Called when the shade is tapped or the sheet is dismissed by the
     *  platform — not on programmatic `open`→`false` transitions. */
    onDismiss?: () => void;
    /** Dim backdrop + tap-to-dismiss (default true). */
    shadeCover?: boolean;
    className?: any;
    style?: any;
    children?: any;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
/** Options for the imperative `openSheet` service. */
export interface SheetOpenOptions {
    shadeCover?: boolean;
}
/** Imperative sheet: mounts `component` on a dedicated root in a bottom
 *  sheet and resolves with the value passed to `close(result)`. The
 *  component receives `{ params, close }`. */
export type OpenSheet = (component: any, params?: any, options?: SheetOpenOptions) => Promise<ModalOpenResult>;
export interface TabSpec {
    title: string;
    render: () => any;
    /** Named parallel stack — native hosts a Frame per such pane; on web
     *  the pane is the route outlet for `stack` (pushed screens render in
     *  place). navigate(name, params, {into: spec.stack}) targets it. */
    stack?: string;
}
export interface TabsProps {
    className?: any;
    style?: any;
    id?: string;
    tabs: readonly TabSpec[];
    selectedIndex?: number;
    onSelectedIndexChanged?: (index: number) => void;
    /** Renders a pushed route's screen by name (the app owns the table).
     *  Web: route outlet. Native: pushes render inside the pane's Frame. */
    resolveScreen?: (name: string, params: Record<string, unknown>) => any;
}
export interface Route {
    stack: string;
    name: string;
    params: Record<string, unknown>;
    /** 'push' (default) pushes onto the stack · 'modal' opens its own root
     *  (native: `showModal`; web: overlay pane, URL preserved) · 'fade' is a
     *  push with a fade transition. A `+modal`/`+fade` filename suffix in
     *  the route dir sets the manifest default; this field overrides it. */
    presentation?: 'push' | 'modal' | 'fade';
    /** Loader result supplied to the route screen as `data`. */
    loaderData?: unknown;
    /** Loader rejection supplied to the route screen as `error`. */
    loaderError?: unknown;
    /** Context returned by the route's `beforeLoad` export. It is merged into
     * screen props and remains available from `useRoute`. */
    context?: RouteContext;
}
/** Values shared by a route guard and the screen it admits. */
export type RouteContext = Record<string, unknown>;
export interface BeforeLoadArgs {
    params: Record<string, unknown>;
    context: RouteContext;
}
export type BeforeLoad = (args: BeforeLoadArgs) => RouteContext | void | Promise<RouteContext | void>;
/** The deliberately small cross-platform head surface. `meta` keys become
 * web `<meta name="..." content="...">` tags; native consumes `title`. */
export interface RouteHead {
    title?: string;
    meta?: Record<string, string>;
}
export type RouteHeadExport = RouteHead | ((params: Record<string, unknown>) => RouteHead);
export interface LinkProps {
    href: string;
    target?: string;
    className?: any;
    children?: any;
}
export interface NavLinkProps {
    route: Route;
    activeClassName?: string;
    className?: any;
    children?: any;
}
/** name → screen component table for `registerScreens` — the app owns the
 *  route table; native `pushRoute` resolves `route.name` through it and
 *  web outlets fall back to it via `screenFor`. Values are component
 *  functions (`() => Element` / UniversalComponent shapes both fit). */
export type ScreenTable = Record<string, any>;
/** One route file's entry in the derived manifest. `name` is the file
 *  path under the route dir with `[param]` segments normalized to
 *  `:param` (`app/demo/[id].tsrx` → `demo/:id`); `segments` is the URL
 *  pattern used for web path matching/substitution. */
export interface RouteMeta {
    name: string;
    segments: string[];
    params: string[];
    /** Source file (glob key) — diagnostics only. */
    file: string;
    /** Declared default presentation — set by a `+modal`/`+fade` filename
     *  suffix (`app/settings+modal.tsrx` → route 'settings', modal). */
    presentation?: 'push' | 'modal' | 'fade';
    /** Optional `loader` named export — a prefetch hook, not a data layer.
     *  pushRoute fires it (fire-and-forget) before navigating so the
     *  screen's `query$` reads hit a warm cache; boot/deep-link routes
     *  skip it (the screen mounts in the same tick anyway). */
    loader?: (params: Record<string, unknown>) => unknown;
    /** Optional guard awaited before a push commits. A thrown `redirect(...)`
     * short-circuits the attempted route. */
    beforeLoad?: BeforeLoad;
    /** Optional route title/meta declaration, or a params-only function. */
    head?: RouteHeadExport;
}
/** Output of `deriveRouteManifest` — `screens` feeds `registerScreens`
 *  (native pushRoute + web outlet fallback), `routes` feeds web URL
 *  matching, `layouts` catalogs `_layout` files by directory ('' = root). */
export interface RouteManifest {
    screens: ScreenTable;
    routes: RouteMeta[];
    layouts: Record<string, any>;
    loaders?: Record<string, (params: Record<string, unknown>) => unknown | Promise<unknown>>;
}
export interface OpenWindowOptions {
    /** Data made available to the native window content resolver. */
    data?: Record<string, unknown>;
    /** Optional URL used by the web window. */
    url?: string;
}
/**
 * Value returned by `useAnimation(initial, prop)`. On web, `prop` supports
 * translateX/translateY/translateZ, scale/scaleX/scaleY, rotate/rotateX/
 * rotateY, and skewX/skewY as CSS transforms, plus `opacity` and other CSS
 * style properties. On NativeScript, `prop` is the name of a NativeScript
 * view property (for example, `translateX` or `opacity`).
 */
export interface AnimatedValue {
    readonly value: number;
    bind(el: any): void;
    to(target: number, opts?: {
        duration?: number;
    }): void;
    spring(target: number, opts?: {
        damping?: number;
        stiffness?: number;
    }): void;
    stop(): void;
}
export type ColorScheme = 'light' | 'dark';
/** Minimal external-store contract `useStore` subscribes to. */
export interface ReadableStore<T> {
    get(): T;
    subscribe(notify: () => void): () => void;
}
export interface Store<T> extends ReadableStore<T> {
    set(next: T | ((prev: T) => T)): void;
}
