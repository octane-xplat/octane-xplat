# RadioList, CheckboxList, and SegmentedControl

Current exports: `RadioList`, `CheckboxList`, `SegmentedControl`.

**Design: Preserve RadioList and CheckboxList, with coherent orientation and defaults.**

The Astryx-aligned RadioList and CheckboxList names take precedence over generic group names. RadioList lacks defaultValue while its sibling groups provide it, and horizontal booleans compete with orientation elsewhere. Keep SegmentedControl for its visual presentation, but reuse the same single-choice value and option types.

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
