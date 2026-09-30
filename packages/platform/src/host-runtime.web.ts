import { createWebKitTransport } from './host-bridge.web'
import { createHostClient, type HostCapabilities, type HostClient } from './host-protocol'
import type {
	FrameworkHostEvents,
	FrameworkHostServices,
	HostBootstrapState,
} from './host-services'

export { createWebKitTransport } from './host-bridge.web'

let client: HostClient<FrameworkHostServices, FrameworkHostEvents> | null | undefined
let capabilityTable: Promise<HostCapabilities> | undefined

/** Return the native service client when this page is inside a desktop webview. */
export function desktopHostClient(): HostClient<FrameworkHostServices, FrameworkHostEvents> | null {
	if (client !== undefined) {
		return client
	}

	const transport = createWebKitTransport()
	client = transport
		? createHostClient<FrameworkHostServices, FrameworkHostEvents>(transport)
		: null

	return client
}

/** Read values installed before the document's application scripts execute. */
export function desktopHostBootstrap(): HostBootstrapState | null {
	if (typeof window === 'undefined') {
		return null
	}

	return window.__xplatHostSnapshot ?? null
}

export function desktopHostSupports<Service extends keyof FrameworkHostServices & string>(
	service: Service,
	method: keyof FrameworkHostServices[Service] & string,
): Promise<boolean> {
	const host = desktopHostClient()
	if (!host) {
		return Promise.resolve(false)
	}

	capabilityTable ??= host.capabilities().catch(() => ({}))
	return capabilityTable.then((capabilities) => capabilities[service]?.includes(method) ?? false)
}
