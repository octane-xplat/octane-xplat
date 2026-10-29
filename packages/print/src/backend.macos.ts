import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { PrintBackend } from './backend-types'
import { invoke, fileResult } from './native-reply'
interface Engine {
	canPrint(): boolean
	renderCompletion(json: string, completion: (result: string) => void): void
	presentCompletion(json: string, completion: (result: string) => void): void
	remove(uri: string): boolean
}
let instance: Engine | undefined
function engine(): Engine | undefined {
	const Type = (globalThis as unknown as { XplatPrintEngine?: { new: () => Engine } })
		.XplatPrintEngine
	return (instance ??= Type?.new())
}
function required(): Engine {
	const value = engine()
	if (!value) {
		throw new UnavailabilityError('Print native AppKit bridge; rebuild the app after installation')
	}
	return value
}
export const backend: PrintBackend = {
	capabilities() {
		const host = engine()
		return { print: host?.canPrint() ?? false, printToFile: Boolean(host), selectPrinter: false }
	},
	async print(options) {
		if (options.printerUrl !== undefined || options.useMarkupFormatter) {
			throw new UnavailabilityError('Print printerUrl / markup formatter outside iOS')
		}
		const host = required()
		await invoke(
			(callback) => host.presentCompletion(JSON.stringify(options), callback),
			() => undefined,
		)
	},
	async file(options) {
		if (options.useMarkupFormatter || options.textZoom !== 100) {
			throw new UnavailabilityError('Print markup formatter / textZoom on AppKit')
		}
		const host = required()
		return invoke(
			(callback) => host.renderCompletion(JSON.stringify(options), callback),
			fileResult,
		)
	},
	async select() {
		throw new UnavailabilityError('Print.selectPrinterAsync outside iOS')
	},
	remove(uri) {
		if (!required().remove(uri)) {
			throw new Error('Could not remove the PDF export')
		}
	},
}
