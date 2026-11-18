import '@nativescript/macos-node-api'
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
        }),
      )
      .then(() => verifyAppLifecycle(() => app.terminate(null)))
      .catch((error) => {
        console.error('DESKTOP_WINDOW_FAIL', error.message, error.stack)
        Reflect.get(globalThis, '__xplatStopHost')()
      })
  }, 0)
})
