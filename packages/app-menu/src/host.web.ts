import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { AppMenuHost } from './host-types.js'

// Browsers and webview runtimes expose no application menu bar.
export const host: AppMenuHost = {
  platform: null,
  supported() {
    return false
  },
  defer(fn) {
    setTimeout(fn, 0)
  },
  install() {
    throw new UnavailabilityError('appMenu')
  },
}
