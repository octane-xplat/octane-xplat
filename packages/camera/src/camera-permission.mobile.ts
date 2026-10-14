import { Application, isAndroid, isIOS } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'


let requestCode = 7719

export function cameraHardwarePresent(): boolean {
	if (isIOS) {
		return typeof (globalThis as any).AVCaptureDevice !== 'undefined'
	}

	if (!isAndroid) {
		return false
	}

	try {
		const context = Application.android?.context ?? Application.android?.startActivity
		return context?.getPackageManager()?.hasSystemFeature('android.hardware.camera.any') !== false
	} catch {
		return true
	}
}

export async function ensureCameraPermission(): Promise<boolean> {
	try {
		if (isIOS) {
			const av = (globalThis as any).AVCaptureDevice
			const mediaType = (globalThis as any).AVMediaTypeVideo ?? 'vide'
			const status = av?.authorizationStatusForMediaType?.(mediaType)
			if (status === 3) {
				return true
			}

			if (status === 1 || status === 2) {
				return false
			}

			return await new Promise<boolean>((resolve) =>
				av.requestAccessForMediaTypeCompletionHandler(mediaType, resolve),
			)
		}

		if (isAndroid) {
			const permission = 'android.permission.CAMERA'
			const activity = Application.android.foregroundActivity ?? Application.android.startActivity
			if (
				activity?.checkSelfPermission?.(permission) ===
				android.content.pm.PackageManager.PERMISSION_GRANTED
			) {
				return true
			}

			if (!activity) {
				return false
			}

			return await new Promise<boolean>((resolve) => {
				const currentRequest = requestCode++
				const finish = (granted: boolean) => {
					clearTimeout(timer)
					Application.android.off(
						Application.android.activityRequestPermissionsEvent,
						onResult,
					)

					resolve(granted)
				}

				const onResult = (args: any) => {
					if (args.requestCode !== currentRequest) {
						return
					}

					finish(
						args.grantResults?.[0] === android.content.pm.PackageManager.PERMISSION_GRANTED,
					)
				}

				// Same bound the session adapter uses — an activity destroyed or
				// rotated before the result must not hang the caller or leak the
				// listener.
				const timer = setTimeout(() => finish(false), 120_000)
				Application.android.on(Application.android.activityRequestPermissionsEvent, onResult)

				try {
					activity.requestPermissions([permission], currentRequest)
				} catch {
					finish(false)
				}
			})
		}
	} catch {
		return false
	}

	return false
}
