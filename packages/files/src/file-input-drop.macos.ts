import type { FileInputFile } from './props'
import { appKitFileInputDetails } from './file-input-details.macos'

/** Inspect already-delivered local URLs; promises/directories/unknown types decline. */
export function appKitDroppedFiles(uris: readonly string[], accept?: string, native: Record<string, any> = globalThis): FileInputFile[] {
	const files: FileInputFile[] = []
	for (const uri of new Set(uris)) {
		let url: any, scoped = false
		try {
			if (!uri.startsWith('file:')) continue
			url = native.NSURL?.URLWithString(uri)
			if (!url?.isFileURL || !url.path || !url.lastPathComponent) continue
			scoped = url.startAccessingSecurityScopedResource?.() ?? false
			const attributes = native.NSFileManager?.defaultManager?.attributesOfItemAtPathError?.(url.path, null)
			if (String(attributes?.objectForKey?.(native.NSFileType ?? 'NSFileType')) !== String(native.NSFileTypeRegular ?? 'NSFileTypeRegular')) continue
			const value = attributes.objectForKey(native.NSFileSize ?? 'NSFileSize')
			const raw = typeof value?.unsignedLongLongValue === 'function' ? value.unsignedLongLongValue() : value?.unsignedLongLongValue ?? value
			const size = raw == null ? undefined : Number(raw)
			const file = { name: String(url.lastPathComponent), uri: String(url.absoluteString ?? uri),
				...(size !== undefined && Number.isSafeInteger(size) && size >= 0 ? { size } : {}) }
			files.push(appKitFileInputDetails(file, accept))
		} catch {
			// No usable reference means this destination declines that item.
		} finally {
			if (scoped) { try { url.stopAccessingSecurityScopedResource() } catch {} }
		}
	}
	return files
}
