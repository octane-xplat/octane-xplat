### Experimental AppKit typeahead focus

BaseTypeahead now opens bootstrap results on focus, honors its autofocus request,
and cancels searches when the user leaves the field. New queries retire old
responses before debounce; source changes, blocking and teardown cannot reopen
retired results. Refs read the current host and blur preserves other editors.
Typeahead click-to-edit reports its query once, and readonly fields omit clear.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function PersonSearch() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Person" />
}
```

Native input/IME/focus/click/layout and packaging remain unqualified. Results
remain inline; keyboard option selection and listbox accessibility remain gaps.
See [AppKit typeahead](https://octane-xplat.goddardai.org/app/search-selection#bootstrap-appkit-typeahead-results-on-focus).
