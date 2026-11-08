import type { HotkeyBackend } from './backend.js'
import type { GlobalShortcutPlatform, GlobalShortcutSupport } from './types.js'

/** Backend for entries with no global-hotkey mechanism. */
export function unsupportedBackend(
  platform: GlobalShortcutPlatform,
  reason: string,
): HotkeyBackend {
  const support: GlobalShortcutSupport = {
    supported: false,
    platform,
    mechanism: 'none',
    assignment: 'none',
    reason,
  }

  return {
    platform: null,
    support: () => Promise.resolve({ ...support }),
    bind: (request) =>
      Promise.resolve({
        ok: false,
        error: { code: 'unsupported', message: reason, id: request.id },
      }),
    onExit: () => () => {},
  }
}
