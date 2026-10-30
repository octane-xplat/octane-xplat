# Localization and Intl ownership

Use for Lingui setup, subtree UI locale, announcements, and leaf-owned Intl initialization. Apply the [service selection rules](../services.md) before claiming a host capability.

## Localization — `@octane-xplat/lingui`

`initLingui({ catalogs, fallback, persist? })` once at startup;
`catalogsFromGlob(import.meta.glob('../locales/*/messages', { query: '?lingui' }))`
builds the loader map. `useLingui()` subscribes a component to locale changes
(macro output does not re-render on its own); `setLocale(locale)` switches.
With overlapping catalog loads, the latest registered locale choice wins; a
superseded load does not activate or save its locale. `.tsrx` extraction needs `tsrxExtractor` from `@octane-xplat/lingui/extractor`
in the app's `lingui.config.ts` — the default chain skips `.tsrx`. Core macros
only; no `<Trans>`/`I18nProvider`. Guide: docs/app/localization.md, decision #85.

```ts
// Startup .ts module: Vite loads the app's compiled catalog modules.
import { initLingui, catalogsFromGlob, setLocale, type CatalogModule } from '@octane-xplat/lingui'

await initLingui({
	catalogs: catalogsFromGlob(
		import.meta.glob<CatalogModule>('../locales/*/messages.ts', { query: '?lingui' }),
	),
	fallback: 'en',
})
await setLocale('fr')
```

```tsx
// Screen.tsx — hook calls belong in a compiled component file.
import { useLingui } from '@octane-xplat/lingui'
import { Text } from '@octane-xplat/ui'

export function PackedLabel() {
	const i18n = useLingui()
	return <Text>{i18n._('Packed')}</Text>
}
```

### Subtree UI locale and announcements

For Selector/Pagination built-in static strings, use the UI provider rather
than changing Lingui's global app locale. Nested scopes replace parent
catalogs; exact/parent overrides precede exact/parent messages, then English.
The supported catalog subset and host qualification limits are in
[localization](../../../../../docs/app/localization.md#change-ui-strings-in-one-part-of-a-screen).

```tsx
import { InternationalizationProvider, Selector, frFR } from '@octane-xplat/ui'
export function Region() {
	return <InternationalizationProvider locale="fr-FR" messages={{ 'fr-FR': frFR }}>
		<Selector label="Region" options={[]} />
	</InternationalizationProvider>
}
```

Read the canonical guide for scope-reader hooks and RTL host wiring.
`useAnnounce` exposes persistent web live regions;
empty text clears the requested channel. Native forwards nonempty text to the
platform service without politeness/clear semantics. Do not report DOM region
or handler checks as screen-reader delivery, or the iOS/Android no-op `useGridFocus`
as host keyboard qualification. AppKit's root `useGridFocus` now has a marked-cell
source implementation; its physical input and compiled-hook behavior remain
unqualified. See [AppKit custom cells](../../../../../docs/app/components.md#custom-grid-cell-focus-on-appkit).

```tsx
import { Button, useAnnounce } from '@octane-xplat/ui'
export function Status() {
	const announce = useAnnounce()
	return <Button label="Report saved" clickAction={() => announce('Saved')} />
}
```

### Leaf-owned Intl initialization

On iOS/Android, Lingui initializes only the Intl APIs required by its message
engine and comparison/list hooks. Additional data is selected through
`@octane-xplat/lingui/locales/<tag>` and `/time-zones/{all,golden}` in an app's
`.mobile.ts` module. See [native formatting data](../../../../../docs/app/localization.md#native-formatting-data).
Do not add an app-wide API bootstrap or use Lingui as a generic Intl provider.

```ts
// locale-data.mobile.ts, imported before initLingui
import '@octane-xplat/lingui/locales/de'
```

RollingText owns Segmenter and its prerequisites; Motion's internal text-morph
semantics do the same when consumed on mobile. Ordinary Motion imports do not
load that internal feature. Web and desktop retain built-ins. UI installs no
polyfills: test individual capabilities and retain documented fallbacks.
FormatJS's guarded entries mutate global Intl and may replace incomplete
implementations. Installing one leaf does not guarantee every Intl API exists.
