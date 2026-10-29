// Foundation's public ObjC API is available through the AppKit metadata bridge.
declare const NSString: {
	stringWithString(value: string): {
		dataUsingEncoding(encoding: number): {
			base64EncodedStringWithOptions(options: number): string
		} | null
	}
}

export function svgDataUri(markup: string): string {
	const data = NSString.stringWithString(markup).dataUsingEncoding(4) // NSUTF8StringEncoding
	if (!data) {
		throw new Error('Unable to encode SVG as UTF-8')
	}

	return `data:image/svg+xml;base64,${data.base64EncodedStringWithOptions(0)}`
}

/** Normalize bundled markup and SVG data URIs for AppKit's image host. */
export function appKitImageSource(src: string): string {
	if (src.trimStart().startsWith('<svg') || src.trimStart().startsWith('<?xml')) {
		return svgDataUri(src)
	}

	if (
		/^data:image\/svg\+xml[;,]/i.test(src) &&
		!src.slice(0, src.indexOf(',')).endsWith(';base64')
	) {
		return svgDataUri(decodeURIComponent(src.slice(src.indexOf(',') + 1)))
	}

	return src
}
