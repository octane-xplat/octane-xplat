// Files — Linux leaf. The host owns pickers (Gtk.FileDialog) and disk access;
// refs are file:// URIs. Unbridged (plain-browser dev) falls back to the web
// input/download flow. The webview bridge is the dep-free __xplatBridge
// global — leaf packages must not import platform internals.
import { files as webFiles } from './files.web'
import type { FileRef } from './types'

const bridge = () =>
	(typeof window !== 'undefined' ? (window as any).__xplatBridge : undefined)

const bridged = () => bridge() !== undefined
const call = <T,>(method: string, ...args: unknown[]): Promise<T> =>
	bridge()!.call('files', method, args) as Promise<T>

export const files = {
	async pick(accept = '*/*', opts?: { startingFolder?: string }): Promise<FileRef | null> {
		if (bridged()) {
			return call('pick', accept, opts?.startingFolder)
		}

		return webFiles.pick(accept, opts)
	},
	async readText(ref: FileRef): Promise<string> {
		if (bridged()) {
			return call('readText', ref.uri)
		}

		return webFiles.readText(ref)
	},
	async writeText(name: string, text: string): Promise<FileRef> {
		if (bridged()) {
			return call('writeText', name, text)
		}

		return webFiles.writeText(name, text)
	},
	release(ref: FileRef): void {
		if (!bridged()) {
			webFiles.release(ref)
		}
	},
}
