# Screen and SafeArea

Current exports: `Screen`, `SafeArea`, `useSafeAreaInsets`.

**Design: State who owns insets and allow selecting edges.**

Screen and SafeArea can both appear in a screen hierarchy, but SafeArea only exposes ignoreSafeArea as a boolean. Prefer explicit edges and define whether nested wrappers consume an inset once or add it again. Keep useSafeAreaInsets as the low-level escape hatch with documented units.

Proposed shape (illustrative):

```ts
type ProposedSafeAreaProps = {
	edges?: readonly ('top' | 'right' | 'bottom' | 'left')[]
}
```

Evidence: [src/props.ts:1332](../../../../packages/ui/src/props.ts#L1332), [src/props.ts:1345](../../../../packages/ui/src/props.ts#L1345).

[Audit index](../../README.md)
