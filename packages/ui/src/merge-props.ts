/** React Aria's mergeProps: combine prop bags into one. Event handlers
 *  (on* functions) chain in argument order; className concatenates;
 *  style objects merge shallowly; everything else is last-wins.
 *  undefined values are skipped so callers can spread optional bags. */

const EVENT_PROP = /^on[A-Z]/

const isPlainObject = (value: unknown): value is Record<string, any> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

export function mergeProps(...propsList: (Record<string, any> | null | undefined)[]): Record<string, any> {
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
			} else if (EVENT_PROP.test(key) && typeof value === 'function' && typeof result[key] === 'function') {
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
