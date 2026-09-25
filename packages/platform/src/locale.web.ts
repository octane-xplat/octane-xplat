// Locale — navigator.language on web ("en-US" → tag + parts).
import type { Locale } from './types'

export const locale: Locale = (() => {
	const tag = navigator.language ?? ''
	const [language = '', region = ''] = tag.split('-')
	return { tag, language, region }
})()
