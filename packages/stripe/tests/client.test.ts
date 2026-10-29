import { expect, it, vi } from 'vitest'
import { createStripeClient } from '../src/client'
import type { StripeBackend } from '../src/backend-types'
import type { PresentPaymentSheetResult } from '../src/types'

const config = { publishableKey: 'pk_test_fixture', urlScheme: 'testapp' }
const options = {
	merchantDisplayName: 'Fixture',
	paymentIntentClientSecret: 'pi_fixture_secret_fixture',
	returnURL: 'testapp://checkout',
}
function fixture() {
	const backend = {
		available: () => true,
		initialize: vi.fn(async () => {}),
		prepare: vi.fn(async () => {}),
		present: vi.fn(async (): Promise<PresentPaymentSheetResult> => ({})),
		reset: vi.fn(async () => {}),
		handleURL: vi.fn(async () => true),
	} satisfies StripeBackend
	return { backend, client: createStripeClient(backend) }
}
function deferred<T>() {
	let resolve!: (value: T) => void
	const promise = new Promise<T>((done) => {
		resolve = done
	})
	return { promise, resolve }
}

it('rejects secret keys before calling the SDK and snapshots mutable wallet settings', async () => {
	const { client, backend } = fixture()
	await expect(client.initStripe({ publishableKey: 'sk_test_notpublic' })).rejects.toThrow(
		'publishable',
	)
	expect(backend.initialize).not.toHaveBeenCalled()
	await client.initStripe(config)
	const applePay = { merchantCountryCode: 'US' }
	const pending = client.initPaymentSheet({ ...options, applePay })
	applePay.merchantCountryCode = 'CA'
	expect(await pending).toEqual({})
	expect(backend.prepare.mock.calls[0]?.[0].applePay?.merchantCountryCode).toBe('US')
})
it('invalidates a previous sheet when replacement options are invalid', async () => {
	const { client, backend } = fixture()
	await client.initStripe(config)
	await client.initPaymentSheet(options)
	expect(
		(await client.initPaymentSheet({ ...options, customFlow: true } as never)).error,
	).toBeDefined()
	expect((await client.presentPaymentSheet()).error).toBeDefined()
	expect(backend.present).not.toHaveBeenCalled()
})
it('blocks overlapping presentation, replacement, reconfiguration and disposal', async () => {
	const { client, backend } = fixture()
	await client.initStripe(config)
	await client.initPaymentSheet(options)
	const pending = deferred<PresentPaymentSheetResult>()
	backend.present.mockReturnValueOnce(pending.promise)
	const first = client.presentPaymentSheet()
	expect((await client.presentPaymentSheet()).error?.message).toContain('busy')
	expect((await client.initPaymentSheet(options)).error?.message).toContain('busy')
	expect((await client.resetPaymentSheet()).error?.message).toContain('busy')
	await expect(client.initStripe(config)).rejects.toThrow('busy')
	pending.resolve({ error: { code: 'Canceled', message: 'Canceled' }, didCancel: true })
	expect((await first).didCancel).toBe(true)
	expect(await client.presentPaymentSheet()).toEqual({})
	expect((await client.presentPaymentSheet()).error).toBeDefined()
	expect(backend.present).toHaveBeenCalledTimes(2)
})
it('never returns raw SDK failures or client secrets and releases failed initialization', async () => {
	const { client, backend } = fixture()
	await client.initStripe(config)
	backend.prepare.mockRejectedValueOnce(new Error(options.paymentIntentClientSecret))
	const result = await client.initPaymentSheet(options)
	expect(JSON.stringify(result)).not.toContain(options.paymentIntentClientSecret)
	expect((await client.presentPaymentSheet()).error).toBeDefined()
	expect(backend.reset).toHaveBeenCalledTimes(3)
})
it('passes only the configured URL scheme to the SDK and reports unsupported hosts safely', async () => {
	const { client, backend } = fixture()
	expect(await client.handleURLCallback('testapp://checkout')).toBe(false)
	await client.initStripe(config)
	expect(await client.handleURLCallback('otherapp://checkout')).toBe(false)
	expect(await client.handleURLCallback('testapp://checkout')).toBe(true)
	expect(backend.handleURL).toHaveBeenCalledTimes(1)
	backend.available = () => false
	expect(client.supported).toBe(false)
	await expect(client.initStripe(config)).rejects.toThrow()
})

it('requires encryption for return URLs outside local development', async () => {
	const { client, backend } = fixture()
	await client.initStripe(config)
	expect(
		(await client.initPaymentSheet({ ...options, returnURL: 'http://store.example.com/return' }))
			.error?.message,
	).toContain('HTTPS')
	expect(backend.prepare).not.toHaveBeenCalled()
	expect(
		await client.initPaymentSheet({ ...options, returnURL: 'http://localhost:3000/return' }),
	).toEqual({})
})
