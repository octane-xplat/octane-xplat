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

The new minimal native-label case has not booted yet. Installation, native
bundle compilation, interactive app launch, and the component sweep remain
in progress. No component is marked implemented based on setup alone.

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
