import * as gesturehandler from '@nativescript-community/gesturehandler'
import { Application, File, Frame, knownFolders, Page, path } from '@nativescript/core'
import * as core from '@nativescript/core'
import * as animationFrame from '@nativescript/core/animation-frame'
import * as native from '@nativescript-community/octane'
import * as signals from 'octane/signals'
import * as signalsClient from 'octane/signals/client'
import * as internal from 'octane/internal/client'

// Keep one runtime across independently compiled cases. Plugin modules use
// NativeScript's require and are present in this host's declared dependency graph.
const modules = {
	'@nativescript/core': core,
	'@nativescript-community/gesturehandler': gesturehandler,
	'@nativescript/core/animation-frame': animationFrame,
	'@nativescript-community/octane': native,
	'octane/universal/native': native,
	'octane/signals': signals,
	'octane/signals/client': signalsClient,
	'octane/internal/client': internal,
}

gesturehandler.install()

const frame = new Frame()
const page = new Page()
page.actionBarHidden = true
frame.navigate({ create: () => page })
Application.run({ create: () => frame })
let lastRun
let busy = false
const sessionPath = path.join(knownFolders.documents().path, 'probe-session.json')

setInterval(async () => {
	if (busy || !File.exists(sessionPath)) {
		return
	}

	busy = true
	let control
	let session
	try {
		session = JSON.parse(await File.fromPath(sessionPath).readText())
		control = await (await fetch(session.url + '/control')).json()
		if (!control.runId || control.runId === lastRun) {
			return
		}

		lastRun = control.runId
		const source = await (await fetch(session.url + '/bundle')).text()
		const css = await (await fetch(session.url + '/style')).text()
		// Android's CSS loader requires a path inside the extracted app root.
		const cssPath = path.join(knownFolders.currentApp().path, 'probe.css')
		await File.fromPath(cssPath).writeText(css)
		Application.setCssFileName('~/probe.css')
		Application.loadAppCss()

		const module = { exports: {} }
		const load = (name) => modules[name] ?? require(name)
		new Function('require', 'module', 'exports', source)(load, module, module.exports)
		await module.exports.start(control, (result) => {
			console.log('[xplat-probe] ' + JSON.stringify(result))
			return fetch(session.url + '/result', { method: 'POST', body: JSON.stringify(result) })
		})
	} catch (error) {
		console.log('[xplat-probe-host-error] ' + (error?.stack ?? String(error)))
		if (control?.runId && session) {
			await fetch(session.url + '/result', {
				method: 'POST',
				body: JSON.stringify({
					schema: 1,
					...control,
					host: 'NativeScript',
					interaction: 'gesture-observer-dispatch',
					status: 'fail',
					assertions: [],
					measurements: {},
					errors: [{ message: error?.message ?? String(error) }],
				}),
			}).catch(() => {})
		}
	} finally {
		busy = false
	}
}, 100)
