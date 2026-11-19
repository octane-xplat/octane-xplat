import Gtk from 'gi://Gtk?version=4.0'
import { getWindowOwner } from '../window/index.gtk.js'
import { createDesktopDialog } from './service.js'
import type { DesktopDialog } from './types.js'

export type * from './types.js'

export const dialog: DesktopDialog = createDesktopDialog({
  supported: () => typeof Gtk.FileChooserNative?.new === 'function',
  ownerOf: getWindowOwner,
  open(owner, options, onOwnerClose) {
    const chooser = Gtk.FileChooserNative.new('Open', owner, Gtk.FileChooserAction.OPEN, null, null)
    return new Promise<string[] | null>((resolve, reject) => {
      let connection: number | undefined
      let disposed = false
      function dispose() {
        if (disposed) {
          return
        }
        disposed = true
        if (connection !== undefined) {
          chooser.disconnect(connection)
        }
        chooser.destroy()
      }

      function complete(response: number) {
        if (disposed) {
          return
        }
        try {
          let paths: string[] | null = null
          try {
            if (response === Gtk.ResponseType.ACCEPT) {
              const files = chooser.get_files()
              paths = Array.from({ length: files.get_n_items() }, (_, index) => files.get_item(index)?.get_path() ?? '')
            } else if (response !== Gtk.ResponseType.CANCEL && response !== Gtk.ResponseType.DELETE_EVENT) {
              throw new Error(`Unknown GTK Open dialog result: ${response}`)
            }
          } finally {
            dispose()
          }
          resolve(paths)
        } catch (error) {
          reject(error)
        }
      }

      try {
        chooser.set_modal(true)
        chooser.set_select_multiple(options.multiple)
        if (options.extensions.length) {
          const filter = new Gtk.FileFilter()
          filter.set_name('Supported files')
          for (const extension of options.extensions) {
            filter.add_suffix(extension)
          }
          chooser.add_filter(filter)
          chooser.set_filter(filter)
        }

        connection = chooser.connect('response', (_chooser, response) => complete(response))
        onOwnerClose(() => complete(Gtk.ResponseType.CANCEL))
        chooser.show()
      } catch (error) {
        try {
          dispose()
        } finally {
          reject(error)
        }
      }
    })
  },
})
