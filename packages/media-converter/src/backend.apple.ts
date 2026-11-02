import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { aborted } from './backend-types'
import type { ConversionBackend } from './backend-types'
import type { ConvertedVideo } from './types'
interface Engine {
	startCallback(json: string, callback: (event: string) => void): void
	cancel(id: string): void
	remove(uri: string): boolean
}
let engine: Engine | undefined
let serial = 0
function host(): Engine | undefined {
	const type = (globalThis as unknown as { XplatMediaConverter?: { new: () => Engine } })
		.XplatMediaConverter
	return (engine ??= type?.new())
}
export const backend: ConversionBackend = {
	isAvailable: async (format) => format === 'mp4' && Boolean(host()),
	async convert(source, request, control) {
		const value = host()
		if (!value) {
			throw new UnavailabilityError(
				'MediaConverter native bridge; rebuild the app after installation',
			)
		}
		const id = `conversion-${Date.now()}-${++serial}`
		return new Promise<ConvertedVideo>((resolve, reject) => {
			value.startCallback(JSON.stringify({ ...request, source, id }), (json) => {
				try {
					const event = JSON.parse(json) as {
						progress?: number
						result?: ConvertedVideo
						error?: string
						cancelled?: boolean
					}
					if (event.error) {
						reject(event.cancelled ? aborted() : new Error(event.error))
					} else if (event.result) {
						resolve(event.result)
					} else if (typeof event.progress === 'number') {
						control.progress(event.progress)
					}
				} catch (error) {
					value.cancel(id)
					reject(error)
				}
			})
			control.onCancel(() => value.cancel(id))
		})
	},
	release(uri) {
		if (!host()?.remove(uri)) {
			throw new Error('Could not remove the converted video')
		}
	},
}
