/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';

export interface ShaderEffectProps {
	id?: string;
	className?: any;
	style?: any;
	/** AGSL source (Android Graphics Shading Language — a SkSL dialect).
	 *  The view's content is available through an input shader declared as
	 *  `uniform shader content;` and sampled via `content.eval(fragCoord)`. */
	source: string;
	/** float / float[] uniforms — forwarded to `RuntimeShader.setFloatUniform`
	 *  per key. `time` (seconds since mount) and `size` (host w,h in px) are
	 *  injected per frame while `animate` is on. */
	uniforms?: Record<string, number | number[]>;
	/** Tick `time` per vsync via Choreographer (default true). */
	animate?: boolean;
	children?: any;
}

// RenderEffect + RuntimeShader are API 33+ (Android 13).
const supported = () => ((globalThis as any).android?.os?.Build?.VERSION?.SDK_INT ?? 0) >= 33;

const setUniforms = (shader: any, uniforms: Record<string, number | number[]>) => {
	for (const [name, value] of Object.entries(uniforms)) {
		const floats = Array.isArray(value) ? value : [value];
		shader.setFloatUniform(name, ...floats);
	}
};

/** Applies an AGSL RuntimeShader to its subtree via RenderEffect —
 *  Android 13+ only; below that the children render untouched. Per-frame
 *  ticking happens on a Choreographer callback — uniforms cross the bridge
 *  per frame, the view hierarchy does not. */
export function ShaderEffect(props: ShaderEffectProps) @{
	const ref = useRef<any>(null);

	useEffect(() => {
		const view = ref.current;
		const native = view?.android;
		if (!native) {
			return;
		}

		if (!supported()) {
			console.warn('ShaderEffect: RuntimeShader requires Android 13 (API 33) — subtree renders without the effect');
			return;
		}

		const android = (globalThis as any).android;
		const shader = new android.graphics.RuntimeShader(props.source);
		const effect = android.graphics.RenderEffect.createRuntimeShaderEffect(shader, 'content');
		const apply = (timeSec: number) => {
			setUniforms(shader, props.uniforms ?? {});
			shader.setFloatUniform('time', timeSec);
			shader.setFloatUniform('size', native.getWidth(), native.getHeight());
			native.setRenderEffect(effect);
			native.invalidate();
		};

		apply(0);
		if (!(props.animate ?? true)) {
			return () => native.setRenderEffect(null);
		}

		let alive = true;
		const start = Date.now();
		const callback = new android.view.Choreographer.FrameCallback({
			doFrame: () => {
				if (!alive) {
					return;
				}

				apply((Date.now() - start) / 1000);
				android.view.Choreographer.getInstance().postFrameCallback(callback);
			},
		});

		android.view.Choreographer.getInstance().postFrameCallback(callback);
		return () => {
			alive = false;
			android.view.Choreographer.getInstance().removeFrameCallback(callback);
			native.setRenderEffect(null);
		};
	}, [props.source, props.uniforms, props.animate]);

	<gridlayout id={props.id} className={props.className} style={props.style} ref={ref}>
		{props.children}
	</gridlayout>;
}
