// Public contract for @octane-xplat/shaders — re-exports the upstream
// `shaders` types verbatim and declares the adapter's added surface. Kept
// platform-free: every platform leaf (web / native / macos stub) exposes
// exactly these names.

// Upstream types are re-exported as aliases rather than `export type {…}
// from 'shaders/js'` so they stay unambiguously type-only for the pack
// check even where the specifier can't be resolved.
export type ComponentConfig = import('shaders/js').ComponentConfig
export type GpuFailureReason = import('shaders/js').GpuFailureReason
export type PresetConfig = import('shaders/js').PresetConfig
export type ShaderInstance = import('shaders/js').ShaderInstance
export type ShaderOptions = import('shaders/js').ShaderOptions
export type WebGPUSupportInfo = import('shaders/js').WebGPUSupportInfo

/** Structural AbortSignal — the real DOM AbortSignal satisfies this; so
 *  does NativeScript's. Kept structural so shared code never names DOM
 *  globals. */
export interface AbortSignalLike {
	readonly aborted: boolean
	addEventListener?(type: 'abort', listener: () => void): void
	removeEventListener?(type: 'abort', listener: () => void): void
}

/** Externally acquired WebGPU device + adapter pair — the caller owns its
 *  lifetime. Pass to `createShader` via `options.gpu` to share one device
 *  across instances. */
export interface SharedGpu {
	device: any
	adapter: any
}

/** Upstream `ShaderOptions` plus adapter lifecycle glue. Preset, component
 *  names, parameters, and all other fields keep upstream semantics. */
export interface CreateShaderOptions extends ShaderOptions {
	/** Aborts deferred or in-flight initialization — e.g. the surface
	 *  unmounted while the engine was still starting. A late completion is
	 *  destroyed, never revived. */
	signal?: AbortSignalLike
}

/** Create a shader on an Xplat Canvas surface (the `canvas` from
 *  `CanvasReady`: HTMLCanvasElement on web, `@nativescript/canvas` view on
 *  native). Same signature shape and return contract as upstream
 *  `createShader` — the resolved instance keeps upstream
 *  `update/resize/pause/resume/destroy/getFailureReason` semantics.
 *
 *  Adapter additions, all documented:
 *  - `disableTelemetry` defaults to true (upstream default is off → on).
 *  - Init defers until the surface reports a positive size.
 *  - Host suspension (app background, surface detach, document hidden)
 *    pauses rendering without overriding an explicit caller `pause()`.
 *  - `options.signal` cancels before init completes.
 *  - On native, the canvas is wrapped in a DOM-canvas-shaped facade and
 *    `navigator.gpu` is lazily bound to the `@nativescript/canvas` GPU
 *    shim so upstream capability checks and device-loss recovery work.
 *
 *  On unsupported hosts (native desktop) the returned promise resolves to
 *  a no-op instance whose `getFailureReason()` is `'unsupported'`. */
export declare function createShader(
	canvas: unknown,
	preset: PresetConfig,
	options?: CreateShaderOptions,
): Promise<ShaderInstance>

/** Acquire a WebGPU `{device, adapter}` through the platform entry point
 *  (`navigator.gpu` on web, the `@nativescript/canvas` GPU shim on native).
 *  Resolves null where WebGPU is unavailable — keep the static fallback in
 *  that case. The caller owns the device; the adapter never destroys it. */
export declare function createSharedDevice(options?: {
	powerPreference?: string
}): Promise<SharedGpu | null>

/** True when a WebGPU entry point exists. On native this reflects the
 *  `@nativescript/canvas` GPU shim, not actual driver capability — request
 *  an adapter via `createSharedDevice()`/`getWebGPUSupport()` for a real
 *  check. */
export declare function isWebGPUSupported(): boolean

/** Async capability probe — resolves `{supported, reason?}` using upstream
 *  failure-reason vocabulary ('unsupported', 'no-adapter', …). */
export declare function getWebGPUSupport(): Promise<WebGPUSupportInfo>

/** OS-level reduced-motion preference. Use it to hold a still frame
 *  (pause after the first rendered frame) or keep the static fallback. */
export declare function prefersReducedMotion(): boolean
