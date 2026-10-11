// Dev-bridge endpoint discovery — macOS. The WKWebView renderer loads
// dev-server content and can use location.origin like the web leaf; the
// AppKit JavaScriptCore host bundles the app ahead of time and has no fetch
// path to a dev server yet — there the endpoint stays unavailable rather than
// pretending a channel exists.
export interface DevBridgeEndpoint {
	origin: string
	token: string
}

export function devBridgePlatform(): 'macos' {
	return 'macos'
}

export function devBridgeEndpoint(): DevBridgeEndpoint | null {
	const token = (globalThis as any).__XPLAT_DEV_BRIDGE__ as { token?: string } | undefined
	const origin = (globalThis as any).location?.origin ?? (globalThis as any).__XPLAT_DEV_ORIGIN__

	if (
		typeof origin !== 'string' ||
		!/^https?:\/\//.test(origin) ||
		typeof token?.token !== 'string'
	) {
		return null
	}

	return { origin, token: token.token }
}
