import type { AppDebugSocket } from './dev-bridge-socket'
// Dev-bridge endpoint discovery — macOS. WKWebView can use location.origin.
// Bundled AppKit code derives the endpoint from its explicit app grant; the
// JavaScriptCore host's Foundation WebSocket shim supplies the transport.
// Without a development grant this remains inert. Connection readiness still
// requires the server's registration acknowledgement, not a constructor check.
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
