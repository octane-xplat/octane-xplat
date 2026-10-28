### AppKit preset-time keyboard source support

DateTimeInput now opens presets with Alt+Down and requests native option focus.
Bounded arrows/Home/End move without committing; Enter/Space uses the existing
selection path. Tab records field-neighbor return intent through popup closure.

```tsx
import { DateTimeInput } from '@octane-xplat/ui'

export function Appointment(props: { value: string | null; change(value: string | null): void }) {
	return <DateTimeInput label="Appointment" value={props.value} onChange={props.change} timeOptionInterval={15} />
}
```

Physical keys, focus/Tab/return, IME, scroll/AX and packaging remain unqualified.
Row text relay and full listbox accessibility remain gaps. See [preset time keys](https://octane-xplat.goddardai.org/platform/date-picker#choose-appkit-preset-times-with-keys).
