import { useEffect, useImperativeHandle, useLazyRef, useRef } from 'octane'
import { backend } from './backend'
import { createCaptureController } from './controller'
import { captureRef, releaseCapture } from './service'
import type { ViewShotProps } from './props'

export function useViewShot(props: ViewShotProps): (value: object | null) => void {
	const latest = useRef(props)
	latest.current = props
	const controller = useLazyRef(() =>
		createCaptureController(() => latest.current, {
			capture: captureRef,
			release: releaseCapture,
			waitForLayout: backend.waitForLayout,
		}),
	)
	useImperativeHandle(props.ref, () => controller.current.handle, [])
	useEffect(() => {
		controller.current.rendered()
	}, null)
	useEffect(() => () => controller.current.dispose(), [])
	return controller.current.attach
}
