import Gio from 'gi://Gio'
import { createDesktopShell, type DesktopShell } from './service.js'

export type { DesktopShell } from './service.js'
export const shell: DesktopShell = createDesktopShell(() => {
  if (typeof Gio.AppInfo?.launch_default_for_uri_async !== 'function') {
    return
  }
  return (url) => new Promise<boolean>((resolve, reject) => {
    Gio.AppInfo.launch_default_for_uri_async(url, null, null, (_source, result) => {
      try {
        resolve(Gio.AppInfo.launch_default_for_uri_finish(result))
      } catch (error) {
        reject(error)
      }
    })
  })
})
