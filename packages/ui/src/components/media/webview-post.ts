/** Page side of the `WebView.onMessage` contract — the embedded document's
 *  half. Embedded content is always browser JS (even inside WKWebView /
 *  android.webkit.WebView), so one function maps onto every engine's
 *  transport instead of each page learning per-platform APIs.
 *
 *  Delivery is ordered and at-least-once; there is no reply channel. The
 *  helper also queues an outbox that native leaves drain with
 *  `evaluateJavaScript` — the pull path covers engines where a push
 *  transport is unavailable or arrives after early messages. */

export const WEBVIEW_MESSAGE_SOURCE = 'xplat-webview'
export const WEBVIEW_OUTBOX_KEY = '__xplatWebViewOutbox'
const OUTBOX_LIMIT = 100

/** Removes and returns the queued page→host values as a JSON array.
 *  `globalThis` so it evaluates inside any document global. */
export const WEBVIEW_DRAIN_SCRIPT = `(() => {
	const o = globalThis.${WEBVIEW_OUTBOX_KEY};
	return o && o.length ? JSON.stringify(o.splice(0, o.length)) : null;
})()`

interface WebViewMessageEnvelope {
	source: typeof WEBVIEW_MESSAGE_SOURCE
	data: unknown
}

/** Envelope used on the iframe `postMessage` transport so the host can
 *  distinguish contract traffic from arbitrary page messages. */
export function isWebViewMessage(value: unknown): value is WebViewMessageEnvelope {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as WebViewMessageEnvelope).source === WEBVIEW_MESSAGE_SOURCE
	)
}

/** Parse a drained outbox batch — the drain script returns a JSON array
 *  of posted values, or null when the queue was empty. Android's
 *  `evaluateJavascript` callback carries the result JSON-encoded, so pass
 *  `jsonEncoded` to unwrap the transport encoding first. */
export function parseMessageBatch(value: unknown, jsonEncoded?: boolean): unknown[] | null {
	let result = value
	if (jsonEncoded) {
		try {
			result = JSON.parse(String(value))
		} catch {
			return null
		}
	}

	if (result == null) {
		return null
	}

	try {
		const batch = JSON.parse(String(result))
		return Array.isArray(batch) ? batch : null
	} catch {
		return null
	}
}

function parentTargetOrigin(scope: any): string {
	try {
		const ancestors = scope.location?.ancestorOrigins
		if (ancestors?.length) {
			return ancestors[0]
		}

		const referrer = scope.document?.referrer
		if (referrer) {
			return new URL(referrer).origin
		}
	} catch {
		// fall through to the wildcard below
	}

	return '*'
}

/** Post a JSON-serializable value to the host's `onMessage`. Returns false
 *  when no transport exists (standalone page, or a host that did not opt
 *  in) or the value cannot serialize. */
export function postToHost(value: unknown): boolean {
	let serialized: string
	try {
		serialized = JSON.stringify(value)
		if (serialized === undefined) {
			return false
		}
	} catch {
		return false
	}

	const scope = globalThis as any
	const outbox = (scope[WEBVIEW_OUTBOX_KEY] ??= [])
	if (outbox.length >= OUTBOX_LIMIT) {
		outbox.shift()
	}

	outbox.push(value)

	const webkit = scope.webkit?.messageHandlers?.xplatWebView
	if (webkit) {
		webkit.postMessage(serialized)
		return true
	}

	if (scope.__xplatWebView?.postMessage) {
		scope.__xplatWebView.postMessage(serialized)
		return true
	}

	const parent = scope.parent
	if (parent && parent !== scope) {
		try {
			parent.postMessage({ source: WEBVIEW_MESSAGE_SOURCE, data: value }, parentTargetOrigin(scope))
			return true
		} catch {
			return false
		}
	}

	return false
}
