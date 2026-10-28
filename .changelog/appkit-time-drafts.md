### Preserve experimental AppKit time drafts

TimeInput now checks current blocking/save ownership before changing a draft,
and retained submit/edit callbacks use the current text, seconds and bounds.
Callback teardown or parent correction cannot be overwritten by an old draft
clear. The existing AppKit marked-text guard remains in use.

```tsx
import { useState } from 'octane'
import { TimeInput } from '@octane-xplat/ui'
export function StartTime() {
	const [time, setTime] = useState<string | null>('14:30')
	return <TimeInput label="Start time" value={time} onChange={setTime}
		min="09:00" max="18:00" hasClear />
}
```

Native editor/IME, Return/blur/save ordering, focus/accessibility and packaging
remain unqualified. See [AppKit time drafts](https://octane-xplat.goddardai.org/platform/date-picker#keep-appkit-time-drafts-owned-by-the-current-edit).
