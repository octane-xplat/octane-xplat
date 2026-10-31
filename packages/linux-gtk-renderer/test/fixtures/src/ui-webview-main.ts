import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import {
	WebViewProbe,
	events,
	sizes,
	navHandle,
	stopHandle,
	DATA_DOC,
	NAV_DOC_A,
	NAV_DOC_B,
} from './ui-webview.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}

// The fixture exercises the real WebKitGTK web process — resolve the
// namespace the same way the renderer does for instanceof checks.
const gi = (globalThis as any).imports?.gi
if (gi?.versions) { gi.versions.WebKit = '6.0' }
const WebKit = gi?.WebKit

const window = new Gtk.Window({ default_width: 400, default_height: 800 })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

const findView = (id: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.id === id) { return n.view }
	}
	return null
}

const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

const until = async (ok: () => boolean, ms = 20000): Promise<boolean> => {
	const deadline = Date.now() + ms
	while (Date.now() < deadline) {
		if (ok()) { return true }
		await pump(100)
	}
	return ok()
}

const lastEvent = (id: string, name: string) =>
	[...events].reverse().find((e) => e.id === id && e.name === name)
const countEvents = (id: string, name: string) =>
	events.filter((e) => e.id === id && e.name === name).length

const evalJs = (wv: any, js: string) =>
	new Promise<string | null>((resolve) => {
		try {
			wv.evaluate_javascript(js, -1, null, null, null, (v: any, res: any) => {
				try { resolve(v.evaluate_javascript_finish(res)?.to_string?.() ?? null) } catch { resolve(null) }
				return GLib.SOURCE_REMOVE
			})
		} catch {
			resolve(null)
		}
	})

async function run() {
	root.render(WebViewProbe, {})
	await pump(50)
	window.present()

	// The web process needs the session bus WebKitGTK's sandbox proxies
	// through — the harness's dbus-run-session provides it.
	const loaded = await until(
		() =>
			countEvents('html', 'load') >= 1 &&
			countEvents('src', 'load') >= 1 &&
			countEvents('bad', 'error') >= 1 &&
			countEvents('raw', 'finished') >= 1 &&
			countEvents('nav', 'load') >= 1,
	)
	check('all document loads settle', loaded)

	// Mount — real WebKit.WebView widgets behind the intrinsic.
	const wvHtml = findView('wv-html')
	const wvSrc = findView('wv-src')
	const wvRaw = findView('wv-raw')
	check(
		'WebView mounts a WebKit.WebView',
		!!wvHtml && wvHtml instanceof WebKit.WebView && !!wvSrc && wvSrc instanceof WebKit.WebView,
	)
	check('raw <webview> mounts a WebKit.WebView', !!wvRaw && wvRaw instanceof WebKit.WebView)

	// html documents — onLoad fires with no url (inline docs report none).
	const htmlLoad = lastEvent('html', 'load')
	check('html document fires onLoad', !!htmlLoad)
	check('html document onLoad has no url', htmlLoad?.url === undefined)
	check('html document does not error', countEvents('html', 'error') === 0)

	// src documents — the data: URI round-trips through load_uri.
	const srcLoad = lastEvent('src', 'load')
	check('src document fires onLoad', !!srcLoad)
	check('src document onLoad carries the document url', srcLoad?.url === DATA_DOC)

	// Navigation lifecycle on the shared intrinsic event names.
	const startedIdx = events.findIndex((e) => e.id === 'raw' && e.name === 'started')
	const finishedIdx = events.findIndex((e) => e.id === 'raw' && e.name === 'finished')
	check('onLoadStarted fires before onLoadFinished', startedIdx !== -1 && finishedIdx !== -1 && startedIdx < finishedIdx)
	check('onLoadFinished carries the document url', lastEvent('raw', 'finished')?.url === DATA_DOC)

	// Unresolvable host — load-failed becomes onError with url + message,
	// and the error page's own load cycle must not report onLoad.
	// (Connection-refused loads are a WebKitGTK quirk — they commit an
	// empty document with no load-failed at all, so DNS is the probe.)
	const badError = lastEvent('bad', 'error')
	check('failed load fires onError', !!badError)
	check('onError carries the failing url', badError?.url === 'https://nonexistent.invalid/x')
	check('onError carries a failure message', typeof badError?.error === 'string' && badError.error.length > 0)
	check('failed load does not fire onLoad', countEvents('bad', 'load') === 0)

	// scrollEnabled={false} — the freeze style element lands in the document.
	const frozen = await evalJs(wvHtml, "String(document.getElementById('__octane_xplat_scroll') !== null)")
	check('scrollEnabled=false injects the freeze style', frozen === 'true')

	// matchContents — the measured document height lands on size_request and
	// onLayoutContent reports it.
	await until(() => sizes.length >= 1, 8000)
	const htmlSize = [...sizes].reverse().find((s) => s.id === 'html')
	check('onLayoutContent reports the document size', !!htmlSize && htmlSize.width > 0 && htmlSize.height >= 600)
	const [reqW, reqH] = wvHtml?.get_size_request?.() ?? [-1, -1]
	void reqW
	check('matchContents resizes the host', reqH >= 600)

	// Imperative handle — reload() re-requests the document.
	const navView = findView('wv-nav')
	const navLoads = countEvents('nav', 'load')
	navHandle.current?.reload()
	await until(() => countEvents('nav', 'load') > navLoads, 10000)
	check('handle.reload() reloads the document', countEvents('nav', 'load') > navLoads)

	// handle.native is the WebKit.WebView — drive a second document through
	// it, then frame-local goBack() returns to the first one. History only
	// exists once FINISHED commits the entry — wait for the load event, not
	// the URI flip (it changes at STARTED).
	const native = navHandle.current?.native
	check('handle.native is the WebKit.WebView', native === navView)
	let navLoadCount = countEvents('nav', 'load')
	native?.load_uri(NAV_DOC_B)
	await until(() => countEvents('nav', 'load') > navLoadCount, 10000)
	check('handle.native load_uri navigates', native?.get_uri?.() === NAV_DOC_B)
	check('native can_go_back after a second document', native?.can_go_back?.() === true)
	navLoadCount = countEvents('nav', 'load')
	navHandle.current?.goBack()
	await until(() => countEvents('nav', 'load') > navLoadCount, 10000)
	check('handle.goBack() returns to the first document', native?.get_uri?.() === NAV_DOC_A)

	// goForward returns to the second document.
	navLoadCount = countEvents('nav', 'load')
	navHandle.current?.goForward()
	await until(() => countEvents('nav', 'load') > navLoadCount, 10000)
	check('handle.goForward() revisits the second document', native?.get_uri?.() === NAV_DOC_B)

	// stopLoading cancels an in-flight load — the dedicated stop view's
	// only navigation is the non-routable URL, which cannot finish, so the
	// load is still pending when the handle fires. A caller-chosen abort
	// is not a document failure: neither onError nor onLoad may fire.
	const stopView = findView('wv-stop')
	check('blackhole load is in-flight', stopView?.is_loading === true)
	stopHandle.current?.stopLoading()
	const settled = await until(() => stopView?.is_loading === false, 10000)
	check('handle.stopLoading() cancels the load', settled && stopView?.is_loading === false)
	check('cancelled load does not fire onError', countEvents('stop', 'error') === 0)
	check('cancelled load does not fire onLoad', countEvents('stop', 'load') === 0)

	// Teardown.
	root.unmount()
	await pump(150)
	check('unmount releases all nodes', container.nodes.size === 0)

	print('GTK_WEBVIEW ' + JSON.stringify({ checks: checks.length, failures, osInput: false, gtk: '4.14.5' }))
	loop.quit()
}

run().catch((e) => {
	print('GTK_WEBVIEW_ERROR ' + String(e && (e.stack || e)))
	loop.quit()
})
loop.run()
