import { File, Http, knownFolders, path } from '@nativescript/core'

let serial = 0

/** Resolve app paths and own only downloads created for this operation. */
export async function mobileSource(uri: string): Promise<{ uri: string; release(): void }> {
	if (/^https?:\/\//i.test(uri)) {
		const local = path.join(
			knownFolders.temp().path,
			`xplat-image-source-${Date.now()}-${++serial}`,
		)
		const release = () => {
			if (File.exists(local)) {
				File.fromPath(local).removeSync()
			}
		}
		try {
			await Http.getFile(uri, local)
			return { uri: local, release }
		} catch (error) {
			release()
			throw error
		}
	}
	if (uri.startsWith('file://')) {
		return { uri: decodeURIComponent(uri.slice(7)), release() {} }
	}
	if (uri.startsWith('~/')) {
		return { uri: path.join(knownFolders.currentApp().path, uri.slice(2)), release() {} }
	}
	return { uri, release() {} }
}

export function encodedSource(uri: string): string {
	const match = /^data:image\/[^;,]+;base64,([\s\S]+)$/i.exec(uri)
	if (!match) {
		throw new TypeError('Image data URIs must contain base64-encoded image bytes')
	}
	return match[1]
}

export function removeOutput(uri: string): void {
	const local = decodeURIComponent(uri.replace(/^file:\/\//, ''))
	if (File.exists(local)) {
		File.fromPath(local).removeSync()
	}
}
