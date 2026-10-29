import type { Billing, Product, Purchase } from '@octane-xplat/billing'
import type { HostedAuth } from '@octane-xplat/auth'
import { createStore } from '@octane-xplat/ui/data'

interface PurchaseState {
	product: Product | null
	unlocked: boolean
	busy: boolean
	pending: boolean
	message: string
}
interface Options {
	store: Billing
	request: HostedAuth['fetch']
	platform: 'ios' | 'android'
	productId: string
}

/** One app-owned non-consumable purchase owner per signed-in account. */
export function createPurchaseSession({ store, request, platform, productId }: Options) {
	const state = createStore<PurchaseState>({
		product: null,
		unlocked: false,
		busy: false,
		pending: false,
		message: 'Loading store…',
	})
	let closed = false
	let started = false
	let queue: Promise<void> = Promise.resolve()
	let unsubscribe: (() => void)[] = []
	const finished = new Set<string>()
	const update = (patch: Partial<PurchaseState>) => {
		if (!closed) {state.update((previous) => ({ ...previous, ...patch }))}
	}
	async function refreshEntitlement() {
		const response = await request('/api/entitlements')
		if (!response.ok) {throw new Error('Entitlement check unavailable')}
		const result: unknown = await response.json()
		if (
			!result ||
			typeof result !== 'object' ||
			!('premium' in result) ||
			typeof result.premium !== 'boolean'
		) {
			throw new Error('Invalid entitlement response')
		}
		update({ unlocked: result.premium })
	}
	async function reconcileOne(purchase: Purchase) {
		if (closed) {return}
		if (purchase.productId !== productId) {return}
		if (purchase.state === 'pending') {
			update({
				busy: false,
				pending: true,
				message: 'Payment is pending. Access has not been granted.',
			})
			return
		}
		if (purchase.state !== 'purchased' || !purchase.transactionId || !purchase.receiptToken) {
			throw new Error('Unusable store transaction')
		}
		const response = await request('/api/purchases/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				platform,
				productId,
				transactionId: purchase.transactionId,
				receiptToken: purchase.receiptToken,
			}),
		})
		if (!response.ok) {throw new Error('Purchase verification unavailable')}
		const result: unknown = await response.json()
		if (
			!result ||
			typeof result !== 'object' ||
			!('granted' in result) ||
			result.granted !== true ||
			!('transactionId' in result) ||
			result.transactionId !== purchase.transactionId ||
			!('productId' in result) ||
			result.productId !== productId
		) {
			throw new Error('Purchase was not verified and recorded')
		}
		if (closed) {return}
		await refreshEntitlement()
		if (closed) {return}
		if (!finished.has(purchase.transactionId)) {
			if (platform !== 'android' || !purchase.isAcknowledged) {
				await store.finishTransaction(purchase, { consume: false })
			}
			finished.add(purchase.transactionId)
		}
		update({
			busy: false,
			pending: false,
			message: state.getSnapshot().unlocked
				? 'Premium is ready.'
				: 'Purchase recorded; access is inactive.',
		})
	}
	async function reconcile(purchases: Purchase[]) {
		for (const purchase of purchases) {
			try {
				await reconcileOne(purchase)
			} catch {
				update({
					busy: false,
					message: 'Could not verify or finish the purchase. Retry Restore purchases.',
				})
			}
		}
	}
	function enqueue(purchases: Purchase[]) {
		if (purchases.some((p) => p.productId === productId && p.state === 'purchased'))
			{update({ busy: true })}
		queue = queue
			.then(() => reconcile(purchases))
			.catch(() => {
				update({
					busy: false,
					message: 'Could not verify or finish the purchase. Retry Restore purchases.',
				})
			})
		return queue
	}
	async function restore() {
		if (closed || !started || !store.supported) {return}
		update({ busy: true, message: 'Checking purchases…' })
		try {
			await refreshEntitlement()
			const purchases = await store.getAvailablePurchases()
			await enqueue(purchases)
			if (!purchases.some((p) => p.productId === productId)) {
				update({
					pending: false,
					message: state.getSnapshot().unlocked
						? 'Premium is ready.'
						: 'No purchase found. Choose Buy when the product is loaded.',
				})
			}
			update({ busy: false })
		} catch {
			update({
				busy: false,
				message: 'Could not check purchases. Check the connection and try Restore purchases.',
			})
		}
	}
	async function start() {
		if (started || closed) {return}
		started = true
		if (!store.supported) {
			update({ message: 'Purchases are unavailable on this target.' })
			return
		}
		unsubscribe = [
			store.onPurchase((items) => {
				void enqueue(items)
			}),
			store.onPurchaseError(storeFailure),
		]
		await reload()
	}
	async function reload() {
		if (closed || !started || !store.supported) {return}
		update({ busy: true })
		try {
			store.connect()
			if (!store.canMakePayments()) {
				update({
					product: null,
					busy: false,
					message:
						'Store is connecting or payments are restricted. Check the store account, then tap Reload store.',
				})
				return
			}
			const products = await store.fetchProducts([productId], 'inapp')
			if (closed) {return}
			const product = products.find((entry) => entry.id === productId) ?? null
			update({ product })
			await restore()
			if (!product)
				{update({ message: 'Product unavailable. Check its ID and store setup, then Reload store.' })}
		} catch {
			update({
				busy: false,
				message: 'Store unavailable. Check the account and connection, then Reload store.',
			})
		}
	}
	async function buy() {
		const current = state.getSnapshot()
		if (
			closed ||
			!started ||
			!store.supported ||
			!current.product ||
			current.busy ||
			current.pending ||
			current.unlocked
		)
			{return}
		update({ busy: true, message: 'Complete the purchase in the store.' })
		try {
			await store.requestPurchase(productId)
			// Android resolves when the sheet opens. Only listeners settle the outcome.
		} catch (error) {
			storeFailure(error)
		}
	}
	function storeFailure(error: unknown) {
		const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null
		update({
			busy: false,
			pending:
				code === 'DEFERRED_PAYMENT' || (code !== 'USER_CANCELLED' && state.getSnapshot().pending),
			message:
				code === 'USER_CANCELLED'
					? 'Purchase cancelled.'
					: code === 'DEFERRED_PAYMENT'
						? 'Payment is awaiting approval.'
						: 'The store could not complete the purchase. Try again or restore.',
		})
	}
	function close() {
		if (closed) {return}
		closed = true
		for (const off of unsubscribe) {off()}
		if (started && store.supported) {store.disconnect()}
	}
	return { state, start, reload, buy, restore, close }
}
