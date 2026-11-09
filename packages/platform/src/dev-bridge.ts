import type { AppDebugSocket } from './dev-bridge-socket'
// Dev-bridge endpoint discovery — iOS/Android/Windows (the unsuffixed native
// default). The NativeScript dev runtime exposes the dev server origin it is
// loading modules from as __NS_HTTP_ORIGIN__; the bridge token arrives through
// the dev-only __XPLAT_DEV_BRIDGE__ define injected by the native bridge
// plugin. Go foreground dev supplies a relay path on that same origin. The
// NativeScript device transform
// injects that define as a module-scope const — unlike the web client it does
// not assign defines on globalThis — so the bare identifier is read first and
// the global is only a fallback. Absent either, there is no bridge: production
// bundles get neither and this stays inert.
import { Device } from '@nativescript/core'

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

export function devBridgePlatform(): 'ios' | 'android' | 'windows' {
  const os = Device.os.toLowerCase()

  return os === 'ios' || os === 'android' ? os : 'windows'
}

export function devBridgeEndpoint(): DevBridgeEndpoint | null {
  const token =
    typeof __XPLAT_DEV_BRIDGE__ !== 'undefined'
      ? __XPLAT_DEV_BRIDGE__
      : ((globalThis as any).__XPLAT_DEV_BRIDGE__ as
          | { token?: string; socket?: string; instanceId?: string; targetId?: string }
          | undefined)

  const origin = (globalThis as any).__NS_HTTP_ORIGIN__ ?? (globalThis as any).__XPLAT_DEV_ORIGIN__

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

// Device endpoints use the existing Vite origin rather than host loopback.
// A constructor and a resolved URL still do not establish device qualification.
export function devBridgeSocket(url: string): AppDebugSocket | undefined {
  const Constructor = (globalThis as unknown as { WebSocket?: new (url: string) => AppDebugSocket })
    .WebSocket

  if (Constructor && url.startsWith('/')) {
    const endpoint = devBridgeEndpoint()

    if (!endpoint || !url.startsWith('/__xplat_dev__/app?')) {
      throw new Error('Invalid app debug relay endpoint')
    }

    const resolved = new URL(url, endpoint.origin)

    resolved.protocol = resolved.protocol === 'https:' ? 'wss:' : 'ws:'
    url = resolved.href
  }

  return Constructor ? new Constructor(url) : undefined
}
