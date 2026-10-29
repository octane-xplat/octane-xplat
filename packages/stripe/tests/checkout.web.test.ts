// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'

const fixture = vi.hoisted(() => {
	const handlers: Record<string, () => void> = {}
	const element = {
		on: vi.fn((name: string, callback: () => void) => {
			handlers[name] = callback
		}),
		mount: vi.fn(),
		destroy: vi.fn(),
	}
	const elements = {
		create: vi.fn(() => element),
		submit: vi.fn(async (): Promise<{ error?: { message: string } }> => ({})),
	}
	const sdk = {
		retrievePaymentIntent: vi.fn(),
		elements: vi.fn(() => elements),
		confirmPayment: vi.fn(),
	}
	return { handlers, element, elements, sdk, loadStripe: vi.fn(async () => sdk) }
})
vi.mock('@stripe/stripe-js/pure', () => ({ loadStripe: fixture.loadStripe }))
import { backend } from '../src/backend.web'
const options = {
	merchantDisplayName: 'Store',
	paymentIntentClientSecret: 'pi_fixture_secret_fixture',
	returnURL: 'https://example.com/checkout-return',
}
const turn = () => new Promise((done) => setTimeout(done, 0))
beforeEach(async () => {
	vi.clearAllMocks()
	document.body.replaceChildren()
	document.head.replaceChildren()
	HTMLDialogElement.prototype.showModal = function () {
		this.open = true
	}
	HTMLDialogElement.prototype.close = function () {
		this.open = false
		this.dispatchEvent(new Event('close'))
	}
	fixture.sdk.retrievePaymentIntent.mockResolvedValue({
		paymentIntent: { status: 'requires_payment_method', payment_method_types: ['card'] },
	})
	fixture.sdk.confirmPayment.mockResolvedValue({ paymentIntent: { status: 'succeeded' } })
	fixture.elements.submit.mockResolvedValue({})
	await backend.reset()
	await backend.initialize({ publishableKey: 'pk_test_fixture' })
})
it('mounts SDK-owned input, cancels without confirmation and releases modal ownership', async () => {
	const focus = document.createElement('button')
	document.body.append(focus)
	focus.focus()
	await backend.prepare(options)
	const pending = backend.present()
	expect(document.querySelector('dialog')?.open).toBe(true)
	expect(fixture.element.mount).toHaveBeenCalledTimes(1)
	expect(document.querySelector('input')).toBeNull()
	document.querySelector<HTMLButtonElement>('button[type=button]')!.click()
	expect((await pending).error?.code).toBe('Canceled')
	expect(fixture.sdk.confirmPayment).not.toHaveBeenCalled()
	expect(fixture.element.destroy).toHaveBeenCalledTimes(1)
	expect(document.querySelector('dialog')).toBeNull()
	expect(document.activeElement).toBe(focus)
})
it('keeps a declined checkout open for retry and prevents concurrent confirmation or cancellation', async () => {
	await backend.prepare(options)
	const pending = backend.present()
	fixture.handlers.ready()
	const form = document.querySelector('form')!
	const cancel = document.querySelector<HTMLButtonElement>('button[type=button]')!
	fixture.sdk.confirmPayment.mockResolvedValueOnce({ error: { message: 'Your card was declined' } })
	form.dispatchEvent(new Event('submit', { cancelable: true }))
	form.dispatchEvent(new Event('submit', { cancelable: true }))
	cancel.click()
	await turn()
	expect(fixture.sdk.confirmPayment).toHaveBeenCalledTimes(1)
	expect(document.querySelector('[role=status]')?.textContent).toBe('Your card was declined')
	expect(document.querySelector('dialog')).not.toBeNull()
	form.dispatchEvent(new Event('submit', { cancelable: true }))
	expect(await pending).toEqual({})
	expect(fixture.element.destroy).toHaveBeenCalledTimes(1)
	expect(document.querySelector('style')).toBeNull()
})
it('rejects non-card web Intents and handles failed hosted input without retaining DOM', async () => {
	fixture.sdk.retrievePaymentIntent.mockResolvedValueOnce({
		paymentIntent: {
			status: 'requires_payment_method',
			payment_method_types: ['card', 'us_bank_account'],
		},
	})
	await expect(backend.prepare(options)).rejects.toThrow('card-only')
	await backend.prepare(options)
	const pending = backend.present()
	fixture.handlers.loaderror()
	expect((await pending).error?.code).toBe('Failed')
	expect(document.querySelector('dialog')).toBeNull()
	expect(fixture.element.destroy).toHaveBeenCalledTimes(1)
	expect(fixture.sdk.confirmPayment).not.toHaveBeenCalled()
})
it('reports unsupported browser hosts without loading Stripe', () => {
	const original = HTMLDialogElement.prototype.showModal
	Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
		configurable: true,
		value: undefined,
		writable: true,
	})
	expect(backend.available()).toBe(false)
	HTMLDialogElement.prototype.showModal = original
})
