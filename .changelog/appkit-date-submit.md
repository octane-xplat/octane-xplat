### AppKit typed date/time submit source wiring

DateInput, TimeInput and both DateTimeInput text segments now route native submit
to the same draft-commit boundary as blur, preserving existing parsing and clears.

```tsx
import { TimeInput } from '@octane-xplat/ui'

export function StartTime(props: { value: string | null; change(value: string | null): void }) {
	return <TimeInput label="Start time" value={props.value} onChange={props.change} />
}
```

Physical Return, IME/blur ordering, focus/AX and packaging remain unqualified.
See [typed date/time Return](https://octane-xplat.goddardai.org/platform/date-picker#commit-typed-appkit-date-and-time-drafts-with-return).
