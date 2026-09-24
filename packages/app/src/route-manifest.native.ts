import { Device } from '@nativescript/core'
import { deriveRouteManifest } from '@octane-xplat/ui'

/** Native twin of route-manifest.web — drops *.web.* route files.
 *  .ios/.android variants both land in the glob (one module serves both
 *  OS builds), so prefer the running OS's files, then .native, then the
 *  unsuffixed fallback. Wrong-OS modules still evaluate — keep
 *  os-suffixed route files side-effect free. */
const files = import.meta.glob(['./app/**/*.{tsrx,tsx}', '!./app/**/*.web.{tsrx,tsx}'], {
	eager: true,
})

export const routes = deriveRouteManifest(
	files,
	Device.os === 'Android' ? ['android', 'native'] : ['ios', 'native'],
)
