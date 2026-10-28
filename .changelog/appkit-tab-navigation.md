### AppKit tab-strip focus and scrolling

AppKit TabList now uses native geometry to reveal selected/focused tabs and
adds roving focus for registered Tab children. Arrows/Home/End move focus;
Enter/Space activate. Visible tabs gain explicit accessible names, and disabled
tabs retain their native role/state.

```tsx
import { useState } from 'octane'
import { TabList, Tab } from '@octane-xplat/ui'

export function Sections() {
	const [value, setValue] = useState('overview')
	return <TabList role="tablist" value={value} onChange={setValue}>
		<Tab value="overview" label="Overview" />
		<Tab value="details" label="Details" />
	</TabList>
}
```

Actual keyboard/Tab, scroll visibility, VoiceOver, panel relationships and
layout remain unqualified. TabMenu stays an independent trigger. See
[AppKit tab strips](https://octane-xplat.goddardai.org/app/components#tab-strips-on-appkit).
