// Files — Linux leaf. The host owns pickers (Gtk.FileDialog) and disk access;
// refs are file:// URIs. Unbridged (plain-browser dev) falls back to the web
// input/download flow.
import { bridged, call } from './bridge'
import { files as webFiles } from './files.web'
import type { FileRef } from './types'

export const files = {
	async pick(accept = '*/*', opts?: { startingFolder?: string }): Promise<FileRef | null> {
		if (bridged()) {
			return call('files', 'pick', accept, opts?.startingFolder)
		}

		return webFiles.pick(accept, opts)
	},
	async readText(ref: FileRef): Promise<string> {
		if (bridged()) {
			return call('files', 'readText', ref.uri)
		}

		return webFiles.readText(ref)
	},
	async writeText(name: string, text: string): Promise<FileRef> {
		if (bridged()) {
			return call('files', 'writeText', name, text)
		}

		return webFiles.writeText(name, text)
	},
	release(ref: FileRef): void {
		if (!bridged()) {
			webFiles.release(ref)
		}
	},
}
