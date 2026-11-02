import { decodeNdjson } from 'rouzer/ndjson'
import { requestStream } from '../src/index.web'
export async function messages(url: string) {
	const response = await requestStream(url)
	// Rouzer declares the DOM stream type; our transport uses a portable ponyfill.
	const reader = response.body.getReader()
	const stream = new ReadableStream<Uint8Array>({
		async pull(controller) {
			try {
				const next = await reader.read()
				if (next.done) {
					controller.close()
					reader.releaseLock()
				} else {
					controller.enqueue(next.value)
				}
			} catch (error) {
				controller.error(error)
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
	})
	return decodeNdjson<{ text: string }>(stream)
}
