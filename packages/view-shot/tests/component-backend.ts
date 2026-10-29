import type { CaptureBackend } from '../src/backend-types'
export const trace = { captured: [] as object[], released: [] as string[] }
export const backend: CaptureBackend = {
	capabilities: () => ({ view: true, screen: false, formats: ['png'], scrollContent: false }),
	validate() {},
	async capture(host) {
		trace.captured.push(host)
		return 'owned:fixture-' + trace.captured.length
	},
	async captureScreen() {
		throw new Error('Not part of this fixture')
	},
	release(uri) {
		trace.released.push(uri)
	},
	async waitForLayout() {},
}
