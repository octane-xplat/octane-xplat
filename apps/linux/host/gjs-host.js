#!/usr/bin/env gjs
// gjs-host — the real Linux host. Same wire contract as WKHost.swift:
//   webview → host:  webkit.messageHandlers.xplat.postMessage(JSON string)
//   host → webview:  __xplatBridge.resolve/reject/emit via evaluate_javascript
//
// Deps (Debian trixie): gjs libgtk-4-1 libadwaita-1-0 libwebkitgtk-6.0-4
//   gir1.2-webkit-6.0 gir1.2-adw-1 libsecret-1-0 gir1.2-secret-1 dbus xvfb
//   gnome-keyring notification-daemon
// Run: xvfb-run -a dbus-run-session -- gjs gjs-host.js [--self-test] [--bundle DIR] [url]

imports.gi.versions.Gtk = '4.0'
imports.gi.versions.WebKit = '6.0'
imports.gi.versions.Adw = '1'
imports.gi.versions.Secret = '1'
const { Adw, Gtk, WebKit, Gio, GLib, Gdk, Secret } = imports.gi

const selfTest = ARGV.includes('--self-test')

// Bundle resolution: --bundle flag > $XPLAT_BUNDLE_DIR > ./bundle (packaged
// app dir) > ../dist (repo layout — host/ sits next to apps/linux/dist).
const bundleFlag = ARGV.findIndex((a) => a === '--bundle')
const bundleDir = [
	bundleFlag >= 0 ? ARGV[bundleFlag + 1] : null,
	GLib.getenv('XPLAT_BUNDLE_DIR'),
	'bundle',
	'../dist',
]
	.filter(Boolean)
	.map((d) => (GLib.path_is_absolute(d) ? d : GLib.build_filenamev([GLib.get_current_dir(), d])))
	.find((d) => GLib.file_test(GLib.build_filenamev([d, 'index.html']), GLib.FileTest.EXISTS))

// Positional args: URIs only (flags and their values are ours). They're
// handed to GApplication, which delivers them via the 'open' signal (a
// second invocation of a running app forwards through D-Bus — that's the
// real deep-link delivery path). xplat://localhost/* URIs are content loads;
// anything else is a deep link.
const positionals = ARGV.filter(
	(a, i) => !a.startsWith('--') && (bundleFlag < 0 || i !== bundleFlag + 1),
)

const url =
	positionals.find((u) => u.startsWith('xplat://localhost')) ??
	positionals[0] ??
	(bundleDir ? 'xplat://localhost/' : 'http://localhost:5201')

const contentOrigin = url.match(/^[a-z]+:\/\/[^/]+/i)?.[0] ?? url

// --- xplat:// scheme: serve the built bundle so the app never needs http ---
const MIMES = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.wasm': 'application/wasm',
	'.map': 'application/json',
	'.txt': 'text/plain',
}

function serveBundle(webContext) {
	if (!bundleDir) {
		return
	}

	webContext.register_uri_scheme('xplat', (request) => {
		// SPA fallback: unknown paths serve index.html; '..' never escapes.
		let path = request.get_path().replace(/\/+$/, '') || '/index.html'
		let file = GLib.build_filenamev([bundleDir, '.' + GLib.canonicalize_filename(path, '/')])

		if (!GLib.file_test(file, GLib.FileTest.EXISTS) || GLib.file_test(file, GLib.FileTest.IS_DIR)) {
			file = GLib.build_filenamev([bundleDir, 'index.html'])
		}

		try {
			const f = Gio.File.new_for_path(file)
			const info = f.query_info('standard::size', Gio.FileQueryInfoFlags.NONE, null)
			const ext = file.slice(file.lastIndexOf('.')).toLowerCase()
			request.finish(f.read(null), info.get_size(), MIMES[ext] ?? 'application/octet-stream')
		} catch (e) {
			print(`[host] scheme serve failed for ${path}: ${e.message}`)
			request.finish_error(
				new GLib.Error(Gio.IOErrorEnum.quark(), Gio.IOErrorEnum.NOT_FOUND, e.message),
			)
		}
	})

	// Secure + CORS so secure-context APIs (navigator.clipboard, crypto.subtle)
	// and module/font fetches behave on the custom scheme.
	const sm = webContext.get_security_manager()
	sm.register_uri_scheme_as_secure('xplat')
	sm.register_uri_scheme_as_cors_enabled('xplat')
	print(`[host] serving bundle ${bundleDir} at xplat://localhost/`)
}

// HANDLES_OPEN routes URI argv through the 'open' signal — and, more
// importantly, forwards second-invocation URIs to the running primary
// instance over D-Bus. That's the real installed deep-link path.
const app = new Adw.Application({
	application_id: 'org.octane.xplat',
	flags: Gio.ApplicationFlags.HANDLES_OPEN,
})

let win = null
let webView = null // main window's view — global events default here
let loadedOnce = false
const linkQueue = []
let colorScheme = 'light'
let secretSchema = null
// wid → { win, wv, opener } — secondary windows opened via windows.open.
const windows = new Map()

try {
	secretSchema = new Secret.Schema('org.octane.xplat', Secret.SchemaFlags.NONE, {
		key: Secret.SchemaAttributeType.STRING,
	})
} catch (e) {
	print(`[host] Secret.Schema unavailable: ${e.message}`)
}

// --- appearance: org.freedesktop.appearance via portal.Settings ---
// Read(ss)→(v) where v wraps uint32 (0 none, 1 dark, 2 light). No portal
// backend → the call fails → libadwaita's own system tracking is the
// fallback, else light.
function detectColorScheme() {
	try {
		const reply = Gio.bus_get_sync(Gio.BusType.SESSION, null).call_sync(
			'org.freedesktop.portal.Desktop',
			'/org/freedesktop/portal/desktop',
			'org.freedesktop.portal.Settings',
			'Read',
			new GLib.Variant('(ss)', ['org.freedesktop.appearance', 'color-scheme']),
			new GLib.VariantType('(v)'),
			Gio.DBusCallFlags.NONE,
			2000,
			null,
		)

		return reply.get_child_value(0).get_variant().get_uint32() === 1 ? 'dark' : 'light'
	} catch {
		return Adw.StyleManager.get_default().get_dark() ? 'dark' : 'light'
	}
}

function emitTo(wv, service, event, payload) {
	const name =
		(service === 'deepLinks' || service === 'deep-links') && event === 'open'
			? 'app.deep-link'
			: `${service}.${event}`

	const packet = JSON.stringify({ type: 'event', name, payload: payload ?? null })
	wv.evaluate_javascript(
		`window.__xplatHostTransport?.receive(${JSON.stringify(packet)});` +
			`__xplatBridge?.emit('${service}', '${event}', ${JSON.stringify(payload ?? null)})`,
		-1,
		null,
		null,
		null,
		null,
	)
}

// Global events (appearance) go to every window's webview; app-targeted
// events (deep links) go to the main view.
function emitAll(service, event, payload) {
	if (webView) {
		emitTo(webView, service, event, payload)
	}

	for (const entry of windows.values()) {
		emitTo(entry.wv, service, event, payload)
	}
}

function subscribeAppearance() {
	try {
		Gio.bus_get_sync(Gio.BusType.SESSION, null).signal_subscribe(
			'org.freedesktop.portal.Desktop',
			'org.freedesktop.portal.Settings',
			'SettingChanged',
			'/org/freedesktop/portal/desktop',
			'org.freedesktop.appearance',
			Gio.DBusSignalFlags.MATCH_ARG0_NAMESPACE,
			(_c, _s, _p, _i, _m, params) => {
				const [_ns, key, val] = params.deepUnpack()

				if (key === 'color-scheme') {
					colorScheme = val.get_uint32() === 1 ? 'dark' : 'light'
					emitAll('appearance', 'change', colorScheme)
				}
			},
		)
	} catch (e) {
		print(`[host] appearance subscribe unavailable: ${e.message}`)
	}
}

// Same dispatch table as WKHost.swift — native access here is Gio/D-Bus-shaped.
// wv is the sender's webview: replies must land on the window that asked.
const hostCapabilities = {
	notifications: ['ensure', 'notify'],
	clipboard: ['read', 'write'],
	secureStorage: ['get', 'set', 'remove'],
	appearance: ['get'],
	files: ['readText', 'pick', 'writeText'],
	windows: ['open', 'close', 'setTitle'],
	system: ['openUrl'],
	deepLinks: ['initialUrl'],
}

function receiveProtocol(wv, packet) {
	const message = JSON.stringify(packet)
	wv.evaluate_javascript(
		`window.__xplatHostTransport?.receive(${JSON.stringify(message)})`,
		-1,
		null,
		null,
		null,
		null,
	)
}

function dispatch(wv, id, service, method, args, protocol = false) {
	const evalJS = (js) => wv.evaluate_javascript(js, -1, null, null, null, null)
	const reply = (value) =>
		protocol
			? receiveProtocol(wv, { type: 'reply', id, ok: true, value: value ?? null })
			: evalJS(`__xplatBridge?.resolve(${id}, ${JSON.stringify(value ?? null)})`)

	const fail = (message) =>
		protocol
			? receiveProtocol(wv, { type: 'reply', id, ok: false, error: String(message) })
			: evalJS(`__xplatBridge?.reject(${id}, ${JSON.stringify(message)})`)

	try {
		if (service === 'notifications') {
			// org.freedesktop.Notifications directly — GApplication.send_notification
			// needs an org.gtk.Notifications server (GNOME Shell); the freedesktop
			// Notify call is the cross-DE path (notification-daemon, dunst, …).
			const bus = Gio.bus_get_sync(Gio.BusType.SESSION, null)

			if (method === 'ensure') {
				try {
					bus.call_sync(
						'org.freedesktop.Notifications',
						'/org/freedesktop/Notifications',
						'org.freedesktop.Notifications',
						'GetCapabilities',
						null,
						new GLib.VariantType('(as)'),
						Gio.DBusCallFlags.NONE,
						2000,
						null,
					)

					reply('granted')
				} catch {
					reply('unsupported')
				}
			} else if (method === 'notify') {
				bus.call_sync(
					'org.freedesktop.Notifications',
					'/org/freedesktop/Notifications',
					'org.freedesktop.Notifications',
					'Notify',
					new GLib.Variant('(susssasa{sv}i)', [
						'xplat',
						0,
						'',
						String(args[0] ?? ''),
						String(args[1] ?? ''),
						[],
						{},
						-1,
					]),
					new GLib.VariantType('(u)'),
					Gio.DBusCallFlags.NONE,
					-1,
					null,
				)

				reply(true)
			}

			return
		}

		if (service === 'clipboard') {
			const cb = wv.get_display().get_clipboard()

			if (method === 'write') {
				// GTK4 has no Gdk.Clipboard.set_text — writes go through a
				// ContentProvider.
				cb.set_content(Gdk.ContentProvider.new_for_value(String(args[0] ?? '')))

				reply(true)
			} else if (method === 'read') {
				cb.read_text_async(null, (_c, res) => {
					try {
						reply(cb.read_text_finish(res))
					} catch {
						reply(null)
					}
				})
			}

			return
		}

		if (service === 'secureStorage') {
			if (!secretSchema) {
				fail('Secret.Schema unavailable')
				return
			}

			const attrs = { key: String(args[0] ?? '') }
			// COLLECTION_SESSION lives in the daemon's memory — no disk keyring,
			// no unlock prompt (the default collection prompts to create one
			// under a headless session, which hangs the sync call). A shipped
			// host wants COLLECTION_DEFAULT.
			const collection = Secret.COLLECTION_SESSION

			if (method === 'get') {
				reply(Secret.password_lookup_sync(secretSchema, attrs, null))
			} else if (method === 'set') {
				reply(
					Secret.password_store_sync(
						secretSchema,
						attrs,
						collection,
						'xplat secret',
						String(args[1] ?? ''),
						null,
					),
				)
			} else if (method === 'remove') {
				reply(Secret.password_clear_sync(secretSchema, attrs, null))
			}

			return
		}

		if (service === 'appearance' && method === 'get') {
			reply(colorScheme)
			return
		}

		if (service === 'files') {
			if (method === 'readText') {
				const [ok, bytes] = Gio.File.new_for_uri(String(args[0])).load_contents(null)
				reply(ok ? imports.byteArray.toString(bytes) : null)
				return
			}

			// pick/writeText open a Gtk.FileDialog — unsandboxed host, so the
			// native dialog beats portal.FileChooser here. Portal is the
			// sandboxed upgrade path. The dialog parents on the sender's window.
			const parent = winFor(wv) ?? win
			const dialog = new Gtk.FileDialog()
			const finish = (d, res) => {
				try {
					const f = method === 'pick' ? d.open_finish(res) : d.save_finish(res)

					if (!f) {
						reply(null)
						return
					}

					if (method === 'writeText') {
						f.replace_contents(
							new TextEncoder().encode(String(args[1] ?? '')),
							null,
							false,
							Gio.FileCreateFlags.NONE,
							null,
						)
					}

					reply({ name: f.get_basename(), uri: f.get_uri() })
				} catch {
					reply(null)
				}
			}

			if (method === 'pick') {
				if (args[1]) {
					dialog.set_initial_folder(Gio.File.new_for_path(String(args[1])))
				}

				dialog.open(parent, null, finish)
			} else if (method === 'writeText') {
				dialog.set_initial_name(String(args[0] ?? 'untitled.txt'))
				dialog.save(parent, null, finish)
			}

			return
		}

		if (service === 'windows') {
			if (method === 'open') {
				const opts = args[0] ?? {}
				const wid = String(opts.id ?? `w${windows.size + 1}`)
				openSecondaryWindow(wv, wid, opts)
				reply(wid)
			} else if (method === 'close') {
				const entry = windows.get(String(args[0]))
				entry?.win.close()
				reply(!!entry)
			} else if (method === 'setTitle') {
				windows.get(String(args[0]))?.win.set_title(String(args[1] ?? ''))
				reply(true)
			}

			return
		}

		if (service === 'system' && method === 'openUrl') {
			reply(Gio.AppInfo.launch_default_for_uri(String(args[0]), null))
			return
		}

		if (service === 'deepLinks' && method === 'initialUrl') {
			reply(null)
			return
		}

		fail(`host has no ${service}.${method}`)
	} catch (e) {
		fail(e.message ?? String(e))
	}
}

function readSelftest() {
	for (const dir of ['.', bundleDir ?? '']) {
		try {
			const [ok, bytes] = GLib.file_get_contents(
				GLib.build_filenamev([dir, 'bridge-selftest.linux.js']),
			)

			if (ok) {
				return imports.byteArray.toString(bytes)
			}
		} catch {}
	}

	return null
}

// Every webview gets its own UCM — per-window message wiring and its own
// document-start injection (initial url / color scheme / window data).
function wireWebView(wv, extraInjected) {
	const ucm = wv.get_user_content_manager()
	ucm.register_script_message_handler('xplat', null)
	ucm.register_script_message_handler('xplatLog', null)
	// Detailed signals separate the two handlers — WebKitGTK 6.0 delivers a
	// bare JSCValue (WebKitJavascriptResult is gone); the client posts a JSON
	// string, so to_string() → JSON.parse.
	ucm.connect('script-message-received::xplat', (_ucm, value) => {
		const req = JSON.parse(value.to_string())
		if (req.type === 'capabilities') {
			receiveProtocol(wv, {
				type: 'reply',
				id: req.id,
				ok: true,
				value: hostCapabilities,
			})

			return
		}

		dispatch(wv, req.id, req.service, req.method, req.args ?? [], req.type === 'call')
	})

	ucm.connect('script-message-received::xplatLog', (_ucm, value) => {
		print(`[webview] ${value.to_string()}`)
	})

	const transportScript = `(() => {
		const listeners = new Set();
		Object.defineProperty(window, '__xplatHostTransport', {
			value: {
				receive(message) { for (const listener of listeners) listener(message); },
				listen(listener) {
					listeners.add(listener);
					return () => listeners.delete(listener);
				}
			},
			configurable: false
		});
	})();`

	ucm.add_script(
		WebKit.UserScript.new(
			transportScript +
				`window.__xplatInitialUrl = ${JSON.stringify(linkQueue.shift() ?? null)};` +
				`window.__xplatColorScheme = ${JSON.stringify(colorScheme)};` +
				(extraInjected ?? ''),
			WebKit.UserContentInjectedFrames.TOP_FRAME,
			WebKit.UserScriptInjectionTime.START,
			null,
			null,
		),
	)
}

function winFor(wv) {
	if (wv === webView) {
		return win
	}

	for (const entry of windows.values()) {
		if (entry.wv === wv) {
			return entry.win
		}
	}

	return null
}

// openWindow → Adw window + own WebKitWebView + own Octane root. kinds:
// 'regular' = independent window; 'dialog' = transient modal on the opener
// (GTK has no sheets — modal-transient is the OS-level equivalent). options.url
// resolves against the content origin; options.data is injected as
// window.__xplatWindowData — the app-installed content resolver reads it.
function openSecondaryWindow(opener, wid, opts) {
	const w = new Adw.ApplicationWindow({
		application: app,
		title: String(opts.title ?? 'xplat'),
	})

	const size = opts.size ?? { width: 640, height: 480 }
	w.set_default_size(Number(size.width) || 640, Number(size.height) || 480)

	const wv = new WebKit.WebView()
	wireWebView(
		wv,
		`window.__xplatWindowId = ${JSON.stringify(wid)};` +
			`window.__xplatWindowData = ${JSON.stringify(opts.data ?? null)};`,
	)

	if (opts.kind === 'dialog') {
		const parent = winFor(opener) ?? win
		w.set_transient_for(parent)
		w.set_modal(true)
	}

	const u = String(opts.url ?? '/')
	const target = /^[a-z]+:/i.test(u) ? u : contentOrigin + (u.startsWith('/') ? u : '/' + u)

	w.set_content(wv)
	windows.set(wid, { win: w, wv, opener })

	w.connect('close-request', () => {
		windows.delete(wid)
		if (opener) {
			emitTo(opener, 'windows', 'closed', wid)
		}

		return false
	})

	wv.load_uri(target)
	w.present()
	print(`[host] window ${wid} → ${target}`)
}

function ensureWindow() {
	if (win) {
		return
	}

	colorScheme = detectColorScheme()
	subscribeAppearance()

	win = new Adw.ApplicationWindow({ application: app, title: 'xplat' })
	win.set_default_size(1024, 768)

	webView = new WebKit.WebView()
	serveBundle(webView.get_context())
	wireWebView(webView, '')

	if (selfTest) {
		const js = readSelftest()
		let tried = 0

		const runWhenReady = () => {
			webView.evaluate_javascript(
				"typeof __xplatBridge === 'object'",
				-1,
				null,
				null,
				null,
				(_wv, res) => {
					let ready = false

					try {
						ready = webView.evaluate_javascript_finish(res)?.to_boolean() ?? false
					} catch {}

					if (ready) {
						webView.evaluate_javascript(js ?? '0', -1, null, null, null, null)
						GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
							emitTo(webView, 'deep-links', 'open', 'xplat://self-test/deep-link')
							return GLib.SOURCE_REMOVE
						})

						// Leave time for the full async bridge sweep, including opening and
						// closing its secondary WebKit view, before quitting on a hang.
						GLib.timeout_add(GLib.PRIORITY_DEFAULT, 30000, () => {
							app.quit()
							return GLib.SOURCE_REMOVE
						})
					} else if (++tried < 100) {
						GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
							runWhenReady()
							return GLib.SOURCE_REMOVE
						})
					}
				},
			)
		}

		webView.connect('load-changed', (_wv, ev) => {
			if (ev === WebKit.LoadEvent.FINISHED) {
				runWhenReady()
			}
		})
	}

	webView.connect('load-changed', (_wv, ev) => {
		if (ev !== WebKit.LoadEvent.FINISHED) {
			return
		}

		loadedOnce = true
		// The cold-start link was consumed via __xplatInitialUrl injection —
		// emit any that arrived alongside it.
		while (linkQueue.length) {
			emitTo(webView, 'deep-links', 'open', linkQueue.shift())
		}
	})

	win.set_content(webView)
	webView.load_uri(url)
	win.present()

	emitTo(webView, 'host', 'ready', { url })
}

// 'open' fires instead of 'activate' when argv carries URIs — and again on a
// running instance for each new launch. xplat://localhost/* selects content;
// anything else is a deep link: the first is consumed via document-start
// injection, the rest emit once the bundle is up.
app.connect('activate', ensureWindow)
app.connect('open', (_a, files) => {
	for (const f of files) {
		const u = f.get_uri()
		print(`[host] open ${u}`)

		if (u.startsWith('xplat://localhost')) {
			continue
		}

		if (loadedOnce) {
			emitTo(webView, 'deep-links', 'open', u)
		} else {
			linkQueue.push(u)
		}
	}

	ensureWindow()
})

app.run(['gjs-host', ...positionals])
