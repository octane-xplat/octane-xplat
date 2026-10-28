import { validate } from './options'
import { ReadableStream } from 'web-streams-polyfill'
import type { StreamRequestOptions, StreamResponse } from './types'
import { response } from './response'
export type * from './types'
/** Browser incremental fetch with redirects/cookies disabled to match native. */
export async function requestStream(
	url: string,
	options: StreamRequestOptions = {},
): Promise<StreamResponse> {
	const { method, limit } = validate(url, options)
	const result = await fetch(url, {
		method,
		headers: options.headers,
		body: options.body as BodyInit | undefined,
		signal: options.signal as AbortSignal | undefined,
		redirect: 'error',
		credentials: 'omit',
	})
	if (!result.body) {
		return response(
			result.status,
			Object.fromEntries(result.headers.entries()),
			new ReadableStream<Uint8Array>({
				start(controller) {
					controller.close()
				},
			}),
		)
	}
	const reader = result.body.getReader()
	const body = new ReadableStream<Uint8Array>(
		{
			async pull(controller) {
				try {
					const next = await reader.read()
					if (next.done) {
						controller.close()
						reader.releaseLock()
					} else if (next.value.byteLength > limit) {
						await reader.cancel()
						reader.releaseLock()
						controller.error(new Error('Unread response exceeded maxBufferedBytes'))
					} else {
						controller.enqueue(next.value)
					}
				} catch (cause) {
					controller.error(cause)
					reader.releaseLock()
				}
			},
			async cancel(reason) {
				try {
					await reader.cancel(reason)
				} finally {
					reader.releaseLock()
				}
			},
		},
		{ highWaterMark: 0 },
	)
	return response(result.status, Object.fromEntries(result.headers.entries()), body)
}
