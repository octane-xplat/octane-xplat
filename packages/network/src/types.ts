/** Minimal headers exposed by incremental responses; names are case-insensitive. */
export interface StreamHeaders {
	/** Case-insensitive lookup; null when the header is absent. */
	get(name: string): string | null
}

/** A single-consumer byte stream; cancellation releases the underlying request. */
export type StreamBody = import('web-streams-polyfill').ReadableStream<Uint8Array>
/** Supported portable request subset. Redirects and cookie credentials are rejected. */
export interface StreamRequestOptions {
	/** HTTP method; defaults to GET. */
	method?: string
	/** Request headers; cookie credentials are rejected, so these are the
	 *  only credentials a request can carry. */
	headers?: Record<string, string>
	/** Text or bytes; no FormData, Blob, Request, or streaming uploads. */
	body?: string | Uint8Array
	/** AbortSignal-shaped cancellation hook (structurally typed so both the
	 *  DOM signal and lightweight test doubles are accepted). */
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
	/** HTTP status code; non-2xx responses remain readable rather than rejecting. */
	readonly status: number
	/** True for 200-299. */
	readonly ok: boolean
	/** Response headers, available before the body completes. */
	readonly headers: StreamHeaders
	/** Single-consumer byte stream; cancelling it releases the request. */
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
