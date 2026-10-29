### Keep component state when rendering into a GTK host container

GTK host integrations can now render universal portals into a live layout
container while keeping their Octane context and state. Moving or removing
portal content preserves widgets owned by the host application.

```tsx
import { Text } from '@octane-xplat/ui'
import { createPortal, type UniversalRenderable } from '@octane-xplat/linux-gtk'

export function PortalContent(props: { target: unknown }) {
  return createPortal(<Text>Portal content</Text> as UniversalRenderable, props.target)
}
```

Targets must be local multi-child layout containers and remain alive until
portal removal. UI tooltip and dialog components remain outside the qualified
GTK exports. See [GTK portal targets](https://octane-xplat.goddardai.org/linux-gtk#portals-for-gtk-host-integrations).
