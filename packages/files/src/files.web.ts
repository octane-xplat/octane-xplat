// Files — web leaf. Desktop webview hosts own real pickers and file:// refs;
// outside a host this uses opaque object URLs and browser downloads.
import { desktopHost } from '@octane-xplat/platform/host/web'
import type { FileRef } from './types'

export const files = {
	async pick(accept = '*/*', opts?: { startingFolder?: string }): Promise<FileRef | null> {
		const host = desktopHost()
		if (host && (await host.supports('files', 'pick'))) {
			return host.files.pick(accept, { startingFolder: opts?.startingFolder })
		}

		return new Promise((resolve) => {
			const input = document.createElement('input')
			input.type = 'file'
			input.accept = accept
			input.onchange = () => {
				const f = input.files?.[0]
				resolve(f ? { name: f.name, uri: URL.createObjectURL(f) } : null)
			}

			input.oncancel = () => resolve(null)
			input.click()
		})
	},
	async readText(ref: FileRef): Promise<string> {
		const host = desktopHost()
		if (host && (await host.supports('files', 'readText'))) {
			const text = await host.files.readText(ref.uri)
			if (text === null) {
				throw new Error(`Unable to read host file: ${ref.uri}`)
			}

			return text
		}

		return (await fetch(ref.uri)).text()
	},
	/** Desktop hosts write the selected path; plain web starts a download. */
	async writeText(name: string, text: string): Promise<FileRef> {
		const host = desktopHost()
		if (host && (await host.supports('files', 'writeText'))) {
			const file = await host.files.writeText(name, text)
			if (!file) {
				throw new Error('Host file save was cancelled')
			}

			return file
		}

		const uri = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
		const a = document.createElement('a')
		a.href = uri
		a.download = name
		a.click()
		return { name, uri }
	},
	release(ref: FileRef): void {
		if (ref.uri.startsWith('blob:')) {
			URL.revokeObjectURL(ref.uri)
		}
	},
}
