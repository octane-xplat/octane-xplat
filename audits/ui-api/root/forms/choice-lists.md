# RadioList, CheckboxList, and SegmentedControl

Current exports: `RadioList`, `CheckboxList`, `SegmentedControl`.

**Design: Use RadioGroup and CheckboxGroup, with matching orientation and defaults.**

The group names communicate selection behavior more directly than List. RadioList lacks defaultValue while its sibling groups provide it, and horizontal booleans compete with orientation elsewhere. Keep SegmentedControl for its visual presentation, but reuse the same single-choice value and option types.

Proposed shape (illustrative):

```ts
type ProposedChoiceOptions = {
	orientation?: 'horizontal' | 'vertical'
	disabled?: boolean
}
type ProposedSingleChoice = { value?: string | null; defaultValue?: string | null }
```

Evidence: [src/props.ts:2852](../../../../packages/ui/src/props.ts#L2852), [src/props.ts:2872](../../../../packages/ui/src/props.ts#L2872), [src/props.ts:3650](../../../../packages/ui/src/props.ts#L3650).

[Audit index](../../README.md)
