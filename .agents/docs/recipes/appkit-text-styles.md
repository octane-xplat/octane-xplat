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

- AC4: Shared Text/RichText nesting produces logical runs under one native text owner, including Text inside Heading. Root and purpose RichText exports match; explicit span text/empty string wins without duplicating children, while unset text falls back. Root Text/RichText retain parent-layout props and capped Text can shrink. Inner runs have no separate layout/line-cap owner; per-span press hit testing remains a documented gap.

- AC5: Outer Text forwards test identity and supported accessible/name/hint/value metadata. Native readable hosts use help/value descriptions without rewriting displayed text; empty strings stay explicit, removal clears descriptions and restores element participation. Do not infer unsupported Text states/live announcements, arbitrary other role mappings or inner-run accessibility owners.

- AC6: Heading forwards its semantic level independently of display scale. AppKit maps the heading role, level and current plain/decorated/rich contents to native role/value/title, preserves displayed content and restores original metadata on role removal. Keep macos label typing separate from shared/native declarations. Source/type assertions do not qualify native setter/NSNumber behavior, VoiceOver navigation/announcements/updates or packed consumers.

## Documentation

- AC1: [Text usage](../../../docs/app/components.md#text), four [UI source cases](../../../packages/ui/src/components/forms/text-style.macos.mobile.test.tsrx) and [manual target fixture](../../../examples/probes/text-styles.macos.tsrx). Cases and fixture are unrun.
- AC2: [Renderer contract](../../../packages/macos-renderer/README.md#apply-stylesheets), four [parser cases](../../../packages/css-engine/test/inline-style.test.ts), two [host/validation cases](../../../packages/macos-renderer/test/inline-style.test.ts) and [target note](../parity/appkit-progress.md#appkit-inline-style-normalization-and-text-entrypoints). All cases unrun; no native application is qualified.
- AC3: The same usage, source cases and fixture describe current forwarding/removal. Native shaping/measurement/truncation/VoiceOver and root/purpose packed consumers remain unqualified; no evidence gate is closed.

- AC4: [AppKit text composition](../../../docs/app/components.md#text), four [composition source cases](../../../packages/ui/src/components/forms/text-composition.macos.mobile.test.tsrx), updated [target fixture](../../../examples/probes/text-styles.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-readable-text-composition-and-purpose-entry). All cases/fixture are unrun. Readable source runs do not qualify native rendering, glyph hit testing, links, AX or packaging.

- AC5: [Text metadata usage](../../../docs/app/components.md#text), [native description contract](../../../packages/macos-renderer/README.md#readable-text-accessibility-descriptions), one added [UI forwarding case](../../../packages/ui/src/components/forms/text-composition.macos.mobile.test.tsrx), one [native-source mapping/reset case](../../../packages/macos-renderer/test/readable-text-accessibility.test.ts) and the updated [manual fixture](../../../examples/probes/text-styles.macos.tsrx), all unrun. [Target note](../parity/appkit-progress.md#appkit-readable-text-accessibility-descriptions) records exact deferred checks. VoiceOver, hierarchy/navigation and native mutation/reset remain unqualified.

- AC6: [Heading usage](../../../docs/app/components.md#text), [renderer mapping](../../../packages/macos-renderer/README.md#readable-heading-accessibility), [conditioned label types](../../../packages/jsx/README.md#export-conditions), four [renderer cases](../../../packages/macos-renderer/test/heading-accessibility.test.ts), extended [UI source case](../../../packages/ui/src/components/forms/text-style.macos.mobile.test.tsrx), packed positive/range assertions and the updated [manual fixture](../../../examples/probes/text-styles.macos.tsrx), all unrun. [Target note](../parity/appkit-progress.md#appkit-heading-role-level-and-current-title) records source evidence and deferred commands; native qualification remains open.
