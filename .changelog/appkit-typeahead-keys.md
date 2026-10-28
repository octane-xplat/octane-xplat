### Experimental AppKit typeahead keyboard selection

BaseTypeahead now offers results with ArrowDown, moves highlight with arrows and
Home/End, selects with Enter and closes its list with Escape. Tab closes results
while preserving native traversal. Highlighting keeps input focus and requests
native row reveal. The existing consumer key hook runs first and can cancel the
built-in policy; modified shortcuts and composing input retain native defaults.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function PersonSearch() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Person" />
}
```

Native delivery/IME/repeat, Tab/layers, reveal and packaging remain unqualified.
Inline result hosting, listbox accessibility and announcements retain documented
limits. See [AppKit typeahead keys](https://octane-xplat.goddardai.org/app/search-selection#choose-appkit-typeahead-results-with-keys).
