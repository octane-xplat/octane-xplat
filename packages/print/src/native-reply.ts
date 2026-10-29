import type { FilePrintResult, Printer } from './types'
/** Native payloads stay at this boundary; raw native objects never enter public declarations. */
export function invoke<T>(
	start: (callback: (json: string) => void) => void,
	read: (result: Record<string, unknown>) => T,
): Promise<T> {
	return new Promise((resolve, reject) => {
		try {
			start((json) => {
				try {
					const result: unknown = JSON.parse(json)
					if (!result || typeof result !== 'object' || Array.isArray(result)) {
						throw new Error('Invalid native print response')
					}
					const value = result as Record<string, unknown>
					if (value.ok !== true) {
						throw Object.assign(
							new Error(
								typeof value.message === 'string' ? value.message : 'Native printing failed',
							),
							{ code: typeof value.code === 'string' ? value.code : 'ERR_PRINT_FAILED' },
						)
					}
					resolve(read(value))
				} catch (error) {
					reject(error)
				}
			})
		} catch (error) {
			reject(error)
		}
	})
}
export function fileResult(value: Record<string, unknown>): FilePrintResult {
	if (
		typeof value.uri !== 'string' ||
		!Number.isSafeInteger(value.numberOfPages) ||
		Number(value.numberOfPages) < 1 ||
		(value.base64 !== undefined && typeof value.base64 !== 'string')
	) {
		throw new Error('Invalid native PDF response')
	}
	return {
		uri: value.uri,
		numberOfPages: Number(value.numberOfPages),
		...(typeof value.base64 === 'string' && { base64: value.base64 }),
	}
}
export function printerResult(value: Record<string, unknown>): Printer {
	if (typeof value.name !== 'string' || typeof value.url !== 'string') {
		throw new Error('Invalid native printer response')
	}
	return { name: value.name, url: value.url }
}
