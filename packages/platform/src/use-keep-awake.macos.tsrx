import { useEffect, useId, useRef } from 'octane'
import { keepAwake } from './keep-awake.macos'
import type { KeepAwakeOptions } from './keep-awake.types'

/** Keep this screen awake until the component unmounts. */
export function useKeepAwake(tag?: string, options?: KeepAwakeOptions): void {
	const id = useId()
	const key = tag ?? id
	const latest = useRef(options)
	latest.current = options
	useEffect(() => {
		let active = true
		const stop = keepAwake.onRelease?.((released) => {
			if (active && released === key) latest.current?.onRelease?.(released)
		})
		void keepAwake.activate(key)
		return () => {
			if (!active) return
			active = false
			const suppressWarnings = latest.current?.suppressDeactivateWarnings
			const report = (ok: boolean) => {
				if (!ok && !suppressWarnings) console.warn('[octane-xplat] Could not deactivate keep-awake.')
			}
			try { stop?.() } finally {
				// A failing release-listener teardown must not strand the token.
				void keepAwake.deactivate(key).then(report, () => report(false))
			}
		}
	}, [key])
}
