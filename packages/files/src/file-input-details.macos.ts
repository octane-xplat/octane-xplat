import type { FileInputFile } from './props'
import { MIME_EXTENSIONS } from './file-types.macos'
import { appKitFileTypeClass, appKitTypeForExtension, appKitTypesForMIME } from './file-pick-filter.macos'

const types = new Map<string, string>()
for (const [mime, extensions] of Object.entries(MIME_EXTENSIONS)) {
	if (mime.includes('*')) {continue}
	for (const extension of extensions) {if (!types.has(extension)) {types.set(extension, mime)}}
}

/** Default FileInput metadata only. Filename MIME hints are not content inspection. */
export function appKitFileInputDetails(file: FileInputFile, accept?: string): FileInputFile {
	const result = { ...file }
	const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
	if (result.mimeType == null && extension) {
		const accepted = accept?.split(',').map(token => token.trim().toLowerCase()).filter(token => token.includes('/') && !token.includes('*')) ?? []
		let mime = accepted.find(token => Object.prototype.hasOwnProperty.call(MIME_EXTENSIONS, token) && MIME_EXTENSIONS[token].includes(extension))
		if (!mime) {
			try {
				const Type = appKitFileTypeClass(), type = appKitTypeForExtension(Type, extension)
				// Concrete MIME aliases must resolve to the same native type, not
				// merely a broad supertype such as public.data.
				const alias = typeof type?.identifier === 'string' ? accepted.find(token =>
					appKitTypesForMIME(Type, token).some(candidate => candidate.identifier === type.identifier)) : undefined
				const preferred = type?.preferredMIMEType
				mime = alias ?? (typeof preferred === 'string' && preferred.includes('/') ? preferred.trim().toLowerCase() : undefined)
			} catch { /* MIME metadata is optional, like the size snapshot below. */ }
		}
		mime ??= types.get(extension)
		if (mime) {result.mimeType = mime}
	}
	if (result.size != null) {return result}

	const host = globalThis as any
	let url: any, scoped = false
	try {
		url = file.uri.startsWith('/') ? host.NSURL?.fileURLWithPath(file.uri) :
			file.uri.startsWith('file:') ? host.NSURL?.URLWithString(file.uri) : null
		if (!url?.isFileURL || !url.path) {return result}
		scoped = url.startAccessingSecurityScopedResource?.() ?? false
		const attributes = host.NSFileManager?.defaultManager?.attributesOfItemAtPathError?.(url.path, null)
		const value = attributes?.objectForKey?.(host.NSFileSize ?? 'NSFileSize')
		// NSNumber and runtimes which unwrap it to a JS number are both accepted.
		const raw = typeof value?.unsignedLongLongValue === 'function' ? value.unsignedLongLongValue() : value?.unsignedLongLongValue ?? value
		if (raw != null) {
			const size = Number(raw)
			if (Number.isSafeInteger(size) && size >= 0) {result.size = size}
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
