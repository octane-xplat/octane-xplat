/** Embedded document surface; deliberately has no app-shell service bridge. */
// The minimal AppKit host links AppKit, so load WebKit before resolving classes.
const webKit = dlopen('/System/Library/Frameworks/WebKit.framework/WebKit', 2)
if (!webKit) {
	throw new Error('Unable to load the system WebKit framework')
}

const states = new WeakMap()

const EmbeddedNavigationDelegate = NSObject.extend(
	{
		'webView:didStartProvisionalNavigation:'(view, navigation) {
			const state = states.get(view)
			if (!state) {
				return
			}

			state.navigation = navigation
			state.generation++
			state.loaded = false
		},

		'webView:didFinishNavigation:'(view, navigation) {
			const state = states.get(view)
			if (!state || state.navigation !== navigation) {
				return
			}

			state.loaded = true
			state.measure()
			state.emit('onLoad', { url: state.inline ? undefined : view.URL?.absoluteString })
		},

		'webView:didFailProvisionalNavigation:withError:'(view, navigation, error) {
			this['webView:didFailNavigation:withError:'](view, navigation, error)
		},

		'webView:didFailNavigation:withError:'(view, navigation, error) {
			const state = states.get(view)
			if (!state || state.navigation !== navigation) {
				return
			}

			state.loaded = false
			state.emit('onError', {
				url: state.inline
					? undefined
					: (error.userInfo?.objectForKey?.(NSURLErrorFailingURLErrorKey)?.absoluteString ??
						state.props.src ??
						view.URL?.absoluteString),
				error: String(error.localizedDescription ?? error),
			})
		},

		'webViewWebContentProcessDidTerminate:'(view) {
			const state = states.get(view)
			if (!state) {
				return
			}

			state.loaded = false
			state.generation++
			state.emit('onError', {
				url: state.inline ? undefined : view.URL?.absoluteString,
				error: 'Web content process terminated',
			})
		},
	},
	{
		name: 'XplatEmbeddedNavigationDelegate',
		protocols: [WKNavigationDelegate],
		exposedMethods: {
			'webView:didStartProvisionalNavigation:': {
				params: [WKWebView, NSObject],
				returns: interop.types.void,
			},
			'webView:didFinishNavigation:': {
				params: [WKWebView, NSObject],
				returns: interop.types.void,
			},
			'webView:didFailProvisionalNavigation:withError:': {
				params: [WKWebView, NSObject, NSError],
				returns: interop.types.void,
			},
			'webView:didFailNavigation:withError:': {
				params: [WKWebView, NSObject, NSError],
				returns: interop.types.void,
			},
			'webViewWebContentProcessDidTerminate:': { params: [WKWebView], returns: interop.types.void },
		},
	},
)

const scrollScript = (enabled) => `(() => {
	const id = '__octane_xplat_scroll';
	document.getElementById(id)?.remove();
	if (${enabled === false}) {
		const style = document.createElement('style');
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

export function makeWebView() {
	const view = WKWebView.alloc().initWithFrameConfiguration(
		{ origin: { x: 0, y: 0 }, size: { width: 320, height: 150 } },
		WKWebViewConfiguration.new(),
	)

	view.translatesAutoresizingMaskIntoConstraints = false
	return view
}

export function updateWebView(node, changed, resize) {
	const view = node.view
	let state = states.get(view)
	if (!state) {
		state = {
			props: node.props,
			generation: 0,
			loaded: false,
			navigation: null,
			delegate: EmbeddedNavigationDelegate.alloc().init(),
			emit(name, payload) {
				const handler = state.props[name]
				if (handler) {
					try {
						node.container.root.eventScope('discrete', () => handler(payload))
					} catch (error) {
						console.error('[macos-event] WebView handler failed', error)
					}
				}
			},
			measure() {
				const generation = state.generation
				view.evaluateJavaScriptCompletionHandler(scrollScript(state.props.scrollEnabled), null)
				if (!state.props.matchContents && !state.props.onLayoutContent) {
					return
				}

				view.evaluateJavaScriptCompletionHandler(measureScript, (result, error) => {
					if (states.get(view) !== state || generation !== state.generation || error || !result) {
						return
					}

					let size
					try {
						size = JSON.parse(String(result))
					} catch {
						return
					}

					if (
						!size ||
						!Number.isFinite(size.width) ||
						!Number.isFinite(size.height) ||
						size.width <= 0 ||
						size.height <= 0
					) {
						return
					}

					if (state.props.matchContents) {
						resize(size.height)
					}

					state.emit('onLayoutContent', size)
				})
			},
		}

		states.set(view, state) // WKWebView holds its delegate weakly.
		view.navigationDelegate = state.delegate
	}

	state.props = node.props
	const inline = state.props.html !== undefined
	const source = inline ? state.props.html : state.props.src
	if (state.inline !== inline || state.source !== source) {
		state.inline = inline
		state.source = source
		state.loaded = false
		state.generation++
		state.navigation = null
		view.stopLoading()
		if (inline || !source) {
			state.navigation = view.loadHTMLStringBaseURL(String(source ?? ''), null)
		} else {
			const src = String(source)
			const path = src.startsWith('~/')
				? NSBundle.mainBundle.resourcePath + '/' + src.slice(2)
				: src

			const url = path.startsWith('/') ? NSURL.fileURLWithPath(path) : NSURL.URLWithString(path)
			if (!url) {
				state.emit('onError', { url: src, error: 'Invalid document URL' })
			} else if (url.isFileURL) {
				state.navigation = view.loadFileURLAllowingReadAccessToURL(
					url,
					url.URLByDeletingLastPathComponent,
				)
			} else {
				state.navigation = view.loadRequest(NSURLRequest.requestWithURL(url))
			}
		}
	} else if (
		state.loaded &&
		['scrollEnabled', 'matchContents', 'onLayoutContent'].some((name) => name in changed)
	) {
		state.measure()
	}
}

export function disposeWebView(view) {
	states.delete(view)
	view.navigationDelegate = null
	view.stopLoading()
}
