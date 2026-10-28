### AppKit Selector field metadata

Standalone AppKit Selector now renders FormField labels, descriptions and status;
an enclosing Field keeps ownership instead. Trigger IDs stay stable, testID is
forwarded, and ghost mode forwards its existing chrome class.

```tsx
import { Selector } from '@octane-xplat/ui'

export function Region() {
	return <Selector label="Region" description="Choose a region" testID="profile.region" variant="ghost"
		options={[{ value: 'west', label: 'West' }]} isRequired />
}
```

Native layout, label/tooltip behavior, VoiceOver and identifier replay remain
unqualified. See [Selector metadata](https://octane-xplat.goddardai.org/app/search-selection#appkit-selector-field-metadata).
