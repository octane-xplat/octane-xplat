import { Application } from '@nativescript/core'
import type { StripeBackend } from './backend-types'
import type { InitStripeParams } from './types'
interface NativeSheet {
	initialize(json: string): boolean
	prepare(json: string): boolean
	presentCompletion(presenter: UIViewController, completion: (code: string) => void): void
	reset(): boolean
	handleURL(value: string): boolean
}
type NativeConstructor = { new: () => NativeSheet }
function constructor(): NativeConstructor | undefined {
	return (globalThis as unknown as { XplatStripePaymentSheet?: NativeConstructor })
		.XplatStripePaymentSheet
}
let sheet: NativeSheet | undefined
let configuration: InitStripeParams | undefined
export const backend: StripeBackend = {
	available: () => typeof UIApplication !== 'undefined' && Boolean(constructor()),
	async initialize(options) {
		const Type = constructor()
		if (!Type) {
			throw new Error('Include the Stripe Swift package and native source in your iOS build')
		}
		sheet = Type.new()
		if (!sheet.initialize(JSON.stringify(options))) {
			throw new Error('Stripe initialization failed')
		}
		configuration = options
	},
	async prepare(options) {
		if (options.applePay && !configuration?.merchantIdentifier) {
			throw new Error('Apple Pay needs a configured merchantIdentifier')
		}
		if (!sheet?.prepare(JSON.stringify(options))) {
			throw new Error('PaymentSheet preparation failed')
		}
	},
	async present() {
		let presenter = Application.ios.rootController
		while (presenter?.presentedViewController) {
			presenter = presenter.presentedViewController
		}
		const native = sheet
		if (!presenter || !native) {
			throw new Error('A foreground iOS presenter is required')
		}
		return new Promise((resolve) =>
			native.presentCompletion(presenter, (code) =>
				resolve(
					code === ''
						? {}
						: {
								error: {
									code: code === 'Canceled' ? 'Canceled' : 'Failed',
									message:
										code === 'Canceled'
											? 'The payment flow was canceled'
											: 'The payment could not be completed',
								},
								...(code === 'Canceled' && { didCancel: true }),
							},
				),
			),
		)
	},
	async reset() {
		if (sheet && !sheet.reset()) {
			throw new Error('Checkout is still presenting')
		}
	},
	async handleURL(url) {
		return sheet?.handleURL(url) ?? false
	},
}
