/** @jsxImportSource @octane-xplat/macos-renderer */
import { useImperativeHandle, useCallback, useEffect, useRef } from 'octane'
import type { CameraViewProps } from './props'
import { cameraHardwarePresent, ensureCameraPermission, startCameraPreview } from './camera-session.macos'
import { attachSessionPreview } from './session'
import { layoutChildProps, nativeAccessibilityRole, nativeAccessibilityState } from './layout-child'
import { cx } from './cx.macos'

/** Live AppKit preview backed by AVFoundation. With `session`, the preview
 *  attaches to the session-owned AVCaptureSession so movie recording can
 *  share it; without one the view owns its session as before. */
export function CameraView(props: CameraViewProps) @{
	const host = useRef<any>(null)
	const active = props.active !== false
	const facing = props.facing ?? 'back'
	useImperativeHandle(props.ref, () => ({ native: host.current }), [])

	const bindHost = useCallback((view: any) => {
		host.current = view
	}, [])

	useEffect(() => {
		const view = host.current
		if (!view || !active) return
		let disposed = false
		let stopPreview: (() => void) | undefined
		const fail = (message: string) => props.onError?.({ message })

		if (props.session) {
			if (props.facing !== undefined) {
				fail('camera session conflicts with facing')
				return
			}

			try {
				const detach = attachSessionPreview(props.session, view, {
					onReady: () => {
						if (!disposed) props.onReady?.()
					},
				})

				return () => {
					disposed = true
					detach()
				}
			} catch (error: any) {
				fail(error?.message ?? 'camera session error')
				return
			}
		}

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
	}, [active, facing, props.session])

	<gridlayout
		ref={bindHost}
		id={props.id}
		rows="*"
		columns="*"
		className={cx('vx-layers', 'vx-cameraview', props.className)}
		style={{ backgroundColor: '#000000', ...props.style }}
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
