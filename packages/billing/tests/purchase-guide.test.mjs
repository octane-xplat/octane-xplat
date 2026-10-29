import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { createStore } from '../../ui/src/store.ts'

const source = await readFile(
	new URL('../../demos/src/billing-guide/purchases.ts', import.meta.url),
	'utf8',
)
const exports = {}
vm.runInNewContext(
	ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }),
	{
		exports,
		require: () => ({ createStore }),
	},
)
const { createPurchaseSession } = exports
const product = { id: 'premium', title: 'Premium', displayPrice: '$4.99', type: 'inapp' }
const purchase = {
	productId: 'premium',
	transactionId: 'txn-1',
	receiptToken: 'opaque-proof',
	state: 'purchased',
	isAcknowledged: false,
	native: {},
}
const reply = (body, status = 200) => ({ ok: status === 200, status, json: async () => body })
function fixture({ ready = true, supported = true, verify, finish, available = [] } = {}) {
	let listener,
		errorListener,
		entitled = false,
		connected = false,
		disconnected = false
	const calls = []
	const store = {
		supported,
		canMakePayments: () => ready,
		connect: () => {
			connected = true
		},
		disconnect: () => {
			disconnected = true
		},
		onPurchase: (fn) => {
			listener = fn
			return () => {
				listener = undefined
			}
		},
		onPurchaseError: (fn) => {
			errorListener = fn
			return () => {
				errorListener = undefined
			}
		},
		fetchProducts: async () => [product],
		getAvailablePurchases: async () => available,
		requestPurchase: async () => {
			calls.push('request')
		},
		finishTransaction: async (p, options) => {
			calls.push(['finish', p, options])
			await finish?.()
		},
	}
	const request = async (path, init) => {
		calls.push(path)
		if (path === '/api/entitlements') {return reply({ premium: entitled })}
		const body = JSON.parse(init.body)
		if (verify) {return verify(body)}
		entitled = true
		return reply({ granted: true, transactionId: body.transactionId, productId: body.productId })
	}
	const owner = createPurchaseSession({ store, request, platform: 'android', productId: 'premium' })
	return {
		owner,
		calls,
		store,
		emit: (items) => listener(items),
		error: (error) => errorListener(error),
		setReady: () => {
			ready = true
		},
		connected: () => connected,
		disconnected: () => disconnected,
	}
}
const settled = () => new Promise((resolve) => setImmediate(resolve))

test('localized product loads, while an opened purchase sheet never grants access', async () => {
	const f = fixture()
	await f.owner.start()
	assert.equal(f.owner.state.getSnapshot().product.displayPrice, '$4.99')
	await f.owner.buy()
	assert.equal(f.owner.state.getSnapshot().unlocked, false)
	assert.equal(f.owner.state.getSnapshot().busy, true)
	assert.equal(f.calls.filter((c) => c === '/api/purchases/verify').length, 0)
})

test('pending, cancelled and failed store outcomes do not finish or grant', async () => {
	const f = fixture()
	await f.owner.start()
	f.emit([{ ...purchase, state: 'pending' }])
	await settled()
	assert.equal(f.owner.state.getSnapshot().pending, true)
	await f.owner.buy()
	assert.equal(f.calls.includes('request'), false)
	f.error({ code: 'USER_CANCELLED', message: 'private store text' })
	assert.match(f.owner.state.getSnapshot().message, /cancelled/)
	assert.equal(f.owner.state.getSnapshot().pending, false)
	assert.equal(f.owner.state.getSnapshot().unlocked, false)
	assert.equal(f.calls.some(Array.isArray), false)
})

test('verification and durable server grant precede completion; repeated updates finish once', async () => {
	const f = fixture()
	await f.owner.start()
	f.emit([purchase])
	f.emit([purchase])
	await settled()
	assert.equal(f.owner.state.getSnapshot().unlocked, true)
	const finishes = f.calls.filter(Array.isArray)
	assert.equal(finishes.length, 1)
	assert.equal(finishes[0][1].native, purchase.native)
	assert.equal(finishes[0][2].consume, false)
	assert.ok(f.calls.indexOf('/api/purchases/verify') < f.calls.findIndex(Array.isArray))
})

test('invalid or unavailable backend verification leaves the transaction unfinished', async () => {
	for (const verify of [
		() => reply({ granted: false }),
		() => reply({}, 503),
		() => reply({ granted: true, transactionId: 'other', productId: 'premium' }),
	]) {
		const f = fixture({ verify })
		await f.owner.start()
		f.emit([purchase])
		await settled()
		assert.equal(f.calls.some(Array.isArray), false)
		assert.equal(f.owner.state.getSnapshot().unlocked, false)
		assert.match(f.owner.state.getSnapshot().message, /Retry Restore/)
	}
})

test('restoration retries failed completion using the same store transaction', async () => {
	let attempts = 0
	const f = fixture({
		available: [purchase],
		finish: () => {
			if (++attempts === 1) {throw new Error('offline')}
		},
	})
	await f.owner.start()
	assert.match(f.owner.state.getSnapshot().message, /Retry Restore/)
	await f.owner.restore()
	assert.equal(attempts, 2)
	assert.equal(f.owner.state.getSnapshot().unlocked, true)
})

test('closing an account owner retires late verification without finishing its transaction', async () => {
	let finishVerify
	const waiting = new Promise((resolve) => {
		finishVerify = resolve
	})
	const f = fixture({ verify: () => waiting })
	await f.owner.start()
	f.emit([purchase])
	await settled()
	f.owner.close()
	finishVerify(reply({ granted: true, transactionId: 'txn-1', productId: 'premium' }))
	await settled()
	assert.equal(f.disconnected(), true)
	assert.equal(f.owner.state.getSnapshot().unlocked, false)
	assert.equal(f.calls.some(Array.isArray), false)
})

test('readiness has a manual retry and unsupported hosts never open a store connection', async () => {
	const f = fixture({ ready: false })
	await f.owner.start()
	assert.equal(f.connected(), true)
	assert.equal(f.owner.state.getSnapshot().product, null)
	f.setReady()
	await f.owner.reload()
	assert.equal(f.owner.state.getSnapshot().product.id, 'premium')
	const unsupported = fixture({ supported: false })
	await unsupported.owner.start()
	assert.equal(unsupported.connected(), false)
	assert.match(unsupported.owner.state.getSnapshot().message, /unavailable/)
})

test('a rejected old transaction does not prevent processing a later valid transaction', async () => {
	const f = fixture({
		verify: (body) =>
			reply({
				granted: body.transactionId !== 'old',
				transactionId: body.transactionId,
				productId: body.productId,
			}),
	})
	await f.owner.start()
	f.emit([{ ...purchase, transactionId: 'old' }, purchase])
	await settled()
	assert.equal(f.calls.filter(Array.isArray).length, 1)
	assert.equal(f.calls.filter(Array.isArray)[0][1].transactionId, 'txn-1')
})

test('a deferred purchase rejection remains pending instead of enabling a second request', async () => {
	const f = fixture()
	f.store.requestPurchase = async () => {
		throw Object.assign(new Error('provider detail'), { code: 'DEFERRED_PAYMENT' })
	}
	await f.owner.start()
	await f.owner.buy()
	assert.equal(f.owner.state.getSnapshot().pending, true)
	assert.match(f.owner.state.getSnapshot().message, /awaiting approval/)
	assert.equal(f.owner.state.getSnapshot().unlocked, false)
})
