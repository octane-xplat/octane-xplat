import type { StripeBackend } from './backend-types'
import type {
	InitStripeParams,
	PaymentSheetSetupParams,
	InitPaymentSheetResult,
	PresentPaymentSheetResult,
} from './types'
import { UnavailabilityError } from '@octane-xplat/lib/capability'

function fail(message: string): InitPaymentSheetResult {
	return { error: { code: 'Failed', message } }
}
function object(
	value: unknown,
	keys: string[],
	name: string,
): asserts value is Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${name} must be an object`)
	}
	if (Object.keys(value).some((key) => !keys.includes(key))) {
		throw new TypeError(`Unsupported ${name} option`)
	}
}
function text(value: unknown, name: string): asserts value is string {
	if (typeof value !== 'string' || !value.trim()) {
		throw new TypeError(`${name} must be a nonempty string`)
	}
}
function stripeOptions(options: InitStripeParams): InitStripeParams {
	object(
		options,
		['publishableKey', 'stripeAccountId', 'merchantIdentifier', 'urlScheme'],
		'initStripe',
	)
	if (
		typeof options.publishableKey !== 'string' ||
		!/^pk_(test|live)_[A-Za-z0-9]+$/.test(options.publishableKey)
	) {
		throw new TypeError('Use a Stripe publishable key; never pass a secret key')
	}
	for (const key of ['stripeAccountId', 'merchantIdentifier', 'urlScheme'] as const) {
		if (options[key] !== undefined) {
			text(options[key], key)
		}
	}
	if (options.urlScheme !== undefined && !/^[a-z][a-z0-9+.-]*$/i.test(options.urlScheme)) {
		throw new TypeError('urlScheme must contain a scheme without ://')
	}
	return { ...options }
}
function sheetOptions(
	options: PaymentSheetSetupParams,
	config: InitStripeParams,
): PaymentSheetSetupParams {
	object(
		options,
		[
			'merchantDisplayName',
			'paymentIntentClientSecret',
			'returnURL',
			'applePay',
			'googlePay',
			'primaryButtonLabel',
		],
		'PaymentSheet',
	)
	text(options.merchantDisplayName, 'merchantDisplayName')
	if (
		typeof options.paymentIntentClientSecret !== 'string' ||
		!/^pi_[A-Za-z0-9]+_secret_[A-Za-z0-9]+$/.test(options.paymentIntentClientSecret)
	) {
		throw new TypeError('Use a PaymentIntent client secret from your backend')
	}
	if (options.primaryButtonLabel !== undefined) {
		text(options.primaryButtonLabel, 'primaryButtonLabel')
	}
	if (options.returnURL !== undefined) {
		text(options.returnURL, 'returnURL')
		const protocol = options.returnURL.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase()
		if (!protocol || !['https', 'http', config.urlScheme?.toLowerCase()].includes(protocol)) {
			throw new TypeError('returnURL must use HTTP(S) or the configured app scheme')
		}
		if (
			protocol === 'http' &&
			!/^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::[0-9]+)?(?:\/|$)/i.test(options.returnURL)
		) {
			throw new TypeError(
				'HTTP return URLs are restricted to loopback development hosts; use HTTPS',
			)
		}
	}
	if (options.applePay !== undefined) {
		object(options.applePay, ['merchantCountryCode'], 'applePay')
		if (!/^[A-Z]{2}$/.test(String(options.applePay.merchantCountryCode))) {
			throw new TypeError('Apple Pay needs a two-letter uppercase country code')
		}
	}
	if (options.googlePay !== undefined) {
		object(options.googlePay, ['merchantCountryCode', 'currencyCode', 'testEnv'], 'googlePay')
		if (!/^[A-Z]{2}$/.test(String(options.googlePay.merchantCountryCode))) {
			throw new TypeError('Google Pay needs a two-letter uppercase country code')
		}
		if (
			options.googlePay.currencyCode !== undefined &&
			!/^[A-Z]{3}$/.test(options.googlePay.currencyCode)
		) {
			throw new TypeError('Use a three-letter uppercase currency code')
		}
		if (options.googlePay.testEnv !== undefined && typeof options.googlePay.testEnv !== 'boolean') {
			throw new TypeError('testEnv must be boolean')
		}
	}
	return {
		...options,
		...(options.applePay && { applePay: { ...options.applePay } }),
		...(options.googlePay && { googlePay: { ...options.googlePay } }),
	}
}

/** Internal coordinator: one application-scoped Stripe configuration and one owned checkout. */
export function createStripeClient(backend: StripeBackend) {
	let configuration: InitStripeParams | undefined
	let prepared = false
	let busy = false
	const assertAvailable = () => {
		if (!backend.available()) {
			throw new UnavailabilityError('Stripe PaymentSheet')
		}
	}
	return {
		get supported() {
			return backend.available()
		},
		async initStripe(options: InitStripeParams): Promise<void> {
			if (busy) {
				throw new Error('Stripe is busy; wait for the current operation to finish')
			}
			const snapshot = stripeOptions(options)
			assertAvailable()
			busy = true
			configuration = undefined
			prepared = false
			try {
				await backend.reset()
				await backend.initialize(snapshot)
				configuration = snapshot
			} finally {
				busy = false
			}
		},
		async initPaymentSheet(options: PaymentSheetSetupParams): Promise<InitPaymentSheetResult> {
			if (busy) {
				return fail('Stripe is busy; wait for the current operation to finish')
			}
			if (!configuration) {
				return fail('Call initStripe before initializing PaymentSheet')
			}
			busy = true
			prepared = false
			let snapshot: PaymentSheetSetupParams | undefined
			let validationError: string | undefined
			try {
				snapshot = sheetOptions(options, configuration)
				assertAvailable()
			} catch (error) {
				validationError =
					error instanceof Error ? error.message : 'Invalid PaymentSheet configuration'
			}
			try {
				await backend.reset()
				if (!snapshot || validationError) {
					return fail(validationError ?? 'Invalid PaymentSheet configuration')
				}
				await backend.prepare(snapshot)
				prepared = true
				return {}
			} catch {
				await backend.reset().catch(() => {})
				return fail(
					'PaymentSheet could not be initialized; check your backend, native setup and network',
				)
			} finally {
				busy = false
			}
		},
		async presentPaymentSheet(): Promise<PresentPaymentSheetResult> {
			if (busy) {
				return fail('Stripe is busy; wait for the current operation to finish')
			}
			if (!prepared) {
				return fail('Call initPaymentSheet before presenting checkout')
			}
			busy = true
			try {
				const result = await backend.present()
				if (!result.error) {
					prepared = false
					try {
						await backend.reset()
					} catch {
						return fail(
							'Checkout finished but cleanup failed. Verify the payment with your server before retrying.',
						)
					}
				}
				return result
			} catch {
				return fail('PaymentSheet could not be presented')
			} finally {
				busy = false
			}
		},
		async resetPaymentSheet(): Promise<InitPaymentSheetResult> {
			if (busy) {
				return fail('Stripe is busy; finish or cancel checkout first')
			}
			busy = true
			prepared = false
			try {
				await backend.reset()
				return {}
			} catch {
				return fail('PaymentSheet could not be released')
			} finally {
				busy = false
			}
		},
		async handleURLCallback(url: string): Promise<boolean> {
			if (!configuration) {
				return false
			}
			text(url, 'url')
			const protocol = url.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase()
			if (!protocol || protocol !== configuration.urlScheme?.toLowerCase()) {
				return false
			}
			return backend.handleURL(url)
		},
	}
}
