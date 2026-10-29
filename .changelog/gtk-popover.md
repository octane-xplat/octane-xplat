### Show anchored popovers on GTK

GTK 4.14+ apps can now import Popover from the shared UI root. Content keeps
its surrounding context in a native popup: placement and alignment honor the
shared API, Escape or outside taps request dismissal (or pass through when
disabled), and focus returns to the previous control — or to finalFocusRef.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import type { HostElement } from '@octane-xplat/jsx/intrinsics'
import { Popover, Pressable, Text, View } from '@octane-xplat/ui'

export function DatePicker() {
  const anchor = useRef<HostElement | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <View>
      <View ref={anchor}>
        <Pressable onPress={() => setOpen(true)}><Text>Pick a date</Text></Pressable>
      </View>
      <Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)} placement="bottom">
        <Text>Calendar</Text>
      </Popover>
    </View>
  )
}
```

Nested popovers, controlled/uncontrolled open state, dismissOnEscape and
dismissOnOutsideTap follow the shared contract. [GTK setup and
limits](https://octane-xplat.goddardai.org/linux-gtk#popovers).
