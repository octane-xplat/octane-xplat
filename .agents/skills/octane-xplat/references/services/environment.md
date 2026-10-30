# Screen, lifecycle, and host environment

Use for screen/lifecycle events, locale/device metadata, system bars, keep-awake, appearance, and settings. Inspect availability and qualify the actual host; see the [service index](../services.md).

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

See [native AppKit request ownership](../../../../../docs/platform/keep-awake.md#native-appkit-request-ownership)
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

See [AppKit window and activity state](../../../../../docs/platform/platform-services.md#read-appkit-window-and-activity-state).

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
retry. See [incoming AppKit links](../../../../../docs/platform/platform-services.md#handle-incoming-appkit-links).

```ts
import { onDeepLink } from '@octane-xplat/platform'

export function tryWatchLinks(onURL: (url: string) => void): (() => void) | null {
	try { return onDeepLink(onURL) }
	catch { return null }
}
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
Source/packed-consumer cases require separate verification; JSC/OS/installed behavior
requires separate target qualification. See [metadata contract](../../../../../docs/platform/platform-services.md#read-appkit-locale-and-device-metadata).

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
require separate verification; native startup and installed declarations/resolution are pending.
See [system bars on AppKit](../../../../../docs/platform/platform-services.md#system-bars-on-appkit).

```ts
import { systemBars } from '@octane-xplat/platform/system-bars'

systemBars.setStatusBarStyle('light') // AppKit: unsupported warning only.
systemBars.setColor('#171717') // No native chrome changes.
```

## Open system settings

Use `openSettings` from the root platform package for an explicit user action.
Check `supported` and await `isAvailable()` first. AppKit opens the installed
System Settings application; it does not navigate to app-specific permissions
or change them. A true return acknowledges the launch request only. Browsers
remain unsupported; AppKit runtime/packaged behavior is unqualified. See
[opening settings](../../../../../docs/platform/platform-services.md#open-settings).

```ts
import { openSettings } from '@octane-xplat/platform'

export async function showSettings() {
	return openSettings.supported && await openSettings.isAvailable() && openSettings.open()
}
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
mocked contracts. See [keep-awake limits](../../../../../docs/platform/keep-awake.md).

```ts
import { keepAwake } from '@octane-xplat/platform'

await keepAwake.activate('presentation')
const held = await keepAwake.isActivated()
await keepAwake.deactivate('presentation')
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

## Accessible screens

Use the [accessible-screen guide](../../../../../docs/app/accessibility.md) for a
complete named form, validation/focus/status composition and a bounded manual
journey. Prefer field label/description/status and typed focus handles; keep a
visible status alongside announcements. Native urgency/clearing/state mappings
are narrower than ARIA, and native modal focus restoration requires separate target qualification.
Record actual VoiceOver/TalkBack/browser delivery separately from DOM assertions
or handler dispatch. Do not infer text scaling from a shared font-size value.

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
  [theme across hosts](../styling/root-boundaries.md) for a subscribed example.
