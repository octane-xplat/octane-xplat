import { backend } from './backend.macos.js'
import { createRegistry } from './registry.js'
import type {
  CreateGlobalShortcutsOptions,
  GlobalShortcuts,
  GlobalShortcutSupport,
} from './types.js'

export * from './types.js'
export { parseAccelerator } from './accelerator.js'

const registry = createRegistry(backend)

/**
 * Report macOS global-shortcut support: Carbon `RegisterEventHotKey` with
 * exact assignment.
 */
export const getGlobalShortcutSupport: () => Promise<GlobalShortcutSupport> =
	registry.getGlobalShortcutSupport

/**
 * Create a global-shortcut registry backed by Carbon event hotkeys.
 * Hotkeys fire while the app is unfocused; held keys do not repeat.
 */
export const createGlobalShortcuts: (
	options?: CreateGlobalShortcutsOptions,
) => GlobalShortcuts = registry.createGlobalShortcuts
