# Windows layout repair lab

This internal task addresses two reproduced upstream Windows layout defects:
Flexbox ignores padding, and percentage-sized Canvas children can stay at zero
when their parent is first laid out. Component support has not been upgraded.

## Candidates

The pinned NativeScript source is
`7d0adcec9fa05e34668a7abacf3a79dab55325e6`. An isolated detached upstream checkout
is under ignored `research/windows-layout-upstream`.

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
toolchain lacks a PRI packaging task; the linked artifacts loaded successfully
in the existing packaged app.

For left17/top7/right13/bottom11 DIP:

| Case | Original widget | Candidate widget |
| --- | --- | --- |
| Fixed200×60 | Child200 wide at0,0 | Child170 wide at17,7 |
| Auto height | Parent10 high | Parent28 high |
| Empty auto height | Parent0 high | Parent18 high |
| Wrap, two100-wide children | One row | Two inset rows |
| Dynamic left23/top9, width220 | Child220 at0,0 | Child184 at23,9 |

Row/reverse and column-reverse native offsets respect the inset origin. Insets
larger than the requested bounds clamp the content width to zero; XAML expands
the minimum actual container extent to30×18. This is not a claim that
undersized fixed bounds retain their requested extent.

Three fixed/auto/empty cases were added to the upstream maintained automated
layout suite and transpile. The full upstream suite was not run; isolated
native probes supply the runtime evidence above.

## Percentage lifecycle and Popover

The first core candidate passes real Windows geometry: initial200×100,
resize300×150, explicit numeric80×20, percentage120×60 in240×120, and
reparent80×40 in160×80. An independent parent listener remains active.

The shared Popover initializes its backdrop584×354 without a diagnostic
refresh. Actual OS window resizing changes it to784×581. A real outside mouse
click calls dismissal and unmounts both backdrop and panel; the interactive
scheduled task finishes with result0.

The combined padded-parent probe exposed a remaining issue: percentages used
the whole parent extent, producing200-wide content instead of170. The revised
core candidate subtracts parent padding, observes padding-style changes, and
cleans up those subscriptions. Extracted-source tests pass lifecycle,
independent listeners, padded extents, dynamic padding, and zero content extent;
final Windows verification of this revision is queued.

## State and limits

Original core View and native DLL/WinMD were restored with SHA256 equality.
The VM returned to the public root smoke screen, process11196 responding, after
a successful prepare. The shared VM lease was released.

Silo experiments: percentage lifecycle `3485b980-5623-4b10-b237-22126d3e1594`
(running, final combined check pending); native padding
`2d6ee81c-6265-4471-bb52-9889999c9fd3` (passed in the bounded cases above).
Local feedback records the build-tool framework-resolution mismatch and padded
percentage overflow.

No public workflow or recipe has changed. Component support has not been
upgraded. No screenshots were captured or analyzed, and no production patch
has been published.
