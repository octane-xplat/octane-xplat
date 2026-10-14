# Typeahead, BaseTypeahead, and TypeaheadItem

Current exports: `Typeahead`, `BaseTypeahead`, `TypeaheadItem`, `createStaticSource`.

**Design: Preserve reference-backed Typeahead naming and separate public selection from internals.**

Resolve naming through D6 rather than automatically replacing Typeahead with Combobox. BaseTypeahead exposes __queryEntries, an internal coordination prop. Keep one public component and explicit slots, with separately named query text and selected item state. Interaction semantics follow the [WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

Proposed shape (illustrative):

```ts
type ProposedTypeaheadState<T> = {
	value: T | null
	onValueChange(value: T | null): void
	query?: string
	onQueryChange?: (query: string) => void
}
```

**Design: Share an abortable SearchSource across search, commands, and chat.**

SearchSource has required bootstrap and optional cancel, while ChatComposerSearchSource makes bootstrap optional. Prefer one request-scoped AbortSignal contract; global cancel is ambiguous when two components share a source. Keep createStaticSource as a convenient adapter with a more specific createStaticSearchSource name.

Proposed shape (illustrative):

```ts
type ProposedSearchSource<T> = {
	search(query: string, options: { signal: AbortSignal }): Promise<readonly T[]>
	initialItems?: readonly T[]
}
```

Evidence: [src/props.ts:3285](../../../../packages/ui/src/props.ts#L3285), [src/props.ts:3317](../../../../packages/ui/src/props.ts#L3317), [src/props.ts:3382](../../../../packages/ui/src/props.ts#L3382).

[Audit index](../../README.md)
