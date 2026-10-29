import { backend } from './backend'
import { printOptions, fileOptions } from './options'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { PrintOptions, FilePrintOptions, FilePrintResult, Printer } from './types'
let busy = false
const owned = new Set<string>()
async function operation<T>(
	available: boolean,
	name: string,
	action: () => Promise<T>,
): Promise<T> {
	if (!available) {
		throw new UnavailabilityError(name)
	}
	if (busy) {
		throw Object.assign(new Error('A print operation is already active'), {
			code: 'ERR_PRINT_BUSY',
		})
	}
	busy = true
	try {
		return await action()
	} finally {
		busy = false
	}
}
/** Open the system print UI. Promise semantics depend on the platform; physical printing is never guaranteed. */
export async function printAsync(options: PrintOptions): Promise<void> {
	const snapshot = printOptions(options)
	return operation(backend.capabilities().print, 'Print.printAsync', () => backend.print(snapshot))
}
/** Create a real PDF cache file; unsupported browser exports reject without opening a dialog.
 * @example
 * ```ts
 * import { printToFileAsync, releasePrintFile } from '@octane-xplat/print'
 * export async function exportReceipt(consume: (uri: string) => Promise<void>) {
 *   const result = await printToFileAsync({ html: '<h1>Receipt</h1>' })
 *   try { await consume(result.uri) } finally { releasePrintFile(result) }
 * }
 * ```
 */
export async function printToFileAsync(options: FilePrintOptions = {}): Promise<FilePrintResult> {
	const snapshot = fileOptions(options)
	return operation(backend.capabilities().printToFile, 'Print.printToFileAsync', async () => {
		const result = await backend.file(snapshot)
		owned.add(result.uri)
		return result
	})
}
/** Pick an AirPrint destination on iOS. Cancellation rejects. */
export function selectPrinterAsync(): Promise<Printer> {
	return operation(backend.capabilities().selectPrinter, 'Print.selectPrinterAsync', () =>
		backend.select(),
	)
}
/** Delete only PDF exports owned by this package. Unknown/previously released results are harmless. */
export function releasePrintFile(result: FilePrintResult | string): void {
	const uri = typeof result === 'string' ? result : result.uri
	if (!owned.has(uri)) {
		return
	}
	backend.remove(uri)
	owned.delete(uri)
}
/** Discover operation support before showing a print or PDF-export action. */
export const Print = {
	get supported() {
		const value = backend.capabilities()
		return value.print || value.printToFile || value.selectPrinter
	},
	get capabilities() {
		return backend.capabilities()
	},
	printAsync,
	printToFileAsync,
	selectPrinterAsync,
	releasePrintFile,
}
