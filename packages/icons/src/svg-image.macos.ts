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
