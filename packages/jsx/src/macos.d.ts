/**
 * `@octane-xplat/jsx/jsx-runtime` — `macos` export condition.
 *
 * The same shared contract as the default entry, with `HostElement` bound to
 * the bridged AppKit `NSView` the macOS driver hands to refs and host
 * events. Viewless intrinsics bind to `LogicalElement` instead. Intrinsic
 * membership and prop names are unchanged — only the host element value type
 * is conditioned. This entry never references
 * `@nativescript/core`: it resolves for macOS consumers without any
 * NativeScript dependency, and wins over `native` when both conditions are
 * enabled.
 *
 * Types only — the compiler lowers JSX before any factory could run.
 */
import type { Attributes, ElementTypeOf, NativeElements, NativeNode, Ref } from './shared.js';

export * from './shared.js';

/**
 * AppKit host element — the bridged `NSView` the AppKit driver hands to
 * refs. Beyond the declared members, bridged members stay `any`, matching
 * how the renderer exposes AppKit objects.
 */
export interface HostElement {
	addSubview(subview: HostElement): void;
	removeFromSuperview(): void;
	readonly subviews: HostElement[];
	hidden: boolean;
	[key: string]: any;
}

/** Public instance of a viewless intrinsic. It owns logical identity and
 * children without allocating an NSView. Universal refs retain this instance
 * across updates and clear it on replacement or disposal. */
export interface LogicalElement {
	readonly id: number;
	readonly type: string;
	readonly view: null;
}

export declare namespace JSX {
	type Element = NativeNode;
	type ElementType = ElementTypeOf;
	interface IntrinsicElements extends Omit<NativeElements<HostElement>, 'proxyviewcontainer'> {
		proxyviewcontainer: Attributes<LogicalElement>;
	}
	interface IntrinsicAttributes {
		key?: string | number;
	}

	interface IntrinsicClassAttributes<T> {
		ref?: Ref<T>;
	}

	interface ElementChildrenAttribute {
		children: {};
	}
}

export declare function jsx(type: ElementTypeOf, props: unknown, key?: unknown): JSX.Element;
export declare function jsxs(type: ElementTypeOf, props: unknown, key?: unknown): JSX.Element;
export declare function jsxDEV(
	type: ElementTypeOf,
	props: unknown,
	key?: unknown,
	isStaticChildren?: boolean,
	source?: unknown,
	self?: unknown,
): JSX.Element;

export declare function Fragment(props: { children?: NativeNode }): JSX.Element;
