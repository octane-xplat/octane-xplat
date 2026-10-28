### Move an element between components

Give motion hosts the same `layoutId` to animate position and size between
them. Use a distinct `LayoutGroup id` for independent controls. With `Presence`,
outgoing content crossfades and stays mounted until the handoff finishes;
changing direction during the animation continues from its current position.

```tsx
import { LayoutGroup, Presence, motion } from '@octane-xplat/motion'
import { View } from '@octane-xplat/ui'

export function Highlight({ expanded }: { expanded: boolean }) {
	return <LayoutGroup id="card">
		<View style={{ position: 'relative', height: 160 }}>
			<Presence present={!expanded} style={{ position: 'absolute', left: 0, top: 0 }}>
				<motion.View layoutId="surface" style={{ width: 120, height: 80 }} />
			</Presence>
			<Presence present={expanded} style={{ position: 'absolute', left: 0, top: 0 }}>
				<motion.View layoutId="surface" style={{ width: 240, height: 160 }} />
			</Presence>
		</View>
	</LayoutGroup>
}
```

[Shared-element animations](https://octane-xplat.goddardai.org/animation-gestures#move-an-element-between-components)
