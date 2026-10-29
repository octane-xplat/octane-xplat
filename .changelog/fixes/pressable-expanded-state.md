### Announce expanded controls on web

`Pressable` now forwards `accessibilityState.expanded` to `aria-expanded`,
including collapsed and removed states.

```tsx
import { useState } from 'octane'
import { Pressable, Text } from '@octane-xplat/ui'

export function DetailsToggle() {
	const [expanded, setExpanded] = useState(false)
	return (
		<Pressable
			accessibilityState={{ expanded }}
			onPress={() => setExpanded(!expanded)}
		>
			<Text>{expanded ? 'Hide details' : 'Show details'}</Text>
		</Pressable>
	)
}
```

[Pressable documentation](https://octane-xplat.goddardai.org/components)
