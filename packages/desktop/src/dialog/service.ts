import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopWindow } from '../window/types.js'
import type { DesktopDialog, DesktopFileFilter, DesktopOpenDialogOptions, DesktopSaveDialogOptions } from './types.js'

export interface NativeOpenOptions {
  extensions: readonly string[]
  multiple: boolean
}

export interface NativeSaveOptions {
  extensions: readonly string[]
  suggestedName?: string
}

export type OnOwnerClose = (dismiss: () => void) => void

interface NativeDialogHost<Owner> {
  supported(): boolean
  ownerOf(parent: DesktopWindow): Owner | undefined
  save(owner: Owner, options: NativeSaveOptions, onOwnerClose: OnOwnerClose): Promise<string | null>
  open(owner: Owner, options: NativeOpenOptions, onOwnerClose: OnOwnerClose): Promise<string[] | null>
}

function openOptions(options: DesktopOpenDialogOptions): NativeOpenOptions {
  const properties = options.properties ?? []
  if (properties.some((property) => property !== 'openFile' && property !== 'multiSelections')) {
    throw new TypeError('The desktop Open dialog supports file selection and multiSelections')
  }

  return { extensions: normalizeExtensions(options.filters), multiple: properties.includes('multiSelections') }
}

function normalizeExtensions(filters: readonly DesktopFileFilter[] = []): string[] {
  const extensions = new Set<string>()
  for (const { extensions: filterExtensions } of filters) {
    for (const extension of filterExtensions) {
      if (extension !== '*' && !/^[a-z0-9][a-z0-9_+-]*$/i.test(extension)) {
        throw new TypeError('Desktop file filters require extensions without a leading dot')
      }
      extensions.add(extension.toLowerCase())
    }
  }
  return extensions.has('*') ? [] : Array.from(extensions)
}

function saveOptions(options: DesktopSaveDialogOptions): NativeSaveOptions {
  const { suggestedName } = options
  if (suggestedName !== undefined &&
    (!suggestedName.trim() || suggestedName === '.' || suggestedName === '..' ||
      suggestedName.includes('/') || suggestedName.includes('\\') || suggestedName.includes('\0'))) {
    throw new TypeError('The Save dialog suggestedName must be a filename')
  }
  return { extensions: normalizeExtensions(options.filters), suggestedName }
}

export function createDesktopDialog<Owner>(host: NativeDialogHost<Owner>): DesktopDialog {
  const pending = new WeakSet<DesktopWindow>()

  async function show<Result>(
    parent: DesktopWindow,
    method: 'showOpenDialog' | 'showSaveDialog',
    present: (owner: Owner, onOwnerClose: OnOwnerClose) => Promise<Result>,
  ): Promise<Result | null> {
    if (!host.supported()) {
      throw new UnavailabilityError(`dialog.${method}`)
    }
    const owner = host.ownerOf(parent)
    if (owner === undefined || !parent.isVisible()) {
      const title = method === 'showOpenDialog' ? 'Open' : 'Save'
      throw new TypeError(`The ${title} dialog requires a live, shown DesktopWindow`)
    }
    if (pending.has(parent)) {
      throw new Error('This window already has a file dialog open')
    }

    let dismiss: (() => void) | undefined
    const onClosed = () => dismiss?.()
    pending.add(parent)
    parent.on('closed', onClosed)
    try {
      const result = await present(owner, (cancel) => {
        dismiss = cancel
      })
      return parent.isClosed ? null : result
    } finally {
      parent.off('closed', onClosed)
      pending.delete(parent)
    }
  }

  return {
    get supported() {
      return host.supported()
    },
    async showOpenDialog(parent, options = {}) {
      const paths = await show(parent, 'showOpenDialog', (owner, onClose) =>
        host.open(owner, openOptions(options), onClose))
      if (paths === null) {
        return { canceled: true, filePaths: [] }
      }
      if (!paths.length || paths.some((path) => !path)) {
        throw new Error('The Open dialog did not return a local file path')
      }
      return { canceled: false, filePaths: paths }
    },
    async showSaveDialog(parent, options = {}) {
      const filePath = await show(parent, 'showSaveDialog', (owner, onClose) =>
        host.save(owner, saveOptions(options), onClose))
      if (filePath === null) {
        return { canceled: true, filePath: undefined }
      }
      if (!filePath) {
        throw new Error('The Save dialog did not return a local file path')
      }
      return { canceled: false, filePath }
    },
  }
}
