// Files — native leaf. FileRef wraps an opaque native URI. App-document paths
// are still used for writes; picked Android SAF references may be content://
// URIs and must be read through ContentResolver.
import { openFilePicker } from '@nativescript-community/ui-document-picker'
import { Application, File, knownFolders, path } from '@nativescript/core'
import type { FileRef } from './types'

const docs = () => knownFolders.documents()

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
		const cursor = activity
			?.getContentResolver()
			?.query(nativeUri ?? android.net.Uri.parse(uri), null, null, null, null)

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

export const files = {
	/** Opens the platform document picker and returns its opaque native URI. */
	async pick(accept = '*/*', opts?: { startingFolder?: string }): Promise<FileRef | null> {
		const { extensions, mimeTypes } = pickerTypes(accept)
		const result = await openFilePicker({
			extensions,
			mimeTypes,
			multipleSelection: false,
			permissions: { read: true, persistable: true },
			startingFolder: opts?.startingFolder,
		})

		const uri = result.files?.[0]

		if (!uri) {
			return null
		}

		const name = androidDisplayName(uri, result.android) ?? fallbackName(uri)
		return { name, uri }
	},
	async readText(ref: FileRef): Promise<string> {
		if (ref.uri.startsWith('content://')) {
			return readContentUri(ref.uri)
		}

		return File.fromPath(ref.uri).readText()
	},
	async writeText(name: string, text: string): Promise<FileRef> {
		const p = path.join(docs().path, name)
		const f = File.fromPath(p)
		f.writeTextSync(text)
		return { name, uri: p }
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
