import Gtk from 'gi://Gtk?version=4.0'
import { getWindowOwner } from '../window/index.gtk.js'
import { createDesktopDialog, type OnOwnerClose } from './service.js'
import type { DesktopDialog } from './types.js'

export type * from './types.js'

function showChooser<Result>(
  chooser: Gtk.FileChooserNative,
  extensions: readonly string[],
  onOwnerClose: OnOwnerClose,
  configure: () => void,
  readResult: () => Result,
): Promise<Result | null> {
  return new Promise<Result | null>((resolve, reject) => {
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
        let result: Result | null = null
        try {
          if (response === Gtk.ResponseType.ACCEPT) {
            result = readResult()
          } else if (response !== Gtk.ResponseType.CANCEL && response !== Gtk.ResponseType.DELETE_EVENT) {
            throw new Error(`Unknown GTK file dialog result: ${response}`)
          }
        } finally {
          dispose()
        }
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    try {
      chooser.set_modal(true)
      configure()
      if (extensions.length) {
        const filter = new Gtk.FileFilter()
        filter.set_name('Supported files')
        for (const extension of extensions) {
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
}

export const dialog: DesktopDialog = createDesktopDialog({
  supported: () => typeof Gtk.FileChooserNative?.new === 'function',
  ownerOf: getWindowOwner,
  open(owner, options, onOwnerClose) {
    const chooser = Gtk.FileChooserNative.new('Open', owner, Gtk.FileChooserAction.OPEN, null, null)
    return showChooser(chooser, options.extensions, onOwnerClose,
      () => chooser.set_select_multiple(options.multiple),
      () => {
        const files = chooser.get_files()
        return Array.from({ length: files.get_n_items() }, (_, index) => files.get_item(index)?.get_path() ?? '')
      })
  },
  save(owner, options, onOwnerClose) {
    const chooser = Gtk.FileChooserNative.new('Save', owner, Gtk.FileChooserAction.SAVE, null, null)
    return showChooser(chooser, options.extensions, onOwnerClose,
      () => {
        if (options.suggestedName !== undefined) {
          chooser.set_current_name(options.suggestedName)
        }
      },
      () => chooser.get_file()?.get_path() ?? '')
  },
})
