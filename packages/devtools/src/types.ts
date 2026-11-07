// Shared wire types for the xplat dev hub's devtools channels. The Go hub
// routes opaque per-channel JSON between app sessions (/app), per-target Node
// backends (/backend) and devtools panels (/devtools); these are the frame
// shapes the three peers exchange.

/** A connected app session as the hub reports it in `ready`/`sessions`. */
export interface SessionSnapshot {
  sessionId: string
  targetId: string
  appInstanceId: string
  platform: string
  appLabel?: string
  registryRevision: number
  state: 'ready' | 'disconnected' | string
  ownership: string
  origin: string
  readiness: string
  connectedAt: string
  disconnectedAt: string
  inspection?: unknown
  channels: { id: string; version: number }[]
}

/** A routing failure reported to a frame's sender (never a close). */
export interface ChannelError {
  type: 'channel-error'
  code: 'oversize' | 'undeclared_channel' | 'no_backend' | 'no_session' | 'invalid_target'
  channel?: string
  detail: string
}

/** A connected backend as the hub reports it in `ready`/`backends`. */
export interface BackendRef {
  channel: string
  targetId: string
}

interface ReadyFrame {
  type: 'ready'
  panel?: string
  sessions?: SessionSnapshot[]
  backends?: BackendRef[]
}

interface SessionsFrame {
  type: 'sessions'
  sessions?: SessionSnapshot[]
}

interface BackendsFrame {
  type: 'backends'
  backends?: BackendRef[]
}

/** Frames the hub sends to a `/backend` connection. */
export type BackendInboundFrame =
  | ReadyFrame
  | SessionsFrame
  | { type: 'channel'; channel?: string; from: 'app'; session: string; data: unknown }
  | { type: 'channel'; channel?: string; from: 'panel'; panel: string; data: unknown }
  | ChannelError

/** Frames the hub sends to a `/devtools` panel connection. */
export type PanelInboundFrame =
  | ReadyFrame
  | SessionsFrame
  | BackendsFrame
  | { type: 'channel'; channel: string; from: 'app'; session: string; data: unknown }
  | { type: 'channel'; channel: string; from: 'backend'; targetId: string; data: unknown }
  | ChannelError

/**
 * Parse one hub frame at the JSON boundary. The `as` here is the single
 * documented assertion point: frame field validation happens at each call
 * site on the narrowed `type` union, so untrusted input never needs a cast
 * anywhere else.
 */
export function parseHubFrame(
  text: string,
): BackendInboundFrame | PanelInboundFrame | undefined {
  try {
    const frame = JSON.parse(text) as { type?: unknown }
    return typeof frame?.type === 'string'
      ? (frame as BackendInboundFrame | PanelInboundFrame)
      : undefined
  } catch {
    return undefined
  }
}

/** Structural WebSocket contract shared by Node, browser and JSC hosts. */
export interface DevSocket {
  readyState: number
  onopen: (() => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onerror: (() => void) | null
  onclose: ((event: { code: number; reason: string }) => void) | null
  send(data: string): void
  close(): void
}

/** Named host environment for the global WebSocket constructor. */
export interface DevGlobalWebSocket {
  WebSocket?: new (url: string) => DevSocket
}

export function devSocket(url: string): DevSocket | undefined {
  const Constructor = (globalThis as DevGlobalWebSocket).WebSocket
  return Constructor ? new Constructor(url) : undefined
}
