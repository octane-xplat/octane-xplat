// Files — AppKit host leaf.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type {
	FileExportOptions,
	FileExportResult,
	FileReadBytesOptions,
	FileRef,
	Files,
} from './types'

// Extensions for the common `accept` MIME tokens. UniformTypeIdentifiers is
// not bridged in the AppKit host, so MIME filtering resolves through this
// table; an unmapped token leaves the panel unrestricted rather than breaking
// the pick.
const MIME_EXTENSIONS: Record<string, string[]> = {
	'image/*': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'heic', 'svg'],
	'image/png': ['png'],
	'image/jpeg': ['jpg', 'jpeg'],
	'image/gif': ['gif'],
	'image/webp': ['webp'],
	'image/svg+xml': ['svg'],
	'image/bmp': ['bmp'],
	'image/tiff': ['tiff', 'tif'],
	'image/heic': ['heic'],
	'audio/*': ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'],
	'audio/mpeg': ['mp3'],
	'audio/wav': ['wav'],
	'audio/x-wav': ['wav'],
	'audio/mp4': ['m4a'],
	'audio/aac': ['aac'],
	'audio/flac': ['flac'],
	'audio/ogg': ['ogg'],
	'video/*': ['mp4', 'm4v', 'mov', 'webm', 'avi', 'mkv'],
	'video/mp4': ['mp4', 'm4v'],
	'video/quicktime': ['mov'],
	'video/webm': ['webm'],
	'text/*': ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'xml', 'html', 'htm', 'css', 'log'],
	'text/plain': ['txt', 'text', 'log'],
	'text/markdown': ['md', 'markdown'],
	'text/csv': ['csv'],
	'text/tab-separated-values': ['tsv'],
	'text/html': ['html', 'htm'],
	'text/css': ['css'],
	'text/xml': ['xml'],
	'application/json': ['json'],
	'application/pdf': ['pdf'],
	'application/zip': ['zip'],
	'application/x-zip-compressed': ['zip'],
	'application/gzip': ['gz'],
	'application/xml': ['xml'],
}

function openPanel(accept = '*/*', multiple = false): FileRef[] | null {
	const appKit = globalThis as any
	const Panel = appKit.NSOpenPanel
	if (!Panel?.openPanel) {
		throw new Error('AppKit NSOpenPanel is unavailable in this macOS host')
	}

	const panel = Panel.openPanel()
	panel.canChooseFiles = true
	panel.canChooseDirectories = false
	panel.allowsMultipleSelection = multiple
	const extensions = accept
		.split(',')
		.map((value) => value.trim().toLowerCase())
		.flatMap((token) => (token.startsWith('.') ? [token.slice(1)] : (MIME_EXTENSIONS[token] ?? [])))

	if (extensions.length) {
		panel.allowedFileTypes = extensions
	}

	if (panel.runModal() !== (appKit.NSModalResponseOK ?? 1)) {
		return null
	}

	const urls: any[] = []
	if (multiple) {
		const selected = panel.URLs
		for (let index = 0; index < Number(selected?.count ?? 0); index++) {
			urls.push(selected.objectAtIndex(index))
		}
	} else if (panel.URL) {
		urls.push(panel.URL)
	}

	return urls.map((url) => ({
		name: String(url.lastPathComponent ?? ''),
		uri: String(url.absoluteString ?? url.path ?? ''),
	}))
}

export const files: Files = {
	async pick(accept = '*/*'): Promise<FileRef | null> {
		return openPanel(accept)?.[0] ?? null
	},
	async pickMultiple(accept = '*/*'): Promise<FileRef[]> {
		return openPanel(accept, true) ?? []
	},
	async readText(_file: FileRef): Promise<string> {
		throw new UnavailabilityError('files')
	},
	async readBytes(_file: FileRef, _opts?: FileReadBytesOptions): Promise<Uint8Array> {
		throw new UnavailabilityError('files')
	},
	async writeText(_name: string, _text: string): Promise<FileRef> {
		throw new UnavailabilityError('files')
	},
	async writeBytes(_name: string, _bytes: Uint8Array): Promise<FileRef> {
		throw new UnavailabilityError('files')
	},
	// FileExportResult names this leaf as the 'unavailable' case — the AppKit
	// host offers no save panel, so report it instead of throwing.
	async export(
		_name: string,
		_bytes: Uint8Array,
		_opts?: FileExportOptions,
	): Promise<FileExportResult> {
		return 'unavailable'
	},
	release(file: FileRef): void {
		// __xplatTemporaryFiles is the shared registry of app-owned temp files
		// that release may delete — @octane-xplat/media registers its captures
		// and picked outputs there. Panel selections and unrelated paths are
		// never deleted. Cleanup is best-effort: a failed delete keeps the URI
		// registered for a later retry instead of throwing from a void API.
		const host = globalThis as any
		const owned: Set<string> | undefined = host.__xplatTemporaryFiles
		if (!owned?.has(file.uri)) {
			return
		}

		try {
			const manager = host.NSFileManager.defaultManager
			if (!manager.fileExistsAtPath(file.uri) || manager.removeItemAtPathError(file.uri, null)) {
				owned.delete(file.uri)
			}
		} catch {}
	},
}
