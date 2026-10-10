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
const hostDir = GLib.path_get_dirname(imports.system.programPath)
let appSettings = {
	applicationId: 'org.octane.xplat',
	productName: 'Octane xplat',
	scheme: 'xplat',
}

const settingsFile = GLib.build_filenamev([hostDir, '..', 'app.json'])
if (GLib.file_test(settingsFile, GLib.FileTest.EXISTS)) {
	const [, bytes] = GLib.file_get_contents(settingsFile)
	appSettings = JSON.parse(imports.byteArray.toString(bytes))
}

appSettings.applicationId = GLib.getenv('XPLAT_PROBE_APP_ID') || appSettings.applicationId

const contentPrefix = `${appSettings.scheme}://localhost`
let selfTestExit = 1

// Bundle resolution: --bundle flag > $XPLAT_BUNDLE_DIR > ./bundle (packaged
// app dir) > ../dist (repo layout — host/ sits next to apps/linux/dist).
const bundleFlag = ARGV.findIndex((a) => a === '--bundle')
const bundleDir = [
	bundleFlag >= 0 ? ARGV[bundleFlag + 1] : null,
	GLib.getenv('XPLAT_BUNDLE_DIR'),
	GLib.build_filenamev([hostDir, '..', 'bundle']),
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
	positionals.find((u) => u.startsWith(contentPrefix)) ??
	positionals.find((u) => /^https?:\/\//.test(u)) ??
	(bundleDir ? `${contentPrefix}/` : 'http://localhost:5201')

const contentOrigin = url.match(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i)?.[0] ?? url

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
	'.mp4': 'video/mp4',
	'.m4v': 'video/mp4',
	'.webm': 'video/webm',
	'.mov': 'video/quicktime',
	'.m4a': 'audio/mp4',
	'.ogg': 'audio/ogg',
}

function serveBundle(webContext) {
	if (!bundleDir) {
		return
	}

	webContext.register_uri_scheme(appSettings.scheme, (request) => {
		// Host-managed movies play back same-origin without a bridge
		// round-trip; unlike app routes, this prefix never falls back to
		// index.html — a missing movie is a real miss.
		if (request.get_path().startsWith('/-/media/')) {
			const file = GLib.build_filenamev([
				mediaDir(),
				GLib.path_get_basename(request.get_path()),
			])

			try {
				const f = Gio.File.new_for_path(file)
				const info = f.query_info('standard::size', Gio.FileQueryInfoFlags.NONE, null)
				const ext = file.slice(file.lastIndexOf('.')).toLowerCase()
				request.finish(f.read(null), info.get_size(), MIMES[ext] ?? 'video/mp4')
			} catch (e) {
				request.finish_error(
					new GLib.Error(Gio.IOErrorEnum.quark(), Gio.IOErrorEnum.NOT_FOUND, e.message),
				)
			}

			return
		}

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
	sm.register_uri_scheme_as_secure(appSettings.scheme)
	sm.register_uri_scheme_as_cors_enabled(appSettings.scheme)
	print(`[host] serving bundle ${bundleDir} at ${contentPrefix}/`)
}

// HANDLES_OPEN routes URI argv through the 'open' signal — and, more
// importantly, forwards second-invocation URIs to the running primary
// instance over D-Bus. That's the real installed deep-link path.
const app = new Adw.Application({
	application_id: appSettings.applicationId,
	flags: Gio.ApplicationFlags.HANDLES_OPEN,
})

let win = null
let webView = null // main window's view — global events default here
let loadedOnce = false
let pendingInitialUrl = null
const linkQueue = []
const initialUrls = new Map()
let colorScheme = 'light'
let secretSchema = null
// wid → { win, wv, opener } — secondary windows opened via windows.open.
const windows = new Map()

try {
	secretSchema = new Secret.Schema(appSettings.applicationId, Secret.SchemaFlags.NONE, {
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
			`window.__xplatBridge?.emit('${service}', '${event}', ${JSON.stringify(payload ?? null)})`,
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

// Canonical framework service table — packages/platform/src/host-services.ts is
// the type source; this JS host is covered by bridge conformance checks.
// wv is the sender's webview: replies must land on the window that asked.
const hostCapabilities = {
	app: ['getInfo', 'getState', 'getWindowSize', 'consumeInitialUrl'],
	notifications: ['ensure', 'notify'],
	clipboard: ['read', 'write'],
	secureStorage: ['get', 'set', 'remove'],
	appearance: ['get'],
	files: ['readText', 'pick', 'writeText'],
	windows: ['open', 'close', 'setTitle'],
	system: ['openUrl', 'openPath'],
	storage: ['get', 'set', 'remove'],
	camera: [
		'permissionStatus',
		'requestPermission',
		'movieDirectory',
		'reserveMoviePath',
		'writeMovieFile',
		'movieFileInfo',
		'readMovieFile',
		'deleteMovieFile',
	],
}

const appInfo = () => ({
	supported: true,
	version: appSettings.version ?? null,
	build: appSettings.build ?? appSettings.version ?? null,
	bundleId: appSettings.applicationId,
})

const windowSizeFor = (targetWindow) => {
	let width = 0
	let height = 0
	try {
		width = targetWindow?.get_width?.() ?? 0
		height = targetWindow?.get_height?.() ?? 0
	} catch {}

	if (!width || !height) {
		try {
			const [defaultWidth, defaultHeight] = targetWindow?.get_default_size?.() ?? [0, 0]
			width ||= defaultWidth
			height ||= defaultHeight
		} catch {}
	}

	return {
		width,
		height,
		orientation: width >= height ? 'landscape' : 'portrait',
	}
}

const appStateFor = (targetWindow) =>
	targetWindow?.is_active === true || targetWindow?.isActive === true ? 'active' : 'inactive'

const storagePath = () =>
	GLib.build_filenamev([GLib.get_user_config_dir(), appSettings.applicationId, 'storage.json'])

// --- media capture: permission store + app-private movie files ---
// getUserMedia surfaces through the webview's permission-request signal as a
// WebKitUserMediaPermissionRequest — the host is the deciding authority on an
// unsandboxed Linux install (no OS-level camera gate outside Flatpak portals).
// Decisions persist per capture kind so checkPermission can answer without
// prompting. XPLAT_MEDIA_POLICY=allow|deny overrides the interactive prompt
// for harnesses; XPLAT_CAMERA_MOCK=1 swaps real devices for WebKit's mock
// capture devices (deterministic source on camera-less hosts).
const mediaDir = () =>
	GLib.build_filenamev([GLib.get_user_data_dir(), appSettings.applicationId, 'media'])

const mediaPermissionsPath = () =>
	GLib.build_filenamev([
		GLib.get_user_config_dir(),
		appSettings.applicationId,
		'media-permissions.json',
	])

const readMediaGrants = () => {
	try {
		const [ok, bytes] = GLib.file_get_contents(mediaPermissionsPath())
		return ok ? JSON.parse(imports.byteArray.toString(bytes)) : {}
	} catch {
		return {}
	}
}

const writeMediaGrants = (grants) => {
	const file = mediaPermissionsPath()
	GLib.mkdir_with_parents(GLib.path_get_dirname(file), 0o700)
	GLib.file_set_contents(file, JSON.stringify(grants))
}

const mediaPolicy = () => {
	const value = GLib.getenv('XPLAT_MEDIA_POLICY')
	return value === 'allow' || value === 'deny' ? value : 'prompt'
}

// Status vocabulary matches the desktop camera contract — 'restricted' marks
// a policy refusal the user cannot override in this process (XPLAT_MEDIA_POLICY=deny).
const mediaPermissionStatus = (kind) => {
	const policy = mediaPolicy()
	if (policy === 'deny') {
		return 'restricted'
	}

	if (policy === 'allow') {
		return 'granted'
	}

	const value = readMediaGrants()[kind]
	return value === 'granted' || value === 'denied' ? value : 'notDetermined'
}

// Explicit app action: answer from the persisted grant when one exists,
// otherwise follow the env policy or raise the interactive GTK dialog and
// remember the choice. Replies asynchronously — the bridge tolerates a late
// reply.
const mediaRequestPermission = (kind, wv, done) => {
	const status = mediaPermissionStatus(kind)
	if (status !== 'notDetermined') {
		done(status)
		return
	}

	const policy = mediaPolicy()
	if (policy === 'deny') {
		done('restricted')
		return
	}

	if (policy === 'allow') {
		done('granted')
		return
	}

	const dialog = new Gtk.AlertDialog({
		message: `Allow ${kind} access?`,
		detail: `${appSettings.productName} is requesting access to your ${kind}. The decision is remembered for this app.`,
		buttons: ['Deny', 'Allow'],
		cancel_button: 0,
		default_button: 1,
	})

	dialog.choose(winFor(wv) ?? win, null, (d, res) => {
		let allowed = false
		try {
			allowed = d.choose_finish(res) === 1
		} catch {}

		const next = readMediaGrants()
		next[kind] = allowed ? 'granted' : 'denied'
		writeMediaGrants(next)
		done(next[kind])
	})
}

// App-private data root — mirrors the macOS host's Application Support root.
const appPrivateRoot = () =>
	GLib.build_filenamev([GLib.get_user_data_dir(), appSettings.applicationId])

const uriToPath = (uri) => {
	const value = String(uri)
	if (value.startsWith('/')) {
		return value
	}

	const path = Gio.File.new_for_uri(value).get_path()
	return path || null
}

const pathInsidePrivateRoot = (uri) => {
	const path = uriToPath(uri)
	if (!path) {
		return null
	}

	const root = `${appPrivateRoot()}/`
	return path === appPrivateRoot() || path.startsWith(root) ? path : null
}

const movieDirectory = () => {
	const dir = mediaDir()
	GLib.mkdir_with_parents(dir, 0o700)
	return Gio.File.new_for_path(dir).get_uri()
}

const reserveMoviePath = (options) => {
	// The app-private root always exists on demand so a destination directly
	// under it validates; deeper parents must already exist.
	GLib.mkdir_with_parents(appPrivateRoot(), 0o700)

	if (options.fileUrl) {
		const target = pathInsidePrivateRoot(String(options.fileUrl))
		if (!target) {
			return null
		}

		const file = Gio.File.new_for_path(target)
		const parent = file.get_parent()
		if (file.query_exists(null) || !parent || !parent.query_exists(null)) {
			return null
		}

		return { fileUrl: file.get_uri() }
	}

	const suffix = String(options.container ?? '').toLowerCase()
	const ext = ['mp4', 'mov', 'webm'].includes(suffix) ? suffix : 'mp4'
	const name = `clip-${Date.now()}-${GLib.uuid_string_random().slice(0, 8)}.${ext}`
	movieDirectory()
	const file = Gio.File.new_for_path(mediaDir())
	return { fileUrl: file.get_child(name).get_uri() }
}

const writeMovieFile = (options) => {
	const target = pathInsidePrivateRoot(String(options.fileUrl ?? ''))
	if (!target) {
		return null
	}

	const bytes = GLib.base64_decode(String(options.base64 ?? ''))
	const file = Gio.File.new_for_path(target)
	const parent = file.get_parent()
	if (!parent || file.query_exists(null)) {
		return null
	}

	try {
		const free = parent
			.query_filesystem_info(Gio.FILE_ATTRIBUTE_FILESYSTEM_FREE, null)
			.get_attribute_uint64(Gio.FILE_ATTRIBUTE_FILESYSTEM_FREE)

		if (free < bytes.length + 1_048_576) {
			return null
		}
	} catch {
		return null
	}

	// Write-then-move keeps partial files out of the output name;
	// FileCopyFlags.NONE makes the move refuse an existing target.
	const tmpPath = `${target}.tmp-${GLib.uuid_string_random().slice(0, 8)}`
	GLib.file_set_contents(tmpPath, bytes)
	try {
		Gio.File.new_for_path(tmpPath).move(file, Gio.FileCopyFlags.NONE, null, null)
	} catch {
		Gio.File.new_for_path(tmpPath).delete(null)
		return null
	}

	return { name: GLib.path_get_basename(target), uri: file.get_uri() }
}

const movieFileInfo = (uri) => {
	const target = pathInsidePrivateRoot(uri)
	if (!target) {
		return null
	}

	const file = Gio.File.new_for_path(target)
	if (!file.query_exists(null)) {
		return { exists: false }
	}

	const info = file.query_info('standard::size', Gio.FileQueryInfoFlags.NONE, null)
	return { exists: true, fileUrl: file.get_uri(), size: info.get_size() }
}

const readMovieFile = (uri) => {
	const target = pathInsidePrivateRoot(uri)
	if (!target) {
		return null
	}

	const [ok, bytes] = GLib.file_get_contents(target)
	return ok ? GLib.base64_encode(bytes) : null
}

const deleteMovieFile = (uri) => {
	const target = pathInsidePrivateRoot(uri)
	if (!target) {
		return false
	}

	const file = Gio.File.new_for_path(target)
	if (!file.query_exists(null)) {
		return true
	}

	try {
		return file.delete(null)
	} catch {
		return false
	}
}

function decideUserMedia(wv, request) {
	const required = []
	if (WebKit.user_media_permission_is_for_video_device(request)) {
		required.push('camera')
	}

	if (WebKit.user_media_permission_is_for_audio_device(request)) {
		required.push('microphone')
	}

	const grants = readMediaGrants()
	// An explicit denial is a durable user decision — deny without reprompting.
	if (required.some((kind) => grants[kind] === 'denied')) {
		request.deny()
		return true
	}

	const missing = required.filter((kind) => grants[kind] !== 'granted')
	if (!missing.length) {
		request.allow()
		return true
	}

	const policy = mediaPolicy()
	if (policy === 'deny') {
		request.deny()
		return true
	}

	if (policy === 'allow') {
		// Test-seam decisions stay in memory — persisted grants belong to
		// interactive choices.
		request.allow()
		return true
	}

	const names = missing.join(' and ')
	const dialog = new Gtk.AlertDialog({
		message: `Allow ${names} access?`,
		detail: `${appSettings.productName} is requesting access to your ${names}. The decision is remembered for this app.`,
		buttons: ['Deny', 'Allow'],
		cancel_button: 0,
		default_button: 1,
	})

	dialog.choose(winFor(wv) ?? win, null, (d, res) => {
		let allowed = false
		try {
			allowed = d.choose_finish(res) === 1
		} catch {}

		const next = readMediaGrants()
		for (const kind of missing) {
			next[kind] = allowed ? 'granted' : 'denied'
		}

		writeMediaGrants(next)
		if (allowed) {
			request.allow()
		} else {
			request.deny()
		}
	})

	return true
}

const readStorage = () => {
	try {
		const [ok, bytes] = GLib.file_get_contents(storagePath())
		return ok ? JSON.parse(imports.byteArray.toString(bytes)) : {}
	} catch {
		return {}
	}
}

const writeStorage = (values) => {
	const file = storagePath()
	GLib.mkdir_with_parents(GLib.path_get_dirname(file), 0o700)
	GLib.file_set_contents(file, JSON.stringify(values))
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
			: evalJS(`window.__xplatBridge?.resolve(${id}, ${JSON.stringify(value ?? null)})`)

	const fail = (message) =>
		protocol
			? receiveProtocol(wv, { type: 'reply', id, ok: false, error: String(message) })
			: evalJS(`window.__xplatBridge?.reject(${id}, ${JSON.stringify(message)})`)

	if (!Array.isArray(hostCapabilities[service]) || !hostCapabilities[service].includes(method)) {
		fail(`host has no ${service}.${method}`)
		return
	}

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
						appSettings.productName,
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

		if (service === 'app') {
			if (method === 'getInfo') {
				reply(appInfo())
			} else if (method === 'getState') {
				reply(appStateFor(winFor(wv)))
			} else if (method === 'getWindowSize') {
				reply(windowSizeFor(winFor(wv)))
			} else if (method === 'consumeInitialUrl') {
				reply(initialUrls.get(wv) ?? null)
				initialUrls.delete(wv)
			}

			return
		}

		if (service === 'storage') {
			if (selfTest) {
				globalThis.__xplatSelftestStorage ??= new Map()
				const values = globalThis.__xplatSelftestStorage
				if (method === 'get') {
					reply(values.get(String(args[0])) ?? null)
				} else if (method === 'set') {
					values.set(String(args[0]), String(args[1] ?? ''))
					reply(null)
				} else if (method === 'remove') {
					values.delete(String(args[0]))
					reply(null)
				}

				return
			}

			const key = String(args[0])
			const values = readStorage()
			if (method === 'get') {
				reply(Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : null)
			} else if (method === 'set') {
				values[key] = String(args[1] ?? '')
				writeStorage(values)
				reply(null)
			} else if (method === 'remove') {
				delete values[key]
				writeStorage(values)
				reply(null)
			}

			return
		}

		if (service === 'secureStorage') {
			if (!secretSchema) {
				fail('Secret.Schema unavailable')
				return
			}

			const attrs = { key: String(args[0] ?? '') }
			// Real apps persist to the user's unlocked keyring. Self-tests use
			// an in-memory collection so probes never persist test secrets.
			const collection = selfTest ? Secret.COLLECTION_SESSION : Secret.COLLECTION_DEFAULT

			const finish = (operation) => (_source, result) => {
				try {
					reply(operation(result))
				} catch (error) {
					fail(error.message ?? String(error))
				}
			}

			if (method === 'get') {
				Secret.password_lookup(secretSchema, attrs, null, finish(Secret.password_lookup_finish))
			} else if (method === 'set') {
				Secret.password_store(
					secretSchema,
					attrs,
					collection,
					`${appSettings.productName} secret`,
					String(args[1] ?? ''),
					null,
					finish(Secret.password_store_finish),
				)
			} else if (method === 'remove') {
				Secret.password_clear(secretSchema, attrs, null, finish(Secret.password_clear_finish))
			}

			return
		}

		if (service === 'appearance' && method === 'get') {
			reply(colorScheme)
			return
		}

		if (service === 'camera') {
			// Shared desktop contract — packages/camera/src/host-movie.web.ts on
			// the page side, XplatWebViewHost.swift on macOS. All movie paths are
			// confined to the app-private data root; nothing overwrites.
			const options = args[0] ?? {}

			if (method === 'permissionStatus') {
				reply({ status: mediaPermissionStatus(String(options.kind)) })
				return
			}

			if (method === 'requestPermission') {
				mediaRequestPermission(String(options.kind), wv, (status) => reply({ status }))
				return
			}

			if (method === 'movieDirectory') {
				reply({ fileUrl: movieDirectory() })
				return
			}

			if (method === 'reserveMoviePath') {
				reply({ reservation: reserveMoviePath(options) })
				return
			}

			if (method === 'writeMovieFile') {
				reply({ file: writeMovieFile(options) })
				return
			}

			if (method === 'movieFileInfo') {
				reply({ info: movieFileInfo(String(options.fileUrl ?? '')) })
				return
			}

			if (method === 'readMovieFile') {
				reply({ base64: readMovieFile(String(options.fileUrl ?? '')) })
				return
			}

			if (method === 'deleteMovieFile') {
				reply({ removed: deleteMovieFile(String(options.fileUrl ?? '')) })
				return
			}
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
				const options = args[1] && typeof args[1] === 'object' ? args[1] : {}
				if (options.startingFolder) {
					dialog.set_initial_folder(Gio.File.new_for_path(String(options.startingFolder)))
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
				const entry = windows.get(String(args[0]))
				entry?.win.set_title(String(args[1] ?? ''))
				reply(!!entry)
			}

			return
		}

		if (service === 'system' && method === 'openUrl') {
			reply(Gio.AppInfo.launch_default_for_uri(String(args[0]), null))
			return
		}

		if (service === 'system' && method === 'openPath') {
			const target = Gio.File.new_for_path(String(args[0]))
			reply(Gio.AppInfo.launch_default_for_uri(target.get_uri(), null))
			return
		}

		fail(`host has no ${service}.${method}`)
	} catch (e) {
		fail(e.message ?? String(e))
	}
}

function readSelftest() {
	const custom = GLib.getenv('XPLAT_SELFTEST_SCRIPT')
	if (custom) {
		try {
			const [, bytes] = GLib.file_get_contents(custom)
			return imports.byteArray.toString(bytes)
		} catch {
			return null
		}
	}

	for (const dir of [hostDir, '.', bundleDir ?? '']) {
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
function wireWebView(wv, extraInjected = '', hostWindow = win, consumeInitial = true) {
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
		const message = value.to_string()
		print(`[webview] ${message}`)
		if (selfTest && message.startsWith('SELFTEST_RESULT ')) {
			const result = JSON.parse(message.slice('SELFTEST_RESULT '.length))
			selfTestExit = result.failed.length === 0 ? 0 : 1
			app.quit()
		}
	})

	// getUserMedia needs the media-stream feature; the mock capture flag is a
	// deterministic device source for camera-less hosts and harnesses — real
	// devices remain the default for packaged apps.
	const wvSettings = wv.get_settings()
	wvSettings.set_enable_media_stream(true)
	if (GLib.getenv('XPLAT_CAMERA_MOCK') === '1') {
		wvSettings.set_enable_mock_capture_devices(true)
	}

	wv.connect('permission-request', (_w, request) => {
		if (request instanceof WebKit.UserMediaPermissionRequest) {
			return decideUserMedia(wv, request)
		}

		if (request instanceof WebKit.DeviceInfoPermissionRequest) {
			const grants = readMediaGrants()
			if (grants.camera === 'granted' || grants.microphone === 'granted') {
				request.allow()
			} else {
				request.deny()
			}

			return true
		}

		return false
	})

	const initialUrl = consumeInitial ? (linkQueue.shift() ?? pendingInitialUrl) : null
	if (consumeInitial) {
		pendingInitialUrl = null
	}

	if (initialUrl) {
		initialUrls.set(wv, initialUrl)
	}

	const snapshot = JSON.stringify({
		appInfo: appInfo(),
		appState: appStateFor(hostWindow),
		windowSize: windowSizeFor(hostWindow),
		initialUrl,
		colorScheme,
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
				`window.__xplatHostSnapshot = ${snapshot};` +
				'window.__xplatInitialUrl = window.__xplatHostSnapshot.initialUrl;' +
				'window.__xplatColorScheme = window.__xplatHostSnapshot.colorScheme;' +
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
		w,
		false,
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

	win = new Adw.ApplicationWindow({ application: app, title: appSettings.productName })
	win.set_default_size(1024, 768)

	webView = new WebKit.WebView()
	if (selfTest || GLib.getenv('XPLAT_LOG_CONSOLE') === '1') {
		webView.get_settings().set_enable_write_console_messages_to_stdout(true)
	}

	serveBundle(webView.get_context())
	wireWebView(webView, '', win, true)

	if (selfTest) {
		const js = readSelftest()
		if (!js) {
			printerr('[host] missing bridge-selftest.linux.js')
			imports.system.exit(1)
		}

		GLib.timeout_add(GLib.PRIORITY_DEFAULT, 90000, () => {
			printerr('[host] self-test timed out')
			app.quit()
			return GLib.SOURCE_REMOVE
		})

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

	win.connect('notify::is-active', () => {
		emitAll('app.state', 'change', appStateFor(win))
	})

	win.connect('notify::default-width', () => {
		emitAll('window', 'resize', windowSizeFor(win))
	})

	win.connect('notify::default-height', () => {
		emitAll('window', 'resize', windowSizeFor(win))
	})

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

		if (u.startsWith(contentPrefix)) {
			continue
		}

		pendingInitialUrl ??= u
		if (loadedOnce) {
			emitTo(webView, 'deep-links', 'open', u)
		} else {
			linkQueue.push(u)
		}
	}

	ensureWindow()
})

const exitCode = app.run(['gjs-host', ...positionals])
imports.system.exit(selfTest ? selfTestExit : exitCode)
