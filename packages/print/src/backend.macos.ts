import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { lookupGlobal } from '@octane-xplat/lib/capability'
import type { PrintBackend } from './backend-types'
import { invoke, fileResult } from './native-reply'
interface Engine {
	canPrint(): boolean
	renderCompletion(json: string, completion: (result: string) => void): void
	presentCompletion(json: string, completion: (result: string) => void): void
	remove(uri: string): boolean
}
let instance: Engine | undefined
/** The installed bridge object — `new()` is a method, not a construct signature. */
type NativeEngineFactory = { new: () => Engine }
function engine(): Engine | undefined {
	// Installed by the AppKit print host when its bridge loads.
	const Type = lookupGlobal(['XplatPrintEngine']) as NativeEngineFactory | undefined
	return (instance ??= Type?.new())
}
function required(): Engine {
	const value = engine()
	if (!value) {
		throw new UnavailabilityError('Print native AppKit bridge; rebuild the app after installation')
	}
	return value
}
// The Swift engine replies with a JSON string; the shared reply channel takes
// decoded payloads. Parse inside the engine callback.
function reply(callback: (payload: unknown) => void): (json: string) => void {
	return (json) => callback(JSON.parse(json))
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
			(callback) => host.presentCompletion(JSON.stringify(options), reply(callback)),
			() => undefined,
		)
	},
	async file(options) {
		if (options.useMarkupFormatter || options.textZoom !== 100) {
			throw new UnavailabilityError('Print markup formatter / textZoom on AppKit')
		}
		const host = required()
		return invoke(
			(callback) => host.renderCompletion(JSON.stringify(options), reply(callback)),
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
