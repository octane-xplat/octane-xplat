// Locale — navigator.language on web ("en-US" → tag + parts).
import type { Locale } from './types'

function readLocale(): Locale {
  try {
    // A script subtag (zh-Hant-TW) is not a region. Let Intl parse the tag.
    const tag = typeof navigator === 'undefined' ? '' : navigator.language
    const parsed = new Intl.Locale(tag)

    return { tag: parsed.toString(), language: parsed.language, region: parsed.region ?? '' }
  } catch {
    // A valid deterministic fallback keeps metadata imports usable without Intl.
    return { tag: 'en', language: 'en', region: '' }
  }
}

export const locale: Locale = readLocale()
