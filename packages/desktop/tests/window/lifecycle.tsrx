// @jsxImportSource @octane-xplat/jsx
import {
  app,
  windows,
  type DesktopBeforeQuitEvent,
  type DesktopWindowCloseEvent,
} from '@octane-xplat/desktop'
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

export function beforeAppStarts(): Promise<void> {
  check(app.supported && !app.isReady(), 'host lifecycle installed before startup')
  return app.whenReady()
}

export async function verifyAppLifecycle(requestNativeQuit: () => void) {
  check(app.isReady(), 'ready after host startup')
  const first = windows.open({ title: 'First editor' })
  const second = windows.open({ title: 'Second editor' })
  let closeRequests = 0
  first.on('close', () => {
    closeRequests++
  })

  const cancelQuit = (event: DesktopBeforeQuitEvent) => {
    app.quit() // Reentrant requests must not dispatch a second event.
    event.preventDefault()
  }

  app.on('before-quit', cancelQuit)
  requestNativeQuit()
  check(!first.isClosed && !second.isClosed && closeRequests === 0, 'before-quit runs before window guards')
  app.off('before-quit', cancelQuit)

  const cancelClose = (event: DesktopWindowCloseEvent) => event.preventDefault()
  second.on('close', cancelClose)
  app.quit()
  check(!first.isClosed && !second.isClosed && Number(closeRequests) === 1, 'window veto keeps both editors open')
  second.off('close', cancelClose)

  let closed = 0
  for (const window of [first, second]) {
    window.on('closed', () => closed++)
  }

  app.quit()

  let refusedNewWindow = false
  try {
    windows.open({ title: 'Too late to open' })
  } catch {
    refusedNewWindow = true
  }
  check(refusedNewWindow, 'approved quit refuses new windows')

  await Promise.all([first.closed, second.closed])
  check(first.isClosed && second.isClosed && closed === 2, 'approved quit closed both editors')
  check(Number(closeRequests) === 2 && Number(contentUnmounts) === 4, 'quit unmounts without dispatching close twice')
  console.log('DESKTOP_APP_QUIT_OK')
}
