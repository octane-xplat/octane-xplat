# Selector and MultiSelector

Current exports: `Selector`, `MultiSelector`.

**Design: Use Select and MultiSelect with exact value types.**

Selector accepts string, string[], and null independently of multiple, allowing invalid mode/value combinations. MultiSelector narrows the types through an alias around SelectMenu. Prefer separate Select/MultiSelect exports or one discriminated selectionMode union; match prop-type names and use null only for empty single selection.

Proposed shape (illustrative):

```ts
type ProposedSelection =
	| { selectionMode: 'single'; value: string | null; onValueChange(value: string | null): void }
	| {
			selectionMode: 'multiple'
			value: readonly string[]
			onValueChange(value: readonly string[]): void
	  }
```

Evidence: [src/props.ts:3226](../../../../packages/ui/src/props.ts#L3226), [src/props.ts:6135](../../../../packages/ui/src/props.ts#L6135), [src/aliases.tsrx:6](../../../../packages/ui/src/aliases.tsrx#L6).

[Audit index](../../README.md)
