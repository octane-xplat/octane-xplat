import { createShortcuts as createRuntime } from './engine/runtime/createRuntime.js'
import { host } from './host.web.js'
import type { ShortcutOptions, ShortcutRuntime } from './engine/types/public.js'
export * from './shared.js'

/** Create scoped keyboard shortcuts for an explicit host boundary. Throws on unsupported hosts.
 * @example
 * ```ts
 * import { createShortcuts } from '@octane-xplat/shortcuts'
 * const shortcuts = createShortcuts({ target: document })
 * shortcuts.bind('Mod+KeyK', () => console.log('Open commands'))
 * // When the owner closes: shortcuts.dispose()
 * ```
 */
export function createShortcuts(options: ShortcutOptions): ShortcutRuntime {
	return createRuntime(options, host)
}
