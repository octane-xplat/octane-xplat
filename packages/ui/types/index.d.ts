// Boundary types for @octane-xplat/ui — the thin shell over the real
// contract. Every interface lives in `src/props.ts` (imported by both
// platform leaves and emitted here as `./props`), so the ONLY hand-written
// part is the mechanical `declare const X: UniversalComponent<XProps>`
// wrapper — component shapes can't drift from the source. tsrx-tsc can't
// emit declarations for .tsrx (upstream: tsrx-org/tsrx#136); this file is
// what `tsc --emitDeclarationOnly` on pure .ts buys us.

import type { UniversalComponent } from 'octane/universal';
import type {
	AnimatedValue,
	ActivityIndicatorProps,
	ColorScheme,
	DrawerProps,
	HeadingProps,
	IconGlyph,
	IconProps,
	ImageProps,
	KeyboardAvoidingProps,
	ListProps,
	ModalProps,
	ModalOpenOptions,
	ModalOpenResult,
	OpenModal,
	OverlayProps,
	PopoverPlacement,
	PopoverProps,
	PlatformBadgeProps,
	PressableProps,
	ReadableStore,
	Route,
	RouteManifest,
	RouteMeta,
	RowProps,
	ScreenProps,
	SafeAreaProps,
	ScreenTable,
	ScrollViewProps,
	SliderProps,
	Store,
	SwitchProps,
	TabSpec,
	TabsProps,
	TextAreaProps,
	TextInputProps,
	TextProps,
	ToastContent,
	ToastOptions,
	ToastPosition,
	ViewProps,
} from './props';

export type {
	AnimatedValue,
	ActivityIndicatorProps,
	ColorScheme,
	DrawerProps,
	HeadingProps,
	IconGlyph,
	IconProps,
	ImageProps,
	KeyboardAvoidingProps,
	ListProps,
	ModalProps,
	ModalOpenOptions,
	ModalOpenResult,
	OpenModal,
	OverlayProps,
	PopoverPlacement,
	PopoverProps,
	PanEvent,
	PlatformBadgeProps,
	PressableProps,
	ReadableStore,
	Route,
	RouteManifest,
	RouteMeta,
	RowProps,
	ScreenProps,
	SafeAreaProps,
	ScreenTable,
	ScrollViewProps,
	SliderProps,
	Store,
	SwipeEvent,
	SwitchProps,
	TabSpec,
	TabsProps,
	TextAreaProps,
	TextInputProps,
	TextProps,
	ToastContent,
	ToastOptions,
	ToastPosition,
	ViewProps,
} from './props';

// ---------- primitives ----------

export declare const View: UniversalComponent<ViewProps>;
/** Column-direction alias of View. */
export declare const Column: UniversalComponent<ViewProps>;
export declare const Row: UniversalComponent<RowProps>;
export declare const Text: UniversalComponent<TextProps>;
export declare const Pressable: UniversalComponent<PressableProps>;
export declare const TextInput: UniversalComponent<TextInputProps>;
export declare const TextArea: UniversalComponent<TextAreaProps>;
export declare const List: UniversalComponent<ListProps>;
export declare const ScrollView: UniversalComponent<ScrollViewProps>;
export declare const Image: UniversalComponent<ImageProps>;
export declare const Screen: UniversalComponent<ScreenProps>;
export declare const SafeArea: UniversalComponent<SafeAreaProps>;
export declare const KeyboardAvoiding: UniversalComponent<KeyboardAvoidingProps>;
export declare const Drawer: UniversalComponent<DrawerProps>;
export declare const Switch: UniversalComponent<SwitchProps>;
export declare const ActivityIndicator: UniversalComponent<ActivityIndicatorProps>;
export declare const Slider: UniversalComponent<SliderProps>;
export declare const Icon: UniversalComponent<IconProps>;
export declare const Heading: UniversalComponent<HeadingProps>;
export declare const PlatformBadge: UniversalComponent<PlatformBadgeProps>;

export declare function registerIcon(name: string, glyph: IconGlyph): void;
export declare function registerIcons(record: Record<string, IconGlyph>): void;

// ---------- overlays / shells ----------

export declare const Modal: UniversalComponent<ModalProps>;
export declare const openModal: OpenModal;
export declare const Overlay: UniversalComponent<OverlayProps>;
export declare const Popover: UniversalComponent<PopoverProps>;
export declare function showToast(content: ToastContent, options?: ToastOptions): void;
export declare const Tabs: UniversalComponent<TabsProps>;

// ---------- stacks (native registry; no-op on web) ----------

export declare function registerStack(name: string, frame: any): void;
export declare function getStack(name: string): any;
export declare function stackEntries(): IterableIterator<[string, any]>;

// ---------- routes (real on both: URL store on web, Frame stacks on native) ----------

export declare function pushRoute(r: Route): void;
export declare function popRoute(stack?: string): void;
export declare function routeFor(stack: string): Route | null;
export declare function currentRoute(): Route | null;
export declare function useRoute(stack: string): Route | null;
/** name → screen table; native pushRoute resolves `route.name` through
 *  it, web outlets fall back to it via `screenFor`. `manifest` (from
 *  deriveRouteManifest) enables path-param URL matching on web. Call
 *  once at boot. */
export declare function registerScreens(table: ScreenTable, manifest?: RouteMeta[]): void;
/** One-call registration for route-dir apps — screens + URL patterns +
 *  layouts all come from deriveRouteManifest. */
export declare function registerRoutes(manifest: RouteManifest): void;
export declare function screenFor(name: string): any;
/** Canonical /<stack>/<path> for a Route — Link's href on web. */
export declare function hrefFor(r: Route): string;

// ---------- route dir (file → route manifest; docs/navigation-notes.md) ----------

/** Turn an `import.meta.glob` module map of the route dir into
 *  {screens, routes, layouts}: `demo/[id].tsrx` → 'demo/:id',
 *  `_layout.tsrx` → layouts[''], platform suffixes deduped by `prefer`
 *  rank (web: ['web']; native: ['ios'|'android','native']). */
export declare function deriveRouteManifest(
	files: Record<string, any>,
	prefer: readonly string[],
	dir?: string,
): RouteManifest;

// ---------- animation / theme ----------

export declare function useAnimation(initial?: number, prop?: string): AnimatedValue;
export declare function getColorScheme(): ColorScheme;
export declare function useColorScheme(): ColorScheme;
export interface SafeAreaInsets { top: number; right: number; bottom: number; left: number; }
export declare function useSafeAreaInsets(): SafeAreaInsets;

// ---------- styled ----------

export declare function styled<P extends { className?: any }, V extends Record<string, any>>(
	Base: (props: P) => any,
	def: { base?: any; variants?: V },
): UniversalComponent<P & { [K in keyof V]?: boolean }>;

// ---------- stores ----------

export declare function createStore<T>(initial: T): Store<T>;
export declare function useStore<T>(store: ReadableStore<T>): T;
export declare function useStore<T, S>(store: ReadableStore<T>, select: (state: T) => S): S;
