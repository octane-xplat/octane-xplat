/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import { Canvas as NSCanvas } from '@nativescript/canvas';
import type { CanvasProps } from './props';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		nscanvas: Attributes<typeof NSCanvas>;
	}
}

// @nativescript/canvas — Skia + wgpu core exposing the DOM Canvas API
// (2d, webgl, webgl2, webgpu) on iOS + Android. Element name is `nscanvas`
// rather than `canvas` because `canvas` is DOM vocabulary in the
// element-vocabulary lint.
registerElement('nscanvas', NSCanvas);

/** Canvas — DOM Canvas API surface on native. `onReady` wraps the plugin's
 *  `ready` event: it fires once the GPU surface exists, which is the
 *  earliest `getContext` may be called. */
export function Canvas(props: CanvasProps) @{
	const ready = (event: any) => {
		const canvas = event.object;
		props.onReady?.({
			canvas,
			context: props.context ? canvas.getContext(props.context) : null,
		});
	};

	<nscanvas
		id={props.id}
		className={props.className}
		style={props.style}
		width={props.width as any}
		height={props.height as any}
		onReady={ready}
	/>;
}
