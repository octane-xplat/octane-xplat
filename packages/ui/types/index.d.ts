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
	ColorScheme,
	ImageProps,
	ListProps,
	ModalProps,
	PlatformBadgeProps,
	PressableProps,
	ReadableStore,
	Route,
	RowProps,
	ScreenProps,
	ScrollViewProps,
	Store,
	SwitchProps,
	TabSpec,
	TabsProps,
	TextInputProps,
	TextProps,
	ViewProps,
} from './props';

export type {
	AnimatedValue,
	ColorScheme,
	ImageProps,
	ListProps,
	ModalProps,
	PanEvent,
	PlatformBadgeProps,
	PressableProps,
	ReadableStore,
	Route,
	RowProps,
	ScreenProps,
	ScrollViewProps,
	Store,
	SwipeEvent,
	SwitchProps,
	TabSpec,
	TabsProps,
	TextInputProps,
	TextProps,
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
export declare const List: UniversalComponent<ListProps>;
export declare const ScrollView: UniversalComponent<ScrollViewProps>;
export declare const Image: UniversalComponent<ImageProps>;
export declare const Screen: UniversalComponent<ScreenProps>;
export declare const Switch: UniversalComponent<SwitchProps>;
export declare const PlatformBadge: UniversalComponent<PlatformBadgeProps>;

// ---------- overlays / shells ----------

export declare const Modal: UniversalComponent<ModalProps>;
export declare const Tabs: UniversalComponent<TabsProps>;

// ---------- stacks (native registry; no-op on web) ----------

export declare function registerStack(name: string, frame: any): void;
export declare function getStack(name: string): any;
export declare function stackEntries(): IterableIterator<[string, any]>;

// ---------- routes (web store; no-op on native) ----------

export declare function pushRoute(r: Route): void;
export declare function routeFor(stack: string): Route | null;
export declare function currentRoute(): Route | null;
export declare function useRoute(stack: string): Route | null;

// ---------- animation / theme ----------

export declare function useAnimation(initial?: number, prop?: string): AnimatedValue;
export declare function getColorScheme(): ColorScheme;
export declare function useColorScheme(): ColorScheme;

// ---------- styled ----------

export declare function styled<P extends { className?: any }, V extends Record<string, any>>(
	Base: (props: P) => any,
	def: { base?: any; variants?: V },
): UniversalComponent<P & { [K in keyof V]?: boolean }>;

// ---------- stores ----------

export declare function createStore<T>(initial: T): Store<T>;
export declare function useStore<T>(store: ReadableStore<T>): T;
export declare function useStore<T, S>(store: ReadableStore<T>, select: (state: T) => S): S;
