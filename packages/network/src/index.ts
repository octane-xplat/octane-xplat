import { Application } from '@nativescript/core'
import { requestNative } from './native'
import type { StreamRequestOptions } from './types'
export type * from './types'
declare const XplatStreamingRequest: {
	new: () => { startEvent(options: string, event: (json: string) => void): void; cancel(): void }
}

type AndroidRequest = { start(options: string, events: object): void; cancel(): void }
declare const com: {
	xplat: {
		network: {
			StreamingRequest: {
				new (): AndroidRequest
				Events: new (callbacks: { onEvent(json: string): void }) => object
			}
		}
	}
}

/** Incremental native HTTP, independent of NativeScript's buffered global fetch. */
export function requestStream(url: string, options?: StreamRequestOptions) {
	return requestNative(
		() => {
			if (!Application.ios && !Application.android) {
				throw new Error('Incremental HTTP is unsupported on this native host')
			}
			if (Application.ios) {
				if (typeof XplatStreamingRequest === 'undefined') {
					throw new Error('Rebuild the app with @octane-xplat/network')
				}

				const native = XplatStreamingRequest.new()
				return { start: (o, e) => native.startEvent(o, e), cancel: () => native.cancel() }
			}
			const native = new com.xplat.network.StreamingRequest()
			return {
				start: (encoded, event) =>
					native.start(encoded, new com.xplat.network.StreamingRequest.Events({ onEvent: event })),
				cancel: () => native.cancel(),
			}
		},
		url,
		options,
	)
}
