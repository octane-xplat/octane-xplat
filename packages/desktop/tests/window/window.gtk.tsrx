// The GTK preset resolves renderer imports to dist. Load the host from the same build.
import { runGtkApp, setWindowContentResolver } from '../../../linux-gtk-renderer/dist/host.js'
import type { GtkWindowServiceController } from '../../../linux-gtk-renderer/src/window-service.ts'
import { Inspector, verifyWindowLifecycle } from './lifecycle.tsrx'

let observed: GtkWindowServiceController | undefined

setWindowContentResolver((_data, controller: GtkWindowServiceController) => {
  observed = controller
  return Inspector
})

runGtkApp({ applicationId: 'org.octane.xplat.WindowFixture', title: 'Desktop window fixture' }, ({ app }) => {
  setTimeout(() => {
    void verifyWindowLifecycle(() => {
      if (!observed) throw new Error('Missing GTK window controller')
      const { window } = observed

      return { requestClose: () => window.close(), title: () => window.get_title() }
    })
      .catch((error) => console.error('DESKTOP_WINDOW_FAIL', error.message, error.stack))
      .finally(() => app.quit())
  }, 0)
})
