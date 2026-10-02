# Windows UI exploration lab

Baseline: `7c47480b` (rebased onto main on 2026-10-02).
Component register: [windows-ui-inventory.json](windows-ui-inventory.json).

The register covers 169 root-exported UI components. All 169 components have a disposition: 28 implemented/reused in bounded native
cases and 141 parked with evidence, a specific blocker, and reopening criteria.
Implemented is not full API, accessibility, pixel, or production certification;
source-dependent parked entries are not individual runtime passes.
Native default implementations may be reused when their Windows behavior is
verified. Platform-authentic iOS/Android subpaths require a separate assessment.
Source inspection and compilation do not establish runtime or OS-input parity.

## Setup evidence

- SSH access to the Windows VM works. Testing uses an isolated checkout;
  the previous guest checkout is preserved.
- Normal workspace installation exposed a declaration-generator path mismatch:
  TypeScript's forward-slash project paths did not match Node's Windows paths.
  `665b3bfa` normalizes both sides. Auth and GIF generators passed on Windows;
  the existing generator pack and plain-TypeScript consumer tests passed locally.
- The next installation failure was a missing SVG submodule in the source
  archive. Both pinned vendor submodules have now been initialized locally.
- Windows PowerShell blocks the `pnpm.ps1` launcher under its current policy.
  Use `pnpm.cmd`; no execution-policy change is needed.

## Current verification

Normal installation and the minimal native-label bundle/WinUI build passed.
The registered package boots in the signed-in Windows desktop session. Native
component sweeps and real OS input checks have completed the component register. The chronological
setup entries below preserve earlier failures; they are not the current status.
No component is marked implemented based on setup alone.

## Documentation coverage

The setup fix preserves the existing typed-component-library recipe AC1/AC7;
its requirements and examples do not change. That recipe currently lists web,
iOS, and Android, and Silo recipe audits do not accept Windows. Windows evidence
is recorded here rather than mislabeled as another target's verification.

## VM interruptions

Windows event 1074 recorded automatic planned update restarts at 00:38 and
00:49 on 2026-10-02. These interrupted SSH-bound install/build commands;
UI declaration generation had succeeded before the second restart, but the
whole installation had not yet returned a successful exit code. Restarting
commands is necessary; a stale SSH process is not evidence of an active build.

The complete normal guest install subsequently returned exit 0 in 1m33s.
All package generators and app styling codegen completed. UI emitted 496 files.
The baseline build is now being retried after that successful install.

## Source findings awaiting runtime probes

- The Windows suffix chain deliberately excludes `.mobile`. Root UI exports
  still select `index.mobile.ts` through the `native` condition. Explicit
  mobile imports in native defaults also prevent Windows boundary validation.
- A temporary dependency scan found SVG mobile glue reachable from 75 root
  components, root-layout glue from 49, and navigation glue from 21. These
  groups overlap; the scan is prioritization evidence, not runtime evidence.
- Pinned Windows core provides native FlexboxLayout and TextBlock-backed Label.
  Its image implementation demonstrates WinRT DataWriter/stream marshalling.
  Built-in WinUI SvgImageSource is a candidate for a dependency-free SVG seam;
  it has not been verified through the runtime bridge.
- Pinned core gesture source handles tap, doubleTap, longPress, and touch, but
  contains no pan/swipe implementation. Shared Slider currently depends on
  pan; its Windows interaction needs an explicit implementation or parking.

The minimal native TSRX label bundle compiled with Vite (39.51 kB app bundle,
2,091.21 kB vendor bundle). Native .NET compilation is still running.

## Native launch prerequisites

The baseline `ns build windows` returned exit 0. WinUI app compilation had zero
errors/warnings; the separately published bridge emitted nine warnings. The
bridge files are present in the final bin directory despite the prepare warning.

A noninteractive launch exited before JS boot with COMException `0x80040154`
(`Class not registered`) at `Microsoft.UI.Xaml.Application.Start`. The generated
app targets .NET 10 (installed), while its manifest requires
`Microsoft.WindowsAppRuntime.1.6`. The guest had 1.7/1.8/2 framework packages and
CBS.1.6, but no matching 1.6 framework package. Installing the matching Microsoft
runtime and registering the app is the next check. Official installer mapping:
[Microsoft released artifacts](https://github.com/microsoft/WindowsAppSDK/wiki/WinAppSDK-Released-Artifacts).

No desktop user was signed in after the update restarts. Interactive testing
requires signing into the guest; session-0 launch diagnostics cannot establish
visible rendering or OS input behavior.

The Microsoft-signed runtime installer returned exit 0 and installed framework
1.6 version `6000.519.329.0`; app registration also succeeded. Direct session-0
launch still raises the same COM exception, so missing framework registration
alone does not explain it. Upstream's test script launches the package through
`explorer shell:AppsFolder`; an interactive scheduled task now uses that method.
Native runtime logs are expected under the package's `AC/Temp/console.log`.

A temporary foundation case is ready for View, Text, Stack, HStack, VStack,
Grid, and Pressable. It records native child structure, loaded state, layout
sizes/positions, grid placement, and a press callback marker. It bypasses the
root barrel only to isolate these components from known unrelated mobile
imports. Handler invocation alone will not count as an OS-input pass.

## Desktop-session gate

A separate diagnostic build with `WindowsAppSdkBootstrapInitialize=true`
compiled successfully, but launch from the SSH service session exited with
`0x8000401A` (`CO_E_RUNAS_LOGON_FAILURE`). An unpackaged-property attempt
also failed configuration validation because the template declares an Appx
manifest; it is not a supported replacement for the packaged launch.

`query user` reports no signed-in users. The interactive launch task stays
ready without running (result 267011). Desktop sign-in was requested; once
`octane` is signed in, launch the registered package and inspect native logs
before building/running the prepared foundation case. No screenshot analysis
is authorized or needed for these first structural/input checks.

## SafeArea escape-prop correction

Executing SafeArea's exact escape-prop selection with both mobile Application
objects absent selected the Android bag. `62ba1ccd` uses the existing
`applyEscapeProps` helper instead, which guards each platform explicitly.
The UI project's no-emit TSRX typecheck passes. This restores the documented
platform escape contract; SafeArea inset behavior and the WebView recipe AC3
are unchanged. Windows runtime verification remains pending.

Local declaration regeneration encountered an existing unmanaged `Toast.d.ts`
output and refused overwrite. The artifact was preserved; the no-emit project
check supplied source/type validation instead. Recipe structure checks pass.

The first foundation build was interrupted by PowerShell treating native stderr
as terminating: the full harness type project reported an unrelated unresolved
`styled-system/css` import. No build success is claimed for that attempt. The
isolated guest probe now includes only its two source entry files, keeping
transitive component checking while excluding unrelated demo roots.

The isolated seven-component foundation build subsequently returned exit 0 on
Windows: Vite bundle compilation and WinUI compilation passed, with zero .NET
errors/warnings. Its type project includes the case and imported component
graph, rather than unrelated demo roots. This is build evidence only. The raw
label source and bundled app were preserved for boot-failure isolation.

## First interactive runtime evidence

On 2026-10-02, the guest's `octane` console session was confirmed active and
registered package activation started the app in session 1. A Windows UI
Automation tree observed the foundation case's expected labels and native
bounds. HStack labels share a y-coordinate; VStack labels advance vertically;
Grid placed A/B on the same row and C on the next. This establishes real
native rendering/layout, without screenshot analysis. It does not yet prove
Pressable input, full styling, accessibility-role mapping, or gesture parity.

Native console output is available in the registered package's LocalState;
the initial empty file was temporary. An async diagnostic write to the guest's
checkout directory failed with `WinRT async operation failed`; native console
logs provide the layout tree instead. No debugger port was observed.

### Foundation input and padding issues

OS mouse down/up on a raw native Button logs its tap callback. The same input
on Pressable initially left its counters at zero. Repeated foreground clicks
increment the raw Label tap counter and Pressable press-down counter, while
Pressable onPress remains zero (two downs, zero presses). The automation
records matching foreground/window handles and live element bounds. This is
real OS input evidence for Button and Label, and a reproducible conflict between
Pressable gesture handlers; it does not establish that all Windows input fails.

Runtime inspection shows the Label tap observer and both Pressable tap/touch
observers use `_usingAddHandler: false`. NativeScript falls back to assigning
PointerPressed/PointerReleased properties when routed-event registration fails.
Pressable adds two observers, so that fallback also risks overwriting handlers.
A direct AddHandler probe reports `No such interface supported (HRESULT
0x80004002)` even though the routed-event static and method exist. Direct
PointerPressed/PointerReleased property handlers attached after load receive
OS input. The initial diagnosis of all Label input failing was too broad.
One later diagnostic traversal also had an out-of-scope loop variable and
stopped early; its reattachment code did not run and is not verification.

View's computed paddingTop/paddingLeft are both 16, but children start at its
edge and retain its full 584 DIP width. The pinned core's C++ FlexboxLayout IDL
has no Padding property; MeasureOverride and ArrangeOverride use the full panel
space. This is a runtime-confirmed upstream layout gap, not a TSRX style
assignment failure. Stack gap and Grid auto-placement work in this case.

### Native SVG seam

A raw Windows probe wrote inline SVG through DataWriter into an
InMemoryRandomAccessStream, sought back to zero, and created SvgImageSource on
the UI thread. Assigning it to the native Image Source and calling
SetSourceAsync produced the native `Opened` event. The app continued processing
timers; this was not a stalled UI-thread callback. No screenshot/pixel claim is
made. This establishes a candidate native SVG path without a new dependency.

`NSWinRT.toPromise` did not resolve the SvgImageSource load-status operation,
and reading that operation's Status returned undefined. Stream WriteAsync did
resolve. The prototype uses Opened/OpenFailed rather than waiting on the enum
result. [WinUI's API](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.media.imaging.svgimagesource.setsourceasync?view=windows-app-sdk-1.6)
supports this stream-loading approach. Component integration, source changes,
URI sources, disposal, and failure handling remain to be tested.

The initial foundation case intentionally isolated explicit styles and did not
import the library's theme CSS. Its explicit padding/gap observations remain
valid, but it cannot establish normalization-class parity. Subsequent component
cases import tokens.css and chrome.css through xplatNative.

## Layout and text sweep

The CSS-enabled batch cycles Center, Section, AspectRatio, VisuallyHidden,
Absolute, Spacer, StackItem, SafeArea, RichText/RichTextSpan, Heading,
Blockquote, and Code in the live Windows host. Compilation and the cycle's
state updates pass. Native tree evidence so far:

- Spacer divides a 200 DIP row into 40 + 120 + 40. StackItem divides its
  200 DIP row into a fixed 40 and filling 160.
- AspectRatio with ratio 2 and width 200 remains height 19 instead of 100.
  Its measurement hook requires getLocationOnScreen as well as size; the
  Windows View source does not implement that location API. Diagnosis is
  source plus runtime failure, rather than a missing layoutChanged assumption.
- RichText concatenates two spans into the expected native Label text. Span
  font weight and link input still need checks.
- VisuallyHidden initially measures 300 × 19. Its rules were inside a
  web-only block. A shared CSS rule for width/height 1 and opacity 0 restores
  the measured box to 1 × 1 on Windows. Accessibility retention is pending.
- SafeArea's first sweep used the guest's older source and reproduced Android
  escape leakage. After copying the committed fix, the id remains `safe`
  despite the Android escape bag; inset padding is zero as expected on Windows.
- Section padding remains ineffective. Heading gets a taller native label.
  Blockquote omits its string body while retaining its citation, and Code has
  an unexpectedly small 6 DIP height. Both require isolated follow-up before
  declaring typography usable.

These are bounded runtime cases, not full normalization or accessibility passes.

### SVG component integration and renderer identity

The Windows SVG implementation now supports inline markup, decoded data URIs,
and packaged `~/` files through WinUI. Icon and three Image cases mount native
SVGView boxes at the requested 24/48 DIP sizes, with native Image Source set,
completion listeners released, and no load errors. A separate prototype
verified source updates, invalid-markup failure, and recovery. Remote URLs,
resource names, file URIs, and disposal races are still under investigation.
Button's icon mounts, but its bare string child is absent and Pressable input
has the previously recorded handler conflict; Button is not verified complete.

The first integration build included two renderer element registries because
pnpm's core peer contexts duplicated `@nativescript-community/octane`. SVGView
registered in one, while the app rendered through the other. The app raised
`<svgview> is not a registered element`. Adding the renderer to the Windows
harness's resolve.dedupe list reduced the bundle to one registry and restored
rendering. This harness fix is committed separately.

### Reusable native overlay helpers

RootLayout registration/lookup and overlay lifetime helpers use NativeScript's
shared APIs. Their mobile-only filenames and explicit imports prevented Windows
from selecting them. They now use unsuffixed native-default modules; guarded
keyboard handling remains active on mobile and neutral on Windows. Screen's
mobile tap-to-blur overrides remain selected on mobile, with a neutral default
for desktop hosts.

A real Windows Screen/KeyboardAvoiding/Overlay case renders its base content,
opens a second native GridLayout host, and removes that host after controlled
close. This proves mounting and cleanup for the unshaded overlay case, not shade
click dismissal, focus management, animation fidelity, or all dependent menus.
The existing keyboard, popover, and overlay lifecycle tests pass: 27 tests in
three files. The UI no-emit typecheck and recipe structure check pass.

### Input control runtime and accessibility

Real mouse input changes CheckboxInput false → true, RadioList a → b, and
SegmentedControl a → b. The bounded Switch click case does not change its value;
its inferred pointer location still needs a hit-testing check. Slider mounts
but its track/fill have zero width: the same missing screen-position API that
breaks AspectRatio prevents the measurement hook from publishing bounds.
Pinned core also lacks a Windows pan recognizer, so Slider needs both measurement
and native drag support before it can be unparked.

Real OS keyboard input writes `abc` into TextInput and updates its controlled
state. The exact value `initial` is absent from the native TextBox, including after
a delayed imperative write. Instrumentation shows a reset write: core
`Property.set` interprets CSS-wide keyword strings as reset values even for
`text`. An ordinary initial value is being retested. This is a reserved-word
property issue, not evidence that every initial controlled value is lost. TextArea exposes both initial lines through UI
Automation (Windows normalizes their separator to carriage return).

UI Automation exposes TextInput/TextArea as Edit controls with ValuePattern.
CheckboxInput and RadioList expose their visible labels as Text controls, with
no toggle/selection semantics. SegmentedControl likewise exposes Text labels;
Switch and Slider have no corresponding semantic control in this case. Mouse
callback success therefore does not establish keyboard or assistive-technology
support.

### Presentation sweep and locale crash

The ordinary TextInput value `Windows initial text` renders correctly with the
production component restored; temporary debug code is confined to research.
The exact strings `initial`, `inherit`, `unset`, and `revert` are reset values in
pinned core's `property-shared.ts`, including for non-style `text` properties.
The original missing-value observation remains preserved in Silo.

ProgressBar's determinate case renders a 200×8 track, 50×8 fill at value 25/100,
and a 2×8 midpoint mark at x=99. MetadataList's two rows align at x=0/x=50, with
the second row at y=27. Badge, Card, Alert, and StatusDot mount; Card and Badge
show the already reproduced ignored Flexbox padding. Animation and semantic
accessibility contracts are still unverified. Two invalid probe prop literals
were corrected (`positive` → `success`, `iso` → `unix_seconds`) before rerunning.

Both presentation runs terminate upon entering the Timestamp/Timer case.
An isolated probe containing no UI component reproduces termination in
`new Intl.DateTimeFormat('en-US', {year:'numeric',month:'long',day:'numeric'})`:
`Intl` and `DateTimeFormat` exist, the pre-constructor breadcrumb logs, and
neither the post-constructor breadcrumb nor a surrounding catch runs. Windows
Event Log reports nativescript.DLL exception 0x80000003. This proves a native
runtime failure in the locale constructor; its underlying cause is not yet
known. Timer is not implicated by that isolation and will be tested separately.

RouteHost and modal-presenter helpers contain only shared composition and
structural view checks. They now use native-default filenames, preserving
mobile behavior while removing another foreign suffix from the Windows graph.
26 route tests and the UI declaration no-emit typecheck pass.

The actual Windows SVG backend (not only the earlier prototype) also passes
source-generation tests: an obsolete delayed invalid source is ignored after
replacement; current invalid markup emits one decode failure; valid markup
recovers; an empty source clears native Image.Source. Removing the component
while a source promise is pending leaves the UI tree free of SVGView and the
app continues logging after the promise resolves. This is mounting/source
lifetime evidence, not a memory-leak or pixel-parity claim.

### Pressable-dependent actions

Required actions in button, selectable-card, disclosure, selection, navigation,
chat-action, link, carousel/lightbox, and citation components ultimately use the
shared Pressable. The inventory parks those actions against the reproduced
Windows tap/touch handler collision and records their exact source import chain.
Those entries are source dependency evidence backed by the foundation OS input
reproduction; they are not individual runtime passes. Static exports that merely
share a module with Pressable remain under investigation rather than inheriting
that blocker automatically. After the core collision is fixed, each parked
control still needs its own pointer, keyboard, disabled-state, and accessibility
checks. CheckboxInput/RadioList/SegmentedControl are parked separately for the
semantic accessibility gap despite their successful real mouse cases.

The public `@octane-xplat/ui` root import now builds and renders View/Text/
KeyboardAvoiding in the Windows host after the helper/SVG changes. Its build
selected the unsuffixed `index.ts`; no Windows export-condition change was
needed for this harness. A first transfer omitted Git-renamed files and caused
an absent RouteHost file; transferring with rename detection disabled corrected
that lab artifact. It was not a source-resolution defect.

The isolated tail case confirms Timer keeps advancing, Divider is 300×1 DIP,
and Skeleton honors 160×24 DIP. Bare-string Blockquote content is absent while
an explicit Label child appears; citations appear in both. Code originally
reported fontSize 0.9 and height 6; the native 13px rule yields fontSize 13 and
height 20. A direct finite core opacity animation completes after 765ms with
both model/native opacity approximately 0.4, so animation is not generally
unavailable. Spinner/pulse/indeterminate loops need native-property sampling
rather than conclusions drawn from their unchanged model values.

### Windows popover coordinates

Pinned core inherits no-op `getLocationRelativeTo`/`getLocationOnScreen` methods
from ViewCommon. A native WinUI probe returns the anchor's real root-relative
DIP position through `TransformToVisual(...).TransformPoint(...)`: x=242,y=30,
width=100,height=20. Popover now calls an internal relative-position adapter:
mobile retains its core method, and Windows uses that WinUI transform.

The actual controlled Popover case places a visible 120×30 panel at x=242,y=58
(the anchor bottom plus the configured 8 DIP gap), then removes the host on
close. The existing native popover lifecycle test passes, and UI declaration
no-emit typechecking passes. Outside-click dismissal, resize/scroll tracking,
focus and keyboard semantics still need their own runtime cases. This does not
supply screen coordinates for useMeasure or unpark Slider/AspectRatio.

### Display components and child normalization

Avatar's fallback box is 40×40, with initials centered at x=9,y=11. User renders
initials, name, and description in a 300×35 row. EmptyState renders SVG icon,
title, and description; Banner's explicit Label slot renders. Meter mounts a
24×24 ring, ProgressGroup mounts a ring plus its Download label, and the
selection indicators mount their checked/unchecked/indeterminate forms. Native
SVG source completion, accessible names, and loop behavior are assessed
separately from these mounting cases.

AvatarGroup with `max=2` and three Avatar children still renders AA/BB/CC, with
no +1 overflow. Its `toChildArray` normalization treats the deferred JSX children
group as one node. Kbd's bare `Ctrl` child produces a zero-height empty container;
an explicit Label produces Ctrl. These are specific native child-normalization
failures, not evidence that every component slot fails.

NavIcon mounts at 32×32 and Icon at 24×24. After the native font-family correction,
Code reports native FontSize=13 and FontFamily.Source=Consolas, with height=20.
Code, CodeBlock, and Markdown's native code runs now request the supported
`monospace` family rather than the unmapped CSS `ui-monospace` family. The latter
was passed through as an unrecognized Windows system font name. macOS-specific
renderer variants retain their own font handling.

### Windows pointer and sheet gaps

Tooltip's native-default implementation reads `__xplatAppKit.observeHover` and
`showAnchoredPopup`; Windows has neither, so only its trigger renders. HoverCard
uses the same AppKit-only bridge in use-hover-card. They need real Windows
pointer/focus intent and anchored content, rather than treating their inert
fallback as implementation success.

ResizeHandle's primary resize path uses Pressable onPan. BottomSheet and
BottomSheetSwitcher share attachSheetDetents, which observes pan for snapping
and swipe dismissal. Pinned Windows GesturesObserver dispatches touch moves but
has no pan branch. These gesture contracts are parked against source evidence,
with per-component reopening criteria in the inventory. This does not mean
RootLayout mounting or every core animation is unavailable.

### Corrected Switch hit test and expanded UIA checks

The earlier Switch click targeted the left edge of the full-width status label,
not the centered 48×28 switch. Clicking x=326,y=309 inside the actual switch
changes false → true. This corrects the input diagnosis; Switch remains parked
for semantic accessibility and keyboard support. The expanded UIA sweep checks
SelectionPattern, SelectionItemPattern, TogglePattern, RangeValuePattern, and
keyboard focusability: the custom checkbox/radio/segment labels have none of
these control patterns and are not keyboard-focusable. TextInput/TextArea remain
focusable Edit controls with ValuePattern. These checks use the current production
components, including the ordinary initial text value.

### Scrolling and indicator geometry

Real OS wheel events move ScrollableArea and VirtualList from offset 0 to 360
inside 300×160 viewports, each reporting 3040 DIP of scrollable extent. The
100-item VirtualList replaces its initial rows with rows 6–21 (16 mounted),
while ScrollableArea retains all 100 rows. This is fixed-height vertical scroll
and virtualization evidence; variable rows, insertion anchors, refresh, and
other axes still need separate disposition.

The indicator follow-up exposes a real geometry omission: no shared CSS rules
existed for indeterminate dash or selected radio indicator dimensions. Commit
`f0711d6f` adds the sm/md box and mark sizes. Native layout confirms 24×24 md
and 20×20 sm boxes, 12×2/10×2 dashes, and 12×12/10×10 radio dots. Checked and
unchecked marks also mount/remove as expected. These indicators are decorative;
their success does not resolve the owning controls’ accessibility blockers.

### Composition and modal sweep

The public-root composition batch renders Field label/description/control,
FieldGroup content, horizontal FormLayout cells, Toolbar's three slots, Table
headers/rows, Timeline events, TopNav slots, SideNav heading/section, NavHeadingMenu
content, DialogHeader title/subtitle, chat message/body/metadata/system text,
and a token chip. Runtime mounting is recorded independently of styling or
interaction certification.

Numbered List with two children emits only one `3.` marker and puts both items
in one row. OverflowList with maxVisibleItems=1 leaves all three labels visible.
InputGroupText's plain `$` child is absent. ChatTokenizedText's plain child and
baked Markdown heading/paragraph text are absent. These correlate with deferred
renderer children and native text ownership; they are not classified as ordinary
Windows font or Unicode failures. The initial mega-menu probe supplied an invalid
children slot instead of required label/items; its absent content is discarded as
probe evidence. Source confirms its actual trigger uses the blocked Pressable.

A separate Screen batch mounts Dialog content, then removes its host when the
case unmounts. Drawer and MobileNav mount their explicit content. Toast logs its
auto-hide callback. WinUI WebView reports successful inline-document load. These
checks do not establish modal focus containment/restoration, Escape dismissal,
full-window drawer hit-testing, toast swipe/live announcements, or WebView content
measurement/scroll control. Their missing contracts remain in the register.

### Final geometry, input, and dismissal checks

Absolute places a child at native local x=20,y=10 inside a 200×60 host.
VisuallyHidden remains 1×1 with native opacity=0, and UIA still exposes its child
text. Spinner native rotation samples change across multiple cycles (317ms
sampling), confirming real native animation rather than a model-property guess.
Table labels remain at local0,0 despite padding8px12px; independently sized rows
also start the second column at152 versus151. Timeline's connector measures1×0,
and body text has no requested10-DIP inset or16-DIP bottom padding.

The combined extra-input case mounted all rows but exited during real typing
with nativescript.DLL access violation0xc0000005. No individual control is blamed
for that combined crash. An isolated PIN case with700ms pauses logs1,2,2,2,
does not advance through cells, and never completes1234; its first Edit reports
342. PIN auto-advance/control ordering is parked on that reproduction.

Real OS backdrop input dismisses a bounded300×200 Drawer outside its280-DIP
panel. Popover's first outside click leaves its panel mounted, despite correct
native coordinates and controlled cleanup. The combined transition sweep's
third click still targeted an old Popover during a case transition; that result
is discarded as Overlay evidence. A separate stable shaded Overlay case then
confirms real outside input removes its panel and reports dismissal.

### Coverage and follow-up order

The register is complete for the baseline root component set. Reused defaults
avoid gratuitous `.windows.tsrx` copies; actual divergence lives in Windows SVG
and coordinate seams. The strongest reusable next investigations are Windows
pointer-handler multiplexing, Flexbox padding, renderer child/text ownership,
and desktop keyboard/UIA mappings. Pan/swipe and the locale constructor crash
remain separate upstream blockers. Fixing one seam does not automatically turn
its dependent parked controls into runtime passes.

Public setup/status pages now state that the host boots and UI support remains
experimental. Chat and shared-overlay recipe criteria are unchanged; their
Windows limits are linked explicitly, and maintained demos remain examples for
their existing supported targets. No Windows recipe verification is mislabeled
as iOS/Android/macOS: the Silo recipe target enum excludes Windows. Local recipe
structure/link checks pass; broad demo parity, pixel inspection, real media
sources, and production deployment were not established by this lab.

### Integration on current main

Rebased the23 Windows commits onto main `f51e8716`. The root component names
remain the same169; main adds the separate `useLayer` hook. Its native default
is AppKit-only and remains parked for Windows as an adjacent capability. The
new mobile leaf still imported the old mobile-only root/lifetime filenames:
no-emit checking and its maintained tests reproduced missing-module failures.
Those imports and the test mock now reference the shared native helpers.

The SVG conflict preserves main's new `svg-glyph` helper: shared source decoding
re-exports it rather than restoring duplicate glyph construction. Recipe docs
retain main's useLayer guidance together with the Windows support limit.

Final integration validation passes: UI declaration no-emit check;29 maintained
native layer/popover/overlay/keyboard tests;31 route and popover-position tests;
recipe structure/links; clean diff and resolved-marker scan. The rebased guest
public-root bundle prepares successfully and runs: native text appears, Icon's
SVG source completes at24×24, Code reports FontSize13/Consolas/height20, and
indeterminate indicator geometry is24×24 with12×2 dash. The full demo harness
and production build are still outside this bounded verification.

## Priority blocker investigation — 2026-10-02

The next investigation focuses on essential app controls: activation, layout
insets, form editing and semantics, child/text ownership, and overlay dismissal
and focus. Component dispositions remain unchanged until a maintained fix and
each component's required cases pass.

### Pointer observer collision: validated diagnostic remedy

On the existing Windows 11 VM, the pinned core again reports
`_usingAddHandler: false` for both Pressable tap and touch observers. Real mouse
input logs `DOWN` with no `PRESS` on the unchanged dependency. The runtime's
`wire_winrt_event` removes the previous event subscription before adding the
new one, confirming that native property assignment is replacement rather than
an additive registration.

An isolated guest dependency prototype gives each native element/event one
pointer delegate and a set of independently removable JS subscribers. The app
was prepared successfully with that prototype; both generated and deployed
`vendor.mjs` contain the dispatcher. This is a diagnostic dependency mutation,
not a shipped framework fix or a new component support claim.

The `lifecycle-v2` run used real OS mouse input through an interactive scheduled
task and completed with task result 0:

1. Two clicks on Pressable each produce one `DOWN` and one `PRESS`.
2. A native Button removes only the touch observer using `off('touch')`.
3. The next Pressable click still produces `PRESS`; dispatch has one subscriber.
4. Another native Button restores the saved callback and context with
   `on('touch', callback, context)`.
5. The next Pressable click again produces one `DOWN` and one `PRESS`; dispatch
   has two subscribers.

Two temporary local dispatcher tests also pass: independently removing and
reattaching observers, clearing the final subscription, and keeping native
views/events independent. These tests cover the candidate dispatcher, not the
Windows bridge. The first reattachment probe saved the observer object itself;
NativeScript clears that object's callback on disconnect. Its reattachment
result was discarded and the corrected run saved callback/context beforehand.

The remaining production work includes routed-registration partial failure,
hover listener ownership, unload/reload, cancellation and pointer capture,
long/double press coexistence, and disabled controls. The remedy belongs in
NativeScript core, following the fork-first dependency policy. No workaround
was added to shared Pressable. Temporary probes and the prototype live under
ignored `research/windows-ui/`; the guest's original gesture implementation is
backed up alongside the dependency file as `index.windows.js.priority-original`.

### Essential form contracts: narrower successes and new blockers

A six-field isolated case tests ordinary, read-only, secure read-only, disabled,
multiline, and literal-keyword fields on the unchanged gesture dependency.
The interactive OS keyboard task returns 0. Runtime/native-model diagnostics
confirm ordinary editing and multiline editing call `onChange`; Enter on the
ordinary field calls `onSubmit`. A follow-up periodic diagnostic confirms model
and native values agree. The first non-periodic observation did not capture
change callbacks; it is not evidence that the callbacks permanently fail, and
callback timing has not been measured.

- Plain `isReadOnly` keeps its original value, reports native/ValuePattern
  read-only, and rejects the test key.
- `secure` + `isReadOnly` creates a PasswordBox whose ValuePattern reports
  read-only false. Real typing increases the synthetic password's length by one
  and emits `onChange`. No password value is needed in the evidence. Pinned
  TextField's editable setter only assigns `IsReadOnly` when that member exists;
  PasswordBox does not have it.
- `isDisabled` leaves the plain TextBox's native/UIA `IsEnabled` true and accepts
  keyboard focus. It rejects typing only because editable=false sets
  `IsReadOnly`. The pinned Windows View has no `isEnabledProperty.setNative`
  implementation. This is a disabled-state/focus defect, not proof that the
  disabled field's value changes.
- An explicit `accessibilityLabel="Ordinary accessible name"` instead exposes
  UIA Name `Ordinary placeholder`. The Windows accessibility update callback is
  empty. A matching placeholder/name in earlier cases did not prove mapping.
- Literal `value="initial"` is again empty before editing, consistent with the
  previously reproduced generic-property reset-keyword issue.

TextInput and TextArea remain parked. Their inventory entries now retain these
bounded successes and specific remaining requirements. Focus/blur callbacks,
selection, return behavior in multiline inputs, and live property changes still
need dedicated checks. Public recipes and support claims are unchanged.

A subsequent diagnostic index directly calls
`AutomationProperties.SetName(nativeView, explicitName)` and assigns
`nativeView.IsEnabled=false` for the disabled field. Repeating the interactive
keyboard task returns 0: UIA reports the explicit name, and the disabled field
reports `IsEnabled=false`, `IsKeyboardFocusable=false`; `SetFocus` rejects it.
This verifies both WinUI property paths through the bridge. It does not install
ongoing framework property forwarding or fix secure read-only. The prototype
is confined to the ignored probe index; the core gesture dependency was restored
to its backup before these form cases.

### Flexbox padding: isolated geometry comparison

The asymmetric inset case uses left17/top7/right13/bottom11 DIP. Native
`TransformToVisual(parent).TransformPoint(0,0)` and actual sizes show:

| Case | Container | Child result |
| --- | --- | --- |
| Fixed Flexbox/View | 200×60 | Width200, offset0,0; insets ignored |
| Auto-height Flexbox/View | Width200 | Parent height10, child height10; expected parent height28 from top7 + child10 + bottom11 |
| Grid control | 200×60 | Width170, offset17,23; vertical centering occurs within the inset content box |
| Stack control | 200×60 | Width170, offset17,7 |

The fifth probe used a `flexDirection` prop on View, which View does not forward;
its row-labeled result is excluded from directional evidence. The fixed and
auto-height cases above are sufficient to reproduce the padding defect.

The custom Flexbox widget's IDL has no Padding member and its C++ measure/arrange
uses the full available/final box. Reading `native.Padding` after JS assignment
returns the assigned object, but that can be the bridge's JS side-store; it does
not establish a native layout property. Stack's core implementation instead
wraps its native panel in a Border that owns padding, explaining its successful
control case.

The focused upstream fix is either native Flexbox padding (reduce measurement
constraints, restore insets to desired size, and offset arrangement) or a core
Border wrapper with explicit inner-panel child/property forwarding. Native
padding preserves the existing panel identity and avoids changing those core
interfaces. Validation must include empty/auto-size boxes, row/column/reverse
and wrapping, percentages/flex growth, asymmetric and changing insets, and
insets larger than the available size. The guest currently has no Visual Studio
C++ toolchain, so no modified native-widget binary was built or verified.

### Content ownership: separate normalization, text slots, and rich text

An isolated counterfactual case confirms the collection failures depend on the
shape of `children`, rather than the max/numbering arithmetic:

| Component | Normal JSX children | Explicit `children={[...]}` diagnostic |
| --- | --- | --- |
| AvatarGroup, max2, three avatars | AA/BB/CC, no overflow avatar | AA/BB/+1 |
| Decimal List, two Text children | One `1.` marker; both texts share its row | Separate `1.` and `2.` rows |

This diagnostic is not a proposed public API workaround. Compiler-generated
children arrive as `UniversalChildrenValue`; its public `render` function returns
a plan-backed universal value, not an array of immediate child items. The
framework `toChildArray` only understands JS arrays. A renderer-supported child
normalization seam must preserve keys, context, reactive evaluation, ownership,
and cleanup; manually evaluating or unpacking compiler plans in UI components
has not been adopted. `exports-md` again failed to compile the cached universal
source, so implementation inspection supplied this evidence.

Bare Kbd text produces a zero-height Flexbox with no label; wrapping the text in
Text produces a native label and a 16-DIP-high container. This is a separate leaf
text-slot issue: the NativeScript driver's `syncText` applies text children only
to TextBase, while Kbd's host is a layout. A text-slot fix must preserve supported
rich children rather than flattening every child to a string.

Nested Text hits a third seam. Adding it to the initial mixed case aborts root
commit with `NativeScript driver: <Label> cannot host a <Span> child.`; the TSRX
boundary in that case did not catch the host insertion error. The mixed case
provides no successful sibling verification. After removing nested Text, the
remaining case mounts and produces the comparison above. The driver supports
Span under FormattedString and FormattedString under TextBase, but has no
Span-under-TextBase branch; Text's nested implementation emits exactly that
unsupported relationship. The explicit FormattedString control mounts with
its concatenated text mirror, but native run styling has not yet been inspected.

### Popover dismissal: zero-sized percentage backdrop

A stable Popover reproduces outside clicks leaving the popup open. Its panel is
120×30 DIP, but its backdrop stays0×0 despite width/height100%. The native
backdrop already has a brush; replacing it with an explicit transparent brush
does not fix dismissal. That hypothesis was rejected.

An OS-clicked diagnostic Button first assigns explicit584×354 root dimensions.
The backdrop then measures584×354, a subsequent real outside click calls
`onDismiss`, and the next tree snapshot contains neither backdrop nor panel.
The parent layer was already full-size, so the backdrop is the immediate gap.
A narrower rerun changes no model dimensions: it calls the backdrop's existing
core `_applyPercentSizing()` after the parent is laid out. Before that call,
child size is0×0, parent size584×354, and width/height remain `{unit:'%',value:1}`.
The next outside click again calls dismissal. Both interactive tasks complete
with result0.

Pinned core watches the child's own native SizeChanged event. A zero-sized
Canvas child may never get a new size event when its parent becomes bounded,
so the deferred percent-sizing path is not retriggered. The production remedy
must initialize percentages after parent layout and refresh them on parent
resize, reparent/load/unload, and percent/numeric property changes without
replacing another size handler or mutating during a XAML layout pass. A manual
one-time refresh is diagnostic only; no production fix or resize pass is claimed.
