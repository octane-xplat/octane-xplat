// bridge-selftest.linux.js — evaluated inside the webview by the host after
// load (both WKHost.swift and gjs-host.js read this file). Round-trips every
// bridge service and reports via the xplatLog message handler, which the
// host prints to stdout. Also drops a <pre> into the DOM for eyeballing.
;(async () => {
	const log = (m) => webkit.messageHandlers.xplatLog.postMessage(m)
	const call = (service, method, args) => window.__xplatBridge.call(service, method, args)

	const legacyCall = (service, method, args) =>
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

			webkit.messageHandlers.xplat.postMessage(JSON.stringify({ id, service, method, args }))
		})

	const out = []
	const failed = []
	let deepLink = null
	window.__xplatBridge.on('deep-links', 'open', (url) => {
		deepLink = url
	})

	const run = async (name, fn, expected) => {
		try {
			const value = await fn()
			if (
				(expected !== undefined && value !== expected) ||
				value === false ||
				value === null ||
				value === 'unsupported'
			) {
				throw new Error('unexpected result: ' + JSON.stringify(value))
			}

			const result = name + '=' + JSON.stringify(value)
			out.push(result)
			log('SELFTEST_STEP ' + result)
		} catch (e) {
			failed.push(name)
			const result = name + '!=>' + e.message
			out.push(result)
			log('SELFTEST_STEP ' + result)
		}
	}

	log('SELFTEST_STARTED')
	await run('capabilities', async () => {
		const caps = await window.__xplatBridge.capabilities()
		const expected = {
			app: ['getInfo', 'getState', 'getWindowSize', 'consumeInitialUrl'],
			clipboard: ['read', 'write'],
			files: ['pick', 'readText', 'writeText'],
			notifications: ['ensure', 'notify'],
			secureStorage: ['get', 'set', 'remove'],
			appearance: ['get'],
			windows: ['open', 'close', 'setTitle'],
			system: ['openUrl', 'openPath'],
			storage: ['get', 'set', 'remove'],
		}

		// The camera service is implemented by the Linux GJS host; when a host
		// reports it, the declared methods must be complete.
		if (caps.camera) {
			expected.camera = [
				'permissionStatus',
				'requestPermission',
				'movieDirectory',
				'reserveMoviePath',
				'writeMovieFile',
				'movieFileInfo',
				'readMovieFile',
				'deleteMovieFile',
			]
		}

		return Object.entries(expected).every(([service, methods]) =>
			methods.every((method) => caps[service]?.includes(method)),
		)
	})

	await run('deepLinks.open', async () => {
		await new Promise((resolve) => setTimeout(resolve, 1800))
		return deepLink === 'xplat://self-test/deep-link'
	})

	await run('legacy.clipboard.write', () => legacyCall('clipboard', 'write', ['legacy-ok']))
	await run('app.getInfo', async () => (await call('app', 'getInfo', [])).supported)
	await run('app.getState', async () =>
		['active', 'inactive', 'background'].includes(await call('app', 'getState', [])),
	)

	await run('app.getWindowSize', async () => {
		const size = await call('app', 'getWindowSize', [])
		return size.width > 0 && size.height > 0
	})

	await run(
		'app.consumeInitialUrl',
		async () => (await call('app', 'consumeInitialUrl', [])) ?? 'none',
	)

	await run('clipboard.write', () => call('clipboard', 'write', ['harness-ok']))
	await run('clipboard.read', () => call('clipboard', 'read', []), 'harness-ok')
	await run('storage.set', async () => {
		await call('storage', 'set', ['k', 'storage-value'])
		return true
	})

	await run('storage.get', () => call('storage', 'get', ['k']), 'storage-value')
	await run('storage.remove', async () => {
		await call('storage', 'remove', ['k'])
		return true
	})

	await run('secureStorage.set', () => call('secureStorage', 'set', ['k', 'v']))
	await run('secureStorage.get', () => call('secureStorage', 'get', ['k']), 'v')
	await run('notifications.ensure', () => call('notifications', 'ensure', []))
	await run('notifications.notify', () => call('notifications', 'notify', ['title', 'body']))
	await run('appearance.get', () => call('appearance', 'get', []))
	await run('files.readText', () => call('files', 'readText', ['file:///etc/hosts']))

	// camera movie storage: reserve, write, info, read-back, delete — the
	// shared desktop contract also served by the macOS WKWebView host.
	// Only runs on hosts that advertise the service (Linux today).
	const capsForCamera = await window.__xplatBridge.capabilities()
	if (capsForCamera.camera?.includes('writeMovieFile')) {
		await run('camera.permissionStatus', async () => {
			const { status } = await call('camera', 'permissionStatus', [{ kind: 'camera' }])
			return ['notDetermined', 'granted', 'denied', 'restricted', 'unknown'].includes(status)
		})

		let movieFileUrl = null
		await run('camera.writeMovieFile', async () => {
			const { reservation } = await call('camera', 'reserveMoviePath', [
				{ container: 'mp4' },
			])

			const { file } = await call('camera', 'writeMovieFile', [
				{ fileUrl: reservation.fileUrl, base64: btoa('movie-bytes') },
			])

			if (!file?.uri?.startsWith('file://')) {
				throw new Error('unexpected write result: ' + JSON.stringify(file))
			}

			movieFileUrl = file.uri
			return file.uri
		})

		await run('camera.movieFileInfo', async () => {
			const { info } = await call('camera', 'movieFileInfo', [{ fileUrl: movieFileUrl }])
			return info?.exists && info.size === 11
		})

		await run('camera.readMovieFile', async () => {
			const { base64 } = await call('camera', 'readMovieFile', [{ fileUrl: movieFileUrl }])
			return atob(base64) === 'movie-bytes'
		})

		await run('camera.noOverwrite', async () => {
			const { file } = await call('camera', 'writeMovieFile', [
				{ fileUrl: movieFileUrl, base64: btoa('x') },
			])

			return file === null
		})

		await run('camera.privateRoot', async () => {
			const { info } = await call('camera', 'movieFileInfo', [{ fileUrl: 'file:///etc/passwd' }])
			return info === null
		})

		await run('camera.deleteMovieFile', async () => {
			await call('camera', 'deleteMovieFile', [{ fileUrl: movieFileUrl }])
			return !(await call('camera', 'movieFileInfo', [{ fileUrl: movieFileUrl }])).info.exists
		})
	}

	// windows.open → real window+webview; windows.close → host emits
	// windows.closed back to the opener.
	const wid = 'selftest-win'
	let gotClosed = false
	window.__xplatBridge.on('windows', 'closed', (w) => {
		if (w === wid) {
			gotClosed = true
		}
	})

	await run('windows.open', () =>
		call('windows', 'open', [{ id: wid, url: '/', title: 'secondary' }]),
	)

	await new Promise((r) => setTimeout(r, 800))
	await run('windows.close', () => call('windows', 'close', [wid]))
	await new Promise((r) => setTimeout(r, 500))
	await run('windows.closedEvent', async () => gotClosed)
	await run('missing.clipboardMethod', async () => {
		try {
			await call('clipboard', 'nope', [])
			return false
		} catch (e) {
			return e.message === 'host has no clipboard.nope'
		}
	})

	await run('bootstrap.initialUrl', () => window.__xplatHostSnapshot?.initialUrl ?? 'none')
	await run('missing.method', async () => {
		try {
			await call('nope', 'nope', [])
			return false
		} catch (e) {
			return e.message === 'host has no nope.nope'
		}
	})

	log('SELFTEST ' + out.join(' | '))
	const d = document.createElement('pre')
	d.id = 'bridge-selftest'
	d.textContent = out.join('\n')
	document.body.prepend(d)
	log('SELFTEST_RESULT ' + JSON.stringify({ checks: out.length, failed }))
})()
