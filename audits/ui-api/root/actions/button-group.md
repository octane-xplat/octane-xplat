# ButtonGroup

Current exports: `ButtonGroup`.

**Keep: Keep ButtonGroup as a layout and shared-defaults container.**

The name is clear and the required group label is useful. State child-over-group precedence and keep it distinct from selection-owning ToggleButtonGroup. Agents should not infer selected state merely because several buttons have connected borders.

Proposed shape (illustrative):

```ts
type ProposedButtonGroupDefaults = {
	orientation?: 'horizontal' | 'vertical'
	disabled?: boolean
	size?: 'sm' | 'md' | 'lg'
}
```

Evidence: [src/props.ts:5491](../../../../packages/ui/src/props.ts#L5491).

[Audit index](../../README.md)
