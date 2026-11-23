# macOS Mason engine sourcing

The macOS renderer's Mason engine ships prebuilt as
`packages/macos-appkit/platforms/macos/prebuilt/libxplatmason.dylib` — the
ObjC facade (`native/xplatmason/XPLMason.m`) statically linked against
mason-c from `octane-xplat/nativescript-mason`.

## Pinned desktop archive (arm64)

The arm64 slice consumes the pinned desktop artifact contract produced in the
Mason checkout by `nx run nativescript-mason-core:build.native.desktop`:
`dist/native/mason-core/desktop/<triple>/libMasonCore.a` plus the generated
`include/mason_native.h` and `manifest.json`. The facade compiles against the
shipped header — no hand-declared externs — and `build.sh` verifies the
consumed archive/header bytes against `native/xplatmason/mason-core.pin.json`
(revision, toolchain, sha256s) before linking. To move the pin, update the
pin file with the new revision and the hashes from that revision's desktop
manifest, then rerun `build.sh`.

## Upstream limitation: no x86_64-apple-darwin desktop target

The desktop contract ships `aarch64-apple-darwin`,
`x86_64-unknown-linux-gnu`, and `x86_64-pc-windows-msvc` only (verified
2026-10-31 at nativescript-mason 0cdc3c80 and origin/main). Packaged macOS
apps require universal `prebuiltLibraries` (both arm64 and x86_64 slices,
since `feat(cli)!: package universal macOS apps`), so `build.sh` builds the
x86_64 slice from crate source at the pinned revision and lipos the slices
together. That slice is revision-pinned but not archive-hash-verified —
recorded as `source.engine.slices.x86_64` in the prebuilt manifest. When
upstream adds an `x86_64-apple-darwin` desktop target, extend the pin file
with its archive hash and link it the same way as arm64.

## Rebuild the packaged engine

From `packages/macos-appkit`, run `native/xplatmason/build.sh` after preparing
both slices described above. The script produces a universal dylib with a
macOS 13.5 deployment target. Keep the archive pin, generated header and engine
revision aligned; ordinary app builds consume the shipped engine without
rebuilding it.

## Text measurement

Mason's native leaf callback reads AppKit intrinsic size. An unconstrained
NSTextField can report a single-line height even after receiving a narrower
allocation. `layout.ts::pinLayoutChild` publishes a changed allocation through
`preferredMaxLayoutWidth`, invalidates intrinsic size, and queues another
layout pass. The same width does not schedule another invalidation. Keep this
feedback when changing layout ownership; the maintained page-layout fixture
checks that long paragraphs grow vertically inside bounded content.

## Dynamic content sizing

Structural changes reconcile the containing Mason tree, not only the immediate
parent. Otherwise a locally recomputed block can place its new children while
its auto-sized ancestors keep the previous height. `mason-layout-scope.ts`
follows projected layout ownership through transparent proxies and stops at
foreign hosts and scroll documents. A scroll document keeps its own compute
and extent pins even when its viewport participates in an outer Mason tree.
Keep local dirty parents for projection synchronization and their own native
layout work. Coalesce repeated parents, then reconcile ancestors before local
parents so the new allocations precede document extent updates. The maintained
block-flow fixture inserts, reorders and removes keyed children and checks both
the resulting auto height and retained child identity.

## mason-c -1 keeps concrete enum slots

`mason_style_set_with_values` treats `-1` as "keep the previous value" for
concrete enum slots — `display`, `position`, `direction`, `flexDirection`,
`flexWrap`, `overflow`/`overflowX`/`overflowY`, `gridAutoFlow`, `textAlign`,
and `boxSizing` (verified in mason-core `update_from_ffi` at the pinned
`0cdc3c80`: those fields only write when the enum decodes). Only the `Option`
alignment fields (`alignItems`, `alignSelf`, `alignContent`, `justifyItems`,
`justifySelf`, `justifyContent`) reset to `None` on `-1`, and the grid
string slots keep their last value on `NULL` as well. Since `styleDict`
omits absent keys, a removed style left the stale value installed — e.g.
removing `flexDirection: 'column'` kept the column layout.

Local workaround: `mason.ts::styleDict` emits the engine defaults for those
enum keys when the computed style lacks them, so removal restores the
default instead of keeping the last value. Grid string removals
(`gridRow`, `gridColumn`, `gridTemplate*`, `gridArea`, `gridAuto*`) still
cannot express reset through the dict — a NULL `XStr` keeps the previous
value upstream. The proper fix belongs in mason-c: `-1`/NULL should mean
"reset to default" for every slot; this note should be revisited when the
pin moves.

## Grid row tracks ignore the container's definite height

At the pinned `0cdc3c80`, `fr` and `auto` row tracks size to max-content
even when the grid container's height is definite — a `gridTemplateRows:
'1fr'` row lets a cell child overflow the container instead of bounding it
(verified on AppKit/JSC: a `1fr` row yielded a 1040-tall child inside an
803-tall pinned grid, while `1fr` columns did honor the container width).
Percent row tracks do resolve against the container height, and
`minmax(0, …)`/length tracks can also express bounds. Until the pin moves,
row-axis `fr`/`auto` sizing cannot bound children to a definite grid height;
use percent or length tracks where the row axis must constrain.

Related: a static-block child's `height: '100%'` did not resolve against
the pinned root in the same fixture — absolute insets (top/bottom) are the
reliable way to give a root-level child a definite height.

Text updates need the same containing-tree reconciliation after invalidating
the native label's intrinsic size. Both plain and formatted text paths must
request it; intrinsic invalidation alone does not resize a Mason parent. Keep
the block-flow check that replaces short text with a wrapping paragraph and
then restores the short value without replacing the text host. For AppKit
text width assertions, compare the allocated alignment rect; NSTextField's
optical frame extends beyond it.

Size constraints take the same path: `native-style.ts::setSizeConstraint`
reconciles at `subtree` scope because a spec-driven height (the TextArea
row cap is the canonical case) changes every auto-sized ancestor's
allocation. A local `layoutMasonChildren` pass bounds its compute by the
parent's latest Mason allocation — the placement-pin constants, which an
earlier ancestor pass in the same drain has already refreshed — rather than
the live AppKit bounds. Bounding by stale bounds clamps a grown child back
to the old allocation and deadlocks growth: the `maxRows` textarea stayed at
its two-row height until both sides of this were fixed.

## NativeScript Core flex shorthand

NativeScript Core 9.1.3 expands `flex` into grow and shrink only. Its
`flexbox-layout-common.js` leaves the basis handling commented out. In
the Core-backed AppKit layout fixture, `flex: 1 1 0%` sized the scroll
viewport from its 960-point content and shrank the panel's header and
footer. The scroll viewport used 713.54 points of an expected 693.

The pinned Core patch lets a provider opt in to expanding the basis
into its registered `flexBasis` style property. macOS enables it for
Mason. The maintained layout-placement fixture passes for both absolute
and grid panel layouts, including repeated solves after window resize.
Keep the opt-in until Core can forward the basis to external layout
engines.

## Keyed children on NativeScript Core

The Core driver uses AppKit's in-place layout move for a keyed child that
stays in the same container, including a child projected through a viewless
proxy. Core's normal remove-and-insert path
tears down that child's native view. In-place moves update the Core child list
and AppKit stacking order, invalidate affected sibling selectors, and request
Mason layout while keeping the existing view and subscriptions.
