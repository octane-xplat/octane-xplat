# Render a bounded content list

ID: content-list
Targets: web, ios, android
Related APIs: List, ListItem, VirtualList, UITableView, RecyclerView, Item, listStyle, density, hasDividers, edgeCompensation

## Starting point

An app has a short, fully rendered set of related content such as steps,
notices, or links. This recipe covers content lists, not settings rows,
long windowed collections, or platform-authentic OS lists.

## Requirements

Choose the list primitive that matches the row count and platform behavior,
render readable rows with optional markers/dividers, and expose row actions
without hiding their accessible names or disabled state.

## Acceptance criteria

- AC1: Use shared `List` for a bounded content collection, `VirtualList` for a long windowed collection, `Item` for a settings row, or a platform subpath list when OS list behavior is required.
- AC2: `listStyle`, `start`, `density`, `hasDividers`, and `header` produce the requested content-list presentation on web, iOS, and Android; web-only `edgeCompensation` is documented.
- AC3: `ListItem` exposes its label and optional description, start/end content, and action/link; disabled rows do not activate and interactive web rows have one keyboard stop.
- AC4: The maintained example shows a content `List` separately from settings `Item` and explains that `List` is not virtualized or an OS-list wrapper.

## Documentation

- AC1: [Choosing a list](../docs/primitives.md#when-a-screen-needs-more) and maintained [ListDemo](../packages/demos/src/ListDemo.tsrx).
- AC2: [Content lists and ListDemo](../docs/primitives.md#reusable-rows).
- AC3: [Content lists and ListDemo](../docs/primitives.md#reusable-rows), plus [accessibility evidence limits](../docs/open-questions.md#later--finer).
- AC4: [Component index](../docs/components.md#data-display) and maintained [ListDemo](../packages/demos/src/ListDemo.tsrx).
