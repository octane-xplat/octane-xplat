### Removable AppKit selection badges

AppKit MultiSelector now supports removable selected-value badges. Removal follows
the existing save and rollback flow, with disabled/read-only/pending guards.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Channels() {
	return <MultiSelector triggerDisplay="badges" defaultValue={['email']}
		options={[{ value: 'email', label: 'Email' }, { value: 'push', label: 'Push' }]} />
}
```

Native pointer/focus/VoiceOver behavior remains unqualified. See the
[AppKit badge guide](https://octane-xplat.goddardai.org/app/search-selection#remove-selected-values-on-appkit).
