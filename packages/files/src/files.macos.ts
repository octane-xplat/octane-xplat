// Files — AppKit host leaf.
import { applyAppKitFileTypeFilter } from './file-pick-filter.macos'
import { MIME_EXTENSIONS } from './file-types.macos'
import { assertSafeFileName, concatBytes, exactBuffer, exportBusy, fileTooLarge, throwIfAborted } from './file-bytes'
import type {
	FileExportOptions,
	FileExportResult,
	FileReadBytesOptions,
	FileRef,
	Files,
	FilePickOptions,
} from './types'


function fileURL(uri: string): any {
	const host = globalThis as any
	if (!uri.startsWith('/') && !uri.startsWith('file:')) {
		throw new Error(`Not a local file: ${uri}`)
	}

	const url = uri.startsWith('file:') ? host.NSURL.URLWithString(uri) : host.NSURL.fileURLWithPath(uri)
	if (!url || !url.isFileURL) {
		throw new Error(`Not a local file: ${uri}`)
	}

	return url
}

function writeData(url: any, data: any): void {
	const scoped = url.startAccessingSecurityScopedResource?.() ?? false
	try {
		if (!data || !data.writeToURLAtomically(url, true)) {
			throw new Error(`Failed to write file: ${String(url.path)}`)
		}
	} finally {
		if (scoped) {url.stopAccessingSecurityScopedResource()}
	}
}

function documentsURL(name: string): any {
	assertSafeFileName(name)
	const host = globalThis as any
	const manager = host.NSFileManager.defaultManager
	const directory = manager.URLsForDirectoryInDomains(9, 1).firstObject
	if (!directory || !manager.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(directory, true, null, null)) {
		throw new Error('Unable to create the Documents directory')
	}

	return directory.URLByAppendingPathComponent(name)
}

function byteData(bytes: Uint8Array): any {
	return (globalThis as any).NSData.dataWithBytesLength(exactBuffer(bytes), bytes.byteLength)
}

function openPanel(accept = '*/*', multiple = false, opts?: FilePickOptions): FileRef[] | null {
	const appKit = globalThis as any
	const Panel = appKit.NSOpenPanel
	if (!Panel?.openPanel) {
		throw new Error('AppKit NSOpenPanel is unavailable in this macOS host')
	}

	const panel = Panel.openPanel()
	panel.canChooseFiles = true
	panel.canChooseDirectories = false
	panel.allowsMultipleSelection = multiple
	if (opts?.startingFolder) {
		panel.directoryURL = fileURL(opts.startingFolder)
	}
	applyAppKitFileTypeFilter(panel, accept, appKit)

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

let exporting = false

/** File service — pickers, sandbox IO, user-directed export. */
export const files: Files = {
	async pick(accept = '*/*', opts?: FilePickOptions): Promise<FileRef | null> {
		return openPanel(accept, false, opts)?.[0] ?? null
	},
	async pickMultiple(accept = '*/*', opts?: FilePickOptions): Promise<FileRef[]> {
		return openPanel(accept, true, opts) ?? []
	},
	async readText(file: FileRef): Promise<string> {
		const host = globalThis as any
		const bytes = await files.readBytes(file)
		const text = host.NSString.alloc().initWithDataEncoding(byteData(bytes), 4)
		if (text == null) {
			throw new Error(`File is not valid UTF-8: ${file.uri}`)
		}

		return String(text)
	},
	async readBytes(file: FileRef, opts?: FileReadBytesOptions): Promise<Uint8Array> {
		throwIfAborted(opts?.signal)
		const host = globalThis as any
		const url = fileURL(file.uri)
		const scoped = url.startAccessingSecurityScopedResource?.() ?? false
		let handle: any
		try {
			handle = host.NSFileHandle.fileHandleForReadingAtPath(String(url.path))
			if (!handle) {
				throw new Error(`Unable to open picked file: ${file.uri}`)
			}

			const chunks: Uint8Array[] = []
			let total = 0
			while (true) {
				throwIfAborted(opts?.signal)
				const length = opts?.maxBytes == null ? 65536 : Math.max(1, Math.min(65536, opts.maxBytes - total + 1))
				const data = handle.readDataOfLength(length)
				if (!data || Number(data.length) === 0) {break}
				total += Number(data.length)
				if (opts?.maxBytes != null && total > opts.maxBytes) {
					throw fileTooLarge(file.uri, opts.maxBytes)
				}

				// Copy before the autoreleased NSData can leave this iteration.
				chunks.push(new Uint8Array(host.interop.bufferFromData(data)).slice())
				await new Promise<void>((resolve) => setTimeout(resolve, 0))
			}

			throwIfAborted(opts?.signal)
			return concatBytes(chunks, total)
		} finally {
			try { handle?.closeFile() } finally {
				if (scoped) {url.stopAccessingSecurityScopedResource()}
			}
		}
	},
	async writeText(name: string, text: string): Promise<FileRef> {
		const url = documentsURL(name)
		const data = (globalThis as any).NSString.stringWithString(text).dataUsingEncoding(4)
		writeData(url, data)
		return { name, uri: String(url.path) }
	},
	async writeBytes(name: string, bytes: Uint8Array): Promise<FileRef> {
		const url = documentsURL(name)
		writeData(url, byteData(bytes))
		return { name, uri: String(url.path) }
	},
	async export(
		name: string,
		bytes: Uint8Array,
		opts?: FileExportOptions,
	): Promise<FileExportResult> {
		assertSafeFileName(name)
		if (exporting) {throw exportBusy()}
		const host = globalThis as any
		if (!host.NSSavePanel?.savePanel) {return 'unavailable'}
		exporting = true
		try {
			// Yield before runModal so concurrent callers observe the busy state.
			await Promise.resolve()
			const panel = host.NSSavePanel.savePanel()
			panel.nameFieldStringValue = name
			panel.canCreateDirectories = true
			const extensions = opts?.mimeType ? MIME_EXTENSIONS[opts.mimeType.toLowerCase()] : undefined
			if (extensions?.length) {panel.allowedFileTypes = extensions}
			if (panel.runModal() !== (host.NSModalResponseOK ?? 1)) {return 'cancelled'}
			if (!panel.URL) {throw new Error('The save panel returned no destination')}
			writeData(panel.URL, byteData(bytes))
			return 'saved'
		} finally {
			exporting = false
		}
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
