export interface FileRef {
	name: string
	/**
	 * Opaque reference: blob/object URL on web, filesystem path on native.
	 * `files.writeText()` downloads on web and writes a file on native.
	 */
	uri: string
}
