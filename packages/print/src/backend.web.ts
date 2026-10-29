import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { PrintBackend } from './backend-types'
let serial = 0
const available = () => typeof window !== 'undefined' && typeof window.print === 'function'
const unavailable = async (): Promise<never> => {
	throw new UnavailabilityError('Print PDF files / printer selection in a browser')
}
export const backend: PrintBackend = {
	capabilities: () => ({ print: available(), printToFile: false, selectPrinter: false }),
	async print(options) {
		if (
			options.uri !== undefined ||
			options.printerUrl !== undefined ||
			options.useMarkupFormatter
		) {
			throw new UnavailabilityError(
				'Browser printing of PDF URIs, selected printers or markup-formatter mode',
			)
		}
		if (options.html === undefined) {
			window.print()
			return
		}
		const token = String(++serial)
		const documentToPrint = new DOMParser().parseFromString(options.html, 'text/html')
		const page = documentToPrint.createElement('style')
		const m = options.margins
		page.textContent = `@page{size:${options.width}pt ${options.height}pt;margin:${m.top}pt ${m.right}pt ${m.bottom}pt ${m.left}pt}`
		documentToPrint.head.append(page)
		const mark = documentToPrint.createElement('meta')
		mark.name = 'xplat-print-owner'
		mark.content = token
		documentToPrint.head.append(mark)
		const frame = document.createElement('iframe')
		frame.title = 'Printable document'
		frame.setAttribute('sandbox', 'allow-same-origin allow-modals')
		frame.setAttribute('aria-hidden', 'true')
		frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0'
		return new Promise<void>((resolve, reject) => {
			let finished = false
			let afterPrint: (() => void) | undefined
			const cleanup = (error?: Error) => {
				if (finished) {
					return
				}
				finished = true
				clearTimeout(timer)
				frame.removeEventListener('load', loaded)
				if (afterPrint) {
					frame.contentWindow?.removeEventListener('afterprint', afterPrint)
				}
				frame.remove()
				if (error) {
					reject(error)
				} else {
					resolve()
				}
			}
			const timer = setTimeout(
				() =>
					cleanup(
						Object.assign(
							new Error('The browser did not finish loading or dismissing the print dialog'),
							{ code: 'ERR_PRINT_TIMEOUT' },
						),
					),
				120000,
			)
			const loaded = async () => {
				const content = frame.contentDocument,
					target = frame.contentWindow
				if (
					!content ||
					!target ||
					content.querySelector('meta[name="xplat-print-owner"]')?.getAttribute('content') !== token
				) {
					return
				}
				frame.removeEventListener('load', loaded)
				try {
					await content.fonts?.ready
					if (finished) {
						return
					}
					afterPrint = () => cleanup()
					target.addEventListener('afterprint', afterPrint, { once: true })
					target.focus()
					target.print()
				} catch {
					cleanup(new Error('The browser could not open the print dialog'))
				}
			}
			frame.addEventListener('load', loaded)
			frame.srcdoc = '<!DOCTYPE html>' + documentToPrint.documentElement.outerHTML
			document.body.append(frame)
		})
	},
	file: unavailable,
	select: unavailable,
	remove() {},
}
