import type { CapturePhotoOptions, PermissionResult, PickedImage } from './types'

interface PhotoSheet {
	permissionStatus(): string
	presentReply(options: CapturePhotoOptions, reply: (result: string | null) => void): void
	dispose(): void
	discard(uri: string): void
}

declare const XplatPhotoCaptureSheet: { alloc(): { init(): PhotoSheet } }

let active: PhotoSheet | undefined

/** Query only. Still-photo authorization belongs to the sheet's Capture action. */
export async function ensureCamera(): Promise<PermissionResult> {
	if (typeof XplatPhotoCaptureSheet === 'undefined') {
		return 'unsupported'
	}

	const sheet = XplatPhotoCaptureSheet.alloc().init()
	try {
		const status = String(sheet.permissionStatus())
		return status === 'granted'
			? 'granted'
			: status === 'denied' || status === 'restricted'
				? 'denied'
				: 'unsupported'
	} finally {
		sheet.dispose()
	}
}

/** Call from a user action. The sheet owns its preview until it settles. */
export async function capturePhoto(options: CapturePhotoOptions = {}): Promise<PickedImage | null> {
	if (options.saveToGallery) {
		throw new Error('unsupported: saveToGallery is unavailable for macOS still-photo capture')
	}

	if (active || typeof XplatPhotoCaptureSheet === 'undefined') {
		return null
	}

	const sheet = XplatPhotoCaptureSheet.alloc().init()
	active = sheet
	return new Promise((resolve) => {
		let settled = false
		let deliveredUri: string | undefined
		const finish = (message: string | null) => {
			let image: PickedImage | null = null
			try {
				if (message) {
					const value = JSON.parse(message) as Partial<PickedImage>
					if (
						typeof value.name === 'string' &&
						typeof value.uri === 'string' &&
						typeof value.dataUrl === 'string' &&
						value.dataUrl.startsWith('data:image/jpeg;base64,')
					) {
						image = value as PickedImage
					}
				}
			} catch {
				// A malformed host result must not replace the current selection.
			}

			if (settled) {
				if (image && image.uri !== deliveredUri) {
					sheet.discard(image.uri)
				}

				return
			}

			settled = true
			deliveredUri = image?.uri
			if (image) {
				// Shared with the AppKit file picker and files.release; never register
				// a user-owned original or a rejected/late capture result. Only the
				// host's own captures belong in the deletable registry — mirror the
				// sheet's tempDir + octane-capture- guard on the reply's uri.
				const manager = (globalThis as any).NSFileManager?.defaultManager
				const tempDir = String(manager?.temporaryDirectory?.standardizedFileURL?.path ?? '')
				const name = image.uri.slice(image.uri.lastIndexOf('/') + 1)
				if (
					tempDir !== '' &&
					name.startsWith('octane-capture-') &&
					image.uri === `${tempDir.replace(/\/+$/, '')}/${name}`
				) {
					const state = globalThis as typeof globalThis & {
						__xplatTemporaryFiles?: Set<string>
					}

					;(state.__xplatTemporaryFiles ??= new Set<string>()).add(image.uri)
				}
			}

			try {
				sheet.dispose()
			} finally {
				if (active === sheet) {
					active = undefined
				}

				resolve(image)
			}
		}

		try {
			sheet.presentReply(options, finish)
		} catch {
			finish(null)
		}
	})
}
