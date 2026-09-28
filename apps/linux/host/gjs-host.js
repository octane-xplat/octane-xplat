#!/usr/bin/env gjs
// gjs-host — the real Linux host, desk-written for the container/VM pass
// (NOT yet run — imports and async shapes need verification under
// gjs + WebKitGTK 6.0). Same wire contract as WKHost.swift:
//   webview → host:  webkit.messageHandlers.xplat.postMessage({id, service, method, args})
//   host → webview:  __xplatBridge.resolve/reject/emit via evaluate_javascript.
//
// Deps (Debian): gjs gir1.2-gtk-4.0 gir1.2-webkitgtk-6.0 libsecret-1-0 gir1.2-secret-1
// Run:   gjs gjs-host.js [url]   (default http://localhost:5201)

imports.gi.versions.Gtk = '4.0';
imports.gi.versions.WebKit = '6.0';
imports.gi.versions.Adw = '1';
const { Adw, WebKit, Gio, Secret } = imports.gi;

const url = ARGV[0] ?? 'http://localhost:5201';

const app = new Adw.Application({ application_id: 'org.octane.xplat' });
let webView = null;

function evalJS(js) {
	webView.evaluate_javascript(js, -1, null, null, null);
}

function respond(id, value) {
	evalJS(`__xplatBridge?.resolve(${id}, ${JSON.stringify(value ?? null)})`);
}

function rejectReq(id, message) {
	evalJS(`__xplatBridge?.reject(${id}, ${JSON.stringify(message)})`);
}

function emit(service, event, payload) {
	evalJS(`__xplatBridge?.emit('${service}', '${event}', ${JSON.stringify(payload ?? null)})`);
}

// Same dispatch table as WKHost.swift — native access here is Gio/D-Bus-shaped.
function dispatch(id, service, method, args) {
	try {
		if (service === 'notifications') {
			if (method === 'ensure') {
				// org.freedesktop.Notifications has no permission flow — 'granted'
				// when the session bus is reachable.
				respond(id, 'granted');
			} else if (method === 'notify') {
				const n = new Gio.Notification();
				n.set_title(String(args[0] ?? ''));

				if (args[1]) {
					n.set_body(String(args[1]));
				}

				app.send_notification(null, n);
				respond(id, true);
			}

			return;
		}

		if (service === 'clipboard') {
			const cb = webView.get_display().get_clipboard();

			if (method === 'write') {
				cb.set_text(String(args[0] ?? ''));
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
			const schema = new Secret.Schema('org.octane.xplat', Secret.SchemaFlags.NONE, {});

			if (method === 'get') {
				respond(id, Secret.password_lookup_sync(schema, { key: String(args[0]) }, null));
			} else if (method === 'set') {
				respond(id, Secret.password_store_sync(
					schema, { key: String(args[0]) }, Secret.COLLECTION_DEFAULT,
					'xplat secret', String(args[1] ?? ''), null, null));
			} else if (method === 'remove') {
				respond(id, Secret.password_clear_sync(schema, { key: String(args[0]) }, null, null));
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

app.connect('activate', () => {
	const win = new Adw.ApplicationWindow({ application: app, title: 'xplat' });
	win.set_default_size(1024, 768);

	webView = new WebKit.WebView();
	const ucm = webView.get_user_content_manager();
	ucm.register_script_message_handler('xplat', null);
	ucm.connect('script-message-received', (_ucm, result) => {
		const req = JSON.parse(result.get_js_value().to_string());
		dispatch(req.id, req.service, req.method, req.args ?? []);
	});

	// Document-start injection — sync contract for consumeInitialUrl().
	ucm.add_script(WebKit.UserScript.new(
		'window.__xplatInitialUrl = null',
		WebKit.UserContentInjectedFrames.TOP_FRAME,
		WebKit.UserScriptInjectionTime.START, null, null));

	win.set_content(webView);
	webView.load_uri(url);
	win.present();

	// Host → webview events use the same emit() path a real scheme-activated
	// deep link would take: emit('deep-links', 'open', url).
	emit('host', 'ready', { url });
});

app.run([]);
