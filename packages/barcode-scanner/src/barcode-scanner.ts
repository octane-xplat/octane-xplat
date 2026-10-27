// Barcode scanner — native service leaf. Live scanning is the <BarcodeScanner>
// component (mlkit-core's MLKitView); this file owns the camera permission
// ensure (platform primitives, media's pattern) and headless still decode.
import { Application, ImageSource } from '@nativescript/core'
import { DetectionType, detectWithStillImage } from '@nativescript/mlkit-core'
import { android } from '@octane-xplat/platform/android'
import type { BarcodeFormat, BarcodeScannerService, PermissionResult, ScannedCode } from './types'
import { fromNativeFormat, toNativeFormats } from './format-map'

let scanRequestCode = 7723

async function ensure(): Promise<PermissionResult> {
	try {
		if (Application.ios) {
			const av = (globalThis as any).AVCaptureDevice
			const video = (globalThis as any).AVMediaTypeVideo
			// 0=notDetermined 1=restricted 2=denied 3=authorized
			const status = av?.authorizationStatusForMediaType?.(video)
			if (status === 3) {
				return 'granted'
			}
			if (status === 1 || status === 2) {
				return 'denied'
			}
			if (typeof av?.requestAccessForMediaTypeCompletionHandler !== 'function') {
				return 'unsupported'
			}
			return await new Promise<PermissionResult>((resolve) => {
				av.requestAccessForMediaTypeCompletionHandler(video, (granted: boolean) =>
					resolve(granted ? 'granted' : 'denied'),
				)
			})
		}

		const perm = 'android.permission.CAMERA'
		const activity = Application.android.foregroundActivity ?? Application.android.startActivity
		if (
			activity?.checkSelfPermission?.(perm) === android.content.pm.PackageManager.PERMISSION_GRANTED
		) {
			return 'granted'
		}
		if (!activity) {
			return 'denied'
		}
		return await new Promise<PermissionResult>((resolve) => {
			const requestCode = scanRequestCode++
			const event = Application.android.activityRequestPermissionsEvent
			const onResult = (args: any) => {
				if (args.requestCode !== requestCode) {
					return
				}
				Application.android.off(event, onResult)
				resolve(
					args.grantResults?.[0] === android.content.pm.PackageManager.PERMISSION_GRANTED
						? 'granted'
						: 'denied',
				)
			}
			Application.android.on(event, onResult)
			try {
				activity.requestPermissions([perm], requestCode)
			} catch {
				Application.android.off(event, onResult)
				resolve('denied')
			}
		})
	} catch {
		return 'denied'
	}
}

async function toImageSource(image: unknown): Promise<any> {
	if (image instanceof ImageSource) {
		return image
	}
	if (typeof image === 'string') {
		return ImageSource.fromFile(image)
	}
	if (image && typeof (image as { uri?: string }).uri === 'string') {
		return ImageSource.fromFile((image as { uri: string }).uri)
	}
	throw new Error('barcodeScanner.scanImage: expected an ImageSource, file path, or {uri} ref')
}

export const barcodeScanner: BarcodeScannerService = {
	supported: true,

	ensure,

	async scanImage(image: unknown, formats?: BarcodeFormat[]): Promise<ScannedCode[]> {
		const source = await toImageSource(image)
		const result = await detectWithStillImage(source, {
			detectorType: DetectionType.Barcode,
			barcodeScanning: { barcodeFormat: toNativeFormats(formats) as [any] },
		})
		const list = Array.isArray(result) ? result : Object.values(result ?? {})
		return list
			.flat()
			.filter((item: any) => item && (item.rawValue !== undefined || item.format !== undefined))
			.map((item: any) => ({
				type: fromNativeFormat(item.format),
				data: String(item.rawValue ?? item.displayValue ?? ''),
				bounds: item.bounds
					? {
							x: item.bounds.origin?.x ?? item.bounds.x ?? 0,
							y: item.bounds.origin?.y ?? item.bounds.y ?? 0,
							width: item.bounds.size?.width ?? item.bounds.width ?? 0,
							height: item.bounds.size?.height ?? item.bounds.height ?? 0,
						}
					: undefined,
			}))
	},
}

// Scanning needs camera access — register the kind this leaf owns for the
// platform dispatcher (same 'camera' kind media registers; both leafs' owners
// run identical ensure logic, and the leaf must work with media absent).
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.camera = () => barcodeScanner.ensure()
