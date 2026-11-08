import { unsupportedBackend } from './backend-unsupported.js'
import { createRegistry } from './registry.js'
import type {
  CreateGlobalShortcutsOptions,
  GlobalShortcuts,
  GlobalShortcutSupport,
} from './types.js'

export * from './types.js'
export { parseAccelerator } from './accelerator.js'

const registry = createRegistry(
  unsupportedBackend('web', 'Global shortcuts are not supported in a web browser.'),
)

/**
 * Report whether this host supports system-wide hotkeys.
 * Browsers cannot register OS-wide hotkeys, so this always reports
 * unsupported with `mechanism: 'none'`.
 */
export const getGlobalShortcutSupport: () => Promise<GlobalShortcutSupport> =
	registry.getGlobalShortcutSupport

/**
 * Create a global-shortcut registry. In a browser every `register` resolves
 * to an `unsupported` error; `parseAccelerator` still works for validation.
 */
export const createGlobalShortcuts: (
	options?: CreateGlobalShortcutsOptions,
) => GlobalShortcuts = registry.createGlobalShortcuts
