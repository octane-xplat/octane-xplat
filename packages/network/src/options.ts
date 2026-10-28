import type { StreamRequestOptions } from './types'
export function validate(url: string, options: StreamRequestOptions) {
	if (!/^https?:\/\/[^\s/@]+(?::\d+)?(?:[/?#]|$)/i.test(url)) {
		throw new Error('An absolute HTTP(S) URL without credentials is required')
	}
	if (
		options.body !== undefined &&
		typeof options.body !== 'string' &&
		Object.prototype.toString.call(options.body) !== '[object Uint8Array]'
	) {
		throw new Error('Request body must be text or Uint8Array')
	}
	const method = (options.method ?? 'GET').toUpperCase()
	if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(method)) {
		throw new Error('Unsupported HTTP method')
	}
	if ((method === 'GET' || method === 'HEAD') && options.body !== undefined) {
		throw new Error('GET and HEAD cannot have a body')
	}
	for (const [name, value] of Object.entries(options.headers ?? {})) {
		if (!/^[!#$%&'*+.^_`|~0-9a-z-]+$/i.test(name) || /[\r\n]/.test(value)) {
			throw new Error('Invalid request header')
		}

		if (
			/^(cookie2?|host|content-length|connection|transfer-encoding|upgrade|proxy-.*)$/i.test(name)
		) {
			throw new Error('Unsupported request header')
		}
	}
	const limit = options.maxBufferedBytes ?? 1048576
	if (!Number.isSafeInteger(limit) || limit < 1) {
		throw new RangeError('maxBufferedBytes must be a positive safe integer')
	}
	return { method, limit }
}
