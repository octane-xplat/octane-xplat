import { createWebKitTransport } from './host-bridge.web'
import {
	createHostClient,
	type HostCapabilities,
	type HostClient,
	type HostServiceClient,
} from './host-protocol'

import type {
	FrameworkHostEvents,
	FrameworkHostServices,
	HostBootstrapState,
} from './host-services'

export { createWebKitTransport } from './host-bridge.web'

export type DesktopHost = HostServiceClient<FrameworkHostServices> & {
	capabilities(): Promise<HostCapabilities<FrameworkHostServices>>
	supports<Service extends keyof FrameworkHostServices & string>(
		service: Service,
		method: keyof FrameworkHostServices[Service] & string,
	): Promise<boolean>
	on<Event extends keyof FrameworkHostEvents & string>(
		name: Event,
		listener: (payload: FrameworkHostEvents[Event]) => void,
	): () => void
	dispose(): void
}

let client: HostClient<FrameworkHostServices, FrameworkHostEvents> | null | undefined
let capabilityTable: Promise<HostCapabilities<FrameworkHostServices>> | undefined

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
	return capabilityTable.then(
		(capabilities) =>
			(capabilities as Record<string, string[] | undefined>)[service]?.includes(method) ?? false,
	)
}

/** Typed desktop service facade; null outside a supported native webview. */
export function desktopHost(): DesktopHost | null {
	const host = desktopHostClient()
	if (!host) {
		return null
	}

	return {
		app: {
			getInfo: () => host.call('app', 'getInfo'),
			getState: () => host.call('app', 'getState'),
			getWindowSize: () => host.call('app', 'getWindowSize'),
			consumeInitialUrl: () => host.call('app', 'consumeInitialUrl'),
		},
		clipboard: {
			read: () => host.call('clipboard', 'read'),
			write: (value) => host.call('clipboard', 'write', value),
		},
		files: {
			pick: (accept, options) => host.call('files', 'pick', accept, options),
			readText: (uri) => host.call('files', 'readText', uri),
			writeText: (name, text) => host.call('files', 'writeText', name, text),
		},
		notifications: {
			ensure: () => host.call('notifications', 'ensure'),
			notify: (title, body) => host.call('notifications', 'notify', title, body),
		},
		secureStorage: {
			get: (key) => host.call('secureStorage', 'get', key),
			set: (key, value) => host.call('secureStorage', 'set', key, value),
			remove: (key) => host.call('secureStorage', 'remove', key),
		},
		appearance: {
			get: () => host.call('appearance', 'get'),
		},
		windows: {
			open: (options) => host.call('windows', 'open', options),
			close: (id) => host.call('windows', 'close', id),
			setTitle: (id, title) => host.call('windows', 'setTitle', id, title),
		},
		system: {
			openUrl: (url) => host.call('system', 'openUrl', url),
			openPath: (path) => host.call('system', 'openPath', path),
			shareContent: (input) => host.call('system', 'shareContent', input),
		},
		storage: {
			get: (key) => host.call('storage', 'get', key),
			set: (key, value) => host.call('storage', 'set', key, value),
			remove: (key) => host.call('storage', 'remove', key),
		},
		capabilities: () => host.capabilities(),
		supports: desktopHostSupports,
		on: (name, listener) => host.on(name, listener),
		dispose: () => host.dispose(),
	}
}
