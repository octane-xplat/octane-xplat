# Preserve AppKit text styles

ID: appkit-text-styles
Targets: macos
Related APIs: Text, Heading, RichText, RichTextSpan, style

## Starting point

A content/settings screen renders headings, body text and styled inline runs.
ContentDisplayDemo and shared text primitives provide the demand examples.

## Acceptance criteria

- AC1: Text and Heading preserve declared style objects/strings and runtime array ordering over type-scale defaults. Root and purpose Heading paths share one implementation; classes, content and truncation props survive updates/removal.
- AC2: Normalize string/array styles before AppKit validation, creation and updates, including logical text runs and direct templates. Use the existing parser, retain quoted delimiters/custom-property case, convert native numeric units, preserve last-write order and reject invalid declaration syntax without mutating authored props. Do not claim expanded CSS property/unit/variable support.
- AC3: RichText/Span forward authored styles, RichText retains its declared ID, and removed overrides restore the existing host/cascade contract. Distinguish source/parser/handler evidence from actual native glyphs/layout/truncation/AX/packaging.

## Documentation

- AC1: [Text usage](../../../docs/app/components.md#text), four [UI source cases](../../../packages/ui/src/text-style.macos.mobile.test.tsrx) and [manual target fixture](../../../examples/probes/text-styles.macos.tsrx). Cases and fixture are unrun.
- AC2: [Renderer contract](../../../packages/macos-renderer/README.md#apply-stylesheets), four [parser cases](../../../packages/css-engine/test/inline-style.test.ts), two [host/validation cases](../../../packages/macos-renderer/test/inline-style.test.ts) and [target note](../parity/appkit-progress.md#appkit-inline-style-normalization-and-text-entrypoints). All cases unrun; no native application is qualified.
- AC3: The same usage, source cases and fixture describe current forwarding/removal. Native shaping/measurement/truncation/VoiceOver and root/purpose packed consumers remain unqualified; no evidence gate is closed.
