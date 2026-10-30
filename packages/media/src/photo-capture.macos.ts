import type { CapturePhotoOptions, PermissionResult, PickedImage } from './types'

interface PhotoSheet {
	permissionStatus(): string
	presentReply(options: CapturePhotoOptions, reply: (result: string | null) => void): void
	dispose(): void
	discard(uri: string): void
}

/** Photos add-only save through the bridged Photos.framework. The write is
 *  best-effort like the mobile capture path: a denied request or a failed
 *  PHAssetChangeRequest warns and still returns the captured file — the shot
 *  itself is valid output. */
function saveToPhotosLibrary(path: string): void {
	try {
		const host = globalThis as any
		const library = host.PHPhotoLibrary?.sharedPhotoLibrary?.()
		const addOnly = host.PHAccessLevelAddOnly ?? 1
		const status = host.PHPhotoLibrary?.authorizationStatusForAccessLevel?.(addOnly)
		const write = () => {
			const url = host.NSURL.fileURLWithPath(path)
			library.performChangesCompletionHandler(
				() => {
					host.PHAssetChangeRequest.creationRequestForAssetFromImageAtFileURL(url)
				},
				(succeeded: boolean, error: any) => {
					if (!succeeded) {
						console.warn(
							`[media] saveToGallery could not write to Photos: ${error?.localizedDescription ?? error ?? 'unknown error'}`,
						)
					}
				},
			)
		}

		if (!library) {
			console.warn('[media] saveToGallery: PhotoKit is unavailable on this host')
			return
		}

		// PHAuthorizationStatus: 3 authorized; 0 notDetermined prompts first.
		if (status === 3) {
			write()
		} else if (status === 0) {
			host.PHPhotoLibrary.requestAuthorizationForAccessLevelHandler(addOnly, (next: number) => {
				if (next === 3) {
					write()
				} else {
					console.warn('[media] saveToGallery: Photos add access was not granted')
				}
			})
		} else {
			console.warn(`[media] saveToGallery: Photos add access is ${status}`)
		}
	} catch (error: any) {
		console.warn(`[media] saveToGallery failed: ${error?.message ?? error}`)
	}
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
					const value = JSON.parse(message) as Partial<PickedImage> & { dataUrl?: unknown }
					if (typeof value.name === 'string' && typeof value.uri === 'string') {
						// The sheet's reply may still carry a dataUrl payload; the
						// public ref is only the file handle.
						image = { name: value.name, uri: value.uri }
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
			if (image && options.saveToGallery) {
				saveToPhotosLibrary(image.uri)
			}

			if (image) {
				// Shared with the AppKit file picker and files.release; never register
				// a user-owned original or a rejected/late capture result. Only the
				// host's own captures belong in the deletable registry — mirror the
				// sheet's tempDir + octane-capture- guard on the reply's uri. The
				// bridge does not expose standardizedFileURL, so compare against
				// the same unstandardized temporaryDirectory the sheet writes to.
				const manager = (globalThis as any).NSFileManager?.defaultManager
				const tempDir = String(manager?.temporaryDirectory?.path ?? '')
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
