/** @jsxImportSource @nativescript-community/octane */
import { ContentView } from '@nativescript/core';
import { createNativeScriptRoot, registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import { SwiftUI, SwiftUIManager, UIDataDriver, registerSwiftUI } from '@nativescript/swift-ui';
import { useEffect, useRef } from 'octane';

// Compiled into the app target from this package's platforms/ios/src —
// the runtime exposes the @objc class by name.
declare const XplatShaderEffectProvider: any;
declare const NativeScriptViewFactory: { shared?: any; initShared(): void };

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
// NativeScriptView(id:) appends '-<UUID>' to the id it hands back through
// the factory, so lifecycle callbacks arrive as 'xplatshader-N-<uuid>'
// while contentById is keyed by the JS id 'xplatshader-N'. Recover the JS
// id by prefix match — our ids never contain a '-' beyond the prefix.
const resolveViewId = (id: string) => {
	for (const key of contentById.keys()) {
		if (id === key || id.startsWith(`${key}-`)) {
			return key;
		}
	}

	return id;
};

// Guard the whole registration: this leaf resolves under the bare `native`
// condition, so importing it on Android must warn rather than throw on the
// iOS-only NativeScriptViewFactory global at module evaluation.
if (typeof NativeScriptViewFactory === 'undefined') {
	console.warn('@octane-xplat/effects/ios is iOS-only — this import is a no-op on other targets');
} else {
	// The harness uses NativeScript's Obj-C bootstrap, which leaves this
	// SwiftUI view factory uninitialized. SwiftUIManager installs its
	// lifecycle hooks on the singleton, so initialize it before the
	// module-level registration.
	if (!NativeScriptViewFactory.shared) {
		NativeScriptViewFactory.initShared();
	}

	SwiftUIManager.registerNativeScriptViews({ xplatshader: true } as any, {
		create: (id: string) => {
			const view = contentById.get(resolveViewId(id));
			if (!view) {
				// A miss here gets cached by the plugin and permanently
				// locks in an empty view — never fail silently.
				console.warn(`xplatshader: no registered content for ${id} — embedding an empty view`);
				return new ContentView();
			}

			return view;
		},
		destroy: (id: string) => contentById.delete(resolveViewId(id)),
	} as any);
}

let nextId = 0;

const ChildrenHost = (props: { children?: any }) => @{ props.children };

export interface ShaderEffectProps {
	id?: string;
	className?: any;
	style?: any;
	/** Effect name — a bundled name ('heatHaze' | 'sheen' | 'shatter') or a
	 *  custom name registered via `XplatShaderEffectRegistry.register` in an
	 *  app Swift file. Kind comes from the registration, not a prop. */
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
 *  the hosting SwiftUI view — so the shader sees real framework pixels.
 *
 *  Children mount through a separate octane root: createContext/useContext
 *  values from ancestors do NOT cross this boundary — context reads inside
 *  the subtree resolve to defaults. Signals are global and still work;
 *  pass context-dependent values in through props instead. */
export function ShaderEffect(props: ShaderEffectProps) @{
	const idRef = useRef<string | null>(null);
	idRef.current ??= `xplatshader-${++nextId}`;
	const viewId = idRef.current;

	// Register the host view before mount completes — the SwiftUI factory
	// may ask for it before the mount effect runs, and a missed lookup
	// caches an empty view permanently.
	const hostRef = useRef<ContentView | null>(null);
	hostRef.current ??= new ContentView();
	contentById.set(viewId, hostRef.current);

	const detached = useRef<{ view: ContentView; root: any } | null>(null);
	useEffect(() => {
		const view = hostRef.current!;
		const root = createNativeScriptRoot(view);
		detached.current = { view, root };
		return () => {
			contentById.delete(viewId);
			root.unmount();
			detached.current = null;
		};
	}, [viewId]);

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
