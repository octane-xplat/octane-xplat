import type { CapturePhotoOptions, PermissionResult, PickedImage } from './types'

interface PhotoSheet {
	permissionStatus(): string
	requestPermissionReply(reply: (status: string) => void): void
	presentReply(options: CapturePhotoOptions, reply: (result: string | null) => void): void
	dispose(): void
	discard(uri: string): void
}

declare const XplatPhotoCaptureSheet: { alloc(): { init(): PhotoSheet } }

let active: PhotoSheet | undefined

/** Explicit permission action; importing this leaf never prompts. */
export async function ensureCamera(): Promise<PermissionResult> {
	if (typeof XplatPhotoCaptureSheet === 'undefined') {
		return 'unsupported'
	}

	const sheet = XplatPhotoCaptureSheet.alloc().init()
	try {
		const status = await new Promise<string>((resolve) => {
			const timer = setTimeout(() => resolve('denied'), 15_000)
			try {
				sheet.requestPermissionReply((next) => {
					clearTimeout(timer)
					resolve(next)
				})
			} catch {
				clearTimeout(timer)
				resolve('denied')
			}
		})

		return status === 'granted' ? 'granted' : status === 'undeclared' ? 'unsupported' : 'denied'
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
				// a user-owned original or a rejected/late capture result.
				const state = globalThis as typeof globalThis & { __xplatMediaTemporaryFiles?: Set<string> }

				;(state.__xplatMediaTemporaryFiles ??= new Set<string>()).add(image.uri)
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
