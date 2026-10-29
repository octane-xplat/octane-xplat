import { Application, File, Label, Page, knownFolders, path } from '@nativescript/core'
import {
	Stripe,
	initStripe,
	initPaymentSheet,
	presentPaymentSheet,
	resetPaymentSheet,
	handleURLCallback,
} from '@octane-xplat/stripe'

const activeApplicationState = 0 // UIApplicationStateActive from UIKit.
const folder = knownFolders.documents().path
const request = JSON.parse(
	File.fromPath(path.join(folder, 'stripe-request.json')).readTextSync(),
) as { nonce: string }
const checks: string[] = []
function assert(condition: unknown, message: string) {
	if (!condition) {
		throw new Error(message)
	}
	checks.push(message)
}
async function waitFor(predicate: () => boolean) {
	const deadline = Date.now() + 15000
	while (!predicate()) {
		if (Date.now() >= deadline) {
			throw new Error('Timed out waiting for the native presenter')
		}
		await new Promise<void>((resolve) => setTimeout(resolve, 50))
	}
}
const page = new Page(),
	label = new Label()
label.text = 'Packed Stripe SDK guard checks'
page.content = label
let started = false
page.on(Page.loadedEvent, () => {
	if (started) {
		return
	}
	started = true
	void (async () => {
		try {
			await waitFor(
				() =>
					UIApplication.sharedApplication.applicationState === activeApplicationState &&
					Boolean(Application.ios.rootController?.viewIfLoaded?.window),
			)
			assert(Stripe.supported, 'packed package resolves the compiled native bridge')
			assert(
				!Application.ios.rootController?.presentedViewController,
				'native presenter starts idle',
			)
			await initStripe({ publishableKey: 'pk_test_fixture', urlScheme: 'testapp' })
			const options = {
				merchantDisplayName: 'Xplat packed Stripe fixture',
				paymentIntentClientSecret: 'pi_fixture_secret_fixture',
				returnURL: 'testapp://checkout',
			}
			assert(!(await initPaymentSheet(options)).error, 'SPM SDK prepares the guest sheet')
			let finished = false
			const pending = presentPaymentSheet()
			void pending.then(
				() => {
					finished = true
				},
				() => {
					finished = true
				},
			)
			assert(Boolean((await presentPaymentSheet()).error), 'duplicate presentation is rejected')
			assert(Boolean((await resetPaymentSheet()).error), 'active presentation cannot be reset')
			await waitFor(
				() => Boolean(Application.ios.rootController?.presentedViewController) || finished,
			)
			assert(
				Boolean(Application.ios.rootController?.presentedViewController),
				'real SPM SDK loading controller becomes presented',
			)
			assert(
				(await pending).error?.code === 'Failed',
				'invalid public fixtures fail in the real SPM SDK',
			)
			await waitFor(() => !Application.ios.rootController?.presentedViewController)
			assert(
				!Application.ios.rootController?.presentedViewController,
				'failed checkout releases the native presenter',
			)
			assert(!(await resetPaymentSheet()).error, 'idle prepared sheet can be reset')
			assert(Boolean((await presentPaymentSheet()).error), 'disposed sheet cannot present')
			assert(
				!(await handleURLCallback('anotherapp://checkout')),
				'foreign return URL remains unhandled',
			)
			assert(
				!(await handleURLCallback('testapp://unrelated')),
				'unrecognized registered URL remains unhandled',
			)
			File.fromPath(path.join(folder, 'stripe-result.json')).writeTextSync(
				JSON.stringify({ nonce: request.nonce, passed: true, checks }),
			)
		} catch (error) {
			File.fromPath(path.join(folder, 'stripe-result.json')).writeTextSync(
				JSON.stringify({ nonce: request.nonce, passed: false, checks, error: String(error) }),
			)
		}
	})()
})
Application.run({ create: () => page })
