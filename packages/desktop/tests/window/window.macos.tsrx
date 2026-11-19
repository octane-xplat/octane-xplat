import '@nativescript/macos-node-api'
import { app as desktopApp, dialog, type DesktopActivateEvent, type DesktopWindow } from '@octane-xplat/desktop'
import { NSAlertFirstButtonReturn, type NSApplication, type NSOpenPanel, type NSSavePanel } from '@octane-xplat/platform/macos'
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

  const save = dialog.showSaveDialog(owner, { suggestedName: 'notes.txt' })
  const savePanel = native.attachedSheet as NSSavePanel | null
  if (!savePanel || savePanel.nameFieldStringValue !== 'notes.txt') {
    throw new Error('The Save panel was not attached with the suggested filename')
  }
  savePanel.cancel(null)
  const canceledSave = await save
  if (!canceledSave.canceled || canceledSave.filePath !== undefined || !owner.isVisible()) {
    throw new Error('Canceling Save did not leave the owner open')
  }
  console.log('DESKTOP_SAVE_OK')

  const confirmationBox = dialog.showMessageBox(owner, {
    message: 'Discard changes?',
    buttons: ['Keep Editing', 'Discard'],
    cancelId: 0,
  })
  const messageSheet = native.attachedSheet
  if (!messageSheet) throw new Error('The AppKit message box was not attached')
  native.endSheetReturnCode(messageSheet, NSAlertFirstButtonReturn + 1)
  if ((await confirmationBox).response !== 1) throw new Error('Wrong message box response')
  console.log('DESKTOP_MESSAGE_OK')

  async function expectMinimized(expected: boolean) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (native?.isMiniaturized() === expected) return
      await new Promise<void>((resolve) => setTimeout(resolve, 20))
    }
    throw new Error(`Expected AppKit minimized state to be ${expected}`)
  }

  owner.minimize()
  await expectMinimized(true)
  owner.restore()
  await expectMinimized(false)
  console.log('DESKTOP_MINIMIZE_OK')
}

function verifyReopen(nativeApp: NSApplication) {
  const delegate = nativeApp.delegate
  if (!desktopApp.supportsActivate ||
    !delegate?.respondsToSelector('applicationShouldHandleReopen:hasVisibleWindows:') ||
    !delegate.applicationShouldHandleReopenHasVisibleWindows) {
    throw new Error('The AppKit host does not expose the reopen selector')
  }
  const requests: boolean[] = []
  const listen = (event: DesktopActivateEvent, hasVisibleWindows: boolean) => {
    requests.push(hasVisibleWindows)
    if (!hasVisibleWindows) event.preventDefault()
  }
  desktopApp.on('activate', listen)
  const vetoed = delegate.applicationShouldHandleReopenHasVisibleWindows(nativeApp, false)
  const allowed = delegate.applicationShouldHandleReopenHasVisibleWindows(nativeApp, true)
  desktopApp.off('activate', listen)
  const detached = delegate.applicationShouldHandleReopenHasVisibleWindows(nativeApp, false)
  if (vetoed || !allowed || !detached || requests.join(',') !== 'false,true') {
    throw new Error('The activate listener did not receive and handle the native reopen requests')
  }
  console.log('DESKTOP_ACTIVATE_OK')
}

runMacOSApp({ title: 'Desktop window fixture' }, ({ app }) => {
  setTimeout(() => {
    void ready
      .then(() => verifyReopen(app))
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
