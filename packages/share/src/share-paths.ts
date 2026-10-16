// Shared share.file argument handling — path-kind validation, MIME
// inference, and the Android FileProvider authority. No native globals at
// module scope: the platform leaves keep those so this file stays
// import-safe on every target.

/** Authority suffix for the FileProvider this package declares under
 *  `platforms/android` — distinct from @nativescript/social-share's
 *  `${applicationId}.provider` so the two can coexist in one manifest. */
export const FILE_PROVIDER_AUTHORITY_SUFFIX = '.xplatshare'

export function fileProviderAuthority(packageName: string): string {
	return packageName + FILE_PROVIDER_AUTHORITY_SUFFIX
}

export type ShareFilePath = { kind: 'file'; path: string } | { kind: 'content'; uri: string }

/** Validate and normalize the `share.file` path argument. Returns a local
 *  filesystem path or a pass-through `content://` URI; throws for empty or
 *  non-string input, relative paths, unsupported schemes (web links belong
 *  to `share.url`), and malformed `file://` URLs. */
export function normalizeFilePath(path: unknown): ShareFilePath {
	if (typeof path !== 'string' || path.length === 0) {
		throw new Error('share.file(path) requires a non-empty path string')
	}

	if (path.startsWith('content://')) {
		return { kind: 'content', uri: path }
	}

	let local = path
	if (local.startsWith('file://')) {
		local = local.slice('file://'.length)
		try {
			local = decodeURIComponent(local)
		} catch {
			throw new Error(`share.file: malformed file:// URL '${path}'`)
		}
	} else if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(local)) {
		throw new Error(
			`share.file: unsupported URI scheme in '${path}' — pass a local path, file:// URL, or (Android) content:// URI; use share.url for web links`,
		)
	}

	if (!local.startsWith('/')) {
		throw new Error(`share.file: '${path}' is not an absolute filesystem path`)
	}

	return { kind: 'file', path: local }
}

const MIME_BY_EXTENSION: Record<string, string> = {
	mov: 'video/quicktime',
	mp4: 'video/mp4',
	m4v: 'video/x-m4v',
	'3gp': 'video/3gpp',
	webm: 'video/webm',
	mkv: 'video/x-matroska',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	heic: 'image/heic',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	pdf: 'application/pdf',
	txt: 'text/plain',
	md: 'text/markdown',
	csv: 'text/csv',
	json: 'application/json',
	html: 'text/html',
	zip: 'application/zip',
	mp3: 'audio/mpeg',
	m4a: 'audio/mp4',
	aac: 'audio/aac',
	wav: 'audio/wav',
	flac: 'audio/flac',
}

/** Best-effort MIME lookup from the file extension; `null` when the
 *  extension is absent or unmapped so the caller can apply its own
 *  fallback. */
export function mimeTypeFromName(name: string): string | null {
	const dot = name.lastIndexOf('.')
	if (dot < 0 || dot === name.length - 1) {
		return null
	}

	return MIME_BY_EXTENSION[name.slice(dot + 1).toLowerCase()] ?? null
}
