// The GTK preset resolves renderer imports to dist. Load the host from the same build.
import { appMenu } from '@octane-xplat/desktop'
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

runGtkApp({ applicationId: 'org.octane.xplat.WindowFixture', title: 'Desktop window fixture' }, ({ app }) => {
  setTimeout(() => {
    void ready
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
        }),
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
