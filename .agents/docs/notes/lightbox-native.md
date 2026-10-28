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

## Source checks and shared hook contracts

The private package now checks its web, native, Android clipping, and macOS
entry sources through `tsconfig.envs.json`. Declaration generation alone
previously checked the props and hand-maintained declarations, leaving native
hook return values unchecked. `useLightboxState()` now returns the shared
`items`, `item`, `count`, visibility, navigation, and zoom methods;
`useLightbox()` supplies both default and indexed trigger props.

```tsx
const state = useLightboxState()
state.next()
state.resetZoom()
```

Two Android bridge declarations need narrow local type assertions with
`@nativescript/types-android` 9.1.1: `ViewOutlineProvider.extend` is missing,
and `View.setOutlineProvider` does not accept `null` in its TypeScript
signature. NativeScript documents the runtime
[`extend` mechanism](https://docs.nativescript.org/guide/extending-classes-and-implementing-interfaces-android),
and Android permits a null
[`outline provider`](https://developer.android.com/reference/android/view/View#setOutlineProvider(android.view.ViewOutlineProvider)).
The assertions cover subclass creation and restoring the previous provider;
they do not change the Android writer's behavior. Recheck these assertions
when upgrading the Android declarations.

## Phase 5 preview and verification

The private leaf now has `Thumbnails`, `Thumbnail`, and `ThumbnailIndicator`
parts. Web and native use the same thumbnail geometry model; each leaf owns
measurement, indicator writes, and strip scrolling.

```tsx
<Lightbox.Thumbnails>
	<Lightbox.Thumbnail index={0}><Text>Coast</Text></Lightbox.Thumbnail>
	<Lightbox.Thumbnail index={1}><Text>Forest</Text></Lightbox.Thumbnail>
	<Lightbox.ThumbnailIndicator />
</Lightbox.Thumbnails>
```

Verified on 2026-10-28 on a remote Intel Mac running macOS 15.7.7:

- Playwright 1.63.0 / WebKit 2359 passed 31 numeric browser checks. New
  coverage includes slow mouse drags, fast flicks, zoomed panning, unequal
  thumbnail dimensions at fractional progress, indexed activation, and strip
  centering. The Chromium-only touch check was skipped. No screenshots or
  image analysis were used.
- The focused suites passed 58 web/shared tests and 22 native object-driver
  tests. These include the shared hook contract and thumbnail geometry;
  object-driver results do not establish native layout or input behavior.
- The touched-package/dependents source typecheck passed through Turbo.
  Lint passed with the existing image-class and tap-test warnings.

Local ignored logs are under `research/lightbox-probes/logs/` as
`phase5-webkit-2026-10-28.log`, `phase5-unit-2026-10-28.log`, and
`phase5-typecheck-2026-10-28.log`.

The viewport keeps the latest index callback in a ref. Otherwise an index
change can reattach its scroll effect and force the viewport to a whole slide,
destroying fractional progress before the indicator has finished moving.

Before the public cutover:

- Qualify the new thumbnail strip and the updated native host styles on iOS
  and Android. The earlier native evidence above predates these changes.
- Finish native page-behind scrolling: `scroll-sync.ts` currently writes the
  existing offset back to the ancestor. The placeholder trigger visibility
  calculation in `root.tsrx` also needs real viewport clipping before the
  offscreen-trigger fallback can be considered qualified.
- Handle natural native image dimensions when callers omit media width and
  height; the current native image falls back to a square aspect ratio.
- Complete the AppKit subset and run the maintained overlay fixture. The
  fixture selects `macos-arm64/host`; the current remote Intel host cannot
  run it. The inspected remote environment also lacks the iOS simulator tools, adb,
  and Maestro.
- Complete the UI export removal, consumer/doc migration, recipes, and release
  preparation in the plan. The shared-overlays recipe still uses the public
  UI Lightbox; no public workflow or recipe has switched to the private leaf.

## Dialog text audit repair

Web Title and Description register instance-specific IDs with the dialog host.
Native Title reads its rendered Label text (including textChange updates) for
the Overlay name; native children are render descriptors, not plain strings.
Native Description remains ordinary accessible text. The adapter does not yet
implement a dialog-description relationship, and no screen-reader equivalence
has been qualified. NativeScript documents accessibilityLabel for naming and
accessibilityHint for action help; a hint is not used as a substitute description.
See [NativeScript accessibility](https://docs.nativescript.org/guide/accessibility).

Object-driver checks establish text registration and the chosen host name.
They do not establish VoiceOver/TalkBack announcements. This partial repair
leaves native description association open before any full-parity claim.
