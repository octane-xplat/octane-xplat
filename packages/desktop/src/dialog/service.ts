import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { DesktopWindow } from '../window/types.js'
import type { DesktopDialog, DesktopFileFilter, DesktopMessageBoxOptions, DesktopOpenDialogOptions, DesktopSaveDialogOptions } from './types.js'

export interface NativeOpenOptions {
  extensions: readonly string[]
  multiple: boolean
}

export interface NativeSaveOptions {
  extensions: readonly string[]
  suggestedName?: string
}

export type NativeMessageBoxOptions = DesktopMessageBoxOptions & {
  defaultId: number
  cancelId: number
}

export type OnOwnerClose = (dismiss: () => void) => void

interface NativeDialogHost<Owner> {
  supported(): boolean
  supportsMessageBox?(): boolean
  messageBox?(owner: Owner, options: NativeMessageBoxOptions, onOwnerClose: OnOwnerClose): Promise<number | null>
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
    method: 'showOpenDialog' | 'showSaveDialog' | 'showMessageBox',
    present: (owner: Owner, onOwnerClose: OnOwnerClose) => Promise<Result>,
  ): Promise<Result | null> {
    if (method !== 'showMessageBox' && !host.supported()) {
      throw new UnavailabilityError(`dialog.${method}`)
    }
    const owner = host.ownerOf(parent)
    if (owner === undefined || !parent.isVisible()) {
      const title = method === 'showOpenDialog' ? 'Open dialog' : method === 'showSaveDialog' ? 'Save dialog' : 'message box'
      throw new TypeError(`The ${title} requires a live, shown DesktopWindow`)
    }
    if (pending.has(parent)) {
      throw new Error('This window already has a dialog open')
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

  function supportsMessageBox() {
    return typeof host.messageBox === 'function' && (host.supportsMessageBox?.() ?? true)
  }

  return {
    get supported() {
      return host.supported()
    },
    get supportsMessageBox() {
      return supportsMessageBox()
    },
    async showMessageBox(parent, options) {
      const messageBox = host.messageBox?.bind(host)
      if (!messageBox || !supportsMessageBox()) throw new UnavailabilityError('dialog.showMessageBox')
      const { message, detail, defaultId = 0, cancelId = defaultId } = options
      const buttons = Array.from(options.buttons)
      if (typeof message !== 'string' || !message.trim() || !buttons.length ||
        buttons.some((label) => typeof label !== 'string' || !label.trim())) {
        throw new TypeError('The message box requires a message and button labels')
      }
      if (![defaultId, cancelId].every((index) => Number.isInteger(index) && index >= 0 && index < buttons.length)) {
        throw new RangeError('Message box button indices must refer to an existing button')
      }
      const response = await show(parent, 'showMessageBox', (owner, onClose) =>
        messageBox(owner, { message, detail, buttons, defaultId, cancelId }, onClose))
      if (response === null) return { response: cancelId }
      if (!Number.isInteger(response) || response < 0 || response >= buttons.length) {
        throw new Error('The message box returned an unknown button index')
      }
      return { response }
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
