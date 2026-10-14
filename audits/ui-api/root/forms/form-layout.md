# FormLayout, InputGroup, and InputGroupText

Current exports: `FormLayout`, `InputGroup`, `InputGroupText`.

**Design: Separate arrangement, grouped chrome, and form submission.**

FormLayout and InputGroup are layout/composition helpers, not form state or submit owners. Keep those boundaries explicit. defaultOptionality conflicts with per-control isRequired/isOptional; choose one required default with a clear child override. Name InputGroupText as an adornment if it is only decorative content.

Proposed shape (illustrative):

```ts
type ProposedFormLayoutDefaults = {
	direction?: 'horizontal' | 'vertical'
	requiredByDefault?: boolean
}
```

Evidence: [src/props.ts:6848](../../../../packages/ui/src/props.ts#L6848), [src/props.ts:6868](../../../../packages/ui/src/props.ts#L6868).

[Audit index](../../README.md)
