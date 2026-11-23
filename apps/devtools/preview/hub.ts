import type {
  BackendRef,
  DevSocket,
  DevSocketFactory,
  DevtoolsServerRecord,
  SessionSnapshot,
} from '@octane-xplat/devtools/panel'

import type { PanelToServer } from '@octane-xplat/tweaks/protocol'
import type { PanelInboundFrame } from '../../../packages/devtools/src/types.ts'
import { createTweaksFixture } from './tweaks.ts'

export type Scenario = 'live' | 'empty' | 'connecting' | 'closed'

export type PreviewHub = {
  socketFor(scenario: Scenario): DevSocketFactory
  setActionFailure(value: boolean): void
}

export const previewRecord: DevtoolsServerRecord = {
  appRoot: '/fixture/devtools-preview',
  endpoint: 'http://127.0.0.1:0/rpc',
  instanceId: '0'.repeat(32),
  devtoolsToken: '0'.repeat(64),
}

const startedAt = '2026-01-01T12:00:00.000Z'
const sessions: SessionSnapshot[] = [
  { target: 'web', platform: 'web', label: 'Demo storefront' },
  { target: 'macos', platform: 'macos', label: 'Demo desktop' },
].map(({ target, platform, label }) => ({
  sessionId: target,
  targetId: target,
  appInstanceId: `preview-${target}`,
  platform,
  appLabel: label,
  registryRevision: 1,
  state: 'ready',
  ownership: 'managed',
  origin: 'fixture',
  readiness: 'ready',
  connectedAt: startedAt,
  disconnectedAt: '',
  actions: [{ id: `refresh-${target}`, title: 'Refresh catalog', availability: { ready: true } }],
  channels: [
    { id: 'xplat-actions', version: 1 },
    { id: 'xplat-motion', version: 1 },
  ],
}))

const backends: BackendRef[] = [
  { channel: 'xplat-logs', targetId: 'engine' },
  { channel: 'tweaks', targetId: 'web' },
]

type PanelRequest =
  | { type?: never; protocol: 'octane-devtools' }
  | { type: 'channel'; channel: 'xplat-logs'; targetId: 'engine'; data: { type: 'subscribe' } }
  | { type: 'channel'; channel: 'tweaks'; targetId: 'web'; data: PanelToServer }
  | {
      type: 'channel'
      channel: 'xplat-actions'
      session: string
      data: { type: 'invoke'; requestId: string; actionId: string }
    }
  | {
      type: 'channel'
      channel: 'xplat-motion'
      session: string
      data: { type: 'get'; requestId: string } | { type: 'set'; requestId: string; rate: number }
    }

export function createPreviewHub(): PreviewHub {
  const tweaks = createTweaksFixture(previewRecord.appRoot)
  const motionRates = new Map<string, number>()
  let failActions = false
  let logNumber = 0

  function socketFor(scenario: Scenario): DevSocketFactory {
    return () => {
      let logTimer: ReturnType<typeof setInterval> | undefined
      const actionTimers = new Set<ReturnType<typeof setTimeout>>()

      const emit = (frame: PanelInboundFrame) => {
        if (socket.readyState === 1) {
          socket.onmessage?.({ data: JSON.stringify(frame) })
        }
      }

      const emitLog = () => {
        const number = ++logNumber
        const target = number % 2 === 1 ? 'web' : 'macos'

        emit({
          type: 'channel',
          from: 'backend',
          channel: 'xplat-logs',
          targetId: 'engine',
          data: {
            records: [
              {
                level: number % 5 === 0 ? 'warn' : 'info',
                line: `[${target}] Preview heartbeat ${number}`,
                at: new Date(Date.parse(startedAt) + number * 1000).toISOString(),
              },
            ],
          },
        })
      }

      function receive(frame: PanelRequest) {
        if (socket.readyState !== 1) {
          return
        }

        if (!frame.type && frame.protocol === 'octane-devtools') {
          emit({
            type: 'ready',
            panel: 'preview',
            sessions: scenario === 'live' ? sessions : [],
            backends: scenario === 'live' ? backends : [],
          })
        }

        if (frame.type !== 'channel' || scenario !== 'live') {
          return
        }

        switch (frame.channel) {
          case 'xplat-logs':
            if (frame.data.type === 'subscribe' && logTimer === undefined) {
              emitLog()
              logTimer = setInterval(emitLog, 1000)
            }

            break
          case 'xplat-actions': {
            const failed = failActions
            const timer = setTimeout(() => {
              actionTimers.delete(timer)
              emit({
                type: 'channel',
                channel: frame.channel,
                from: 'app',
                session: frame.session,
                data: {
                  type: 'outcome',
                  outcome: {
                    requestId: frame.data.requestId,
                    ...(failed
                      ? { status: 'failed', error: { message: 'Simulated catalog refresh failed' } }
                      : { status: 'succeeded', result: { items: 24, target: frame.session } }),
                  },
                },
              })
            }, 300)

            actionTimers.add(timer)
            break
          }
          case 'xplat-motion':
            if (frame.data.type === 'set') {
              motionRates.set(frame.session, frame.data.rate)
            }

            emit({
              type: 'channel',
              channel: frame.channel,
              from: 'app',
              session: frame.session,
              data: { type: 'state', rate: motionRates.get(frame.session) ?? 1 },
            })

            break
          case 'tweaks':
            for (const data of tweaks.receive(frame.data)) {
              emit({
                type: 'channel',
                channel: frame.channel,
                from: 'backend',
                targetId: frame.targetId,
                data,
              })
            }

            break
        }
      }

      const socket: DevSocket = {
        readyState: 0,
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
        send(data) {
          // The real panel client is the sole sender on this in-memory socket.
          const frame = JSON.parse(data) as PanelRequest

          queueMicrotask(() => receive(frame))
        },
        close() {
          if (socket.readyState === 3) {
            return
          }

          socket.readyState = 3
          clearInterval(logTimer)
          for (const timer of actionTimers) {
            clearTimeout(timer)
          }

          actionTimers.clear()
          socket.onclose?.({ code: 1000, reason: 'Preview connection closed' })
        },
      }

      queueMicrotask(() => {
        if (socket.readyState !== 0 || scenario === 'connecting') {
          return
        }

        if (scenario === 'closed') {
          socket.close()
          return
        }

        socket.readyState = 1
        socket.onopen?.()
      })

      return socket
    }
  }

  return {
    socketFor,
    setActionFailure(value: boolean) {
      failActions = value
    },
  }
}
