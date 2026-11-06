import type { AppDebugSocket } from './dev-bridge-socket'
// Dev-bridge endpoint discovery — Linux. The WebKitGTK host loads dev-server
// content in a webview, so the endpoint is same-origin like the web leaf; the
// token arrives through the dev-only __XPLAT_DEV_BRIDGE__ define. When the
// Linux dev flow does not serve the app from a dev-server origin this returns
// null and the bridge stays inert rather than pretending a channel exists.
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

export function devBridgePlatform(): 'linux' {
  return 'linux'
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
