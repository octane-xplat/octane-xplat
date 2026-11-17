// @jsxImportSource @octane-xplat/jsx
import { windows } from '@octane-xplat/desktop'
import { useLayoutEffect } from 'octane'

let contentMounts = 0
let contentUnmounts = 0

export function Inspector() {
  useLayoutEffect(() => {
    contentMounts++
    return () => {
      contentUnmounts++
    }
  }, [])

  return null
}

function check(condition: unknown, label: string): asserts condition {
  if (!condition) {
    throw new Error(label)
  }
}

export async function verifyWindowLifecycle(readWindow: () => {
  requestClose(): void
  title(): string
}) {
  check(windows.supported, 'secondary windows are supported')
  const inspector = windows.open({ title: 'Inspector', data: { screen: 'inspector' } })
  const native = readWindow()

  check(contentMounts === 1, 'secondary root mounted')
  check(!inspector.isClosed, 'new window is open')

  inspector.setTitle('Updated inspector')
  check(native.title() === 'Updated inspector', 'title reached the native window')

  let requests = 0
  const veto = (event: { preventDefault(): void }) => {
    requests++
    event.preventDefault()
  }
  let closedEvents = 0

  inspector.on('close', veto).on('closed', () => {
    check(inspector.isClosed && contentUnmounts === 1, 'closed follows root disposal')
    closedEvents++
  })

  inspector.close()
  check(!inspector.isClosed && requests === 1, 'programmatic close honors veto')
  native.requestClose()
  check(!inspector.isClosed && Number(requests) === 2, 'native close honors veto')
  check(contentUnmounts === 0, 'veto leaves root mounted')

  inspector.off('close', veto).close()
  await inspector.closed
  check(inspector.isClosed && Number(contentUnmounts) === 1, 'accepted close unmounts once')
  check(closedEvents === 1, 'accepted close publishes closed')

  const forced = windows.open({ title: 'Force close' })
  forced.on('close', veto)
  forced.destroy()
  await forced.closed
  check(forced.isClosed && Number(contentUnmounts) === 2, 'destroy unmounts a second window')
  check(Number(requests) === 2, 'destroy skips close listeners')

  console.log('DESKTOP_WINDOW_OK')
}
