# Windows layout repair lab

This internal task addresses two reproduced upstream Windows layout defects:
Flexbox ignores padding, and percentage-sized Canvas children can stay at zero
when their parent is first laid out. Component support has not been upgraded.

## Repository Windows host

The x64 host in `apps/windows` carries a pinned padding DLL/WinMD pair in
`App_Resources/Windows/Widgets`. Its manifest identifies NativeScript commit
`abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b`, the canonical native patch,
checksums, toolchain and MIT license. This is an app-local repair; the upstream
package remains unchanged. Other architectures retain upstream binaries and
remain unqualified. The separate legacy shrink limitation below remains open.

The host verifies both the repaired pair and the expected upstream pair before
building. A dependency change therefore requires reviewing or rebuilding the
repair. Content items stage it before MSIX discovery; a target after
`CopyNativeScriptWidgets` restores it after the upstream plugin's post-build
copy. Keep both paths so the build output and MSIX select the same artifacts.

Rebuild the native source in a new disposable run folder on Windows, under a
native-build/device reservation. Reuse the host's SDK and NuGet caches:

```powershell
./tools/platform-qualification/windows-layout/build-widgets.ps1 `
  -ScratchDirectory "$env:USERPROFILE/agent-scratch/octane-xplat/<task>/widgets-rebuild"
```

`-SourceArchive` accepts a previously downloaded, hash-verified archive;
`-PrepareOnly` checks source extraction and patch application without compiling.
The output manifest records the actual pair hashes. Rebuilding does not update
the checked-in pair automatically; compare packaged geometry before replacing
it. PE build timestamps can change hashes between builds.

## Repairs

The original isolated investigation used NativeScript source
`7d0adcec9fa05e34668a7abacf3a79dab55325e6`; its detached checkout is under ignored
`research/windows-layout-upstream`. The repository host uses the newer verified
pin described above.

- Native Flexbox gains a projected `Thickness Padding`. Measurement subtracts
  insets from constraints, clamps the content box to zero, and adds insets to
  desired size. Arrangement uses the inset content extent and offsets children.
  Empty boxes retain their insets. Panel identity and existing flex controls stay
  intact.
- Percentage sizing observes the parent through core `layoutChanged`, which
  shares the parent's existing native size watch. Deferred work is coalesced and
  guarded against stale generations. Listener ownership ends on unload,
  disposal, reparenting, or removal of the last percentage dimension.

## Verified native padding

The isolated upstream native-padding commit is `f99c9bcc`. Windows compilation
and DLL/WinMD linking succeeded with MSVC v143 and a native target-framework
moniker override. Full MSBuild `Build` subsequently failed because the minimal
toolchain lacks PRI/Appx packaging tasks; the linked artifacts loaded successfully
in the existing packaged app.

For left17/top7/right13/bottom11 DIP:

| Case                          | Original widget     | Candidate widget     |
| ----------------------------- | ------------------- | -------------------- |
| Fixed200×60                   | Child200 wide at0,0 | Child170 wide at17,7 |
| Auto height                   | Parent10 high       | Parent28 high        |
| Empty auto height             | Parent0 high        | Parent18 high        |
| Wrap, two100-wide children    | One row             | Two inset rows       |
| Dynamic left23/top9, width220 | Child220 at0,0      | Child184 at23,9      |

Row/reverse and column-reverse native offsets respect the inset origin. Insets
larger than the requested bounds clamp the content width to zero; XAML expands
the minimum actual container extent to30×18. This is not a claim that
undersized fixed bounds retain their requested extent.

Three fixed/auto/empty cases were added to the upstream maintained automated
layout suite and transpile. The full upstream suite was not run; isolated
native probes supply the runtime evidence above.

## Percentage lifecycle and Popover

The final package candidate passes real Windows geometry: initial200×100,
resize300×150, explicit numeric80×20, percentage120×60 in240×120, and
reparent80×40 in160×80. An independent parent listener remains active.

The shared Popover initializes its backdrop584×354 without a diagnostic
refresh. Actual OS window resizing changes it to784×581. A real outside mouse
click calls dismissal and unmounts both backdrop and panel; the interactive
scheduled task finishes with result0.

The final combined test verifies percentages against the padded content box:
170×42 initially, then164×40 after only the parent padding changes. Parent bounds
stay200×60. Four separate padding events are observed because Style's
Observable does not normalize comma-separated event names. Source and compiled
package tests cover listener cleanup, stale deferred work, reparenting,
percentage/numeric changes, independent listeners, and zero content extent.

The upstream core commit is `5e7bca72`. The unmodified pinned TypeScript
transpiles byte-for-byte to the installed original JS; its package diff therefore
contains only the intended method/property changes. The exact ESM candidate was
used for the final Windows geometry and OS tests.

## Retained artifacts

- [Native source and maintained test patch](../../tools/platform-qualification/patches/windows-layout/native-padding.patch)
- [Core source patch](../../tools/platform-qualification/patches/windows-layout/core-percent-source.patch)
- [Minimal core package JS patch](../../tools/platform-qualification/patches/windows-layout/core-percent-package.patch)
- [Source/package helper test](../../tools/platform-qualification/windows-layout/percent-sizing.test.mjs)
- [Native geometry case](../../tools/platform-qualification/windows-layout/native-geometry.windows.ts) and
  [output checker](../../tools/platform-qualification/windows-layout/check-native-output.mjs)
- [Popover case](../../tools/platform-qualification/windows-layout/popover-case.windows.tsrx),
  [entry](../../tools/platform-qualification/windows-layout/popover-index.windows.ts), and
  [real OS resize/click script](../../tools/platform-qualification/windows-layout/popover-os-input.ps1)

Apply the source patches to a clean detached checkout at the pin above. Apply
the package patch to the pinned package, preserving the existing framework
patches. Integration in `magic-grouse` combines the package changes with the
pointer repair in the canonical preview patch, synchronizes the config-package
copy, and regenerates the lockfile and build-approval hash. Both installed-package
regression checks, `bun run check:patches`, and `bun run check:recipes` pass locally.
Both source patches pass reverse `git apply --check` against the repaired
checkout. The package patch applies to the original JS and produces the exact
runtime-tested candidate.

Run helper checks with either source or patched package JS:

```sh
node tools/platform-qualification/windows-layout/percent-sizing.test.mjs research/windows-layout-upstream/packages/core/ui/core/view/index.windows.ts
node tools/platform-qualification/windows-layout/percent-sizing.test.mjs apps/windows/node_modules/@nativescript/core/ui/core/view/index.windows.js
```

For native checks, copy the geometry entry into the isolated Windows lab app,
prepare it, and launch interactively with the candidate widget DLL/WinMD. Feed
its UTF-8 console log to:

```sh
node tools/platform-qualification/windows-layout/check-native-output.mjs path/to/console.log
```

For Popover, copy the retained case as `src/windows-ui-case.tsrx` and its entry
as `src/index.ts`. Run the OS script interactively after the app has opened its
popup. Success requires resize geometry, a dismissal callback, an empty next
tree, and task result0. All guest writes require the shared VM lease; restore
original dependencies, native artifacts and smoke bundle before releasing it.

## State and limits

Original core View and native DLL/WinMD were restored with SHA256 equality.
The public-root smoke bundle was prepared successfully and its scheduled launch
was requested. A final read-only SSH check timed out/stalled, so the last live
process/response observation remains unconfirmed. Restoration hashes and
prepare exit0 are confirmed; the shared VM lease was released.

Silo experiments: percentage lifecycle `3485b980-5623-4b10-b237-22126d3e1594`
(passed); native padding
`2d6ee81c-6265-4471-bb52-9889999c9fd3` (passed in the bounded cases above).
A separate explicit-width shrink case is parked as experiment
`bc70da10-d64e-42ed-87df-2a6077932072`: a170-DIP row with zero padding lays out
100-DIP children at x0 and85, overlapping15 DIP. The shrink/arrange algorithm is
unchanged by these repairs. Complete flex sizing parity is not claimed.

Local feedback records build-tool resolution, padded percentage overflow,
Style event normalization and the shrink limitation.

No public workflow or recipe has changed. Component support has not been
upgraded. No screenshots were captured or analyzed, and no production patch
has been published.
