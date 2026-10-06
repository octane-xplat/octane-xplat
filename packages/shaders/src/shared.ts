// Shared adapter internals — platform-free. No DOM globals, no
// NativeScript imports; each platform leaf injects its measure/attach
// hooks.

import type { AbortSignalLike, CreateShaderOptions, ShaderInstance } from './types'

export function abortError(): Error {
	const error = new Error('createShader aborted before initialization completed')
	error.name = 'AbortError'
	return error
}

export function throwIfAborted(signal?: AbortSignalLike): void {
	if (signal?.aborted) {throw abortError()}
}

export interface Size {
	width: number
	height: number
}

/** Defer until the surface reports a positive size (surface not attached /
 *  zero-size layout → wait, don't init). Aborts via `signal`. */
export function waitForPositiveSize(
	measure: () => Size,
	signal?: AbortSignalLike,
): Promise<void> {
	const first = measure()
	if (first.width > 0 && first.height > 0) {return Promise.resolve()}
	return new Promise<void>((resolve, reject) => {
		let timer: ReturnType<typeof setTimeout> | undefined
		const stop = () => {
			if (timer !== undefined) {clearTimeout(timer)}
			signal?.removeEventListener?.('abort', onAbort)
		}

		const onAbort = () => {
			stop()
			reject(abortError())
		}

		const poll = () => {
			if (signal?.aborted) {return onAbort()}
			const size = measure()
			if (size.width > 0 && size.height > 0) {
				stop()
				resolve()
				return
			}

			timer = setTimeout(poll, 50)
		}

		signal?.addEventListener?.('abort', onAbort)
		timer = setTimeout(poll, 50)
	})
}

/** Merge caller options with adapter defaults. `disableTelemetry` defaults
 *  on for this package's local/preset-driven use; callers may re-enable it.
 *  The adapter-only `signal` key is stripped before reaching upstream. */
export function resolveOptions(
	options: CreateShaderOptions | undefined,
	platformDefaults: Partial<CreateShaderOptions>,
): { upstream: Omit<CreateShaderOptions, 'signal'>; signal?: AbortSignalLike } {
	const { signal, ...rest } = options ?? {}
	return {
		signal,
		upstream: {
			...platformDefaults,
			...rest,
			disableTelemetry: options?.disableTelemetry ?? true,
		},
	}
}

/** Subscribe/unsubscribe pair for host hide/show (backgrounding, detach,
 *  document visibility). */
export type AttachLifecycle = (hide: () => void, show: () => void) => () => void

/** Wrap the upstream instance so host suspension composes with caller
 *  pause instead of overriding it: host hide pauses, host show resumes
 *  only when the caller did not explicitly pause. `destroy` detaches all
 *  adapter-owned listeners before delegating. */
export function wrapInstance(inner: ShaderInstance, attach: AttachLifecycle): ShaderInstance {
	let callerPaused = false
	let hostSuspended = false
	let destroyed = false
	const detach = attach(
		() => {
			if (destroyed) {return}
			hostSuspended = true
			inner.pause()
		},
		() => {
			hostSuspended = false
			if (!destroyed && !callerPaused) {inner.resume()}
		},
	)

	return {
		getFailureReason: () => inner.getFailureReason(),
		update: (id, props) => inner.update(id, props),
		resize: (width?, height?) => inner.resize(width, height),
		pause: () => {
			callerPaused = true
			inner.pause()
		},
		resume: () => {
			callerPaused = false
			if (!hostSuspended) {inner.resume()}
		},
		destroy: () => {
			if (destroyed) {return}
			destroyed = true
			detach()
			inner.destroy()
		},
	}
}
