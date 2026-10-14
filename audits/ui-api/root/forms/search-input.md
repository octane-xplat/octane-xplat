# SearchInput

Current exports: `SearchInput`.

**Design: Make SearchInput a preset of the text-input contract.**

Its defaultValue support is useful, but a separate onChange convention forces agents to special-case search fields. Keep the clear and submit affordances, normalize their names, and state whether submit receives the current query. Let search and suggestion engines stay separate from the text field.

Proposed shape (illustrative):

```ts
type ProposedSearchEvents = {
	onValueChange?: (query: string) => void
	onSubmit?: (query: string) => void
	onClear?: () => void
}
```

Evidence: [src/props.ts:568](../../../../packages/ui/src/props.ts#L568).

[Audit index](../../README.md)
