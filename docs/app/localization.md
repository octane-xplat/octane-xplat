# Localizing an app

> Show your app's text in another language with Lingui.

**Localization** adapts an app for someone's language or region. A **locale**
is a language and, sometimes, a region, such as English (`en`) or Spanish
(`es`). A **catalog** is a file of translated messages.

For example, you can mark “Packing list” as a translatable message, add its
Spanish translation to a catalog, and switch the app to Spanish. The same
messages can serve web, iOS, and Android. This guide assumes you already
have [a working app](../start/toolchain.md#create-and-run).

The setup below changes build configuration. If you're using an agent, ask
it to add Lingui for your chosen languages, run the checks, and show you
how to switch between them. A **macro** marks text in code and is replaced
by the build with a translation lookup.

## Setup

```sh
bun add @octane-xplat/lingui @lingui/core
bun add -D @lingui/cli @lingui/vite-plugin @lingui/babel-plugin-lingui-macro @lingui/format-json
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
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'

export default defineConfig({
	plugins: [
		...octane(),
		babel({
			include: /\.(?:[cm]?[jt]sx?|tsrx)$/,
			presets: [linguiTransformerBabelPreset()],
		}),
		lingui({ failOnCompileError: true }),
	],
})
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

```ts
// Node-side lingui.config.ts; keep this out of application modules.
import { defineConfig } from '@lingui/conf'
import { babelExtractor, tsrxExtractor } from '@octane-xplat/lingui/extractor'

export default defineConfig({
	locales: ['en', 'es'],
	sourceLocale: 'en',
	catalogs: [{ path: 'src/locales/{locale}/messages', include: ['src'] }],
	extractors: [babelExtractor, tsrxExtractor],
})
```

## Authoring messages

Core macros only, in `.ts`, `.tsx`, and `.tsrx` alike:

```ts
import { t, plural, msg } from '@lingui/core/macro'

export function inboxMessages(unread: number) {
	return {
		title: t`Inbox`,
		count: plural(unread, { one: '# message', other: '# messages' }),
		deferred: msg`Save`, // translate later with i18n._(deferred)
	}
}
```

Keep localizable text inside functions or render paths — macros at module top
level evaluate before a locale is activated.

```ts
import { msg } from '@lingui/core/macro'
import { i18n } from '@octane-xplat/lingui'

export function saveLabel() {
	const save = msg`Save`

	return i18n._(save)
}
```

## Starting the runtime

Register per-locale catalog loaders and activate the initial locale at app
startup, before first render:

```ts
import { catalogsFromGlob, initLingui } from '@octane-xplat/lingui'

const catalogs = catalogsFromGlob(import.meta.glob('../locales/*/messages', { query: '?lingui' }))

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
loaders explicitly with `defineCatalogs` with explicit loaders.

```ts
import { defineCatalogs, catalogsFromGlob } from '@octane-xplat/lingui'

const catalogs = catalogsFromGlob(import.meta.glob('../locales/*/messages', { query: '?lingui' }))
defineCatalogs(catalogs)
// Explicit alternative, with the same catalog files:
defineCatalogs({
	en: () => import('../locales/en/messages'),
	es: () => import('../locales/es/messages'),
})
```

`initLingui` resolves the initial locale in this order — `setup.locale`
(explicit override) → the `persist` adapter's stored value → the detected
system locale → `fallback` — and returns the locale it activated.

```ts
// Continue in the startup file above.
const active = await initLingui({ catalogs, locale: 'es', fallback: 'en' })
console.log(active) // es: the explicit choice wins
```

## Rendering localized text

Macros alone don't subscribe a component to locale changes. Call `useLingui()`
in any component whose output must re-render on `setLocale`:

```tsrx
import { t } from '@lingui/core/macro'
import { useLingui } from '@octane-xplat/lingui'

import { Text } from '@octane-xplat/ui'

export function Header() @{
	useLingui()

	return <Text accessibilityRole="heading">{t`Inbox`}</Text>
}
```

`useLocale()` returns the active locale string when a component needs the
value itself. Outside components, `getLocale()` reads it non-reactively.

```tsx
import { useLocale, getLocale } from '@octane-xplat/lingui'
import { Text } from '@octane-xplat/ui'

export function LocaleLabel() {
	return <Text>{useLocale()}</Text>
}

export function logLocale() {
	console.log(getLocale())
}
```

## Switching and persisting

When catalog loads overlap, only the latest registered choice activates its
catalog and saves its locale. A slower earlier load cannot switch the app back. If the
latest load fails, its promise rejects and the previously active locale stays
visible.

```ts
import { setLocale } from '@octane-xplat/lingui'

await setLocale('es') // throws if no catalog is registered for the locale
```

Persist the user's choice through the `persist` adapter — the app picks the
storage seam (e.g. `secure-storage`, `ApplicationSettings`, or `localStorage`
on web):

```ts
// Continue with catalogs and initLingui from the startup example.
import { storage } from '@octane-xplat/platform'

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

```ts
import { detectLocale, matchLocale } from '@octane-xplat/lingui'

// After initLingui has registered en and es:
console.log(detectLocale())
console.log(detectLocale('es-MX')) // es
console.log(matchLocale('es-MX', ['en', 'es'], 'en')) // es
```

The system source is per target:

| Target         | Source                                           |
| -------------- | ------------------------------------------------ |
| web, linux     | `navigator.language`                             |
| iOS, Android   | `@nativescript/core` `Device.language`           |
| macOS, Windows | `Intl.DateTimeFormat().resolvedOptions().locale` |

For AppKit runtime metadata, the platform's `locale` snapshot preserves script
and region parts without confusing one for the other. Feed its full tag into
`matchLocale` when you explicitly choose that snapshot as the candidate; Lingui's
own system detector is unchanged. See [snapshot/fallback limits](../platform/platform-services.md#read-appkit-locale-and-device-metadata).

```ts
import { locale } from '@octane-xplat/platform/locale'
import { matchLocale } from '@octane-xplat/lingui'

const candidate = matchLocale(locale.tag, ['en', 'zh'], 'en')
```

## Native formatting data

On iOS and Android, importing the Lingui integration installs the Intl APIs
that its message engine and hooks need. The package owns the FormatJS
dependencies; you do not need a polyfill bootstrap. English formatting data is
included:

```ts
import { initLingui, i18n } from '@octane-xplat/lingui'

await initLingui({
  locale: 'en',
  catalogs: { en: async () => ({ messages: {} }) },
})
console.log(i18n.number(1234.5)) // 1,234.5
```

For another language, load its formatting data before activating the catalog.
Translation catalogs contain your messages; these data entries supply number,
date, list, and plural rules. Keep the import in a `.mobile.ts` file so other
targets continue using their built-in data:

```ts
// src/locale-data.mobile.ts
import '@octane-xplat/lingui/locales/de'
import '@octane-xplat/lingui/locales/fr-CA'
```

```ts
// src/locale-data.ts — other targets
export {}
```

```ts
// In the module that starts localization, before calling initLingui:
import './locale-data'
import { initLingui, i18n } from '@octane-xplat/lingui'

await initLingui({
  locale: 'de',
  catalogs: { de: async () => ({ messages: {} }) },
})
console.log(i18n.number(1234.5)) // 1.234,5
```

The native date formatter defaults to UTC. Load named time-zone data separately
and pass the desired zone explicitly; the package does not infer the device's
zone. `golden` is the smaller major-zone dataset; `all` includes the full set:

```ts
// src/locale-data.mobile.ts
import '@octane-xplat/lingui/time-zones/all'
```

```ts
console.log(i18n.date(0, {
  timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23',
}))
```

The native integration installs guarded global `getCanonicalLocales`, `Locale`,
`PluralRules`, `NumberFormat`, `DateTimeFormat`, `ListFormat`, and `Collator`.
It does not install `RelativeTimeFormat` or `Segmenter`. FormatJS guards may
replace existing but incomplete implementations; repeated resolved imports
share initialization. Collator's embedded data accounts for most of the
roughly 8.6 MB uncompressed native library bundle measured for this integration.

UI remains independent: basic UI imports install no polyfills. Table falls back
to natural sorting and optional text segmentation falls back to code points.
Explicit locale-aware UI features still require their corresponding APIs; check
individual capabilities because another leaf may install only part of Intl:

```ts
const hasRelativeTime =
  typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat === 'function'
```

Installing Intl does not repair NativeScript's separate no-op
`String.prototype.normalize`; Lingui filtering still cannot promise
canonical-equivalence matching there.

## Verification status

Desk- and harness-verified: macro expansion inside `.tsrx` through the
configured Babel include, `.tsrx` extraction via `tsrxExtractor` (message lands
in the catalog with its `.tsrx` origin), the store/activation/persist logic in
unit tests, and both `dist` lanes (web keeps `navigator`, native keeps
`Device.language` and rewrites `octane` to `octane/universal/native`).

Not yet device-verified: `import.meta.glob` catalog loading inside a real
native bundle (the pattern matches the ui route tables' glob use, so it is
expected to work) and `Device.language` on physical iOS/Android.

Built-in `Intl.PluralRules` is unavailable on the NS runtimes: checked on device
2026-10-21, the NativeScript iOS and Android runtimes embed V8 built without
ICU and `Intl` is undefined there (`@nativescript/ios` 9.1.0 simulator,
`@nativescript/android` 9.1.1 device). The leaf-owned initialization above
passed combined formatting and segmentation checks on Chromium, an iOS
simulator, and macOS on 2026-10-28. Android polyfill execution remains unverified.

## Change UI strings in one part of a screen

Wrap a Selector or Pagination in `InternationalizationProvider` to change its
built-in static strings without changing the rest of the app. The provider's
locale can change while a selection stays in place. `frFR` contains the French
static strings for these two components; it is not a full Astryx catalog.

```tsx
import { InternationalizationProvider, Selector, frFR } from '@octane-xplat/ui'

export function Region() {
	return (
		<InternationalizationProvider locale="fr-FR" messages={{ 'fr-FR': frFR }}>
			<Selector label="Billing region" hasClear options={[
				{ value: 'emea', label: 'EMEA' },
				{ value: 'apac', label: 'APAC' },
			]} />
		</InternationalizationProvider>
	)
}
```

Use `overrides` for a few replacement strings. Lookup checks the exact locale,
then its parent tags, first in overrides and then in messages. Missing entries
use built-in English strings. Nested providers replace their parent's scope.
This API handles static messages only; use Lingui for app text, plurals, and
formatted messages. Explicit Selector text props take precedence over catalogs.

```tsx
import { InternationalizationProvider, Selector } from '@octane-xplat/ui'

export function Choice() {
	return (
		<InternationalizationProvider locale="en" overrides={{
			en: { '@astryx.selector.placeholder': 'Choose...' },
		}}>
			<Selector label="Region" options={[]} />
		</InternationalizationProvider>
	)
}
```

For RTL on web, set both the provider's `dir` and the wrapping element's `dir`.
The provider supplies direction to Pagination's chevrons; the host attribute
mirrors layout. Native locale state and static labels share the implementation,
but native layout mirroring and input still need actual-host qualification.

```tsx
import { InternationalizationProvider, Pagination } from '@octane-xplat/ui'

// A browser leaf, for example RtlPreview.web.tsx.
export function RtlPreview() {
	return (
		<InternationalizationProvider locale="en" dir="rtl">
			<div dir="rtl"><Pagination page={3} pageCount={20} /></div>
		</InternationalizationProvider>
	)
}
```

Read the nearest scope from your own component with `useLocale()`,
`useDirection()`, and `useTranslator()`. The translator reads static catalog
entries and falls back to English, or to the key when no entry exists.

```tsx
import { Text, useLocale, useDirection, useTranslator } from '@octane-xplat/ui'

export function LocaleStatus() {
	const locale = useLocale()
	const direction = useDirection()
	const translate = useTranslator()
	return <Text>{locale} / {direction}: {translate('@astryx.selector.placeholder')}</Text>
}
```

Use `useAnnounce()` for an action's status message. Web keeps separate polite
and assertive live regions, clears messages after two seconds, and accepts an
empty string to clear a channel. Browser DOM checks confirm these regions,
not screen-reader speech. Native uses the platform announcement service;
politeness and explicit clearing are unavailable there and OS delivery remains
unqualified by these examples.

```tsx
import { Button, useAnnounce } from '@octane-xplat/ui'

export function SaveStatus() {
	const announce = useAnnounce()
	return <Button label="Save" clickAction={() => announce('Saved')} />
}
```

## How the integration works

These details explain which Lingui packages the setup uses.

The framework's localization contract is [Lingui](https://lingui.dev)'s
renderer-free half: `@lingui/core` plus the core Babel macros (`t`, `plural`,
`select`, `selectOrdinal`, `msg`/`defineMessage`). Macros compile to
`i18n._(...)` calls against a plain JavaScript catalog — nothing in the
pipeline touches a DOM or a native widget, so the same source string localizes
the web app and the NativeScript targets identically.

```ts
import { t, plural, select, selectOrdinal, msg, defineMessage } from '@lingui/core/macro'

export function labels(unread: number, role: string, place: number) {
	return {
		title: t`Inbox`,
		count: plural(unread, { one: '# message', other: '# messages' }),
		role: select(role, { admin: 'Administrator', other: 'Member' }),
		place: selectOrdinal(place, { one: '#st', two: '#nd', few: '#rd', other: '#th' }),
		save: msg`Save`,
		cancel: defineMessage({ message: 'Cancel' }),
	}
}
```

The JSX side of Lingui (`<Trans>`, `I18nProvider`, `useLingui` from
`@lingui/react`) is **not** used: components subscribe through
`useLingui()`/`useLocale()` from `@octane-xplat/lingui` instead.

```tsx
import { t } from '@lingui/core/macro'
import { useLingui } from '@octane-xplat/lingui'
import { Text } from '@octane-xplat/ui'

export function InboxTitle() {
	useLingui()

	return <Text>{t`Inbox`}</Text>
}
```
