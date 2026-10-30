import { requestNative } from './native'
import type { StreamRequestOptions, StreamResponse } from './types'
export type * from './types'
declare const XplatStreamingRequest: {
	new: () => { startEvent(options: string, event: (json: string) => void): void; cancel(): void }
}

/** AppKit host requires the package-owned NSURLSession bridge. */
export function requestStream(
	url: string,
	options?: StreamRequestOptions,
): Promise<StreamResponse> {
	return requestNative(
		() => {
			if (typeof XplatStreamingRequest === 'undefined') {
				throw new Error('Rebuild the app with @octane-xplat/network')
			}
			const native = XplatStreamingRequest.new()
			return { start: (o, e) => native.startEvent(o, e), cancel: () => native.cancel() }
		},
		url,
		options,
	)
}
