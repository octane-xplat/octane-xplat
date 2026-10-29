import type { Locale } from './types'

function readLocale(): Locale {
	try {
		// A script subtag (zh-Hant-TW) is not a region. Let Intl parse the tag.
		const tag = Intl.DateTimeFormat().resolvedOptions().locale
		const parsed = new Intl.Locale(tag.replace(/_/g, '-'))
		return { tag: parsed.toString(), language: parsed.language, region: parsed.region ?? '' }
	} catch {
		// A valid deterministic fallback keeps metadata imports usable without Intl.
		return { tag: 'en', language: 'en', region: '' }
	}
}

/** Runtime formatting-locale snapshot at module load, not a live OS preference. */
export const locale: Locale = readLocale()
