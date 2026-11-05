import type { AppDebugSocket } from './dev-bridge-socket'
// Dev-bridge endpoint discovery — macOS. The WKWebView renderer loads
// dev-server content and can use location.origin like the web leaf; the
// AppKit JavaScriptCore host bundles the app ahead of time and has no fetch
// path to a dev server yet — there the endpoint stays unavailable rather than
// pretending a channel exists.
declare const __XPLAT_DEV_BRIDGE__:
	| { token?: string; socket?: string; instanceId?: string; targetId?: string }
	| undefined

export interface DevBridgeEndpoint {
	origin: string
	token: string
	socket?: string
	instanceId?: string
	targetId?: string
}

export function devBridgePlatform(): 'macos' {
	return 'macos'
}

export function devBridgeEndpoint(): DevBridgeEndpoint | null {
	const token =
		typeof __XPLAT_DEV_BRIDGE__ !== 'undefined'
			? __XPLAT_DEV_BRIDGE__
			: ((globalThis as any).__XPLAT_DEV_BRIDGE__ as
					| { token?: string; socket?: string; instanceId?: string; targetId?: string }
					| undefined)
	const origin =
		(globalThis as any).location?.origin ??
		(globalThis as any).__XPLAT_DEV_ORIGIN__ ??
		token?.socket?.replace(/^ws/, 'http').split('/app?')[0]

	if (
		typeof origin !== 'string' ||
		!/^https?:\/\//.test(origin) ||
		typeof token?.token !== 'string'
	) {
		return null
	}

	return {
		origin,
		token: token.token,
		socket: token.socket,
		instanceId: token.instanceId,
		targetId: token.targetId,
	}
}

// Optional host transport. Mobile/device reachability still needs its own relay;
// discovering a constructor alone is not platform qualification.
export function devBridgeSocket(url: string): AppDebugSocket | undefined {
	const Constructor = (globalThis as unknown as { WebSocket?: new (url: string) => AppDebugSocket })
		.WebSocket
	return Constructor ? new Constructor(url) : undefined
}
