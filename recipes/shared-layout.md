# Compose a shared screen layout

ID: shared-layout
Targets: web, ios, android
Related APIs: Grid, LayoutChildProps, Stack, HStack, VStack, StackItem, Absolute, Center, Section, AspectRatio, FormLayout, InputGroup, InputGroupText

## Starting point

An app uses `@octane-xplat/ui` and needs a screen layout that shares its
structure across web, iOS, and Android.

## Requirements

Lay out content in rows and columns, make overlap explicit, and compose
centered, sectioned, ratio-constrained, and form content while accounting for
the behavior differences between DOM and NativeScript.

## Acceptance criteria

- AC1: `Stack` flows in a row or column with consistent main/cross alignment and spacing steps; `HStack` and `VStack` provide the fixed-direction forms.
- AC2: `StackItem` fills or aligns within its parent flow; same-area overlap uses `Absolute` rather than `Stack`.
- AC3: `Center`, `Section`, and `AspectRatio` provide their documented layout on web and native, with platform limits stated for inline centering and native measurement.
- AC4: `FormLayout` arranges labeled fields, nested layouts inherit omitted `defaultOptionality` while explicit child values take precedence, and `InputGroup` associates one group label with prefix/suffix content and its input; neither is an HTML form submission API.

- AC5: Grid preserves explicit zero-based placement and spans on composite roots, flows automatic cells, and reflows reactive insertion/removal/reorder. State the NativeScript patch requirement and evidence limits.

## Documentation

- AC1: [Flow layout](../docs/app/primitives.md#the-components-you-reach-for-first) and maintained [LayoutDemo](../packages/demos/src/LayoutDemo.tsrx).
- AC2: [Flow and overlap](../docs/app/primitives.md#the-components-you-reach-for-first) and maintained [LayoutDemo](../packages/demos/src/LayoutDemo.tsrx).
- AC3: [Layout component index](../docs/app/components.md#layout) and maintained [LayoutDemo](../packages/demos/src/LayoutDemo.tsrx).
- AC4: [Grouped fields](../docs/app/primitives.md#grouped-fields) and maintained [ComponentsDemo](../packages/demos/src/ComponentsDemo.tsrx).

- AC5: [Grid placement](../docs/app/primitives.md#grid-placement) and maintained [Grid driver fixture](../packages/ui/tests/grid-placement.fixture.mobile.tsrx).
