# State and event conventions

**Design: Use semantic state triples and one boolean spelling.**

Prefer value/defaultValue/onValueChange, checked/defaultChecked/onCheckedChange, and open/defaultOpen/onOpenChange. Use disabled, readOnly, required, loading, and autoFocus throughout. These follow familiar frontend spellings; onValueChange makes the value payload explicit. TextInput currently lacks defaultValue, and Button accepts both disabled/isDisabled and loading/isLoading.

Proposed shape (illustrative):

```ts
type ProposedValueProps<T> = {
	value?: T
	defaultValue?: T
	onValueChange?: (value: T) => void
}
```

**Design: Keep onPress for portable activation; make async actions observable.**

onClick appears on Token and navigation items while other shared components use onPress. Normalize the semantic action rather than requiring a DOM event. A promise-returning action also needs pending and error behavior; avoid two callbacks that independently execute the same user intent.

Proposed shape (illustrative):

```ts
type ProposedActionProps = {
	onPress?: () => void | Promise<void>
	onError?: (error: unknown) => void
	disabled?: boolean
}
```

Evidence: [src/props.ts:490](../../../../packages/ui/src/props.ts#L490), [src/props.ts:517](../../../../packages/ui/src/props.ts#L517), [src/props.ts:1382](../../../../packages/ui/src/props.ts#L1382), [src/props.ts:2744](../../../../packages/ui/src/props.ts#L2744).

[Audit index](../../README.md)
