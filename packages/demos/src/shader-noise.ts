// ShaderDemo host logic — lives in .ts because the universal compiler
// rejects async functions inside .tsrx files (same split as
// canvas-wgsl.ts).
import { createShader, prefersReducedMotion } from '@octane-xplat/shaders'
import type { AbortSignalLike, PresetConfig, ShaderInstance } from '@octane-xplat/shaders'

export const SIMPLEX_PRESET: PresetConfig = {
	components: [
		{
			id: 'background',
			type: 'SimplexNoise',
			props: {
				colorA: '#0f172a',
				colorB: '#7c3aed',
				scale: 2,
				seed: 7,
				speed: 0.5,
			},
		},
	],
}

export interface ShaderMount {
	readonly instance: Promise<ShaderInstance>
	/** Cancellation token — aborting an in-flight mount destroys the late
	 *  instance instead of reviving a disposed surface. */
	readonly signal: AbortSignalLike & { abort(): void }
}

/** Mount the preset on a ready Canvas surface. `onError` carries the
 *  upstream failure-reason vocabulary so the caller can keep its static
 *  fallback. */
export function mountShader(
	canvas: unknown,
	callbacks: { onReady: () => void; onError: (reason: string) => void },
): ShaderMount {
	const signal = {
		aborted: false,
		abort() {
			this.aborted = true
		},
	}

	const instance = createShader(canvas, SIMPLEX_PRESET, {
		signal,
		onReady: callbacks.onReady,
		onError: callbacks.onError,
	})

	return { instance, signal }
}

/** Reduced motion → hold the first rendered frame instead of animating. */
export function applyMotionPreference(instance: ShaderInstance): boolean {
	if (!prefersReducedMotion()) {return false}
	instance.pause()
	return true
}
