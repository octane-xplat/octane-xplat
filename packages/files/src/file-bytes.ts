/**
 * Shared helpers for the binary file primitives (readBytes/writeBytes/export).
 * DOM-free so the native leaf can use it too.
 */

/** File names used for sandbox writes and export temp files must be bare
 *  names, not paths — a `/`, `\`, or `..` segment escapes the sandbox. */
export function assertSafeFileName(name: string): void {
	if (
		typeof name !== 'string' ||
		name.length === 0 ||
		name === '.' ||
		name === '..' ||
		name.includes('/') ||
		name.includes('\\') ||
		name.includes('\0')
	) {
		throw new Error(`Unsafe file name: ${JSON.stringify(name)}`)
	}
}

export function fileTooLarge(name: string, maxBytes: number): Error {
	return new Error(`${name}: file exceeds the ${maxBytes}-byte limit`)
}

/** Named rejection for a second `files.export` while one is in flight. */
export function exportBusy(): Error {
	const error = new Error('files.export: an export is already in progress')
	error.name = 'ExportBusyError'
	return error
}

export function throwIfAborted(signal: AbortSignal | undefined): void {
	if (!signal?.aborted) {
		return
	}

	const thrower = (signal as { throwIfAborted?: () => void }).throwIfAborted
	if (typeof thrower === 'function') {
		thrower.call(signal)
	}

	const error = new Error('The operation was aborted')
	error.name = 'AbortError'
	throw error
}

/** Concatenate Uint8Array chunks into one exact-length array. */
export function concatBytes(chunks: Uint8Array[], total: number): Uint8Array {
	const out = new Uint8Array(total)
	let offset = 0
	for (const chunk of chunks) {
		out.set(chunk, offset)
		offset += chunk.byteLength
	}

	return out
}

/** Return an ArrayBuffer covering exactly this view's byte range — native
 *  marshallers treat the argument as the whole buffer. */
export function exactBuffer(bytes: Uint8Array): ArrayBuffer {
	if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
		return bytes.buffer as ArrayBuffer
	}

	return bytes.slice().buffer as ArrayBuffer
}
