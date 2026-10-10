// Harness page for the WebKitGTK camera conformance run. The conformance
// script (camera-conformance.linux.js) is evaluated by the packaged GJS host
// after load and drives the session through these window hooks. `__xplatBridge`
// is exposed over the same client the adapter uses so the host's self-test
// gate and the script's storage probes share one transport.
import { desktopHostClient } from '@octane-xplat/platform/host/web'
import { SharedCameraSession } from '../../src/session-core'
import { createSessionBackend } from '../../src/session-backend'

declare const window: any

const host = desktopHostClient() as any
window.__xplatBridge = {
	resolve() {},
	reject() {},
	emit() {},
	call: (service: string, method: string, args: unknown[] = []) =>
		host.call(service, method, ...args),
	on: (service: string, event: string, listener: (payload: unknown) => void) =>
		host.on(`${service}.${event}`, listener),
	capabilities: () => host.capabilities(),
}

// Diagnostic: dump the last finalized blob into the host movie dir for
// offline inspection when __xplatDebugMovie is set.
window.__xplatDebugMovie = true
window.dumpLastBlob = async () => {
	const blob = (window as any).__xplatLastMovieBlob
	if (!blob) {return null}
	const bytes = new Uint8Array(await blob.arrayBuffer())
	let binary = ''
	for (let i = 0; i < bytes.length; i += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
	}

	const { reservation } = await window.__xplatBridge.call('camera', 'reserveMoviePath', [
		{ container: 'mp4' },
	])

	return window.__xplatBridge.call('camera', 'writeMovieFile', [
		{ fileUrl: reservation.fileUrl, base64: btoa(binary) },
	])
}

window.createTestSession = (config = {}) => {
	const session = new SharedCameraSession(createSessionBackend(config), config)
	window.session = session
	window.events = []
	session.subscribe((event: any) => window.events.push(event))
	return session
}

window.attach = () => {
	window.detach = window.session.attach(document.querySelector('video'))
}

window.serialize = (outcome: any) =>
	outcome.kind === 'failed'
		? {
				...outcome,
				error: {
					kind: outcome.error.kind,
					message: outcome.error.message,
					operation: outcome.error.operation,
					cause: String(outcome.error.cause),
				},
			}
		: outcome

window.createTestSession()
window.testReady = true
