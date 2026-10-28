### Checkbox-list composition on AppKit

CheckboxList now supports CheckboxListItem children alongside options, with
shared selection, Field ownership, descriptions/trailing content and native
checkbox names/mixed state. Value-less items support controlled select-all rows.

```tsx
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'

export function Features() {
	return <CheckboxList label="Features" defaultValue={['email']}>
		<CheckboxListItem value="email" label="Email" description="Daily summary" />
		<CheckboxListItem value="alerts" label="Alerts" />
	</CheckboxList>
}
```

Native input/Tab, mixed VoiceOver, divider/layout appearance and packaging remain
unqualified. See [checkbox lists](https://octane-xplat.goddardai.org/app/components#checkbox-lists-on-appkit).
