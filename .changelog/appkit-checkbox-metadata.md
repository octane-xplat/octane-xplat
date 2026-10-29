### Checkbox metadata on AppKit

Standalone AppKit Checkbox now renders descriptions and validation messages,
honors hidden labels and leaves enclosing Field metadata in one place. Label
tooltips now forward to the existing field info affordance. Actions retain the
latest local choice before rendering, use current blocking props and ignore
callback reentry or held callbacks after detachment.

```tsx
import { useState } from 'octane'
import { Checkbox } from '@octane-xplat/ui'

export function IncludeArchived() {
	const [include, setInclude] = useState(false)
	return <Checkbox label="Include archived" labelTooltip="Include archived records"
		description="Search older records" value={include} onChange={setInclude} />
}
```

Source cases remain unrun; native input/ref timing, layout and accessibility remain unqualified. AppKit changeAction
remains unsupported. See [checkbox metadata](https://octane-xplat.goddardai.org/app/components#checkbox-metadata-on-appkit).
