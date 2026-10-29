/** Printer/page orientation names, matching Expo Print. */
export const Orientation = { portrait: 'portrait', landscape: 'landscape' } as const
/** A printable page orientation. */
export type Orientation = (typeof Orientation)[keyof typeof Orientation]
/** Page margins in points (1/72 inch). All four values are required. */
export interface PageMargins {
	top: number
	right: number
	bottom: number
	left: number
}
/** HTML or an existing PDF to send to the system print UI. Supply one source, or neither to print the current browser page. */
export interface PrintOptions {
	html?: string
	uri?: string
	/** HTML page width in points; defaults to 612. */
	width?: number
	/** HTML page height in points; defaults to 792. */
	height?: number
	/** iOS printer URL returned by selectPrinterAsync. */
	printerUrl?: string
	/** iOS text-only HTML formatter; defaults to false. Does not render images. */
	useMarkupFormatter?: boolean
	orientation?: Orientation
	margins?: PageMargins
}
/** HTML-to-PDF settings. Does not open a browser print dialog when file export is unavailable. */
export interface FilePrintOptions {
	html?: string
	width?: number
	height?: number
	margins?: PageMargins
	/** Include PDF bytes as base64 without a data URI prefix. Defaults to false. */
	base64?: boolean
	/** iOS text-only HTML formatter; defaults to false. */
	useMarkupFormatter?: boolean
	/** Android text zoom percentage; defaults to 100. */
	textZoom?: number
}
/** A package-owned cache file. Release it after the preview/share/upload owner finishes. */
export interface FilePrintResult {
	uri: string
	numberOfPages: number
	base64?: string
}
/** An iOS AirPrint destination. */
export interface Printer {
	name: string
	url: string
}
/** Available operations on this host, independent from a physical printer being present. */
export interface PrintCapabilities {
	print: boolean
	printToFile: boolean
	selectPrinter: boolean
}
