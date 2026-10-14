# createStore and useStore

Current exports: `createStore`, `useStore`.

**Keep: Keep explicit stores and reactive reads; make function values and selectors unambiguous.**

The small get/set/subscribe contract is easy to learn. set treats functions as updater callbacks, which makes storing a function require an extra wrapper; an explicit update method removes that ambiguity. useStore selectors must return stable snapshots, so provide an equality-aware selector path or a clear typed constraint rather than relying on agent memory.

Proposed shape (illustrative):

```ts
type ProposedStore<T> = {
	get(): T
	set(value: T): void
	update(updater: (value: T) => T): void
	subscribe(listener: () => void): () => void
}
```

Evidence: [src/store.ts:16](../../../../packages/ui/src/store.ts#L16), [src/use-store.tsrx:4](../../../../packages/ui/src/use-store.tsrx#L4).

[Audit index](../../README.md)
