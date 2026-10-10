/** @jsxImportSource @nativescript-community/octane */
import { useImperativeHandle, useCallback, useEffect, useRef } from 'octane'
import { Application, View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import type { CameraViewProps } from './props'
import { attachSessionPreview } from './session'
import { cameraHardwarePresent, ensureCameraPermission } from './camera-permission.mobile'
import { applyEscapeProps, layoutChildProps, nativeAccessibilityRole, nativeAccessibilityState } from './layout-child'
import { cx } from './cx.mobile'

class CameraPreview extends View {
	createNativeView() {
		const nativeClass = (globalThis as any).com.octanexplat.camera.CameraPreviewView
		return new nativeClass(this._context)
	}
}

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		camerapreview: Attributes<typeof CameraPreview>
	}
}

registerElement('camerapreview', CameraPreview)

/** Live Android preview backed by CameraX. */
export function CameraView(props: CameraViewProps) @{
	const host = useRef<any>(null)
	const active = props.active !== false
	const facing = props.facing ?? 'back'
	useImperativeHandle(props.ref, () => ({ native: host.current.android }), []);

	const bindHost = useCallback((view: any) => {
		host.current = view
	}, [])

	useEffect(() => {
		const nativeView = host.current?.android
		if (!nativeView) return
		let disposed = false
		let provider: any
		let preview: any
		nativeView.setCameraActive(active)
		if (!active) return () => nativeView.setCameraActive(false)

		const fail = (message: string) => props.onError?.({ message })
		if (props.session) {
			if (props.facing !== undefined) {
				fail('camera session conflicts with facing')
				return () => nativeView.setCameraActive(false)
			}

			try {
				const detach = attachSessionPreview(props.session, nativeView, {
					onReady: props.onReady,
					onError: (issue) => fail(issue.message),
				})

				return () => { detach(); nativeView.setCameraActive(false) }
			} catch (error: any) {
				fail(error?.message ?? 'camera session error')
				return () => nativeView.setCameraActive(false)
			}
		}

		if (!cameraHardwarePresent()) {
			fail('camera unsupported')
			return () => nativeView.setCameraActive(false)
		}

		ensureCameraPermission().then((granted) => {
			if (disposed) return
			if (!granted) {
				fail('camera permission denied')
				return
			}

			try {
				const context = Application.android.context
				const cameraX = (globalThis as any).androidx.camera
				const future = cameraX.lifecycle.ProcessCameraProvider.getInstance(context)
				const executor = (globalThis as any).androidx.core.content.ContextCompat.getMainExecutor(context)
				future.addListener(
					new java.lang.Runnable({
						run() {
							if (disposed) return
							try {
								provider = future.get()
								const selectorClass = cameraX.core.CameraSelector
								const lens = facing === 'front'
									? selectorClass.LENS_FACING_FRONT
									: selectorClass.LENS_FACING_BACK

								const selector = new selectorClass.Builder().requireLensFacing(lens).build()
								preview = new cameraX.core.Preview.Builder().build()
								preview.setSurfaceProvider(nativeView.getSurfaceProvider())
								provider.bindToLifecycle(nativeView, selector, preview)
								props.onReady?.()
							} catch (error: any) {
								fail(error?.message ?? 'camera error')
							}
						},
					}),
					executor,
				)
			} catch (error: any) {
				fail(error?.message ?? 'camera error')
			}
		})

		return () => {
			disposed = true
			nativeView.setCameraActive(false)
			if (provider && preview) {
				try {
					provider.unbind(preview)
				} catch {}
			}
		}
	}, [active, facing, props.session])

	useEffect(() => {
		const view = host.current
		if (!view) return
		applyEscapeProps(view.android, props)
	}, [props.ref, props.android])

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
