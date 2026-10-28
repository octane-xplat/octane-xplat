/**
 * `@octane-xplat/jsx/jsx-runtime` — `gtk` export condition (Linux/GTK4, GJS).
 *
 * The same shared contract as the default entry, with `HostElement` bound to
 * the `GtkWidget` the GTK driver hands to refs and host events. Viewless
 * intrinsics bind to `LogicalElement` instead. Intrinsic membership and prop
 * names are unchanged — only the host element value type is conditioned.
 * This entry never references `gi://` introspection types: the widget shape
 * is declared structurally so the facade stays resolvable outside GJS.
 *
 * Types only — the compiler lowers JSX before any factory could run.
 */
import type {
	Attributes,
	ElementTypeOf,
	NativeElements,
	NativeNode,
	Ref,
	FormattedStringProps,
	SpanProps,
} from './shared.js'

export * from './shared.js'

/**
 * GTK4 host element — the `GtkWidget` the GTK driver hands to refs. The
 * members below are the GtkWidget surface the driver itself uses; the index
 * signature keeps GI-marshalled members reachable, matching how the renderer
 * exposes GTK objects.
 */
export interface HostElement {
	set_sensitive(sensitive: boolean): void
	set_visible(visible: boolean): void
	set_size_request(width: number, height: number): void
	add_css_class(name: string): void
	remove_css_class(name: string): void
	visible: boolean
	[key: string]: any
}

/** Public instance of a viewless intrinsic. It owns logical identity and
 * children without allocating a GtkWidget. Universal refs retain this
 * instance across updates and clear it on replacement or disposal. */
export interface LogicalElement {
	readonly id: number
	readonly type: string
	readonly view: null
}

export declare namespace JSX {
	type Element = NativeNode
	type ElementType = ElementTypeOf
	interface IntrinsicElements extends Omit<
		NativeElements<HostElement>,
		'proxyviewcontainer' | 'contentview' | 'rootlayout' | 'formattedstring' | 'span'
	> {
		proxyviewcontainer: Attributes<LogicalElement>
		contentview: Attributes<LogicalElement>
		rootlayout: Attributes<LogicalElement>
		formattedstring: Attributes<LogicalElement, FormattedStringProps>
		span: Attributes<LogicalElement, SpanProps>
	}

	interface IntrinsicAttributes {
		key?: string | number
	}

	interface IntrinsicClassAttributes<T> {
		ref?: Ref<T>
	}

	interface ElementChildrenAttribute {
		children: {}
	}
}

export declare function jsx(type: ElementTypeOf, props: unknown, key?: unknown): JSX.Element
export declare function jsxs(type: ElementTypeOf, props: unknown, key?: unknown): JSX.Element
export declare function jsxDEV(
	type: ElementTypeOf,
	props: unknown,
	key?: unknown,
	isStaticChildren?: boolean,
	source?: unknown,
	self?: unknown,
): JSX.Element

export declare function Fragment(props: { children?: NativeNode }): JSX.Element
