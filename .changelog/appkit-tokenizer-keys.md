Experimental AppKit token fields can request removal of the current last token
with Backspace when both query and native editor text are empty. Composing and
modified keys preserve editing; current read-only/disabled state blocks removal.

```tsx
import { useState } from 'octane'
import { Tokenizer, createStaticSource } from '@octane-xplat/ui'
const people = [{ id: 'ada', label: 'Ada' }]
const source = createStaticSource(people)
export function Tags() {
	const [tags, setTags] = useState(people)
	return <Tokenizer searchSource={source} value={tags} onChange={setTags} />
}
```

Native key, IME, focus and overflow behavior remain unqualified. See the
[AppKit token-entry guide](https://octane-xplat.goddardai.org/app/search-selection#remove-appkit-tokens-with-empty-input-backspace).
