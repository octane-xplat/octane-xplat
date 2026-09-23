/** Shared prop/type contract — the single source of truth for the public
 *  API surface. Platform leaves import these types so prop shapes cannot
 *  drift across .web/.native, and `tsc --emitDeclarationOnly` emits this
 *  file into the published package's boundary types (tsrx can't emit
 *  declarations — pure .ts is what escapes that). No imports here:
 *  everything must stay dependency-free and platform-agnostic. */

// ---------- gestures ----------

export interface PanEvent {
	x: number; y: number; dx: number; dy: number;
	vx: number; vy: number; state: string; target: any;
}
export interface SwipeEvent { direction: number; }

// ---------- primitives ----------

export interface ViewProps {
	className?: any; style?: any; children?: any; id?: string;
	/** `ref` is runtime-reserved on component elements — leaves expose
	 *  `bind` to reach the native/DOM node. */
	bind?: (el: any) => void;
	onPan?: (e: PanEvent) => void;
	onSwipe?: (e: SwipeEvent) => void;
}

export interface RowProps { className?: any; style?: any; children?: any; }

export interface TextProps { className?: any; style?: any; children?: any; }

export interface PressableProps {
	className?: any; style?: any; children?: any; id?: string;
	disabled?: boolean;
	onPress?: () => void;
	/** ~500ms press-and-hold (web: timer over pointerdown/up). */
	onLongPress?: () => void;
	accessible?: boolean;
	accessibilityLabel?: string;
	accessibilityRole?: string;
}

export interface TextInputProps {
	className?: any; style?: any;
	value?: string; placeholder?: string;
	/** NativeScript's term for placeholder — web maps hint → placeholder. */
	hint?: string;
	onChange?: (value: string) => void;
}

export interface ListProps {
	className?: any; style?: any; id?: string;
	items: any[];
	renderItem: (item: any) => any;
	renderEmpty?: () => any;
}

export interface ScrollViewProps {
	className?: any; style?: any; id?: string;
	horizontal?: boolean; children?: any;
}

export interface ImageProps {
	className?: any; style?: any; id?: string;
	src: string; alt?: string;
}

export interface ScreenProps { className?: any; style?: any; children?: any; }

export interface SwitchProps {
	className?: any; style?: any; id?: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}

export interface PlatformBadgeProps { className?: any; }

// ---------- overlays ----------

export interface ModalProps {
	open?: boolean;
	onClose?: () => void;
	fullscreen?: boolean;
	children?: any;
}

// ---------- tabs / navigation shells ----------

export interface TabSpec {
	title: string;
	render: () => any;
	/** Named parallel stack — native hosts a Frame per such pane; on web
	 *  the pane is the route outlet for `stack` (pushed screens render in
	 *  place). navigate(name, params, {into: spec.stack}) targets it. */
	stack?: string;
}

export interface TabsProps {
	className?: any; style?: any; id?: string;
	tabs: readonly TabSpec[];
	selectedIndex?: number;
	onSelectedIndexChanged?: (index: number) => void;
	/** Renders a pushed route's screen by name (the app owns the table).
	 *  Web: route outlet. Native: pushes render inside the pane's Frame. */
	resolveScreen?: (name: string, params: Record<string, unknown>) => any;
}

// ---------- routes ----------

export interface Route {
	stack: string;
	name: string;
	params: Record<string, unknown>;
}

// ---------- animation ----------

export interface AnimatedValue {
	readonly value: number;
	bind(el: any): void;
	to(target: number, opts?: { duration?: number }): void;
	spring(target: number, opts?: { damping?: number; stiffness?: number }): void;
	stop(): void;
}

// ---------- theme ----------

export type ColorScheme = 'light' | 'dark';
