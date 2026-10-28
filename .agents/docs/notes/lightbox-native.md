# Native lightbox implementation

This note records constraints in the private `@octane-xplat/lightbox` leaf.
The public UI Lightbox cutover has not happened yet.

## iOS layout and clipping

Verified on 2026-10-28 with NativeScript core 9.1.3, native Octane renderer
0.2.5, and gesturehandler 2.0.45 on the iPhone 18 Pro simulator (iOS 27.0).
The opening morph must wait for positive native wrapper bounds; a single
16 ms retry can expire before layout. Closing or unmounting cancels that wait.

During a transform, core's `getActualSize()` reports the transformed frame:
a 402 × 301.5 DIP wrapper scaled by 0.298507 reported 120 × 90 DIP. A clip
mask needs the untransformed local bounds instead. The writer reads the
native layer's bounds and attaches its mask after layout, with implicit
Core Animation actions disabled:

```ts
const layer = view.nativeViewProtected.layer
const { width, height } = layer.bounds.size
CATransaction.begin()
CATransaction.setDisableActions(true)
try {
  mask.frame = CGRectMake(left, top, width - left - right, height - top - bottom)
  mask.cornerRadius = radius
  layer.mask = mask
} finally {
  CATransaction.commit()
}
```

The earlier mount-time attachment attempt did not retain a mask. Direct
assignment after layout does work; the earlier conclusion that the bridge
could not assign a mask was too broad. The exact cause of the lost early
mask was not isolated. The writer tolerates a late native host and restores
its mask if a host update removes it. Keep this behavior covered when
upgrading core or the renderer. No layout fallback is needed on this target.

Full-screen coverage also depends on a prepared native Page; see
[Native Screen bounds](../screen-safe-area.md) for the app-host contract.

## Verification boundary

- The local probe `research/lightbox-probes/lightbox.ios.tsrx` passed 20
  assertions. Morph start and end geometry matched within 1 DIP, the backdrop
  covered 402 × 874 DIP, and handler dispatch covered paging, double-tap,
  pinch overscale/settle, pull dismissal/spring-back, UI toggle, and the
  reduced-motion fade. Raw result: local, ignored
  `research/lightbox-probes/logs/phase3-ios-2026-10-28.json`.
- The maintained [Maestro flow](../../../../.maestro/lightbox.yaml) passed on a
  fresh iOS build. It delivered OS taps/swipes for paging, pull dismissal,
  reopening, and backdrop dismissal. Result: local, ignored
  `research/maestro/ios/1793162985790/report.xml` (one test, zero failures).
- Maintained object-driver tests cover delayed layout, close during opening,
  mask ownership and local coordinates, reopening on a nonzero slide, and
  smooth paging cancellation. They do not establish OS input behavior.

No physical device, OS pinch input, screenshots, or visual parity inspection
was used. This private implementation repair does not change the public
shared-overlays recipe.

## Android clipping and qualification

The Android writer uses a native outline in physical pixels, keeping shared
morph inputs in DIPs. It takes the untransformed size from the native view,
converts insets and radius, and restores the previous outline when cleared.
The platform import selects this writer instead of the iOS CALayer writer:

```ts
import { createClipWriter } from './clip'

const writer = createClipWriter(view)
writer.setClip({ top: 50, right: 0, bottom: 50, left: 0 }, 12)
writer.clear()
```

Gesturehandler 2.0.45's Android activation-distance setter takes physical
pixels, while emitted coordinates and velocity use DIPs. The adapter converts
only the activation threshold; its regression test uses a 2× density to
catch a missing or double conversion. Each handler's own callback is removed
on viewport cleanup, including pinch and both tap handlers.

Verified on 2026-10-28 with the same core/renderer/plugin versions as iOS,
Android API 35 Google APIs arm64, emulator 37.1.11, and the host GPU (Apple M4):

- The local `research/lightbox-probes/lightbox.android.tsrx` probe passed 21
  assertions: full-page backdrop, morph rectangles within 1 DIP, the iOS
  gesture cases, reduced-motion fade, and Android back dismissal. Gesture
  cases used handler dispatch; back used `adb shell input keyevent 4` while
  the viewer was open. Raw result: local, ignored
  `research/lightbox-probes/logs/phase4-android-2026-10-28.json`.
- A native Choreographer sample during opening recorded 60 intervals with
  mean and p95 of 16.67 ms over about one second. This measures native frame
  callbacks, not presented pixels or physical-device performance.
- The maintained Maestro flow passed on a fresh Android build: OS taps and
  swipes covered paging, pull dismissal, reopening, and backdrop dismissal.
  Result: local, ignored
  `research/maestro/android/1793163729524/report.xml` (one test, zero failures).

macOS qualification and the public package cutover are still pending.
