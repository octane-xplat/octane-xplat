// Hook-free panel model — owns the connectDevtools lifecycle and exposes each
// render slice as a store. Actions go through the reserved xplat-actions app
// channel; logs come from the xplat-logs engine backend. Behavior mirrors the
// retired vanilla panel (app/panel.js): bare outcomes map back to actions by
// requestId, logs subscribe on the backend ref's first appearance, and the log
// view keeps the newest 500 records.

import { createStore } from '@octane-xplat/ui/data'
import {
  connectDevtools,
  type BackendRef,
  type DevtoolsConnection,
  type DevtoolsServerRecord,
  type SessionSnapshot,
} from '../client.ts'

import type { DevSocket } from '../types.ts'

export type DevSocketFactory = (url: string) => DevSocket | undefined

export interface LogLine {
  level: string
  line: string
  at?: string
}

export interface ActionRun {
  status: string
  result?: unknown
  error?: unknown
}

const LOG_KEEP = 500

export class PanelModel {
  readonly connState$ = createStore<'connecting' | 'live' | 'closed'>('connecting')
  readonly panel$ = createStore<string | null>(null)
  readonly sessions$ = createStore<readonly SessionSnapshot[]>([])
  readonly backends$ = createStore<readonly BackendRef[]>([])
  readonly logs$ = createStore<readonly LogLine[]>([])
  readonly runs$ = createStore<ReadonlyMap<string, ActionRun>>(new Map())
  readonly logTarget$ = createStore<string | null>(null)

  private conn: DevtoolsConnection | null = null
  private readonly requests = new Map<string, string>()
  private readonly runs = new Map<string, ActionRun>()
  private logs: LogLine[] = []
  private requestCounter = 0

  connect(record: DevtoolsServerRecord, socket?: DevSocketFactory) {
    this.dispose()
    this.requests.clear()
    this.runs.clear()
    this.logs = []
    this.connState$.set('connecting')
    this.panel$.set(null)
    this.sessions$.set([])
    this.backends$.set([])
    this.logs$.set([])
    this.runs$.set(new Map())
    this.logTarget$.set(null)

    const conn = connectDevtools(record, socket ? { socket } : {})

    this.conn = conn

    conn.onState((state) => {
      this.connState$.set(state)
      this.panel$.set(conn.panel)
      // The ready frame seeds sessions/backends without firing their
      // listeners — read the snapshots when the connection goes live.
      if (state === 'live') {
        this.sessions$.set(conn.sessions())
        this.backends$.set(conn.backends())
        this.subscribeLogs()
      }
    })

    conn.onSessions((sessions) => {
      this.sessions$.set(sessions)
    })

    conn.onBackends((backends) => {
      this.backends$.set(backends)
      this.subscribeLogs()
    })

    conn.subscribe((message) => {
      if (message.channel === 'xplat-actions' && isOutcome(message.data)) {
        const actionId = this.requests.get(message.data.outcome.requestId)

        if (actionId) {
          this.runs.set(actionId, message.data.outcome)
          this.runs$.set(new Map(this.runs))
        }
      }

      if (message.channel === 'xplat-logs' && isLogFrame(message.data)) {
        this.logs.push(...message.data.records)
        if (this.logs.length > LOG_KEEP) {
          this.logs.splice(0, this.logs.length - LOG_KEEP)
        }

        this.logs$.set([...this.logs])
      }
    })

    this.connState$.set(conn.state)
    this.panel$.set(conn.panel)
    this.subscribeLogs()
  }

  /** The live panel connection — panel plugins talk to sessions/backends
   *  through it instead of opening their own. */
  get connection(): DevtoolsConnection | null {
    return this.conn
  }

  invoke(session: SessionSnapshot, actionId: string) {
    const requestId = nextRequestId(++this.requestCounter)

    this.requests.set(requestId, actionId)
    this.runs.set(actionId, { status: 'running' })
    this.runs$.set(new Map(this.runs))
    this.conn?.sendToApp('xplat-actions', session.sessionId, {
      type: 'invoke',
      requestId,
      actionId,
      input: {},
    })
  }

  clearLogs() {
    this.logs = []
    this.logs$.set([])
  }

  dispose() {
    this.conn?.close()
    this.conn = null
  }

  private subscribeLogs() {
    const backend = this.backends$.getSnapshot().find((ref) => ref.channel === 'xplat-logs')

    if (!backend || backend.targetId === this.logTarget$.getSnapshot() || !this.conn) {
      return
    }

    this.logTarget$.set(backend.targetId)
    this.conn.sendToBackend('xplat-logs', backend.targetId, { type: 'subscribe' })
  }
}

function isOutcome(
  data: unknown,
): data is { type: 'outcome'; outcome: ActionRun & { requestId: string } } {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { type?: unknown }).type === 'outcome' &&
    typeof (data as { outcome?: { requestId?: unknown } }).outcome?.requestId === 'string'
  )
}

function isLogFrame(data: unknown): data is { records: LogLine[] } {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as { records?: unknown }).records)
  )
}

function nextRequestId(counter: number): string {
  const crypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto

  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `req-${Date.now()}-${counter}`
}
