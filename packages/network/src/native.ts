import { validate } from './options'
import { ReadableStream, type ReadableStreamDefaultController } from 'web-streams-polyfill'
import { encode, decode } from './base64'
import { Encoder } from './encoding'
import { response } from './response'
import type { StreamRequestOptions, StreamResponse } from './types'

export interface NativeRequest {
	start(options: string, event: (json: string) => void): void
	cancel(): void
}

export function requestNative(
	create: () => NativeRequest,
	url: string,
	options: StreamRequestOptions = {},
): Promise<StreamResponse> {
	let method: string, limit: number
	try {
		;({ method, limit } = validate(url, options))
	} catch (cause) {
		return Promise.reject(cause)
	}
	if (options.signal?.aborted) {
		return Promise.reject(aborted())
	}
	return new Promise((resolve, reject) => {
		const native = create()
		let ended = false
		let receivedHeaders = false
		let size = 0
		let controller!: ReadableStreamDefaultController<Uint8Array>
		const cleanup = () => options.signal?.removeEventListener('abort', abort)
		const finish = (error?: Error) => {
			if (ended) {
				return
			}
			ended = true
			cleanup()
			if (error) {
				try {
					native.cancel()
				} catch {
					/* Preserve the original transport failure. */
				}

				controller.error(error)
				reject(error)
			} else {
				controller.close()
			}
		}
		const abort = () => finish(aborted())
		const stream = new ReadableStream<Uint8Array>(
			{
				start(value) {
					controller = value
				},
				cancel(): void {
					ended = true
					cleanup()
					native.cancel()
				},
			},
			{ highWaterMark: limit, size: (value) => value.byteLength },
		)
		options.signal?.addEventListener('abort', abort)
		if (options.signal?.aborted) {
			abort()
			return
		}
		try {
			native.start(
				JSON.stringify({
					url,
					method,
					headers: options.headers ?? {},
					body:
						options.body === undefined
							? undefined
							: encode(
									typeof options.body === 'string'
										? new Encoder().encode(options.body)
										: options.body,
								),
				}),
				(json) => {
					if (ended) {
						return
					}
					try {
						const event = JSON.parse(json)
						if (event.type === 'headers') {
							if (
								receivedHeaders ||
								!Number.isInteger(event.status) ||
								event.status < 100 ||
								event.status > 599
							) {
								throw new Error('Invalid response headers')
							}

							receivedHeaders = true
							if (event.status >= 300 && event.status < 400) {
								finish(new Error('Incremental transport does not follow redirects'))
								return
							}

							resolve(response(event.status, event.headers, stream))
						} else if (event.type === 'data') {
							if (!receivedHeaders) {
								throw new Error('Body arrived before headers')
							}

							const bytes = decode(event.data)
							// A push backend cancels instead of retaining an unbounded unread body.
							size = limit - (controller.desiredSize ?? 0) + bytes.byteLength
							if (size > limit) {
								finish(new Error('Unread response exceeded maxBufferedBytes'))
								return
							}

							controller.enqueue(bytes)
						} else if (event.type === 'end') {
							finish(receivedHeaders ? undefined : new Error('Response ended before headers'))
						} else if (event.type === 'error') {
							finish(new Error('Incremental HTTP request failed'))
						} else {
							throw new Error('Unknown transport event')
						}
					} catch {
						finish(new Error('Invalid incremental transport event'))
					}
				},
			)
		} catch {
			finish(new Error('Unable to start incremental HTTP request'))
		}
	})
}

function aborted(): Error {
	const error = new Error('Request aborted')
	error.name = 'AbortError'
	return error
}
