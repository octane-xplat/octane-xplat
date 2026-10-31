import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// The native leaf wraps one @nativescript/payments Payment client. These run
// it against a scripted Payment so connection readiness, reconnects and
// purchase forwarding are checked without a store — the upstream plugin's
// contract here is: Payment.onReady fires each time a fresh client's store
// connection finishes setup, connect() is void, and purchaseProduct takes
// the fetched native product.
const source = ts.transpile(await readFile(new URL('../src/billing.ts', import.meta.url), 'utf8'), {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})

function load() {
	const instances = []
	class FakePayment {
		static isSupported() {
			return true
		}
		constructor() {
			this.ready = false
			this.calls = []
			this.products = new Map()
			instances.push(this)
		}
		connect() {
			this.calls.push('connect')
		}
		disconnect() {
			this.calls.push('disconnect')
		}
		canMakePayments() {
			return this.ready
		}
		fireReady() {
			this.ready = true
			this.onReady?.()
		}
		async fetchProducts(ids, type) {
			this.calls.push(['fetchProducts', ids, type])
			return ids.map((id) => this.products.get(`${type}:${id}`)).filter(Boolean)
		}
		async purchaseProduct(product, options) {
			this.calls.push(['purchaseProduct', product, options])
		}
		async fetchPurchases() {
			return []
		}
		async showSubscriptionsManagement() {}
	}
	const globals = {
		exports: {},
		require(id) {
			if (id === '@nativescript/payments') {
				return { Payment: FakePayment }
			}
			throw new Error(`unexpected import: ${id}`)
		},
	}
	vm.runInNewContext(source, globals)
	return { billing: globals.exports.billing, instances }
}

const races = (promise) =>
	Promise.race([
		promise.then(
			() => 'resolved',
			(error) => error,
		),
		new Promise((resolve) => setTimeout(() => resolve('pending'), 25)),
	])

// Call args produced inside the vm context carry its realm prototypes, so
// deepEqual against literals needs a realm-neutral shape.
const shape = (value) => JSON.parse(JSON.stringify(value))

test('connect resolves on store readiness; concurrent callers share the wait', async () => {
	const { billing, instances } = load()
	assert.equal(instances.length, 0)
	const first = billing.connect()
	const second = billing.connect()
	assert.equal(instances.length, 1)
	assert.equal(await races(first), 'pending')
	instances[0].fireReady()
	assert.equal(await races(first), 'resolved')
	assert.equal(await races(second), 'resolved')
})

test('connect resolves immediately once the store is ready', async () => {
	const { billing, instances } = load()
	const first = billing.connect()
	instances[0].fireReady()
	await first
	assert.equal(await races(billing.connect()), 'resolved')
})

test('canMakePayments reflects store readiness after connect resolves', async () => {
	const { billing, instances } = load()
	const pending = billing.connect()
	assert.equal(billing.canMakePayments(), false)
	instances[0].fireReady()
	await pending
	assert.equal(billing.canMakePayments(), true)
})

test('disconnect drops the client; reconnect awaits the new client readiness', async () => {
	const { billing, instances } = load()
	const first = billing.connect()
	instances[0].fireReady()
	await first
	billing.disconnect()
	assert.deepEqual(instances[0].calls, ['connect', 'disconnect'])
	const reconnect = billing.connect()
	assert.equal(instances.length, 2)
	assert.equal(await races(reconnect), 'pending')
	instances[1].fireReady()
	assert.equal(await races(reconnect), 'resolved')
})

test('requestPurchase(id) fetches as inapp and forwards the fetched product', async () => {
	const { billing, instances } = load()
	const nativeProduct = { id: 'premium', type: 'inapp' }
	const pending = billing.connect()
	instances[0].fireReady()
	await pending
	instances[0].products.set('inapp:premium', nativeProduct)
	await billing.requestPurchase('premium', { accountId: 'acct' })
	const calls = instances[0].calls
	const purchase = calls.find(([name]) => name === 'purchaseProduct')
	assert.deepEqual(shape(calls[1]), ['fetchProducts', ['premium'], 'inapp'])
	assert.equal(purchase[1], nativeProduct)
	assert.deepEqual(shape(purchase[2]), { accountId: 'acct' })
})

test('requestPurchase(id, { type }) queries the requested product catalog', async () => {
	const { billing, instances } = load()
	const nativeSub = { id: 'plan.monthly', type: 'subs' }
	const pending = billing.connect()
	instances[0].fireReady()
	await pending
	instances[0].products.set('subs:plan.monthly', nativeSub)
	await billing.requestPurchase('plan.monthly', { type: 'subs' })
	const calls = instances[0].calls
	assert.deepEqual(shape(calls[1]), ['fetchProducts', ['plan.monthly'], 'subs'])
	assert.equal(calls[2][1], nativeSub)
	assert.deepEqual(shape(calls[2][2]), {})
})

test('requestPurchase(product) forwards the native product without refetching', async () => {
	const { billing, instances } = load()
	const nativeSub = { id: 'plan.monthly', type: 'subs' }
	const pending = billing.connect()
	instances[0].fireReady()
	await pending
	instances[0].products.set('subs:plan.monthly', nativeSub)
	const [product] = await billing.fetchProducts(['plan.monthly'], 'subs')
	assert.equal(product.native, nativeSub)
	await billing.requestPurchase(product)
	const calls = instances[0].calls
	assert.equal(calls.filter(([name]) => name === 'fetchProducts').length, 1)
	assert.deepEqual(calls.at(-1)[0], 'purchaseProduct')
	assert.equal(calls.at(-1)[1], nativeSub)
	assert.deepEqual(shape(calls.at(-1)[2]), {})
})

test('requestPurchase rejects when the id is not found or the product is facade-only', async () => {
	const { billing, instances } = load()
	const pending = billing.connect()
	instances[0].fireReady()
	await pending
	await assert.rejects(() => billing.requestPurchase('missing'), { code: 'PRODUCT_UNAVAILABLE' })
	await assert.rejects(
		() => billing.requestPurchase({ id: 'x', type: 'subs' }),
		/native store reference/,
	)
})
