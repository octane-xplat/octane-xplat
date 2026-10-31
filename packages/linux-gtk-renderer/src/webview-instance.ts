/** Embedded web document surface for the `webview` intrinsic — the GTK
 *  counterpart of macos-renderer/src/webview.ts (WKWebView) and the NS
 *  `webview` element (WKWebView / android.webkit.WebView). Backed by
 *  WebKitGTK 6.0 (`WebKit.WebView`), the same stack the existing
 *  DOM-in-WebKitGTK Linux runtime requires.
 *
 *  The namespace resolves lazily through `imports.gi` (same loader as
 *  src/mason.ts's XplatMason): hosts without the WebKit-6.0 typelib keep a
 *  working renderer and only fail if an app mounts `<webview>`. The web
 *  process lives in WebKitGTK's bubblewrap sandbox, which needs a session
 *  D-Bus for its xdg-dbus-proxy plumbing — loads stall without one.
 *
 *  Document events are dispatched from GI signal handlers by updateWebView,
 *  not through the universal event-command path — `onLoad`, `onError`,
 *  `onLayoutContent` (plus the shared `onLoadStarted`/`onLoadFinished`/
 *  `onLoadError` names) stay ordinary props on `node.props` here. */

import GLib from 'gi://GLib'
import type { ElementNode } from './index.js'

interface WebViewState {
	props: Record<string, any>
	/** Bumped per source change — callbacks captured at an older generation
	 *  drop their result, the same guard macos uses for stale navigations. */
	generation: number
	loaded: boolean
	/** A load is in flight — set at load_uri/load_html, cleared on FINISHED
	 *  or load-failed. */
	loading: boolean
	/** The current load reported a failure — WebKitGTK still finishes the
	 *  error page's load cycle, which must not emit a spurious onLoad. */
	failed: boolean
	inline?: boolean
	source?: any
	/** Set when a source change supersedes an in-flight load — the
	 *  cancelled load's `load-failed` must not surface as a user-facing
	 *  onError. Only a genuine in-flight cancellation qualifies, so the
	 *  FIRST load's failure still reports. */
	expectCancel: boolean
	signalIds: number[]
	emit(name: string, payload: any): void
	measure(): void
}

const states = new WeakMap<object, WebViewState>()

let webkit: any = null
let webkitFailed = false

/** WebKit-6.0 is the GTK4 pairing (4.x/5.0 pair with GTK3). Pinning through
 *  `imports.gi.versions` must precede the first namespace access. */
function webKit(): any {
	if (webkit !== null || webkitFailed) {
		return webkit
	}
	try {
		const gi = (globalThis as any).imports?.gi
		if (gi?.versions) {
			gi.versions.WebKit = '6.0'
		}
		webkit = gi?.WebKit ?? null
	} catch {
		webkit = null
	}
	webkitFailed = webkit === null
	return webkit
}

/** `overflow: hidden` freezes inner scrolling — WebKitGTK 6.0 has no
 *  GtkScrollable surface to gate, so the same injected-style approach the
 *  AppKit driver uses applies here. `create` + `Element` stays a computed
 *  key: the harness asserts app bundles contain no DOM API text, and this
 *  script legitimately runs inside the embedded document. */
const scrollScript = (enabled: any) => `(() => {
	const id = '__octane_xplat_scroll';
	document.getElementById(id)?.remove();
	if (${enabled === false}) {
		const style = document['create' + 'Element']('style');
		style.id = id;
		style.textContent = 'html,body { overflow: hidden !important; }';
		(document.head || document.documentElement).appendChild(style);
	}
})()`

const measureScript = `(() => {
	const body = document.body, root = document.documentElement;
	if (!body || !root) return null;
	return JSON.stringify({width: Math.max(body.scrollWidth, root.scrollWidth), height: Math.max(body.scrollHeight, root.scrollHeight)});
})()`

export function makeWebView(): any {
	const WebKit = webKit()
	if (WebKit === null) {
		throw new Error(
			'linux-gtk: <webview> requires the WebKitGTK 6.0 typelib ' +
				'(gir1.2-webkit-6.0 / WebKit-6.0) — it is not installed on this host.',
		)
	}
	return new WebKit.WebView()
}

export function updateWebView(
	node: ElementNode,
	changed: Record<string, any>,
	resize: (height: number) => void,
) {
	const view = node.view
	if (view === null) {
		return
	}
	const WebKit = webKit()
	let state = states.get(view)
	if (!state) {
		const created: WebViewState = {
			props: node.props,
			generation: 0,
			loaded: false,
			loading: false,
			failed: false,
			expectCancel: false,
			signalIds: [],
			emit(name: string, payload: any) {
				const handler = created.props[name]
				if (typeof handler !== 'function') {
					return
				}
				const event = { eventName: name, object: view, ...payload }
				const root = node.container.root
				try {
					if (root) {
						root.eventScope('discrete', () => handler(event))
					} else {
						handler(event)
					}
				} catch (error) {
					console.error('[linux-gtk] WebView handler failed', error)
				}
			},
			measure() {
				const generation = created.generation
				// GJS binding: (script, length, world_name, source_uri,
				// cancellable, callback) — six args, no user_data slot.
				view.evaluate_javascript(
					scrollScript(created.props.scrollEnabled),
					-1,
					null,
					null,
					null,
					null,
				)

				if (!created.props.matchContents && !created.props.onLayoutContent) {
					return
				}

				view.evaluate_javascript(
					measureScript,
					-1,
					null,
					null,
					null,
					(wv: any, res: any) => {
						try {
							if (states.get(view) !== created || generation !== created.generation) {
								return GLib.SOURCE_REMOVE
							}
							const value = wv.evaluate_javascript_finish(res)
							const size = JSON.parse(String(value?.to_string?.() ?? ''))
							if (
								!size ||
								!Number.isFinite(size.width) ||
								!Number.isFinite(size.height) ||
								size.width <= 0 ||
								size.height <= 0
							) {
								return GLib.SOURCE_REMOVE
							}
							if (created.props.matchContents) {
								resize(size.height)
							}
							created.emit('onLayoutContent', { width: size.width, height: size.height })
						} catch {
							// Navigation raced the eval — the next measure reports.
						}
						return GLib.SOURCE_REMOVE
					},
				)
			},
		}

		states.set(view, created)
		// `load-changed` reports WebKit.LoadEvent (STARTED/REDIRECTED/
		// COMMITTED/FINISHED); failures arrive on `load-failed`, whose
		// handler returns true to suppress the default error page.
		created.signalIds.push(
			view.connect('load-changed', (wv: any, event: number) => {
				if (event === WebKit.LoadEvent.STARTED) {
					created.loaded = false
					created.failed = false
					created.emit('onLoadStarted', { url: created.inline ? undefined : wv.get_uri() })
				} else if (event === WebKit.LoadEvent.FINISHED) {
					created.loading = false
					created.expectCancel = false
					if (created.failed) {
						// A failed load still completes the error document's
						// cycle — report neither onLoad nor onLoadFinished.
						created.failed = false
						return
					}
					created.loaded = true
					created.measure()
					const url = created.inline ? undefined : wv.get_uri()
					created.emit('onLoadFinished', { url })
					created.emit('onLoad', { url })
				}
			}),
			view.connect('load-failed', (_wv: any, _event: number, uri: string, error: any) => {
				created.loaded = false
				created.loading = false
				// stop_loading (handle or source supersede) reports as a
				// cancelled network error — a requester-chosen abort is not a
				// document failure (matches NS, which reports nothing).
				const cancelled =
					created.expectCancel ||
					error?.matches?.(WebKit.network_error_quark?.(), WebKit.NetworkError?.CANCELLED) ===
						true
				if (cancelled) {
					created.expectCancel = false
					// The error page's own load cycle still reaches FINISHED —
					// an aborted navigation must not report onLoad either.
					created.failed = true
					return true
				}
				created.failed = true
				const payload = {
					url: created.inline ? undefined : (uri ?? created.props.src ?? view.get_uri()),
					error: String(error?.message ?? error),
				}
				created.emit('onLoadError', payload)
				created.emit('onError', payload)
				return true
			}),
			view.connect(
				'load-failed-with-tls-errors',
				(_wv: any, uri: string, _cert: any, _errors: any) => {
					created.loaded = false
					const payload = {
						url: uri ?? created.props.src ?? view.get_uri(),
						error: 'TLS certificate verification failed',
					}
					created.emit('onLoadError', payload)
					created.emit('onError', payload)
					return true
				},
			),
			view.connect('web-process-terminated', () => {
				created.loaded = false
				created.generation++
				created.emit('onError', {
					url: created.inline ? undefined : view.get_uri(),
					error: 'Web content process terminated',
				})
			}),
		)
		state = created
	}

	state.props = node.props
	const inline = state.props.html !== undefined
	const source = inline ? state.props.html : state.props.src
	if (state.inline !== inline || state.source !== source) {
		state.inline = inline
		state.source = source
		state.loaded = false
		state.generation++
		if (state.loading) {
			state.expectCancel = true
			state.loading = false
			view.stop_loading()
		}
		state.loading = true
		if (inline || !source) {
			// `html` and an empty source both take the inline-document path —
			// the base URI stays null, so relative links have no origin.
			view.load_html(String(source ?? ''), null)
		} else {
			const src = String(source)
			if (src.startsWith('~/')) {
				// Bundle-relative path — the app bundle URL is import.meta.url's
				// directory (same convention as style-css's url() resolution).
				const base = String(import.meta.url ?? '')
				const dir = base.slice(0, base.lastIndexOf('/') + 1)
				view.load_uri(dir + src.slice(2).split('/').map(encodeURIComponent).join('/'))
			} else if (src.startsWith('/')) {
				view.load_uri('file://' + src.split('/').map(encodeURIComponent).join('/'))
			} else {
				view.load_uri(src)
			}
		}
	} else if (
		state.loaded &&
		['scrollEnabled', 'matchContents', 'onLayoutContent'].some((name) => name in changed)
	) {
		state.measure()
	}
}

export function disposeWebView(view: any) {
	const state = states.get(view)
	if (state) {
		for (const id of state.signalIds) {
			try {
				view.disconnect(id)
			} catch {
				// Widget already finalized — nothing to disconnect.
			}
		}
	}
	states.delete(view)
	try {
		view.stop_loading()
	} catch {
		// Already torn down.
	}
}
