# Names and public types

**Design: Choose familiar component names once, then match every associated type.**

My preference is Checkbox, CheckboxGroup, RadioGroup, Select, MultiSelect, TreeView, and RatingInput. Selector and ComplexSelector are less specific frontend terms. The barrel currently exposes both renamed and original prop types, such as CheckboxInputProps and CheckboxProps. A single vocabulary reduces guesses in imports and generated wrappers; changing it costs a deliberate breaking release.

Proposed shape (illustrative):

```ts
type ProposedNames = {
	Checkbox: 'CheckboxProps'
	RadioGroup: 'RadioGroupProps'
	Select: 'SelectProps'
	MultiSelect: 'MultiSelectProps'
}
```

**Fix: Export the types consumers need and remove orphan public types.**

RowProps is exported without a Row component. ButtonVariant and TextInputHandle lack direct exports in the shared web/mobile/default barrels, although macOS exposes them through a wildcard. Agents should derive ComponentProps, ComponentHandle, and ComponentVariant from one stable component vocabulary without inspecting declaration internals.

Proposed shape (illustrative):

```ts
type ProposedTypePolicy = {
	namedExports: ['ButtonProps', 'ButtonVariant', 'TextInputHandle']
	removeOrphans: ['RowProps']
}
```

Evidence: [src/props.ts:6121](../../../../packages/ui/src/props.ts#L6121), [src/index.shared.ts:53](../../../../packages/ui/src/index.shared.ts#L53).

[Audit index](../../README.md)
