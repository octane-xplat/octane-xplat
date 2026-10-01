import type { Messages } from '@lingui/core'

// Lingui-compiled catalogs reach the loader as either the messages object
// itself (ES-namespace compiled output) or a module carrying `messages`
// (the `?lingui` Vite query shape).
export type CatalogModule = Messages | { messages: Messages }

export type CatalogLoader = () => Promise<CatalogModule>

// Optional locale persistence — apps wire this to their storage seam
// (secure-storage, files, localStorage, …). Async both ways: storage
// leaves are promise-shaped on native.
export interface LinguiPersistence {
	load(): string | undefined | Promise<string | undefined>
	save(locale: string): void | Promise<void>
}

export interface LinguiSetup {
	/** locale → async loader, e.g. from `catalogsFromGlob(import.meta.glob(...))`. */
	catalogs: Record<string, CatalogLoader>
	/** Locale used when detection and persistence yield nothing supported. */
	fallback?: string
	/** Forced locale — wins over persisted and detected values. */
	locale?: string
	persist?: LinguiPersistence
}
