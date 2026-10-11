// Dev-bridge endpoint discovery — web. The app is served by the vite dev
// server that hosts the bridge middleware, so the endpoint is same-origin.
// The token arrives through the dev-only __XPLAT_DEV_BRIDGE__ define injected
// by xplatDevBridge(); production builds inject nothing and this stays inert.
export interface DevBridgeEndpoint {
	origin: string
	token: string
}

export function devBridgePlatform(): 'web' {
	return 'web'
}

export function devBridgeEndpoint(): DevBridgeEndpoint | null {
	const token = (globalThis as any).__XPLAT_DEV_BRIDGE__ as { token?: string } | undefined
	const origin = (globalThis as any).location?.origin

	if (
		typeof origin !== 'string' ||
		!/^https?:\/\//.test(origin) ||
		typeof token?.token !== 'string'
	) {
		return null
	}

	return { origin, token: token.token }
}
