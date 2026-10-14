# State and event conventions

**Approved D3: Use coherent state triples and one spelling for each role.**

Give values, checked state, and visibility coherent controlled, initial, and change-notification roles. Choose actual spellings through Astryx → React Aria → React Native → generic frontend; this supersedes the earlier blanket preference for generic boolean names and onValueChange. TextInput currently lacks defaultValue, and Button accepts both disabled/isDisabled and loading/isLoading. Resolve duplicate names without introducing a new vocabulary unnecessarily.

Proposed shape (illustrative):

```ts
type ProposedValueProps<T> = {
	value?: T
	defaultValue?: T
	onValueChange?: (value: T) => void
}
```

**Approved D3: Use one portable activation path and make async actions observable.**

onClick appears on Token and navigation items while other shared components use onPress. Normalize activation semantics and payloads, then select the name through the approved precedence. A promise-returning action needs pending and error behavior; avoid two callbacks that independently execute the same user intent. Shapes below illustrate those contracts, not final prop spellings.

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
