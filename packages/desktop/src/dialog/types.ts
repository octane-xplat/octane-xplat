import type { DesktopWindow } from '../window/types.js'

export interface DesktopFileFilter {
  name: string
  /** Filename extensions without the leading dot. Use "*" for any type. */
  extensions: readonly string[]
}

export interface DesktopOpenDialogOptions {
  /** The dialog selects files. Include multiSelections to allow more than one. */
  properties?: readonly ('openFile' | 'multiSelections')[]
  /** All listed extensions are selectable. */
  filters?: readonly DesktopFileFilter[]
}

export type DesktopOpenDialogResult =
  | { canceled: true; filePaths: [] }
  | { canceled: false; filePaths: string[] }

export interface DesktopSaveDialogOptions {
  /** Initial filename without a directory. */
  suggestedName?: string
  /** Filename extensions offered by the picker. */
  filters?: readonly DesktopFileFilter[]
}

export type DesktopSaveDialogResult =
  | { canceled: true; filePath: undefined }
  | { canceled: false; filePath: string }

export interface DesktopMessageBoxOptions {
  message: string
  detail?: string
  buttons: readonly string[]
  /** Button index for Enter. Defaults to 0. */
  defaultId?: number
  /** Button index for dismissal. Defaults to defaultId. */
  cancelId?: number
}

export interface DesktopMessageBoxResult {
  /** Index in the supplied buttons array. */
  response: number
}

export interface DesktopDialog {
  /** Whether the current host can present native file dialogs. */
  readonly supported: boolean
  /** Whether the host can present a window-owned message box. */
  readonly supportsMessageBox: boolean
  /** Show a native file picker modal to a live, shown desktop window. */
  showOpenDialog(parent: DesktopWindow, options?: DesktopOpenDialogOptions): Promise<DesktopOpenDialogResult>
  /** Choose a local save path in a dialog modal to a live, shown desktop window. */
  showSaveDialog(parent: DesktopWindow, options?: DesktopSaveDialogOptions): Promise<DesktopSaveDialogResult>
  /** Ask for a choice in a native modal dialog. */
  showMessageBox(parent: DesktopWindow, options: DesktopMessageBoxOptions): Promise<DesktopMessageBoxResult>
}
