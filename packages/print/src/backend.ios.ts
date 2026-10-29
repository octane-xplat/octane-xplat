import { Application } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { PrintBackend } from './backend-types'
import { invoke, fileResult, printerResult } from './native-reply'
interface Engine {
	canPrint(): boolean
	renderCompletion(json: string, completion: (result: string) => void): void
	presentPresenterCompletion(
		json: string,
		presenter: UIViewController,
		completion: (result: string) => void,
	): void
	selectCompletion(presenter: UIViewController, completion: (result: string) => void): void
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
		throw new UnavailabilityError('Print native iOS bridge; rebuild the app after installation')
	}
	return value
}
function presenter(): UIViewController {
	let value = Application.ios.rootController
	while (value?.presentedViewController) {
		value = value.presentedViewController
	}
	if (!value) {
		throw new Error('A foreground iOS presenter is required')
	}
	return value
}
export const backend: PrintBackend = {
	capabilities() {
		const host = engine(),
			printing = host?.canPrint() ?? false
		return { print: printing, printToFile: Boolean(host), selectPrinter: printing }
	},
	async print(options) {
		const host = required(),
			view = presenter()
		await invoke(
			(callback) => host.presentPresenterCompletion(JSON.stringify(options), view, callback),
			() => undefined,
		)
	},
	async file(options) {
		if (options.textZoom !== 100) {
			throw new UnavailabilityError('Print textZoom outside Android')
		}
		const host = required()
		return invoke(
			(callback) => host.renderCompletion(JSON.stringify(options), callback),
			fileResult,
		)
	},
	async select() {
		const host = required(),
			view = presenter()
		return invoke((callback) => host.selectCompletion(view, callback), printerResult)
	},
	remove(uri) {
		if (!required().remove(uri)) {
			throw new Error('Could not remove the PDF export')
		}
	},
}
