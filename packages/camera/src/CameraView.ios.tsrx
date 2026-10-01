/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef } from 'octane'
import type { CameraViewProps } from './props'
import { cameraHardwarePresent, ensureCameraPermission } from './camera-permission.mobile'
import { startCameraPreview } from './camera-session.ios'
import { applyEscapeProps, layoutChildProps, nativeAccessibilityRole, nativeAccessibilityState } from './layout-child'
import { cx } from './cx.mobile'

/** Live iOS preview backed by AVFoundation. */
export function CameraView(props: CameraViewProps) @{
	const host = useRef<any>(null)
	const active = props.active !== false
	const facing = props.facing ?? 'back'
	const bindHost = useCallback((view: any) => {
		host.current = view
	}, [])

	useEffect(() => {
		const view = host.current
		if (!view || !active) return
		let disposed = false
		let stopPreview: (() => void) | undefined
		const fail = (message: string) => props.onError?.({ message })

		if (!cameraHardwarePresent()) {
			fail('camera unsupported')
			return
		}

		ensureCameraPermission().then((granted) => {
			if (disposed) return
			if (!granted) {
				fail('camera permission denied')
				return
			}

			try {
				stopPreview = startCameraPreview(view, facing, props.onReady)
			} catch (error: any) {
				fail(error?.message ?? 'camera error')
			}
		})

		return () => {
			disposed = true
			stopPreview?.()
		}
	}, [active, facing])

	useEffect(() => {
		const view = host.current
		if (!view) return
		applyEscapeProps(view.ios ?? view.nativeViewProtected, props)
		props.bind?.({ native: view.ios ?? view.nativeViewProtected })
	}, [props.bind, props.ios])

	<gridlayout
		ref={bindHost}
		id={props.id}
		rows="*"
		columns="*"
		className={cx('vx-layers', 'vx-cameraview', props.className)}
		style={{ backgroundColor: '#000', ...props.style }}
		{...layoutChildProps(props)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	/>
}
