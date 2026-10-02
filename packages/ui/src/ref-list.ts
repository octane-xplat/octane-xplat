import type { Octane } from 'octane/jsx-runtime'

type FlatRef<T> = ((instance: T | null) => void) | { current: T | null }

export function refList<T>(...refs: (Octane.Ref<T> | undefined)[]): FlatRef<T>[] {
	return refs.flat().filter((ref): ref is FlatRef<T> => ref != null && !Array.isArray(ref))
}

export function mergedRef<T>(...refs: (Octane.Ref<T> | undefined)[]): FlatRef<T> {
	const list = refs.flat().filter((ref): ref is FlatRef<T> => ref != null && !Array.isArray(ref))
	return (instance: T | null) => {
		for (const ref of list) {
			if (typeof ref === 'function') ref(instance)
			else ref.current = instance
		}
	}
}
