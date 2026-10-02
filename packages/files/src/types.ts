export interface FileRef {
	name: string
	/**
	 * Opaque reference: blob/object URL on web, filesystem path on native.
	 * `files.writeText()` downloads on web and writes where implemented.
	 * Picked mobile files may use `content://` URIs.
	 */
	uri: string
}
