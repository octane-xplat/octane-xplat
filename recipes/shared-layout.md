# Compose a shared screen layout

ID: shared-layout
Targets: web, ios, android
Related APIs: Stack, HStack, VStack, StackItem, Absolute, Center, Section, AspectRatio, FormLayout, InputGroup, InputGroupText

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
- AC4: `FormLayout` arranges labeled fields and `InputGroup` associates one group label with prefix/suffix content and its input; neither is an HTML form submission API.

## Documentation

- AC1: [Flow layout](../docs/primitives.md#the-components-you-reach-for-first) and maintained [LayoutDemo](../packages/demos/src/LayoutDemo.tsrx).
- AC2: [Flow and overlap](../docs/primitives.md#the-components-you-reach-for-first) and maintained [LayoutDemo](../packages/demos/src/LayoutDemo.tsrx).
- AC3: [Layout component index](../docs/components.md#layout) and maintained [LayoutDemo](../packages/demos/src/LayoutDemo.tsrx).
- AC4: [Grouped fields](../docs/primitives.md#grouped-fields) and maintained [ComponentsDemo](../packages/demos/src/ComponentsDemo.tsrx).
