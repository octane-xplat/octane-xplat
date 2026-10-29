import { loadStripe } from '@stripe/stripe-js/pure'
import type { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js'
import type { InitStripeParams, PaymentSheetSetupParams, PresentPaymentSheetResult } from './types'
import type { StripeBackend } from './backend-types'

let stripe: Stripe | null = null
let prepared: PaymentSheetSetupParams | undefined
const available = () =>
	typeof document !== 'undefined' &&
	typeof HTMLDialogElement !== 'undefined' &&
	typeof HTMLDialogElement.prototype.showModal === 'function' &&
	window.isSecureContext !== false
const failed = (): PresentPaymentSheetResult => ({
	error: {
		code: 'Failed',
		message: 'Secure checkout could not load; check your connection and Stripe configuration',
	},
})

export const backend: StripeBackend = {
	available,
	async initialize(options: InitStripeParams) {
		stripe = null
		const loaded = await loadStripe(options.publishableKey, {
			...(options.stripeAccountId && { stripeAccount: options.stripeAccountId }),
		})
		if (!loaded) {
			throw new Error('Stripe.js could not load')
		}
		stripe = loaded
	},
	async prepare(options) {
		if (!stripe) {
			throw new Error('Initialize Stripe first')
		}
		const returnURL = options.returnURL ? new URL(options.returnURL) : null
		if (!returnURL || !['https:', 'http:'].includes(returnURL.protocol)) {
			throw new Error('Web checkout requires an HTTP(S) returnURL')
		}
		const result = await stripe.retrievePaymentIntent(options.paymentIntentClientSecret)
		if (result.error || !result.paymentIntent) {
			throw new Error('The PaymentIntent is unavailable')
		}
		if (result.paymentIntent.payment_method_types.some((type) => type !== 'card')) {
			throw new Error('This web checkout requires a card-only PaymentIntent')
		}
		if (
			!['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(
				result.paymentIntent.status,
			)
		) {
			throw new Error('This PaymentIntent cannot start a new checkout')
		}
		prepared = options
	},
	async present() {
		const sdk = stripe,
			options = prepared
		if (!sdk || !options || !available()) {
			return failed()
		}
		return new Promise<PresentPaymentSheetResult>((resolve) => {
			const previousFocus = document.activeElement
			const dialog = document.createElement('dialog')
			dialog.className = 'xplat-stripe-dialog'
			dialog.setAttribute('aria-label', `Pay ${options.merchantDisplayName}`)
			const style = document.createElement('style')
			style.textContent =
				'.xplat-stripe-dialog{box-sizing:border-box;width:min(480px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;padding:24px;border:1px solid #ccc;border-radius:12px;background:#fff;color:#111;font:16px system-ui}.xplat-stripe-dialog::backdrop{background:rgb(0 0 0 / .45)}.xplat-stripe-dialog h2{margin:0 0 20px}.xplat-stripe-dialog footer{display:flex;gap:12px;margin-top:20px}.xplat-stripe-dialog button{font:inherit;padding:10px 16px}.xplat-stripe-dialog [role=status]{min-height:1em}'
			const title = document.createElement('h2')
			title.textContent = options.merchantDisplayName
			const form = document.createElement('form'),
				mount = document.createElement('div'),
				status = document.createElement('p'),
				footer = document.createElement('footer')
			status.setAttribute('role', 'status')
			const cancel = document.createElement('button'),
				submit = document.createElement('button')
			cancel.type = 'button'
			cancel.textContent = 'Cancel'
			submit.type = 'submit'
			submit.textContent = options.primaryButtonLabel ?? 'Pay'
			submit.disabled = true
			footer.append(cancel, submit)
			form.append(mount, status, footer)
			dialog.append(title, form)
			let element: StripePaymentElement | undefined, elements: StripeElements | undefined
			let finished = false,
				confirming = false
			const events = new AbortController()
			const finish = (result: PresentPaymentSheetResult) => {
				if (finished) {
					return
				}
				finished = true
				events.abort()
				try {
					element?.destroy()
				} finally {
					if (dialog.open) {
						dialog.close()
					}
					dialog.remove()
					style.remove()
					if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
						previousFocus.focus()
					}
					resolve(result)
				}
			}
			const canceled = () =>
				finish({
					error: { code: 'Canceled', message: 'The payment flow was canceled' },
					didCancel: true,
				})
			cancel.addEventListener(
				'click',
				() => {
					if (!confirming) {
						canceled()
					}
				},
				{ signal: events.signal },
			)
			dialog.addEventListener(
				'cancel',
				(event) => {
					event.preventDefault()
					if (!confirming) {
						canceled()
					}
				},
				{ signal: events.signal },
			)
			dialog.addEventListener(
				'close',
				() => {
					if (!confirming) {
						canceled()
					}
				},
				{ signal: events.signal },
			)
			form.addEventListener(
				'submit',
				(event) => {
					event.preventDefault()
					if (confirming || finished || !elements) {
						return
					}
					confirming = true
					cancel.disabled = true
					submit.disabled = true
					status.textContent = 'Processing payment…'
					const currentElements = elements
					void (async () => {
						try {
							const validation = await currentElements.submit()
							if (validation.error) {
								status.textContent = validation.error.message ?? 'Check the payment form'
								return
							}
							const result = await sdk.confirmPayment({
								elements: currentElements,
								confirmParams: { return_url: options.returnURL! },
								redirect: 'if_required',
							})
							if (result.error) {
								status.textContent = result.error.message ?? 'The payment could not be completed'
								return
							}
							if (
								result.paymentIntent &&
								['succeeded', 'processing', 'requires_capture'].includes(
									result.paymentIntent.status,
								)
							) {
								finish({})
							} else {
								status.textContent = 'Payment is incomplete. Check its status before trying again.'
							}
						} catch {
							status.textContent =
								'Could not reach the payment service. Check payment status before trying again.'
						} finally {
							confirming = false
							if (!finished) {
								cancel.disabled = false
								submit.disabled = false
							}
						}
					})()
				},
				{ signal: events.signal },
			)
			try {
				document.head.append(style)
				document.body.append(dialog)
				dialog.showModal()
				elements = sdk.elements({ clientSecret: options.paymentIntentClientSecret, loader: 'auto' })
				element = elements.create('payment', { wallets: { applePay: 'never', googlePay: 'never' } })
				element.on('ready', () => {
					if (!finished) {
						submit.disabled = false
					}
				})
				element.on('loaderror', () => finish(failed()))
				element.mount(mount)
			} catch {
				finish(failed())
			}
		})
	},
	async reset() {
		prepared = undefined
	},
	async handleURL() {
		return false
	},
}
