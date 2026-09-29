// bridge-selftest.linux.js — evaluated inside the webview by the host after
// load (both WKHost.swift and gjs-host.js read this file). Round-trips every
// bridge service and reports via the xplatLog message handler, which the
// host prints to stdout. Also drops a <pre> into the DOM for eyeballing.
(async () => {
	const log = (m) => webkit.messageHandlers.xplatLog.postMessage(m)
	const call = (service, method, args) =>
		new Promise((res, rej) => {
			const id = 90000 + Math.floor(Math.random() * 9000)
			const orig = window.__xplatBridge.resolve.bind(window.__xplatBridge)
			const origRej = window.__xplatBridge.reject.bind(window.__xplatBridge)

			window.__xplatBridge.resolve = (i, v) => {
				window.__xplatBridge.resolve = orig
				if (i === id) {
					res(v)
				} else {
					orig(i, v)
				}
			}

			window.__xplatBridge.reject = (i, m) => {
				window.__xplatBridge.reject = origRej
				if (i === id) {
					rej(new Error(m))
				} else {
					origRej(i, m)
				}
			}

			webkit.messageHandlers.xplat.postMessage(
				JSON.stringify({ id, service, method, args }),
			)
		})

	const out = []
	const run = async (name, fn) => {
		try {
			out.push(name + '=' + JSON.stringify(await fn()))
		} catch (e) {
			out.push(name + '!=>' + e.message)
		}
	}

	await run('clipboard.write', () => call('clipboard', 'write', ['harness-ok']))
	await run('clipboard.read', () => call('clipboard', 'read', []))
	await run('secureStorage.set', () => call('secureStorage', 'set', ['k', 'v']))
	await run('secureStorage.get', () => call('secureStorage', 'get', ['k']))
	await run('notifications.ensure', () => call('notifications', 'ensure', []))
	await run('notifications.notify', () =>
		call('notifications', 'notify', ['title', 'body']),
	)
	await run('appearance.get', () => call('appearance', 'get', []))
	await run('files.readText', () => call('files', 'readText', ['file:///etc/hosts']))

	await run('missing.method', () => call('nope', 'nope', []))

	log('SELFTEST ' + out.join(' | '))
	const d = document.createElement('pre')
	d.id = 'bridge-selftest'
	d.textContent = out.join('\n')
	document.body.prepend(d)
})()
