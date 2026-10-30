# Compose a shared screen layout

ID: shared-layout
Targets: web, ios, android
Related APIs: Screen, SafeArea, prepareFullScreenPage, Grid, LayoutChildProps, Stack, HStack, VStack, StackItem, Absolute, Center, Section, AspectRatio, FormLayout, InputGroup, InputGroupText

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

- AC5: Grid documents intrinsic track minimums and the explicit bounded-track CSS option, preserves explicit zero-based placement and spans on composite roots, flows automatic cells, and reflows reactive insertion/removal/reorder. State the NativeScript patch requirement and evidence limits.

- AC6: Retained screens overlap through same-cell View layers in a bounded Grid; explain that Screen remains in parent flow and does not provide modal isolation.

- AC7: Native Screens use their assigned host bounds from first mount; a prepared Frame-navigated Page fills its native bounds and SafeArea alone supplies system-bar padding. Explain embedded-host limits and avoid compensating margins.

## Documentation

- AC1: [Flow layout](../../../docs/app/primitives.md#the-components-you-reach-for-first) and maintained [LayoutDemo](../../../packages/demos/src/LayoutDemo.tsrx).
- AC2: [Flow and overlap](../../../docs/app/primitives.md#the-components-you-reach-for-first) and maintained [LayoutDemo](../../../packages/demos/src/LayoutDemo.tsrx).
- AC3: [Layout component index](../../../docs/app/components.md#layout) and maintained [LayoutDemo](../../../packages/demos/src/LayoutDemo.tsrx).
- AC4: [Grouped fields](../../../docs/app/primitives.md#grouped-fields) and maintained [ComponentsDemo](../../../packages/demos/src/ComponentsDemo.tsrx).

- AC5: [Grid placement](../../../docs/app/primitives.md#grid-placement), [native Screen/Grid width regression](../../../apps/mobile/src/tests/screen-grid-width.spec.tsrx), maintained [Grid driver fixture](../../../packages/ui/tests/grid-placement.fixture.mobile.tsrx), and [percentage-image track-minimum regression](../../../apps/mobile/src/tests/image-percentage-grid.spec.tsrx).

- AC6: [Retained screen layers](../../../docs/app/primitives.md#layer-a-screen-over-retained-content), [agent guidance](../../skills/octane-xplat/references/primitives/layout.md#retained-screen-layers), maintained [geometry fixture](../../../examples/probes/screen-layers.tsrx), and [intrinsic-content/parent-resize regression](../../../apps/mobile/src/tests/foreign-screen-height.spec.tsrx).

- AC7: [Safe-area edges and the native Page host](../../../docs/app/primitives.md#safe-area-edges), [Page measurement tests](../../../packages/ui/src/components/layout/full-screen-page.mobile.test.ts), and [native first-mount fixture](../../../examples/probes/screen-safe-area.ios.tsrx).
