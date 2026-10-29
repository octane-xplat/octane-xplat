import type { Octane } from 'octane/jsx-runtime'

/** A resolved ref target: a callback or a `{ current }` object — the element
 *  type `refList`/`mergedRef` produce after flattening nested ref arrays. */
export type FlatRef<T> = ((instance: T | null) => void) | { current: T | null }

/**
 * Compose several ref callbacks/objects into one — the list form of `mergedRef`.
 *
 * @see mergedRef.
 */
export function refList<T>(...refs: (Octane.Ref<T> | undefined)[]): FlatRef<any>[] {
	const list: FlatRef<any>[] = []
	const collect = (ref: Octane.Ref<T> | undefined) => {
		if (Array.isArray(ref)) {
			for (const nested of ref) {
				collect(nested)
			}
		} else if (ref != null) {
			list.push(ref as FlatRef<any>)
		}
	}

	for (const ref of refs) {
		collect(ref)
	}

	return list
}

/**
 * Merge two refs into one callback — both receive the element.
 *
 * @see refList.
 */
export function mergedRef<T>(...refs: (Octane.Ref<T> | undefined)[]): FlatRef<any> {
	const list = refList(...refs)
	return (instance: T | null) => {
		for (const ref of list) {
			if (typeof ref === 'function') {
				ref(instance)
			} else {
				ref.current = instance
			}
		}
	}
}
