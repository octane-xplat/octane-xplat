import { Application } from '@nativescript/core'
import type { StripeBackend } from './backend-types'
import type { PaymentSheetSetupParams } from './types'
interface Bridge {
	initialize(context: android.content.Context, json: string): void
	present(activity: android.app.Activity, json: string, listener: object): void
	Listener: { new (implementation: { complete(code: string): void }): object }
}
function bridge(): Bridge | undefined {
	return (
		globalThis as unknown as {
			com?: { octanexplat?: { stripe?: { PaymentSheetBridge?: Bridge } } }
		}
	).com?.octanexplat?.stripe?.PaymentSheetBridge
}
let prepared: PaymentSheetSetupParams | undefined
export const backend: StripeBackend = {
	available: () =>
		typeof android !== 'undefined' && android.os.Build.VERSION.SDK_INT >= 23 && Boolean(bridge()),
	async initialize(options) {
		const native = bridge()
		if (!native || !Application.android.context) {
			throw new Error('Rebuild Android with the Stripe plugin')
		}
		native.initialize(Application.android.context, JSON.stringify(options))
	},
	async prepare(options) {
		prepared = options
	},
	async present() {
		const native = bridge(),
			activity = Application.android.foregroundActivity,
			options = prepared
		if (!native || !activity || !options) {
			throw new Error('An active Android checkout presenter is required')
		}
		return new Promise((resolve) =>
			native.present(
				activity,
				JSON.stringify(options),
				new native.Listener({
					complete: (code) =>
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
				}),
			),
		)
	},
	async reset() {
		prepared = undefined
	},
	async handleURL() {
		return false
	},
}
