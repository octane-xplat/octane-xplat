### Keep native macOS sheets attached to their owning window

`AppKitSheet` now owns current dismissal callbacks, waits for its window and
portal content, and cleans up queued or presented sessions on close or owner
removal. Its classes/styles apply to the content host. The native demo includes
record editing, nested sheets and queued requests.

Breaking: the parentless floating-window fallback is removed. Keep the anchor
mounted in the intended window; a request waits until that window is attached.

```tsx
// Details.macos.tsx
import { AppKitSheet } from '@octane-xplat/sheet/macos'
import { Text } from '@octane-xplat/ui'
export function Details({ record, open, close }: {
	record: { id: string; title: string }; open: boolean; close: () => void
}) {
	return <AppKitSheet id={`details-${record.id}`} open={open}
		className="p-4" onDismissed={close}
		content={() => <Text>{record.title}</Text>} />
}
```

See the [native window-sheet guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/sheet.md#native-macos-window-sheets).
Actual AppKit input, queueing/cancellation, nested presentation, focus, layout,
VoiceOver and packaged consumers remain unqualified.
