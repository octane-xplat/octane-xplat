import type { Octane } from 'octane/jsx-runtime'

type FlatRef<T> = ((instance: T | null) => void) | { current: T | null }

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
