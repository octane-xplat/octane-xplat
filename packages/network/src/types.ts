/** Minimal headers exposed by incremental responses; names are case-insensitive. */
export interface StreamHeaders {
	get(name: string): string | null
}

/** A single-consumer byte stream; cancellation releases the underlying request. */
export type StreamBody = import('web-streams-polyfill').ReadableStream<Uint8Array>
/** Supported portable request subset. Redirects and cookie credentials are rejected. */
export interface StreamRequestOptions {
	method?: string
	headers?: Record<string, string>
	/** Text or bytes; no FormData, Blob, Request, or streaming uploads. */
	body?: string | Uint8Array
	signal?: {
		readonly aborted: boolean
		addEventListener(type: 'abort', listener: () => void): void
		removeEventListener(type: 'abort', listener: () => void): void
	}
	/** Maximum unread response bytes before cancellation. @default 1048576 */
	maxBufferedBytes?: number
}

/** Headers arrive before body completion. Non-2xx responses remain readable. */
export interface StreamResponse {
	readonly status: number
	readonly ok: boolean
	readonly headers: StreamHeaders
	readonly body: StreamBody
	/** Consume UTF-8 once; rejects beyond 1 MiB. Use body for larger data. */
	text(): Promise<string>
	/** Parse the same bounded text consumption as JSON. */
	json(): Promise<unknown>
}

/** Open an absolute HTTP(S) URL without replacing the global fetch implementation. */
export declare function requestStream(
	url: string,
	options?: StreamRequestOptions,
): Promise<StreamResponse>
