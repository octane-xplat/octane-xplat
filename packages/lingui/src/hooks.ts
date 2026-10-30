import './intl'

// Hook entry points — called from slotted component code (.ts/.tsrx consumers
// are slot-forwarded by the app-side octane transform, same as ui's useRouterState).
import { i18n, type I18n } from '@lingui/core'
import { useMemo, useSyncExternalStore } from 'octane'

import { getLocale, subscribeLocale } from './lingui'

/** Subscribe the calling component to locale changes and return the locale. */
export function useLocale(): string {
	return useSyncExternalStore(subscribeLocale, getLocale)
}

/**
 * Subscribe the calling component to locale changes and return the Lingui
 * i18n instance. Call this in components that render localized text so they
 * re-render when setLocale switches catalogs — the core macros read the i18n
 * singleton, but nothing re-invokes the render without this subscription.
 */
export function useLingui(): I18n {
	useLocale()
	return i18n
}

/** Locale used by formatting hooks before initLingui activates a catalog. */
const FALLBACK_LOCALE = 'en'

/**
 * Locale-aware string comparison, bound to the active catalog locale.
 * Mirrors Astryx's useCollator: a memoized Intl.Collator that re-derives
 * when setLocale switches. Falls back to 'en' before initLingui resolves.
 */
export function useCollator(options?: Intl.CollatorOptions): Intl.Collator {
	const locale = useLocale()
	return useMemo(() => new Intl.Collator(locale || FALLBACK_LOCALE, options), [locale, options])
}

/**
 * Locale-aware list formatting (Intl.ListFormat), bound to the active
 * catalog locale. React Aria useListFormatter counterpart.
 */
export function useListFormatter(options?: Intl.ListFormatOptions): Intl.ListFormat {
	const locale = useLocale()
	return useMemo(() => new Intl.ListFormat(locale || FALLBACK_LOCALE, options), [locale, options])
}

/** Locale-aware substring matchers built on an Intl.Collator — case and
 *  diacritic handling follows the active locale, not code-unit equality. */
export interface FilterMatch {
	/** True when `substring` appears anywhere in `string` under collator rules. */
	contains: (string: string, substring: string) => boolean
	/** True when `string` begins with `substring` under collator rules. */
	startsWith: (string: string, substring: string) => boolean
	/** True when `string` ends with `substring` under collator rules. */
	endsWith: (string: string, substring: string) => boolean
}

/**
 * Build contains/startsWith/endsWith matchers over a collator — the pure
 * half of useFilter. Matching compares equal-length NFC-normalized windows
 * with collator.compare so case/diacritic rules follow the locale rather
 * than code-unit equality. Windows are code-unit slices, so a needle or
 * haystack ending mid-surrogate-pair is an approximation, same as React
 * Aria's non-segmented path.
 */
export function createFilter(collator: Intl.Collator): FilterMatch {
	const norm = (value: string) => value.normalize('NFC')
	return {
		contains(string, substring) {
			const needle = norm(substring)
			if (needle === '') {
				return true
			}

			const haystack = norm(string)
			for (let i = 0; i + needle.length <= haystack.length; i++) {
				if (collator.compare(needle, haystack.slice(i, i + needle.length)) === 0) {
					return true
				}
			}

			return false
		},
		startsWith(string, substring) {
			const needle = norm(substring)
			return needle === '' || collator.compare(needle, norm(string).slice(0, needle.length)) === 0
		},
		endsWith(string, substring) {
			const needle = norm(substring)
			return needle === '' || collator.compare(needle, norm(string).slice(-needle.length)) === 0
		},
	}
}

/**
 * Locale-aware substring matching for filtering lists — React Aria's
 * useFilter. Options are Intl.CollatorOptions (usage defaults to 'search'),
 * so sensitivity: 'base' gives case- and diacritic-insensitive matching.
 */
export function useFilter(options?: Intl.CollatorOptions): FilterMatch {
	const collator = useCollator({ usage: 'search', ...options })
	return useMemo(() => createFilter(collator), [collator])
}
