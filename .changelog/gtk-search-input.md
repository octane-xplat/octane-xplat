### Search from GTK screens

The GTK UI root now exports SearchInput and SearchInputProps. The field supports
labels, validation, leading icons and clear/submit actions.
Clearing returns focus to the editor.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { SearchInput } from '@octane-xplat/ui'

export function Search() {
  const [query, setQuery] = useState('')
  return <SearchInput label="Find files" value={query} onChange={setQuery}
    onSubmit={() => console.log(query)} />
}
```

[GTK search fields](https://octane-xplat.goddardai.org/platform/linux-gtk#search-fields)
