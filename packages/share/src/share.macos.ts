// Native AppKit picker owned by this package; no harness-global dependency.
import { normalizeFilePath } from './share-paths'
import type { Share, ShareFileOptions, ShareResult } from './types'

interface NativeShare {
	shareKindValueSubjectCompletion(kind: string, value: string, subject: string, done: (result: string) => void): void
}
declare const XplatShare: NativeShare

function present(kind: 'text' | 'url' | 'file', value: string, subject?: string): Promise<ShareResult> {
	if (typeof XplatShare === 'undefined' || typeof XplatShare.shareKindValueSubjectCompletion !== 'function') {return Promise.resolve('unavailable')}
	return new Promise<ShareResult>((resolve) => {
		XplatShare.shareKindValueSubjectCompletion(kind, value, subject ?? '', (result) => {
			resolve(result === 'shared' || result === 'cancelled' ? result : 'unavailable')
		})
	})
}

function localFile(path: string): string {
	if (typeof path === 'string' && /^file:\/\//i.test(path)) {
		// Accept local URLs only. Raw query/fragment delimiters are URL syntax;
		// encoded '?'/'#' remain valid filename characters after decoding.
		if (/[?#]/.test(path)) {throw new Error('share.file: file URLs cannot contain a query or fragment')}
		const match = /^file:\/\/([^/]*)(\/.*)$/i.exec(path)
		if (!match || (match[1] !== '' && match[1].toLowerCase() !== 'localhost')) {throw new Error('share.file: file URL authority must be local')}
		path = 'file://' + match[2]
	}
	const input = normalizeFilePath(path)
	if (input.kind !== 'file') {throw new Error('share.file: content:// URIs are Android-only')}
	if (input.path.includes('\0')) {throw new Error('share.file: paths cannot contain NUL')}
	return input.path
}

export const share: Share = {
	async text(text: string, subject?: string) { return present('text', text, subject) },
	async url(url: string, title?: string) { return present('url', url, title) },
	async file(path: string, _options?: ShareFileOptions): Promise<ShareResult> {
		return present('file', localFile(path))
	},
}
