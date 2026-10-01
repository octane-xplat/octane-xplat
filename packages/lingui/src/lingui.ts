// Lingui runtime binding — shared module. Locale state lives in a
// module-scope store (same rule as packages/ui/src/store.ts): pushed pages and
// overlays are separate roots on native, so a raw signal read in one root never
// reaches another — consumers subscribe via useLocale/useLingui in hooks.ts.
import { i18n, type Messages } from '@lingui/core'

export { i18n }

import { detectSystemLocale } from './detect-locale'
import type { CatalogLoader, LinguiPersistence, LinguiSetup } from './types'

let catalogs: Record<string, CatalogLoader> = {}
let fallback = 'en'
let persist: LinguiPersistence | undefined
let current = ''
const listeners = new Set<() => void>()

function notify(): void {
	const snapshot = [...listeners]
	for (const listener of snapshot) {
		listener()
	}
}

export function subscribeLocale(notify: () => void): () => void {
	listeners.add(notify)
	return () => {
		listeners.delete(notify)
	}
}

/** Registered locales, i.e. the catalog keys the app passed in. */
export function supportedLocales(): string[] {
	return Object.keys(catalogs)
}

/** The active locale — '' before initLingui resolves. */
export function getLocale(): string {
	return current
}

/**
 * Map a raw locale candidate ('en-US', 'pt_BR', …) onto the app's supported
 * list: exact match, then base-language match, then the fallback.
 */
export function matchLocale(
	candidate: string | undefined,
	supported: readonly string[],
	fallbackLocale: string,
): string {
	if (candidate) {
		const normalized = candidate.replace(/_/g, '-').toLowerCase()
		const exact = supported.find((locale) => locale.toLowerCase() === normalized)
		if (exact) {
			return exact
		}

		const base = normalized.split('-', 1)[0]
		const byBase = supported.find((locale) => locale.toLowerCase().split('-', 1)[0] === base)

		if (byBase) {
			return byBase
		}
	}

	return fallbackLocale
}

/**
 * Resolve the active locale: the given candidate (route param, stored
 * preference, …) or the platform's system locale, normalized onto the
 * registered catalogs.
 */
export function detectLocale(candidate?: string): string {
	return matchLocale(candidate ?? detectSystemLocale(), supportedLocales(), fallback)
}

/**
 * Register per-locale catalog loaders. Call once at startup through
 * initLingui, or again later to add locales — later calls merge.
 */
export function defineCatalogs(next: Record<string, CatalogLoader>): void {
	catalogs = { ...catalogs, ...next }
	if (!supportedLocales().includes(fallback)) {
		fallback = supportedLocales()[0] ?? fallback
	}
}

/**
 * Adapt `import.meta.glob` output to defineCatalogs. The locale is read from
 * the parent directory of each matched file — this assumes the catalog layout
 * `locales/<locale>/<name>` (the layout the localization recipe scaffolds).
 */
export function catalogsFromGlob(
	record: Record<string, CatalogLoader>,
): Record<string, CatalogLoader> {
	const out: Record<string, CatalogLoader> = {}
	for (const [path, loader] of Object.entries(record)) {
		const segments = path.split('/')
		const locale = segments[segments.length - 2]
		if (locale) {
			out[locale] = loader
		}
	}

	return out
}

/** Load + activate a locale, notify subscribers, and persist the choice. */
export async function setLocale(locale: string): Promise<void> {
	const loader = catalogs[locale]
	if (!loader) {
		throw new Error(
			`setLocale: no catalog registered for locale "${locale}" (registered: ${supportedLocales().join(', ') || 'none'})`,
		)
	}

	const loaded = await loader()
	// `?lingui`-style modules wrap the catalog as `{ messages }`; compiled ES
	// catalogs are the messages object itself. A catalog whose own id is
	// literally `messages` only collides when its value is a plain object.
	const wrapped = (loaded as { messages?: unknown }).messages
	const messages = (
		wrapped !== null && typeof wrapped === 'object' && !Array.isArray(wrapped) ? wrapped : loaded
	) as Messages

	i18n.loadAndActivate({ locale, messages })
	if (locale !== current) {
		current = locale
		notify()
	}

	await persist?.save(locale)
}

/**
 * One-call startup: registers catalogs, resolves the initial locale
 * (explicit `locale` → persisted → system → fallback), and activates it.
 * Returns the activated locale.
 */
export async function initLingui(setup: LinguiSetup): Promise<string> {
	defineCatalogs(setup.catalogs)
	if (!supportedLocales().length) {
		throw new Error('initLingui: setup.catalogs is empty')
	}

	if (setup.fallback) {
		if (!catalogs[setup.fallback]) {
			throw new Error(`initLingui: fallback "${setup.fallback}" has no registered catalog`)
		}

		fallback = setup.fallback
	}

	persist = setup.persist
	const persisted = persist ? await persist.load() : undefined
	const initial = matchLocale(
		setup.locale ?? persisted ?? detectSystemLocale(),
		supportedLocales(),
		fallback,
	)

	await setLocale(initial)
	return initial
}
