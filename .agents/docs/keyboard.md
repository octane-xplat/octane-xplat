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
screen. Inset readers share a synchronous registry keyed by native window and
follow NativeScript's `NativeWindow` attach/detach/close lifecycle. The registry
replays available state, rejects callbacks from replaced sources, and releases
observation with its final reader. Host-bound readers use their own window;
unbound hooks follow the active window. Android resize leases are separately
reference-counted and preserve subsequent foreign mode changes. These leases
survive observation-source replacement. Overlay
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
