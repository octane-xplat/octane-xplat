import type { StyleProp } from '@octane-xplat/ui'

/** Preserve authored CSS strings as well as object styles when adding defaults. */
export function mergeStyle(base: Record<string, unknown>, style?: StyleProp): StyleProp {
	if (typeof style !== 'string') {return { ...base, ...style }}
	const prefix = Object.entries(base)
		.filter(([, value]) => value != null)
		.map(([key, value]) => {
			// The geometry defaults use pixel lengths; opacity and other numbers
			// retain their unitless meaning when the caller supplies CSS text.
			const rendered = typeof value === 'number' && /^(top|right|bottom|left|width|height)$/.test(key) ? `${value}px` : value
			return `${key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}:${rendered}`
		})
		.join(';')
	return `${prefix};${style}`
}
