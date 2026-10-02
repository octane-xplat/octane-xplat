// Boundary types for @octane-xplat/effects/android — handwritten (tsrx-tsc
// can't emit .tsrx declarations; same pattern as ui/types).
import type { UniversalComponent } from 'octane/universal'

export interface ShaderEffectProps {
	id?: string
	className?: any
	style?: any
	/** AGSL source (Android Graphics Shading Language — a SkSL dialect).
	 *  The view's content is available through an input shader declared as
	 *  `uniform shader content;` and sampled via `content.eval(fragCoord)`. */
	source: string
	/** float / float[] uniforms — forwarded to `RuntimeShader.setFloatUniform`
	 *  per key. `time` (seconds since mount) and `size` (host w,h in px) are
	 *  injected per frame while `animate` is on. */
	uniforms?: Record<string, number | number[]>
	/** Tick `time` per vsync via Choreographer (default true). */
	animate?: boolean
	children?: any
}

export declare const ShaderEffect: UniversalComponent<ShaderEffectProps>
