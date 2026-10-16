import { mergedRef } from './ref-list'

const EVENT_PROP = /^on[A-Z]/

const isPlainObject = (value: unknown): value is Record<string, any> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Merge prop bags left-to-right: handlers chain in order, `className`
 *  joins, style objects merge shallowly, refs compose, everything else is
 *  last-wins. `undefined`/`null` entries and values are skipped.
 */
export function mergeProps(
	...propsList: (Record<string, any> | null | undefined)[]
): Record<string, any> {
	const result: Record<string, any> = {}

	for (const props of propsList) {
		if (!props) {
			continue
		}

		for (const [key, value] of Object.entries(props)) {
			if (value === undefined) {
				continue
			}

			if (key === 'className') {
				result.className = result.className ? `${result.className} ${value}` : value
			} else if (key === 'style' && isPlainObject(value)) {
				result.style = { ...(isPlainObject(result.style) ? result.style : {}), ...value }
			} else if (key === 'ref' && value != null && result.ref != null) {
				result.ref = mergedRef(result.ref, value)
			} else if (
				EVENT_PROP.test(key) &&
				typeof value === 'function' &&
				typeof result[key] === 'function'
			) {
				const prev = result[key]
				result[key] = (...args: any[]) => {
					prev(...args)
					value(...args)
				}
			} else {
				result[key] = value
			}
		}
	}

	return result
}
