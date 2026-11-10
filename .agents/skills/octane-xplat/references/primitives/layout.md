# Containers and scrolling

Use for retained screen layers and AppKit scroll commands. Shared sizing and styling follow the [primitive contracts](contracts.md) and [styling guide](../styling.md).

## Retained screen layers

`Screen` stays in its parent's flow. To cover retained content, wrap each
layer in `View row={0} col={0}` inside one full-bounds, single-cell `Grid`.
Put `Screen` inside the later wrapper; `Screen` itself has no row/col props.
Do not use flex-column siblings, `flex: 1`, or z-index as a substitute for
layer placement. See [the complete example and host prerequisites](../../../../../docs/app/primitives.md#layer-a-screen-over-retained-content).
On native, the foreign RootLayout shell fills that slot; `Screen.className`
and `Screen.style` address its inner Mason column. Put parent bounds on the
layer wrapper rather than pinning the shell to the display height, which
does not follow a resized activity window.

```tsx
import { Grid, Screen, Text, View } from '@octane-xplat/ui'
import './screen-layers.css'

export function RetainedLayers() {
  return <Grid rows="*" columns="*" className="screen-layers-host">
    <View row={0} col={0}><Text>Library</Text></View>
    <View row={0} col={0}>
      <Screen className="screen-layers-screen"><Text>Player</Text></Screen>
    </View>
  </Grid>
}
```

```css
/* screen-layers.css */
.screen-layers-host { width: 100%; height: 100%; }
.screen-layers-screen {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  flex: 1;
}
```

The maintained layer regression qualifies height resizing on both mobile
platforms and width resizing on Android. An iOS nested stage can still report
zero width after settling; follow the [known-limits evidence](../known-limits.md)
before promising nested-stage width parity.

## Windows legacy Flexbox repair

Keep shared layout on Mason. NativeScript's legacy Flexbox is a separate engine;
its x64 repository-host repair needs matching Core code and Widgets binaries.
The Windows build checks their hashes and rejects stale installed Core before
bundling. After changing the pin or patch, refresh dependencies and rerun the
[legacy layout regression](../../../../../tools/windows-qualification/README.md#run-the-legacy-flexbox-regression).
Earlier bounded native geometry does not qualify a newly built package, other
architectures or complete flex parity. See the
[repair scope and reproduction](../../../../docs/windows-layout-repair.md#automatic-fixed-size-shrink-candidate)
before changing either side.

## AppKit scroll offsets

Use the portable ScrollableArea handle for logical start/top offsets in AppKit
points. Its inline offsets/state and inline padding follow useDirection; RTL
start is the right edge. Internal VirtualList/chat/tab helpers retain physical
coordinates. The shared native seek logic clamps ranges; omitted
axes retain their origin and missing animator selectors fall back to an instant
seek. Native coordinate reads use the generated NSView `flipped` property,
including measurements. Source/object-driver cases do not qualify OS scrolling,
animation or virtualization performance.

```tsx
import { useRef } from 'octane'
import { Button, ScrollableArea, type ScrollableAreaHandle } from '@octane-xplat/ui'

export function Notes() {
  const viewport = useRef<ScrollableAreaHandle | null>(null)
  return <>
    <Button label="Top" clickAction={() => viewport.current?.scrollToOffset({ block: 0 })} />
    <ScrollableArea ref={viewport} height={200}>Notes</ScrollableArea>
  </>
}
```


AppKit renderer geometry subscriptions are node-owned across partial setup,
replacement and teardown. Native cleanup is captured, all removals are attempted
once, queued work checks current scroll/clip/document ownership and old cleanup
cannot clear a newer lease. Invalid dimensions do not reach native scrolling;
failed layout/positioning can retry on a later frame, and failure does not consume
initial-position readiness. Shared notification-enable flags stay enabled.
 These are source repairs, not
OS notification, resize/scroll/elasticity/memory or installed proof. Keep pull-to-
refresh separate; do not apply the iOS contentInset mechanism to AppKit without
native phase/docking evidence. See [renderer ownership](../../../../../docs/packages/package-macos-appkit.md#own-scroll-geometry-observation).

```tsx
import { ScrollableArea, Text } from '@octane-xplat/ui'

export function Notes(props: { height: number }) {
  return <ScrollableArea height={props.height}><Text>Trip notes</Text></ScrollableArea>
}
```

AppKit ScrollableArea forwards declared testID, accessible, hint and value to
the native viewport. accessibilityLabel wins over label. The renderer uses
accessibilityHelp/value descriptions without changing scroll role, contents or
position; empty strings remain explicit, removed descriptions clear to nil and
removed accessible restores participation. Source cases and the manual fixture
require separate verification. VoiceOver hierarchy/descendant navigation, native setters/updates,
identity and packing require separate target qualification; arbitrary role/state/live behavior and
pull-to-refresh are still separate gaps.

```tsx
import { ScrollableArea, Text } from '@octane-xplat/ui'
export function Notes({ count }: { count: number }) {
  return <ScrollableArea label="Notes" height={200} testID="notes"
    accessibilityHint="Scroll to review." accessibilityValue={`${count} notes`}>
    <Text>Trip details</Text>
  </ScrollableArea>
}
```

## iOS subtree input suspension

For an ancestor drag, use `suspendScrollInput` from `@octane-xplat/ui/ios` on
a loaded content host, before moving the ancestor. Retain its idempotent
release through cancel/close/unmount; overlapping owners all release before
restoring prior native flags. It snapshots mounted descendants; release and
reacquire around subtree replacement. Never use overflow hidden as a temporary
iOS input lock (it clamps offsets), or treat touchAction as momentum
cancellation. Ancestor and unrelated recognizers remain independent.

Requires Mason core `1.0.0-beta.8` or later; earlier registry builds lack the
native `userScrollEnabled` setter. Missing or unloaded Mason support throws,
rather than silently claiming suspension. A native rebuild is required after
upgrading the dependency.
See [iOS input suspension](../../../../../docs/app/primitives.md#pause-ios-user-scrolling-during-an-ancestor-drag)
for usage and runtime qualification limits.

## Native pan callback updates

Native `onPan` props retain their normalized callback across state and callback
updates while reading the latest committed handler. Inline handlers can update
state without an app-owned recognizer workaround. Removing the prop or unmounting
still removes the listener. Host regressions qualify callback ownership, not OS
touch delivery or native recognizer continuity under real input.

```tsx
import { useState } from 'octane'
import { View } from '@octane-xplat/ui'

export function DragSurface() {
  const [dragging, setDragging] = useState(false)
  return <View onPan={event => setDragging(event.state === 'moved')}>
    {dragging ? 'Dragging' : 'Ready'}
  </View>
}
```
