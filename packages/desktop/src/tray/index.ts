import type { Tray, TrayAvailability, TrayOptions } from './types.js'
import { unsupportedTray } from './unsupported.js'

export type * from './types.js'
export { TrayError } from './errors.js'

const stub = unsupportedTray(
  'unsupported-platform',
  'System tray needs a native desktop runtime (macOS AppKit or Linux GTK); browser and desktop WebView frontends cannot create a tray icon.',
)

/** Report whether this host can create a tray item. */
export function getTrayAvailability(): Promise<TrayAvailability> {
  return stub.getTrayAvailability()
}

/** Create a tray item; rejects with `TrayError` on unsupported hosts or invalid options. */
export function createTray(options: TrayOptions): Promise<Tray> {
  return stub.createTray(options)
}
