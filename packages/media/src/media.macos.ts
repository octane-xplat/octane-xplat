// Media — AppKit file selection. Photos-library browsing is not requested.
import type { MediaImpl, PickedImage } from './types'

function temporaryImages(): Set<string> {
	return ((globalThis as any).__xplatMediaTemporaryFiles ??= new Set<string>())
}

function removeOutput(uri: string): void {
	const manager = (globalThis as any).NSFileManager.defaultManager
	if (manager.fileExistsAtPath(uri) && !manager.removeItemAtPathError(uri, null)) {
		throw new Error(`Could not remove temporary image: ${uri}`)
	}

	temporaryImages().delete(uri)
}

function persistSelection(url: any, outputs: string[]): PickedImage {
	const host = globalThis as any
	const scoped = url.startAccessingSecurityScopedResource()
	try {
		const data = host.NSData.dataWithContentsOfURL(url)
		const bitmap = data && host.NSBitmapImageRep.imageRepWithData(data)
		if (!bitmap || !(bitmap.pixelsWide > 0 && bitmap.pixelsHigh > 0)) {
			throw new Error('Could not decode the selected image')
		}

		// Encode the original pixel dimensions, without point-size or screen-scale resizing.
		const jpeg = bitmap.representationUsingTypeProperties(host.NSBitmapImageFileTypeJPEG ?? 3, {
			[host.NSImageCompressionFactor]: 0.85,
		})

		if (!jpeg || !Number(jpeg.length)) {
			throw new Error('Could not convert the selected image to JPEG')
		}

		const manager = host.NSFileManager.defaultManager
		const filename = `octane-image-${host.NSUUID.UUID().UUIDString}.jpg`
		const uri = String(manager.temporaryDirectory.URLByAppendingPathComponent(filename).path)
		if (manager.fileExistsAtPath(uri)) {
			throw new Error('Temporary image path already exists')
		}

		// Track ownership before writing, including a partially written output.
		outputs.push(uri)
		temporaryImages().add(uri)
		if (!jpeg.writeToFileAtomically(uri, true)) {
			throw new Error('Could not save the image to temporary storage')
		}

		// Read back the app-owned file before relinquishing access to the source.
		const readable = host.NSData.dataWithContentsOfFile(uri)
		if (!readable?.isEqualToData(jpeg)) {
			throw new Error('Could not read the saved temporary image')
		}

		const base64 = readable.base64EncodedStringWithOptions(0)
		if (!base64) {
			throw new Error('Could not encode the temporary image data URL')
		}

		return {
			name: String(url.lastPathComponent ?? 'image.jpg'),
			uri,
			dataUrl: `data:image/jpeg;base64,${base64}`,
		}
	} finally {
		if (scoped) {
			url.stopAccessingSecurityScopedResource()
		}
	}
}

function pickSelections(multiple: boolean): PickedImage[] {
	const host = globalThis as any
	if (!host.NSOpenPanel?.openPanel) {
		throw new Error('AppKit NSOpenPanel is unavailable in this macOS host')
	}

	const panel = host.NSOpenPanel.openPanel()
	panel.canChooseFiles = true
	panel.canChooseDirectories = false
	panel.allowsMultipleSelection = multiple
	panel.allowedFileTypes = host.NSBitmapImageRep.imageTypes
	if (panel.runModal() !== (host.NSModalResponseOK ?? 1)) {
		return []
	}

	const outputs: string[] = []
	try {
		const refs: PickedImage[] = []
		if (multiple) {
			const selected = panel.URLs
			for (let index = 0; index < Number(selected?.count ?? 0); index++) {
				refs.push(persistSelection(selected.objectAtIndex(index), outputs))
			}
		} else if (panel.URL) {
			refs.push(persistSelection(panel.URL, outputs))
		}

		return refs
	} catch (error) {
		const failures: unknown[] = []
		for (const uri of outputs) {
			try {
				removeOutput(uri)
			} catch (cleanupError) {
				failures.push(cleanupError)
			}
		}

		if (failures.length) {
			throw new AggregateError([error, ...failures], 'Image selection and temporary cleanup failed')
		}

		throw error
	}
}

export const media: MediaImpl = {
	async ensure() {
		return 'unsupported'
	},
	async pickImage() {
		return pickSelections(false)[0] ?? null
	},
	async pickImages() {
		return pickSelections(true)
	},
	async capturePhoto() {
		return null
	},
}
