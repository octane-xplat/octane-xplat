// Dev-bridge endpoint discovery — Linux. The WebKitGTK host loads dev-server
// content in a webview, so the endpoint is same-origin like the web leaf; the
// token arrives through the dev-only __XPLAT_DEV_BRIDGE__ define. When the
// Linux dev flow does not serve the app from a dev-server origin this returns
// null and the bridge stays inert rather than pretending a channel exists.
export interface DevBridgeEndpoint {
	origin: string
	token: string
}

export function devBridgePlatform(): 'linux' {
	return 'linux'
}

export function devBridgeEndpoint(): DevBridgeEndpoint | null {
	const bridge = Reflect.get(globalThis, '__XPLAT_DEV_BRIDGE__')
	const token =
		typeof bridge === 'object' &&
		bridge !== null &&
		'token' in bridge &&
		typeof bridge.token === 'string'
			? bridge.token
			: undefined
	const origin = (globalThis as any).location?.origin ?? (globalThis as any).__XPLAT_DEV_ORIGIN__

	if (
		typeof origin !== 'string' ||
		!/^https?:\/\//.test(origin) ||
		typeof token !== 'string'
	) {
		return null
	}

	return { origin, token }
}
