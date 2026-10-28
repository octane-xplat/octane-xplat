import { ApplicationSettings } from '@nativescript/core'

/**
 * Windows preferences use ApplicationData through the pinned core.
 * Writes are handed to the OS; no blocking durability confirmation is exposed.
 *
 * @example
 * import { storage } from '@octane-xplat/platform'
 * storage.setString('draft', 'Passport')
 * const draft = storage.getString('draft')
 */
export const storage = {
	getString: (key: string): string | null => ApplicationSettings.getString(key) ?? null,
	setString: (key: string, value: string): void => {
		ApplicationSettings.setString(key, value)
	},
	remove: (key: string): void => {
		ApplicationSettings.remove(key)
	},
	/** False: Windows exposes no blocking commit confirmation through this host. */
	flush: (): boolean => false,
}
