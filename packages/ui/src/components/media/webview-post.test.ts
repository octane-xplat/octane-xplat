import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	WEBVIEW_DRAIN_SCRIPT,
	WEBVIEW_MESSAGE_SOURCE,
	WEBVIEW_OUTBOX_KEY,
	isWebViewMessage,
	parseMessageBatch,
	postToHost,
} from './webview-post'

const scope = globalThis as any

afterEach(() => {
	delete scope[WEBVIEW_OUTBOX_KEY]
	delete scope.webkit
	delete scope.__xplatWebView
	delete scope.parent
	vi.restoreAllMocks()
})

describe('postToHost', () => {
	it('returns false and queues the value when no transport exists', () => {
		expect(postToHost({ type: 'ready' })).toBe(false)
		expect(scope[WEBVIEW_OUTBOX_KEY]).toEqual([{ type: 'ready' }])
	})

	it('rejects non-serializable payloads without queueing', () => {
		const circular: any = {}
		circular.self = circular
		expect(postToHost(circular)).toBe(false)
		expect(postToHost(undefined)).toBe(false)
		expect(scope[WEBVIEW_OUTBOX_KEY]).toBeUndefined()
	})

	it('posts serialized JSON through a registered WK script handler', () => {
		const postMessage = vi.fn()
		scope.webkit = { messageHandlers: { xplatWebView: { postMessage } } }

		expect(postToHost({ type: 'ready', n: 1 })).toBe(true)
		expect(postMessage).toHaveBeenCalledWith('{"type":"ready","n":1}')
	})

	it('posts serialized JSON through the Android interface global', () => {
		const postMessage = vi.fn()
		scope.__xplatWebView = { postMessage }

		expect(postToHost('ping')).toBe(true)
		expect(postMessage).toHaveBeenCalledWith('"ping"')
	})

	it('posts the envelope to window.parent inside a frame', () => {
		const postMessage = vi.fn()
		Object.defineProperty(scope, 'parent', { value: { postMessage }, configurable: true })

		expect(postToHost({ type: 'ready' })).toBe(true)
		expect(postMessage).toHaveBeenCalledWith(
			{ source: WEBVIEW_MESSAGE_SOURCE, data: { type: 'ready' } },
			expect.any(String),
		)
	})

	it('skips the parent transport in a top-level document', () => {
		const postMessage = vi.fn()
		// jsdom's top-level window has parent === window.
		Object.defineProperty(scope, 'parent', { value: scope, configurable: true })
		scope.parent.postMessage = postMessage

		expect(postToHost({ type: 'ready' })).toBe(false)
		expect(postMessage).not.toHaveBeenCalled()
	})

	it('caps the outbox at 100 entries, dropping oldest first', () => {
		for (let i = 0; i < 105; i++) {
			postToHost(i)
		}

		const outbox = scope[WEBVIEW_OUTBOX_KEY]
		expect(outbox).toHaveLength(100)
		expect(outbox[0]).toBe(5)
		expect(outbox[99]).toBe(104)
	})
})

describe('isWebViewMessage', () => {
	it('accepts the transport envelope', () => {
		expect(isWebViewMessage({ source: WEBVIEW_MESSAGE_SOURCE, data: { a: 1 } })).toBe(true)
	})

	it('rejects foreign message shapes', () => {
		expect(isWebViewMessage({ source: 'other', data: 1 })).toBe(false)
		expect(isWebViewMessage('xplat-webview')).toBe(false)
		expect(isWebViewMessage(null)).toBe(false)
		expect(isWebViewMessage(undefined)).toBe(false)
	})
})

describe('WEBVIEW_DRAIN_SCRIPT', () => {
	const drain = () => (0, eval)(WEBVIEW_DRAIN_SCRIPT)

	it('returns the queued values as a JSON array and empties the outbox', () => {
		scope[WEBVIEW_OUTBOX_KEY] = [{ type: 'ready' }, 'x', 2]

		expect(JSON.parse(drain())).toEqual([{ type: 'ready' }, 'x', 2])
		expect(scope[WEBVIEW_OUTBOX_KEY]).toEqual([])
	})

	it('returns null on an empty or missing outbox', () => {
		expect(drain()).toBeNull()
		scope[WEBVIEW_OUTBOX_KEY] = []
		expect(drain()).toBeNull()
	})
})

describe('parseMessageBatch', () => {
	it('parses a drained JSON array', () => {
		expect(parseMessageBatch('[{"type":"ready"},2]')).toEqual([{ type: 'ready' }, 2])
	})

	it('unwraps Android\'s JSON-encoded transport result first', () => {
		expect(parseMessageBatch('"[{\\"type\\":\\"ready\\"}]"', true)).toEqual([{ type: 'ready' }])
	})

	it('returns null for empty drains and malformed batches', () => {
		expect(parseMessageBatch(null)).toBeNull()
		expect(parseMessageBatch('null', true)).toBeNull()
		expect(parseMessageBatch('{"not":"array"}')).toBeNull()
		expect(parseMessageBatch('not json')).toBeNull()
	})
})
