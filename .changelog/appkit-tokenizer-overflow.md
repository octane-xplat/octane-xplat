Experimental AppKit token fields now use native bounds and rectangle conversion
for collapsed-row counts, with the counter outside the clipped token viewport.
Layer token copies use separate refs, and widening the field can reclaim the
counter's space when every token fits.

```tsx
import { useState } from 'octane'
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
const people = [{ id: 'ada', label: 'Ada Lovelace' }]
const source = createStaticSource(people)
export function Tags() {
	const [tags, setTags] = useState(people)
	return <Tokenizer label="People" width={240} searchSource={source} value={tags}
		onChange={setTags} tokenOverflowBehavior="unfocusedInline" />
}
```

Native drawing, sizing, focus, accessibility and packaging remain unqualified;
the token layer still renders inline. See the
[AppKit token overflow subset](https://octane-xplat.goddardai.org/app/search-selection#collapse-appkit-token-rows-with-native-geometry).
