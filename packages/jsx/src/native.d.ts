/**
 * `@octane-xplat/jsx/jsx-runtime` — `native` export condition (iOS/Android).
 *
 * The same shared contract as the default entry, with `HostElement` bound to
 * the concrete NativeScript `View` class the driver hands to refs and host
 * events. Intrinsic membership and prop names are unchanged — only the host
 * element value type is conditioned. Resolving this entry requires
 * `@nativescript/core` (an optional peer); consumers without the `native`
 * condition never reach it.
 *
 * Types only — the compiler lowers JSX before any factory could run.
 */
// `@nativescript/core`'s root index re-exports `./ui` as a bare directory,
// which bundler-mode resolution indexes but node16/nodenext does not — the
// deep specifier keeps `View` resolvable under both modes.
import type { View } from '@nativescript/core/ui/core/view/index.js';
import type { ElementTypeOf, NativeElements, NativeNode, Ref } from './shared.js';

export * from './shared.js';

/** NativeScript host element — the `View` the driver creates for intrinsics. */
export type HostElement = View;

export declare namespace JSX {
	type Element = NativeNode;
	type ElementType = ElementTypeOf;
	interface IntrinsicElements extends NativeElements<View> {}
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
