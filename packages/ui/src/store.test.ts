import { describe, expect, it } from 'vitest'

import { createStore } from './store'

// Pure store contract — no renderer involved (subscription/re-render
// semantics live in store.mobile.test.ts and store.web.test.tsrx).

describe('createStore', () => {
	it('reads the current value through getSnapshot and writes with set', () => {
		const store = createStore({ name: 'a' })
		expect(store.getSnapshot()).toEqual({ name: 'a' })

		store.set({ name: 'b' })
		expect(store.getSnapshot()).toEqual({ name: 'b' })
	})

	it('update computes the next value from the previous snapshot', () => {
		const store = createStore({ count: 0 })
		store.update((prev) => ({ count: prev.count + 1 }))
		store.update((prev) => ({ count: prev.count + 1 }))
		expect(store.getSnapshot()).toEqual({ count: 2 })
	})

	it('set stores a function value verbatim instead of invoking it', () => {
		const fns = { inc: () => 1 }
		const store = createStore(fns)
		const dec = { dec: () => -1 }
		store.set(dec)
		expect(store.getSnapshot()).toBe(dec)
	})

	it('notifies subscribers on change and skips Object.is-identical writes', () => {
		const store = createStore(0)
		let calls = 0
		const unsub = store.subscribe(() => calls++)

		store.set(0) // identical — no notify
		expect(calls).toBe(0)
		store.set(1)
		expect(calls).toBe(1)
		store.update(() => 1) // updater returning the same value — no notify
		expect(calls).toBe(1)

		unsub()
		store.set(2)
		expect(calls).toBe(1)
	})

	it('hands out a stable snapshot reference between commits', () => {
		const store = createStore({ a: 1 })
		const first = store.getSnapshot()
		expect(store.getSnapshot()).toBe(first)
		store.update((prev) => ({ ...prev }))
		expect(store.getSnapshot()).not.toBe(first)
	})
})
