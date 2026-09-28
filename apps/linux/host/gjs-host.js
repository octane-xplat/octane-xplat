#!/usr/bin/env gjs
// gjs-host — the real Linux host. Same wire contract as WKHost.swift:
//   webview → host:  webkit.messageHandlers.xplat.postMessage(JSON string)
//   host → webview:  __xplatBridge.resolve/reject/emit via evaluate_javascript
//
// Deps (Debian trixie): gjs libgtk-4-1 libadwaita-1-0 libwebkitgtk-6.0-4
//   gir1.2-webkit-6.0 gir1.2-adw-1 libsecret-1-0 gir1.2-secret-1 dbus xvfb
//   gnome-keyring notification-daemon
// Run: xvfb-run -a dbus-run-session -- gjs gjs-host.js [--self-test] [url]

imports.gi.versions.Gtk = '4.0';
imports.gi.versions.WebKit = '6.0';
imports.gi.versions.Adw = '1';
imports.gi.versions.Secret = '1';
const { Adw, WebKit, Gio, GLib, Gdk, Secret } = imports.gi;

const url = ARGV.find((a) => !a.startsWith('--')) ?? 'http://localhost:5201';
const selfTest = ARGV.includes('--self-test');

const app = new Adw.Application({ application_id: 'org.octane.xplat' });
let webView = null;
let secretSchema = null;

try {
	secretSchema = new Secret.Schema('org.octane.xplat', Secret.SchemaFlags.NONE, {
		key: Secret.SchemaAttributeType.STRING,
	});
} catch (e) {
	print(`[host] Secret.Schema unavailable: ${e.message}`);
}

function evalJS(js) {
	webView.evaluate_javascript(js, -1, null, null, null, null);
}

function respond(id, value) {
	evalJS(`__xplatBridge?.resolve(${id}, ${JSON.stringify(value ?? null)})`);
}

function rejectReq(id, message) {
	evalJS(`__xplatBridge?.reject(${id}, ${JSON.stringify(message)})`);
}

function emit(service, event, payload) {
	evalJS(
		`__xplatBridge?.emit('${service}', '${event}', ${JSON.stringify(payload ?? null)})`,
	);
}

// Same dispatch table as WKHost.swift — native access here is Gio/D-Bus-shaped.
function dispatch(id, service, method, args) {
	try {
		if (service === 'notifications') {
			// org.freedesktop.Notifications directly — GApplication.send_notification
			// needs an org.gtk.Notifications server (GNOME Shell); the freedesktop
			// Notify call is the cross-DE path (notification-daemon, dunst, …).
			const bus = Gio.bus_get_sync(Gio.BusType.SESSION, null);

			if (method === 'ensure') {
				try {
					bus.call_sync(
						'org.freedesktop.Notifications', '/org/freedesktop/Notifications',
						'org.freedesktop.Notifications', 'GetCapabilities', null,
						new GLib.VariantType('(as)'), Gio.DBusCallFlags.NONE, 2000, null);

					respond(id, 'granted');
				} catch {
					respond(id, 'unsupported');
				}
			} else if (method === 'notify') {
				bus.call_sync(
					'org.freedesktop.Notifications', '/org/freedesktop/Notifications',
					'org.freedesktop.Notifications', 'Notify',
					new GLib.Variant('(susssasa{sv}i)', [
						'xplat', 0, '', String(args[0] ?? ''), String(args[1] ?? ''), [], {}, -1,
					]),
					new GLib.VariantType('(u)'), Gio.DBusCallFlags.NONE, -1, null);

				respond(id, true);
			}

			return;
		}

		if (service === 'clipboard') {
			const cb = webView.get_display().get_clipboard();

			if (method === 'write') {
				// GTK4 has no Gdk.Clipboard.set_text — writes go through a
				// ContentProvider.
				cb.set_content(
					Gdk.ContentProvider.new_for_value(String(args[0] ?? '')));

				respond(id, true);
			} else if (method === 'read') {
				cb.read_text_async(null, (_c, res) => {
					try {
						respond(id, cb.read_text_finish(res));
					} catch {
						respond(id, null);
					}
				});
			}

			return;
		}

		if (service === 'secureStorage') {
			if (!secretSchema) {
				rejectReq(id, 'Secret.Schema unavailable');
				return;
			}

			const attrs = { key: String(args[0] ?? '') };
			// COLLECTION_SESSION lives in the daemon's memory — no disk keyring,
			// no unlock prompt (the default collection prompts to create one
			// under a headless session, which hangs the sync call). A shipped
			// host wants COLLECTION_DEFAULT.
			const collection = Secret.COLLECTION_SESSION;

			if (method === 'get') {
				respond(id, Secret.password_lookup_sync(secretSchema, attrs, null));
			} else if (method === 'set') {
				respond(
					id,
					Secret.password_store_sync(
						secretSchema, attrs, collection,
						'xplat secret', String(args[1] ?? ''), null,
					),
				);
			} else if (method === 'remove') {
				respond(id, Secret.password_clear_sync(secretSchema, attrs, null));
			}

			return;
		}

		if (service === 'system' && method === 'openUrl') {
			respond(id, Gio.AppInfo.launch_default_for_uri(String(args[0]), null));
			return;
		}

		if (service === 'deepLinks' && method === 'initialUrl') {
			respond(id, null);
			return;
		}

		rejectReq(id, `host has no ${service}.${method}`);
	} catch (e) {
		rejectReq(id, e.message ?? String(e));
	}
}

function readSelftest() {
	try {
		const [ok, bytes] = GLib.file_get_contents('bridge-selftest.linux.js');
		return ok ? imports.byteArray.toString(bytes) : null;
	} catch {
		return null;
	}
}

app.connect('activate', () => {
	const win = new Adw.ApplicationWindow({ application: app, title: 'xplat' });
	win.set_default_size(1024, 768);

	webView = new WebKit.WebView();
	const ucm = webView.get_user_content_manager();
	ucm.register_script_message_handler('xplat', null);
	ucm.register_script_message_handler('xplatLog', null);
	// Detailed signals separate the two handlers — WebKitGTK 6.0 delivers a
	// bare JSCValue (WebKitJavascriptResult is gone); the client posts a JSON
	// string, so to_string() → JSON.parse.
	ucm.connect('script-message-received::xplat', (_ucm, value) => {
		const req = JSON.parse(value.to_string());
		dispatch(req.id, req.service, req.method, req.args ?? []);
	});

	ucm.connect('script-message-received::xplatLog', (_ucm, value) => {
		print(`[webview] ${value.to_string()}`);
	});

	// Document-start injection — sync contract for consumeInitialUrl().
	ucm.add_script(WebKit.UserScript.new(
		'window.__xplatInitialUrl = null',
		WebKit.UserContentInjectedFrames.TOP_FRAME,
		WebKit.UserScriptInjectionTime.START, null, null));

	if (selfTest) {
		const js = readSelftest();
		let tried = 0;

		const runWhenReady = () => {
			webView.evaluate_javascript(
				"typeof __xplatBridge === 'object'", -1, null, null, null,
				(_wv, res) => {
					let ready = false;

					try {
						ready = webView.evaluate_javascript_finish(res)?.to_boolean() ?? false;
					} catch {}

					if (ready) {
						webView.evaluate_javascript(js ?? '0', -1, null, null, null, null);
						GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
							emit('deep-links', 'open', 'xplat://self-test/deep-link');
							return GLib.SOURCE_REMOVE;
						});
					} else if (++tried < 100) {
						GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
							runWhenReady();
							return GLib.SOURCE_REMOVE;
						});
					}
				},
			);
		};

		webView.connect('load-changed', (_wv, ev) => {
			if (ev === WebKit.LoadEvent.FINISHED) {
				runWhenReady();
			}
		});
	}

	win.set_content(webView);
	webView.load_uri(url);
	win.present();

	// Host → webview events use the same emit() path a real scheme-activated
	// deep link would take: emit('deep-links', 'open', url).
	emit('host', 'ready', { url });
});

app.run([]);
