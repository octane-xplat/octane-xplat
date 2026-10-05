// Files — native leaf. FileRef wraps an opaque native URI. App-document paths
// are still used for writes; picked Android SAF references may be content://
// URIs and must be read through ContentResolver.
import { openFilePicker, saveFile } from '@nativescript-community/ui-document-picker'
import { Application, File, getFileAccess, knownFolders, path } from '@nativescript/core'
import { assertSafeFileName, exactBuffer, fileTooLarge, throwIfAborted } from './file-bytes'
import type { FileExportOptions, FileExportResult, FileReadBytesOptions, FileRef, Files } from './types'

const docs = () => knownFolders.documents()
const READ_CHUNK = 64 * 1024
const ANDROID_EXPORT_REQUEST_CODE = 1241

function pickerTypes(accept: string): { extensions: string[]; mimeTypes: string[] } {
	const values = accept
		.split(',')
		.map((value) => value.trim())
		.filter(Boolean)

	return {
		extensions: values.filter((value) => value.startsWith('.')).map((value) => value.slice(1)),
		// `*/*` is the default, not a useful iOS UTType MIME value. Leaving it
		// out lets the upstream picker use its public.data fallback.
		mimeTypes: values.filter((value) => value.includes('/') && value !== '*/*'),
	}
}

function androidDisplayName(uri: string, nativeUri: any): string | undefined {
	if (!Application.android || !uri.startsWith('content://')) {
		return undefined
	}

	try {
		const activity = Application.android.foregroundActivity ?? Application.android.startActivity
		// Android accepts null for projection/filter args; its generated
		// declarations omit that nullable bridge contract.
		const noColumns = null as unknown as string[]
		const noFilter = null as unknown as string
		const cursor = activity
			?.getContentResolver()
			?.query(nativeUri ?? android.net.Uri.parse(uri), noColumns, noFilter, noColumns, noFilter)

		if (!cursor) {
			return undefined
		}

		try {
			if (!cursor.moveToFirst()) {
				return undefined
			}

			const index = cursor.getColumnIndex('display_name')
			return index >= 0 ? cursor.getString(index) : undefined
		} finally {
			cursor.close()
		}
	} catch {
		return undefined
	}
}

function fallbackName(uri: string): string {
	const segment = uri.split('/').pop() ?? ''
	try {
		return decodeURIComponent(segment) || 'document'
	} catch {
		return segment || 'document'
	}
}

async function readContentUri(uri: string): Promise<string> {
	const activity = Application.android?.foregroundActivity ?? Application.android?.startActivity
	const input = activity?.getContentResolver()?.openInputStream(android.net.Uri.parse(uri))

	if (!input) {
		throw new Error(`Unable to open picked file: ${uri}`)
	}

	const reader = new java.io.BufferedReader(new java.io.InputStreamReader(input))
	const lines: string[] = []
	try {
		let line: string | null
		while ((line = reader.readLine()) !== null) {
			lines.push(line)
		}

		return lines.join('\n')
	} finally {
		reader.close()
	}
}

async function pickFiles(
	accept: string,
	multiple: boolean,
	opts?: { startingFolder?: string },
): Promise<FileRef[]> {
	const { extensions, mimeTypes } = pickerTypes(accept)
	const result = await openFilePicker({
		extensions,
		mimeTypes,
		multipleSelection: multiple,
		permissions: { read: true, persistable: true },
		startingFolder: opts?.startingFolder,
	})

	return (result.files ?? []).map((uri, index) => ({
		name: androidDisplayName(uri, index === 0 ? result.android : undefined) ?? fallbackName(uri),
		uri,
	}))
}

// openInputStream accepts content:// and file:// schemes; bare paths go
// through FileInputStream. Returns null when the resolver cannot open the URI.
function openAndroidInput(uri: string): any {
	const activity = Application.android?.foregroundActivity ?? Application.android?.startActivity
	if (uri.startsWith('content://') || uri.startsWith('file://')) {
		return activity?.getContentResolver()?.openInputStream(android.net.Uri.parse(uri))
	}

	return new java.io.FileInputStream(uri)
}

function readAndroidBytes(uri: string, opts?: FileReadBytesOptions): Uint8Array {
	const input = openAndroidInput(uri)
	if (!input) {
		throw new Error(`Unable to open picked file: ${uri}`)
	}

	const out = new java.io.ByteArrayOutputStream()
	const chunk = Array.create('byte', READ_CHUNK)
	try {
		let count: number
		while ((count = input.read(chunk)) !== -1) {
			throwIfAborted(opts?.signal)
			out.write(chunk, 0, count)
			if (opts?.maxBytes != null && out.size() > opts.maxBytes) {
				throw fileTooLarge(uri, opts.maxBytes)
			}
		}
	} finally {
		input.close()
	}

	// ArrayBuffer.from converts a Java byte[] — an NS Android runtime builtin.
	return new Uint8Array((ArrayBuffer as any).from(out.toByteArray()))
}

// Picked iOS refs come from the picker's Import mode, so they are app-owned
// copies — no security-scoped access needed. Single-pick URIs keep their
// percent-encoding, so fall back to a decoded path when the literal misses.
function iosFilePath(uri: string): string {
	let p = uri.startsWith('file://') ? uri.slice('file://'.length) : uri
	if (NSFileManager.defaultManager.fileExistsAtPath(p)) {
		return p
	}

	try {
		const decoded = decodeURIComponent(p)
		if (decoded !== p && NSFileManager.defaultManager.fileExistsAtPath(decoded)) {
			return decoded
		}
	} catch {}

	return p
}

function readIosBytes(uri: string, opts?: FileReadBytesOptions): Uint8Array {
	const p = iosFilePath(uri)
	const handle = NSFileHandle.fileHandleForReadingAtPath(p)
	if (!handle) {
		throw new Error(`Unable to open picked file: ${uri}`)
	}

	const out = NSMutableData.new()
	try {
		while (true) {
			throwIfAborted(opts?.signal)
			const data = handle.readDataOfLength(READ_CHUNK)
			if (!data || data.length === 0) {
				break
			}

			out.appendData(data)
			if (opts?.maxBytes != null && out.length > opts.maxBytes) {
				throw fileTooLarge(uri, opts.maxBytes)
			}
		}
	} finally {
		handle.closeFile()
	}

	return new Uint8Array(interop.bufferFromData(out))
}

// ContentResolver.openOutputStream accepts content:// and file:// URIs; bare
// paths go through FileOutputStream. The WritableByteChannel adapter writes
// the full buffer per the OutputStream contract — no chunked short writes.
function writeAndroidBytes(uri: string, bytes: Uint8Array): void {
	const activity = Application.android?.foregroundActivity ?? Application.android?.startActivity
	const out: java.io.OutputStream =
		uri.startsWith('content://') || uri.startsWith('file://')
			? activity?.getContentResolver()?.openOutputStream(android.net.Uri.parse(uri))
			: new java.io.FileOutputStream(uri)

	if (!out) {
		throw new Error(`Unable to open destination: ${uri}`)
	}

	try {
		java.nio.channels.Channels.newChannel(out).write(exactBuffer(bytes) as any)
	} finally {
		out.close()
	}
}

function androidExport(
	name: string,
	bytes: Uint8Array,
	opts?: FileExportOptions,
): Promise<FileExportResult> {
	const activity = Application.android?.foregroundActivity ?? Application.android?.startActivity
	if (!activity) {
		return Promise.resolve('unavailable')
	}

	const Intent = android.content.Intent
	const intent = new Intent(Intent.ACTION_CREATE_DOCUMENT)
	intent.addCategory(Intent.CATEGORY_OPENABLE)
	intent.setType(opts?.mimeType ?? '*/*')
	intent.putExtra(Intent.EXTRA_TITLE, name)
	intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION)

	return new Promise<FileExportResult>((resolve, reject) => {
		const onEvent = (event: any) => {
			if (event.requestCode !== ANDROID_EXPORT_REQUEST_CODE) {
				return
			}

			Application.android.off(Application.android.activityResultEvent, onEvent)
			const uri = event.intent?.getData?.()
			if (event.resultCode !== android.app.Activity.RESULT_OK || !uri) {
				resolve('cancelled')
				return
			}

			try {
				writeAndroidBytes(uri.toString(), bytes)
				try {
					activity
						.getContentResolver()
						.takePersistableUriPermission(uri, Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
				} catch {
					// Not every provider grants persistable permission; the write
					// already committed, so the result stays 'saved'.
				}

				resolve('saved')
			} catch (error) {
				reject(error)
			}
		}

		Application.android.on(Application.android.activityResultEvent, onEvent)
		try {
			activity.startActivityForResult(intent, ANDROID_EXPORT_REQUEST_CODE)
		} catch (error) {
			Application.android.off(Application.android.activityResultEvent, onEvent)
			reject(error)
		}
	})
}

async function iosExport(name: string, bytes: Uint8Array): Promise<FileExportResult> {
	// saveFile writes a temp copy and presents UIDocumentPickerViewController in
	// export-as-copy mode; it resolves true after the system commits the copy
	// to the chosen destination and false on cancel.
	const nsData = NSData.dataWithBytesLength(bytes as any, bytes.byteLength)
	const saved = await saveFile({ name, data: nsData })
	try {
		knownFolders.temp().getFile(name).removeSync()
	} catch {}

	return saved ? 'saved' : 'cancelled'
}

export const files: Files = {
	async pickMultiple(accept = '*/*', opts?: { startingFolder?: string }): Promise<FileRef[]> {
		return pickFiles(accept, true, opts)
	},
	async pick(accept = '*/*', opts?: { startingFolder?: string }): Promise<FileRef | null> {
		return (await pickFiles(accept, false, opts))[0] ?? null
	},
	async readText(ref: FileRef): Promise<string> {
		if (ref.uri.startsWith('content://')) {
			return readContentUri(ref.uri)
		}

		return File.fromPath(Application.android ? ref.uri : iosFilePath(ref.uri)).readText()
	},
	async readBytes(ref: FileRef, opts?: FileReadBytesOptions): Promise<Uint8Array> {
		throwIfAborted(opts?.signal)
		return Application.android ? readAndroidBytes(ref.uri, opts) : readIosBytes(ref.uri, opts)
	},
	async writeText(name: string, text: string): Promise<FileRef> {
		assertSafeFileName(name)
		const p = path.join(docs().path, name)
		const f = File.fromPath(p)
		f.writeTextSync(text)
		return { name, uri: p }
	},
	async writeBytes(name: string, bytes: Uint8Array): Promise<FileRef> {
		assertSafeFileName(name)
		const p = path.join(docs().path, name)
		if (Application.android) {
			writeAndroidBytes(p, bytes)
		} else {
			getFileAccess().writeBufferSync(p, bytes as any)
		}

		return { name, uri: p }
	},
	async export(
		name: string,
		bytes: Uint8Array,
		opts?: FileExportOptions,
	): Promise<FileExportResult> {
		assertSafeFileName(name)
		return Application.android ? androidExport(name, bytes, opts) : iosExport(name, bytes)
	},
	release(ref: FileRef): void {
		const cachePrefix = knownFolders.temp().path + '/'
		if (!ref.uri.startsWith(cachePrefix)) {
			return
		}

		try {
			File.fromPath(ref.uri).removeSync()
		} catch {}
	},
}
