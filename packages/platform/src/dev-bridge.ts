// Dev-bridge endpoint discovery — iOS/Android/Windows (the unsuffixed native
// default). The NativeScript dev runtime exposes the dev server origin it is
// loading modules from as __NS_HTTP_ORIGIN__; the bridge token arrives through
// the dev-only __XPLAT_DEV_BRIDGE__ define injected by the xplatDevBridge vite
// plugin (part of the xplatNative preset). The NativeScript device transform
// injects that define as a module-scope const — unlike the web client it does
// not assign defines on globalThis — so the bare identifier is read first and
// the global is only a fallback. Absent either, there is no bridge: production
// bundles get neither and this stays inert.
import { Device } from '@nativescript/core'

declare const __XPLAT_DEV_BRIDGE__: { token?: string } | undefined

export interface DevBridgeEndpoint {
	origin: string
	token: string
}

export function devBridgePlatform(): 'ios' | 'android' | 'windows' {
	const os = Device.os.toLowerCase()
	return os === 'ios' || os === 'android' ? os : 'windows'
}

export function devBridgeEndpoint(): DevBridgeEndpoint | null {
	const token =
		typeof __XPLAT_DEV_BRIDGE__ !== 'undefined'
			? __XPLAT_DEV_BRIDGE__
			: ((globalThis as any).__XPLAT_DEV_BRIDGE__ as { token?: string } | undefined)
	const origin = (globalThis as any).__NS_HTTP_ORIGIN__ ?? (globalThis as any).__XPLAT_DEV_ORIGIN__

	if (
		typeof origin !== 'string' ||
		!/^https?:\/\//.test(origin) ||
		typeof token?.token !== 'string'
	) {
		return null
	}

	return { origin, token: token.token }
}
