# Native Screen bounds and prepared Pages

`Screen` uses its assigned host rectangle. Its RootLayout and inner Mason root
ignore native safe-area adjustment; `SafeArea` supplies explicit padding.
A Screen inside an inset host stays inside that host. It does not require a
window-origin parent and does not expand an embedded Frame to window size.

```tsx
import { SafeArea, Screen, Text } from '@octane-xplat/ui'

export function Content() {
 return <Screen><SafeArea><Text>Safe once</Text></SafeArea></Screen>
}
```

`prepareFullScreenPage` supports a Frame-navigated Page. Call it before rendering
content and hide the native action bar for an edge-to-edge root. The Page's
native bounds remain authoritative, including when its Frame is embedded.

```ts
import { Frame, Page } from '@nativescript/core'
import { prepareFullScreenPage } from '@octane-xplat/ui/nativescript'

const frame = new Frame()
const page = prepareFullScreenPage(new Page())
page.actionBarHidden = true
frame.navigate({ create: () => page })
```

## Upstream behavior and local handling

[Issue 47](https://github.com/octane-xplat/octane-xplat/issues/47) reports the
first Screen's child at y=124 while its RootLayout is already at y=62, then
correcting on relayout. It also reports a prepared Page's percentage-height
app root at y=48, h=778 in an 874pt window. These are separate boundaries:

- NativeScript core 9.1.3's `GridLayout.onLayout` adds `getSafeAreaInsets()`
  to its child offsets. RootLayout inherits that behavior. MasonKit beta.126
  also adjusts core-hosted Mason roots through `setRootNativeViewFrame` and
  defaults `iosOverflowSafeArea` to false. Screen's inner root has explicit 100% width and height so Mason also
  computes descendants against that frame. Screen disables both implicit
  adjustments before first layout. This avoids relying on UIKit's initially
  reported insets or on a subsequent state change to settle the position.
- Core 9.1.3's `IOSHelper.layoutView` measures the Page using
  `safeAreaLayoutGuide.layoutFrame`, regardless of `iosIgnoreSafeArea`.
  Page layout uses the actual native frame. A 100%-height child can therefore
  measure at 778pt and center in 874pt, leaving 48pt at each end. Prepared
  Pages wrap their existing `measure` to use the current native bounds and
  preserve the Page's inherited `iosIgnoreSafeArea` setting for its content.
  Wrapping `measure` also updates the cached parent specs that core uses for
  percentage lengths; changing only `onMeasure` leaves them inset.
  The wrapper is installed once and also handles replacement content.
  Zero/unavailable bounds retain the incoming measure specs. Android keeps
  its existing `androidOverflowEdge = 'ignore'` behavior.

Source references: [core Page](https://github.com/NativeScript/NativeScript/blob/9.1.3-core/packages/core/ui/page/index.ios.ts),
[core layout helper](https://github.com/NativeScript/NativeScript/blob/9.1.3-core/packages/core/ui/core/view/view-helper/index.ios.ts),
[core GridLayout](https://github.com/NativeScript/NativeScript/blob/9.1.3-core/packages/core/ui/layouts/grid-layout/index.ios.ts),
[Mason root frame handling](https://github.com/octane-xplat/nativescript-mason/blob/v1.0.0-beta.126/packages/nativescript-masonkit/common.ts).

This is a local, per-Page workaround, not a global NativeScript patch. Revisit
it when core measures ignore-safe-area Pages against their native bounds and
Mason's content root no longer independently shrinks them. Screen's explicit
inset ownership remains its contract.

## Verification

The focused unit tests cover measurement units, resizing, replacement content,
idempotence, pre-layout fallback and unchanged Android measurement. The
object-driver Screen test covers flags on both native hosts; neither test
establishes native geometry.

The maintained [iOS fixture](../../examples/probes/screen-safe-area.ios.tsrx)
checks first-mount bounds, one safe-area padding, stable relayout and a later
Screen mount. Run it in a fresh process to expose session-first behavior:

```sh
bun run probe doctor
bun run probe run examples/probes/screen-safe-area.ios.tsrx --target ios --device SIMULATOR_UDID --fresh-process
```

Verified on 2026-10-23 with iOS 27.0, an iPhone 18 Pro simulator (402 × 874pt),
NativeScript core 9.1.3 and MasonKit beta.126. The probe runner used
`--watch --fresh-process`; the task-local case re-exported the maintained
fixture to reuse its isolated native build. All 27 geometry assertions passed.
Before the fix, the inset-host case placed the Screen at y=62 and its content
at y=124, correcting to y=62 on relayout. A percentage-height app root in a
prepared Page measured y=48, h=778. After the fix, the inset-host Screen,
content and stage stay at y=62, h=778 from first mount; prepared Page content
fills y=0, h=874. A later Screen has the same bounds and SafeArea pads its
child by 62pt once. These are native geometry measurements, not screenshots,
OS input or keyboard qualification. Android and desktop runtimes were not run.
