/** Configure Stripe with a public key. Secret keys belong only on your server. */
export interface InitStripeParams {
	publishableKey: string
	stripeAccountId?: string
	/** iOS merchant ID configured in your app's Apple Pay entitlement. */
	merchantIdentifier?: string
	/** Registered app URL scheme, without ://. */
	urlScheme?: string
}
/** Native Apple Pay configuration; ignored on other platforms, matching Stripe's SDK. */
export interface ApplePayParams {
	merchantCountryCode: string
}
/** Native Google Pay configuration; ignored on other platforms. */
export interface GooglePayParams {
	merchantCountryCode: string
	currencyCode?: string
	/** Use Google's test environment. Defaults to false. */
	testEnv?: boolean
}
/** Guest PaymentIntent checkout subset of Stripe's React Native SetupParams.
 * Web requires a server-created Intent restricted to payment_method_types: ['card'].
 * Customer sessions, SetupIntents and customFlow are not part of this version.
 */
export interface PaymentSheetSetupParams {
	merchantDisplayName: string
	paymentIntentClientSecret: string
	returnURL?: string
	applePay?: ApplePayParams
	googlePay?: GooglePayParams
	primaryButtonLabel?: string
}
/** Stable Stripe PaymentSheet error categories. */
export const PaymentSheetError = {
	Failed: 'Failed',
	Canceled: 'Canceled',
	Timeout: 'Timeout',
} as const
/** A category returned by checkout; cancellation is a normal user outcome. */
export type PaymentSheetError = (typeof PaymentSheetError)[keyof typeof PaymentSheetError]
/** Error response without client secrets or raw SDK objects. */
export interface StripeError<T extends string = PaymentSheetError> {
	code: T
	message: string
	localizedMessage?: string
}
/** Empty success or a Stripe-shaped error. Success is not server-side payment verification. */
export type InitPaymentSheetResult = { error?: StripeError }
/** The SDK flow finished, failed, or was canceled. Fulfil orders only after server verification. */
export type PresentPaymentSheetResult = { error?: StripeError; didCancel?: boolean }
