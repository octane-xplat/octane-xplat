import { useEffect, useRef } from 'octane'

/** Web leaf: invoke `pause` when the page is hidden so continuous playback
 *  stops off-screen and requires an explicit resume. */
export function usePauseOnHidden(pause: () => void) {
	const latest = useRef(pause)
	latest.current = pause
	useEffect(() => {
		const onHidden = () => {
			if (document.hidden) latest.current()
		}

		document.addEventListener('visibilitychange', onHidden)
		return () => document.removeEventListener('visibilitychange', onHidden)
	}, [])
}
