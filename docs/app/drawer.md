# Add a side drawer

> Add a navigation panel with mobile edge gestures and shared open/close controls.

Use `Drawer` from the shared UI package. Mobile input uses the same gesture owner as shared buttons, sliders, and drag surfaces, with no separate drawer package or plugin setup.

```tsx
import { Drawer } from '@octane-xplat/ui'
```

Use the same `Drawer` import on web, iOS, Android, macOS, Windows, and GTK4/GJS (Linux). On phones,
users can open it from the left edge and drag it closed. Web and desktop use a
panel with explicit controls and backdrop dismissal; they have no edge-swipe
recognizer. The content and its appearance belong to your app.

```tsx
import { useState } from 'octane'
import { Drawer } from '@octane-xplat/ui'
import { Button, Text, View } from '@octane-xplat/ui'

export function NavigationDrawer() {
  const [open, setOpen] = useState(false)
  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      accessibilityLabel="Main navigation"
      main={<Button label="Open navigation" onPress={() => setOpen(true)} />}
      drawer={
        <View>
          <Text>Navigation</Text>
          <Button label="Close navigation" onPress={() => setOpen(false)} />
        </View>
      }
    />
  )
}
```

Pair controlled `open` with `onOpenChange` so mobile gestures can update your
state. For an independent drawer, omit `open` and optionally seed `defaultOpen`.
`onDismiss` reports user dismissal, while prop changes do not echo through
either callback. Keep visible open and close controls for people who do not
use gestures.

```tsx
import { Drawer } from '@octane-xplat/ui'

export function InitiallyOpenDrawer() {
  return <Drawer defaultOpen main={null} drawer={null} onDismiss={() => console.log('Closed')} />
}
```

Set `width` in dips (CSS pixels on web). Mobile gestures are enabled by default;
`isGestureEnabled={false}` disables edge and drag gestures while preserving
explicit controls. Mobile animation honors the OS reduced-motion setting, and
`reducedMotion` can also disable it explicitly.

```tsx
import { Drawer } from '@octane-xplat/ui'

export function FixedPanel() {
  return <Drawer width={320} isGestureEnabled={false} reducedMotion main={null} drawer={null} />
}
```

## Migrate existing drawers

**Breaking change:** import `Drawer` and `DrawerProps` from `@octane-xplat/ui`. Remove `@octane-xplat/drawer` from your dependencies. The former `SideDrawer` and `DrawerLayout` platform aliases remain removed. Keep your existing content, state callbacks and shared props.

```tsx
import { Drawer, type DrawerProps } from '@octane-xplat/ui'

export function AppDrawer(props: DrawerProps) {
  return <Drawer {...props} />
}
```

The mobile implementation composes NativeScript views over the shared gesture
owner. A horizontal drag claims input before moving the panel and cancels the
nested button press from that contact. A second finger cancels that drag; the
remaining finger cannot restart it until everyone lifts. Native editing and
slider manipulation keep priority. It does not supply OS menu rows or chrome.

```tsx
<Drawer isGestureEnabled main={mainContent} drawer={navigationContent} />
```

Web traps keyboard focus while open, dismisses on Escape, and restores focus after close.
Native screen-reader focus isolation, RTL edge selection, and competition
with system Back gestures still require target-specific qualification. See
[the implementation evidence](../../.agents/docs/native-drawer.md) for actual
checks and remaining limits.

On the GTK4/GJS renderer `Drawer` mounts a start-docked panel over a modal
scrim layer inside the app window. Backdrop presses and Escape dismiss it;
the `gtk` export condition resolves the leaf automatically. There is no edge
swipe — supply an explicit open and close control like on desktop.

## Native host migration

**Breaking change:** mobile Drawer no longer creates a ui-drawer host. After updating the import to UI, keep the same content, state callbacks and width. Remove ui-drawer-only settings from `ios`/`android`, including `gestureHandlerOptions`, `shouldPan`, `translationFunction`, and `animationFunction`; these and function-valued native overrides now throw a configuration error. Use the shared props to disable gestures or animation. Drawer no longer requires its former plugin chain; remove an app-direct plugin declaration only when no other installed feature needs it.

```tsx
<Drawer open={open} onOpenChange={setOpen} width={280}
  isGestureEnabled={false} reducedMotion main={mainContent} drawer={navigationContent} />
```

A new drag can stop a settling panel at its current position. Programmatic `open` changes replace pending motion without reporting a user dismissal. Cancelled drags restore the accepted open state; only successful user transitions request a new state. The mobile panel still opens from the physical left edge. Web and desktop retain explicit controls.

```tsx
<>
  <Button label="Open navigation" onPress={() => setOpen(true)} />
  <Button label="Close navigation" onPress={() => setOpen(false)} />
</>
```

Mobile Drawer reserves the horizontal scroll axis in its subtree while gestures are enabled. Vertical scrolling remains available; use explicit controls with gestures disabled when the main content needs native horizontal scrolling. Contacts outside the edge region do not activate the closed drawer.

```tsx
<Drawer isGestureEnabled={false} open={open} onOpenChange={setOpen}
  main={mainContent} drawer={navigationContent} />
```
