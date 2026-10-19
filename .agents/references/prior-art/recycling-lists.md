# Recycling list precedents

Examined 2026-10-19 for the [RecyclingList investigation](../../design/recycling-list.md).
This page describes external systems, not shipped Xplat behavior. Package source
was fetched with `opensrc` at the versions below; documentation may describe a
different version. No external implementation was copied into the framework.

## Compare the lifecycle, not the component name

| System examined                          | Ownership and useful precedent                                                                                                                                                  | Tradeoff for Xplat                                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LegendList 3.6.0                         | Component recycling is explicitly optional and defaults off. The same layout engine supports both lifecycles. Recycling-aware state/effect helpers address reassignment.        | Separate public names can express the same choice while sharing a controller. Do not copy React hook implementation details without checking Octane semantics.                        |
| FlashList 2.3.3                          | Stable physical render keys survive item changes; type-specific pools retain compatible trees. Progressive layout, measurement correction, and iterative seeks accompany reuse. | Deeper recycling is a lifecycle choice; precise layout and seeking are independent capabilities worth sharing with the ordinary virtual list.                                         |
| RecyclerListView 4.2.3                   | Separates data identity/diffing, layout information, and render-key recycling. Supports exact supplied dimensions and a measured mode.                                          | Keep an optional known-size path. Avoid making callers build several provider objects for an ordinary list.                                                                           |
| Vue Virtual Scroller 3.0.5               | Reuses Vue components and DOM nodes in type-owned pools. The slot receives an explicit `active` value, and components must respond to changed items.                            | Mounted, assigned, and actually visible are different states. An idle pooled row needs a way to suspend work. Web reuse is a valid design, but its value needs measurement in Octane. |
| Flutter ListView (current API docs)      | Lazily creates and destroys child subtrees; keep-alive can preserve selected children under their original identity. Focused editable children can request retention.           | Keep-alive is different from assigning one instance to another item. Focus/editing policy deserves its own contract.                                                                  |
| AndroidX RecyclerView (current API docs) | Distinguishes creating/binding a holder, temporary attachment/detachment, and recycling. Recycling is a resource-release opportunity.                                           | Unmount is insufficient as the only cleanup signal. Rebinding must clear item-owned native state and obsolete work.                                                                   |

## LegendList: an explicit lifecycle choice

Pinned source: [v3.6.0](https://github.com/LegendApp/legend-list/tree/3d80d167e243cbaa089fda9f2dbcca5ea59da9d8), MIT.

- [`LegendList.tsx`](https://github.com/LegendApp/legend-list/blob/3d80d167e243cbaa089fda9f2dbcca5ea59da9d8/src/components/LegendList.tsx) defaults `recycleItems` to false and warns when the choice is omitted.
- [`Container.tsx`](https://github.com/LegendApp/legend-list/blob/3d80d167e243cbaa089fda9f2dbcca5ea59da9d8/src/components/Container.tsx) uses the item key for remounting only when recycling is disabled. It otherwise keeps the position component instance.
- [`ContextContainer.ts`](https://github.com/LegendApp/legend-list/blob/3d80d167e243cbaa089fda9f2dbcca5ea59da9d8/src/state/ContextContainer.ts) resets recycling state on item-key changes. Its recycling effect supplies previous/current item information and cleanup; its first-call behavior differs from an ordinary mount effect. Do not treat all recycling hooks as interchangeable.
- [`findAvailableContainers.ts`](https://github.com/LegendApp/legend-list/blob/3d80d167e243cbaa089fda9f2dbcca5ea59da9d8/src/utils/findAvailableContainers.ts) reserves exact-type candidates across a batch, protects active/pinned candidates, and can retype ordinary slots after compatible choices are exhausted. Sticky slots use stricter type ownership.
- [`measureContainersInLayoutEffect.native.ts`](https://github.com/LegendApp/legend-list/blob/3d80d167e243cbaa089fda9f2dbcca5ea59da9d8/src/core/measureContainersInLayoutEffect.native.ts) handles both inline and unexpectedly late measurement callbacks, guarded by assignment/measurement generations. It can skip known fixed-size measurements.

The [v3 API guide](https://legendapp.com/open-source/list/v3/api/) calls recycling
primarily useful on React Native. Treat that as library-specific guidance, not
evidence that Octane DOM reuse is ineffective. The guide also separates data
anchoring from size-change anchoring; defaults must be checked by version.

## FlashList v2: reuse and correction together

Pinned source: [v2.3.3](https://github.com/Shopify/flash-list/tree/527d7678190f4f0137f14383ff560efa7fccc9fb), MIT.

- [`RenderStackManager.ts`](https://github.com/Shopify/flash-list/blob/527d7678190f4f0137f14383ff560efa7fccc9fb/src/recyclerview/RenderStackManager.ts) maps stable item IDs to reusable physical render keys, uses type-specific pools, and removes excess spare entries. The default limit is effectively unlimited.
- [`ViewHolder.tsx`](https://github.com/Shopify/flash-list/blob/527d7678190f4f0137f14383ff560efa7fccc9fb/src/recyclerview/ViewHolder.tsx) receives changing item props under those physical keys. The [recycling contract](https://shopify.github.io/flash-list/docs/recycling/) explains the resulting local-state hazard.
- [`useRecyclingState.ts`](https://github.com/Shopify/flash-list/blob/527d7678190f4f0137f14383ff560efa7fccc9fb/src/recyclerview/hooks/useRecyclingState.ts) resets a ref-backed value on explicit dependency changes and requests layout when state changes. Unlike LegendList's helper, it receives explicit reset dependencies and a reset callback.
- [`useRecyclerViewController.tsx`](https://github.com/Shopify/flash-list/blob/527d7678190f4f0137f14383ff560efa7fccc9fb/src/recyclerview/hooks/useRecyclerViewController.tsx) refines seek offsets while coordinating with anchor correction. Seek and anchor writes must have one owner.
- [`ViewHolderCollection.tsx`](https://github.com/Shopify/flash-list/blob/527d7678190f4f0137f14383ff560efa7fccc9fb/src/recyclerview/ViewHolderCollection.tsx) coordinates layout commits and initially hides content until its first committed layout. Its source explicitly notes cases where layout effects do not block paint. A hook name alone is not a universal before-paint guarantee.

[Shopify's architecture article](https://shopify.engineering/flashlist-v2)
describes progressive rendering, internal per-type predictions, adaptive buffers,
and synchronous pre-paint correction on React Native's New Architecture.
"No estimates" means no caller-supplied estimates, not an absence of internal
predictions. Xplat has not established the same commit timing across renderers.
The [v2 API](https://shopify.github.io/flash-list/docs/v2-changes/) adds chat and
layout policies; those are not necessary prerequisites for subtree recycling.

## Other precedents that change the decision

**RecyclerListView:** pinned [4.2.3](https://github.com/Flipkart/recyclerlistview/tree/0ffe606c0c4e9f9310dbcf9d2251777dafdf6da1), Apache-2.0.
Its [README](https://github.com/Flipkart/recyclerlistview/blob/0ffe606c0c4e9f9310dbcf9d2251777dafdf6da1/README.md)
explains deterministic versus measured sizes. Its
[`VirtualRenderer.ts`](https://github.com/Flipkart/recyclerlistview/blob/0ffe606c0c4e9f9310dbcf9d2251777dafdf6da1/src/core/VirtualRenderer.ts)
keeps stable identity separate from reusable render keys. Exact dimensions can
remove measurement work, but the input must remain correct after width/font/data
changes. This argues for an optional optimization rather than a separate list.

**Vue Virtual Scroller:** pinned [v3.0.5](https://github.com/Akryum/vue-virtual-scroller/tree/fc4a52f41e90c2c8f3eb756baf9e29e1ffe3c45b), MIT.
The [RecycleScroller guide](https://github.com/Akryum/vue-virtual-scroller/blob/fc4a52f41e90c2c8f3eb756baf9e29e1ffe3c45b/docs/guide/recycle-scroller.md)
explains type pools, inactive views, and prop-driven updates. Its
[`ItemView.vue`](https://github.com/Akryum/vue-virtual-scroller/blob/fc4a52f41e90c2c8f3eb756baf9e29e1ffe3c45b/packages/vue-virtual-scroller/src/components/ItemView.vue)
passes item/index/activity under the physical view key. An intentionally keyed
inner resource can still remount when reuse would be unsafe; keys should be
deliberate, not forbidden everywhere.

**Flutter:** the [ListView lifecycle](https://api.flutter.dev/flutter/widgets/ListView-class.html#child-elements-lifecycle)
distinguishes normal destruction from retaining the same child's subtree with
keep-alive. It recommends external ownership for durable business state and
describes focused editable children requesting retention. Caching the same item
and recycling a slot into another item solve different problems.

**AndroidX:** the [RecyclerView adapter contract](https://developer.android.com/reference/androidx/recyclerview/widget/RecyclerView.Adapter)
separates binding, attachment, detachment, and recycling. A detached holder may
return without being rebound; a recycled holder may release expensive resources.
It also warns against keeping a stale positional index in a click listener.
These distinctions motivate separate assignment/activity signals and key-based
event ownership in Xplat.

## Transfer boundaries

Borrow ownership, batching, stale-work rejection, and measurement strategies.
These React/Vue/Dart implementations are not drop-in Octane engines. Keep React
and React Native dependencies out of the shared UI package. The pinned LegendList
manifest publishes React and React Native entry points and peers on React;
FlashList peers on both React and React Native. Neither publishes a renderer-neutral
Octane engine. Reusing Xplat's current size/window machinery with a new lifetime
policy avoids adopting or forking an entire competing component stack. Copying code later
would require preserving the applicable MIT or Apache-2.0 attribution; this
study transfers conclusions only.
