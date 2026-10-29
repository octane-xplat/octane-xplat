### Honor native search-field labels and state

On iOS and Android, SearchInput now honors shared field labels, descriptions,
validation, widths and inherited defaults. Its id and accessible name identify
the editable control. Changing the leading icon keeps the editor and its text;
clearing returns focus to it.

```tsx
import { SearchInput } from '@octane-xplat/ui'

export function Search() {
  return <SearchInput id="files" label="Find files" description="All folders" width="100%" />
}
```

[Text entry](https://octane-xplat.goddardai.org/app/text-entry)
