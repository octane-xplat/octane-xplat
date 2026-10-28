### Continue typing after clearing AppKit input

TextInput and SearchInput now request focus on the input after clearing, keeping
onChange('') before onClear. Controlled parents still apply value changes.

```tsx
import { SearchInput } from '@octane-xplat/ui'

export function Search() {
	return <SearchInput label="Find records" hasClear defaultValue="recent" />
}
```

Native focus/caret/IME, clear activation and accessibility remain unqualified.
See [clear and continue typing](https://octane-xplat.goddardai.org/app/primitives#clear-and-continue-typing-on-appkit).
