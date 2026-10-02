// Media picking + camera capture — store a temporary JPEG for NativeScript
// Image and return a data URL for APIs that persist image payloads. Camera
// capture is stills only: @nativescript/camera presents the OS capture UI
// (UIImagePickerController on iOS, ACTION_IMAGE_CAPTURE on Android).
import { isAvailable as isCameraAvailable, takePicture } from '@nativescript/camera'

import { create as createImagePicker } from '@nativescript/imagepicker'
// Ambient const enum — verbatimModuleSyntax forbids value access; Image = 1.
import type { ImagePickerMediaType } from '@nativescript/imagepicker'
import { Application, File, ImageSource, knownFolders, path } from '@nativescript/core'
import type {
	CapturePhotoOptions,
	MediaImpl,
	MediaPermissionKind,
	PermissionResult,
	PickedImage,
} from './types'

async function ensurePhotos(): Promise<PermissionResult> {
	try {
		const picker = createImagePicker({ mode: 'single', mediaType: 1 as ImagePickerMediaType })
		const permission = (await picker.authorize()) as { authorized?: boolean } | boolean
		return permission === true || (typeof permission === 'object' && permission.authorized === true)
			? 'granted'
			: 'denied'
	} catch {
		return 'denied'
	}
}

let cameraRequestCode = 7717

// Request camera access through the platform primitives directly rather than
// @nativescript/camera's requestCameraPermissions(): it delegates to
// @nativescript-community/perms, and the bundler may resolve a perms major
// whose return shape the plugin's status mapper can't read (3.x Status
// string vs the 2.x `[status, bool]` array) — a granted permission then maps
// to 'denied'. The direct paths can't drift with that dependency.
async function ensureCamera(): Promise<PermissionResult> {
	try {
		if (!isCameraAvailable()) {
			return 'unsupported'
		}

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
			const requestCode = cameraRequestCode++
			const onResult = (args: any) => {
				if (args.requestCode !== requestCode) {
					return
				}

				Application.android.off(Application.android.activityRequestPermissionsEvent, onResult)

				resolve(
					args.grantResults?.[0] === android.content.pm.PackageManager.PERMISSION_GRANTED
						? 'granted'
						: 'denied',
				)
			}

			Application.android.on(Application.android.activityRequestPermissionsEvent, onResult)

			activity.requestPermissions([perm], requestCode)
		})
	} catch (e) {
		console.log('[media] ensureCamera error: ' + (e as Error)?.message)
		return 'denied'
	}
}

async function persistImage(source: ImageSource, name: string): Promise<PickedImage> {
	const filename = `octane-image-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
	const uri = path.join(knownFolders.temp().path, filename)
	try {
		const saved = await source.saveToFileAsync(uri, 'jpeg', 85)
		if (!saved) {
			throw new Error('Could not save the image to temporary storage')
		}

		const base64 = await source.toBase64StringAsync('jpeg', 85)
		return { name, uri, dataUrl: `data:image/jpeg;base64,${base64}` }
	} catch (error) {
		// This operation owns this generated path, including a partial save.
		try {
			File.fromPath(uri).removeSync()
		} catch {}

		throw error
	}
}

async function pickSelections(mode: 'single' | 'multiple'): Promise<PickedImage[]> {
	const picker = createImagePicker({ mode, mediaType: 1 as ImagePickerMediaType })
	const permission = (await picker.authorize()) as { authorized?: boolean } | boolean
	if (
		!(permission === true || (typeof permission === 'object' && permission.authorized === true))
	) {
		return []
	}

	const selections = await picker.present()
	const refs: PickedImage[] = []
	try {
		for (const selection of selections) {
			const source = await ImageSource.fromAsset(selection.asset)
			const name = selection.originalFilename || selection.filename || 'image.jpg'
			refs.push(await persistImage(source, name))
		}

		return refs
	} catch (error) {
		for (const ref of refs) {
			try {
				File.fromPath(ref.uri).removeSync()
			} catch {}
		}

		throw error
	}
}

export const media: MediaImpl = {
	/** Opens the native image picker; returns null when canceled. */
	async pickImage(): Promise<PickedImage | null> {
		const [image] = await pickSelections('single')
		return image ?? null
	},
	/** Opens the native image picker in multiple-selection mode. */
	pickImages() {
		return pickSelections('multiple')
	},
	/** Presents the OS camera UI; null when canceled, denied, or unsupported. */
	async capturePhoto(options?: CapturePhotoOptions): Promise<PickedImage | null> {
		if ((await ensureCamera()) !== 'granted') {
			return null
		}

		try {
			const asset = await takePicture({
				width: options?.width,
				height: options?.height,
				keepAspectRatio: options?.keepAspectRatio,
				saveToGallery: options?.saveToGallery ?? false,
				cameraFacing: options?.cameraFacing,
			})

			const source = await ImageSource.fromAsset(asset)
			return await persistImage(source, `octane-capture-${Date.now()}.jpg`)
		} catch {
			return null
		}
	},
	async ensure(kind: MediaPermissionKind): Promise<PermissionResult> {
		return kind === 'photos' ? ensurePhotos() : ensureCamera()
	},
}

// Register the permission owners this leaf provides so
// @octane-xplat/platform's `permissions.ensure(kind)` can reach them without
// a dependency edge — the generic seam reports 'unsupported' when the leaf
// is not installed.
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.camera = () => ensureCamera()
permissionOwners.photos = () => ensurePhotos()
