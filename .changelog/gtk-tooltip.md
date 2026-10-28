### Show GTK tooltips with pointer and keyboard intent

GTK 4.14+ apps can now import Tooltip from the shared UI root. Content keeps
its surrounding context while a native popover handles placement. Focus on a
focusable trigger opens it immediately; Escape, blur, scrolling or disabling
dismisses it without moving focus.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Tooltip } from '@octane-xplat/ui'

export function DeliveryHelp() {
  return (
    <Tooltip
      trigger={<button text="Delivery details" />}
      content="Orders ship on the next business day."
      placement="right"
      openDelay={300}
    />
  )
}
```

Use contentClassName/contentStyle to style the noninteractive panel. Native
description references, timers and popup observers are cleaned up on close or
unmount. [GTK tooltip setup and limits](https://octane-xplat.goddardai.org/platform/linux-gtk#tooltips).
