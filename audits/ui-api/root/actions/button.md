# Button and IconButton

Current exports: `Button`, `IconButton`.

**Design: Remove duplicate flags, slots, and action paths.**

Button merges disabled/isDisabled and loading/isLoading, chooses icon over leading, and endContent over trailing. It also calls both onPress and clickAction. Keep one state spelling, startContent/endContent, and one activation handler. Preserve IconButton with a required accessible label.

Proposed shape (illustrative):

```ts
type ProposedButtonProps = {
	disabled?: boolean
	loading?: boolean
	onPress?: () => void | Promise<void>
	onError?: (error: unknown) => void
}
```

**Fix: Report asynchronous action failures.**

The web leaf resets pending state on rejection without reporting the error. A generated save button can appear to finish after a failed save. Define how pending, retry, and cancellation work and give the caller an observable failure path instead of swallowing rejection.

Proposed shape (illustrative):

```ts
type ProposedActionResult = { status: 'success' } | { status: 'error'; error: unknown }
```

Evidence: [src/props.ts:2744](../../../../packages/ui/src/props.ts#L2744), [src/Button.web.tsrx:20](../../../../packages/ui/src/Button.web.tsrx#L20).

[Audit index](../../README.md)
