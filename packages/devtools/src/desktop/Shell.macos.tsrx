/** @jsxImportSource @octane-xplat/jsx */
// Desktop shell — owns discovery-record polling and the single window's
// waiting/picking/targeted states. `xplat devtools` passes the app it was
// launched from as preferredRoot; the apps/devtools harness passes null.
import '../panel/styles.ts'
import { useEffect, useRef, useState } from 'octane'
import { Button, Center, HStack, Pressable, ScrollableArea, Text, VStack } from '@octane-xplat/ui'
import { listDevtoolsServers, nwDevSocket } from '../macos/index.macos.ts'
import type { ListedDevtoolsServer } from '../macos/index.macos.ts'
import { App } from '../panel/index.ts'
import { autoTarget } from './target.ts'
import panelPlugins from 'virtual:octane-devtools-panels'

const POLL_MS = 2000

export interface DevtoolsShellProps {
  /** The selected project root `xplat devtools` ran from; null in the harness. */
  preferredRoot: string | null
  /** Tab to show on mount (DEVTOOLS_SELFTEST_TAB). */
  initialTab?: string
  /** Toggle the main window's level (keep-on-top); absent → no toggle shown. */
  onKeepOnTop?: (onTop: boolean) => void
  /** Main-window title updates: `devtools` until a server is targeted. */
  onTitle?: (title: string) => void
  /** Dev-only selftest hook — receives the row-pick function on mount. */
  selftest?: { pick?: (index: number) => void }
}

function basename(path: string): string {
  const parts = path.split('/').filter(Boolean)

  return parts[parts.length - 1] ?? path
}

export function Shell(props: DevtoolsShellProps) @{
  const [records, setRecords] = useState<ListedDevtoolsServer[]>([])
  const [target, setTarget] = useState<ListedDevtoolsServer | null>(null)
  // Mirrors of rendered state for the poll/selftest closures.
  const recordsRef = useRef<ListedDevtoolsServer[]>([])
  const targetRef = useRef<ListedDevtoolsServer | null>(null)
  // Auto-targeting applies only until the first target is chosen — auto or
  // by click — or Switch is pressed; after that the user owns selection.
  const autoPick = useRef(true)
  const [onTop, setOnTop] = useState(false)

  const choose = (record: ListedDevtoolsServer | null) => {
    autoPick.current = false
    targetRef.current = record
    setTarget(record)
  }

  useEffect(() => {
    const scan = () => {
      let next: ListedDevtoolsServer[]

      try {
        next = listDevtoolsServers()
      } catch (error) {
        console.error('[devtools] record scan failed', error)
        return
      }

      recordsRef.current = next
      setRecords(next)

      const current = targetRef.current

      if (current) {
        // Same key with a new instanceId is a server restart — reconnect the
        // panel in place; a vanished record keeps App mounted on its
        // disconnected state rather than bouncing to the picker.
        const again = next.find((record) => record.key === current.key)

        if (again && again.instanceId !== current.instanceId) {
          targetRef.current = again
          setTarget(again)
        }

        return
      }

      if (autoPick.current) {
        const chosen = autoTarget(next, props.preferredRoot)

        if (chosen) {
          autoPick.current = false
          targetRef.current = chosen
          setTarget(chosen)
        }
      }
    }

    scan()

    const timer = setInterval(scan, POLL_MS)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    props.onTitle?.(target ? `devtools — ${basename(target.appRoot)}` : 'devtools')
  }, [target])

  useEffect(() => {
    if (props.selftest) {
      props.selftest.pick = (index: number) => {
        const record = recordsRef.current[index]

        if (record) {
          choose(record)
        }
      }
    }
  }, [])

  <VStack className="dt-root">
    @if (target !== null) {
      const focused = target

      <>
        <HStack className="dt-target-bar">
          <Text className="dt-target-name">{basename(focused.appRoot)}</Text>
          <HStack className="dt-right">
            @if (props.onKeepOnTop) {
              <Button
                label={onTop ? 'Unpin' : 'Keep on top'}
                onPress={() => {
                  const next = !onTop

                  setOnTop(next)
                  props.onKeepOnTop?.(next)
                }}
              />
            }
            <Button label="Switch…" onPress={() => choose(null)} />
          </HStack>
        </HStack>
        <VStack className="dt-targeted">
          <App
            key={`${focused.key}:${focused.instanceId}`}
            record={focused}
            socket={nwDevSocket}
            plugins={panelPlugins}
            initialTab={props.initialTab}
          />
        </VStack>
      </>
    } @else if (records.length === 0) {
      <Center style={{ flex: 1 }}>
        <Text className="dt-empty">No xplat dev servers running</Text>
      </Center>
    } @else {
      <ScrollableArea className="dt-main">
        <VStack className="dt-content">
          <Text className={['dt-heading', 'dt-heading-first']}>Select a dev server</Text>
          @for (const record of records; key `${record.key}:${record.instanceId}`) {
            <Pressable className="dt-pick-row" onPress={() => choose(record)}>
              <VStack>
                <Text className="dt-pick-name">{basename(record.appRoot)}</Text>
                <Text className="dt-pick-path">{record.appRoot}</Text>
              </VStack>
            </Pressable>
          }
        </VStack>
      </ScrollableArea>
    }
  </VStack>
}
