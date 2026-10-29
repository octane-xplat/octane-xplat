import type { CaptureLifecycleProps } from './props'
import { bindComponentTarget } from './targets'
import type { CaptureOptions, ViewShotRef } from './types'

interface Dependencies {
	capture(host: object, options?: CaptureOptions): Promise<string>
	release(uri: string): void
	waitForLayout(host: object, cancelled: () => boolean): Promise<void>
}
/** Resource ownership independent of the Octane renderer; no host mutation. */
export function createCaptureController(
	read: () => CaptureLifecycleProps,
	dependencies: Dependencies,
) {
	let host: object | null = null
	let generation = 0
	let disposed = false
	let running = false
	let requested = false
	let mountAttempted = false
	let automaticURI: string | undefined
	const handle: ViewShotRef = {
		async capture() {
			const current = host
			const stamp = generation
			if (disposed || !current) {
				throw new Error('ViewShot is not mounted')
			}
			const uri = await dependencies.capture(current, read().options)
			if (disposed || stamp !== generation) {
				dependencies.release(uri)
				throw new Error('ViewShot unmounted before capture finished')
			}
			// A manual result transfers to the caller and is never auto-released.
			return uri
		},
	}
	bindComponentTarget(handle, () => (disposed ? null : host))
	async function pump() {
		if (running || disposed || !host || !requested) {
			return
		}
		running = true
		try {
			while (requested && !disposed && host) {
				requested = false
				const current = host
				const stamp = generation
				mountAttempted = true
				const cancelled = () => disposed || stamp !== generation
				try {
					await dependencies.waitForLayout(current, cancelled)
					if (cancelled() || !read().captureMode) {
						continue
					}
					const uri = await dependencies.capture(current, read().options)
					if (cancelled() || !read().captureMode) {
						dependencies.release(uri)
						continue
					}
					const previous = automaticURI
					automaticURI = uri
					if (previous && previous !== uri) {
						dependencies.release(previous)
					}
					read().onCapture?.(uri)
				} catch (error) {
					if (!cancelled()) {
						const failure = read().onCaptureFailure
						if (failure) {
							failure(error instanceof Error ? error : new Error(String(error)))
						} else {
							console.warn('ViewShot automatic capture failed; handle it in onCaptureFailure.')
						}
					}
				}
			}
		} finally {
			running = false
		}
	}
	function rendered() {
		if (disposed) {
			return
		}
		const mode = read().captureMode
		if (mode === 'continuous') {
			throw new Error(
				'Continuous ViewShot capture is outside the supported subset; use manual capture or update mode',
			)
		}
		if (mode === 'update' || (mode === 'mount' && !mountAttempted)) {
			requested = true
		}
		if (!mode) {
			requested = false
		}
		void pump()
	}
	return {
		handle,
		attach(value: object | null) {
			if (disposed || value === host) {
				return
			}
			host = value
			mountAttempted = false
			generation++
		},
		rendered,
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			host = null
			generation++
			requested = false
			if (automaticURI) {
				dependencies.release(automaticURI)
			}
			automaticURI = undefined
		},
	}
}
