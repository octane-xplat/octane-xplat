export interface FileRef {
	name: string
	/**
	 * Opaque reference: blob/object URL on web, filesystem path on native.
	 * `files.writeText()`/`files.writeBytes()` download on web and write the
	 * app sandbox on native. Picked Android files may use `content://` URIs.
	 */
	uri: string
}

export interface FilePickOptions {
	startingFolder?: string
}

export interface FileReadBytesOptions {
	/**
	 * Reject with a too-large error once the file exceeds this many bytes.
	 * Enforced while reading, so oversized sources are never fully loaded.
	 */
	maxBytes?: number
	/** Abort an in-progress read. Rejects with an `AbortError`. */
	signal?: AbortSignal
}

export interface FileExportOptions {
	/**
	 * MIME type hint for the destination — the Android SAF action type and the
	 * web save picker's accept filter. Ignored on iOS.
	 */
	mimeType?: string
}

/**
 * `saved`: the platform committed the bytes to the chosen destination —
 * bytes flushed through `ContentResolver` on Android, the export-as-copy
 * picker's destination commit on iOS, or a closed `FileSystemWritableFileStream`
 * on web. `cancelled`: the user dismissed the destination UI. `unavailable`:
 * the platform offers no qualified export surface (browser without the
 * File System Access API, the AppKit leaf).
 */
export type FileExportResult = 'saved' | 'cancelled' | 'unavailable'

/** Shared contract every platform leaf implements. */
export interface Files {
	/** Opens the platform document picker and returns its first opaque URI. */
	pick(accept?: string, opts?: FilePickOptions): Promise<FileRef | null>
	/** Opens the platform document picker and returns selected opaque URIs. */
	pickMultiple(accept?: string, opts?: FilePickOptions): Promise<FileRef[]>
	readText(ref: FileRef): Promise<string>
	/**
	 * Reads the full binary content of a picked or sandbox-written ref.
	 * Android `content://` refs are read through `ContentResolver`; iOS picker
	 * refs are app-owned import copies; web reads the backing `Blob` directly
	 * or fetches foreign URLs.
	 */
	readBytes(ref: FileRef, opts?: FileReadBytesOptions): Promise<Uint8Array>
	writeText(name: string, text: string): Promise<FileRef>
	/**
	 * Writes bytes inside the app sandbox (native) or starts a browser
	 * download (web) and returns a ref suitable for `readBytes`/`release`.
	 */
	writeBytes(name: string, bytes: Uint8Array): Promise<FileRef>
	/**
	 * User-directed export to a destination the user picks: the Android SAF
	 * create action, iOS export-as-copy picker, web `showSaveFilePicker`.
	 * Only one export can be in flight — a concurrent call rejects with an
	 * `ExportBusyError`.
	 */
	export(name: string, bytes: Uint8Array, opts?: FileExportOptions): Promise<FileExportResult>
	/** Free the ref's backing resource (revoke object URLs, delete temp copies). */
	release(ref: FileRef): void
}
