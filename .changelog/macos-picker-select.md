### Select renders an AppKit pop-up button on macOS

`@octane-xplat/picker/macos` is a new target entry exporting `Select`,
`SelectOption`, and `SelectProps`. It renders a labeled `NSPopUpButton` and
uses the same `label`, `options`, `value`/`defaultValue`, and `onChange`
contract as the web entry — including per-option `disabled` states.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Select } from '@octane-xplat/picker/macos'

export function Region() {
	return (
		<Select
			label="Region"
			options={[{ value: 'sfo', label: 'San Francisco' }]}
			defaultValue="sfo"
			onChange={(value) => console.log(value)}
		/>
	)
}
```

See the [picker package](https://github.com/octane-xplat/octane-xplat/tree/main/packages/picker)
for the platform entries and prop shapes.
