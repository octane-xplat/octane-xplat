# Add a side drawer

> Add a navigation panel with mobile edge gestures and shared open/close controls.

Install the drawer package when your app needs a sliding navigation panel.
The package owns its mobile plugins; you do not need to declare ui-drawer or
gesturehandler separately.

```sh
pnpm add @octane-xplat/drawer
```

Use the same `Drawer` import on web, iOS, Android, macOS, and Windows. On phones,
users can open it from the left edge and drag it closed. Web and desktop use a
panel with explicit controls and backdrop dismissal; they have no edge-swipe
recognizer. The content and its appearance belong to your app.

```tsx
import { useState } from 'octane'
import { Drawer } from '@octane-xplat/drawer'
import { Button, Text, View } from '@octane-xplat/ui'

export function NavigationDrawer() {
	const [open, setOpen] = useState(false)
	return (
		<Drawer
			open={open}
			onOpenChange={setOpen}
			accessibilityLabel="Main navigation"
			main={<Button label="Open navigation" clickAction={() => setOpen(true)} />}
			drawer={
				<View>
					<Text>Navigation</Text>
					<Button label="Close navigation" clickAction={() => setOpen(false)} />
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
import { Drawer } from '@octane-xplat/drawer'

export function InitiallyOpenDrawer() {
	return <Drawer defaultOpen main={null} drawer={null} onDismiss={() => console.log('Closed')} />
}
```

Set `width` in dips (CSS pixels on web). Mobile gestures are enabled by default;
`isGestureEnabled={false}` disables edge and drag gestures while preserving
explicit controls. Mobile animation honors the OS reduced-motion setting, and
`reducedMotion` can also disable it explicitly.

```tsx
import { Drawer } from '@octane-xplat/drawer'

export function FixedPanel() {
	return <Drawer width={320} isGestureEnabled={false} reducedMotion main={null} drawer={null} />
}
```

## Migrate existing drawers

**Breaking change:** `Drawer` and `DrawerProps` no longer come from
`@octane-xplat/ui`. `SideDrawer` and `DrawerLayout` and their prop aliases are
removed from the UI platform subpaths. All three become the same `Drawer`
component. Keep your existing main and panel content, and connect
`onOpenChange` for controlled visibility.

```tsx
import { Drawer, type DrawerProps } from '@octane-xplat/drawer'

export function AppDrawer(props: DrawerProps) {
	return <Drawer {...props} />
}
```

The mobile implementation uses a custom NativeScript layout and gesture
recognizers; it does not supply OS menu rows, typography, or chrome. Web traps
keyboard focus while open, dismisses on Escape, and restores focus after close.
Native screen-reader focus isolation, RTL edge selection, and competition
with system Back gestures still require target-specific qualification. See
[the implementation evidence](../../.agents/docs/native-drawer.md) for actual
checks and remaining limits.

The experimental GTK4/GJS renderer does not yet support Drawer. Its entry point
rejects rendering explicitly; Linux WebView applications use the web panel.
