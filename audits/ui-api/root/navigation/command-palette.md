# CommandPalette

Current exports: `CommandPalette`.

**Design: Distinguish commands, search text, and the selected command.**

items and searchSource use different models, while value/onValueChange is ambiguous about search text versus selection. Prefer commands, query/onQueryChange, and onAction(commandId), with one shared abortable search-source contract. Keep open state consistent with Dialog and expose asynchronous failures rather than only replacement error text.

Proposed shape (illustrative):

```ts
type ProposedCommandPaletteState = {
	query?: string
	onQueryChange?: (query: string) => void
	onAction?: (commandId: string) => void | Promise<void>
}
```

Evidence: [src/props.ts:3757](../../../../packages/ui/src/props.ts#L3757), [src/props.ts:3776](../../../../packages/ui/src/props.ts#L3776).

[Audit index](../../README.md)
