export type CanvasContextKind = '2d' | 'webgl' | 'webgl2' | 'webgpu' | 'bitmaprenderer'

export interface CanvasReady {
	/** HTMLCanvasElement on web, the plugin's Canvas view on iOS/Android.
	 *  AppKit supplies an unavailable handle whose `getContext()` always
	 *  returns null; it is not a native drawing surface. */
	canvas: any
	/** The resolved context for the `context` prop, or null when that
	 *  kind is unsupported/unavailable. WebGPU still needs a device —
	 *  `getGPU()` normalizes adapter/device acquisition. */
	context: any
}

export interface CanvasProps {
	className?: any
	style?: any
	id?: string
	/** Context kind resolved before `onReady` fires. Omit to defer
	 *  `getContext` to user code (only one kind per canvas — call once). */
	context?: CanvasContextKind
	/** Web: after mount. iOS/Android: the plugin's `ready` event (earlier
	 *  `getContext` calls can return null). AppKit: after the neutral frame
	 *  mounts, with context null. This callback does not guarantee drawing
	 *  or GPU readiness; check context or call canvas.getContext first. */
	onReady?: (ready: CanvasReady) => void
	/** Numeric values map to the element's width/height — on web that is
	 *  the canvas *drawing buffer* size (pair with style for display
	 *  size), on native dip size. */
	width?: string | number
	height?: string | number
}
