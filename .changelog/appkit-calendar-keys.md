### AppKit calendar day keyboard source support

AppKit Calendar now uses the shared bounded date-navigation model for arrows,
row/grid edges and month paging, with one enabled day Tab candidate across panes.
Enter/Space selects through the existing callback; unfinished ranges handle Escape
locally. The layer Escape monitor now consults renderer handlers before dismissal.
Controlled month changes wait for parent acceptance before native focus.

```tsx
import { Calendar } from '@octane-xplat/ui'

export function Departure() {
	return <Calendar defaultValue="2026-03-05" min="2026-01-01" max="2026-12-31" numberOfMonths={2} />
}
```

Physical keys, native Tab/focus, popup integration, AX/VoiceOver and packaging
remain unqualified. See [calendar keys](https://octane-xplat.goddardai.org/platform/date-picker#navigate-appkit-calendar-days-with-keys).
