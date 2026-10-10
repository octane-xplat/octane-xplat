/** @jsxImportSource @nativescript-community/octane */
import { useImperativeHandle, useCallback, useEffect, useRef } from 'octane'
import { View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import type { CameraViewProps } from './props'
import { attachSessionPreview } from './session'
import { cameraHardwarePresent, ensureCameraPermission } from './camera-permission.windows'
import { startCameraPreview } from './camera-session.windows'
import { applyEscapeProps, layoutChildProps, nativeAccessibilityRole, nativeAccessibilityState } from './layout-child.windows'
import { cx } from './cx.windows'

class CameraPreview extends View {
	createNativeView() {
		const { Microsoft } = globalThis as any
		return new Microsoft.UI.Xaml.Controls.CaptureElement()
	}
}

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		camerapreview: Attributes<typeof CameraPreview>
	}
}

registerElement('camerapreview', CameraPreview)

/** Live Windows preview backed by WinUI `CaptureElement` + `MediaCapture`.
 *  With `session`, the preview attaches to the session-owned capture so
 *  movie recording shares it; without one the view owns its capture. */
export function CameraView(props: CameraViewProps) @{
	const host = useRef<any>(null)
	const active = props.active !== false
	const facing = props.facing ?? 'back'
	useImperativeHandle(props.ref, () => ({ native: host.current?.nativeViewProtected }), [])

	const bindHost = useCallback((view: any) => {
		host.current = view
	}, [])

	useEffect(() => {
		const view = host.current
		if (!view || !active) return
		let disposed = false
		let stopPreview: (() => Promise<void>) | undefined
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
					onError: (issue) => {
						if (!disposed) fail(issue.message)
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

		ensureCameraPermission().then(async (granted) => {
			if (disposed) return
			if (!granted) {
				fail('camera permission denied')
				return
			}

			try {
				stopPreview = await startCameraPreview(view, facing, () => {
					if (!disposed) props.onReady?.()
				})
			} catch (error: any) {
				if (!disposed) fail(error?.message ?? 'camera error')
			}
		})

		return () => {
			disposed = true
			void stopPreview?.()
		}
	}, [active, facing, props.session])

	useEffect(() => {
		const view = host.current
		if (!view) return
		applyEscapeProps(view.nativeViewProtected, props)
	}, [props.ref, props.windows])

	<gridlayout
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
	>
		<camerapreview ref={bindHost} row={0} col={0} />
	</gridlayout>
}
