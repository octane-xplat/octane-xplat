import type { FileInputFile, FileInputPick } from './props'

/** Uses AppKit's native open panel as FileInput's default macOS provider. */
export const pickMacOSFiles: FileInputPick = async ({ accept, multiple }) => {
	const appKit = globalThis as any
	const Panel = appKit.NSOpenPanel
	if (!Panel?.openPanel) {
		throw new Error('AppKit NSOpenPanel is unavailable in this macOS host')
	}

	const panel = Panel.openPanel()
	panel.canChooseFiles = true
	panel.canChooseDirectories = false
	panel.allowsMultipleSelection = !!multiple
	const extensions = (accept ?? '')
		.split(',')
		.map((value) => value.trim())
		.filter((value) => value.startsWith('.'))
		.map((value) => value.slice(1))
	if (extensions.length) panel.allowedFileTypes = extensions

	if (panel.runModal() !== (appKit.NSModalResponseOK ?? 1)) return null

	const urls: any[] = []
	if (multiple) {
		const selected = panel.URLs
		for (let index = 0; index < Number(selected?.count ?? 0); index++) {
			urls.push(selected.objectAtIndex(index))
		}
	} else if (panel.URL) {
		urls.push(panel.URL)
	}
	const files: FileInputFile[] = urls.map((url) => ({
		name: String(url.lastPathComponent ?? ''),
		uri: String(url.absoluteString ?? url.path ?? ''),
	}))

	return multiple ? files : files[0] ?? null
}
