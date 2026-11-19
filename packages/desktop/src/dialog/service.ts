import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopWindow } from '../window/types.js'
import type { DesktopDialog, DesktopOpenDialogOptions } from './types.js'

export interface NativeOpenOptions {
  extensions: readonly string[]
  multiple: boolean
}

type OnOwnerClose = (dismiss: () => void) => void

interface NativeDialogHost<Owner> {
  supported(): boolean
  ownerOf(parent: DesktopWindow): Owner | undefined
  open(owner: Owner, options: NativeOpenOptions, onOwnerClose: OnOwnerClose): Promise<string[] | null>
}

function openOptions(options: DesktopOpenDialogOptions): NativeOpenOptions {
  const properties = options.properties ?? []
  if (properties.some((property) => property !== 'openFile' && property !== 'multiSelections')) {
    throw new TypeError('The desktop Open dialog supports file selection and multiSelections')
  }

  const extensions = new Set<string>()
  for (const { extensions: filterExtensions } of options.filters ?? []) {
    for (const extension of filterExtensions) {
      if (extension !== '*' && !/^[a-z0-9][a-z0-9_+-]*$/i.test(extension)) {
        throw new TypeError('Desktop file filters require extensions without a leading dot')
      }
      extensions.add(extension.toLowerCase())
    }
  }

  return {
    extensions: extensions.has('*') ? [] : Array.from(extensions),
    multiple: properties.includes('multiSelections'),
  }
}

export function createDesktopDialog<Owner>(host: NativeDialogHost<Owner>): DesktopDialog {
  const pending = new WeakSet<DesktopWindow>()

  return {
    get supported() {
      return host.supported()
    },

    async showOpenDialog(parent, options = {}) {
      if (!host.supported()) {
        throw new UnavailabilityError('dialog.showOpenDialog')
      }

      const owner = host.ownerOf(parent)
      if (owner === undefined || !parent.isVisible()) {
        throw new TypeError('The Open dialog requires a live, shown DesktopWindow')
      }
      if (pending.has(parent)) {
        throw new Error('This window already has a file dialog open')
      }

      const normalized = openOptions(options)
      let dismiss: (() => void) | undefined
      const onClosed = () => dismiss?.()
      pending.add(parent)
      parent.on('closed', onClosed)
      try {
        const paths = await host.open(owner, normalized, (cancel) => {
          dismiss = cancel
        })
        if (paths === null || parent.isClosed) {
          return { canceled: true, filePaths: [] }
        }
        if (!paths.length || paths.some((path) => !path)) {
          throw new Error('The Open dialog did not return a local file path')
        }
        return { canceled: false, filePaths: paths }
      } finally {
        parent.off('closed', onClosed)
        pending.delete(parent)
      }
    },
  }
}
