import { useRef } from 'octane'
import type { Octane } from 'octane/jsx-runtime'
import { refList } from './ref-list'

/** React Aria's useObjectRef: normalize any ref form (callback, object,
 *  or nested list) into a single `{ current }` object that stays readable
 *  in effects and still forwards assignments to the original ref. */
export function useObjectRef<T>(ref?: Octane.Ref<T>): {
	/** Current ref target — stays readable in effects. */
	current: T | null
} {
	const latest = useRef(ref)
	latest.current = ref
	const object = useRef<{ current: T | null } | undefined>(undefined)
	if (!object.current) {
		let value: T | null = null
		object.current = {
			get current() {
				return value
			},
			set current(next: T | null) {
				value = next
				for (const target of refList(latest.current)) {
					if (typeof target === 'function') {
						target(next)
					} else {
						target.current = next
					}
				}
			},
		}
	}

	return object.current
}
