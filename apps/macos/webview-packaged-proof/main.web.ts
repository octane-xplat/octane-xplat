import { createHostClient } from '@octane-xplat/platform/host'
import { createWebKitTransport, desktopHost } from '@octane-xplat/platform/host/web'
import { appInfo } from '@octane-xplat/platform'
import type {
	PackagedProofEvents,
	PackagedProofResult,
	PackagedProofServices,
} from '../src/webview-packaged-proof-contracts'
import type { HostClient } from '@octane-xplat/platform/host'

const output = document.querySelector<HTMLPreElement>('#result')!

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message)
	}
}

interface PackagedClient {
	call(service: 'application', method: 'format', value: string): Promise<string>
	call(service: 'application', method: 'notify', value: string): Promise<boolean>
	call(service: 'application', method: 'probeGumEnabled'): Promise<boolean>
	call(
		service: 'application',
		method: 'notificationProbe',
	): Promise<PackagedProofResult['notifications']>
	call(service: 'application', method: 'report', result: PackagedProofResult): Promise<boolean>
}

// A script load reaching its source proves the scheme handler served the file;
// the staged pwned.js canary sits OUTSIDE Resources/web — if a traversal probe
// is ever served it executes and posts PWNED to the parent page.
let pwned: string | null = null
window.addEventListener('message', (event) => {
	if (event.data === 'PWNED') {
		pwned = String(event.data)
	}
})

const scriptProbe = (src: string): Promise<string> =>
	new Promise((resolve) => {
		const script = document.createElement('script')
		const timer = setTimeout(() => {
			script.remove()
			resolve('timeout')
		}, 8000)
		script.onload = () => {
			clearTimeout(timer)
			script.remove()
			resolve('load')
		}
		script.onerror = () => {
			clearTimeout(timer)
			script.remove()
			resolve('error')
		}
		script.src = src
		document.head.appendChild(script)
	})

async function runProof(client: HostClient<PackagedProofServices, PackagedProofEvents>) {
	const host = client as unknown as PackagedClient

	const notice = new Promise<string>((resolve) => {
		client.on('application.notice', (event) => resolve(event.message))
	})
	assert(await client.call('application', 'notify', 'packaged notice'), 'host event was not sent')
	const event = await notice
	assert(event === 'packaged notice', 'host event payload did not match')

	const formatted = await host.call('application', 'format', 'packaged channel')
	assert(formatted === 'application: packaged channel', 'channel round-trip failed')

	const desktop = desktopHost()
	assert(desktop && appInfo.supported, 'host bootstrap snapshot missing in packaged app')

	// xplat:// scheme security: everything outside Resources/web must fail;
	// the encoded-slash and symlink escapes are the live vectors — WebKit's URL
	// parser collapses plain and %2e dot segments before the request leaves.
	const schemeChecks: Record<string, string> = {}
	const probes: Array<[string, string]> = [
		['servedFile', 'xplat://app/assets/probe.js'],
		['missingFile', 'xplat://app/assets/missing.js'],
		['encodedSlashTraversal', 'xplat://app/a%2f..%2f..%2fpwned.js'],
		['encodedDotsTraversal', 'xplat://app/%2e%2e%2f%2e%2e%2fpwned.js'],
		['doubleEncodedTraversal', 'xplat://app/%252e%252e%252fpwned.js'],
		['symlinkEscape', 'xplat://app/linked-pwned.js'],
		['wrongHost', 'xplat://evil/index.html'],
	]
	for (const [name, url] of probes) {
		schemeChecks[name] = await scriptProbe(url)
	}
	assert(pwned == null, 'traversal probe served bundle content outside web root')
	assert(schemeChecks.servedFile === 'load', 'packaged file was not served by xplat://')
	for (const [name, outcome] of Object.entries(schemeChecks)) {
		if (name !== 'servedFile') {
			assert(outcome === 'error', `${name} returned ${outcome}; expected a failed load`)
		}
	}

	// UserNotifications through the retained leaf: callbacks must deliver in a
	// real bundle — timings distinguish a delivered callback from the 5s wait.
	const notifications = await host.call('application', 'notificationProbe')

	// Real media-capture dispatch is opt-in: on this host getUserMedia wedges
	// the renderer before the delegate is consulted, so the page only calls it
	// when the host enables XPLAT_PROOF_GUM. A grant resolves to a stream or
	// NotFoundError without hardware; a deny rejects NotAllowedError. The
	// staged bundle omits camera/mic usage descriptions, so a reachable leaf
	// denies deterministically.
	let capture = 'skipped'
	if (await client.call('application', 'probeGumEnabled')) {
		capture = await Promise.race([
			navigator.mediaDevices
				.getUserMedia({ video: true, audio: true })
				.then((stream) => {
					stream.getTracks().forEach((track) => track.stop())
					return 'stream'
				})
				.catch((error: unknown) =>
					error instanceof DOMException ? error.name : String(error),
				),
			new Promise<string>((resolve) => setTimeout(() => resolve('gum-pending-20s'), 20_000)),
		])
		assert(
			capture === 'NotAllowedError' || capture === 'stream' || capture === 'NotFoundError',
			`unexpected getUserMedia outcome: ${capture}`,
		)
	}

	const result: PackagedProofResult = {
		ok: true,
		channelRoundTrip: true,
		bootstrap: true,
		hostEvent: event,
		schemeChecks,
		notifications,
		capture,
	}

	output.textContent = JSON.stringify(result, null, 2)
	await host.call('application', 'report', result)
	client.dispose()
}

const transport = createWebKitTransport()
if ((window as Window & { __xplatWindowId?: string }).__xplatWindowId) {
	output.textContent = 'secondary packaged window'
} else if (!transport) {
	output.textContent = 'This packaged proof page is open outside its WKWebView host.'
} else {
	const client = createHostClient<PackagedProofServices, PackagedProofEvents>(transport)
	window.addEventListener('pagehide', () => client.dispose(), { once: true })
	void runProof(client).catch(async (error: unknown) => {
		const result: PackagedProofResult = {
			ok: false,
			channelRoundTrip: false,
			bootstrap: false,
			hostEvent: '',
			schemeChecks: {},
			notifications: {},
			capture: '',
			error: error instanceof Error ? error.message : String(error),
		}

		output.textContent = JSON.stringify(result, null, 2)
		try {
			await client.call('application', 'report', result as never)
		} catch {
			console.error('[packaged-proof] host report failed', result.error)
		}

		client.dispose()
	})
}
