import { createRoot } from 'octane'
import { desktopHostClient } from '@octane-xplat/platform/host/web'
// Exercise the framework's Linux adapter, including the compatibility surface.
import '@octane-xplat/platform/bridge.linux.ts'

const host = desktopHostClient()
if (!host) { throw new Error('Linux host transport is missing') }
createRoot(document.getElementById('root')!).render(<h1>Linux consumer mounted</h1>)
console.log('LINUX_CONSUMER_MOUNTED')
host.on('app.deep-link', (url) => console.log('LINUX_INCOMING_LINK ' + url))
console.log('LINUX_INITIAL_LINK ' + window.__xplatInitialUrl)

void (async () => {
	const bridge = window.__xplatBridge!
	const mode = window.__xplatInitialUrl?.split('/').pop()
	if (mode === 'write') {
		await bridge.call('secureStorage', 'set', ['linux-proof-key', 'fixture-value'])
		console.log('LINUX_SECRET_WRITTEN')
	} else if (mode === 'read') {
		const value = await bridge.call('secureStorage', 'get', ['linux-proof-key'])
		if (value !== 'fixture-value') { throw new Error('secret did not survive application restart') }
		console.log('LINUX_SECRET_PERSISTED')
		await bridge.call('secureStorage', 'remove', ['linux-proof-key'])
	} else if (mode === 'isolated') {
		const value = await bridge.call('secureStorage', 'get', ['linux-proof-key'])
		if (value !== null) { throw new Error('another application can read this secret') }
		console.log('LINUX_SECRET_ISOLATED')
	}
})().catch((error) => console.error('LINUX_PROOF_FAILED ' + error.message))
