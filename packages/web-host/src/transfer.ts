/** Fail closed rather than silently changing dates, undefined, NaN or cycles.
 * Only own data properties cross; serializers and getters never execute. */
export function serializePublic(value: unknown): string {
	const ancestors = new Set<object>()
	function visit(value: unknown): void {
		if (value === null || typeof value === 'string' || typeof value === 'boolean') {
			return
		}
		if (typeof value === 'number' && Number.isFinite(value)) {
			return
		}
		if (typeof value !== 'object' || ancestors.has(value)) {
			throw new TypeError('Web transfer requires finite, acyclic JSON data')
		}
		const proto = Object.getPrototypeOf(value)
		if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) {
			throw new TypeError('Web transfer requires plain JSON objects')
		}
		ancestors.add(value)
		const descriptors = Object.getOwnPropertyDescriptors(value)
		if (Reflect.ownKeys(value).some((key) => typeof key === 'symbol')) {
			throw new TypeError('Web transfer cannot contain symbol keys')
		}
		if (
			Array.isArray(value) &&
			(Object.keys(value).length !== value.length ||
				Array.from({ length: value.length }, (_, index) => index).some(
					(index) => !Object.hasOwn(value, index),
				))
		) {
			throw new TypeError('Web transfer requires dense arrays without extra properties')
		}
		for (const [key, descriptor] of Object.entries(descriptors)) {
			if (Array.isArray(value) && key === 'length') {
				continue
			}

			if (!descriptor.enumerable || !('value' in descriptor)) {
				throw new TypeError('Web transfer requires enumerable data properties')
			}

			visit(descriptor.value)
		}
		ancestors.delete(value)
	}
	visit(value)
	return JSON.stringify(value).replace(
		/[<>&\u2028\u2029]/g,
		(char) => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'),
	)
}

export const bootstrapId = '__xplat_document'
export const rootId = '__xplat_app'
export const identifierPrefix = 'xplat-document-'
