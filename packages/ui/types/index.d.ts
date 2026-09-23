// Hand-written boundary types for @octane-xplat/ui.
//
// Why hand-written: tsrx-tsc (TS 5.9 classic path) cannot emit declarations,
// and the TS-7 native path emits `*.d.tsrx.ts` that require consumers to set
// `allowArbitraryExtensions` — neither works for a published package. Tracked
// upstream in tsrx-org/tsrx#136. The public surface is platform-uniform by
// design, so ONE file serves both the `web` and `native` export conditions.
//
// Drift risk is real (props live in the .tsrx leaves). Keep this file next
// to the leaves it describes; `pnpm pack` + the smoke app are the check.

import type { UniversalComponent } from 'octane/universal';

// ---------- gestures ----------

export interface PanEvent {
	x: number; y: number; dx: number; dy: number;
	vx: number; vy: number; state: string; target: any;
}
export interface SwipeEvent { direction: number; }

// ---------- primitives ----------

export interface ViewProps {
	className?: any; style?: any; children?: any; id?: string;
	bind?: (el: any) => void;
	onPan?: (e: PanEvent) => void;
	onSwipe?: (e: SwipeEvent) => void;
}
export declare const View: UniversalComponent<ViewProps>;
/** Row-direction alias of View. */
export declare const Column: UniversalComponent<ViewProps>;

export declare const Row: UniversalComponent<{
	className?: any; style?: any; children?: any;
}>;

export declare const Text: UniversalComponent<{
	className?: any; style?: any; children?: any;
}>;

export interface PressableProps {
	className?: any; style?: any; children?: any; id?: string;
	disabled?: boolean;
	onPress?: () => void;
	accessible?: boolean;
	accessibilityLabel?: string;
	accessibilityRole?: string;
}
export declare const Pressable: UniversalComponent<PressableProps>;

export declare const TextInput: UniversalComponent<{
	className?: any; style?: any;
	value?: string; placeholder?: string;
	onChange?: (value: string) => void;
}>;

export declare const List: UniversalComponent<{
	className?: any; style?: any; id?: string;
	items: any[];
	renderItem: (item: any) => any;
	renderEmpty?: () => any;
}>;

export declare const ScrollView: UniversalComponent<{
	className?: any; style?: any; id?: string;
	horizontal?: boolean; children?: any;
}>;

export declare const Image: UniversalComponent<{
	className?: any; style?: any; id?: string;
	src: string; alt?: string;
}>;

export declare const Screen: UniversalComponent<{
	className?: any; style?: any; children?: any;
}>;

export declare const Switch: UniversalComponent<{
	className?: any; style?: any; id?: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}>;

export declare const PlatformBadge: UniversalComponent<{ className?: any }>;

// ---------- overlays ----------

export declare const Modal: UniversalComponent<{
	open?: boolean;
	onClose?: () => void;
	fullscreen?: boolean;
	children?: any;
}>;

// ---------- tabs / navigation shells ----------

export interface TabSpec {
	title: string;
	render: () => any;
	/** Named parallel stack — native hosts a Frame per such pane; on web
	 *  the pane is the route outlet for `stack`. */
	stack?: string;
}

export declare const Tabs: UniversalComponent<{
	className?: any; style?: any; id?: string;
	tabs: readonly TabSpec[];
	selectedIndex?: number;
	onSelectedIndexChanged?: (index: number) => void;
	resolveScreen?: (name: string, params: Record<string, unknown>) => any;
}>;

// ---------- stacks (native registry; no-op on web) ----------

export declare function registerStack(name: string, frame: any): void;
export declare function getStack(name: string): any;
export declare function stackEntries(): IterableIterator<[string, any]>;

// ---------- routes (web store; no-op on native) ----------

export interface Route {
	stack: string;
	name: string;
	params: Record<string, unknown>;
}
export declare function pushRoute(r: Route): void;
export declare function routeFor(stack: string): Route | null;
export declare function currentRoute(): Route | null;
export declare function useRoute(stack: string): Route | null;

// ---------- animation ----------

export interface AnimatedValue {
	readonly value: number;
	bind(el: any): void;
	to(target: number, opts?: { duration?: number }): void;
	spring(target: number, opts?: { damping?: number; stiffness?: number }): void;
	stop(): void;
}
export declare function useAnimation(initial?: number, prop?: string): AnimatedValue;

// ---------- theme ----------

export type ColorScheme = 'light' | 'dark';
export declare function getColorScheme(): ColorScheme;
export declare function useColorScheme(): ColorScheme;

// ---------- styled ----------

export declare function styled<P extends { className?: any }, V extends Record<string, any>>(
	Base: (props: P) => any,
	def: { base?: any; variants?: V },
): UniversalComponent<P & { [K in keyof V]?: boolean }>;
