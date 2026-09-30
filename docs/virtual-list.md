# VirtualList

> Render a long vertical collection with bounded row mounts, and decide whether
> its measured behavior fits your app.

Use `VirtualList` from `@octane-xplat/ui` for vertical, measured-height rows.
Give the list a bounded viewport and each item a stable, unique key. Small
collections can use `ScrollView` and `@for`. Platform-authentic recycling is
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
by item ID. No recycled cell pool exists.

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
   Temurin JDK 21 on `JAVA_HOME`. Use `fixed48` as a measurement control.

Native runners require Python 3 and take an exclusive advisory lock at
`/tmp/octane-xplat-ios.lock` or `/tmp/octane-xplat-android.lock` for build and
use. Other native sessions must use the same lock convention; an advisory lock
cannot protect against a nonparticipating session. The runner fails if busy.
It uses `org.nativescript.xplat.vlistbench` (override with
`XPLAT_VLIST_APP_ID`) to avoid replacing the normal harness app. iOS builds,
installs, and launches with `simctl`; it never reboots an already booted simulator.
Native input is synthetic `idb`/`adb` swipes, explicitly labeled in results.
Android PSS includes category samples and the final bounded `gfxinfo framestats`
buffer. Native memory collection does not force GC: growth is a signal to
investigate, not proof of a leak. No runner captures images.
