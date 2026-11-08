// Node-side devtools backend: runs inside the per-target engine process
// (usually a Vite plugin) and authenticates to the Go dev hub with the
// XPLAT_DEV_BACKEND grant. Reconnects with bounded backoff on unexpected
// closes; a same-key 'replaced' close or close() ends it permanently.

import {
  devSocket,
  parseHubFrame,
  type ChannelError,
  type DevSocket,
  type SessionSnapshot,
} from './types.ts'

export type { ChannelError, SessionSnapshot } from './types.ts'

export interface DevBackendMessage<In> {
  from: 'app' | 'panel'
  session?: string
  panel?: string
  data: In
}

export interface DevBackend<In, Out> {
  readonly state: 'connecting' | 'live' | 'closed'
  readonly targetId: string
  sessions(): readonly SessionSnapshot[]
  /** '*' reaches this target's live sessions that declared the channel. */
  sendToApp(session: string | '*', data: Out): boolean
  sendToPanels(data: Out, panel?: string): boolean
  subscribe(
    listener: (
      message:
        | { from: 'app'; session: string; data: In }
        | { from: 'panel'; panel: string; data: In },
    ) => void,
  ): () => void
  onSessions(listener: (sessions: readonly SessionSnapshot[]) => void): () => void
  onError(listener: (error: ChannelError) => void): () => void
  close(): void
}

interface BackendGrant {
  protocol: string
  version: number
  socket: string
  instanceId: string
  targetId: string
  token: string
}

function parseBackendGrant(source: string, channel: string): BackendGrant {
  if (source.length > 8192) {
    throw new Error('Invalid devtools backend configuration')
  }
  let grant: BackendGrant
  try {
    grant = JSON.parse(source) as BackendGrant
  } catch {
    throw new Error('Invalid devtools backend JSON')
  }
  const endpoint = new URL(grant.socket)
  if (
    grant.protocol !== 'octane-devtools-backend' ||
    grant.version !== 1 ||
    endpoint.protocol !== 'ws:' ||
    endpoint.hostname !== '127.0.0.1' ||
    !endpoint.port ||
    endpoint.pathname !== '/backend' ||
    endpoint.username ||
    endpoint.password ||
    endpoint.hash ||
    endpoint.search ||
    !/^[a-f0-9]{32}$/.test(grant.instanceId) ||
    !/^[a-f0-9]{64}$/.test(grant.token) ||
    typeof grant.targetId !== 'string' ||
    !grant.targetId ||
    !/^[a-z][a-z0-9-]{0,31}$/.test(channel)
  ) {
    throw new Error('Invalid devtools backend identity')
  }
  return grant
}

const RECONNECT_MS = [200, 500, 1000, 2000, 4000, 8000]
const REPLACED_CLOSE = 1008

// Node's `process.env`, reached through globalThis so host programs that sweep
// this source never need the full @types/node process declaration.
interface DevGlobalEnv {
  process?: { env?: Record<string, string | undefined> }
}

export function connectDevBackend<In = unknown, Out = unknown>(
  channel: string,
  options?: { env?: Record<string, string | undefined> },
): DevBackend<In, Out> | null {
  const source = (options?.env ?? (globalThis as DevGlobalEnv).process?.env ?? {}).XPLAT_DEV_BACKEND
  if (!source) {
    return null
  }
  const grant = parseBackendGrant(source, channel)

  let state: 'connecting' | 'live' | 'closed' = 'connecting'
  let socket: DevSocket | undefined
  let snapshot: readonly SessionSnapshot[] = []
  let attempts = 0
  let reconnect: ReturnType<typeof setTimeout> | undefined
  const listeners = new Set<
    (
      message:
        | { from: 'app'; session: string; data: In }
        | { from: 'panel'; panel: string; data: In },
    ) => void
  >()
  const sessionListeners = new Set<(sessions: readonly SessionSnapshot[]) => void>()
  const errorListeners = new Set<(error: ChannelError) => void>()

  const emitSessions = (sessions: SessionSnapshot[]) => {
    snapshot = sessions
    for (const listener of sessionListeners) {
      listener(snapshot)
    }
  }

  const connect = () => {
    if (state === 'closed') {
      return
    }
    state = 'connecting'
    const next = devSocket(grant.socket)
    if (!next) {
      state = 'closed'
      return
    }
    socket = next
    next.onopen = () => {
      if (socket !== next || state === 'closed') {
        next.close()
        return
      }
      next.send(
        JSON.stringify({
          protocol: 'octane-devtools-backend',
          version: 1,
          instanceId: grant.instanceId,
          targetId: grant.targetId,
          token: grant.token,
          channel,
        }),
      )
    }
    next.onmessage = (event) => {
      if (socket !== next || typeof event.data !== 'string') {
        return
      }
      const frame = parseHubFrame(event.data)
      if (!frame) {
        return
      }
      if (frame.type === 'ready' || frame.type === 'sessions') {
        emitSessions(Array.isArray(frame.sessions) ? frame.sessions : [])
        if (frame.type === 'ready') {
          state = 'live'
          attempts = 0
        }
      } else if (
        frame.type === 'channel' &&
        frame.from === 'app' &&
        typeof frame.session === 'string'
      ) {
        // Channel payloads are typed by the channel's own protocol, so the
        // single `as In` here is the documented boundary for this module.
        for (const listener of listeners) {
          listener({ from: 'app', session: frame.session, data: frame.data as In })
        }
      } else if (
        frame.type === 'channel' &&
        frame.from === 'panel' &&
        typeof frame.panel === 'string'
      ) {
        for (const listener of listeners) {
          listener({ from: 'panel', panel: frame.panel, data: frame.data as In })
        }
      } else if (frame.type === 'channel-error' && typeof frame.code === 'string') {
        const failure: ChannelError = {
          type: 'channel-error',
          code: frame.code,
          ...(frame.channel ? { channel: frame.channel } : {}),
          detail: typeof frame.detail === 'string' ? frame.detail : '',
        }

        for (const listener of errorListeners) {
          listener(failure)
        }
      }
    }
    next.onerror = () => {}
    next.onclose = (event) => {
      if (socket !== next) {
        return
      }
      socket = undefined
      if (state === 'closed' || event.code === REPLACED_CLOSE) {
        state = 'closed'
        return
      }
      reconnect = setTimeout(connect, RECONNECT_MS[Math.min(attempts++, RECONNECT_MS.length - 1)])
    }
  }

  connect()

  const send = (frame: Record<string, unknown>): boolean => {
    if (state !== 'live' || socket?.readyState !== 1) {
      return false
    }
    try {
      socket.send(JSON.stringify({ type: 'channel', ...frame }))
      return true
    } catch {
      return false
    }
  }

  return {
    get state() {
      return state
    },
    get targetId() {
      return grant.targetId
    },
    sessions: () => snapshot,
    sendToApp: (session, data) => send({ to: 'app', session, data }),
    sendToPanels: (data, panel) =>
      send(panel === undefined ? { to: 'panels', data } : { to: 'panels', panel, data }),
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    onSessions(listener) {
      sessionListeners.add(listener)
      return () => sessionListeners.delete(listener)
    },
    onError(listener) {
      errorListeners.add(listener)
      return () => errorListeners.delete(listener)
    },
    close() {
      if (state === 'closed') {
        return
      }
      state = 'closed'
      if (reconnect) {
        clearTimeout(reconnect)
      }
      socket?.close()
      socket = undefined
    },
  }
}
