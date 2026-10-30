### Use native macOS window and lifecycle hooks through platform entries

AppKit now selects the same native implementations through the platform root
and screen, lifecycle, safe-area and breakpoint subpaths. Hook calls live in
files included by the AppKit compiler. Window snapshots are stable read-only
content sizes, and subscriptions retain their native owner through cleanup.

```tsx
import { useWindowSize, useAppState } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function WindowStatus() {
	const size = useWindowSize(), state = useAppState()
	return <Text>{`${state}: ${size.width}×${size.height}`}</Text>
}
```

**Breaking change:** AppKit `useBackHandler` returns `void`, matching the shared
contract. Remove assignment/calls of its former no-op cleanup. It remains an
Android-only back interception hook with no AppKit listener. Treat returned
window snapshots as immutable; copy them before changing a local value.

```tsx
import { useBackHandler } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function Editor() {
	useBackHandler(() => false)
	return <Text>Editor</Text>
}
```

See [AppKit window and activity state](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#read-appkit-window-and-activity-state).
Primary-window scope, zero insets and existing missing-host fallbacks remain;
compiler/native resize/activity/input/AX/memory and installed-app qualification
are pending.
