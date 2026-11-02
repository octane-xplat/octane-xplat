import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { aborted } from './backend-types'
import type { ConversionBackend } from './backend-types'
import type { ConvertedVideo } from './types'

interface WorkerMessage {
	output?: string
	progress?: number
	result?: ConvertedVideo
	error?: string
}
interface ConversionWorker {
	postMessage(message: unknown): void
	onmessage: ((event: { data: WorkerMessage }) => void) | null
	terminate(): void
}
const WorkerClass = (
	globalThis as { Worker?: new (script: URL | string) => ConversionWorker }
).Worker

// Mirrors the packaged engine's ownership boundary: only xplat-video-* files
// directly inside the temporary directory may be removed. removeItemAtURLError
// throws the NSError rather than returning NO.
function remove(uri: string): boolean {
	const url = NSURL.URLWithString(uri)
	if (!url || String(url.scheme) !== 'file') {
		return false
	}
	const path = String(url.path ?? '')
	const temporary = String(NSFileManager.defaultManager.temporaryDirectory.path ?? '')
	const name = path.startsWith(temporary) ? path.slice(temporary.length) : ''
	if (!name.startsWith('xplat-video-') || name.includes('/')) {
		return false
	}
	try {
		if (NSFileManager.defaultManager.fileExistsAtPath(path)) {
			NSFileManager.defaultManager.removeItemAtURLError(url)
		}
		return true
	} catch {
		return false
	}
}

// One NativeScript worker isolate per conversion keeps the ImageIO decode and
// H.264 frame loop off the main queue. The runtime emits the worker chunk from
// the new URL(...) specifier; the isolate is terminated on settle or cancel.
// Host delivery uses worker.onmessage — the iOS Worker object exposes no
// addEventListener in this runtime.
export const backend: ConversionBackend = {
	isAvailable: async (format) => format === 'mp4' && typeof WorkerClass === 'function',
	async convert(source, request, control) {
		if (!WorkerClass) {
			throw new UnavailabilityError('MediaConverter worker; rebuild the app after installation')
		}
		// The literal `new Worker(new URL(...))` form is required: rolldown-vite
		// only compiles the worker chunk and rewrites the specifier when it can
		// statically see the Worker constructor — an aliased constructor emits a
		// raw .ts asset and hands the runtime a URL object it cannot spawn.
		const worker = new Worker(
			new URL('./converter-worker.ios.ts', import.meta.url),
		) as unknown as ConversionWorker
		return new Promise<ConvertedVideo>((resolve, reject) => {
			let output: string | undefined
			let settled = false
			const onMessage = (event: { data: WorkerMessage }) => {
				const message = event.data
				if (typeof message.progress === 'number') {
					control.progress(message.progress)
				} else if (message.output) {
					output = message.output
				} else if (message.error) {
					settle(() => reject(new Error(message.error)))
				} else if (message.result) {
					const result = message.result
					// A finished output is the caller's — suppress host cleanup.
					output = undefined
					settle(() => resolve(result))
				}
			}
			const settle = (action: () => void) => {
				if (settled) {
					return
				}
				settled = true
				worker.onmessage = null
				worker.terminate()
				action()
				if (output) {
					remove(output)
				}
			}
			worker.onmessage = onMessage
			control.onCancel(() => settle(() => reject(aborted())))
			worker.postMessage({ ...request, source })
		})
	},
	release(uri) {
		if (!remove(uri)) {
			throw new Error('Could not remove the converted video')
		}
	},
}
