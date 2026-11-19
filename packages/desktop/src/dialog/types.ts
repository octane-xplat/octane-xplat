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

export interface DesktopDialog {
  /** Whether the current host can present native file dialogs. */
  readonly supported: boolean
  /** Show a native file picker modal to a live, shown desktop window. */
  showOpenDialog(parent: DesktopWindow, options?: DesktopOpenDialogOptions): Promise<DesktopOpenDialogResult>
  /** Choose a local save path in a dialog modal to a live, shown desktop window. */
  showSaveDialog(parent: DesktopWindow, options?: DesktopSaveDialogOptions): Promise<DesktopSaveDialogResult>
}
