// Files — web leaf. Desktop webview hosts own real pickers and file:// refs;
// outside a host this uses opaque object URLs and browser downloads.
import { desktopHost } from '@octane-xplat/platform/host/web'
import { assertSafeFileName, concatBytes, exactBuffer, fileTooLarge, throwIfAborted } from './file-bytes'
import type { FileExportOptions, FileExportResult, FileReadBytesOptions, FileRef, Files } from './types'

// Object URLs this leaf minted, keyed by URL, so readBytes returns exact bytes
// without a fetch round-trip and release can drop the backing Blob.
const objectBlobs = new Map<string, Blob>()

function mintObjectUrl(blob: Blob): string {
	const uri = URL.createObjectURL(blob)
	objectBlobs.set(uri, blob)
	return uri
}

function chooseFiles(accept: string, multiple: boolean): Promise<FileRef[]> {
	return new Promise((resolve) => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = accept
		input.multiple = multiple
		input.onchange = () => {
			const refs: FileRef[] = []
			for (const file of Array.from(input.files ?? [])) {
				refs.push({ name: file.name, uri: mintObjectUrl(file) })
			}

			resolve(refs)
		}

		input.oncancel = () => resolve([])
		input.click()
	})
}

// Capped stream read: stop as soon as the cap is exceeded instead of
// materializing the whole response.
async function fetchBytes(uri: string, opts?: FileReadBytesOptions): Promise<Uint8Array> {
	const response = await fetch(uri, { signal: opts?.signal })
	if (!response.ok) {
		throw new Error(`Unable to read file: ${uri}`)
	}

	if (opts?.maxBytes == null) {
		return new Uint8Array(await response.arrayBuffer())
	}

	const reader = response.body?.getReader()
	if (!reader) {
		const bytes = new Uint8Array(await response.arrayBuffer())
		if (bytes.byteLength > opts.maxBytes) {
			throw fileTooLarge(uri, opts.maxBytes)
		}

		return bytes
	}

	const chunks: Uint8Array[] = []
	let total = 0
	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) {
				break
			}

			total += value.byteLength
			if (total > opts.maxBytes) {
				await reader.cancel().catch(() => {})
				throw fileTooLarge(uri, opts.maxBytes)
			}

			chunks.push(value)
		}
	} finally {
		reader.releaseLock()
	}

	return concatBytes(chunks, total)
}

export const files: Files = {
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
	async readBytes(ref: FileRef, opts?: FileReadBytesOptions): Promise<Uint8Array> {
		throwIfAborted(opts?.signal)
		const blob = objectBlobs.get(ref.uri)
		if (blob) {
			if (opts?.maxBytes != null && blob.size > opts.maxBytes) {
				throw fileTooLarge(ref.name, opts.maxBytes)
			}

			return new Uint8Array(await blob.arrayBuffer())
		}

		// Host file:// refs need a host binary read, which the desktop service
		// contract does not provide; other URLs go through fetch.
		return fetchBytes(ref.uri, opts)
	},
	/** Desktop hosts write the selected path; plain web starts a download. */
	async writeText(name: string, text: string): Promise<FileRef> {
		assertSafeFileName(name)
		const host = desktopHost()
		if (host && (await host.supports('files', 'writeText'))) {
			const file = await host.files.writeText(name, text)
			if (!file) {
				throw new Error('Host file save was cancelled')
			}

			return file
		}

		const uri = mintObjectUrl(new Blob([text], { type: 'text/plain' }))
		const a = document.createElement('a')
		a.href = uri
		a.download = name
		a.click()
		return { name, uri }
	},
	/** The desktop host contract is text-only, so bytes always download. */
	async writeBytes(name: string, bytes: Uint8Array): Promise<FileRef> {
		assertSafeFileName(name)
		const uri = mintObjectUrl(new Blob([exactBuffer(bytes)], { type: 'application/octet-stream' }))
		const a = document.createElement('a')
		a.href = uri
		a.download = name
		a.click()
		return { name, uri }
	},
	async export(
		name: string,
		bytes: Uint8Array,
		opts?: FileExportOptions,
	): Promise<FileExportResult> {
		assertSafeFileName(name)
		const picker = (window as any).showSaveFilePicker as
			| ((opts: any) => Promise<any>)
			| undefined

		if (typeof picker !== 'function') {
			return 'unavailable'
		}

		const extension = name.includes('.') ? `.${name.split('.').pop()}` : null
		const types =
			opts?.mimeType && extension ? [{ accept: { [opts.mimeType]: [extension] } }] : undefined

		try {
			const handle = await picker.call(window, { suggestedName: name, types })
			const writable = await handle.createWritable()
			await writable.write(bytes)
			await writable.close()
			return 'saved'
		} catch (error) {
			if ((error as DOMException)?.name === 'AbortError') {
				return 'cancelled'
			}

			throw error
		}
	},
	release(ref: FileRef): void {
		if (ref.uri.startsWith('blob:')) {
			objectBlobs.delete(ref.uri)
			URL.revokeObjectURL(ref.uri)
		}
	},
}
