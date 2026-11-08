import { unsupportedBackend } from './backend-unsupported.js'
import { createRegistry } from './registry.js'
import type {
  CreateGlobalShortcutsOptions,
  GlobalShortcutPlatform,
  GlobalShortcuts,
  GlobalShortcutSupport,
} from './types.js'

export * from './types.js'
export { parseAccelerator } from './accelerator.js'

// NativeScript iOS/Android define these at bundle time; plain Node/web-like
// runtimes leave them undefined.
declare const __ANDROID__: boolean
declare const __IOS__: boolean

const isMobile =
  (typeof __ANDROID__ !== 'undefined' && __ANDROID__) ||
  (typeof __IOS__ !== 'undefined' && __IOS__)

const platform: GlobalShortcutPlatform = isMobile ? 'mobile' : 'unknown'
const reason = isMobile
  ? 'Global shortcuts are not supported on iOS or Android.'
  : 'Global shortcuts are not supported on this platform.'

const registry = createRegistry(unsupportedBackend(platform, reason))

/**
 * Report whether this host supports system-wide hotkeys.
 * On this entry point the answer is always unsupported.
 */
export const getGlobalShortcutSupport: () => Promise<GlobalShortcutSupport> =
	registry.getGlobalShortcutSupport

/**
 * Create a global-shortcut registry. On this entry point every `register`
 * resolves to an `unsupported` error.
 */
export const createGlobalShortcuts: (
	options?: CreateGlobalShortcutsOptions,
) => GlobalShortcuts = registry.createGlobalShortcuts
