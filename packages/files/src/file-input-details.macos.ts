import type { FileInputFile } from './props'
import { MIME_EXTENSIONS } from './file-types.macos'

const types = new Map<string, string>()
for (const [mime, extensions] of Object.entries(MIME_EXTENSIONS)) {
	if (mime.includes('*')) continue
	for (const extension of extensions) if (!types.has(extension)) types.set(extension, mime)
}

/** Default FileInput metadata only. Filename MIME hints are not content inspection. */
export function appKitFileInputDetails(file: FileInputFile, accept?: string): FileInputFile {
	const result = { ...file }
	const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
	// Honor a recognized concrete alias (e.g. application/xml vs text/xml)
	// before falling back to the table's first concrete filename hint.
	const accepted = accept?.split(',').map((token) => token.trim().toLowerCase())
		.find((token) => !token.includes('*') && MIME_EXTENSIONS[token]?.includes(extension))
	const mime = accepted ?? types.get(extension)
	if (result.mimeType == null && mime) result.mimeType = mime
	if (result.size != null) return result

	const host = globalThis as any
	let url: any, scoped = false
	try {
		url = file.uri.startsWith('/') ? host.NSURL?.fileURLWithPath(file.uri) :
			file.uri.startsWith('file:') ? host.NSURL?.URLWithString(file.uri) : null
		if (!url?.isFileURL || !url.path) return result
		scoped = url.startAccessingSecurityScopedResource?.() ?? false
		const attributes = host.NSFileManager?.defaultManager?.attributesOfItemAtPathError?.(url.path, null)
		const value = attributes?.objectForKey?.(host.NSFileSize ?? 'NSFileSize')
		// NSNumber and runtimes which unwrap it to a JS number are both accepted.
		const raw = typeof value?.unsignedLongLongValue === 'function' ? value.unsignedLongLongValue() : value?.unsignedLongLongValue ?? value
		if (raw != null) {
			const size = Number(raw)
			if (Number.isSafeInteger(size) && size >= 0) result.size = size
		}
	} catch {
		// Metadata is optional; a later file read still owns its own errors/grant.
	} finally {
		if (scoped) {
			try { url.stopAccessingSecurityScopedResource() } catch {}
		}
	}
	return result
}
