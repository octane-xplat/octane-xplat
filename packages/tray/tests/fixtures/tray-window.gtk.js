// GTK window/residency phase — runs under xvfb-run + dbus-run-session on the
// VM. Verifies hide/show/toggle and keepAppResident on a real Gtk.Application.
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import System from 'system'

import {
  areAppWindowsVisible,
  hideAppWindows,
  keepAppResident,
  showAppWindows,
  toggleAppWindows,
} from '../../src/index.gtk.ts'

let assertions = 0
const check = (value, name) => {
  assertions += 1
  if (!value) {
    throw new Error('ASSERT ' + name)
  }
}

const app = new Gtk.Application({
  application_id: 'xplat.tray.windowtest',
  flags: 0,
})

app.connect('activate', () => {
  const window = new Gtk.ApplicationWindow({
    application: app,
    title: 'TrayWindowTest',
    default_width: 120,
    default_height: 80,
  })
  window.present()

  GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
    try {
      check(areAppWindowsVisible() === true, 'window visible after present')
      hideAppWindows()
      check(areAppWindowsVisible() === false, 'hidden')
      check(showAppWindows() === true, 'show returns true')
      check(areAppWindowsVisible() === true, 'visible again')
      check(toggleAppWindows() === false, 'toggle hides')
      check(toggleAppWindows() === true, 'toggle shows')

      const residency = keepAppResident({ hideWindowsOnClose: true })
      check(window.get_hide_on_close() === true, 'hide_on_close set')
      window.close()
      // With the hold taken, the app must still be running; prove it by
      // scheduling this second phase — if it had quit, it never runs.
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
        try {
          check(areAppWindowsVisible() === false, 'window closed, app still alive')
          residency.release()
          residency.release() // idempotent
          check(window.get_hide_on_close() === false, 'hide_on_close restored')
          print('TRAY_GTK_WIN_OK ' + assertions)
          app.quit()
        } catch (error) {
          print('TRAY_GTK_WIN_FAIL ' + (error && error.message ? error.message : error))
          app.quit()
          System.exit(1)
        }
        return GLib.SOURCE_REMOVE
      })
    } catch (error) {
      print('TRAY_GTK_WIN_FAIL ' + (error && error.message ? error.message : error))
      app.quit()
      System.exit(1)
    }
    return GLib.SOURCE_REMOVE
  })
})

System.exit(app.run([]))
