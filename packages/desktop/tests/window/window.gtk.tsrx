// The GTK preset resolves renderer imports to dist. Load the host from the same build.
import { app as desktopApp, appMenu, dialog, screen, type DesktopActivateEvent, type DesktopWindow } from '@octane-xplat/desktop'
import Gtk from 'gi://Gtk?version=4.0'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import { runGtkApp, setWindowContentResolver } from '../../../linux-gtk-renderer/dist/host.js'
import type { GtkWindowServiceController } from '../../../linux-gtk-renderer/src/window-service.ts'
import {
  Inspector,
  beforeAppStarts,
  verifyAppLifecycle,
  verifyWindowLifecycle,
} from './lifecycle.tsrx'

const ready = beforeAppStarts()

let observed: GtkWindowServiceController | undefined

setWindowContentResolver((_data, controller: GtkWindowServiceController) => {
  observed = controller
  return Inspector
})

async function verifyOpenDialog(owner: DesktopWindow) {
  const native = observed?.window
  if (!native || !dialog.supported) throw new Error('Missing GTK dialog support')

  // The Xvfb fixture has no desktop portal, so the native chooser uses its GTK dialog.
  function modalPicker() {
    const windows = Gtk.Window.get_toplevels()
    for (let index = 0; index < windows.get_n_items(); index++) {
      const picker = windows.get_item(index)
      if (picker?.get_transient_for() === native && picker.get_visible() && picker.get_modal() &&
        'response' in picker && typeof picker.response === 'function' &&
        'set_file' in picker && typeof picker.set_file === 'function' &&
        'get_file' in picker && typeof picker.get_file === 'function') {
        return picker
      }
    }
    throw new Error('The GTK Open dialog was not modal to the Inspector')
  }

  const pending = dialog.showOpenDialog(owner, { filters: [{ name: 'Text', extensions: ['txt'] }] })
  modalPicker().response(Gtk.ResponseType.CANCEL)
  const canceled = await pending
  if (!canceled.canceled || canceled.filePaths.length || !owner.isVisible()) {
    throw new Error('Cancel did not leave the GTK Inspector open')
  }

  function waitForGtk(milliseconds: number) {
    return new Promise<void>((resolve) => {
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, milliseconds, () => {
        resolve()
        return GLib.SOURCE_REMOVE
      })
    })
  }

  await waitForGtk(50)

  const path = '/etc/hosts'
  const selected = dialog.showOpenDialog(owner)
  const picker = modalPicker()
  picker.set_file(Gio.File.new_for_path(path))
  // The chooser sets the selection asynchronously when its folder model loads.
  let selectedPath: string | null = null
  for (let attempt = 0; attempt < 8 && selectedPath !== path; attempt++) {
    await waitForGtk(500)
    const file: unknown = picker.get_file()
    if (file instanceof Gio.File) {
      selectedPath = file.get_path()
    }
  }
  if (selectedPath !== path) {
    picker.response(Gtk.ResponseType.CANCEL)
    await selected
    throw new Error('The GTK picker did not select the requested file')
  }
  picker.response(Gtk.ResponseType.ACCEPT)
  const result = await Promise.race([
    selected,
    waitForGtk(4000).then(() => { throw new Error('The GTK picker did not dispatch acceptance') }),
  ])
  if (result.canceled || result.filePaths.length !== 1 || result.filePaths[0] !== path) {
    throw new Error('The GTK picker did not return the selected path')
  }
  console.log('DESKTOP_DIALOG_OK')

  const save = dialog.showSaveDialog(owner, { suggestedName: 'notes.txt' })
  const savePicker = modalPicker()
  if (!('get_current_name' in savePicker) || typeof savePicker.get_current_name !== 'function' ||
    savePicker.get_current_name() !== 'notes.txt') {
    throw new Error('The GTK Save picker did not receive the suggested filename')
  }
  savePicker.response(Gtk.ResponseType.CANCEL)
  const canceledSave = await save
  if (!canceledSave.canceled || canceledSave.filePath !== undefined || !owner.isVisible()) {
    throw new Error('Canceling Save did not leave the owner open')
  }
  await waitForGtk(50)
  const saveName = `xplat-save-fixture-${Date.now()}.txt`
  const saveSelection = dialog.showSaveDialog(owner, { suggestedName: saveName })
  const confirmation = modalPicker()
  await waitForGtk(500)
  confirmation.response(Gtk.ResponseType.ACCEPT)
  const saved = await Promise.race([
    saveSelection,
    waitForGtk(4000).then(() => { throw new Error('The GTK Save picker did not dispatch acceptance') }),
  ])
  if (saved.canceled || !saved.filePath.endsWith('/' + saveName) ||
    Gio.File.new_for_path(saved.filePath).query_exists(null)) {
    throw new Error('The GTK Save picker did not return a new path without creating a file')
  }
  console.log('DESKTOP_SAVE_OK')

  const confirmationBox = dialog.showMessageBox(owner, {
    message: 'Discard changes?',
    buttons: ['Keep Editing', 'Discard'],
    cancelId: 0,
  })
  const windows = Gtk.Window.get_toplevels()
  let answered = false
  for (let index = 0; index < windows.get_n_items(); index++) {
    const window = windows.get_item(index)
    if (window?.get_transient_for() === native && window instanceof Gtk.MessageDialog) {
      window.response(1)
      answered = true
      break
    }
  }
  if (!answered) throw new Error('The GTK message box was not modal to its owner')
  if ((await confirmationBox).response !== 1) throw new Error('Wrong message box response')
  console.log('DESKTOP_MESSAGE_OK')

  // Xvfb has no window manager. Exercise both GTK calls without assuming they change state.
  owner.minimize()
  owner.restore()
  if (owner.isClosed) throw new Error('Minimize or restore closed the GTK Inspector')
  console.log('DESKTOP_MINIMIZE_OK')
}

function verifyActivation(app: Gtk.Application, primary: Gtk.Window) {
  if (!desktopApp.supportsActivate) throw new Error('Missing GTK activation support')

  const requests: boolean[] = []
  const listen = (event: DesktopActivateEvent, hasVisibleWindows: boolean) => {
    requests.push(hasVisibleWindows)
    if (!hasVisibleWindows) event.preventDefault()
  }
  desktopApp.on('activate', listen)
  app.activate()
  primary.set_visible(false)
  app.activate()
  if (primary.get_visible()) throw new Error('GTK activation ignored the reopen veto')
  desktopApp.off('activate', listen)
  app.activate()
  if (!primary.get_visible() || requests.join(',') !== 'true,false') {
    throw new Error('GTK activation did not deliver the visible-window state and default handling')
  }
  console.log('DESKTOP_ACTIVATE_OK')
}

function verifyScreen() {
  const displays = screen.getAllDisplays()
  const first = displays[0]
  if (!screen.supported || screen.coordinateSpace !== 'logical' || !first ||
    first.bounds.width <= 0 || first.bounds.height <= 0 || first.scaleFactor <= 0 ||
    screen.getDisplayMatching(first.bounds)?.id !== first.id ||
    new Set(displays.map((display) => display.id)).size !== displays.length) {
    throw new Error('The native display snapshot is invalid')
  }
  console.log('DESKTOP_SCREEN_OK')
}

runGtkApp({ applicationId: 'org.octane.xplat.WindowFixture', title: 'Desktop window fixture' }, ({ app, window }) => {
  setTimeout(() => {
    void ready
      .then(verifyScreen)
      .then(() => verifyActivation(app, window))
      .then(() =>
        verifyWindowLifecycle(() => {
          if (!observed) {
            throw new Error('Missing GTK window controller')
          }
          const { window } = observed

          return {
            requestClose: () => window.close(),
            title: () => window.get_title(),
            visible: () => window.get_visible(),
          }
        }, verifyOpenDialog),
      )
      .then(async () => {
        const previous = new Set<string>(app.list_actions())
        const menu = appMenu.install([
          {
            type: 'submenu',
            key: 'file',
            label: 'File',
            items: [{ type: 'role', key: 'quit', role: 'quit' }],
          },
        ])

        try {
          const name = app.list_actions().find((item: string) => !previous.has(item))
          if (!name) throw new Error('Missing GTK Quit action')
          await verifyAppLifecycle(() => app.lookup_action(name).activate(null))
        } finally {
          menu.dispose()
        }
      })
      .catch((error) => {
        console.error('DESKTOP_WINDOW_FAIL', error.message, error.stack)
        app.quit()
      })
  }, 0)
})
