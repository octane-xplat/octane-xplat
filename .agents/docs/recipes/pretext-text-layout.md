# Measure and lay out text with Pretext

ID: pretext-text-layout
Targets: web, ios, android, macos, linux, windows
Related APIs: @octane-xplat/pretext, @octane-xplat/pretext/rich-inline, prepare(), layout(), prepareWithSegments(), layoutWithLines(), prepareRichInline(), layoutNextRichInlineLineRange(), materializeRichInlineLineRange()

## Starting point

An Xplat app needs to estimate paragraph size or choose line breaks before a
text view renders. The app can install `@octane-xplat/pretext`; this recipe
covers text measurement and layout, not a replacement text renderer.

## Requirements

- Measure a paragraph for a chosen font and available width, then reuse that
  measurement while the text and font stay the same.
- Preserve chosen line breaks when drawing text with a custom canvas or view.
- Arrange mixed-font text and inline boxes when a paragraph contains chips,
  mentions, or similar content.
- Keep the same API usable on web, iOS, Android, macOS, Linux/GTK, and Windows,
  while making font and segmentation limits clear.

## Acceptance criteria

- AC1: A reader installs the adapter, prepares a paragraph, and gets its line
  count and height for a width and line height.
- AC2: A reader reuses prepared measurements for another width and knows to
  prepare again when the text or font changes.
- AC3: A reader obtains the chosen line strings and can draw them at line-height
  offsets without asking a second engine to choose line breaks.
- AC4: A reader uses the rich-inline entry point for text with different fonts
  or measured inline boxes.
- AC5: A reader knows which text-measurement backend runs on each of the six
  targets and that native text views can choose different line breaks.
- AC6: A reader knows which CSS font strings the native adapter accepts, how
  font availability and weight mapping affect measurements, and where to find
  Pretext's language-segmentation caveats.

## Documentation

- AC1: [Measure a paragraph](../../../docs/packages/package-pretext.md#measure-a-paragraph) and the maintained [measurement example](../../../packages/pretext/examples/measure.ts).
- AC2: [Measure a paragraph](../../../docs/packages/package-pretext.md#measure-a-paragraph).
- AC3: [Paint the lines Pretext chose](../../../docs/packages/package-pretext.md#paint-the-lines-pretext-chose) and the maintained [measurement example](../../../packages/pretext/examples/measure.ts).
- AC4: [Lay out mixed text and inline objects](../../../docs/packages/package-pretext.md#lay-out-mixed-text-and-inline-objects).
- AC5: [What the adapter measures](../../../docs/packages/package-pretext.md#what-the-adapter-measures).
- AC6: [Font strings and language segmentation](../../../docs/packages/package-pretext.md#font-strings-and-language-segmentation).
