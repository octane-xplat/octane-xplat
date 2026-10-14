# NavIcon and heading menus

Current exports: `NavIcon`, `NavHeadingMenu`, `NavHeadingMenuItem`, `NavHeadingMenuContext`, `NavHeadingCloseContext`, `useNavHeadingMenuContext`, `useNavHeadingCloseContext`.

**Design: Reduce public context machinery and reuse the regular menu/icon contracts.**

Two context objects and two context accessors expose coordination details for a small menu family. Keep a single customization hook only when it serves a real consumer extension, and use standard menu item events and icon inputs. A nav-specific icon should only remain if it adds documented navigation behavior.

Proposed shape (illustrative):

```ts
type ProposedHeadingMenuControls = {
	open: boolean
	close(): void
}
```

Evidence: [src/props.ts:4653](../../../../packages/ui/src/props.ts#L4653), [src/props.ts:5234](../../../../packages/ui/src/props.ts#L5234).

[Audit index](../../README.md)
