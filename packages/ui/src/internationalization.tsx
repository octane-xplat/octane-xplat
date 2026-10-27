import { createContext, useContext } from 'octane'
import type { InternationalizationProviderProps } from './props'

const english: Record<string, string> = {
	'@astryx.selector.placeholder': 'Select…',
	'@astryx.selector.empty': 'No options',
	'@astryx.selector.emptySearchResults': 'No results found',
	'@astryx.selector.searchPlaceholder': 'Search…',
	'@astryx.selector.searchOptions': 'Search options',
	'@astryx.selector.clearLabel': 'Clear selection',
	'@astryx.pagination.label': 'Pagination',
	'@astryx.pagination.previous': 'Previous page',
	'@astryx.pagination.next': 'Next page',
}

/** French static strings used by Selector and Pagination, from Astryx 0.6.4
 * (Meta Platforms, MIT). This is deliberately not a complete Astryx catalog. */
export const frFR: Readonly<Record<string, string>> = {
	'@astryx.selector.placeholder': 'Sélectionner…',
	'@astryx.selector.empty': 'Aucune option',
	'@astryx.selector.emptySearchResults': 'Aucun résultat trouvé',
	'@astryx.selector.searchPlaceholder': 'Rechercher…',
	'@astryx.selector.searchOptions': 'Options de recherche',
	'@astryx.selector.clearLabel': 'Effacer la sélection',
	'@astryx.pagination.label': 'Pagination',
	'@astryx.pagination.previous': 'Aller à la page précédente',
	'@astryx.pagination.next': 'Aller à la page suivante',
}

/** Derive text direction from Intl locale data, with an RTL-language fallback. */
export function getLocaleDirection(locale: string): 'ltr' | 'rtl' {
	try {
		const value = new Intl.Locale(locale) as Intl.Locale & {
			getTextInfo?: () => { direction: string }
			textInfo?: { direction: string }
		}

		const info = value.getTextInfo?.() ?? value.textInfo
		if (info) {
			return info.direction === 'rtl' ? 'rtl' : 'ltr'
		}

		return /^(ar|fa|he|ur|ps|sd|ug|yi)(-|$)/i.test(value.baseName) ? 'rtl' : 'ltr'
	} catch {
		return 'ltr'
	}
}

/** @internal Resolve the supported static catalog subset for one scope. */
export function resolveInternationalization(props: InternationalizationProviderProps) {
	let locale = props.locale
	try {
		locale = new Intl.Locale(locale).baseName
	} catch {
		/* Retain invalid tags for lookup. */
	}
	const parts = locale.split('-')
	const chain = parts.map((_, index) => parts.slice(0, parts.length - index).join('-'))
	const translate = (key: string): string => {
		for (const catalogs of [props.overrides, props.messages]) {
			for (const tag of chain) {
				const entry = catalogs?.[tag]?.[key]
				if (entry !== undefined) {
					return typeof entry === 'string' ? entry : entry.defaultMessage
				}
			}
		}
		return english[key] ?? key
	}
	return { locale, direction: props.dir ?? getLocaleDirection(locale), translate }
}

/** @internal Shared subtree context; defaults to English and LTR. */
export const InternationalizationContext = createContext(
	resolveInternationalization({ locale: 'en' }),
)

/** Read the nearest UI provider locale; defaults to en. */
export function useLocale(): string {
	return useContext(InternationalizationContext).locale
}

/** Read the nearest UI provider direction; defaults to ltr. */
export function useDirection(): 'ltr' | 'rtl' {
	return useContext(InternationalizationContext).direction
}

/** Static messages only; no ICU or interpolation contract. */
export function useTranslator(): (key: string) => string {
	return useContext(InternationalizationContext).translate
}
