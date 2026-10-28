### Checkbox metadata on AppKit

Standalone AppKit Checkbox now renders descriptions and validation messages,
honors hidden labels and leaves enclosing Field metadata in one place. Label
tooltips now forward to the existing field info affordance.

```tsx
import { Checkbox } from '@octane-xplat/ui'

export function IncludeArchived() {
	return <Checkbox label="Include archived" labelTooltip="Include archived records" description="Search older records" defaultValue />
}
```

Native input, layout and accessibility remain unqualified. AppKit changeAction
remains unsupported. See [checkbox metadata](https://octane-xplat.goddardai.org/app/components#checkbox-metadata-on-appkit).
