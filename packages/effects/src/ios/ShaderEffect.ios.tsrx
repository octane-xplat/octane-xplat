/** @jsxImportSource @nativescript-community/octane */
import { ContentView } from '@nativescript/core';
import { createNativeScriptRoot, registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import { SwiftUI, SwiftUIManager, UIDataDriver, registerSwiftUI } from '@nativescript/swift-ui';
import { useEffect, useRef } from 'octane';

// Compiled into the app target from this package's platforms/ios/src —
// the runtime exposes the @objc class by name.
declare const XplatShaderEffectProvider: any;

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatshader: Attributes<typeof SwiftUI>;
	}
}

registerElement('xplatshader', SwiftUI);
registerSwiftUI('xplat-shader-effect', (owner: any) => new UIDataDriver(new XplatShaderEffectProvider(), owner));

// The provider embeds a NativeScript view by id through the plugin's
// NativeScriptViewFactory; viewCreator resolves `id.split('-')[0]` in the
// registered map, so every ShaderEffect id shares the `xplatshader`
// prefix and resolves through this one lifecycle entry. Views here are
// detached — children mount into a ContentView that never joins the NS
// layout tree, and generateNativeView sets it up as a root view when the
// SwiftUI representable asks for it.
const contentById = new Map<string, ContentView>();
SwiftUIManager.registerNativeScriptViews({ xplatshader: true } as any, {
	create: (id: string) => contentById.get(id) ?? new ContentView(),
	destroy: (id: string) => contentById.delete(id),
} as any);

let nextId = 0;

const ChildrenHost = (props: { children?: any }) => @{ props.children };

export interface ShaderEffectProps {
	id?: string;
	className?: any;
	style?: any;
	/** Effect name registered via `XplatShaderEffectRegistry.register` in an
	 *  app Swift file. Kind (distortion/color/layer) comes from the
	 *  registration, not a prop. */
	effect: string;
	/** Uniform args forwarded to the shader factory. The provider injects
	 *  `time` (seconds since mount) and `size` (host bounds) per frame. */
	args?: Record<string, number | number[]>;
	/** Drive `time` at display rate (default true). Pass false for static
	 *  effects so the TimelineView pauses. */
	animate?: boolean;
	/** Max pixel offset distortion/layer shaders may displace — SwiftUI
	 *  sizes the sampled region from it; too small clips the effect. */
	maxSampleOffset?: { width: number; height: number };
	/** Events from the hosted SwiftUI content (provider `onEvent`). */
	onEvent?: (data: any) => void;
	children?: any;
}

/** Applies a named SwiftUI stitchable shader (iOS 17+) to its subtree.
 *  The subtree renders normally — into a detached ContentView embedded in
 *  the hosting SwiftUI view — so the shader sees real framework pixels. */
export function ShaderEffect(props: ShaderEffectProps) @{
	const idRef = useRef<string | null>(null);
	idRef.current ??= `xplatshader-${++nextId}`;
	const viewId = idRef.current;

	const detached = useRef<{ view: ContentView; root: any } | null>(null);
	useEffect(() => {
		const view = new ContentView();
		const root = createNativeScriptRoot(view);
		detached.current = { view, root };
		contentById.set(viewId, view);
		return () => {
			contentById.delete(viewId);
			root.unmount();
			detached.current = null;
		};
	}, []);

	useEffect(() => {
		detached.current?.root.render(ChildrenHost, { children: props.children });
	}, [props.children]);

	<xplatshader
		id={props.id}
		className={props.className}
		style={props.style}
		swiftId="xplat-shader-effect"
		data={{
			effect: props.effect,
			viewId,
			animate: props.animate ?? true,
			args: props.args ?? {},
			maxSampleOffset: props.maxSampleOffset ?? { width: 0, height: 0 },
		}}
		onSwiftUIEvent={(event: any) => props.onEvent?.(event.data)}
	/>;
}
