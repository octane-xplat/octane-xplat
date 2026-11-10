// Minimal openWindow crash repro: mount the smoke App, then open a second
// window from a timeout. Under Xvfb this reliably dies with a BadDrawable
// X error ~1s after the second window presents — isolating the defect from
// the desktop-shell journey's tray/AT-SPI path.
import { runGtkApp, setWindowContentResolver } from '@octane-xplat/linux-gtk/host'
import { openWindow } from '@octane-xplat/ui'
import GLib from 'gi://GLib'
import { App } from './App.gtk'
import { Second } from './SecondWin.gtk'

export function main(): number {
  setWindowContentResolver(() => Second)
  return runGtkApp(
    {
      applicationId: 'dev.xplat.linux-gtk-twowin',
      title: 'Two Window Probe',
      defaultWidth: 320,
      defaultHeight: 200,
    },
    ({ root }) => {
      root.render(App, {})
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
        print('PROBE opening second window')

        const handle = openWindow({ title: 'Second', size: { width: 200, height: 120 } })

        print(`PROBE openWindow -> ${handle ? 'controller' : 'null'}`)
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
          print('PROBE ALIVE 3s after openWindow')
          return false
        })

        return false
      })
    },
  )
}

main()
