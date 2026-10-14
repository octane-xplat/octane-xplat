# PowerSearch and its configuration

Current exports: `PowerSearch`, `PowerSearchToken`, `PowerSearchFilterEditor`, `createPowerSearchConfig`, `usePowerSearchConfig`, `resolveOperatorLabel`.

**Design: Keep the schema-driven filter editor, but type filters from their configuration.**

Field and operator references are plain strings, and FilterValue is independent of the chosen operator. Infer valid field/operator/value combinations from the config so agents cannot generate incompatible filters. Namespace broad helper types such as InferData and FieldDefinition under this feature rather than competing with form terminology.

Proposed shape (illustrative):

```ts
type ProposedFilter =
	| { field: 'title'; operator: 'contains'; value: string }
	| { field: 'priority'; operator: 'equals'; value: number }
```

**Design: Use a standard ref and an object-shaped change event.**

handleRef differs from other controls, and onChange receives filters, changeType, and index as separate arguments. A normal typed ref and one named change object make composition easier and leave room for future reasons without changing positional arguments.

Proposed shape (illustrative):

```ts
type ProposedFilterChange<T> = {
	filters: readonly T[]
	change: { type: 'add' | 'edit' | 'remove'; index: number }
}
```

Evidence: [src/props.ts:5936](../../../../packages/ui/src/props.ts#L5936), [src/props.ts:5943](../../../../packages/ui/src/props.ts#L5943), [src/props.ts:6013](../../../../packages/ui/src/props.ts#L6013).

[Audit index](../../README.md)
