import type { AppKitHost } from './appkit-host'

type Mutation = { value: string | null }
type Store = {
	values: Map<string, string>
	pending: Map<string, Mutation>
	busy: boolean
}
type Lifecycle = {
	owner: AppKitHost
	subscribe: NonNullable<AppKitHost['onAppStateChange']>
	flush: NonNullable<AppKitHost['storageFlush']>
	active: boolean
	remove?: () => void
}

const createStore = (): Store => ({ values: new Map(), pending: new Map(), busy: false })
const memory = createStore()
const stores = new WeakMap<AppKitHost, Store>()
let lifecycle: Lifecycle | undefined
const installedHost = () =>
	(globalThis as { __xplatAppKit?: AppKitHost }).__xplatAppKit

function retire(subscription: Lifecycle): void {
	subscription.active = false
	if (lifecycle === subscription) {lifecycle = undefined}
	const remove = subscription.remove
	subscription.remove = undefined
	try {
		remove?.()
	} catch {
		// The retired callback is inert even if native cleanup fails.
	}
}

function current(): { owner: AppKitHost | undefined; store: Store } {
	let owner = installedHost()
	if (
		lifecycle &&
		(!owner || owner !== lifecycle.owner ||
			owner.onAppStateChange !== lifecycle.subscribe ||
			owner.storageFlush !== lifecycle.flush)
	) {
		retire(lifecycle)
		owner = installedHost()
	}
	if (!owner) {return { owner, store: memory }}
	let store = stores.get(owner)
	if (!store) {
		store = createStore()
		stores.set(owner, store)
	}
	// Writes accepted before host installation remain explicit pending intent.
	// Already acknowledged values from another host never cross this boundary.
	for (const [key, mutation] of memory.pending) {store.pending.set(key, mutation)}
	memory.pending.clear()
	memory.values.clear()
	return { owner, store }
}

function acknowledge(store: Store, key: string, mutation: Mutation): void {
	if (mutation.value === null) {store.values.delete(key)}
	else {store.values.set(key, mutation.value)}
	if (store.pending.get(key) === mutation) {store.pending.delete(key)}
}

function deliver(owner: AppKitHost, key: string, mutation: Mutation): boolean {
	if (mutation.value === null) {
		if (typeof owner.storageRemove !== 'function') {return false}
		owner.storageRemove(key)
	} else {
		if (typeof owner.storageSet !== 'function') {return false}
		owner.storageSet(key, mutation.value)
	}
	return true
}

function flushStore(owner: AppKitHost | undefined, store: Store): boolean {
	if (!owner || store.busy || installedHost() !== owner) {return false}
	store.busy = true
	try {
		// One bounded snapshot: writes made reentrantly remain pending.
		for (const [key, mutation] of [...store.pending]) {
			if (installedHost() !== owner) {return false}
			if (store.pending.get(key) !== mutation) {continue}
			if (deliver(owner, key, mutation)) {acknowledge(store, key, mutation)}
		}
		if (store.pending.size || installedHost() !== owner) {return false}
		const confirmed =
			typeof owner.storageFlush === 'function'
				? owner.storageFlush() === true
				: typeof owner.storageSet === 'function' || typeof owner.storageRemove === 'function'
		return confirmed && !store.pending.size && installedHost() === owner
	} finally {
		store.busy = false
	}
}

function arm(owner: AppKitHost | undefined, store: Store): void {
	if (!owner || installedHost() !== owner) {return}
	const subscribe = owner.onAppStateChange
	const flush = owner.storageFlush
	if (lifecycle || typeof subscribe !== 'function' || typeof flush !== 'function') {return}
	const subscription: Lifecycle = { owner, subscribe, flush, active: true }
	lifecycle = subscription
	try {
		const remove = subscribe.call(owner, () => {
			if (
				!subscription.active || installedHost() !== owner ||
				owner.onAppStateChange !== subscribe || owner.storageFlush !== flush
			) {
				retire(subscription)
				return
			}
			if (owner.appState !== 'active') {
				try {
					flushStore(owner, store)
				} catch {
					// Lifecycle delivery is best effort; explicit flush reports failure.
				}
			}
		})
		if (typeof remove !== 'function') {
			retire(subscription)
		} else if (!subscription.active || installedHost() !== owner ||
			owner.onAppStateChange !== subscribe || owner.storageFlush !== flush
		) {
			subscription.remove = remove
			retire(subscription)
		} else {
			subscription.remove = remove
		}
	} catch {
		retire(subscription) // A later write can retry registration.
	}
}

function mutate(key: string, value: string | null): void {
	const { owner, store } = current()
	const previous = store.pending.get(key)
	const mutation = { value }
	store.pending.set(key, mutation)
	if (owner && !store.busy) {
		store.busy = true
		try {
			if (deliver(owner, key, mutation)) {acknowledge(store, key, mutation)}
		} catch (error) {
			if (store.pending.get(key) === mutation) {
				if (previous) {store.pending.set(key, previous)}
				else {store.pending.delete(key)}
			}
			throw error
		} finally {
			store.busy = false
		}
	}
	arm(owner, store)
	// A write can happen after the host's inactive event was already delivered.
	if (owner && installedHost() === owner && owner.appState === 'inactive') {
		try {
			if (typeof owner.storageFlush === 'function') {flushStore(owner, store)}
		} catch {
			// The caller can request explicit confirmation with flush().
		}
	}
}

/** Ordinary non-secret settings. Missing write hooks retain session-only
 *  pending mutations; flush() reports false until the host accepts them. */
export const storage = {
	getString(key: string): string | null {
		const { owner, store } = current()
		const pending = store.pending.get(key)
		if (pending) {return pending.value}
		if (typeof owner?.storageGet === 'function') {
			const value = owner.storageGet(key) ?? null
			if (value === null) {store.values.delete(key)}
			else {store.values.set(key, value)}
			return value
		}
		return store.values.get(key) ?? null
	},
	setString(key: string, value: string): void {
		mutate(key, value)
	},
	remove(key: string): void {
		mutate(key, null)
	},
	/** Host handoff confirmation, not a guarantee against sudden process or
	 *  power loss. Missing mutation hooks keep flush() false. */
	flush(): boolean {
		const { owner, store } = current()
		arm(owner, store)
		return flushStore(owner, store)
	},
}
