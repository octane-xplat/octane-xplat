# Mason native layout integration

Mason owns native CSS layout; web keeps DOM CSS. Native container intrinsics use
`masonview`; scroll and Liquid Glass hosts retain their platform chrome. Use the
[styling reference](../../skills/octane-xplat/references/styling.md) for authored
styles and the [core extraction design](../../design/mason-core-extraction.md)
for package boundaries. This note owns integration constraints and upstream
workaround removal conditions, not the current qualification queue.

## Native host integration

A native host must declare the engine runtime dependency. Resolving its
JavaScript from a development dependency does not install native binaries or
produce metadata. Follow the [toolchain](../toolchain.md) when changing plugin
versions, aliases, or native artifacts; a JavaScript reload cannot verify a
native correction.

The `@nativescript-community/octane` 0.2.5 patch recognizes container capability
rather than assuming every container extends `LayoutBase`: Mason's
`ContainerView` does not. Remove that branch only when the upstream renderer
supports the same host capability.

For the core alias, distinguish declared ancestor dependencies from hidden
hoisted packages. Accidentally loading full Mason's JavaScript can report
`MasonListDelegate` as undefined. Core intentionally omits the full package's
`NativeListDelegate`; adding that export would conceal the resolution error.

## Foreign leaf style synchronization

Mason beta.110 issue #31: ordinary NativeScript views have no `_styleHelper`,
so their resolved layout styles need a bridge. Read `Style.fromView` after
attachment, effective-style changes, and native-view replacement. Batch writes,
request parent layout, convert physical pixels to DIP, and release observers on
detach/disposal. Include reset, percentage sizing, and reattachment behavior.
Drop the bridge only when upstream supplies that complete contract.

Native `visibility: collapse` must become Mason `display: none`; observe
visibility changes and deduplicate layout requests. For core 9.1.3 with Mason
beta.126, measuring collapsed Text as zero while falling back to `sizeThatFits`
can cause endless invalidation (issue #45). Omit collapsed nodes from layout
and restore their layout participation on visibility changes.

## Image measurement

Core 9.1.3 with Mason beta.110 can mark an unsized image exact before its bitmap
loads, preventing remeasurement (issue #36). The iOS `imageSourceChange`
workaround requests layout. Do not extend it blindly to Android: a pending
foreign auto-height pass can replace a flex/stretch height with content height.
Android's attached source-readiness retry is bounded to ten ticks. Style/percent
propagation remains a separate #31 concern.

Core beta.1 at `27281f97` also lacked a replaced-image flag and the cyclic
percentage min-content rule (issue #41). Correction `86b1a1e4` uses a zero-basis
contribution while retaining authored minima, padding, borders, and final
layout. Do not globally change star-track sizing to solve an image defect.

Issue #50 required native correction `052f7f86` in core beta.2: a custom foreign
measurement callback returning zero must be honored. Rebuild/adopt the native
artifact to use this correction. It does not replace the collapse bridge.

## Shared FontManager in core beta.3

The iOS core package uses a static library and one shared FontManager owner.
Keep its dependency aligned; full Mason and core cannot be installed together.
Windows has a different font dependency profile. Do not transplant an iOS pin
or a raw SDK header into another target.

## Core C interface boundaries

The extraction fork at `623114b0` (beta.126, including upstream `2324b8ee`)
exposes generic C measurement constructors/context setters only outside Android;
Android uses JNI. The generated Apple header can overstate non-Apple/Android
availability. Stage explicit platform guards and compare declarations with
archive symbols until canonical header generation is corrected. Never copy
struct offsets or declarations from an incompatible SDK.

## Android style synchronization

`Style.kt`'s `isSlowDirty` setter must assign its backing field before invoking
`updateNativeStyle`. Percentage helpers must invalidate the root cache, not
only a leaf. Exercise direct setters: batching can hide stale-field/cache bugs.
Keep physical pixel, density, and DIP conversion explicit at the bridge.

## Nested roots and iOS measurement

Core beta.4 introduced stale intrinsic sizing in nested roots. Beta.5's Android
correction (`10519254` / `e1e7372a`) warms both axes unconstrained while retaining
normal foreign-control invalidation. Height evidence does not prove width
parity. The associated iOS inner-stage shrink report (107 × 500) is a separate
case.

On iOS, inspect actual UIKit frames as well as `getActualSize`: deferred
intrinsic measurement can corrupt a frame even when the latter looks correct.
Beta.6's published deferred-intrinsic correction does not by itself resolve the
inner-stage width report or establish that Xplat adopted that release. Check the
installed pin and rebuilt artifact before claiming the fix is active.

## Scroll commands after the cutover

Scroll hosts must expose public offsets and seek commands independently of
whether a requested row is already mounted. Verify an out-of-window seek using
the actual frame and viewport. Finding a row object is insufficient.

Mason's Observable click/tap aliases and core gesture observers are distinct
interaction mechanisms. Handler dispatch establishes neither OS hit-testing nor
physical touch delivery.

## Evidence lookup

Use Silo's `local_artifacts` with key
`.agents/docs/notes/masonkit-layout-evaluation.md` for the preserved experiments,
comparisons, and build records. Follow [operational evidence](../exploration.md#operational-evidence)
to locate and hash-check the file. Keep current qualification in its owning
Silo rows; the artifact is historical provenance.
