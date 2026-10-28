### Leading icons in AppKit text fields

AppKit TextInput now renders `startIcon`, and SearchInput displays its default
or custom glyph and supports `icon={false}`. TextInput also forwards placeholder
text color. Native glyph presentation and accessibility remain unqualified.

```tsx
import { SearchInput, TextInput } from '@octane-xplat/ui'

export function Fields() {
	return <>
		<SearchInput label="Find" icon={false} placeholder="Search items" />
		<TextInput label="Name" startIcon="xplat-check" />
	</>
}
```

See [building screens](https://octane-xplat.goddardai.org/app/primitives).
