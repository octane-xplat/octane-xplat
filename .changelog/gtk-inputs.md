### Remaining inputs on GTK

GTK apps can now use the rest of the shared input surface from
`@octane-xplat/ui`: `RichText`/`RichTextSpan` (styled runs render as Pango
markup and tappable spans), `SelectableCard`, the typeahead family
(`BaseTypeahead`, `Typeahead`, `TypeaheadItem`, `Token`, `Tokenizer`,
`ComplexSelector`), the faceted `PowerSearch` surface (`PowerSearchToken`,
`PowerSearchFilterEditor`, `usePowerSearchConfig`), `Calendar` and the
date/time field family (`DateInput`, `TimeInput`, `DateTimeInput`,
`DateRangeInput` with `useCalendarDays`/`useCalendarConstraints`/
`useCalendarNavigation`), and the color family (`ColorArea`,
`ColorSlider`, `ColorField`, `ColorPicker`).

```tsx
import { DateInput, Tokenizer, createStaticSource } from "@octane-xplat/ui"

const tagSource = createStaticSource([
	{ id: "ui", label: "UI" },
	{ id: "docs", label: "Docs" },
])

export function ScheduleForm({ tags, setTags, date, setDate }) {
	return (
		<>
			<Tokenizer
				label="Tags"
				searchSource={tagSource}
				value={tags}
				onChange={(items) => setTags(items)}
				hasCreate
			/>
			<DateInput label="Date" value={date} onChange={setDate} />
		</>
	)
}
```

On fine-pointer GTK desktops the date inputs present their pickers as
anchored `Popover` layers (`presentation="bottom-sheet"` still selects
the sheet). `LinearGradient` now paints through GTK CSS on Linux, which
the color controls rely on.

Known limits: `RichTextSpan` accepts only inline style props —
`className` styles do not fold into the label. `Token` `href` still opens
links through the host URI seam; it is smoke-qualified rather than
fully exercised by real input.
[GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
