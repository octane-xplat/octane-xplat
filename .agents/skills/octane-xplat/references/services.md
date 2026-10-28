# Platform services

Shared platform capabilities live in `packages/platform/src/` as an
unsuffixed native default and optional `.web` browser override behind a package
barrel. Use `.mobile` or an OS suffix for narrower platform variants. App-specific navigation,
sheet, overlay, and demosweep seams live in `packages/app/src/platform/`.

## `storage` — key/value

`packages/platform/src/storage.ts` → `ApplicationSettings`;
`storage.web.ts` → `localStorage`; `storage.macos.ts` → AppKit host hooks
(`NSUserDefaults` in the stock host). Import through `@octane-xplat/platform`.
Use it for nonsecret preferences and drafts. For session tokens, follow
[secure storage](../../../../docs/platform/platform-services.md#store-a-session-token);
never fall back to ordinary storage.

```ts
import { storage } from '@octane-xplat/platform'

// Windows flush() cannot confirm a blocking durable commit and returns false.
storage.setString('bag', 'Carry-on')
const bag = storage.getString('bag')
```

AppKit retains missing-hook mutations as pending session intent; a native miss
never resurrects an acknowledged memory value. Pre-host writes can move to the
installed host, but previous-host state stays isolated. Reads never replay writes.
Flush returns false with undelivered mutations; synchronous native hooks
can confirm handoff without an explicit flush hook. Callers must handle false or
throw, and must not infer crash durability or native qualification. Inactive
subscriptions retire before cleanup on host/hook replacement and retry failed
registration. See [AppKit settings](../../../../docs/platform/platform-services.md#appkit-settings).

```ts
import { storage } from '@octane-xplat/platform'

export function saveDraft(text: string): boolean {
	try { storage.setString('draft', text); return storage.flush() }
	catch { return false }
}
```

AppKit `platformQueryStorage` is a separate best-effort cache policy: only a
complete get/set/remove bridge persists data, partial bridges use isolated memory,
and explicit purge surfaces native read/removal failure or an incomplete/lost
bridge. Restore catches read errors and falls through to the loader. Never
replace the bridge during account purge. Do not copy fallback cache into a newly
installed native store. The source and authored models do not prove
restart, native lifecycle, input, AX or installed consumers.

```ts
import type { QueryClient } from '@octane-xplat/ui/data'

// Pass the existing account client that owns persistent definitions.
export async function purgeAccount(account: QueryClient): Promise<boolean> {
	try { await account.dispose({ purgePersisted: true }); return true }
	catch { return false }
}
```

## AppKit secure-storage bridge and read failures

Keep session tokens in secureStorage, never ordinary storage. AppKit supported/
isAvailable validate a complete callable get/set/remove bridge; they do not
unlock Keychain or authorize the next operation. Capture the global binding and
all methods once per operation with their native receiver. Absent/incomplete/
throwing lookup rejects asynchronously with UnavailabilityError, without native
payloads. Only item-not-found returns null; missing/malformed dictionaries,
invalid status/value or native errors reject with fixed Keychain read failed.
Read dictionary status once, skip values on failure and require a native true
for write/remove success. Preserve empty strings and existing native namespace/
no-prompt/update policy. Never infer OS qualification from these source guards.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'
type Session = { status: 'restored'; token: string } | { status: 'missing' | 'unavailable' }
export async function restoreSession(): Promise<Session> {
	if (!secureStorage.supported || !(await secureStorage.isAvailable())) return { status: 'unavailable' }
	try {
		const token = await secureStorage.get('session-token')
		return token === null ? { status: 'missing' } : { status: 'restored', token }
	} catch { return { status: 'unavailable' } }
}
```

Six new VM/model cases (nine total) are UNRUN. The maintained Services example
catches cleanup rejection and prints only status. Native ObjC code is unchanged;
real class/method/dictionary/BOOL bridging, Keychain persistence/access, signing/
sandbox/locked-policy behavior and installed consumers remain unqualified. JS
try/catch cannot contain a native process abort; the CLI must load leaf metadata
first. See [session workflow](../../../../docs/platform/platform-services.md#store-a-session-token)
and [AppKit contract](../../../../packages/secure-storage/README.md#macos-appkit).

## AppKit network route updates

Use `connectivity.subscribe` for live UI and always release its independent
registration. Active readers use the monitor's latest sample; unobserved reads
retain the native bounded one-second first-sample probe. Route availability is
not internet reachability. An unknown/unsupported probe is not measured offline.
The AppKit environment adapter forwards callback samples instead of re-probing,
acquires both cleanup handles before its initial notification, and attempts both
teardowns after retiring callbacks, preserving the first cleanup failure. Initial
listener failure unwinds acquisition; later native listener errors are isolated.
No native runtime behavior is qualified by the source/fake-host models.

```ts
import { connectivity } from '@octane-xplat/platform'

export function watchRoute(onOnline: (online: boolean | undefined) => void) {
	return connectivity.subscribe(state => onOnline(state.supported === false ? undefined : state.online))
}
```

See [AppKit route updates](../../../../docs/platform/platform-services.md#appkit-route-updates).

## AppKit keep-awake ownership

Keep display-sleep requests with the reading/presentation owner, using
`useKeepAwake()` for independent generated tags or a named imperative tag with
explicit cleanup. Tags remain a set, not a reference count. AppKit availability
requires both native methods without creating a token. Each token retains its
creating process receiver and release method; failure retains it for explicit
retry. Hook callback/warning changes update current options without cycling the
request, and teardown retires callbacks before starting release even if optional
listener cleanup fails. OS release notifications remain web-only. None of this
proves physical sleep prevention or installed native behavior.

```ts
import { keepAwake } from '@octane-xplat/platform'

export async function finishReading(): Promise<boolean> {
	return keepAwake.deactivate('reading')
}
```

See [native AppKit request ownership](../../../../docs/platform/keep-awake.md#native-appkit-request-ownership)
and the idle manual fixture there.

## AppKit screen and lifecycle entries

Root and canonical screen/lifecycle/safe-area/breakpoints subpaths select AppKit
TSRX leaves, including existing explicit .ts/.tsrx spellings. The AppKit preset's
hook include is TSX/TSRX; keep hook calls out of the plain-TS barrel. Canonical
non-AppKit fallback paths retain extension resolution; do not hardwire the phone
leaf there and bypass browser/GTK selection. Native conditions must select both
runtime leaves and generated declarations. Packed source/type checks are authored,
not proof until run through Turbo after authorization.

```tsx
import { useAppState, useWindowSize } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function HostStatus() {
	const size = useWindowSize(), state = useAppState()
	return <Text>{`${state}: ${size.width}×${size.height}`}</Text>
}
```

AppKit window snapshots are stable, copied/frozen, validated content-point sizes;
missing/invalid sizes return zero and activity retains the existing active
fallback. Insets stay zero. Unknown activity uses the separate environment API.
Subscriptions are stable by host/method, preserve receivers and retire callbacks
before cleanup; host/method replacement requires another render to select the new
source. No global-property observation, secondary-window ownership or native
input/layout/effect/AX/memory/package qualification is implied. AppKit's Android-only
back hook is neutral and now returns void instead of a fake cleanup function:

```tsx
import { useBackHandler } from '@octane-xplat/platform/lifecycle'
import { Text } from '@octane-xplat/ui'

export function SharedScreen() {
	useBackHandler(() => false)
	return <Text>Screen</Text>
}
```

See [AppKit window and activity state](../../../../docs/platform/platform-services.md#read-appkit-window-and-activity-state).

## AppKit host event delivery

The stock native host captures listener membership for each activity/resize/link
broadcast, checks removal before invocation and isolates synchronous live errors.
Async work must handle its own rejection; the host does not await callbacks.
Each subscription wraps its callback with an independent active lease, so using
the same callback twice or removing/re-registering it cannot revive an old lease.
Resize captures one window payload before calling readers. These are JS ownership
policies; do not infer ObjC/OS delivery or native resource cleanup from the models.

```ts
import { onDeepLink } from '@octane-xplat/platform'

export function watchLinks(onURL: (url: string) => void): () => void {
	return onDeepLink(onURL)
}
```

Queued launch URLs still dispatch synchronously during subscription. Initial
handler failure retires that registration, restores the failed/unattempted URLs
before newer queued URLs, and rethrows the original error. Successfully delivered
URLs are not replayed. This does not serialize reentrant native events or guarantee
routing success; a repaired handler/new subscription or explicit consume owns
retry. See [incoming AppKit links](../../../../docs/platform/platform-services.md#handle-incoming-appkit-links).

```ts
import { onDeepLink } from '@octane-xplat/platform'

export function tryWatchLinks(onURL: (url: string) => void): (() => void) | null {
	try { return onDeepLink(onURL) }
	catch { return null }
}
```

## `random` — OS CSPRNG

`random.bytes(length)` returns a `Uint8Array` of secure random bytes;
`random.fill(view)` fills any `ArrayBufferView` in place. Web uses
`crypto.getRandomValues`, iOS/macOS `SecRandomCopyBytes`, Android
`java.security.SecureRandom`. Windows has a WinRT `CryptographicBuffer` leaf;
check `random.supported` for binding availability. A standalone x64 NativeScript
DLL check passed, including a large offset byte view; app-host integration
remains unqualified. No weaker fallback exists.

```ts
import { random } from '@octane-xplat/platform'

const nonce = random.bytes(16)
```

## AppKit locale and device imports

The platform root and canonical locale/device subpaths (including existing .ts
spellings) select dedicated AppKit runtime and generated-type leaves. Do not use
phone Device or add it to the renderer shim for these services. The locale is an
Intl formatting snapshot at module load: Intl.Locale preserves the full script/
extension tag while separating language and region. Unavailable/invalid Intl
reads/parsing fall back to en with an empty region. Device remains macos/Mac/Apple,
osVersion unknown; this adds no preferred-language enumeration, live OS-locale
subscription or hardware/version discovery. Lingui's own detector is unchanged.
Source/packed-consumer cases are authored but unrun; JSC/OS/installed behavior
remains unqualified. See [metadata contract](../../../../docs/platform/platform-services.md#read-appkit-locale-and-device-metadata).

```ts
import { locale, device } from '@octane-xplat/platform'
import { locale as directLocale } from '@octane-xplat/platform/locale'
import { device as directDevice } from '@octane-xplat/platform/device.ts'

const initialLanguage = locale.language
const region = locale.region
// Root and direct imports use the same AppKit snapshots.
const same = locale === directLocale && device === directDevice
```

## AppKit system-bar import boundary

Root and canonical/existing .ts system-bars imports select the same dedicated
AppKit object with both shared methods: setStatusBarStyle(light/dark) and
setColor(string), returning void. Both remain explicitly unsupported, emit only
a fixed warning and do not touch phone, window/title/toolbar/menu chrome. Console
failure cannot turn that no-op into an application failure. Keep mobile Color/
Application helpers out of this leaf; do not add them to the AppKit shim or
infer a desktop chrome feature from a callable facade. This import/shape repair
is not an accepted not-applicable decision for issue #62. Source/packed checks
remain unrun; native startup and installed declarations/resolution are pending.
See [system bars on AppKit](../../../../docs/platform/platform-services.md#system-bars-on-appkit).

```ts
import { systemBars } from '@octane-xplat/platform/system-bars'

systemBars.setStatusBarStyle('light') // AppKit: unsupported warning only.
systemBars.setColor('#171717') // No native chrome changes.
```

## Copy text on AppKit

AppKit `clipboard.canCopy` checks write access independently of read access.
Use `writeText` for copy and `readText` only when reading is part of the user's
action. The UI `copyText` helper delegates to the same writer. Operations resolve
false/null on missing or failing hosts; capability presence does not prove OS
pasteboard access. See [AppKit clipboard access](../../../../docs/app/keyboard-clipboard.md#appkit-clipboard-access).

```ts
import { clipboard } from '@octane-xplat/platform'

export async function copyMessage(text: string) {
	return clipboard.canCopy ? clipboard.writeText(text) : false
}
```

### Copy feedback ownership

The shared useClipboard hook owns feedback only while mounted. Held triggers
resolve false after unmount; already submitted writes retain their actual boolean
outcome without late state, announcements, onCopy or reset timers. A failed native
announcement cannot reject a successful copy. Retained route panes remain mounted;
this is not a route-visibility gate. Attempts remain independent, and consumer
onCopy errors still reject the caller's promise. AppKit hook/object-driver cases
are authored but unrun and do not qualify real NSPasteboard/effects/VoiceOver.
See [copy feedback lifetime](../../../../docs/app/keyboard-clipboard.md#keep-copy-feedback-with-its-screen).

```tsx
import { Pressable, Text, useClipboard } from '@octane-xplat/ui'

export function CopyAndClose(props: { text: string; close: () => void }) {
	const { copy } = useClipboard({ announce: 'Copied' })
	return <Pressable onPress={async () => {
		const pending = copy(props.text)
		props.close() // Parent unmounts this owner; pending still resolves.
		await pending
	}}><Text>Copy and close</Text></Pressable>
}
```

## Open system settings

Use `openSettings` from the root platform package for an explicit user action.
Check `supported` and await `isAvailable()` first. AppKit opens the installed
System Settings application; it does not navigate to app-specific permissions
or change them. A true return acknowledges the launch request only. Browsers
remain unsupported; AppKit runtime/packaged behavior is unqualified. See
[opening settings](../../../../docs/platform/platform-services.md#open-settings).

```ts
import { openSettings } from '@octane-xplat/platform'

export async function showSettings() {
	return openSettings.supported && await openSettings.isAvailable() && openSettings.open()
}
```

## Native connectivity ownership

Framework NativeScript connectivity subscribers share one core monitor. Keep
each returned teardown: repeated callbacks have independent registrations.
Failed initial callbacks/reads or monitor setup roll back their registration;
callbacks added during dispatch receive their initial state once and wait for
the next event. Do not bypass the facade to add another core monitor owner.

```ts
import { connectivity } from '@octane-xplat/platform'

const stop = connectivity.subscribe(state => console.log(state.type))
stop()
```
Windows supplies a WinRT state reader to that same monitor owner. Online state
comes from the connection level, independently of the transport label: local,
constrained and internet access allow work, including unknown transports. No
profile/None is known offline; unavailable or malformed projection returns
supported false. Do not label unknown adapters offline or invent VPN/Bluetooth
classification. The Windows environment export selects the native runtime and
declarations; query clients therefore use app suspension and connectivity by
default. Window visibility drives NativeScript suspension; individual window
keyboard activation is a different signal. Mocked ownership/composition and a
sampled native read do not qualify reconnect delivery, app lifecycle or query
refresh. See [query lifecycle](../../../../docs/app/data.md#the-shared-query-cache).

```ts
import { environment } from '@octane-xplat/platform/environment'

// undefined online permits work when connectivity cannot be established.
const online = environment.getSnapshot().online
```
## Windows keep-awake ownership

Windows uses one WinRT DisplayRequest for its requested-tag set. Calls are
serialized through the core UI-thread dispatcher because the SDK object is
apartment-bound. Background activation accepts a tag without claiming an active
inhibitor; suspend releases, resume retries remaining tags, and exit releases
all owners. Failed release retains ownership for retry; failed resume can retry
through activate with the existing tag. Keep the generated hook tag for
independent screens and always release explicit tags. Never infer physical sleep
prevention, packaged grants or real lifecycle from constructor projection and
mocked contracts. See [keep-awake limits](../../../../docs/platform/keep-awake.md).

```ts
import { keepAwake } from '@octane-xplat/platform'

await keepAwake.activate('presentation')
const held = await keepAwake.isActivated()
await keepAwake.deactivate('presentation')
```
## Windows audio import boundary

The Windows audio leaf keeps mobile backends out of native imports, but
createAudioPlayer still throws: no Windows playback backend is supplied.
Do not treat a clean import graph as playback support or call capabilities()
without first handling unsupported creation. See the
[audio package boundary](../../../../packages/audio/README.md).
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

## Read picked images before releasing them

`media.pickImages()` returns temporary `{ name, uri }` references, not data URLs.
Read uploads with `files.readBytes`; await each read before owner cleanup. In a
`try/finally`, returning an unawaited promise runs cleanup before the read finishes.
The [media guide](../../../../docs/platform/platform-services.md#pick-and-capture-images)
shows selection, cancellation and replacement ownership.

```ts
import { media } from '@octane-xplat/media'
import { files } from '@octane-xplat/files'

export async function readImages() {
	const images = await media.pickImages()
	try {
		const bytes: Uint8Array[] = []
		for (const image of images) bytes.push(await files.readBytes(image))
		return bytes
	} finally {
		for (const image of images) files.release(image)
	}
}
```

## Hosted authentication

Use the [hosted auth client](../../../../packages/auth/README.md#hosted-sign-in-ceremonies)
for app-owned credential persistence and refresh. Windows currently reports
`authSession.supported === false`; a desktop callback/activation adapter is still
required. Await sign-out before treating durable credentials as cleared; failed
deletion rejects with a sanitized error, so expose the failure and allow retry.
Server revocation is still attempted; it retires pending login/refresh and orders
removal after earlier saves. A superseded login reports `cancelled`. Pending
authenticated requests cannot replay into a later session; a request still
loading credentials rejects when its session changes.

```ts
import { auth } from './auth'

await auth.signOut()
```

## Windows app metadata

Windows appInfo reads Package.Current.Id lazily, with no mobile import or
app-config fallback. bundleId is Id.Name, version retains
Major.Minor.Build.Revision, and build is the literal Build field. Check supported
and nullable fields separately: identity can be available without a usable
version projection. Unpackaged/missing hosts are unsupported. Early failure is
not cached; do not turn the standalone unavailable-host check into packaged
metadata qualification.

```ts
import { appInfo } from '@octane-xplat/platform'

const versionLabel = appInfo.supported ? appInfo.version ?? 'Unknown version' : 'Unavailable'
```

## Windows file I/O boundary

The experimental [Windows file leaf](../../../../packages/files/README.md#experimental-native-windows-file-io)
provides text/binary I/O candidates without importing mobile picker plugins.
Writes are temporary copies, not durable documents; release owns only those
copies. Native Windows picking rejects as unavailable and export returns
`unavailable`. A custom FileInput picker is app-owned. Standalone x64 NativeScript
text/bounded-byte reads and writes, unique names and owned-only release passed
against a task-owned folder; packaged TemporaryFolder access, app integration
and cancellation remain unqualified. Use `OpenSequentialReadAsync` with
`IInputStream.ReadAsync`, and `OpenAsync().GetOutputStreamAt(0)` for writes:
alpha.144 omits inherited methods on `OpenReadAsync` results, and the standalone
`DataReader.LoadAsync` check crashed. Input-stream `Close` is also absent, so
reclamation depends on the runtime releasing its proxy. Do not infer
attachment-dialog support from the component export.

The existing Windows test project uses App SDK 1.6.250205002. The newer
Microsoft.Windows.Storage.Pickers API requires 1.8; changing the namespace alone
does not supply a usable picker. The older Windows.Storage.Pickers API requires
IInitializeWithWindow bound to the actual owner HWND. Qualify that host bridge
before enabling pick/export. See the [picker prerequisites](../../../docs/parity/windows-support-progress.md#windows-picker-host-prerequisite-review).

```ts
import { files } from '@octane-xplat/files'

const copy = await files.writeText('report.txt', 'Packing list')
try {
  const bytes = await files.readBytes(copy, { maxBytes: 1024 })
} finally {
  files.release(copy)
}
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

For moves and resizes caused by layout, use the motion package's `layout`
prop on web, iOS, Android, and the experimental macOS host. A nested
`layout="position"` host keeps its size while its parent scales. Browser
overflow scroll offsets are detected automatically; do not add an unsupported
`layoutScroll` prop. See [layout animations](../../../../docs/app/animation-gestures.md#layout-animations).

```tsx
import { motion } from '@octane-xplat/motion'

export function ResizingCard({ wide }: { wide: boolean }) {
	return <motion.View layout style={{ width: wide ? 240 : 120 }}>
		<motion.View layout="position" style={{ width: 50, height: 50 }} />
	</motion.View>
}
```

For moving containers, `layoutRoot` snaps the container and keeps child layout
animations relative to it. `layoutAnchor={{ x: 1, y: 1 }}` attaches a child to its
parent's end corner; `false` disables relative attachment.

```tsx
<motion.View layoutRoot>
  <motion.View layout="position" layoutAnchor={{ x: 1, y: 1 }} />
</motion.View>
```

Numeric corner radii and shadows receive scale correction on projected hosts.
Prefer uniform resizing when native corner/blur accuracy matters; nonuniform
native correction is approximate. Multiple web or Mason core shadows are not corrected.

```tsx
<motion.View layout style={{ borderRadius: 20, width: expanded ? 300 : 150, height: expanded ? 240 : 120 }} />
```

Combine `drag` with `layout` when content can move during a drag. It rebases the
drag origin and takes over interrupted layout animation without a position jump.
Numeric bounds still apply to translation channels; this does not add `Reorder`.

```tsx
<motion.View layout drag="x" dragMomentum={false} style={{ marginLeft: shifted ? 100 : 0 }} />
```

For shared elements, give matching hosts a `layoutId` inside a distinct
`LayoutGroup id` per independent control. A same-commit replacement animates
without retaining the old host, using current ancestor scroll offsets; use `Presence` to retain both contents for a
crossfade. Keep Presence boundaries mounted through the transition. See
[shared handoffs and reversals](../../../../docs/app/animation-gestures.md#move-an-element-between-components).

```tsx
import { LayoutGroup, Presence, motion } from '@octane-xplat/motion'
import { View } from '@octane-xplat/ui'

export function SharedCard({ expanded }: { expanded: boolean }) {
	return <LayoutGroup id="card">
		<View style={{ position: 'relative', height: 160 }}>
			<Presence present={!expanded} style={{ position: 'absolute', left: 0, top: 0 }}>
				<motion.View layoutId="surface" style={{ width: 120, height: 80 }} />
			</Presence>
			<Presence present={expanded} style={{ position: 'absolute', left: 0, top: 0 }}>
				<motion.View layoutId="surface" style={{ width: 240, height: 160 }} />
			</Presence>
		</View>
	</LayoutGroup>
}
```

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
as host keyboard qualification. AppKit's root `useGridFocus` now has a marked-cell
source implementation; its physical input and compiled-hook behavior remain
unqualified. See [AppKit custom cells](../../../../docs/app/components.md#custom-grid-cell-focus-on-appkit).

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

### Long-form speech playback

Use the audio leaf for speech speed and player gain. Mute preserves the stored
volume; speed is clamped to 0.5–3 and volume to 0–1. Nonfinite settings reject.
See [playback speed and volume](../../../../docs/platform/media-services.md#playback-speed-and-volume)
for lifecycle and target qualification; changing a native property is not
physical output evidence.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'
const player = createAudioPlayer()
await player.setPlaybackRate(1.5)
await player.setVolume(0.4)
await player.setMuted(true)
player.dispose()
```

For generated speech chunks, retain stable IDs and update future items instead
of replacing the playing queue. Incomplete exhaustion is `waiting`; explicit
pause cancels append auto-resume. Do not infer background JavaScript scheduling
from audio capability flags. See [growing queues](../../../../docs/platform/media-services.md#add-items-without-restarting-the-current-track).

```ts
import { createAudioPlayer } from '@octane-xplat/audio'
const player = createAudioPlayer()
const first = { id: '1', source: 'https://example.com/1.mp3' }
await player.setQueue([first], 0, { complete: false })
await player.updateQueue([first, { id: '2', source: 'https://example.com/2.mp3' }], { complete: true })
player.dispose()
```

### Incremental HTTP

NativeScript's default fetch buffers the response. Use the network leaf for
incremental bytes; it does not replace global fetch or provide a complete
Fetch-compatible client adapter. Handle cancellation and the documented
request/target subset in the [network guide](../../../../packages/network/README.md).

```ts
import { requestStream } from '@octane-xplat/network'
const response = await requestStream('https://example.com/api/events')
const reader = response.body.getReader()
try { console.log((await reader.read()).value?.byteLength) }
finally { await reader.cancel(); reader.releaseLock() }
```

For the tested targets and remaining physical acceptance gates, see the
[Still-shaped readiness record](../../../docs/notes/still-native-readiness.md).


For combined service qualification, use the
[packed listening/settings fixture](../../../../tools/native-readiness/README.md).
It installs tarballs outside the workspace and typechecks before running.
Synthetic auth callbacks and silent foreground media do not establish real
provider callbacks, audible output, or background execution. Keep those gates
separate when interpreting a passing consumer run.

```sh
pnpm exec turbo run check:native-readiness --filter=// -- --target ios --device OWNED_UDID
```

AppKit FileInput now owns picking and saving as one busy operation. Async results
use current validation/values/blocking state; detached completions are ignored.
Clear/removal share the same guard, and row removal follows URI after reorder.
changeAction failure reports validation status without rolling back parent-owned
value. Custom picker promises are ignored after detach, not cancelled; ownership
is per control. Native panels/ref lifecycle/VoiceOver and drag/drop remain
unqualified; local file-drop source ownership is described below. See the [files contract](../../../../packages/files/README.md#appkit-attachment-picker-lifetime).

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments(props: {
	value: FileInputFile[]
	change(value: FileInputFile | FileInputFile[] | null): void
	save(value: FileInputFile | FileInputFile[] | null): Promise<void>
}) {
	return <FileInput value={props.value} onChange={props.change} changeAction={props.save} isMultiple />
}
```


Default AppKit FileInput picks now receive finite filename MIME hints and
best-effort Foundation size metadata before validation. Custom pickers retain
their supplied metadata; files.pick's FileRef contract is unchanged. Unknown MIME
hints stay absent and missing sizes skip maxSize. Treat these as metadata, never
content verification or a memory bound; use readBytes maxBytes when reading.
Native metadata/grants/picker behavior remains unqualified.

```ts
import { files } from '@octane-xplat/files'

const file = await files.pick('image/*')
if (file) await files.readBytes(file, { maxBytes: 5000000 })
```


AppKit FileInput now attaches a private destination lease in both presentations to its
existing wrapper when the matching renderer is present. Copy-delivered local URLs
must pass regular-file inspection, then reuse the picker/save token and current
validation/parent feedback. Loading/read-only/disabled state, an active
operation and detach decline delivery. Ref/node teardown releases ownership and
other registered drag types are preserved.

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments(props: { value: FileInputFile[]; change(value: FileInputFile | FileInputFile[] | null): void }) {
	return <FileInput label="Attachments" mode="dropzone" value={props.value} onChange={props.change}
		isMultiple accept=".txt,.pdf" maxSize={5000000} maxFiles={3} />
}
```

Do not equate native drop acceptance with successful validation/save or a durable
sandbox grant. Directories, symlinks, uninspectable/promised/non-file items are
excluded. MIME hints remain filename-based; missing sizes skip maxSize. Nine
source cases and the maintained fixture remain unrun. Native ABI/registration,
hit routing/drag, grants, hover/AX/focus and packaging require qualification;
custom hover/autoscroll and promised-file support remain gaps. See [AppKit file drops](../../../../packages/files/README.md#appkit-local-file-drops).

## AppKit in-app browser

webBrowser from @octane-xplat/web-browser now has an owned WebKit/NSWindow source
path. Add the package to the app and rebuild for packaged Swift class discovery;
supported checks the accepts/create bridge methods, and missing/invalid/failed
opens cancel without an external fallback. Foundation validates HTTP(S)/host,
so packaged JavaScriptCore does not need a JS URL global. The macOS external
opener behavior is a hard cutover; use platform.openUrl explicitly for that flow.
Opened means presented, not loaded. Current native chrome owns history, reload/
stop/address/close; replacement/dismiss/user close retire views, KVO and delegates.
Generic failure text omits NSError/URL details. The app's default WebKit data
store is used; there is no app-shell JS bridge or Safari-profile promise.

```ts
import { webBrowser } from '@octane-xplat/web-browser'
export async function openHelp(address: string) {
	return webBrowser.openBrowser(address)
}
export const closeHelp = () => webBrowser.dismissBrowser()
```

Native actions require the main UI thread. Mobile style/title/collapsing options
and Android warmup hints stay platform specific. Downloads,
HTTP-auth/permission UI and OAuth interception are not implemented. Page alert/
confirm/prompt sheets identify the requesting website; cancelled prompts return
null and accepted empty input stays empty. Close/replacement/navigation/process
termination retire outstanding sheets. Native dialog/focus/IME behavior is unrun. Page file controls have website-labeled
NSOpenPanel source paths respecting multiple/directory parameters, with one-shot
cancellation on owner teardown/navigation/process termination. Public WebKit
parameters expose no accepted types; do not promise native HTML accept filtering.
File delivery, directory enumeration, sandbox grants and actual uploads are unrun.
Five JS ownership cases and a manual harness fixture are authored, all unrun.
Swift/class discovery, native UI/navigation/error/redirect/popup/cookie behavior,
ATS/sandbox, threading/KVO/cleanup/AX and clean packaging remain unqualified.
AppKit harness dependency/lock link and scoped package task are source changes;
no dependency install or native qualification ran. See the package README and
[AppKit navigation guide](../../../../docs/app/navigation.md#open-a-page-inside-an-appkit-browser-window).


## AppKit local-notification permission reads

Native AppKit status reads use `getStatus`, not the authorization-request
selector. Rebuild the host after upgrading; absent/stale metadata or no bundle
identity reports unsupported without a prompt fallback. Import the leaf before
using its shared permission owner. Request only after an explicit app action;
`undetermined` can ask, denied cannot. Grant/provisional state does not prove
presentation. The hosted macOS webview bridge remains ensure-only and can prompt
on reads; do not apply this native guarantee to that backend.

```ts
import { notifications } from '@octane-xplat/notifications'
const status = await notifications.getPermissions()
// An explicit button can separately call notifications.requestPermissions().
```

The native read/request/thread/metadata cases are authored, unrun. Real OS
prompts, relaunch/revocation, bridge callbacks, foreground/background delivery,
packaging and signing remain unqualified in #62.


## Native AppKit sharing ownership

Use the runtime `@octane-xplat/share` dependency and rebuild for its package-owned
Objective-C bridge. The native leaf no longer uses the private harness share seam.
Call directly from an input action, retain files until completion, and branch on
outcomes. Subjects apply to text/URL services; file options remain Android-only.
A visible key/main window without an attached sheet is required. Overlap is
unavailable, not a replacement. Picker/service cancellation and presenter teardown
settle cancelled; didShareItems alone settles shared, which is not receipt proof.
Metadata/presenter/service failures are unavailable; invalid file kinds reject.

```ts
import { share } from '@octane-xplat/share'
const outcome = await share.file('file:///tmp/trip%20notes.txt')
```

Local file URLs support empty/localhost authority and decode once. Do not pass
content://, remote file authorities, raw query/fragment syntax or NUL; use share.url
for non-file absolute URLs. Missing callbacks stay pending until window/app
teardown; no timeout fabricates success. Screen teardown alone cannot cancel the
native service. The separate hosted webview host still reports launch as shared.
Eight facade cases, intercepted picker and metadata/consumer fixtures are unrun;
AppKit event-context requirements (including mouse-down), native callbacks, OS UI,
actual transfer, VoiceOver and packaged consumers remain unqualified in #62.


## AppKit authentication presenter lifetime

Native authSession snapshots its callback scheme and ephemeral preference and
anchors to its initiating visible key/main window without an attached sheet.
It never falls back to the first arbitrary app window. Only its own session can
query that anchor; window close/app termination retires JS ownership and asks the
native session to cancel before settling cancel. Native setup failures clean up
and cancel acquired sessions; late callbacks cannot release a replacement.
Screen unmount/hiding alone is not window close. Call from the app's normal UI
thread; actual native thread behavior is unqualified.

```ts
import { authSession } from '@octane-xplat/platform'
const result = await authSession.open('https://example.com/authorize', {
	callbackScheme: 'myapp', prefersEphemeralSession: true,
})
```

Lifecycle-observer setup must succeed before starting. Removal errors retire
callbacks but can retain native observers. A session with no native completion
stays pending until cancellation or presenter/app teardown; no timeout invents a
result. The backend still owns destination/state/PKCE/nonce/token verification;
never log callback URLs or credentials. Eleven model cases and the manual
cancellation fixture are authored, unrun. OS browser/callback/cancellation,
window/observer/HMR lifetime, VoiceOver and installed consumers remain unqualified.
See [AppKit sign-in ownership](../../../../docs/platform/platform-services.md#appkit-sign-in-window-ownership).


## AppKit Sign in with Apple ownership

Apple authorization is a separate controller from authSession. The native leaf
captures scopes/nonce, retains its initiating visible key/main window without an
attached sheet and accepts anchor/results only from its own controller and
provider/delegate wrappers. Independent class caches allow an anchor-registration
failure to retry. Close/termination observers must attach before constructing UI;
terminal paths retire JS ownership and owned native delegate/provider references
before optional cancel (macOS 13+). Late/foreign callbacks do not decode credentials
or release replacement attempts. A conversion already underway can reenter teardown;
its result is ignored. Backend identity-token/audience/nonce verification is still
required before establishing an app session.

```ts
import { appleAuth } from '@octane-xplat/auth'
export async function beginAppleSignIn(backendAttemptNonce: string) {
	return appleAuth.signIn({ scopes: ['email'], nonce: backendAttemptNonce })
}
```

Screen unmount/hiding does not cancel the controller. Missing or throwing cancel
may leave native UI open; failed observer removal can retain inert native observers.
No timeout fabricates a result. Eleven Apple model cases and an idle official-button
fixture are authored, unrun; native registration/wrapper/thread/UI/callback/window/
HMR/credential-state/nonce, signing/provisioning/entitlement, VoiceOver and consumer
qualification remain open in #62. See [Apple presenter ownership](../../../../packages/auth/README.md#keep-apple-sign-in-with-its-initiating-window).


## AppKit provider-button actions

Native Apple/Google buttons own one pending action per mounted instance. Disabled
and repeat pending presses are ignored; onPress remains a notification (return
values do not gate). Recheck currently committed owner/disabled props after the
hook. Queued state may commit after provider work has begun. Deliver to the latest
mounted onResult even if props become disabled, and drop results after unmount or
owner replacement. This does not cancel already-started provider work. Apple
style/type attachment changes keep the component's pending result ownership.

```tsx
import { GoogleSignInButton } from '@octane-xplat/auth'
export function Entry() {
	return <GoogleSignInButton onResult={(result) => console.log(result.status)} />
}
```

Google now uses the existing native NSButton intrinsic (text/isEnabled/onPress),
not an official Google SDK button. Renderer isEnabled updates native state and
protects disabled/retired handler dispatch. Theme/variant remain unimplemented;
no pixel or OS input/AX parity is claimed. Unexpected provider failure yields a
generic owned error; consumer callbacks keep their own errors. No busy indicator
is added. Six action-model/three renderer cases and a manual fixture are unrun;
hook timing, actual native action/focus/Tab/keyboard/AX, attachment/layout/lifetime
and installed consumers remain open. See [button ownership](../../../../packages/auth/README.md#appkit-button-action-ownership).

## Windows secure credentials

The experimental native [secure-storage leaf](../../../../packages/secure-storage/README.md#experimental-native-windows)
uses PasswordVault and requires package identity. Package family scopes resource
names; this is not a security barrier from other desktop apps. Credential Locker
may roam entries under Windows/account policy. No plaintext or mobile fallback
is allowed. Missing keys return null; other reads reject with a sanitized error;
writes/removals return false on failure. Empty strings are encoded internally.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

async function saveToken(token: string) {
  if (!secureStorage.supported || !(await secureStorage.isAvailable())) return false
  return secureStorage.set('session-token', token)
}
```

Standalone x64 vault operations passed using task namespaces, with all created
entries removed and confirmed missing. Real packaged identity, cross-launch
persistence, roaming/access policies and full app integration remain unqualified.
The alpha.144 projection exposes missing-item HRESULT 0x80070490 only as a
message suffix; preserve that distinction and never return null for every native
exception or forward native error text. This does not enable Windows hosted auth.
