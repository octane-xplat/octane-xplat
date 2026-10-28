### Request an awake display on native Windows

Experimental Windows keep-awake now uses WinRT DisplayRequest. Independent tags
share one request; app suspension releases it and resume reapplies remaining
owners. Failed release keeps ownership so cleanup can retry. Native construction
and mocked contracts passed; app grants and physical sleep prevention remain
unqualified.

```tsx
import { useKeepAwake } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function ReadingScreen() {
	useKeepAwake()
	return <Text>Reading</Text>
}
```

[Keep a screen awake](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/keep-awake.md)
