# Software keyboard handling

This note owns the feasibility evidence for window-relative keyboard avoidance,
focused-input scrolling, sticky controls, and their interaction with chat and
presentations. Public usage lives in [Follow the phone keyboard](../../docs/app/software-keyboard.md); this note distinguishes runtime measurements from source evidence.

## Existing contract

The mobile wrapper supplies a scroll container with padding for remaining host
overlap and an Android resize lease. Its offset adds space while the keyboard
is open; it is not a screen-to-window coordinate conversion. Web and desktop retain a neutral
wrapper. See [the implementation](../../packages/ui/src/components/layout/KeyboardAvoiding.mobile.tsrx)
and [the public props](../../packages/ui/src/props.ts).

```tsx
import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'

export function Form() {
	return <KeyboardAvoiding keyboardVerticalOffset={12}>
		<TextInput placeholder="Name" />
	</KeyboardAvoiding>
}
```

The iOS observer converts each destination frame from its notification screen
into the owning window. Full-width bottom overlap supplies the numeric inset;
floating/narrow rectangles remain geometry without becoming full-width padding.
The public keyboard guide supplies already-open geometry when available, with
its hidden safe-area strip excluded. This follows Apple's
[coordinate-space guidance](https://developer.apple.com/documentation/uikit/uiresponder/keyboardframeenduserinfokey).
Inset readers share a synchronous registry keyed by native window and
follow NativeScript's `NativeWindow` attach/detach/close lifecycle. The registry
replays available state, rejects callbacks from replaced sources, and releases
observation with its final reader. Host-bound readers use their own window;
unbound hooks follow the active window. Android resize leases are separately
reference-counted and preserve subsequent foreign mode changes. These leases
survive observation-source replacement. Android measures the visible display
frame relative to its own decor root; host compensation uses the actual remaining
overlap, independently of the mode flag. Safe-area and ancestor compensation
cap the remaining demand rather than subtracting physical resize again. Overlay
bindings now share the same window registry, measure actual host displacement,
and preserve existing transforms. They do not replace an app-owned decor inset
listener or infer physical resize from its window flag. Full native presentation
lifecycle qualification remains separate. Destination-only compatibility observations do not establish
synchronized movement. Source:
[keyboard-inset](../../packages/ui/src/internal/keyboard/keyboard-inset.ts).

```ts
// Numeric compatibility and an internal bottom-host binding.
import { subscribeKeyboardInset, bindBottomInsetToKeyboard } from '../../packages/ui/src/internal/keyboard/keyboard-inset'

function attach(host: unknown, notify: (inset: number) => void) {
	const unsubscribe = subscribeKeyboardInset(notify)
	const unbind = bindBottomInsetToKeyboard(host)
	return () => { unbind(); unsubscribe() }
}
```

## Native motion integration

The optional `@octane-xplat/keyboard` package installs a controller source in
that registry. Existing avoidance wrappers consume measured native frames through
imperative padding updates. Only a stable ancestor demand budget enters Octane
state; a partial-height outer viewport claims the whole remaining window demand
so an inner viewport cannot apply it again. Source activation and consumer-owned
Android viewport leases are separate.

```tsx
import { KeyboardProvider } from '@octane-xplat/keyboard'
import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'

export function NativeForm() {
	return <KeyboardProvider>
		<KeyboardAvoiding><TextInput /></KeyboardAvoiding>
	</KeyboardProvider>
}
```

Public snapshots separate measured `currentFrame` from `targetFrame`. The iOS
binding has a separate, internal next-refresh estimate because a property commit
from a display-link callback appears on the following refresh. That estimate is
bounded to one refresh and is never returned as public measured geometry.
Lifecycle subscriptions exclude repeated movement; direct movement subscriptions
must avoid renderer updates per frame.

```ts
import { KeyboardController } from '@octane-xplat/keyboard'

function observe(host: object) {
	return KeyboardController.onMove(host, state => {
		console.log(state.currentFrame, state.targetFrame)
	})
}
```

Native module runs passed opening, complete closing, intermediate frames,
reversal, rapid focus changes, keyboard-type changes, fresh-source attachment,
and property restoration on iOS 27 and Android API 35. The latest maintained
iOS fixture passed 16 assertions, including explicit uncalibrated-state limits
and mid-transition attachment; Android passed 11.
These used programmatic native focus. Earlier iOS geometry runs separately
qualified actual HID input. A later timing run on a task-isolated iOS simulator
measured the rendered native layer against current guide presentation: median
1.08pt, p95 35.08pt, maximum 63.66pt across interrupted sequences. Direct native
updates avoid per-frame Octane renders; these debug-runtime measurements do not
establish pixel-perfect synchronization or production frame pacing.

A newly attached UIKit guide tracker does **not** measure an already-running
keyboard animation: the native reference was at y=825.70 while the fresh tracker
started at its model destination y=546. The adapter therefore reports
`source: 'destination'`, `currentFrame: null`, and `nativeFrames: false` until a
native did-change notification and matching guide presentation establish a known
endpoint. This also makes the first observed iOS transition destination-only.
Subsequent transitions and readers sharing that running source can use measured
frames. No private keyboard-view lookup or fixed warmup timer is used.

```ts
import { KeyboardController } from '@octane-xplat/keyboard'

function hasCurrentMovement(host: object) {
	const state = KeyboardController.getSnapshot(host)
	return state.capabilities.nativeFrames && state.currentFrame !== null
}
```

A real iOS interactive scroll dismissal passed three maintained native assertions:
70 samples arrived while the scroll view was dragging, with 52 distinct keyboard
positions, and the keyboard reached its hidden endpoint. The supported iOS guide
adapter advertises interactive tracking; the gesture policy remains the scroll
host's responsibility. Android interactive tracking remains unqualified and its
capability is false. The gesture was injected through simulator HID, and verified
through the native scroll view's dragging state; no images were used.

A moving control needs the full distance from its bottom to the keyboard edge,
which can exceed its own height. Viewport padding instead uses height-bounded
overlap. The first native-layer measurement caught that distinction after the
property-only test passed; maintained short-control geometry tests now preserve it.

## Prior art examined

Evidence: **desk-source**, `react-native-keyboard-controller` tag `1.22.0`,
commit `b80086f1207e36d634f93afabb65eb886fe1a2fe`.

- [iOS movement watcher](https://github.com/kirillzyusko/react-native-keyboard-controller/blob/b80086f1207e36d634f93afabb65eb886fe1a2fe/ios/observers/movement/observer/KeyboardMovementObserver%2BWatcher.swift)
  samples presentation movement through a display link and compensates animation
  timing. Destination notifications alone are not the implementation.
- [iOS tracking view](https://github.com/kirillzyusko/react-native-keyboard-controller/blob/b80086f1207e36d634f93afabb65eb886fe1a2fe/ios/observers/movement/KeyboardTrackingView.swift)
  includes a configurable keyboard-layout-guide path and an older keyboard-view
  lookup path. The existence of either path does not prove it is safely reusable
  through NativeScript or that private keyboard-view discovery is appropriate.
- [Android animation callback](https://github.com/kirillzyusko/react-native-keyboard-controller/blob/b80086f1207e36d634f93afabb65eb886fe1a2fe/android/src/main/java/com/reactnativekeyboardcontroller/listeners/KeyboardAnimationCallback.kt)
  separates preparation, start, progress, completion, persistent system insets,
  and keyboard resizing. [Android's platform guidance](https://developer.android.com/develop/ui/views/layout/sw-keyboard)
  also distinguishes settled insets from animation progress and native relayout.
- [iOS input delegate](https://github.com/kirillzyusko/react-native-keyboard-controller/blob/b80086f1207e36d634f93afabb65eb886fe1a2fe/ios/delegates/KCTextInputCompositeDelegate.swift)
  reports selection geometry; [Android's focused-input observer](https://github.com/kirillzyusko/react-native-keyboard-controller/blob/b80086f1207e36d634f93afabb65eb886fe1a2fe/android/src/main/java/com/reactnativekeyboardcontroller/listeners/FocusedInputObserver.kt)
  independently tracks focus, layout, and selection. Keyboard height is not a
  substitute for those inputs.

The reusable lesson is the separation of native measurements, movement bindings,
and scrolling policy. React Native event routing, Reanimated worklets, and
renderer-specific workarounds are not an Octane integration strategy.

## Feasibility boundaries

These are mechanisms examined in the initial probes, not guarantees for final
components. [Decision #119](../design/software-keyboard.md) defines ownership;
each behavior still needs its own maintained coverage and runtime qualification.

| Target | Candidate geometry and focus | Candidate movement | Evidence and limits |
| --- | --- | --- | --- |
| Web | Visual viewport and element bounds; focus and selection offsets | Viewport events and scroll host updates | Desktop Chromium API probe passed; no software keyboard observed. Viewport shrink also has non-keyboard causes. A textarea selection offset is not a caret rectangle. |
| iOS | Keyboard frame conversion into the owning window; native input/caret bounds | Public keyboard-guide constraint and presentation-layer samples through a NativeScript display-link target | Native probe passed: actual software-keyboard frames, caret geometry, opening presentation samples and simulator touch delivery. Interruptions, interactive tracking, already-open attachment, floating keyboards, and presentation windows remain unverified. |
| Android | IME/system insets for the actual decor root; focused input layout and selection | AndroidX inset-animation callbacks subclassed through NativeScript | Native probe passed on API 35: callback phases and input geometry. Edge-to-edge variants, navigation modes, dialogs, other API levels, interactive dismissal, full close completion and OS touch remain unverified. |
| macOS | AppKit native responder/field-editor geometry | Retain neutral software-keyboard behavior | Native probe passed: zero inset and an 18-point caret. This is not a mobile keyboard implementation or OS input qualification. |

NativeScript core `9.1.3` exposes the iOS native scroll view, but its
`scrollableHeight` derives from content size minus bounds and does not include
content insets. Any inset-based scrolling integration must reconcile that range
and its clamping rather than assuming the shared scroll operation reaches the
extended range. Evidence: **desk-source**,
[core scroll implementation](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/ui/scroll-view/index.ios.ts).
This is an integration constraint, not a confirmed scrolling defect. No workaround
has been adopted; revisit against the pinned implementation before adding insets.

## Evidence boundaries

### Native movement integration constraints

UIKit's default keyboard guide ends at the safe-area boundary when hidden.
A separate owned UIView/guide can set `usesBottomSafeArea = false` on iOS 17+
and track all the way to the window bottom without changing the host's guide.
The native prototype qualified intermediate opening and closing positions and
confirmed that the host guide retained its original configuration. Earlier
systems need an explicit destination-only fallback. See
[Apple's guide property](https://developer.apple.com/documentation/uikit/uikeyboardlayoutguide/usesbottomsafearea).

```ts
// Configure only the controller-owned view's guide.
const guide = ownedView.keyboardLayoutGuide
if (guide.respondsToSelector('setUsesBottomSafeArea:')) {
	guide.usesBottomSafeArea = false
}
```

On Android, changing `softInputMode` to `ADJUST_NOTHING` does not by itself
disable NativeScript Page avoidance. The default `androidOverflowEdge = 'none'`
adds `max(systemBars, IME)` as native padding, independently of the window mode.
Source: NativeScript `9.1.3`
[Page](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/ui/page/index.android.ts)
and [LayoutBase](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/ui-mobile-base/android/widgets/src/main/java/org/nativescript/widgets/LayoutBase.java).

```ts
// Window policy and NativeScript's view-inset policy are separate inputs.
const windowMode = activity.getWindow().getAttributes().softInputMode
const viewInsetPolicy = page.androidOverflowEdge
```

The public `androidOverflowInset` distribution path can retain system-bar
padding while consuming IME insets for a controller-owned avoidance policy.
The prototype kept the content viewport unresized under `ADJUST_RESIZE` and
restored the original policy and padding after a complete keyboard close.
Production bindings must lease this policy per actual inset owner, preserve
foreign padding/policy writes, and follow replacement native views. Observation
alone must remain read-only. The controller implements this lease; the module probe also checks shared
owners and restoration after a foreign policy switch. Activity recreation
remains unqualified.

```ts
// Event values are native pixels. The owning adapter separately retains bars.
function consumeIme(event: { inset?: { imeBottom: number; imeBottomConsumed: boolean } }) {
	if (event.inset) {
		event.inset.imeBottom = 0
		event.inset.imeBottomConsumed = true
	}
}
```

Android animation callbacks can be installed on an owned zero-size child of the
decor root. The native prototype received complete open/close callbacks and
intermediate closing positions through that child, with a stable decor height.
Bindings should use this ownership boundary instead of replacing a callback on
the app's decor view.

```ts
ViewCompat.setWindowInsetsAnimationCallback(ownedHelper, callback)
// Release the callback and helper when the final window consumer leaves.
ViewCompat.setWindowInsetsAnimationCallback(ownedHelper, null)
```

### Initial and compatibility probes

The initial desktop probe ran in Chromium `153.0.8010.12` with a 400 × 700 viewport.
Focusing and selecting a textarea retained selection offset 8; nearest-element
scrolling moved its bottom from 1144 to 700. Visual viewport information was
available; the Virtual Keyboard API and a textarea caret-rectangle operation
were absent. This establishes ordinary browser focus/scroll geometry only.
No images were captured or inspected.

Maintained registry and host-double tests cover shared readers, separate windows,
late attachment, disabled hooks, replacement, NativeWindow detach/attach/close,
stale callbacks, source rollback, and final cleanup. They establish lifecycle
bookkeeping, not actual Activity recreation or presentation-window geometry.
Native iOS and Android probes also verified that the compatibility hook receives
an opening inset, renders it in a native label, and clears it after hiding the
keyboard. Actual Activity recreation remains a separate runtime qualification.

Host-overlap probes passed on the same iOS and Android targets. The iOS host
ended at y=874 with a keyboard destination at y=546; its requested 8-point offset
produced 336 points of padding. Android's resized host started at y=24 and had
height 357px, ending exactly at the visible viewport bottom y=381. It received
only the requested 8-dip offset while the compatibility hook retained its raw
235-dip value. A separate renderer regression covers a host whose geometric
overlap includes system-bar space omitted by that numeric compatibility value.
These checks do not qualify alternate navigation modes or native presentation
windows. An attempted fixed-height Android fixture remained constrained by
native layout; it did not establish an unresized presentation host.

The iOS probe ran on iPhone 18 Pro / iOS 27.0 with NativeScript core `9.1.3`,
Octane `0.11.0`, and the patched native renderer `0.2.5`. A simulator HID tap at
the accessibility-reported input center produced native touch down/up events.
The source recorded a keyboard destination at y=546, height=328, and 383.3ms
duration; 148 display-link samples included 20 distinct presentation positions.
The native caret measured 2 × 16 points. This establishes the bridge and opening
movement; no Xplat animation component or interactive dismissal was tested.
Waiting only for the guide's destination frame initially ended the case before
presentation movement could be measured; the stronger case waits for the
presentation layer to reach the destination and requires intermediate positions.

The Android probe ran on a task-owned Google APIs arm64 API 35 emulator. Its IME
inset was 259px, system bars 24px, and decor size 320 × 640px. Preparation,
start, movement and completion callbacks were observed, including ten movement
samples. Native input layout supplied caret coordinates. Focus was requested
programmatically; the case did not wait for the entire closing animation or
exercise OS touch, dialog roots, or alternate navigation configurations.

The AppKit/JSC probe retained a zero software-keyboard inset and queried an
18-point native caret after making its field first responder. That establishes
desktop input geometry access, not software-keyboard or OS input support.

Keep execution status and measurements in Silo's `software-keyboard-controller`
topic; temporary cases live in `research/`. No screenshots or recordings were
captured or inspected for these probes. All owned virtual devices were stopped
before their resource reservations ended.

### Workspace qualification prerequisite

The original pinned `@nativescript-community/octane@0.2.5` patch contained
sequential sections for `dist/driver.js` and failed a frozen pnpm `11.24.0`
install, including with a clean virtual store and an isolated content store.
It is now normalized to one forward diff per file. The workspace and isolated
consumer installs accept the normalized patch; the installed driver and
intrinsic declarations are byte-identical to sequential application of the
original patch to the pristine registry package. This repairs patch packaging
without changing renderer behavior. Preserve this format when regenerating the
patch until the underlying fixes ship upstream and the patch can be removed.

## Focused-input geometry integration

The optional keyboard leaf owns a focus source independent of keyboard movement.
The SDK-free platform registry shares one source per actual window (per Document
in browsers, because WindowProxy identity survives navigation). Final-reader
cleanup releases display links, timers, DOM frame requests, and multicast native
listeners. Host detach, window replacement, and document suspension invalidate
the cached identity. No source reads input text or replaces an editing delegate.

Public `FocusedInputController` exposes cached reads, scoped subscriptions, and
an explicit active-reader recheck. Geometry is in device-independent window
coordinates, scroll owners are nearest-first, and selection offsets use UTF-16.
UIKit/AppKit report native insertion rectangles; Android reports an insertion
line from Layout, without claiming cursor-drawable precision. Browser ordinary
inputs report box/selection only; contentEditable uses a collapsed native Range.

Maintained `packages/keyboard/tests/fixtures/focus.*.tsrx` journeys cover selection,
validation displacement, multiline growth, detachment, and cleanup. Nonvisual
qualification on Chromium, iOS27, Android API35, and AppKit verifies native
geometry, rather than handler dispatch. This establishes programmatic focus and
selection; it does not establish actual OS typing, IME composition, arbitrary
transformed scroll ancestors, or Windows/Linux runtime support.

UIKit and Android maintained modal journeys each passed13 assertions, including
subscription after native focus was already established and identity invalidation
on dismissal. These cover NativeScript Page modal hosts, not every platform
sheet/detent implementation.

## Focused-input scrolling

The keyboard leaf's `KeyboardAwareScrollView` combines existing native
`KeyboardAvoiding` range with focused-input geometry. Browser/AppKit variants
use the existing `ScrollableArea`. UI's compatible forwarded host ref allows
this integration without UI depending on the leaf. `KeyboardScrollController`
binds an existing vertical viewport; no policy writes occur outside that
viewport's focused-input scroll chain. Nested ranges are consumed nearest-first.

Clearance controls visibility, extraScrollSpace controls extra open-keyboard
range, and keyboardVerticalOffset retains existing padding semantics. The policy
uses caret geometry only when the full input cannot fit. Unknown caret geometry
falls back to the input box. Bounds and available range constrain movement;
floating-keyboard occlusion is not synthesized into a bottom inset.

Manual gestures pause automatic scrolling by default until focus/selection
changes or explicit recheck; follow is opt-in. Close preserves position by
default. Opt-in restore compares the current SDK offset with the last owned
offset, restores only matching values, and clamps to the current native range.
Manual gestures discard restoration history. Release preserves the position.

Nonvisual long-form checks passed on iOS27 and Android API35: field clearance,
validation displacement without focus transfer, oversized multiline caret
visibility, and stable visible rechecks. Browser checks cover viewport clearance,
validation, synthetic manual-scroll pause, and explicit resume. These are
programmatic focus/geometry journeys, not OS typing/manual-gesture evidence.

AppKit's retained scroll fixture passed3 checks after sizing its content against
the measured420-point viewport: initial visibility, validation-driven scrolling,
and stable explicit recheck. The first fixture's assumed static content extent
did not establish the expected scroll delta; its timeout remains in research.

Maintained journeys live in `packages/keyboard/tests/fixtures/scroll.*.tsrx`;
`KeyboardFormDemo.tsrx` shows the public form workflow. Nested range allocation,
manual pause/resume, restoration after blur, and cleanup have unit coverage.
OS manual gestures, nested native scroll interaction, and full modal-form journeys
remain separate qualification work.

## Keyboard-sticky controls

The keyboard leaf's `KeyboardStickyView` uses an owned numeric translation lease
independent of surrounding layout. A live policy read updates open/closed
offsets, consumed safe-area/avoidance budgets, and style changes without replacing
the per-window keyboard observer. Removing or disabling the component releases
its own translation and preserves newer foreign property writes. Web and desktop
variants retain an ordinary View and consume no native tracking resources.

Host geometry uses UIKit converted bounds and Android public View matrices.
Keyboard coverage is tested against the host's visible window region so a scaled
host extending beyond the window still follows a full-width docked keyboard.
Pure geometry tests retain rejection of floating/narrow occlusions. The movement
budget also accommodates a baseline transform below the window; this corner is
covered by property/geometry tests rather than a separate OS gesture journey.

A public component qualification exposed an export mistake: explicit `.tsrx`
barrel paths selected the neutral component on mobile. Extensionless exports
now permit the existing platform resolution order to select `.mobile.tsrx`. This
also corrects the prior focused-input scroll export. Earlier mobile form checks
exercised focus scrolling through ScrollableArea; the retained mobile fixtures
now additionally assert the avoidance wrapper and extra native scroll range.
This is an Xplat export error, not an upstream runtime limitation.

Android API35 passed8 sticky checks (content, closed/open offsets, calibrated
source retention during option changes, disable/re-enable, horizontal transform
preservation, unmount and final-reader cleanup) and6 corrected mobile-form
checks. Browser neutral sticky checks passed3. iOS27 passed the same8 sticky checks and6 corrected mobile-form checks.
Artifacts are `ios-sticky-v3.log`, `android-sticky-v3.log`,
`ios-scroll-mobile-v3.log`, and `android-scroll-mobile-v3.log` in
`research/keyboard-feasibility/`. No test here establishes production
frame pacing, arbitrary transformed ancestor behavior, or floating keyboards.

## Chat coordination

ChatLayout coordinates existing stream-follow intent with keyboard motion using
one end test and a private viewport control. Keyboard policy defaults to
when-at-end; never leaves scrolling unchanged, and always follows from history.
Composer avoidance remains active independently of scroll policy. Shared live
controls avoid relying on an Octane render during native movement.

Data rows use stable IDs, with object identity retained for the existing id-optional
API. History anchoring measures the first retained visible row after descendant
layout settles. Same-offset layout notifications do not overwrite the anchor.
UIKit/Android use the qualified window-bounds adapters rather than assuming a
scroll-relative helper reports visible window coordinates. Browser spring
integration retains a fractional position so rounded scrollTop cannot stall it
several pixels before the end.

The AppKit renderer's grid overlay measures non-stretched children using
intrinsicContentSize (`packages/macos-renderer/src/index.ts`, layoutGridChildren).
The chat dock measured zero while its editing field measured96 points in the
runtime probe. ChatLayout's macOS leaf therefore uses a flexing viewport and an
in-flow dock. This local composition avoids depending on an intrinsic grid
measurement fix; reevaluate it if that renderer contract changes. AppKit's
unflipped document also changes its normalized top offset when its range grows
without moving NSClipView's origin. Anchoring corrects the retained window pixel;
viewport layout notifications remain distinct from user scroll notifications.

Matching custom-panel space is part of the dock height, not an added spacer.
Mobile compensation is dockHeight + max(keyboardDisplacement - panelHeight, 0).
The application renders the panel inside composer and supplies its actual height.
This does not add a keyboard toolbar, panel lifecycle, or dismissal API.

Chat regression journeys are maintained under `packages/ui/tests/fixtures/chat*`
and run through the UI package's test:chat:* scripts outside the lightweight PR
gate. Browser coverage includes long history, streamed row growth, prepend
identity/pixel anchoring, arrival actions, composer growth, short conversations,
disabled following, and external fixed-composer range. Mobile journeys cover
keyboard clearance, when-at-end and always policies, history, prepend, streaming,
composer growth, and matching panel handoff. AppKit covers ordinary long-chat
range/anchors and composer changes with neutral software-keyboard behavior.
These journeys use programmatic focus/scroll and geometry; they do not establish
OS typing, hit-testing, or production frame pacing. Policy branches and native
notification/property cleanup also have focused unit coverage.

## Native overlay transform ownership

NativeScript Core9.1.3 RootLayout resets translateX/translateY, scale and rotation
in both applyDefaultState and its enter animation, even when enterFrom only
specifies opacity. Source: NativeScript9.1.3
`packages/core/ui/layouts/root-layout/root-layout-common.ts` (applyInitialState,
applyDefaultState, getEnterAnimation), inspected through the pinned opensrc
checkout. These methods are not changed by Xplat's Core patch. RootLayout owns these host
animation properties.

RootLayout-backed sheets/dialogs therefore use separate containers for the
RootLayout presentation, keyboard translation, and panel detents/content. The
keyboard lease never shares the RootLayout or detent translation property.
The local composition can be simplified only if the host's animation/reset
contract gains independent property ownership. Native OS sheet presenters remain
responsible for their own window layout; the keyboard service measures the
actual host window instead of assuming a full-screen application viewport.

Standalone sheets previously selected swipe-only mode even with snap points.
The native attachment now enables detents when stops are supplied. A translated
panel reserves the portion outside its current stop inside the content area,
keeping bottom controls inside the stop. Detent completion is ignored after
teardown; fallback timers are scoped to the attachment and canceled at release.

Whole-overlay keyboard padding can collapse an input under constrained sheet
layout. Runtime clearance assertions therefore require usable control height,
and keyboard movement uses its own transform layer. Current geometry checks use
public SDK bounds and programmatic focus; they do not establish pixel parity or
OS gesture/frame-pacing guarantees.

Mobile layer focus capture is scoped to the declaring UIWindow or Android decor.
Restoration skips detached inputs and inactive native owners; an explicit
finalFocusRef uses the target's focus method. The switcher retains its original
focus-return scope while replacing panel content. No text is read and no native
input delegate is replaced.

SwiftUI sheet qualification on iOS27 with Core9.1.3 and swift-ui4.0.2 passed
usable hosted input, native keyboard clearance through an observed one-to-two
detent change, controlled dismissal and explicit
editing-focus return through onDismissed. Default dismissal did not restore the
previous editing responder; the maintained app pattern owns that choice. This
preserves platform-native dismissal policy without introducing another observer
or adding a UI dependency to the native sheet leaf.

Compose-hosted NativeScript content now follows Android native attachment rather
than remaining loaded for the lifetime of the declaring component. Detach clears
keyboard/focus geometry, and a subsequent dialog attachment resolves a fresh
window owner. Last-reader cleanup disarms callbacks immediately; removal of the
owned zero-size motion helper runs after the native callback returns. Removing
it inside ViewGroup's detach walk corrupts that walk on the qualified API35 host.
Repeated partial/full presentations cover unload, neutral detached state, fresh
geometry timestamps, and changed dialog identity. This does not qualify
interactive dismissal or older Android versions.

Maintained overlay journeys live in `packages/ui/tests/fixtures/overlay-keyboard.*`
(`test:overlay-keyboard:*`). Native sheet journeys live in
`packages/sheet/tests/fixtures/keyboard.*` (`test:keyboard:*`). Run these locally
with reserved devices; they remain outside the lightweight PR gate. AppKit's
shared sheet is a layer in its owner window; closing detaches content rather
than closing that window. Its optional native sheet uses a separate sheet window.

## Rebase integration boundary

The runtime measurements below were recorded before main's Mason layout cutover.
Rebase integration preserves the Mason container/style vocabulary and repeats
unit, declaration, dependent type, and packed public-contract checks. Those checks
do not requalify native OS input or scrolling on the new layout engine. In
particular, the focused-input adapters identify platform scroll owners through
UIKit/Android scroll APIs; MasonKit beta.110 supplies its own scroll host. Repeat
the maintained native focus/scroll/chat and OS-input journeys before attributing
the earlier runtime results to Mason-backed hosts.

## Final workflow qualification

The maintained OS-input runner uses simulator HID through `idb` on iOS and
`adb shell input` on Android. It locates the fixture's accessible controls,
taps their reported bounds, and types known test strings. The fixture separately
asserts native selection, input visibility, sticky geometry, sheet editing, and
focus return. No image analysis or synthesized component event dispatch is used
for these assertions. Reserve and boot a dedicated device before running it;
Android SDK platform-tools must be on PATH for Android. The iOS runner uses
the host's `idb` CLI with AX-identifier `ui wait`/`ui describe` and
`ui tap --api hid` support; a build without those commands is insufficient.

```sh
bun run --filter @octane-xplat/keyboard test:os-input --target ios --device IOS_UDID
bun run --filter @octane-xplat/keyboard test:os-input --target android --device ANDROID_SERIAL
```

| Target | Runtime evidence | Limits |
| --- | --- | --- |
| iOS27 simulator | Six OS touch/typing assertions across a keyboard-aware form, sticky control and shared sheet; maintained focus/scroll/motion/chat/overlay journeys; SwiftUI hosted input through an observed native detent-set change | First observed transition remains destination-only until endpoint calibration. No hardware-keyboard, VoiceOver, arbitrary floating-keyboard avoidance, older-OS or production frame-pacing qualification |
| Android API35 emulator | Six OS touch/typing assertions for the same shared workflow; focus/scroll/motion/chat/overlay journeys; repeated Compose dialog attachment publishes fresh geometry and neutral detached state | Interactive keyboard tracking stays false/unqualified. No older-API, TalkBack, hardware-keyboard or production frame-pacing qualification |
| Browser | Maintained form/focus/sticky neutral behavior, chat history/stream/composer/panel logic, and overlay editing/focus lifetime | Software-keyboard state remains neutral; desktop browser runs do not qualify mobile Safari/Chrome keyboard behavior |
| AppKit | Ordinary input/scroll ownership, chat reading anchors/composer range, shared panel replacement and optional native-sheet content lifecycle | Software-keyboard state remains neutral; actual trackpad/hardware-keyboard and accessibility navigation remain separate |
| Linux / Windows | Packed public API checks under each condition and both TypeScript resolver modes; dependent typechecks | These checks do not establish runtime keyboard workflows; Windows remains experimental |

Packed consumers copy actual platform/UI/keyboard tarballs and check the shared
public contracts under web, native/iOS, native/Android, macOS, Linux and Windows
conditions, each with Bundler and NodeNext resolution. Existing avoidance and
hardware-key APIs coexist with the new software-keyboard service. Chat policy
and panel-height types are included, with invalid policies required to fail.

```sh
bun run --filter @octane-xplat/keyboard test:packed
bun run --filter @octane-xplat/ui test:native
```

The native UI suite has 40 Node tests and 283 component tests across 64
files. Focused keyboard tests cover 39 cases, including immediate Android callback
shutdown with deferred helper removal. These are lifecycle/logic tests; the
OS-input runner supplies the separate hit-testing and typing evidence. Browser
and device journeys stay outside the lightweight PR gate.
