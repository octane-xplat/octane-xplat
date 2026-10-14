# View

Current exports: `View`.

**Design: Keep View as the neutral container and make layout-specific child props intentional.**

View inherits grid, absolute, dock, and flex placement props together. A misspelled or misplaced prop can therefore look valid without affecting layout. Keep the familiar View name, but type alignment values and explain which parent consumes each placement property.

Proposed shape (illustrative):

```ts
type ProposedFlexChildProps = {
	flexGrow?: number
	flexShrink?: number
	alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch'
}
```

Evidence: [src/props.ts:318](../../../../packages/ui/src/props.ts#L318), [src/props.ts:36](../../../../packages/ui/src/props.ts#L36).

[Audit index](../../README.md)
