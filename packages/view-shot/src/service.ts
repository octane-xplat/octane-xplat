import { backend } from './backend'
import { normalizeOptions } from './options'
import { resolveTarget } from './targets'
import type { CaptureOptions, CaptureTarget } from './types'

export type ViewShotModule = Readonly<{
	readonly supported: boolean
	isAvailable(): Promise<boolean>
	readonly capabilities: Readonly<{
		formats: readonly ('png' | 'jpg' | 'webp')[]
		view: boolean
		screen: boolean
		scrollContent: boolean
	}>
	captureRef: typeof captureRef
	captureScreen: typeof captureScreen
	releaseCapture: typeof releaseCapture
}>

let pending: Promise<unknown> = Promise.resolve()
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
	const result = pending.then(operation)
	pending = result.catch(() => {})
	return result
}

/** Capture an app-owned host. The caller owns a tmpfile result until releaseCapture(). */
export async function captureRef(target: CaptureTarget, options?: CaptureOptions): Promise<string> {
	const host = resolveTarget(target)
	const normalized = normalizeOptions(options)
	backend.validate(host)
	return enqueue(async () => {
		backend.validate(host)
		return backend.capture(host, normalized)
	})
}

/** Capture the primary app screen only on hosts that explicitly support it. */
export async function captureScreen(options?: CaptureOptions): Promise<string> {
	const normalized = normalizeOptions(options)
	return enqueue(() => backend.captureScreen(normalized))
}

/** Idempotent; does not delete files/URLs created by a different owner. */
export function releaseCapture(uri: string): void {
	if (typeof uri !== 'string') {
		throw new TypeError('Capture URI must be a string')
	}
	backend.release(uri)
}

export const viewShot: ViewShotModule = Object.freeze({
	get supported(): boolean {
		return backend.capabilities().view
	},
	async isAvailable(): Promise<boolean> {
		return backend.capabilities().view
	},
	get capabilities(): Readonly<{
		formats: readonly ('png' | 'jpg' | 'webp')[]
		view: boolean
		screen: boolean
		scrollContent: boolean
	}> {
		const value = backend.capabilities()
		return Object.freeze({ ...value, formats: Object.freeze([...value.formats]) })
	},
	captureRef,
	captureScreen,
	releaseCapture,
})
