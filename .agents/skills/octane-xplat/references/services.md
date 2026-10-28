# Platform services

Shared platform capabilities live in `packages/platform/src/` as an
unsuffixed native default and optional `.web` browser override behind a package
barrel. Use `.mobile` or an OS suffix for narrower platform variants. App-specific navigation,
sheet, overlay, and demosweep seams live in `packages/app/src/platform/`.

## `storage` — key/value

`packages/platform/src/storage.ts` → `ApplicationSettings`;
`storage.web.ts` → `localStorage`. Import through `@octane-xplat/platform`.
Use it for nonsecret preferences and drafts. For session tokens, follow
[secure storage](../../../../docs/platform/platform-services.md#store-a-session-token);
never fall back to ordinary storage.

```ts
import { storage } from '@octane-xplat/platform'

storage.setString('bag', 'Carry-on')
const bag = storage.getString('bag')
```

## `random` — OS CSPRNG

`random.bytes(length)` returns a `Uint8Array` of secure random bytes;
`random.fill(view)` fills any `ArrayBufferView` in place. Web uses
`crypto.getRandomValues`, iOS/macOS `SecRandomCopyBytes`, Android
`java.security.SecureRandom`. `random.supported` is `false` on Windows —
no weaker fallback exists.

```ts
import { random } from '@octane-xplat/platform'

const nonce = random.bytes(16)
```

## SQLite transactions

Use the callback's handle for every awaited transaction operation. Main-handle
calls queue until it ends; awaiting them inside the callback would deadlock.
The callback handle expires afterward and rejects nesting and close. See the
[database guide](../../../../packages/sqlite/README.md).

```ts
await db.transaction(async (tx) => {
	await tx.execute('INSERT INTO items(name) VALUES (?)', ['Passport'])
})
```

## Hosted authentication

Use the [hosted auth client](../../../../packages/auth/README.md#hosted-sign-in-ceremonies)
for app-owned credential persistence and refresh. Await sign-out before treating
durable credentials as cleared; it retires pending login/refresh and orders
removal after earlier saves. A superseded login reports `cancelled`. Pending
authenticated requests cannot replay into a later session; a request still
loading credentials rejects when its session changes.

```ts
import { auth } from './auth'

await auth.signOut()
```

## Color scheme

`getColorScheme()` / `useColorScheme()` — `ColorScheme = 'light'|'dark'`.

```tsx
import { getColorScheme, useColorScheme, Text } from '@octane-xplat/ui'

console.log(getColorScheme())
export function Appearance() {
	const scheme = useColorScheme()
	return <Text>{scheme}</Text>
}
```

- Web: `matchMedia('(prefers-color-scheme: dark)')` + change listener.
- Native: `Application.systemAppearance()` (falls back during early boot —
  the primary window isn't guaranteed yet) + appearance-change events.
- Manual overrides use the shared theme preference APIs; see
  [theme across hosts](styling/root-boundaries.md) for a subscribed example.

## Animation — `useAnimation(initial, prop)`

Returns `AnimatedValue`: `{ value, ref(el), to(target,{duration}),
spring(target,{damping,stiffness}), stop() }`.

```tsx
import { useEffect } from 'octane'
import { useAnimation, Button, View } from '@octane-xplat/ui'

export function MovingCard() {
	const x = useAnimation(0, 'translateX')
	useEffect(() => () => x.stop(), [])
	return (
		<>
			<View ref={x.ref} />
			<Button
				clickAction={() => {
					void x.to(80, { duration: 300 })
				}}
			>
				Move
			</Button>
			<Button
				clickAction={() => {
					void x.spring(0, { damping: 14, stiffness: 120 })
				}}
			>
				Return
			</Button>
		</>
	)
}
```

- `ref` is a leaf `ref` prop target — forwards to the intrinsic's `ref`,
  the tween writes the view directly (no re-render per frame).
- Web: rAF tween writes `el.style`. Native: writes the NS view property.
- Qualify animation timing and cancellation on the actual target; see
  [animation and gestures](../../../../docs/app/animation-gestures.md) for the
  current contract rather than treating a historical harness assert as a guarantee.

## Gestures

Normalized payloads (primitives.md). Pan on web uses raw pointer listeners
(`pointermove` isn't delegated); native uses the
NS `pan` recognizer. Both map to `{x,y,dx,dy,vx,vy,state,target}`. Native
velocity comes from iOS `velocityInView` or Android `VelocityTracker`, in
dips per second.

```tsx
import { View, Text } from '@octane-xplat/ui'

export function GestureArea() {
	return (
		<View
			onPan={({ dx, dy, vx, vy, state }) => console.log(dx, dy, vx, vy, state)}
			onSwipe={({ direction }) => console.log(direction)}
		>
			<Text>Drag here</Text>
		</View>
	)
}
```

## Locate the owning package

Read [navigation](navigation.md) and [overlays](overlays.md) for UI ownership. App-owned twins include `nav`,
`sheet`, `overlay`, and `demosweep` (probe) under `packages/app`; capability
twins such as `storage`, connectivity, files, and system bars live under
`packages/platform`. In `packages/ui`, keep `stacks`, `route`, `anim`,
`colorScheme`, and component leaves aligned across targets.

## Adding a service

1. `packages/platform/src/foo.ts` (native default) +
   `foo.web.ts` (implementation or
   documented unsupported result) — same export names and public types.
   Silent no-ops are not a substitute for platform parity.
2. Export through the package barrel (deep specifiers don't
   extension-resolve).
3. If it touches a DOM global on web — fine, web leaf is DOM territory;
   the unsuffixed native implementation must stay DOM-free (xplat/no-dom-globals).

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

## Choose a capability and handle availability

For local document workflows, use the [files package guide](../../../../packages/files/README.md).
Its experimental AppKit leaf implements local reads, Documents writes and
save-panel export; do not infer sandbox, OS picker or packaged-app qualification
from its source or bridge tests. Picked grants are session-scoped.

```ts
import { files } from '@octane-xplat/files'

const file = await files.pick('text/plain')
if (file) console.log(await files.readText(file))
```

Read the [platform services guide](../../../../docs/platform/platform-services.md)
for current capabilities, permissions, and target behavior. Media, storage
engines, and plugin-backed services may live in leaf packages rather than the
platform barrel. Select the owning package from its guide and export map;
do not infer support from a similarly named browser API. For adding new
framework services, apply the dependency and lifecycle criteria in
[architecture](../../../docs/architecture.md).

### Subtree UI locale and announcements

For Selector/Pagination built-in static strings, use the UI provider rather
than changing Lingui's global app locale. Nested scopes replace parent
catalogs; exact/parent overrides precede exact/parent messages, then English.
The supported catalog subset and host qualification limits are in
[localization](../../../../docs/app/localization.md#change-ui-strings-in-one-part-of-a-screen).

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
as host keyboard qualification. AppKit currently has no root `useGridFocus` export.

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
`.mobile.ts` module. See [native formatting data](../../../../docs/app/localization.md#native-formatting-data).
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
