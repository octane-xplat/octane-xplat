# Localize an app with Lingui

ID: localization
Targets: web, ios, android, macos, linux
Related APIs: @octane-xplat/lingui, initLingui, defineCatalogs, catalogsFromGlob, setLocale, getLocale, useLingui, useLocale, detectLocale, matchLocale, tsrxExtractor, @lingui/core, @lingui/cli, lingui extract, lingui compile

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
  rejects an unregistered locale with a descriptive error.
- AC5: `detectLocale`/`matchLocale` normalize a raw system locale (`en-US`,
  `pt_BR`) onto the supported set — exact, then base-language, then fallback.
- AC6: An optional `persist` adapter round-trips the user's choice across
  launches: `load` feeds initial-locale resolution, `save` runs on `setLocale`.

## Documentation

- AC1: [Startup](../docs/localization.md#starting-the-runtime) — catalog
  registration and initial-locale order.
- AC2: [Authoring](../docs/localization.md#authoring-messages) — the
  core-macros-only contract.
- AC3: [Setup](../docs/localization.md#setup) — the extractor wiring and
  scripts; [status](../docs/localization.md#verification-status) for the
  remaining native-bundle check.
- AC4: [Rendering and switching](../docs/localization.md#rendering-localized-text)
  and [persistence](../docs/localization.md#switching-and-persisting).
- AC5: [Detection](../docs/localization.md#locale-detection) — per-target
  sources and the matching rule.
- AC6: [Persistence](../docs/localization.md#switching-and-persisting).
