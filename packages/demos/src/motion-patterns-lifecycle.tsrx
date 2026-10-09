import { useEffect, useRef } from 'octane'
import { Application } from '@nativescript/core'

/** Native default: invoke `pause` when the app is backgrounded so continuous
 *  playback stops off-screen and requires an explicit resume. */
export function usePauseOnHidden(pause: () => void) {
	const latest = useRef(pause)
	latest.current = pause
	useEffect(() => {
		const onSuspend = () => latest.current()
		Application.on(Application.suspendEvent, onSuspend)
		return () => Application.off(Application.suspendEvent, onSuspend)
	}, [])
}
