# Kbd

Current exports: `Kbd`.

**Keep: Keep Kbd for a displayed keyboard key and model shortcuts explicitly.**

Kbd is a familiar HTML-derived abbreviation worth retaining. Distinguish a displayed key from an actionable keyboard shortcut, and use structured modifiers if multiple keys are supported. Do not make a keycap label imply that the component registers the shortcut.

Proposed shape (illustrative):

```ts
type ProposedShortcutDisplay = {
	key: string
	modifiers?: readonly ('Control' | 'Alt' | 'Shift' | 'Meta')[]
}
```

Evidence: [src/props.ts:3937](../../../../packages/ui/src/props.ts#L3937).

[Audit index](../../README.md)
