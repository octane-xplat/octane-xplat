import type {
	PrintOptions,
	FilePrintOptions,
	FilePrintResult,
	Printer,
	PrintCapabilities,
	PageMargins,
} from './types'
export interface PageLayout {
	width: number
	height: number
	margins: PageMargins
}
export type NormalizedPrintOptions = Omit<PrintOptions, keyof PageLayout | 'useMarkupFormatter'> &
	PageLayout & { useMarkupFormatter: boolean }
export type NormalizedFileOptions = Omit<
	FilePrintOptions,
	keyof PageLayout | 'html' | 'base64' | 'useMarkupFormatter' | 'textZoom'
> &
	PageLayout & { html: string; base64: boolean; useMarkupFormatter: boolean; textZoom: number }
export interface PrintBackend {
	capabilities(): PrintCapabilities
	print(options: NormalizedPrintOptions): Promise<void>
	file(options: NormalizedFileOptions): Promise<FilePrintResult>
	select(): Promise<Printer>
	remove(uri: string): void
}
