import { Application, isAndroid, isIOS } from '@nativescript/core'

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
				const onResult = (args: any) => {
					if (args.requestCode !== currentRequest) {
						return
					}

					Application.android.off(Application.android.activityRequestPermissionsEvent, onResult)

					resolve(args.grantResults?.[0] === android.content.pm.PackageManager.PERMISSION_GRANTED)
				}

				Application.android.on(Application.android.activityRequestPermissionsEvent, onResult)

				activity.requestPermissions([permission], currentRequest)
			})
		}
	} catch {
		return false
	}

	return false
}
