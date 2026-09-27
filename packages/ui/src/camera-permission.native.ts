import { Application, isAndroid, isIOS } from '@nativescript/core'

// The CameraView leaf owns its permission request — same shape as
// platform/media's ensureCamera: direct platform primitives, not the
// plugin's requestCameraPermissions (which routes through its bundled
// perms 2.x). The plugin registers its own activityRequestPermissions
// listener at view creation and starts the preview on grant.

let cameraRequestCode = 7719

export function cameraHardwarePresent(): boolean {
	if (isIOS) {
		return typeof (globalThis as any).AVCaptureDevice !== 'undefined'
	}

	if (isAndroid) {
		try {
			const ctx = Application.android?.context ?? Application.android?.startActivity
			return ctx?.packageManager?.hasSystemFeature('android.hardware.camera.any') !== false
		} catch {
			return true
		}
	}

	return false
}

export async function ensureCameraPermission(): Promise<boolean> {
	try {
		if (isIOS) {
			const av = (globalThis as any).AVCaptureDevice
			const video = (globalThis as any).AVMediaTypeVideo
			// 0=notDetermined 1=restricted 2=denied 3=authorized
			const status = av?.authorizationStatusForMediaType?.(video)
			if (status === 3) {
				return true
			}

			if (status === 1 || status === 2) {
				return false
			}

			return await new Promise<boolean>((resolve) => {
				av.requestAccessForMediaTypeCompletionHandler(video, (granted: boolean) =>
					resolve(granted),
				)
			})
		}

		if (isAndroid) {
			const perm = 'android.permission.CAMERA'
			const activity =
				Application.android.foregroundActivity ?? Application.android.startActivity

			if (
				activity?.checkSelfPermission?.(perm) ===
				android.content.pm.PackageManager.PERMISSION_GRANTED
			) {
				return true
			}

			if (!activity) {
				return false
			}

			return await new Promise<boolean>((resolve) => {
				const requestCode = cameraRequestCode++
				const onResult = (args: any) => {
					if (args.requestCode !== requestCode) {
						return
					}

					Application.android.off(
						Application.android.activityRequestPermissionsEvent,
						onResult,
					)

					resolve(
						args.grantResults?.[0] ===
							android.content.pm.PackageManager.PERMISSION_GRANTED,
					)
				}

				Application.android.on(
					Application.android.activityRequestPermissionsEvent,
					onResult,
				)

				activity.requestPermissions([perm], requestCode)
			})
		}

		return false
	} catch {
		return false
	}
}
