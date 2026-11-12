/** @jsxImportSource @octane-xplat/jsx */
// Shared devtools panel shell — Sessions/Actions/Logs tabs driven by a
// connectDevtools session. The web build wraps this in a server picker; the
// macOS app mounts one App per discovered record (the window is the picker).
import './styles'
import { useEffect, useLazyRef, useRef, useState } from 'octane'
import { useStore } from '@octane-xplat/ui/data'
import {
  Button,
  HStack,
  Pressable,
  ScrollableArea,
  Text,
  VStack,
  type ScrollableAreaHandle,
} from '@octane-xplat/ui'

import type { DevtoolsServerRecord, SessionSnapshot } from '../client.ts'
import type { DevSocket } from '../types.ts'
import { PanelModel, type ActionRun, type LogLine } from './model'
import { resolveDevtoolsPanelPlugins, type DevtoolsPanelPlugin } from './plugin.ts'

export interface DevtoolsPanelProps {
  /** The dev-server discovery record this panel connects to. */
  record: DevtoolsServerRecord
  /** Socket factory override — macOS passes nwDevSocket (no host WebSocket). */
  socket?: (url: string) => DevSocket | undefined
  /** Panel plugins appended after the built-in tabs (desktop only — the
   *  prebuilt web bundle under /devtools/app/ passes none). */
  plugins?: readonly DevtoolsPanelPlugin[]
  /** Tab to show on mount; ignored when it names no known tab. */
  initialTab?: string
}

const TABS = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'actions', label: 'Actions' },
  { id: 'logs', label: 'Logs' },
] as const

const LOG_DISPLAY = 300

function SessionRow(props: { session: SessionSnapshot }) @{
  const session = props.session

  <HStack className="dt-row">
    <Text className="dt-name">{session.sessionId.slice(0, 8)}</Text>
    <Text className="dt-meta">{session.platform ?? ''}</Text>
    <Text className="dt-meta">{session.state ?? ''}</Text>
    <HStack className="dt-right">
      @for (const channel of session.channels ?? []; key channel.id) {
        <Text className="dt-chip">{`${channel.id}@${channel.version}`}</Text>
      }
    </HStack>
  </HStack>
}

function ActionRow(props: {
  action: NonNullable<SessionSnapshot['actions']>[number]
  run: ActionRun | undefined
  onRun: () => void
}) @{
  const action = props.action
  const run = props.run

  <>
    <HStack className="dt-row">
      <Text className="dt-name">{action.id}</Text>
      {action.title ? <Text className="dt-meta">{action.title}</Text> : null}
      <HStack className="dt-right">
        @if (action.availability?.ready === false) {
          <Text className="dt-meta">unavailable</Text>
        } @else {
          <Button
            className="dt-run"
            label={run?.status === 'running' ? '…' : 'Run'}
            isDisabled={run?.status === 'running'}
            onPress={props.onRun}
          />
        }
      </HStack>
    </HStack>
    @if (run && run.status !== 'running') {
      <VStack className={['dt-outcome', `dt-outcome-${run.status}`]}>
        <Text className="dt-outcome-status">{run.status}</Text>
        {run.error ? (
          <Text className="dt-pre">{JSON.stringify(run.error, null, 2)}</Text>
        ) : null}
        {run.result !== undefined ? (
          <Text className="dt-pre">{JSON.stringify(run.result, null, 2)}</Text>
        ) : null}
      </VStack>
    }
  </>
}

function LogRow(props: { record: LogLine }) @{
  const record = props.record

  <HStack className={['dt-log-line', `dt-log-${record.level}`]}>
    <Text className="dt-level">{record.level}</Text>
    <Text className="dt-text">{record.line}</Text>
    <Text className="dt-at">{(record.at ?? '').slice(11, 19)}</Text>
  </HStack>
}

export function App(props: DevtoolsPanelProps) @{
  const model = useLazyRef(() => new PanelModel())
  const plugins = useLazyRef(() => resolveDevtoolsPanelPlugins(props.plugins ?? []))
  const tabs = [
    ...TABS,
    ...plugins.current.map((plugin) => ({ id: plugin.id, label: plugin.title })),
  ]

  const [tab, setTab] = useState<string>(
    tabs.some((item) => item.id === props.initialTab) ? props.initialTab! : 'sessions',
  )

  const scrollRef = useRef<ScrollableAreaHandle | null>(null)

  useEffect(() => {
    model.current.connect(props.record, props.socket)
    return () => model.current.dispose()
  }, [props.record.instanceId, props.socket])

  const connState = useStore(model.current.connState$)
  const panel = useStore(model.current.panel$)
  const sessions = useStore(model.current.sessions$)
  const backends = useStore(model.current.backends$)
  const logs = useStore(model.current.logs$)
  const runs = useStore(model.current.runs$)
  const logTarget = useStore(model.current.logTarget$)

  // Newest log line stays pinned to the viewport end — the scrollIntoView
  // behavior of the retired DOM panel.
  useEffect(() => {
    if (tab === 'logs' && logs.length) {
      scrollRef.current?.scrollToOffset({ block: Number.MAX_SAFE_INTEGER })
    }
  }, [logs.length, tab])

  const badge = connState === 'live' ? `live — ${panel ?? ''}` : connState
  const withActions = sessions.filter((session) => session.actions?.length)
  const pluginTab = plugins.current.find((plugin) => plugin.id === tab)
  const connection = model.current.connection

  <VStack className="dt-root">
    <HStack className="dt-nav">
      <HStack className="dt-tabs">
        @for (const item of tabs; key item.id) {
          <Pressable
            className={['dt-tab', tab === item.id && 'dt-tab-active']}
            onPress={() => setTab(item.id)}
          >
            <Text className="dt-tab-label">{item.label}</Text>
          </Pressable>
        }
      </HStack>
      <Text className={['dt-badge', `dt-badge-${connState}`]}>{badge}</Text>
    </HStack>
    @if (pluginTab) {
      // Plugin tabs own their own scrolling — no dt-main ScrollableArea.
      <VStack className="dt-plugin-host">
        @if (connection) {
          <pluginTab.Panel connection={connection} state={connState} />
        }
      </VStack>
    } @else {
      <ScrollableArea className="dt-main" ref={scrollRef}>
        <VStack className="dt-content">
          @if (tab === 'sessions') {
            <>
              <Text
                className={['dt-heading', 'dt-heading-first']}
              >{`Sessions (${sessions.length})`}</Text>
              @if (!sessions.length) {
                <Text className="dt-empty">No app sessions connected.</Text>
              }
              @for (const session of sessions; key session.sessionId) {
                <SessionRow session={session} />
              }
              <Text className="dt-heading">{`Backends (${backends.length})`}</Text>
              @if (!backends.length) {
                <Text className="dt-empty">No engine backends connected.</Text>
              }
              @for (const backend of backends; key `${backend.channel}:${backend.targetId}`) {
                <HStack className="dt-row">
                  <Text className="dt-name">{backend.channel}</Text>
                  <Text className="dt-meta">{backend.targetId}</Text>
                </HStack>
              }
            </>
          } @else if (tab === 'actions') {
            <>
              @if (!withActions.length) {
                <Text className="dt-empty">
                  No session declares dev actions.
                </Text>
              }
              @for (const session of withActions; key session.sessionId) {
                <>
                  <Text className={['dt-heading', 'dt-heading-first']}>
                    {`${session.sessionId.slice(0, 8)} — ${session.platform ?? 'app'}`}
                  </Text>
                  @for (const action of session.actions ?? []; key action.id) {
                    <ActionRow
                      action={action}
                      run={runs.get(action.id)}
                      onRun={() => model.current.invoke(session, action.id)}
                    />
                  }
                </>
              }
            </>
          } @else {
            <>
              <HStack className="dt-toolbar">
                <Text className="dt-meta">
                  {logTarget ? `target ${logTarget}` : 'no xplat-logs backend'}
                </Text>
                <HStack className="dt-right">
                  <Button label="Clear" onPress={() => model.current.clearLogs()} />
                </HStack>
              </HStack>
              @if (!logs.length) {
                <Text className="dt-empty">No log records yet.</Text>
              }
              @for (const record of logs.slice(-LOG_DISPLAY); index i; key i) {
                <LogRow record={record} />
              }
            </>
          }
        </VStack>
      </ScrollableArea>
    }
  </VStack>
}
