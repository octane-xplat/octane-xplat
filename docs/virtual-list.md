# VirtualList

> Render a long vertical collection with bounded row mounts, and decide whether
> its measured behavior fits your app.

Use `VirtualList` from `@octane-xplat/ui` for vertical, measured-height rows.
Give the list a bounded viewport and each item a stable, unique key. Small
collections can use `ScrollableArea` and `@for`. Platform-authentic recycling is
available separately through `UITableView` and `RecyclerView`.

## Keep identity and state stable

```tsx
import { VirtualList, Text } from '@octane-xplat/ui'

const keyFor = (item: { id: string; title: string }) => item.id
const renderRow = (item: { id: string; title: string }) => <Text>{item.title}</Text>

// Inside a component in a bounded column:
<VirtualList className="flex-1 min-h-0" items={items}
  keyExtractor={keyFor} renderItem={renderRow} />
```

Replace the item array when changing data. Do not use array indices as keys
for reorderable data. Keys must be unique strings or finite numbers; duplicate
keys throw. `getItemType` optionally distinguishes templates: changing an
item's type remounts that row.

Off-window rows unmount. A row that remains mounted retains its keyed local
state across prepend; a row that leaves the window loses component-local state.
Keep drafts, selection, and other durable row state in an external store keyed
by item ID. On web, iOS, and Android, type-compatible outer cell hosts are
reused and positioned from measured sizes. Their keyed item subtrees still
unmount off-window; reusing a host never retains another item's local state.
The pool keeps at most eight unused hosts in total, and releases all hosts on
emptying or disposal. Other targets retain their existing windowing engines.

## Preserve the visible position

The engine measures mounted rows and estimates unvisited rows. Prepending data
and remeasuring rows above a visible keyed anchor preserve that anchor's viewport
position after settling. This requires the anchor to remain in the data with the
same key and type. Removing the anchor has no replacement-anchor guarantee.
Changing width invalidates exact cached sizes and requires new measurements.
Unmeasured rows may change the estimated total extent, so a raw pixel seek into
unknown rows is approximate; there is no public indexed-seek handle.

See the maintained [interactive example](../packages/demos/src/VirtualList.tsrx)
for prepend, removal, reverse, resize, empty, restore, and keyed local state.
Header, footer, separator, and empty content use the corresponding render slots.

On iOS and Android, scroll and row-measurement callbacks queue one window update
at the next native animation frame. Exact row sizes update the prefix index together; estimates
for unvisited rows rebuild after a meaningful type-average change and 120 ms
without scrolling or new measurements. Exact cached sizes use content width,
including when borders or padding make it narrower than the viewport.
A queued correction adds the height change to the live scroll offset, preserving
movement since measurement. Pending measurements and timers are cancelled when
the list is disposed. This scheduling does not change row state ownership.

## Measured support boundary

The fresh web checks used headless Chromium, 5,000 simple rows of
`32 + (index % 5) * 8` pixels, and synthetic wheel input for three minutes.
They establish a bounded mount window and sampled geometry for that fixture.
The separate 500-row contract gate checks prepend, remeasurement, keyed state,
deep offsets, emptying, and route disposal. A separate programmed trace met
the 250 ms readiness gate for only 2/5 deep pixel seeks despite complete sampled
coverage. Twenty disposal/reopen cycles returned to the same DOM/listener counts;
late collected heap samples ranged 8.52–8.54 MB. These are test workloads, not a
maximum supported row count or a device-independent throughput promise.

The [Android scheduling profile](primitive-notes.md#virtuallist-android-scheduling-corrections-q30-2026-10-01)
and [cell-pool comparison](primitive-notes.md#virtuallist-positioned-cell-pool-q30-2026-10-01)
record nonvisual before/after measurements and their limits.
Q30 remains open. Native fast variable-height momentum and Android process
memory need fresh runtime characterization. Historical simulator/device results
are recorded separately from this pass in [primitive notes](primitive-notes.md#virtuallist-input-and-memory-profile-q30-2026-09-28).
Read the [current evidence](primitive-notes.md#virtuallist-readiness-recheck-q30-2026-09-30)
before choosing this list for a performance-sensitive feed or chat.

There is no shared viewability callback, load threshold, sticky-row/grid/masonry
layout, bottom-pinned chat policy, or public scroll handle. Application-level
loading and chat anchoring need explicit designs; the prepend contract does not
establish those workflows. Actual native frame pacing and direct finger/physical
trackpad input remain separate verification requirements. JavaScript polling
intervals are not frame-rate measurements.

Linux WebKitGTK batches ResizeObserver measurements into the next animation
frame before updating the row window. This avoids changing observed layout
inside resize delivery. The Linux harness checks mounted-row bounds, emptying,
and unhandled resize errors with `pnpm --filter @xplat/linux smoke` on a Linux
host with GTK/WebKit and Xvfb. This smoke does not establish Linux anchor
accuracy, frame pacing, or the full benchmark contract below.

## Run the nonvisual gates

From the repo root, install with `pnpm install --frozen-lockfile`, then:

1. Build the harness: `pnpm --filter @xplat/web build`.
2. From `apps/web`, run `node scripts/bench-virtual-list-contract.mjs`.
   It fails on anchor drift greater than 2 pixels, lost keyed state, unbounded
   mounts, or failed empty/disposal checks.
3. From `apps/web`, run `XPLAT_VLIST_INPUT_MS=180000 node scripts/bench-virtual-list-input.mjs variable`.
   The JSON separates sampled row geometry, rAF callback intervals, live-list
   collected heap, and collected heap after route disposal. rAF alone does not
   prove compositor presentation timing.
4. From `apps/mobile`, run
   `XPLAT_VLIST_DEVICE=<simulator-UDID> XPLAT_VLIST_INPUT_MS=180000 node scripts/bench-virtual-list-input.mjs ios variable`,
   or replace `ios` with `android` and supply an ADB serial. Android requires
   Temurin JDK 21 on `JAVA_HOME`. Use `fixed48` as a measurement control and
   `demo500` for the actual List ×500 demo, including its slots and row state.
   The swipe sequence moves forward through four viewports, then revisits rows.

Native runners require Python 3 and take an exclusive advisory lock at
`/tmp/octane-xplat-ios.lock` or `/tmp/octane-xplat-android.lock` for build and
use. Other native sessions must use the same lock convention; an advisory lock
cannot protect against a nonparticipating session. The runner fails if busy.
It uses `org.nativescript.xplat.vlistbench` (override with
`XPLAT_VLIST_APP_ID`) to avoid replacing the normal harness app. iOS builds,
installs, and launches with `simctl`; it never reboots an already booted simulator.
Native input is synthetic `idb`/`adb` swipes, explicitly labeled in results.
Android records layout/measure, draw, and total frame-work durations through
`Window.OnFrameMetricsAvailableListener`, plus PSS categories and the final bounded
`gfxinfo framestats` buffer. Window metrics measure frame work, not presentation;
JavaScript sampling intervals remain a separate responsiveness measure.
Header/footer and separator boxes count toward coverage, without increasing
mounted row counts. Reports separate logical row mount/unmount counts from
physical outer-host additions/removals; pooling preserves only those outer hosts.
Large reports use numbered log records to avoid Android
console truncation.

For repeatable Android comparisons, set `XPLAT_VLIST_FRESH_INSTALL=1`. This removes
only the selected benchmark app, including its data, before installing under the
target lock. NativeScript otherwise retains extracted bundle files during an
in-place reinstall, which can run stale code. Use this option only for a disposable
benchmark app. Native memory collection does not force GC: growth is a signal to
investigate, not proof of a leak. No runner captures images.
