# `@octane-xplat/lingui`

```sh
pnpm add @octane-xplat/lingui @lingui/core
```

The Lingui localization runtime for Octane xplat apps: `@lingui/core` plus
the core Babel macros (`t`, `plural`, `select`, `msg`) in shared code,
with this package owning catalog loading, locale state, and per-target
locale detection. The JSX side of Lingui (`@lingui/react`) is not used —
components subscribe through `useLingui()`/`useLocale()`.

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
t`Packed` // The macro returns the translation in the active locale.
```

Exports: `initLingui`, `i18n`, `supportedLocales`, `detectLocale`
(per-target: navigator on web, device locale on native), `matchLocale`,
`getLocale`/`setLocale`/`subscribeLocale` (a signal-free store — locale
changes re-render subscribers via `useLocale()`), `defineCatalogs` /
`catalogsFromGlob`, and `useLingui`/`useLocale` hooks.

```tsx
import {
	defineCatalogs,
	detectLocale,
	matchLocale,
	getLocale,
	supportedLocales,
	subscribeLocale,
	useLingui,
	useLocale,
} from '@octane-xplat/lingui'
import { Text } from '@octane-xplat/ui'

// Register a compiled catalog loader (add additional languages before switching).
defineCatalogs({ en: async () => ({ Packed: 'Packed' }) })
console.log(detectLocale(), matchLocale('en-US', supportedLocales(), 'en'), getLocale())
const unsubscribe = subscribeLocale(() => console.log(getLocale()))
unsubscribe()
export function PackingStatus() {
	const locale = useLocale()
	const i18n = useLingui()
	return (
		<Text>
			{locale}: {i18n._('Packed')}
		</Text>
	)
}
```

The `/extractor` subpath ships a `tsrxExtractor` for `@lingui/cli` so
`lingui extract` sees macros inside `.tsrx` files:

```ts
// lingui.config.ts
import { defineConfig } from '@lingui/conf'
import { babelExtractor, tsrxExtractor } from '@octane-xplat/lingui/extractor'

export default defineConfig({
	locales: ['en', 'fr'],
	sourceLocale: 'en',
	catalogs: [{ path: 'src/locales/{locale}/messages', include: ['src'] }],
	extractors: [babelExtractor, tsrxExtractor],
})
```

Full setup and catalog conventions:
[localization guide](../../docs/localization.md); limits in
[known limits](../../docs/known-limits.md).
