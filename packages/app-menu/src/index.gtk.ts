import { createAppMenuService } from './controller.js'
import { host } from './host.gtk.js'
import type { AppMenuService } from './shared.js'
export * from './shared.js'

/** The application menu service — install at most one menu bar per process.
 *  Import-safe: no native work happens until `install`.
 * @example
 * ```ts
 * import { appMenu } from '@octane-xplat/app-menu'
 * if (appMenu.supported) {
 *   const handle = appMenu.install([
 *     { type: 'submenu', key: 'file', label: 'File', items: [] },
 *   ])
 * }
 * ``` */
export const appMenu: AppMenuService = createAppMenuService(host)
