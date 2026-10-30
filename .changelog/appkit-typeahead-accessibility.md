### AppKit typeahead suggestion roles and links

Experimental AppKit typeahead fields now declare combo/list/option roles and
link their current native suggestion list and highlighted pending row. Closing,
blocking, replacing or removing the field restores previous native metadata.
Highlighting remains separate from committing the controlled value.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function People() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Choose a person" />
}
```

Native AX hierarchy, VoiceOver navigation/announcements, focus/IME and packaging
remain unqualified. See the
[AppKit role/link subset](https://octane-xplat.goddardai.org/app/search-selection#expose-appkit-suggestion-roles-and-relationships).
