/** Validate the exact JSON projection before a baked value enters a bundle.
 * JSON.stringify alone silently drops fields, changes numbers and calls toJSON. */
export function assertRouteDataJson(data: unknown, route: string, source: string): void {
	const ancestors = new Set<object>()
	const fail: (path: string, reason: string) => never = (path, reason) => {
		throw new TypeError(`baked route '${route}' (${source}) at ${path}: ${reason}`)
	}
	const visit = (value: unknown, path: string): void => {
		if (value === null || typeof value === 'string' || typeof value === 'boolean') {
			return
		}
		if (typeof value === 'number') {
			if (!Number.isFinite(value) || Object.is(value, -0)) {
				fail(path, 'use a finite JSON number other than negative zero')
			}

			return
		}
		if (typeof value !== 'object') {
			fail(path, `${typeof value} is not JSON data`)
		}
		const object = value
		if (ancestors.has(object)) {
			fail(path, 'cyclic data is not JSON')
		}
		const array = Array.isArray(object)
		const prototype = Object.getPrototypeOf(object)
		if (
			(array && prototype !== Array.prototype && prototype !== null) ||
			(!array && prototype !== Object.prototype && prototype !== null)
		) {
			fail(path, 'use a plain JSON object; convert class instances explicitly')
		}
		ancestors.add(object)
		try {
			if (array) {
				for (let index = 0; index < object.length; index++) {
					if (!Object.hasOwn(object, index)) {
						fail(`${path}[${index}]`, 'array holes are not JSON data')
					}
				}
			}

			for (const key of Reflect.ownKeys(object)) {
				if (typeof key !== 'string') {
					fail(path, 'symbol keys are not JSON data')
				}

				if (array && key === 'length') {
					continue
				}

				const field = array ? `${path}[${key}]` : `${path}[${JSON.stringify(key)}]`
				if (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= object.length)) {
					fail(field, 'extra array properties would be lost')
				}

				const descriptor = Object.getOwnPropertyDescriptor(object, key)!
				if (!('value' in descriptor)) {
					fail(field, 'accessors are not JSON data')
				}

				if (!descriptor.enumerable) {
					fail(field, 'non-enumerable properties would be lost')
				}

				visit(descriptor.value, field)
			}
		} finally {
			ancestors.delete(object)
		}
	}
	visit(data, '$')
}
