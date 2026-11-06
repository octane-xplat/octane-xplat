import type { AppDebugSocket } from './dev-bridge-socket'
// Dev-bridge endpoint discovery — web. The app is served by the vite dev
// server that hosts the bridge middleware, so the endpoint is same-origin.
// The token arrives through the dev-only __XPLAT_DEV_BRIDGE__ define injected
// by xplatDevBridge(); production builds inject nothing and this stays inert.
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

export function devBridgePlatform(): 'web' {
  return 'web'
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
    (typeof token?.socket === 'string'
      ? token.socket.replace(/^ws/, 'http').split('/app?')[0]
      : undefined)

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
