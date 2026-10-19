# Software keyboard handling

This note owns the feasibility evidence for window-relative keyboard avoidance,
focused-input scrolling, sticky controls, and their interaction with chat and
presentations. It does not establish a new public API or runtime support claim.

## Existing contract

The mobile wrapper supplies an iOS scroll container with bottom padding and an
Android resize lease. Its offset adds space while the keyboard is open; it is
not a screen-to-window coordinate conversion. Web and desktop retain a neutral
wrapper. See [the implementation](../../packages/ui/src/KeyboardAvoiding.mobile.tsrx)
and [the public props](../../packages/ui/src/props.ts).

```tsx
import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'

export function Form() {
	return <KeyboardAvoiding keyboardVerticalOffset={12}>
		<TextInput placeholder="Name" />
	</KeyboardAvoiding>
}
```

The inset observer currently measures an iOS destination frame against the main
screen. Android inset readers share a foreground-Activity resize lease; overlay
bindings separately observe AndroidX insets and skip translation when the window
declares `adjustResize`. Those mechanisms do not establish actual host overlap
or synchronized movement in edge-to-edge and presentation windows. Source:
[keyboard-inset](../../packages/ui/src/keyboard-inset.ts).

```ts
// Current internal paths; neither callback supplies an animation lifecycle.
import { subscribeKeyboardInset, bindBottomInsetToKeyboard } from '../../packages/ui/src/keyboard-inset'

function attach(host: unknown, notify: (inset: number) => void) {
	const unsubscribe = subscribeKeyboardInset(notify)
	const unbind = bindBottomInsetToKeyboard(host)
	return () => { unbind(); unsubscribe() }
}
```

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

These are candidate mechanisms, not commitments. Native rows require a running
Xplat host before architectural decisions or public guarantees.

| Target | Candidate geometry and focus | Candidate movement | Evidence and limits |
| --- | --- | --- | --- |
| Web | Visual viewport and element bounds; focus and selection offsets | Viewport events and scroll host updates | Desktop Chromium API probe passed; no software keyboard observed. Viewport shrink also has non-keyboard causes. A textarea selection offset is not a caret rectangle. |
| iOS | Convert keyboard and input/caret bounds into the owning window; `UITextInput` selection geometry | Public keyboard layout guide/native binding, or measured notification timing with demonstrated limits | Upstream source only. NativeScript binding, interruptions, interactive tracking, already-open mounting, floating keyboards, and presentation windows remain unverified. |
| Android | Resolve the actual host/dialog window; IME/system insets, focused input layout and selection | Native inset-animation callbacks plus actual resize accounting | Upstream source only. Bridge availability, edge-to-edge, navigation modes, dialog ownership, API-level behavior, and interactive dismissal remain unverified. |
| macOS | AppKit focus and input geometry need a separate host investigation | Preserve neutral software-keyboard behavior until a supported mechanism is demonstrated | No mobile keyboard behavior is inferred from AppKit or hardware-key events. Runtime feasibility remains unverified. |

NativeScript core `9.1.3` exposes the iOS native scroll view, but its
`scrollableHeight` derives from content size minus bounds and does not include
content insets. Any inset-based scrolling integration must reconcile that range
and its clamping rather than assuming the shared scroll operation reaches the
extended range. Evidence: **desk-source**,
[core scroll implementation](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/ui/scroll-view/index.ios.ts).
This is an integration constraint, not a confirmed scrolling defect. No workaround
has been adopted; revisit against the pinned implementation before adding insets.

## Evidence boundaries

The initial desktop probe ran in Chromium `153.0.8010.12` with a 400 × 700 viewport.
Focusing and selecting a textarea retained selection offset 8; nearest-element
scrolling moved its bottom from 1144 to 700. Visual viewport information was
available; the Virtual Keyboard API and a textarea caret-rectangle operation
were absent. This establishes ordinary browser focus/scroll geometry only.
No images were captured or inspected.

The existing inset host-double suite passed 6/6 tests. It establishes shared
observer/lease bookkeeping and existing numeric conversions, not native frame
delivery, actual viewport resizing, OS input, hit-testing, or animation quality.

Native runtime qualification is still required before choosing service ownership
and package integration. Keep execution status and measurements in Silo's
`software-keyboard-controller` topic; temporary cases live in `research/`.

### Workspace qualification prerequisite

The frozen pnpm `11.24.0` install fails while applying the pinned
`@nativescript-community/octane@0.2.5` patch, including with a clean virtual store
and an isolated content store. This prevents preparing the Xplat native probes;
it is not evidence against the native keyboard APIs.

The checked-in patch contains sequential sections for `dist/driver.js`.
Applying it to the pristine registry package with `patch --forward`, then emitting
one forward diff per file, produces a candidate accepted by an isolated pnpm
install. Its resulting driver and intrinsic declarations are byte-identical to
the sequentially patched files. No repository patch repair or workaround has
been adopted. The candidate and reproduction remain in the temporary research
directory; the experiment record owns their execution evidence. Qualification
requires a repaired frozen install before continuing the native investigation.
