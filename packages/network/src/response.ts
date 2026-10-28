import { Decoder } from './encoding'
import type { StreamBody, StreamResponse } from './types'

export function response(
	status: number,
	headers: Record<string, string>,
	body: StreamBody,
): StreamResponse {
	let consumed = false
	const normalized = new Map(
		Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
	)
	return {
		status,
		ok: status >= 200 && status < 300,
		headers: { get: (name) => normalized.get(name.toLowerCase()) ?? null },
		body,
		async text() {
			if (consumed) {
				throw new Error('Response body was already consumed')
			}
			consumed = true
			let bytes = 0
			const reader = body.getReader()
			const decoder = new Decoder('utf-8', { fatal: true })
			let text = ''
			try {
				while (true) {
					const next = await reader.read()
					if (next.done) {
						break
					}

					bytes += next.value.byteLength
					if (bytes > 1048576) {
						throw new Error('Text response exceeded 1 MiB; consume body incrementally')
					}

					text += decoder.decode(next.value, { stream: true })
				}

				return text + decoder.decode()
			} catch (cause) {
				await reader.cancel(cause).catch(() => {})
				throw cause
			} finally {
				reader.releaseLock()
			}
		},
		async json() {
			return JSON.parse(await this.text())
		},
	}
}
