import { Application } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { TrackingBackend } from './backend-types'
interface Engine {
	Callback: new (implementation: { receive(json: string): void }) => object
	available(context: android.content.Context): boolean
	readAdvertisingId(context: android.content.Context, callback: object): void
}
function engine(): Engine | undefined {
	return (
		globalThis as unknown as { com?: { octanexplat?: { tracking?: { TrackingBridge?: Engine } } } }
	).com?.octanexplat?.tracking?.TrackingBridge
}
function context(): android.content.Context {
	const context = Application.android.context as android.content.Context | undefined
	if (!context) {
		throw new Error('An initialized Android app is required')
	}
	return context
}
function identifierAvailable(): boolean {
	try {
		return Boolean(engine()?.available(context()))
	} catch {
		return false
	}
}
export const backend: TrackingBackend = {
	capabilities: () => ({
		prompt: false,
		advertisingId: false,
		advertisingIdAsync: identifierAvailable(),
	}),
	read: () => -1,
	async request() {
		return -1
	},
	advertisingId() {
		throw new UnavailabilityError(
			'Synchronous Android advertising ID on NativeScript; use getAdvertisingIdAsync',
		)
	},
	advertisingIdAsync: () =>
		new Promise<string | null>((resolve, reject) => {
			const native = engine()
			if (!native) {
				throw new UnavailabilityError(
					'Native Android advertising ID bridge; rebuild the app after installation',
				)
			}
			native.readAdvertisingId(
				context(),
				new native.Callback({
					receive(json) {
						try {
							const value: unknown = JSON.parse(json)
							if (!value || typeof value !== 'object') {
								throw new Error('Malformed advertising identifier reply')
							}
							const reply = value as { identifier?: unknown; error?: unknown }
							if (typeof reply.error === 'string') {
								throw new Error(reply.error)
							}
							if (reply.identifier !== null && typeof reply.identifier !== 'string') {
								throw new Error('Malformed advertising identifier value')
							}
							resolve(reply.identifier)
						} catch (error) {
							reject(
								error instanceof SyntaxError
									? new Error('Malformed advertising identifier reply')
									: error,
							)
						}
					},
				}),
			)
		}),
}
