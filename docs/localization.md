# Localization

> One catalog set, every target — Lingui core macros in shared code, with
> `@octane-xplat/lingui` owning catalog loading, locale state, and detection.

The framework's localization contract is [Lingui](https://lingui.dev)'s
renderer-free half: `@lingui/core` plus the core Babel macros (`t`, `plural`,
`select`, `selectOrdinal`, `msg`/`defineMessage`). Macros compile to
`i18n._(...)` calls against a plain JavaScript catalog — nothing in the
pipeline touches a DOM or a native widget, so the same source string localizes
the web app and the NativeScript targets identically.

The JSX side of Lingui (`<Trans>`, `I18nProvider`, `useLingui` from
`@lingui/react`) is **not** used: components subscribe through
`useLingui()`/`useLocale()` from `@octane-xplat/lingui` instead.

## Setup

```sh
pnpm add @octane-xplat/lingui @lingui/core
pnpm add -D @lingui/cli @lingui/vite-plugin @lingui/babel-plugin-lingui-macro @lingui/format-json
```

`@lingui/core` is a direct app dependency on purpose: macro-expanded code
imports the `i18n` singleton from `@lingui/core`, and it must resolve to the
same copy the leaf configured — keep the version inside the leaf's dependency
range.

Add the Lingui Babel preset and catalog plugin next to `octane()` in the app's
Vite config, and widen the Babel include to `.tsrx`:

```ts
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'

plugins: [
	...octane(),
	babel({
		include: /\.(?:[cm]?[jt]sx?|tsrx)$/,
		presets: [linguiTransformerBabelPreset()],
	}),
	lingui({ failOnCompileError: true }),
]
```

Without `tsrx` in the Babel include, `.tsrx` modules keep the unexpanded
`@lingui/core/macro` import and the app fails at runtime.

`lingui.config.ts` registers the catalog layout and the extractors — the
default extractor chain does not scan `.tsrx`, so the leaf ships one:

```ts
import { defineConfig } from '@lingui/cli'
import { formatter } from '@lingui/format-json'
import { babelExtractor, tsrxExtractor } from '@octane-xplat/lingui/extractor'

export default defineConfig({
	sourceLocale: 'en',
	locales: ['en', 'es'],
	fallbackLocales: { default: 'en' },
	catalogs: [
		{
			path: '<rootDir>/locales/{locale}/messages',
			include: ['<rootDir>/src'],
		},
	],
	extractors: [babelExtractor, tsrxExtractor],
	compileNamespace: 'es',
	format: formatter({ lineNumbers: false, style: 'lingui' }),
})
```

Add the scripts:

```json
{
	"i18n:extract": "lingui extract",
	"i18n:compile": "lingui compile"
}
```

`tsrxExtractor` runs the `.tsrx` source through `octane/compiler`'s `compile()`
— which lowers component syntax to plain TypeScript while preserving the macro
imports — then hands the output to Lingui's own babel extractor. It is
Node-side code; it never enters an app bundle.

## Authoring messages

Core macros only, in `.ts`, `.tsx`, and `.tsrx` alike:

```ts
import { t, plural, msg } from '@lingui/core/macro'

const title = t`Inbox`
const count = plural(unread, { one: '# message', other: '# messages' })
const deferred = msg`Save` // descriptor; translate later with i18n.t(deferred)
```

Keep localizable text inside functions or render paths — macros at module top
level evaluate before a locale is activated.

## Starting the runtime

Register per-locale catalog loaders and activate the initial locale at app
startup, before first render:

```ts
import { catalogsFromGlob, initLingui } from '@octane-xplat/lingui'

const catalogs = catalogsFromGlob(
	import.meta.glob('../locales/*/messages', { query: '?lingui' }),
)

await initLingui({
	catalogs,
	fallback: 'en',
})
```

`catalogsFromGlob` maps the `import.meta.glob` result onto locales by reading
the parent directory of each matched file — it expects the
`locales/<locale>/<name>` layout above. `import.meta.glob` is a compile-time
Vite feature, so the same call works in the native bundle — the loaders become
static dynamic imports rather than a filesystem scan. Alternatively register
loaders explicitly with `defineCatalogs({ en: () => import('./locales/en/messages'), … })`.

`initLingui` resolves the initial locale in this order — `setup.locale`
(explicit override) → the `persist` adapter's stored value → the detected
system locale → `fallback` — and returns the locale it activated.

## Rendering localized text

Macros alone don't subscribe a component to locale changes. Call `useLingui()`
in any component whose output must re-render on `setLocale`:

```tsrx
import { t } from '@lingui/core/macro'
import { useLingui } from '@octane-xplat/lingui'

export function Header() @{
	useLingui()
	return <h1>{t`Inbox`}</h1>
}
```

`useLocale()` returns the active locale string when a component needs the
value itself. Outside components, `getLocale()` reads it non-reactively.

## Switching and persisting

```ts
import { setLocale } from '@octane-xplat/lingui'

await setLocale('es') // throws if no catalog is registered for the locale
```

Persist the user's choice through the `persist` adapter — the app picks the
storage seam (e.g. `secure-storage`, `ApplicationSettings`, or `localStorage`
on web):

```ts
await initLingui({
	catalogs,
	fallback: 'en',
	persist: {
		load: () => storage.getString('app-locale'),
		save: (locale) => storage.setString('app-locale', locale),
	},
})
```

## Locale detection

`detectLocale()` maps a raw system locale onto the registered catalogs —
exact match, then base-language match (`es-MX` → `es`), then the fallback.
`detectLocale(candidate)` overrides the system source (a route param or
server hint); `matchLocale(candidate, supported, fallback)` is the same
matching step as a standalone pure function.

The system source is per target:

| Target | Source |
| --- | --- |
| web, linux | `navigator.language` |
| iOS, Android | `@nativescript/core` `Device.language` |
| macOS, Windows | `Intl.DateTimeFormat().resolvedOptions().locale` |

## Verification status

Desk- and harness-verified: macro expansion inside `.tsrx` through the
configured Babel include, `.tsrx` extraction via `tsrxExtractor` (message lands
in the catalog with its `.tsrx` origin), the store/activation/persist logic in
unit tests, and both `dist` lanes (web keeps `navigator`, native keeps
`Device.language` and rewrites `octane` to `octane/universal/native`).

Not yet device-verified: `import.meta.glob` catalog loading inside a real
native bundle (the pattern matches the ui route tables' glob use, so it is
expected to work), `Device.language` on physical iOS/Android, and
`Intl.PluralRules` availability on the NS runtimes (JavaScriptCore/V8 — both
ship Intl; flagged pending a device pass).
