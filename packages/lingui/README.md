# `@octane-xplat/lingui`

The Lingui localization runtime for Octane xplat apps: `@lingui/core` plus
the core Babel macros (`t`, `plural`, `select`, `msg`) in shared code,
with this package owning catalog loading, locale state, and per-target
locale detection. The JSX side of Lingui (`@lingui/react`) is not used —
components subscribe through `useLingui()`/`useLocale()`.

```sh
pnpm add @octane-xplat/lingui @lingui/core
```

```ts
import { catalogsFromGlob, initLingui, setLocale, i18n } from '@octane-xplat/lingui'
import { t } from '@lingui/core/macro'

// Registers catalogs and activates the initial locale — explicit `locale`
// → persisted → system → fallback. Returns the activated locale.
await initLingui({
	catalogs: catalogsFromGlob(import.meta.glob('./locales/*/messages.ts')),
	fallback: 'en',
})
await setLocale('fr')
i18n._(t`Packed`) // 'Emballé'
```

Exports: `initLingui`, `i18n`, `supportedLocales`, `detectLocale`
(per-target: navigator on web, device locale on native), `matchLocale`,
`getLocale`/`setLocale`/`subscribeLocale` (a signal-free store — locale
changes re-render subscribers via `useLocale()`), `defineCatalogs` /
`catalogsFromGlob`, and `useLingui`/`useLocale` hooks.

The `/extractor` subpath ships a `tsrxExtractor` for `@lingui/cli` so
`lingui extract` sees macros inside `.tsrx` files:

```ts
// lingui.config.ts — alongside babelExtractor
import { tsrxExtractor } from '@octane-xplat/lingui/extractor'
```

Full setup and catalog conventions:
[localization guide](../../docs/localization.md); limits in
[known limits](../../docs/known-limits.md).
