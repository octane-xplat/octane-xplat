import type { InitStripeParams, PaymentSheetSetupParams, PresentPaymentSheetResult } from './types'
export interface StripeBackend {
	available(): boolean
	initialize(options: InitStripeParams): Promise<void>
	prepare(options: PaymentSheetSetupParams): Promise<void>
	present(): Promise<PresentPaymentSheetResult>
	reset(): Promise<void>
	handleURL(url: string): Promise<boolean>
}
