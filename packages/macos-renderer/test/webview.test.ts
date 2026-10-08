import assert from 'node:assert/strict'
import { test } from 'node:test'

class NativeObject {
	static extend(methods) {
		class Extended extends this {}
		Object.assign(Extended.prototype, methods)
		return Extended
	}
	init() {
		return this
	}
	static new() {
		return new this()
	}
	static alloc() {
		return new this()
	}
}

globalThis.dlopen = () => ({})
globalThis.NSObject = NativeObject
globalThis.NativeClass = () => {}
globalThis.WKNavigationDelegate = {}
globalThis.interop = { types: { void: {} } }
globalThis.NSError = NativeObject
globalThis.WKWebViewConfiguration = NativeObject
globalThis.WKWebView = class extends NativeObject {
	calls = []
	pending = []
	initWithFrameConfiguration() {
		return this
	}
	stopLoading() {
		this.calls.push('stop')
	}
	loadHTMLStringBaseURL(html) {
		this.calls.push(['html', html])
		return {}
	}
	loadRequest(request) {
		this.calls.push(['request', request])
		return {}
	}
	loadFileURLAllowingReadAccessToURL(url, access) {
		this.calls.push(['file', url, access])
		return {}
	}
	evaluateJavaScriptCompletionHandler(script, callback) {
		if (callback) {
			this.pending.push(callback)
		} else {
			this.calls.push(['script', script])
		}
	}
}

globalThis.NSBundle = { mainBundle: { resourcePath: '/bundle' } }
globalThis.NSURL = {
	fileURLWithPath: (path) => ({ isFileURL: true, path, URLByDeletingLastPathComponent: '/parent' }),
	URLWithString: (url) => ({ absoluteString: url }),
}

globalThis.NSURLRequest = { requestWithURL: (url) => url }
const { makeWebView, updateWebView, disposeWebView } = await import('../src/webview.ts')

function fixture(props) {
	const events = [],
		heights = []

	const node = {
		view: makeWebView(),
		props,
		container: { root: { eventScope: (_kind, fn) => fn() } },
	}

	const update = (changed = {}) => {
		node.props = { ...node.props, ...changed }
		updateWebView(node, changed, (height) => heights.push(height))
	}

	update()
	return { node, update, events, heights }
}

test('HTML wins including empty HTML; callback changes do not reload; source transitions and bundle paths load', () => {
	const { node, update } = fixture({ src: 'https://example.com', html: '' })
	assert.deepEqual(node.view.calls.at(-1), ['html', ''])
	update({ onLoad() {} })
	assert.equal(node.view.calls.length, 2)
	update({ src: 'https://other.example' })
	assert.equal(node.view.calls.length, 2)
	update({ html: undefined })
	assert.equal(node.view.calls.at(-1)[0], 'request')
	update({ src: '~/page.html' })
	assert.equal(node.view.calls.at(-1)[1].path, '/bundle/page.html')
	assert.equal(node.view.calls.at(-1)[2], '/parent')
})

test('delegate reports successful load, measured size and height; ignores stale navigation and measurement after replacement/disposal', () => {
	const loads = [],
		sizes = []

	const { node, update, heights } = fixture({
		html: '<p>hello</p>',
		matchContents: true,
		onLoad: (e) => loads.push(e),
		onLayoutContent: (e) => sizes.push(e),
	})

	const view = node.view,
		delegate = view.navigationDelegate,
		navigation = {}

	delegate['webView:didStartProvisionalNavigation:'](view, navigation)
	delegate['webView:didFinishNavigation:'](view, {})
	assert.equal(loads.length, 0)
	delegate['webView:didFinishNavigation:'](view, navigation)
	assert.deepEqual(loads, [{ url: undefined }])
	view.pending.shift()('{"width":320,"height":800}', null)
	assert.deepEqual(heights, [800])
	assert.deepEqual(sizes, [{ width: 320, height: 800 }])
	update({ scrollEnabled: false })
	assert.match(view.calls.at(-1)[1], /if \(true\)/)
	const stale = view.pending.shift()
	update({ html: '<p>replacement</p>' })
	stale('{"width":320,"height":900}', null)
	assert.deepEqual(heights, [800])
	delegate['webView:didStartProvisionalNavigation:'](view, navigation)
	delegate['webView:didFinishNavigation:'](view, navigation)
	const disposed = view.pending.shift()
	disposeWebView(view)
	assert.equal(view.navigationDelegate, null)
	disposed('{"width":320,"height":1000}', null)
	delegate['webView:didFinishNavigation:'](view, navigation)
	assert.deepEqual(heights, [800])
})

test('both failure delegate paths report errors, never success, and process termination reports failure', () => {
	const errors = [],
		loads = []

	const { node } = fixture({
		src: 'https://example.com',
		onLoad: (e) => loads.push(e),
		onError: (e) => errors.push(e),
	})

	const view = node.view,
		delegate = view.navigationDelegate,
		navigation = {}

	delegate['webView:didStartProvisionalNavigation:'](view, navigation)
	delegate['webView:didFailProvisionalNavigation:withError:'](view, navigation, {
		localizedDescription: 'offline',
	})

	delegate['webView:didFailNavigation:withError:'](view, navigation, {
		localizedDescription: 'failed',
	})

	delegate['webViewWebContentProcessDidTerminate:'](view)
	assert.equal(loads.length, 0)
	assert.deepEqual(
		errors.map((e) => e.error),
		['offline', 'failed', 'Web content process terminated'],
	)
})

test('unreadable measurements remain best-effort and do not change height', () => {
	const { node, heights } = fixture({ html: '<p>page</p>', matchContents: true })
	const view = node.view,
		delegate = view.navigationDelegate,
		navigation = {}

	delegate['webView:didStartProvisionalNavigation:'](view, navigation)
	for (const result of [
		'not json',
		'{"width":0,"height":200}',
		'{"width":320,"height":-1}',
		'null',
	]) {
		delegate['webView:didFinishNavigation:'](view, navigation)
		view.pending.shift()(result, null)
	}

	assert.deepEqual(heights, [])
})
