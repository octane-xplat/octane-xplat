import { createHostClient } from '@octane-xplat/platform/host'
import { createWebKitTransport, desktopHost } from '@octane-xplat/platform/host/web'
import { appInfo, clipboard, consumeInitialUrl, onDeepLink } from '@octane-xplat/platform'
import type { ProofEvents, ProofResult, ProofServices } from '../src/webview-proof-contracts'
import type { HostClient } from '@octane-xplat/platform/host'

const output = document.querySelector<HTMLPreElement>('#result')!
if (!output) {
	throw new Error('desktop host proof result element is missing')
}

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message)
	}
}

async function runProof(client: HostClient<ProofServices, ProofEvents>) {
	const notice = new Promise<string>((resolve) => {
		client.on('application.notice', (event) => resolve(event.message))
	})

	const desktop = desktopHost()
	assert(desktop, 'typed desktop host facade is unavailable')
	const capabilities = await client.capabilities()
	const available = [
		'app.getInfo',
		'app.getState',
		'app.getWindowSize',
		'app.consumeInitialUrl',
		'clipboard.read',
		'clipboard.write',
		'files.pick',
		'files.readText',
		'files.writeText',
		'notifications.ensure',
		'notifications.notify',
		'secureStorage.get',
		'secureStorage.set',
		'secureStorage.remove',
		'appearance.get',
		'windows.open',
		'windows.close',
		'windows.setTitle',
		'system.openUrl',
		'system.openPath',
		'system.shareContent',
		'storage.get',
		'storage.set',
		'storage.remove',
		'application.format',
		'application.notify',
		'application.deepLink',
		'application.report',
	]

	for (const method of available) {
		const [service, name] = method.split('.')
		assert(capabilities[service]?.includes(name), `host did not report ${method}`)
	}

	assert(appInfo.supported, 'webview app info did not come from the host bootstrap')
	const clipboardValue = `xplat-wkwebview-proof-${Date.now()}`
	assert(await clipboard.writeText(clipboardValue), 'framework clipboard write failed')
	assert(
		(await clipboard.readText()) === clipboardValue,
		'framework clipboard round-trip did not match',
	)

	const directClipboardValue = `${clipboardValue}-protocol`
	assert(
		await client.call('clipboard', 'write', directClipboardValue),
		'host clipboard write failed',
	)

	assert(
		(await client.call('clipboard', 'read')) === directClipboardValue,
		'host clipboard round-trip did not match',
	)

	const deepLink = new Promise<string>((resolve) => onDeepLink(resolve))
	assert(consumeInitialUrl() === null, 'unexpected initial deep link')

	const formatted = await client.call('application', 'format', 'shared contract')
	assert(
		formatted === 'application: shared contract',
		'application service returned an unexpected value',
	)

	assert(
		await client.call('application', 'notify', 'event from the native host'),
		'host event was not sent',
	)

	const event = await notice
	assert(event === 'event from the native host', 'host event payload did not match')
	assert(
		await client.call('application', 'deepLink', 'xplat://proof/deep-link'),
		'deep-link event failed',
	)

	assert((await deepLink) === 'xplat://proof/deep-link', 'host deep-link event did not arrive')

	assert((await desktop.app.getState()) === 'active', 'app state was not active')
	const windowSize = await desktop.app.getWindowSize()
	assert(windowSize.width > 0, `window size was not reported: ${JSON.stringify(windowSize)}`)
	assert((await desktop.app.consumeInitialUrl()) === null, 'initial URL was consumed twice')
	const hostsText = await desktop.files.readText('file:///etc/hosts')
	assert(hostsText?.includes('localhost'), 'host file read did not return /etc/hosts')
	const secretKey = `xplat-proof-${Date.now()}`
	assert(await desktop.secureStorage.set(secretKey, 'stored'), 'secure storage write failed')
	assert((await desktop.secureStorage.get(secretKey)) === 'stored', 'secure storage read failed')
	assert(await desktop.secureStorage.remove(secretKey), 'secure storage remove failed')
	await desktop.storage.set('proof', 'stored')
	assert((await desktop.storage.get('proof')) === 'stored', 'storage read failed')
	await desktop.storage.remove('proof')
	const scheme = await desktop.appearance.get()
	assert(scheme === 'light' || scheme === 'dark', 'appearance did not report a color scheme')

	let resolveWindowClosed!: (id: string) => void
	const windowClosed = new Promise<string>((resolve) => {
		resolveWindowClosed = resolve
	})

	desktop.on('windows.closed', resolveWindowClosed)
	const windowId = await desktop.windows.open({
		id: 'proof-secondary',
		url: '/?secondary=1',
		title: 'Secondary proof window',
		data: { proof: true },
		size: { width: 320, height: 180 },
	})

	assert(await desktop.windows.setTitle(windowId, 'Secondary proof'), 'window title update failed')
	assert(await desktop.windows.close(windowId), 'window close failed')
	assert((await windowClosed) === windowId, 'window closed event did not arrive')

	const result: ProofResult = {
		ok: true,
		capabilities: available,
		clipboardRoundTrip: true,
		frameworkClipboard: true,
		appInfo: true,
		deepLink: true,
		formatted,
		event,
	}

	output.textContent = JSON.stringify(result, null, 2)
	await client.call('application', 'report', result)
	client.dispose()
}

const transport = createWebKitTransport()
if ((window as Window & { __xplatWindowId?: string }).__xplatWindowId) {
	output.textContent = 'secondary proof window'
} else if (!transport) {
	output.textContent = 'This .web proof screen is open outside its WKWebView host.'
} else {
	const client = createHostClient<ProofServices, ProofEvents>(transport)
	window.addEventListener('pagehide', () => client.dispose(), { once: true })
	void runProof(client).catch(async (error: unknown) => {
		const result: ProofResult = {
			ok: false,
			capabilities: [],
			clipboardRoundTrip: false,
			frameworkClipboard: false,
			appInfo: false,
			deepLink: false,
			formatted: '',
			event: '',
			error: error instanceof Error ? error.message : String(error),
		}

		output.textContent = JSON.stringify(result, null, 2)
		try {
			await client.call('application', 'report', result)
		} catch {
			console.error('[webview-proof] host report failed', result.error)
		}

		client.dispose()
	})
}
