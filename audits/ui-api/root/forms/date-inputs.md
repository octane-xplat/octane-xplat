# DateInput, TimeInput, DateTimeInput, and DateRangeInput

Current exports: `DateInput`, `TimeInput`, `DateTimeInput`, `DateRangeInput`.

**Design: Use one empty value and distinguish local date-time from an instant.**

Clearing emits undefined for three inputs but null for DateRangeInput. Use null consistently and support defaultValue where uncontrolled entry is supported. ISODateTimeString has no offset, so prefer LocalDateTimeString; template-literal shapes do not validate real dates or times. Validate at the boundary and report invalid input clearly.

Proposed shape (illustrative):

```ts
type ProposedLocalDateTimeValue = {
	value?: string | null
	defaultValue?: string | null
	onValueChange?: (value: string | null) => void
}
```

**Design: Replace overlapping presentation flags with one picker strategy.**

presentation can be native/adaptive-native while nativePicker independently selects touch/always/never. Those axes can express contradictory requests. Prefer one strategy with explicitly documented fallback behavior, keeping locale and formatting separate from the choice of picker surface.

Proposed shape (illustrative):

```ts
type ProposedPickerStrategy = 'inline' | 'popover' | 'sheet' | 'native' | 'auto'
```

Evidence: [src/props.ts:602](../../../../packages/ui/src/props.ts#L602), [src/props.ts:785](../../../../packages/ui/src/props.ts#L785), [src/props.ts:902](../../../../packages/ui/src/props.ts#L902).

[Audit index](../../README.md)
