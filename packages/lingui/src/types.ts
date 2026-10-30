import type { Messages } from '@lingui/core'

/** Lingui-compiled catalogs reach the loader as either the messages object
 *  itself (ES-namespace compiled output) or a module carrying `messages`
 *  (the `?lingui` Vite query shape) — both are accepted. */
export type CatalogModule =
	| Messages
	| {
			/** Compiled message map on a module-shaped catalog. */
			messages: Messages
	  }

/** Async catalog factory — invoked lazily the first time its locale activates. */
export type CatalogLoader = () => Promise<CatalogModule>

/** Optional locale persistence — apps wire this to their storage seam
 *  (secure-storage, files, localStorage, …). Async both ways: storage
 *  leaves are promise-shaped on native. */
export interface LinguiPersistence {
	/** Read the persisted locale; undefined means none was stored. */
	load(): string | undefined | Promise<string | undefined>
	/** Store the active locale; may be async — errors are swallowed by the caller. */
	save(locale: string): void | Promise<void>
}

/** Initialization contract for initLingui(). */
export interface LinguiSetup {
	/** locale → async loader, e.g. from `catalogsFromGlob(import.meta.glob(...))`. */
	catalogs: Record<string, CatalogLoader>
	/** Locale used when detection and persistence yield nothing supported. */
	fallback?: string
	/** Forced locale — wins over persisted and detected values. */
	locale?: string
	/** Optional locale persistence — wire to the app's storage seam. */
	persist?: LinguiPersistence
}
