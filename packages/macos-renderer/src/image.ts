/** Local and embedded sources avoid synchronous network work on AppKit's main thread. */
export function loadImage(source: unknown): NSImage | null {
	const src = String(source ?? '')
	const match = /^data:[^,]*;base64,(.+)$/s.exec(src)
	if (match) {
		const data = NSData.alloc().initWithBase64EncodedStringOptions(match[1], 0)
		return data ? NSImage.alloc().initWithData(data) : null
	}

	if (src.startsWith('file://')) {
		return NSImage.alloc().initWithContentsOfURL(NSURL.URLWithString(src))
	}

	if (src && !/^[a-z][a-z\d+.-]*:/i.test(src)) {
		return NSImage.alloc().initWithContentsOfFile(src)
	}

	if (src) {
		console.warn('[macos-image] Unsupported source; use a base64 data URI or local file')
	}

	return null
}
