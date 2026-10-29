import type { NativeScriptConfig } from '@nativescript/core'

export default {
	ios: {
		SPMPackages: [
			{
				name: 'Stripe',
				libs: ['StripePaymentSheet', 'StripePayments'],
				repositoryURL: 'https://github.com/stripe/stripe-ios',
				version: '26.15.1',
			},
		],
	},
} as NativeScriptConfig
