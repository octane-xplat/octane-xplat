import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import { createDesktopShell, type DesktopShell } from './service.js'

interface TrashFile extends Gio.File {
  trash_async(
    priority: number,
    cancellable: null,
    callback: (source: unknown, result: unknown) => void,
  ): void
  trash_finish(result: unknown): boolean
}

interface FileManagerBus {
  call(
    bus: string,
    path: string,
    iface: string,
    method: string,
    args: object,
    replyType: null,
    flags: number,
    timeout: number,
    cancellable: null,
    callback: (source: unknown, result: unknown) => void,
  ): void
  call_finish(result: unknown): unknown
}

// Bound the additional GJS introspection members used by FileManager1.
const gio = Gio as typeof Gio & {
  DBus: { readonly session: FileManagerBus }
  DBusCallFlags: { NONE: number }
}
const Variant = GLib.Variant as typeof GLib.Variant & {
  new (signature: string, value: unknown): object
}

export type { DesktopShell } from './service.js'
export const shell: DesktopShell = createDesktopShell({
  getLauncher: () => {
    if (typeof Gio.AppInfo?.launch_default_for_uri_async !== 'function') {
      return
    }
    return (url) =>
      new Promise<boolean>((resolve, reject) => {
        Gio.AppInfo.launch_default_for_uri_async(url, null, null, (_source, result) => {
          try {
            resolve(Gio.AppInfo.launch_default_for_uri_finish(result))
          } catch (error) {
            reject(error)
          }
        })
      })
  },
  getRevealer: () => {
    let bus: FileManagerBus
    try {
      bus = gio.DBus.session
    } catch {
      return
    }
    if (typeof bus?.call !== 'function') {
      return
    }
    return (path) =>
      new Promise<boolean>((resolve, reject) => {
        const name = 'org.freedesktop.FileManager1'
        const args = new Variant('(ass)', [[Gio.File.new_for_path(path).get_uri()], ''])
        bus.call(
          name,
          '/org/freedesktop/FileManager1',
          name,
          'ShowItems',
          args,
          null,
          gio.DBusCallFlags.NONE,
          5000,
          null,
          (_source, result) => {
            try {
              bus.call_finish(result)
              resolve(true)
            } catch (error) {
              reject(error)
            }
          },
        )
      })
  },
  getTrasher: () => {
    const prototype = Gio.File?.prototype as Partial<TrashFile> | undefined
    if (typeof prototype?.trash_async !== 'function') {
      return
    }
    return (path) =>
      new Promise<boolean>((resolve, reject) => {
        // GJS projects GFile interface methods on the returned instance.
        const file = Gio.File.new_for_path(path) as TrashFile
        file.trash_async(GLib.PRIORITY_DEFAULT, null, (_source, result) => {
          try {
            resolve(file.trash_finish(result))
          } catch (error) {
            reject(error)
          }
        })
      })
  },
})
