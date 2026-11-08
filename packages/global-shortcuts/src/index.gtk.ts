import { backend } from './backend.gtk.js'
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
 * Report Linux global-shortcut support: the XDG GlobalShortcuts desktop
 * portal with desktop-assigned triggers.
 */
export const getGlobalShortcutSupport: () => Promise<GlobalShortcutSupport> =
	registry.getGlobalShortcutSupport

/**
 * Create a global-shortcut registry backed by the XDG GlobalShortcuts
 * portal. The desktop owns the actual key assignment and may present a
 * confirmation; `trigger` on a successful registration reports the keys the
 * desktop granted.
 */
export const createGlobalShortcuts: (
	options?: CreateGlobalShortcutsOptions,
) => GlobalShortcuts = registry.createGlobalShortcuts
