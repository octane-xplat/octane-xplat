### AppKit Selector keyboard flow

AppKit Selector now has source paths for opening and navigating by keyboard,
manual option focus, Enter/Space commits, prefix/local-search input and Escape/
Tab close intent. It reuses native choice ordering and popup focus ownership.

```tsx
import { Selector } from '@octane-xplat/ui'

export function Fruit() {
	return <Selector options={[{ value: 'apple', label: 'Apple' }, { value: 'cherry', label: 'Cherry' }]}
		searchable defaultValue="apple" />
}
```

Physical keys, IME, popup/return focus, VoiceOver and packaging remain unqualified.
See [AppKit selection keys](https://octane-xplat.goddardai.org/app/search-selection#use-selector-keys-on-appkit).
