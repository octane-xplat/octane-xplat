import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { PrintBackend } from './backend-types'
const unavailable = async (): Promise<never> => {
	throw new UnavailabilityError('Print on this host')
}
export const backend: PrintBackend = {
	capabilities: () => ({ print: false, printToFile: false, selectPrinter: false }),
	print: unavailable,
	file: unavailable,
	select: unavailable,
	remove() {},
}
