### AppKit button links and busy actions

AppKit Button now opens sanitized hrefs, wraps text children in a native label
and keeps content mounted while an action is busy. Interruptible overlapping
calls keep busy state until every call settles.

```tsx
import { Button } from '@octane-xplat/ui'

export function Help() { return <Button href="https://example.com/help">Read help</Button> }
```

Native input, URL opening, busy layout and VoiceOver remain unqualified; tooltip
presentation remains unsupported. See [AppKit buttons](https://octane-xplat.goddardai.org/app/components#appkit-button-actions-and-links).

IconButton now uses the same AppKit Button owner for group disablement,
identifiers, href and pending actions, with its required label retained as the
accessible name.

```tsx
import { IconButton } from '@octane-xplat/ui'

export function Share({ share }: { share(): Promise<void> }) {
	return <IconButton label="Share document" icon="share" clickAction={share} />
}
```
