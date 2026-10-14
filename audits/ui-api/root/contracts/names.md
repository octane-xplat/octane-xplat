# Names and public types

**Approved D6: Choose names using Astryx → React Aria → React Native → generic frontend.**

Use the highest-priority semantically comparable reference for components, props, events, hooks, and public types. Generic familiarity does not justify replacing an Astryx-aligned name. Existing Astryx-aligned names such as CheckboxInput, RadioList, CheckboxList, Selector, and MultiSelector take precedence over the earlier generic rename suggestions. Match associated type names to the selected public vocabulary.

Proposed shape (illustrative):

```ts
type NamingPrecedence = readonly ['Astryx', 'React Aria', 'React Native', 'generic frontend']
type NamingExamples = {
	CheckboxInput: 'CheckboxInputProps'
	RadioList: 'RadioListProps'
	Selector: 'SelectorProps'
	MultiSelector: 'MultiSelectorProps'
}
```

**Approved D5/D6: Export the types consumers need under consistent names.**

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

[Approved naming decision](../../approved-decisions.md#d6-naming-precedence) · [Candidate principles](../../principles.md)
