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
export interface ViewProps {
    className?: any;
    style?: any;
    children?: any;
    id?: string;
    /** `ref` is runtime-reserved on component elements — leaves expose
     *  `bind` to reach the native/DOM node. */
    bind?: (el: any) => void;
    onPan?: (e: PanEvent) => void;
    onSwipe?: (e: SwipeEvent) => void;
}
export interface RowProps {
    className?: any;
    style?: any;
    children?: any;
}
export interface TextProps {
    className?: any;
    style?: any;
    children?: any;
}
export interface PressableProps {
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
    accessibilityRole?: string;
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
}
export interface TextAreaProps extends TextInputProps {
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
    /** Metadata hint only in v1. Switch heterogeneous row markup in renderItem;
     *  the current renderers do not consume this value. */
    kindFor?: (item: any) => string;
    /** Native iOS row-height estimate. Web virtualization is not enabled in v1. */
    estimatedItemHeight?: number;
    /** Called when the list approaches its end. */
    onEndReached?: () => void;
    /** Platform escape hatches, applied after the shared props. */
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface ScrollViewProps {
    className?: any;
    style?: any;
    id?: string;
    horizontal?: boolean;
    children?: any;
}
export interface ImageProps {
    className?: any;
    style?: any;
    id?: string;
    src: string;
    alt?: string;
}
export interface ScreenProps {
    className?: any;
    style?: any;
    children?: any;
}
export interface SafeAreaProps {
    className?: any;
    style?: any;
    children?: any;
    /** NativeScript props applied to the host after shared props. */
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface KeyboardAvoidingProps {
    className?: any;
    style?: any;
    children?: any;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export interface DrawerProps {
    className?: any;
    style?: any;
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
export interface PopoverProps {
    /** Native view or web element, commonly a ref object populated by `bind`. */
    anchor?: any;
    open?: boolean;
    placement?: PopoverPlacement;
    className?: any;
    style?: any;
    children?: any;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
}
export type ToastContent = string | (() => any);
export type ToastPosition = 'top' | 'bottom';
export interface ToastOptions {
    duration?: number;
    position?: ToastPosition;
    ios?: Record<string, any>;
    android?: Record<string, any>;
    web?: Record<string, any>;
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
}
/** Output of `deriveRouteManifest` — `screens` feeds `registerScreens`
 *  (native pushRoute + web outlet fallback), `routes` feeds web URL
 *  matching, `layouts` catalogs `_layout` files by directory ('' = root). */
export interface RouteManifest {
    screens: ScreenTable;
    routes: RouteMeta[];
    layouts: Record<string, any>;
}
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
