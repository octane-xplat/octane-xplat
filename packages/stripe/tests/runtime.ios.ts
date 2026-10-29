import { Application } from '@nativescript/core'
import {
	Stripe,
	initStripe,
	initPaymentSheet,
	presentPaymentSheet,
	resetPaymentSheet,
	handleURLCallback,
} from '../src/index'
type Context = {
	assert(name: string, actual: unknown, expected?: unknown): void
	waitFor<T>(predicate: () => T, options?: { timeout?: number }): Promise<NonNullable<T>>
}
/** Invalid public fixtures exercise the SDK failure path and cannot authorize a charge. */
export async function run(ctx: Context) {
	ctx.assert('official bridge available', Stripe.supported)
	await initStripe({ publishableKey: 'pk_test_fixture', urlScheme: 'testapp' })
	const options = {
		merchantDisplayName: 'Xplat Stripe fixture',
		paymentIntentClientSecret: 'pi_fixture_secret_fixture',
		returnURL: 'testapp://checkout',
	}
	ctx.assert('guest sheet prepared', !(await initPaymentSheet(options)).error)
	const pending = presentPaymentSheet()
	ctx.assert('duplicate presentation rejected', Boolean((await presentPaymentSheet()).error))
	ctx.assert('active sheet cannot be reset', Boolean((await resetPaymentSheet()).error))
	const result = await pending
	ctx.assert('invalid public fixture fails in the real SDK', result.error?.code, 'Failed')
	await ctx.waitFor(() => !Application.ios.rootController?.presentedViewController, {
		timeout: 10000,
	})
	ctx.assert('native presenter released', !Application.ios.rootController?.presentedViewController)
	ctx.assert('idle sheet reset', !(await resetPaymentSheet()).error)
	ctx.assert('disposed sheet cannot present', Boolean((await presentPaymentSheet()).error))
	ctx.assert(
		'unrelated return URL not handled',
		await handleURLCallback('anotherapp://checkout'),
		false,
	)
	ctx.assert(
		'unrecognized registered URL not handled',
		await handleURLCallback('testapp://unrelated'),
		false,
	)
}
