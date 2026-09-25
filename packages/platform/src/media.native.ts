// Media picking + camera capture — store a temporary JPEG for NativeScript
// Image and return a data URL for APIs that persist image payloads. Camera
// capture is stills only: @nativescript/camera presents the OS capture UI
// (UIImagePickerController on iOS, ACTION_IMAGE_CAPTURE on Android).
import {
	isAvailable as isCameraAvailable,
	requestCameraPermissions,
	takePicture,
} from '@nativescript/camera'

import { create as createImagePicker } from '@nativescript/imagepicker'
// Ambient const enum — verbatimModuleSyntax forbids value access; Image = 1.
import type { ImagePickerMediaType } from '@nativescript/imagepicker'
import { ImageSource, knownFolders, path } from '@nativescript/core'
import { files } from './files'
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

async function ensureCamera(): Promise<PermissionResult> {
	try {
		if (!isCameraAvailable()) {
			return 'unsupported'
		}

		const result = await requestCameraPermissions()
		return result?.Success ? 'granted' : 'denied'
	} catch {
		return 'denied'
	}
}

async function persistImage(source: ImageSource, name: string): Promise<PickedImage> {
	const filename = `octane-image-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
	const uri = path.join(knownFolders.temp().path, filename)
	const saved = await source.saveToFileAsync(uri, 'jpeg', 85)
	if (!saved) {
		throw new Error('Could not save the image to temporary storage')
	}

	const base64 = await source.toBase64StringAsync('jpeg', 85)
	return { name, uri, dataUrl: `data:image/jpeg;base64,${base64}` }
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
			files.release(ref)
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
