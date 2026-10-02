# Windows UI exploration lab

Baseline: `7c47480b` (rebased onto main on 2026-10-02).
Component register: [windows-ui-inventory.json](windows-ui-inventory.json).

The register covers 169 root-exported UI components. Each component starts
queued and must end implemented or parked, with evidence and a specific reason.
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
The app has not booted yet: the guest has no signed-in desktop session after
automatic updates. Interactive launch and the component sweep remain pending.
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
