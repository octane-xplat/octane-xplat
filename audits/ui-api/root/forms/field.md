# Field, FieldGroup, and useFieldControl

Current exports: `Field`, `FieldGroup`, `useFieldControl`.

**Design: Keep Field for label association and separate validation from appearance.**

status/statusVariant, required/optional flags, and inherited control state create several overlapping decisions. Prefer one required flag plus an explicit error message and validation state. Normalize ID suffixes to inputId/labelId, and let Field own associations so an agent cannot accidentally pair a label with the wrong control.

Proposed shape (illustrative):

```ts
type ProposedFieldState = {
	required?: boolean
	validationState?: 'valid' | 'invalid'
	errorMessage?: string
	description?: string
}
```

Evidence: [src/props.ts:490](../../../../packages/ui/src/props.ts#L490), [src/props.ts:3110](../../../../packages/ui/src/props.ts#L3110), [src/field-context.ts:29](../../../../packages/ui/src/field-context.ts#L29).

[Audit index](../../README.md)
