import { Application } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { PrintBackend } from './backend-types'
import { invoke, fileResult } from './native-reply'
interface Engine {
	render(activity: android.app.Activity, json: string, callback: object): void
	present(activity: android.app.Activity, json: string, callback: object): void
	remove(uri: string): boolean
}
interface Constructor {
	new (): Engine
	Completion: { new (implementation: { complete(json: string): void }): object }
}
function constructor(): Constructor | undefined {
	return (
		globalThis as unknown as { com?: { octanexplat?: { print?: { PrintEngine?: Constructor } } } }
	).com?.octanexplat?.print?.PrintEngine
}
let instance: Engine | undefined
function engine(): Engine {
	const Type = constructor()
	if (!Type) {
		throw new UnavailabilityError('Print native Android bridge; rebuild the app after installation')
	}
	return (instance ??= new Type())
}
function activity(): android.app.Activity {
	const value = Application.android.foregroundActivity
	if (!value) {
		throw new Error('A foreground Android activity is required to print or export HTML')
	}
	return value
}
function completion(callback: (json: string) => void): object {
	const Type = constructor()
	if (!Type) {
		throw new UnavailabilityError('Print native Android bridge')
	}
	return new Type.Completion({ complete: callback })
}
export const backend: PrintBackend = {
	capabilities() {
		const present = typeof android !== 'undefined' && Boolean(constructor())
		return { print: present, printToFile: present, selectPrinter: false }
	},
	async print(options) {
		if (options.printerUrl !== undefined || options.useMarkupFormatter) {
			throw new UnavailabilityError('Print printerUrl / markup formatter outside iOS')
		}
		const host = engine(),
			view = activity()
		await invoke(
			(callback) => host.present(view, JSON.stringify(options), completion(callback)),
			() => undefined,
		)
	},
	async file(options) {
		if (options.useMarkupFormatter) {
			throw new UnavailabilityError('Print markup formatter outside iOS')
		}
		const host = engine(),
			view = activity()
		return invoke(
			(callback) => host.render(view, JSON.stringify(options), completion(callback)),
			fileResult,
		)
	},
	async select() {
		throw new UnavailabilityError('Print.selectPrinterAsync outside iOS')
	},
	remove(uri) {
		if (!engine().remove(uri)) {
			throw new Error('Could not remove the PDF export')
		}
	},
}
