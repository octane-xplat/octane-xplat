// Files — web leaf. Desktop webview hosts own real pickers and file:// refs;
// outside a host this uses opaque object URLs and browser downloads.
import { desktopHost } from '@octane-xplat/platform/host/web'
import type { FileRef } from './types'

function chooseFiles(accept: string, multiple: boolean): Promise<FileRef[]> {
	return new Promise((resolve) => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = accept
		input.multiple = multiple
		input.onchange = () => {
			const refs: FileRef[] = []
			for (const file of Array.from(input.files ?? [])) {
				refs.push({ name: file.name, uri: URL.createObjectURL(file) })
			}
			resolve(refs)
		}

		input.oncancel = () => resolve([])
		input.click()
	})
}

export const files = {
	async pickMultiple(accept = '*/*', _opts?: { startingFolder?: string }): Promise<FileRef[]> {
		return chooseFiles(accept, true)
	},
	async pick(accept = '*/*', opts?: { startingFolder?: string }): Promise<FileRef | null> {
		const host = desktopHost()
		if (host && (await host.supports('files', 'pick'))) {
			return host.files.pick(accept, { startingFolder: opts?.startingFolder })
		}

		return (await chooseFiles(accept, false))[0] ?? null
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
