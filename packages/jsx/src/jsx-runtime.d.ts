/**
 * `@octane-xplat/jsx/jsx-runtime` — default export condition.
 *
 * The shared native JSX contract with an opaque `HostElement`: the type a
 * consumer gets when neither the `native` nor `macos` condition is enabled.
 * Target-conditioned declarations (`./native.d.ts`, `./macos.d.ts`) bind the
 * same surface to a concrete host class; only the host element value type
 * changes, never the intrinsic membership.
 *
 * Types only — the compiler lowers JSX before any factory could run.
 */
import type { ElementTypeOf, NativeElements, NativeNode, Ref } from './shared.js';

export * from './shared.js';

declare const sharedHostElement: unique symbol;
/**
 * Opaque host element — non-`unknown` so accidental member access still
 * fails typechecking, and non-assignable so a default-checked library cannot
 * forge or depend on a concrete platform view. Target-conditioned resolution
 * replaces it with the concrete NativeScript or AppKit host type.
 */
export interface HostElement {
	readonly [sharedHostElement]: 'shared-native-host';
}

export declare namespace JSX {
	type Element = NativeNode;
	type ElementType = ElementTypeOf;
	interface IntrinsicElements extends NativeElements<HostElement> {}
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
