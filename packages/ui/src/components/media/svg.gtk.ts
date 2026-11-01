// GTK owns source decoding and asynchronous I/O. Keep URI and data sources
// intact instead of requiring browser fetch/atob in the shared native helper.
export { glyphSvgMarkup, isSvgSrc } from './svg-source'
export function svgSource(src: string): string {
	return src
}
