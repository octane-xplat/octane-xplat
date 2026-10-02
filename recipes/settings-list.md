# Build a settings list with reusable rows

ID: settings-list
Targets: web, ios, android
Related APIs: `Item`, `FieldGroup`, `modifier`, `Icon.select`

## Starting point

The app uses `@octane-xplat/ui` and has a screen that presents preferences or
other compact rows. The `@octane-xplat/ui/ios` and `/android` subpaths are
available only from matching platform files.

## Requirements

The screen needs a portable row with optional leading and trailing content,
title and supporting text, and an optional press action. Some screens group
editable fields with row content. A platform-specific screen may also need to
style a platform-authentic widget or choose its native glyph.

## Acceptance criteria

- AC1: `Item` can show leading content, title, supporting text, trailing content, and an optional press action on web, iOS, and Android.
- AC2: A row can use the shorthand props or compound slots and can appear inside or outside `FieldGroup`.
- AC3: Platform-specific widget modifiers and glyph selection are imported from a matching platform subpath and do not change shared `Icon` behavior.
- AC4: Actionable rows have meaningful accessible names and disabled rows do not activate. On web, Tab reaches enabled actions and Enter/Space activate each action once; informational and disabled rows are outside the Tab sequence. Native assistive activation must be verified with VoiceOver/TalkBack separately from prop readback.

## Documentation

- AC1: [Building screens: reusable rows](../docs/app/primitives.md#reusable-rows) and maintained [ListDemo](../packages/demos/src/ListDemo.tsrx), [iOS ListDemo](../packages/demos/src/ListDemo.ios.tsrx), and [Android ListDemo](../packages/demos/src/ListDemo.android.tsrx).
- AC2: [Building screens: reusable rows](../docs/app/primitives.md#reusable-rows) and maintained [ListDemo](../packages/demos/src/ListDemo.tsrx).
- AC3: [Building screens: native modifiers and glyphs](../docs/app/primitives.md#native-modifiers-and-glyphs).
- AC4: [Building screens: reusable rows](../docs/app/primitives.md#reusable-rows), maintained [ListDemo](../packages/demos/src/ListDemo.tsrx), and [accessibility evidence limits](../docs/notes/open-questions.md#later--finer).
