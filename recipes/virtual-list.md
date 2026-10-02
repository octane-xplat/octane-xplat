# Render a long vertical collection

ID: virtual-list
Targets: web, ios, android, linux
Related APIs: VirtualList, keyExtractor, getItemType, renderItem, renderHeader, renderFooter, renderSeparator, renderEmpty

## Starting point

An app with a bounded column viewport and immutable item-array updates. This
workflow covers vertical windowing and measured anchors, not a complete feed/chat
implementation. Web/iOS/Android pool compatible outer hosts while logical
off-window rows unmount; durable item state belongs in an external store.

## Requirements

Render a long keyed collection, keep durable state outside unmounted rows,
preserve a retained visible anchor during data/height changes, and evaluate
performance with target-specific evidence.

## Acceptance criteria

- AC1: Render a bounded vertical row window with stable unique keys and explain duplicate-key/type-change behavior.
- AC2: Retain mounted keyed local state across prepend and explain state loss after off-window unmount.
- AC3: Preserve a retained visible anchor within 2 layout units after prepend and above-anchor row remeasurement settles; explain unknown-height seeks and removed-anchor limits.
- AC4: Render header, footer, separator, empty, and restored data and remove rows on emptying/disposal.
- AC5: Run nonvisual target benchmarks and distinguish resize delivery errors, input provenance, row geometry, mount bounds, memory collection, JavaScript responsiveness, and platform frame pacing; identify remaining feed/chat gaps.

## Documentation

- AC1: [Identity and viewport](../docs/app/virtual-list.md#keep-identity-and-state-stable), [example](../packages/demos/src/VirtualList.tsrx).
- AC2: [Row state ownership](../docs/app/virtual-list.md#keep-identity-and-state-stable), [example](../packages/demos/src/VirtualList.tsrx).
- AC3: [Visible position](../docs/app/virtual-list.md#preserve-the-visible-position), [contract gate](../apps/web/scripts/bench-virtual-list-contract.mjs).
- AC4: [Slots and example](../docs/app/virtual-list.md#preserve-the-visible-position), [Linux GTK harness sweep](../apps/linux/host/harness-selftest.web.js), [example](../packages/demos/src/VirtualList.tsrx).
- AC5: Android window frame metrics and the `demo500` fixture are described in [Measured boundary](../docs/app/virtual-list.md#measured-support-boundary), [Linux smoke limits](../docs/app/virtual-list.md#measured-support-boundary), and [nonvisual gates](../docs/app/virtual-list.md#run-the-nonvisual-gates).
