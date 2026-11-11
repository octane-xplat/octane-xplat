// Devtools panel client: the devtools app authenticates one connection per
// discovery record with the per-server devtools token, receives a hub-assigned
// panel id, and routes channel frames to any session or backend.

import {
  devSocket,
  parseHubFrame,
  type BackendRef,
  type ChannelError,
  type DevSocket,
  type SessionSnapshot,
} from './types.ts'

export type { BackendRef, ChannelError, SessionSnapshot } from './types.ts'

/** The fields a panel needs from the dev server's discovery record. */
export interface DevtoolsServerRecord {
  endpoint: string
  instanceId: string
  devtoolsToken: string
  appRoot: string
}

export interface DevtoolsMessage {
  channel: string
  from: 'app' | 'backend'
  session?: string
  targetId?: string
  data: unknown
}

export interface DevtoolsConnection {
  readonly state: 'connecting' | 'live' | 'closed'
  /** Hub-assigned panel id, set by the `ready` frame. */
  readonly panel: string | null
  sessions(): readonly SessionSnapshot[]
  backends(): readonly BackendRef[]
  sendToApp(channel: string, session: string | '*', data: unknown): boolean
  sendToBackend(channel: string, targetId: string, data: unknown): boolean
  subscribe(
    listener: (
      message:
        | { channel: string; from: 'app'; session: string; data: unknown }
        | { channel: string; from: 'backend'; targetId: string; data: unknown },
    ) => void,
  ): () => void
  onSessions(listener: (sessions: readonly SessionSnapshot[]) => void): () => void
  onBackends(listener: (backends: readonly BackendRef[]) => void): () => void
  onError(listener: (error: ChannelError) => void): () => void
  /** Fires on every connection-state transition ('live' on the ready frame,
   *  'closed' when the socket ends or the factory yields no socket). */
  onState(listener: (state: 'connecting' | 'live' | 'closed') => void): () => void
  close(): void
}

export interface ConnectDevtoolsOptions {
  /** Overrides the socket factory — the macOS JSC host has no global
   *  `WebSocket`, so native panels inject their transport here. */
  socket?: (url: string) => DevSocket | undefined
}

export function connectDevtools(
  record: DevtoolsServerRecord,
  options: ConnectDevtoolsOptions = {},
): DevtoolsConnection {
  // The macOS JSC host has no global `URL`; records only ever carry the
  // strict loopback `/rpc` shape, so validate it directly.
  const endpoint = /^http:\/\/(127\.0\.0\.1:\d{1,5})\/rpc$/.exec(record.endpoint)

  if (
    !endpoint ||
    !/^[a-f0-9]{32}$/.test(record.instanceId) ||
    !/^[a-f0-9]{64}$/.test(record.devtoolsToken)
  ) {
    throw new Error('Invalid devtools server record')
  }

  let state: 'connecting' | 'live' | 'closed' = 'connecting'
  let panelId: string | null = null
  let socket: DevSocket | undefined
  let snapshot: readonly SessionSnapshot[] = []
  let backendList: readonly BackendRef[] = []
  const listeners = new Set<
    (
      message:
        | { channel: string; from: 'app'; session: string; data: unknown }
        | { channel: string; from: 'backend'; targetId: string; data: unknown },
    ) => void
  >()

  const sessionListeners = new Set<(sessions: readonly SessionSnapshot[]) => void>()
  const backendListeners = new Set<(backends: readonly BackendRef[]) => void>()
  const errorListeners = new Set<(error: ChannelError) => void>()
  const stateListeners = new Set<(state: 'connecting' | 'live' | 'closed') => void>()

  const setState = (next: 'connecting' | 'live' | 'closed') => {
    if (state === next) return
    state = next
    for (const listener of stateListeners) listener(next)
  }

  const ws = `ws://${endpoint[1]}/devtools`
  const next = (options.socket ?? devSocket)(ws)

  if (!next) {
    setState('closed')
  } else {
    socket = next
    next.onopen = () => {
      next.send(
        JSON.stringify({
          protocol: 'octane-devtools',
          version: 1,
          instanceId: record.instanceId,
          token: record.devtoolsToken,
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

      if (frame.type === 'ready') {
        panelId = typeof frame.panel === 'string' ? frame.panel : null
        snapshot = Array.isArray(frame.sessions) ? frame.sessions : []
        backendList = Array.isArray(frame.backends) ? frame.backends : []
        setState('live')
      } else if (frame.type === 'sessions' && Array.isArray(frame.sessions)) {
        snapshot = frame.sessions
        for (const listener of sessionListeners) {
          listener(snapshot)
        }
      } else if (frame.type === 'backends' && Array.isArray(frame.backends)) {
        backendList = frame.backends
        for (const listener of backendListeners) {
          listener(backendList)
        }
      } else if (frame.type === 'channel' && typeof frame.channel === 'string') {
        if (frame.from === 'app' && typeof frame.session === 'string') {
          for (const listener of listeners) {
            listener({
              channel: frame.channel,
              from: 'app',
              session: frame.session,
              data: frame.data,
            })
          }
        } else if (frame.from === 'backend' && typeof frame.targetId === 'string') {
          for (const listener of listeners) {
            listener({
              channel: frame.channel,
              from: 'backend',
              targetId: frame.targetId,
              data: frame.data,
            })
          }
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
    next.onclose = () => {
      if (socket === next) {
        socket = undefined
        setState('closed')
      }
    }
  }

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
    get panel() {
      return panelId
    },
    sessions: () => snapshot,
    backends: () => backendList,
    sendToApp: (channel, session, data) => send({ channel, to: 'app', session, data }),
    sendToBackend: (channel, targetId, data) => send({ channel, to: 'backend', targetId, data }),
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    onSessions(listener) {
      sessionListeners.add(listener)
      return () => sessionListeners.delete(listener)
    },
    onBackends(listener) {
      backendListeners.add(listener)
      return () => backendListeners.delete(listener)
    },
    onError(listener) {
      errorListeners.add(listener)
      return () => errorListeners.delete(listener)
    },
    onState(listener) {
      stateListeners.add(listener)
      return () => stateListeners.delete(listener)
    },
    close() {
      if (state === 'closed') {
        return
      }

      setState('closed')
      socket?.close()
      socket = undefined
    },
  }
}
