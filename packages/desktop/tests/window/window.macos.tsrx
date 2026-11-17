import '@nativescript/macos-node-api'
import { runMacOSApp, setWindowContentResolver } from '../../../macos-appkit/src/host.ts'
import type { AppKitWindowController } from '../../../macos-appkit/src/host.d.ts'
import { Inspector, verifyWindowLifecycle } from './lifecycle.tsrx'

let observed: AppKitWindowController | undefined

setWindowContentResolver((_data, controller) => {
  observed = controller
  return Inspector
})

runMacOSApp({ title: 'Desktop window fixture' }, () => {
  setTimeout(() => {
    void verifyWindowLifecycle(() => {
      if (!observed) throw new Error('Missing AppKit window controller')
      const { window } = observed

      return { requestClose: () => window.performClose(null), title: () => window.title }
    })
      .catch((error) => console.error('DESKTOP_WINDOW_FAIL', error.message, error.stack))
      .finally(() => Reflect.get(globalThis, '__xplatStopHost')())
  }, 0)
})
