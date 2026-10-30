/** Outcome of a share call. 'copied' is only returned by clipboard-fallback
 *  paths; 'unavailable' means no share path exists on this platform — it is
 *  a resolved result, not a rejection. */
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'unavailable'

/** Options for Share.file(). All members are platform hints — iOS/macOS
 *  type the item from the file itself. */
export interface ShareFileOptions {
	/** Title for the Android share chooser; other platforms show their own UI. */
	subject?: string
	/** MIME type handed to the Android share intent — inferred from the file
	 *  extension when omitted, falling back to `application/octet-stream`.
	 *  Ignored on iOS/macOS, which type the item from the file itself. */
	mimeType?: string
}

/** Platform share-sheet façade for text, URLs, and local files. */
export interface Share {
	/** Present the platform share sheet with text. */
	text(text: string, subject?: string): Promise<ShareResult>
	/** Present the platform share sheet with a URL. */
	url(url: string, title?: string): Promise<ShareResult>
	/**
	 * Present the platform share sheet with a local file. Accepted `path`
	 * kinds: an absolute filesystem path, a `file://` URL, or — Android
	 * only — a `content://` URI, which is shared directly without the
	 * FileProvider hop. Web links belong to `share.url`.
	 *
	 * Resolves `'shared'` once the platform sheet/service completes (iOS/macOS) or the
	 * chooser launches (Android — `ACTION_SEND` reports no outcome), and
	 * `'cancelled'` when the user dismisses the sheet (iOS/macOS/web). Resolves
	 * `'unavailable'` when the file can't be reached, no presenter is
	 * attached, or the platform has no file-share path (browsers — the Web
	 * Share API needs a `File` handle, not a path). Rejects when `path`
	 * isn't a supported kind or the Android FileProvider integration is
	 * broken — those are setup errors, not share outcomes.
	 */
	file(path: string, options?: ShareFileOptions): Promise<ShareResult>
}

export declare const share: Share
