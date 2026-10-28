Experimental AppKit search suggestions now use a source-owned panel in the
field's native window, with bounded scrolling and anchor-based sizing. Custom
result content keeps the field's providers. Typeahead and Tokenizer inherit the
result view. The matching AppKit renderer is required; native runtime behavior
and packaging remain unqualified.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function People() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus menuWidth={280} placement="bottom" accessibilityLabel="Person" />
}
```

Tokenizer's outer unfocused editor layer remains inline. See
[floating AppKit suggestions](https://octane-xplat.goddardai.org/app/search-selection#float-appkit-search-suggestions).
