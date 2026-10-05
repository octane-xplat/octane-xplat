// Files — AppKit host leaf.
import type {
	FileExportOptions,
	FileExportResult,
	FileReadBytesOptions,
	FileRef,
	Files,
} from './types'

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
		.map((value) => value.trim())
		.filter((value) => value.startsWith('.'))
		.map((value) => value.slice(1))

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
		throw new Error('unsupported: AppKit file access is not wired')
	},
	async readBytes(_file: FileRef, _opts?: FileReadBytesOptions): Promise<Uint8Array> {
		throw new Error('unsupported: AppKit file access is not wired')
	},
	async writeText(_name: string, _text: string): Promise<FileRef> {
		throw new Error('unsupported: the AppKit host does not provide a save panel')
	},
	async writeBytes(_name: string, _bytes: Uint8Array): Promise<FileRef> {
		throw new Error('unsupported: the AppKit host does not provide a save panel')
	},
	async export(
		_name: string,
		_bytes: Uint8Array,
		_opts?: FileExportOptions,
	): Promise<FileExportResult> {
		throw new Error('unsupported: the AppKit host does not provide a save panel')
	},
	release(_file: FileRef): void {},
}
