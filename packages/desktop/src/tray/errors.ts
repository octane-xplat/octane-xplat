import type { TrayErrorCode } from './types.js'

/** Error thrown and rejected by the tray API — `code` distinguishes the failure. */
export class TrayError extends Error {
  /** Machine-readable failure reason. */
  readonly code: TrayErrorCode

  constructor(code: TrayErrorCode, message: string) {
    super(message)
    this.name = 'TrayError'
    this.code = code
  }
}
