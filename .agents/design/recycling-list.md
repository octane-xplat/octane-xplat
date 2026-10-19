# Investigate a separate RecyclingList

Status: investigation, 2026-10-19. Annotation 1 authorizes keeping `VirtualList`
and investigating a separate recycling-aware list. It does not authorize a new
public API without meaningful expensive-row benefits and lifecycle correctness
across web, iOS, and Android. Include macOS in the eventual shared contract;
qualify its implementation after those three targets.

## Recommendation

Keep the existing `VirtualList` lifecycle. A separate `RecyclingList` is worth
prototyping because retaining compatible row subtrees can avoid much more work
than retaining their outer hosts. Use two explicit names over shared layout
machinery if the publication gates below pass. This remains a proposal, not a
second export, a package dependency, or a changed row-state guarantee.

| Boundary                        | VirtualList today                                 | Proposed RecyclingList                                         |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Item subtree identity           | Item key and type                                 | Physical slot within a compatible type                         |
| Item leaves the rendered window | Its subtree unmounts                              | Slot may be reassigned or retained inactive                    |
| Ordinary local state            | Belongs to the mounted item; resets after unmount | Belongs to a slot; must not be mistaken for item state         |
| Durable drafts/selection        | External state keyed by item                      | Same requirement                                               |
| Size/anchor/seek correctness    | Shared expectation                                | Same expectation                                               |
| Native resource ownership       | Usual component lifetime                          | Explicit assignment/activity cleanup as well as final disposal |

The [versioned precedent study](../references/prior-art/recycling-lists.md)
covers LegendList, FlashList v2, RecyclerListView, Vue Virtual Scroller, Flutter,
and AndroidX RecyclerView. LegendList demonstrates one controller supporting both
lifecycles. FlashList demonstrates deeper reuse plus coordinated correction and
seeking. Neither establishes an Octane performance result.

## Ownership to prove

Three identities must remain distinct: the saved item's key, the reusable slot,
and the slot's current assignment. A measurement version is a fourth concern:
remeasuring or replacing an item object must not reset the same item's local
state merely because its index or measurement changed.

The following is a protocol sketch, not a shipped API:

```ts
type ItemKey = string | number
type AssignmentToken = object

interface SlotAssignment<T> {
	slotId: number
	type: ItemKey
	itemKey: ItemKey
	item: T
	index: number
	assignment: AssignmentToken
	/** Assigned to the rendered window, which includes overscan. */
	active: boolean
}

interface PendingMeasurement {
	slotId: number
	assignment: AssignmentToken
	measurementVersion: number
	width: number
	height: number
}
```

Required transitions:

| Transition                                         | Required behavior                                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Same key/type receives updated data or a new index | Update props and invalidate stale geometry without resetting item identity                                |
| Slot changes from A to B                           | Retire A's assignment; reset assignment-owned state before B is exposed; update handlers and native props |
| A to B to A                                        | An async result from the first A stays obsolete even though the item key matches again                    |
| Assigned to inactive spare                         | Hide from input/accessibility and stop item activity; retaining a component does not imply visibility     |
| Inactive to assigned                               | Establish or resume the appropriate assignment; validate current geometry before trusting it              |
| Type changes                                       | Remount incompatible subtrees; never carry slot-local state between template types                        |
| Empty, eviction, or disposal                       | Cancel work, unmount retained trees, release hosts/resources, and invalidate pending assignments          |

Recycling-aware state should reset by item identity without a stale first render.
Assignment-owned effects need cleanup on reassignment and inactivity, not just
unmount. A context/helper should make this easy, while ordinary effects with
correct identity dependencies remain valid. The exact hook names/signatures need
an Octane prototype; importing React's set-state-during-render technique is not a
design decision.

Do not equate `active` with actually visible: the render window includes
overscan. Actual viewability belongs to a separate observer. Focused controls,
text selection, screen-reader position/count, animations, and native media/editor
surfaces require explicit policies. Initially, allow an intentionally keyed
inner subtree to remount when its resource cannot safely be rebound. Durable
state must never depend on a spare slot happening to retain an item.

## Shared engine, distinct lifetime policy

Keep key/type validation, measured-size indexing/cache, range selection, anchor
capture/correction, and seek convergence in a renderer-neutral controller.
Platform adapters own measurement, scrolling, frame scheduling, host positioning,
and visibility/input details. A lifetime policy decides whether a slot's item
subtree unmounts or survives reassignment. A shared recycling component must keep
the same lifecycle on every target; silently reverting to item-keyed remounting
on web would change its contract.

Do not extract a large controller before the experiment identifies the minimum
boundary. Existing duplicated leaves are evidence of drift, not justification
for an unrelated rewrite. Keep the existing UI dependency boundary; this pure
UI feature does not warrant a leaf package solely because its API is specialized.

Start with strict type-compatible pools and a bounded spare budget. A cap bounds
memory retention, not resource activity: hidden mounted rows can still retain
subscriptions or media. Keep exact-size hints optional and measure dynamic rows
normally. Accurate seeks and anchor correctness should improve both lifecycles.
The current handle still documents approximate seeks into unknown-height rows;
convergence is a future requirement, not a claim about today's implementation.
Progressive first render, velocity-aware buffering, horizontal/grid layouts,
sticky rows, pagination, and bottom-pinned chat can be evaluated separately.

FlashList v2's pre-paint correction depends on renderer timing. Its source also
contains an initial-opacity workaround for cases where layout effects do not
block paint. Prove Octane commit/measure/correction order on each renderer before
promising a similar presentation guarantee. Recycling alone establishes none of
that behavior.

## Evidence and publication gates

The experiment compares the current leaves with research-only variants. Both
use the same size index, positioning, anchor logic, scheduling, and eight-spare
budget. The variant keys inner rows by slot, retains a spare slot's last subtree,
and supplies assignment activity. This isolates row lifetime rather than
comparing two different virtualizers. Temporary probes belong in
`research/recycling-list/`; measured results and their limits belong in the
evidence record below.

Do not publish until all of these hold:

1. **Meaningful cost reduction:** repeated expensive-row trials reduce actual
   descendant host construction and mounting on web, iOS, and Android. Follow
   with release-build frame-work/tail-latency and memory measurements; a mount
   reduction alone does not prove better scrolling.
2. **Lifecycle correctness:** same-key updates/reorders, cross-type remounts,
   A/B/A stale callbacks, inactivity, empty/restore, eviction, route disposal,
   and unique item-derived automation IDs pass. Mutation and width/font/dynamic
   height changes preserve a visible keyed anchor within two screen units.
3. **Input and accessibility:** recycled handlers address the current key;
   inactive spares cannot receive focus/input or appear as duplicate accessible
   rows. Focused editors have a documented retention/transfer policy. Synthesized
   dispatch is not OS hit-testing or screen-reader verification.
4. **Stable scrolling:** known and unknown-height seeks converge under a bounded
   policy, user input cancels obsolete correction, and sustained bidirectional
   scrolling has bounded nonblank geometry. Frame polling is not presentation FPS.
5. **Public integration:** identical platform types/exports, junior-facing guide
   and maintained example, affected recipes/skill guidance, parity tracking where
   applicable, and package/dependent typechecks accompany any eventual API.

The investigation keeps the candidate private. Host/plugin and probe-dispatch
repairs support its evaluation; no public list API or row-lifecycle behavior
changes until the candidate is implemented and qualified.

## Measured result: construction falls, publication remains gated

[Machine-readable evidence](../docs/evidence/recycling-list-2026-10-19.json)
retains the fixture, trial order, counters, readiness samples, cleanup, and
limitations. Chromium executed four trials in windowed/recycling/recycling/windowed
order over 500 fixed-height rows with two item types and 15 DOM elements per row.
Each trial sought forward 24 times by eight rows, then checked prepend, width
change, empty/restore, obsolete callback rejection, and disposal.

| Chromium metric after the scrolling phase | VirtualList, two trials | Recycling prototype, two trials |
| ----------------------------------------- | ----------------------- | ------------------------------- |
| Row mounts                                | 204 / 204               | 12 / 12                         |
| Row DOM elements constructed              | 3,060 / 3,060           | 180 / 180                       |
| Row renders                               | 292 / 292               | 351 / 351                       |
| Seek-readiness p95                        | 14.3 / 13.8 ms          | 17.0 / 13.9 ms                  |
| Prepend anchor drift                      | 0 / 0 px                | 0 / 0 px                        |

All 144 assertions passed. The first row's action changed local state to one;
new assignments displayed zero and rejected a retired completion that would
otherwise write 42. Identity-aware state stayed with its item; ordinary
local state deliberately demonstrated the reassignment hazard in the recycling
variant. Mounts/unmounts and assignment-effect starts/stops balanced after
disposal. The trials establish about 94% less construction for this row tree.
The candidate rendered more often, and readiness timings overlap: this is not a
consistent latency improvement, physical-scroll result, or presentation-FPS claim.
Assignment effects still started for each new item: reuse saves structure
construction, not item-specific subscriptions or data work.
The existing 11 web/layout/pool and 19 native object-driver tests also passed;
those native tests exercise the existing implementation, not device recycling.

The initial native attempts failed before the case: iOS was missing the host's
Windows flag and MasonKit metadata, while Android's binding generator could not
find a MasonKit class. The follow-through repaired the host runtime dependency
graph and compile-time flag, then added MasonKit's click-listener dispatch to the
probe. Both native hosts now build and load actual rows. Details and attribution
are in the [MasonKit integration record](../docs/notes/masonkit-layout-evaluation.md#native-host-integration-correction-2026-10-19).

A repeat Chromium run passes 145 assertions (including aggregate trial
completion) with the same construction counts: 204 versus 12 row mounts and
3,060 versus 180 host elements. Readiness p95 remains overlapping (windowed
19.3/9.5 ms; recycling 14.0/13.8 ms). These are debug/development polling
measurements, not frame pacing or a consistent latency advantage.

The repaired iOS and Android runs activate row actions and balance mounts and
effects on disposal in both variants. All four trials per target fail to
complete forward seeks. Runtime inspection confirms that the mapped MasonKit `Scroll` lacks
`verticalOffset`, `scrollToVerticalOffset`, and the native
`setContentOffsetAnimated` alternative used by the current `VirtualList`.
An initially mounted row can satisfy an early seek without proving that the
viewport moved. Partial trials are therefore excluded from the performance
comparison.

The recommendation remains to retain `VirtualList` and investigate a distinct
`RecyclingList`. Repair the native scroll-host contract, repeat full comparative
trials, then qualify the remaining lifecycle/input and release-performance gates
before exporting the candidate. The host repair establishes real startup and
handler behavior; it does not establish native scrolling or recycling benefits.
