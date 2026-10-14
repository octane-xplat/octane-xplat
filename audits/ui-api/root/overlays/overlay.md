# Overlay

Current exports: `Overlay`.

**Design: Keep Overlay low-level and state which modal responsibilities it owns.**

open/onDismiss and shadeCover do not describe focus isolation, escape/back behavior, or scroll locking. Use backdrop instead of shadeCover and define whether Overlay only creates a layer or also enforces modality. Agents should choose Dialog for a complete modal interaction without reconstructing hidden responsibilities.

Proposed shape (illustrative):

```ts
type ProposedOverlayOptions = {
	open: boolean
	backdrop?: boolean
	modal?: boolean
	onOpenChange?: (open: boolean) => void
}
```

Evidence: [src/props.ts:1475](../../../../packages/ui/src/props.ts#L1475).

[Audit index](../../README.md)
