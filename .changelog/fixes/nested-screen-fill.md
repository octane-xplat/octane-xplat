---
release: lockstep
---

### Fill native screen layers around intrinsic content

On iOS and Android, a nested `Screen` now fills the space assigned by its
parent instead of shrinking to its content's natural height. Its native shell
can also shrink with its parent without a fixed native height.

```tsx
import { Grid, Screen, Text, View } from '@octane-xplat/ui'

export function PlayerLayer() {
	return <Grid rows="*" columns="*" style={{ width: 300, height: 500 }}>
		<View row={0} col={0}><Text>Library</Text></View>
		<View row={0} col={0}>
			<Screen><Text>Player</Text></Screen>
		</View>
	</Grid>
}
```

[Screen layers](https://octane-xplat.goddardai.org/primitives#layer-a-screen-over-retained-content)
