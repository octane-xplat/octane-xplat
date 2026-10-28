### Preserve AppKit search composition during query updates

Raw native search fields now defer differing programmatic text while the native
editor has marked text. Changed writes still emit the existing text-change event.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Search({ query, onQuery }: { query: string; onQuery(value: string): void }) {
	return <searchbar text={query} onTextChange={(event) => onQuery(event.value)} />
}
```

Actual IME, selection and packaging remain unqualified. See the
[AppKit editing contract](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer#controlled-text-during-composition).
