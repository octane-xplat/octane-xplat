import '@nativescript/macos-node-api'
import { dialog, type DesktopWindow } from '@octane-xplat/desktop'
import type { NSOpenPanel } from '@octane-xplat/platform/macos'
import { runMacOSApp, setWindowContentResolver } from '../../../macos-appkit/src/host.ts'
import type { AppKitWindowController } from '../../../macos-appkit/src/host.d.ts'
import {
  Inspector,
  beforeAppStarts,
  verifyAppLifecycle,
  verifyWindowLifecycle,
} from './lifecycle.tsrx'

const ready = beforeAppStarts()

let observed: AppKitWindowController | undefined

setWindowContentResolver((_data, controller) => {
  observed = controller
  return Inspector
})

async function verifyOpenDialog(owner: DesktopWindow) {
  const native = observed?.window
  if (!native || !dialog.supported) throw new Error('Missing AppKit dialog support')

  const pending = dialog.showOpenDialog(owner, { filters: [{ name: 'Text', extensions: ['txt'] }] })
  const sheet = native.attachedSheet as NSOpenPanel | null
  if (!sheet) {
    await pending
    throw new Error('The Open panel was not attached to the Inspector')
  }
  sheet.cancel(null)
  const result = await pending
  if (!result.canceled || result.filePaths.length || !owner.isVisible()) {
    throw new Error('Cancel did not leave the Inspector open')
  }
  console.log('DESKTOP_DIALOG_OK')
}

runMacOSApp({ title: 'Desktop window fixture' }, ({ app }) => {
  setTimeout(() => {
    void ready
      .then(() =>
        verifyWindowLifecycle(() => {
          if (!observed) {
            throw new Error('Missing AppKit window controller')
          }
          const { window } = observed

          return {
            requestClose: () => window.performClose(null),
            title: () => window.title,
            visible: () => window.isVisible(),
          }
        }, verifyOpenDialog),
      )
      .then(() => verifyAppLifecycle(() => app.terminate(null)))
      .catch((error) => {
        console.error('DESKTOP_WINDOW_FAIL', error.message, error.stack)
        Reflect.get(globalThis, '__xplatStopHost')()
      })
  }, 0)
})
