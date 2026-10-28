# Localize an app with Lingui

ID: localization
Targets: web, ios, android, macos, linux
Related APIs: InternationalizationProvider, useDirection, useTranslator, frFR, @octane-xplat/ui, @octane-xplat/lingui, initLingui, defineCatalogs, catalogsFromGlob, setLocale, getLocale, useLingui, useLocale, detectLocale, matchLocale, tsrxExtractor, @lingui/core, @lingui/cli, lingui extract, lingui compile

## Starting point

A working scaffolded app on the standard Vite toolchain. The app wants its UI
text — including text inside `.tsrx` components — in more than one language.
The reader knows the platform-services pattern and per-target leaf resolution.

## Requirements

- Author messages with Lingui core macros in `.ts`, `.tsx`, and `.tsrx` and
  get identical localized output on every target from one source string.
- Extract catalogs that include `.tsrx` sources, and load the compiled
  per-locale catalogs through the bundler on every target.
- Detect the OS locale, normalize it onto the app's supported locales, let the
  user switch at runtime, re-render subscribed components, and persist the
  choice.

## Acceptance criteria

- AC1: `initLingui` activates a supported locale — explicit `locale`, then the
  persisted value, then the detected system locale, then `fallback` — from one
  shared import on web, iOS, and Android, loading catalogs through registered
  loaders.
- AC2: Core macros (`t`, `plural`, `select`, `selectOrdinal`,
  `msg`/`defineMessage`) compile inside `.ts`, `.tsx`, and `.tsrx` sources and
  render translated text; Lingui's JSX-layer APIs (`<Trans>`, `I18nProvider`)
  are intentionally not part of the contract.
- AC3: `lingui extract` discovers messages in `.tsrx` sources (via
  `tsrxExtractor` in the app's `lingui.config.ts`) and writes per-locale
  catalogs; without it the extractor silently misses `.tsrx` messages.
- AC4: `setLocale` activates another registered locale, notifies
  `useLingui`/`useLocale` subscribers so localized components re-render, and
  rejects an unregistered locale with a descriptive error. With overlapping
  catalog loads, only the latest registered choice activates; older completions
  cannot replace it or save a stale choice.
- AC5: `detectLocale`/`matchLocale` normalize a raw system locale (`en-US`,
  `pt_BR`) onto the supported set — exact, then base-language, then fallback.
- AC6: An optional `persist` adapter round-trips the user's choice across
  launches: `load` feeds initial-locale resolution, `save` runs on `setLocale`.

- AC7: Distinguish app-string localization from the built-in Selector/Pagination
  static-string scope. Change subtree locale and sparse overrides, preserve
  controlled selection, keep provider and host direction synchronized for RTL,
  and explain nested scope isolation, English fallback and ICU/host limits.

## Documentation

- AC1: [Startup](../../../docs/app/localization.md#starting-the-runtime) — catalog
  registration and initial-locale order.
- AC2: [Authoring](../../../docs/app/localization.md#authoring-messages) — the
  core-macros-only contract.
- AC3: [Setup](../../../docs/app/localization.md#setup) — the extractor wiring and
  scripts; [status](../../../docs/app/localization.md#verification-status) for the
  remaining native-bundle check. The [packed extraction check](../../../packages/lingui/tests/packed-consumer.mjs) verifies the installed Node extractor and authored message origins.
- AC4: [Rendering and switching](../../../docs/app/localization.md#rendering-localized-text)
  and [persistence](../../../docs/app/localization.md#switching-and-persisting).
  The [real-engine lifecycle regression](../../../packages/lingui/tests/locale-lifecycle.test.mjs)
  covers overlapping catalog loads on the Node host; it does not qualify native
  catalog bundling or component rendering.
- AC5: [Detection](../../../docs/app/localization.md#locale-detection) — per-target
  sources and the matching rule.
- AC6: [Persistence](../../../docs/app/localization.md#switching-and-persisting).

- AC7: [Subtree UI strings](../../../docs/app/localization.md#change-ui-strings-in-one-part-of-a-screen),
  [maintained locale examples](../../../apps/astryx-sandbox/src/examples/internationalization/InternationalizationProvider01ShippedLocale.tsrx),
  [RTL example](../../../apps/astryx-sandbox/src/examples/internationalization/InternationalizationProvider03RtlDirection.web.tsrx).
