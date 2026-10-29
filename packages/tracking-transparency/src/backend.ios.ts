import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { TrackingBackend } from './backend-types'
interface Engine {
	available(): boolean
	read(): string
	request(completion: (json: string) => void): void
	advertisingId(): string | null
}
let instance: Engine | undefined
function engine(): Engine | undefined {
	const Type = (globalThis as unknown as { XplatTrackingTransparency?: { 'new'(): Engine } })
		.XplatTrackingTransparency
	return (instance ??= Type?.new())
}
function required(): Engine {
	const value = engine()
	if (!value) {
		throw new UnavailabilityError('Native tracking bridge; rebuild the app after installation')
	}
	return value
}
function status(json: string): number {
	const value: unknown = JSON.parse(json)
	if (!value || typeof value !== 'object') {
		throw new Error('Malformed tracking permission reply')
	}
	const reply = value as { error?: unknown; status?: unknown }
	if (typeof reply.error === 'string') {
		throw new Error(reply.error)
	}
	if (typeof reply.status !== 'number') {
		throw new Error('Malformed tracking permission status')
	}
	return reply.status
}
export const backend: TrackingBackend = {
	capabilities: () => ({
		prompt: Boolean(engine()?.available()),
		advertisingId: Boolean(engine()),
		advertisingIdAsync: Boolean(engine()),
	}),
	read: () => status(required().read()),
	request: () =>
		new Promise<number>((resolve, reject) => {
			required().request((json) => {
				try {
					resolve(status(json))
				} catch (error) {
					reject(error)
				}
			})
		}),
	advertisingId: () => required().advertisingId(),
	async advertisingIdAsync() {
		return required().advertisingId()
	},
}
