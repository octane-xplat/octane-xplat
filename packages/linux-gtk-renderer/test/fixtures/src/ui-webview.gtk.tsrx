/** @jsxImportSource @octane-xplat/jsx */
import { WebView } from '@octane-xplat/ui'
import type { WebViewHandle, WebViewLoadEvent, WebViewContentSize } from '@octane-xplat/ui'

/** Recorded WebView lifecycle — the fixture main asserts ordering and
 *  payload shape against these. */
export const events: Array<{ id: string; name: string; url?: string; error?: string }> = []
export const sizes: Array<{ id: string; width: number; height: number }> = []
export const navHandle: { current: WebViewHandle | null } = { current: null }
export const stopHandle: { current: WebViewHandle | null } = { current: null }

const INLINE_DOC =
	'<html><head><style>html,body{margin:0;height:640px}</style></head><body><p>inline doc</p></body></html>'
export const DATA_DOC = 'data:text/html,<html><body><p>data doc</p></body></html>'
// A non-routable address hangs the connection attempt, so this load stays
// in-flight until stopLoading cancels it.
export const STOP_URL = 'http://10.255.255.1/'
// URL loads (unlike load_html documents) create session-history entries —
// the navigation checks need a real back stack.
export const NAV_DOC_A = 'data:text/html,<html><body><p>first doc</p></body></html>'
export const NAV_DOC_B = 'data:text/html,<html><body><p>second doc</p></body></html>'

const on = (id: string, name: string) => (e: WebViewLoadEvent) => {
	events.push({ id, name, url: e.url, error: e.error })
}
const onSize = (id: string) => (size: WebViewContentSize) => {
	sizes.push({ id, width: size.width, height: size.height })
}

export function WebViewProbe() @{
	<>
	<WebView
		id="wv-html"
		html={INLINE_DOC}
		scrollEnabled={false}
		matchContents
		onLoad={on('html', 'load')}
		onError={on('html', 'error')}
		onLayoutContent={onSize('html')}
	/>
	<WebView id="wv-src" src={DATA_DOC} onLoad={on('src', 'load')} onError={on('src', 'error')} />
	<WebView
		id="wv-bad"
		src="https://nonexistent.invalid/x"
		onLoad={on('bad', 'load')}
		onError={on('bad', 'error')}
	/>
	<webview
		id="wv-raw"
		src={DATA_DOC}
		onLoadStarted={(e: any) => events.push({ id: 'raw', name: 'started', url: e.url })}
		onLoadFinished={(e: any) => events.push({ id: 'raw', name: 'finished', url: e.url })}
		onLoadError={(e: any) => events.push({ id: 'raw', name: 'loaderror', url: e.url, error: String(e.error ?? '') })}
	/>
	<WebView
		id="wv-nav"
		ref={(h: WebViewHandle | null) => {
			navHandle.current = h
		}}
		src={NAV_DOC_A}
		onLoad={on('nav', 'load')}
	/>
	<WebView
		id="wv-stop"
		ref={(h: WebViewHandle | null) => {
			stopHandle.current = h
		}}
		src={STOP_URL}
		onLoad={on('stop', 'load')}
		onError={on('stop', 'error')}
	/>
	</>
}
