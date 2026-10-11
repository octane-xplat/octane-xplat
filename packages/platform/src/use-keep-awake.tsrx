import { useEffect, useId } from 'octane'
import { keepAwake } from './keep-awake'
import type { KeepAwakeOptions } from './keep-awake.types'

/** Keep this screen awake until the component unmounts. */
export function useKeepAwake(tag?: string, options?: KeepAwakeOptions): void {
	const id = useId()
	const key = tag ?? id
	useEffect(() => {
		const stop = keepAwake.onRelease?.((released) => {
			if (released === key) {
				options?.onRelease?.(released)
			}
		})

		void keepAwake.activate(key)
		return () => {
			stop?.()
			void keepAwake.deactivate(key).then((ok) => {
				if (!ok && !options?.suppressDeactivateWarnings) {
					console.warn('[octane-xplat] Could not deactivate keep-awake.')
				}
			})
		}
	}, [key, options?.onRelease, options?.suppressDeactivateWarnings])
}
