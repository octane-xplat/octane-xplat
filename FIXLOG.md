# Fixlog

Selected bug fixes, newest release first. Features and breaking changes appear
in the [changelog](CHANGELOG.md).

Earlier fixes remain in the original [combined changelog](CHANGELOG.md) and
[tsrx-typegen changelog](packages/tsrx-typegen/CHANGELOG.md).

## [Octane Xplat 0.19.0](https://github.com/octane-xplat/octane-xplat/releases/tag/v0.19.0) - 2026-10-31

### Keep Apple sign-in attached to its macOS window

Native AppKit Apple sign-in now keeps its initiating window and request options,
retires the attempt when that window closes and guards stale controller results.
A partial native anchor-registration failure can retry. Native cancellation is
requested when available (macOS 13+); actual consent and callback behavior remain
unqualified.

```ts
import { appleAuth } from '@octane-xplat/auth'
const result = await appleAuth.signIn({ scopes: ['email'] })
```

See [Apple presenter ownership](https://github.com/octane-xplat/octane-xplat/tree/main/packages/auth#keep-apple-sign-in-with-its-initiating-window).

### Keep macOS sign-in button results with their screen

Native AppKit sign-in buttons now ignore repeated pending activation and suppress
results after unmount. Mounted buttons use current callbacks. Google's trigger
uses NSButton actions, and the renderer now applies the documented isEnabled prop
to native buttons. Actual native input and lifecycle qualification remains pending.

```tsx
import { GoogleSignInButton } from '@octane-xplat/auth'
export function Entry() {
	return <GoogleSignInButton onResult={(result) => console.log(result.status)} />
}
```

See [AppKit button ownership](https://github.com/octane-xplat/octane-xplat/tree/main/packages/auth#appkit-button-action-ownership).

### Keep macOS sign-in attached to its starting window

Native AppKit authentication sessions now keep the initiating window as their
presentation anchor and cancel when that window closes. Callback options are
captured per attempt, so later mutation cannot change the expected scheme.
Actual system-browser and callback behavior remains unqualified.

```ts
import { authSession } from '@octane-xplat/platform'
const result = await authSession.open('https://example.com/authorize', {
	callbackScheme: 'myapp',
})
```

See [AppKit sign-in ownership](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#appkit-sign-in-window-ownership).

### Fix AppKit clipboard capability and failures

AppKit `clipboard.canCopy` now recognizes hosts that can write without reading.
Missing or failing clipboard operations resolve false for writes and null for
reads. The UI `copyText` helper uses the same platform writer.

### Keep native macOS network subscriptions independent

AppKit route updates now reach other subscribers when one listener throws.
Monitored reads reuse the latest sample, and failed native cleanup cannot keep
a retired monitor active. Environment subscriptions release both network and
activity listeners on failure or disposal. The native Services status now stays
subscribed for its screen lifetime.

```ts
import { connectivity } from '@octane-xplat/platform'

export function watchRoute(show: (online: boolean | undefined) => void) {
	return connectivity.subscribe(state => show(state.supported === false ? undefined : state.online))
}
// Release the returned subscription when its screen ends.
```

An available route does not guarantee internet access. Native disconnect/reconnect,
activity delivery and installed-app qualification remain pending. See
[AppKit route updates](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#appkit-route-updates).

### AppKit dropdown requests use current state

AppKit dropdown toggles now use the latest local open intent and current parent
props. Trigger, arrow and dismissal requests share a guard against nested or
detached actions, including during button-ref replacement. Loading blocks new
opening unless the trigger is interruptible; an open menu remains visible.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions({ saving }: { saving: boolean }) {
	return <DropdownMenu button={{ label: 'Actions', isLoading: saving }}>
		<DropdownMenuItem label="Archive" />
	</DropdownMenu>
}
```

Native input, popup timing, focus and accessibility remain unqualified. See the
[AppKit menu contract](https://octane-xplat.goddardai.org/menus#appkit-menu-host-state).

### Fix AppKit GridList stack direction

AppKit `GridList` now places rows vertically with `layout="stack"`. Previously,
full-width rows stayed in a horizontal flex container.

### Fix AppKit image load lifecycle

AppKit images now release pending loads when their last view leaves, share
concurrent requests, and reject HTTP error payloads. Remote processing is queued
through AppKit's main operation queue. Cancelled completions cannot replace a
newer image or populate a later request's cache.

Image leaves also preserve declared parent-layout props, composed class names
and style forms. The optional image package reuses the core AppKit leaf; its
engine/cache APIs remain unimplemented. Runtime behavior remains unqualified.
See [AppKit image loading](https://octane-xplat.goddardai.org/app/components#image-loading-on-appkit).

### Keep macOS display-sleep requests with their owners

AppKit keep-awake tokens now retain the process object and release method that
created them. Partial bridges report unavailable, and failed releases remain
retryable. Updating a mounted hook's callback or cleanup-warning option no
longer releases and reacquires its request.

```tsx
import { useKeepAwake } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function ReadingScreen(props: { quiet: boolean }) {
	useKeepAwake(undefined, { suppressDeactivateWarnings: props.quiet })
	return <Text>Reading</Text>
}
```

See [native AppKit request ownership](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/keep-awake.md#native-appkit-request-ownership).
Physical sleep prevention, native bridge cleanup and installed-app qualification
remain pending. Explicit tags retain their existing set semantics.

### Distinguish missing sessions from AppKit storage failures

AppKit secure storage now rejects missing or malformed native read responses
instead of treating them as a missing token. Availability checks require the
complete native bridge, and operations capture it once so lookup failures do
not expose native error text. Writes and removals report success only for a
native true result.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'
export async function sessionStatus(): Promise<'present' | 'missing' | 'unavailable'> {
  if (!secureStorage.supported || !(await secureStorage.isAvailable())) return 'unavailable'
  try { return (await secureStorage.get('session-token')) === null ? 'missing' : 'present' }
  catch { return 'unavailable' } // Keep tokens and native errors private.
}
```

Native Keychain and installed-app qualification for this change remain pending.
See [AppKit secure storage](https://github.com/octane-xplat/octane-xplat/blob/main/packages/secure-storage/README.md#macos-appkit).

### Read consistent macOS locale metadata

Native AppKit root and direct locale/device imports now share dedicated leaves,
avoiding the phone Device dependency. Script-qualified tags such as `zh-Hant-TW`
now report region `TW` instead of `Hant`. Invalid or unavailable Intl metadata
falls back to English with no region. Values are snapshots taken when modules
load; native JavaScriptCore and installed-consumer qualification remain pending.

```ts
import { locale, device } from '@octane-xplat/platform'

const language = locale.language
const region = locale.region
const platform = device.os
```

See [AppKit locale metadata](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#read-appkit-locale-and-device-metadata).

### AppKit nested primary actions

AppKit primary-click recognizers now check native hit ancestry so nested renderer
controls can reject an ancestor card or picker-trigger click. Decorative text
and images remain part of the parent action. Disabled semantic controls also
form boundaries. Physical mouse delivery and native delegate registration remain
unqualified; see the [renderer contract](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer#nested-primary-clicks).

### Read macOS notification permission without prompting

Native macOS notification permission reads now inspect authorization status
without requesting access. Rebuild the native host after updating; older native
metadata reports unsupported rather than falling back to a prompt. Actual OS
permission and delivery qualification remains pending.

```ts
import { notifications } from '@octane-xplat/notifications'

const status = await notifications.getPermissions()
```

See [local notifications](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/local-notifications.md).

### AppKit popovers preserve their declaring context

The public macOS Popover, custom pickers and expanded token editors now share
one anchored window-layer implementation. Their content keeps declaring
providers and live updates, rather than rendering inline or in a separate root.
Placement, alignment, offset and controlled dismissal use current props.

```tsx
<Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)}
	placement="bottom" alignment="center" offset={12}>
	<Text>Details for the current selection</Text>
</Popover>
```

Use a stable mounted anchor ref and the matching native renderer. Native input,
focus, geometry, accessibility and installed consumers remain unqualified. See
[native custom popovers](https://octane-xplat.goddardai.org/app/search-selection#anchor-appkit-custom-popovers).

### Correct AppKit scrolling coordinates

AppKit scroll offsets and measurements now read the native view's `flipped`
property. ScrollableArea, VirtualList and chat share clamped top-based seeks,
retain omitted axes and fall back to an immediate seek when animation is
unavailable. Short content stays at offset zero.

The renderer uses the same coordinate property for initial scrolling, pan Y,
anchored layers and gradients. Native interaction, placement, pixels and
packaged behavior still need qualification.

See [macOS scrolling](https://octane-xplat.goddardai.org/app/primitives#macos-scrolling-and-refresh).

### Keep macOS scroll geometry updates owned and retryable

AppKit scroll geometry now releases partial and replaced observers, ignores
retired callbacks and permits later frame updates after a layout or positioning
failure. Invalid dimensions do not reach native scrolling, and a failed initial
position can be retried. Native notification, resize/scroll and installed-consumer
qualification remains pending; pull-to-refresh is still unsupported.

```tsx
import { ScrollableArea, Text } from '@octane-xplat/ui'

export function Notes({ height }: { height: number }) {
	return <ScrollableArea height={height}><Text>Trip notes</Text></ScrollableArea>
}
```

See [AppKit scrolling](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/primitives.md#macos-scrolling-and-refresh).

### Wait for native macOS sharing to complete

Native AppKit sharing now uses the package's compiled picker bridge, accepts
local file URLs and forwards text subjects and link titles. Rebuild the native
host after updating. A picker opening no longer counts as shared; outcomes wait
for completion or cancellation. Keep shared files alive until the promise settles.
Actual OS picker and transfer qualification remains pending.

```ts
import { share } from '@octane-xplat/share'
const outcome = await share.file('file:///tmp/trip%20notes.txt')
```

See [native AppKit sharing](https://github.com/octane-xplat/octane-xplat/tree/main/packages/share#native-appkit-sharing).

### Keep AppKit settings and saved-query removal consistent

Native macOS settings now retain pending writes and removals when a host hook
is missing, and report an unconfirmed flush until those changes are handed
off. Native missing values no longer revive old fallback data. Inactive
subscriptions follow the current host and retry failed registration.

```ts
import { storage } from '@octane-xplat/platform'

export function saveDraft(text: string): boolean {
	try { storage.setString('draft', text); return storage.flush() }
	catch { return false }
}
```

AppKit query restore and writes remain best effort, while explicit purge
now reports native read/removal failures. Partial bridges use isolated
session memory. See [AppKit settings](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#appkit-settings)
and [query persistence](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/data.md#persisting-records).
Native restart, lifecycle and installed-app qualification remain pending.

### Import shared system-bar helpers on macOS

AppKit root and direct system-bar imports now expose both shared methods without
loading mobile Color helpers. The root previously omitted `setStatusBarStyle`.
Both methods remain unsupported on AppKit: they warn and return void, without
changing window or menu chrome. Native startup and installed-consumer checks
remain pending.

```ts
import { systemBars } from '@octane-xplat/platform/system-bars'

systemBars.setStatusBarStyle('light') // Unsupported on AppKit.
systemBars.setColor('#171717') // No AppKit chrome changes.
```

See [AppKit system-bar limits](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#system-bars-on-appkit).

### Keep AppKit text-area resizing with the current field

AppKit TextArea resize observers now retire before their editor is removed.
Late callbacks and sizing that loses its native owner stop before later frame
writes. Growth, row caps and the full scrollable document keep their existing
behavior.

```tsx
import { TextArea } from '@octane-xplat/ui'
export function Notes() {
  return <TextArea label="Notes" autoGrow rows={2} maxRows={4} />
}
```

Source cases remain unrun; real native resizing, scrolling, cleanup and installed-
app qualification remain pending. See [AppKit growth ownership](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/primitives.md#keep-appkit-growth-with-its-editor).

### AppKit toolbars retain controls and expose their role

AppKit Toolbar now supplies its current label and native toolbar role on the
existing host. Changing orientation now preserves slot controls and their local
state. Child actions remain separate; the container does not become a button or
extra Tab stop.

```tsx
import { Button, Toolbar } from '@octane-xplat/ui'

export function Actions() {
	return <Toolbar label="Page actions" startContent={<Button label="Save" />} />
}
```

The native accessibility metadata follows orientation changes. Complete
mixed-control roving remains a gap.
Native input and VoiceOver remain unqualified. See [toolbar actions](https://octane-xplat.goddardai.org/app/navigation-ui#add-toolbar-actions-and-responsive-overflow).

### Open AppKit external links through the system

AppKit URL links now use the platform opener instead of the app-window creation
hook. Link also wraps plain text in a native label and honors function components
from LinkProvider or as.

```tsx
import { Link } from '@octane-xplat/ui'

export function Help() { return <Link href="https://example.com/help">Read help</Link> }
```

Native launch, input, VoiceOver and appearance remain unqualified. See
[AppKit links](https://octane-xplat.goddardai.org/app/navigation#open-links-on-appkit).

### Billing connect() is awaitable

`billing.connect()` now resolves once the store reports ready, so a first
product fetch or purchase no longer races Android store setup. Await it
before checking `canMakePayments()` — a resolved connect can still mean
restricted payments or a failed setup. Reconnects after `disconnect()`
await the next readiness signal.

```ts
import { billing } from '@octane-xplat/billing'

await billing.connect()
if (billing.canMakePayments()) {
	const products = await billing.fetchProducts(['com.example.premium'], 'inapp')
}
```

[Billing](https://github.com/octane-xplat/octane-xplat/blob/main/packages/billing/README.md)

### Subscription checkout reaches the store sheet

`billing.requestPurchase` no longer re-fetches every product as `inapp`,
which blocked Google Play subscription checkout. Pass the product returned
by `fetchProducts(ids, 'subs')` so its offer details reach the store, or
pass an id with `{ type: 'subs' }` to select the catalog. Play applies the
product's first offer; choosing between offers and changing an active
subscription are not exposed.

```ts
import { billing } from '@octane-xplat/billing'

const [plan] = await billing.fetchProducts(['com.example.plan.monthly'], 'subs')
if (plan) await billing.requestPurchase(plan)
```

[Billing](https://github.com/octane-xplat/octane-xplat/blob/main/packages/billing/README.md)

### Keep the macOS host SDK out of web starters

The camera package no longer causes web, iOS, and Android apps to install the
macOS host SDK through a mandatory peer dependency. macOS apps still declare
their host SDK explicitly.

[Camera setup](https://github.com/octane-xplat/octane-xplat/blob/main/packages/camera/README.md)

### Keep copy feedback with its screen

An in-flight copy could announce success or create a reset timer after its
component unmounted. `useClipboard` now retires that feedback and ignores held
triggers after unmount, while already started writes still resolve their result.
An unavailable announcement no longer rejects a successful copy. AppKit native
pasteboard, effect and VoiceOver qualification remains pending.

```tsx
import { Pressable, Text, useClipboard } from '@octane-xplat/ui'

export function CopyMessage({ text }: { text: string }) {
	const { clipboardProps, isCopied } = useClipboard({ getItems: () => text, announce: 'Copied' })
	return <Pressable {...clipboardProps}><Text>{isCopied ? 'Copied' : 'Copy'}</Text></Pressable>
}
```

See [copy feedback lifetime](https://octane-xplat.goddardai.org/app/keyboard-clipboard#keep-copy-feedback-with-its-screen).

### Crashlytics works without a manual plugin import

On iOS and Android, `crashlytics` no longer throws
"firebase crashlytics is not available" when the app only installed the
package. The native leaf now loads `@nativescript/firebase-crashlytics`
itself, registering `firebase().crashlytics()` before the service's first
use — the bootstrap import the docs previously required is no longer needed.
Firebase app configuration is unchanged.

```ts
import { crashlytics } from '@octane-xplat/firebase-crashlytics'

crashlytics.recordError(new Error('Handled check'))
```

[Crashlytics](https://github.com/octane-xplat/octane-xplat/blob/main/packages/firebase-crashlytics/README.md)

### Format TypeScript declaration files

`xplat fmt` now accepts ambient exports such as `export const value: string`
in `.d.ts`, `.d.mts`, and `.d.cts` files instead of failing with “Missing
initializer in const declaration”.

```sh
pnpm exec xplat fmt
```

[Code checks](https://octane-xplat.goddardai.org/testing/testing)

### Fix center serialization in image positions

Image position objects containing `center` now serialize to a valid 50%
edge offset instead of the invalid `centerpx` length.

When a position object supplies both edges on an axis, serialization now
uses top/left precedence to match the existing native layout math.

### Fix iOS builds combining SQLite with other native module libraries

iOS app builds no longer fail with `Multiple commands produce
.../include/module.modulemap` when `@octane-xplat/sqlite` is installed
alongside another library-style xcframework that ships a module map, such as
`@nativescript/font-manager`. The upstream
`@nativescript-community/sqlite-bridge` xcframework declared a duplicate
generic `module.modulemap` output; the packaged patch removes it — the
SQLite bridge class is still reachable through NativeScript's runtime
metadata, so no app code changes are needed. The patch is applied
automatically on `bun install` and is included in new project starters.

### Readable `htmlview` text in light and dark macOS windows

On macOS, an unstyled `htmlview` now picks its default text color from the appearance of its own window or view. Before, it used the app's appearance, so a light window in a dark-mode app showed white text on a light background. A text color with no RGB equivalent now falls back to AppKit's default instead of throwing an error.

[macOS renderer](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer#readme)

### Release native connectivity listeners cleanly

NativeScript connectivity registrations now detach independently, including
when they use the same callback. Failed initial reads, callbacks and monitor
startup no longer leave a reader registered. Changes during dispatch avoid
duplicate initial updates, and reentrant setup shares one monitor.

```ts
import { connectivity, type ConnectivityState } from '@octane-xplat/platform'

const onNetwork = (state: ConnectivityState) => console.log(state.type)
const first = connectivity.subscribe(onNetwork)
const second = connectivity.subscribe(onNetwork)
first() // The second registration stays active.
second()
```

[Watch network state](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#watch-network-state)

### Native apps no longer crash on dependencies that use Unicode property regexes

iOS and Android apps built with `xplatNative` now compile `\p{…}` regex escapes
out of every bundled module at build time. Dependencies such as `linkifyjs`,
`@lexical/link`, and `shaders` previously threw a `SyntaxError` at startup
because the NativeScript JavaScript engine is built without ICU; they now boot
without per-package patches. No app changes are required.

### Carry the compatible lint checker into generated workspaces

New app and library starters now pin `oxlint-tsgolint` 7.0.2005 through the
managed workspace overrides, matching the `>=7.0.2005` optional peer that
Oxlint 1.90.0 declares through `@octane-xplat/lint`. An isolated install could
previously resolve 7.0.2002 and fail `pnpm peers check`. `xplat upgrade`
reconciles the same pin in existing workspaces.

[Component libraries](https://octane-xplat.goddardai.org/app/component-libraries)

### Announce expanded controls on web

`Pressable` now forwards `accessibilityState.expanded` to `aria-expanded`,
including collapsed and removed states.

```tsx
import { useState } from 'octane'
import { Pressable, Text } from '@octane-xplat/ui'

export function DetailsToggle() {
	const [expanded, setExpanded] = useState(false)
	return (
		<Pressable
			accessibilityState={{ expanded }}
			onPress={() => setExpanded(!expanded)}
		>
			<Text>{expanded ? 'Hide details' : 'Show details'}</Text>
		</Pressable>
	)
}
```

[Pressable documentation](https://octane-xplat.goddardai.org/components)

### GTK consumers resolve the curated UI type surface again

`@octane-xplat/ui`'s `gtk` export condition restores its own generated
declarations (`index.gtk.d.ts`), so GTK builds once again see only the
components proven on the GTK driver (`Text`, `Pressable`) instead of the full
cross-platform barrel surface. No API or import changes are needed.

### Fix `Video` seeking on Android

`@octane-xplat/video` `VideoHandle.seekTo(ms)` and transport scrubbing now
reach the requested position on Android. The adapter converted milliseconds
to seconds for every platform, but the native plugin's Android `seekToTime`
expects milliseconds — `seekTo(10000)` landed at 10 ms. iOS keeps its
seconds conversion; the public API stays milliseconds on both platforms.

```ts
const player = useRef<VideoHandle>(null)
player.current?.seekTo(15000) // seeks to 15 s on web, iOS, and Android
```

See [Video](https://github.com/octane-xplat/octane-xplat/tree/main/packages/video#readme).

### Keep `VideoHandle` bound to the live player after view replacement

The imperative handle returned through `Video`'s `ref` now resolves the current
native view on every call instead of capturing the view that was attached when
the handle was created. Previously, if the element's host view was replaced
without the handle effect re-running — for example a keyed swap that recreates
the player — `play`, `pause`, `seekTo`, `currentTime`, `duration`, and `native`
kept describing the outgoing clip.

```tsx
const ref = useRef<VideoHandle | null>(null)

// ref.current now always talks to the mounted player, whichever clip is live.
<Video key={clip.id} src={clip.uri} ref={ref} autoPlay
	onEnded={() => setClip(nextClip)} />
```

Applies to web, iOS, and Android. See
[Video setup and props](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/primitives.md#video-playback).

### Keep zero counts visible in Windows badges

Windows badges now give numeric children a native text control. A count of
zero previously disappeared. Text and numbers can also sit beside supplied
components.

```tsx
import { Badge } from '@octane-xplat/ui'

export function PendingCount() {
  return <Badge>{0}</Badge>
}
```

[Windows Badge guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#badge-text-candidate)

### Apply requested padding inside Windows cards

Windows cards now apply their requested padding instead of retaining the theme
inset. Plain text and numeric content also use native text controls in the
header, body and footer.

```tsx
import { Card } from '@octane-xplat/ui'

export function Summary() {
  return <Card padding={2} header="Pending">{0}</Card>
}
```

[Windows Card guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#card-padding-candidate)

### Build Windows preview bundles with isolated dependencies

The native Vite preset now resolves MasonKit and its style module through the
app's declared Windows engine. Previously, pnpm's isolated linker could leave
the renderer unable to find `@octane-xplat/nativescript-masonkit/style` during
bundling. Existing native configurations receive the correction:

```ts
import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => xplatNative(mode))
```

Windows remains an experimental repository harness, with no documented
downstream setup. See [Windows support status](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md)
and the [native Vite preset](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md#native-vite-preset).

### Wrap Windows text inside constrained layouts

Windows `Text` now keeps the correct width in start/center-aligned columns and
shrinking rows. Previously, a label could overflow its container or report a
narrower column width than web. The Windows harness adopts MasonKit
`1.0.0-beta.129` with the measurement repair.

```tsrx
import { Text, View } from '@octane-xplat/ui'

export function WrappedNote() @{
  <>
    <style>
      .note-row { display: flex; width: 220px; flex-direction: row; }
      .note-copy { font-size: 14px; line-height: 20px; flex-shrink: 1; }
    </style>
    <View className="note-row">
      <Text className="note-copy">
        Shared typography should wrap within the available space.
      </Text>
    </View>
  </>
}
```

The verified setup remains the private x64 Windows harness. See
[Windows text wrapping and limits](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#text-wrapping).

## [Octane Xplat 0.18.0](https://github.com/octane-xplat/octane-xplat/releases/tag/v0.18.0) - 2026-10-28

### Declare Bamboo's build targets for custom Vite builders

Cloudflare SPA builds can leave a configured SSR target unused. Declare the
targets your builder runs to avoid Bamboo's incorrect incomplete-run warning
while keeping CSS pruning enabled. Include real SSR targets when present.

```ts
import { xplatBamboo } from '@octane-xplat/bamboo/vite'

const plugins = xplatBamboo({
  buildEnvironments: ['api', 'client'],
})
```

See [build participation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/bamboo#custom-builders-with-unused-environments).

### Button matches the Astryx default

Fixed `Button` differences from Astryx's default button:

- A loading button no longer fades out as if it were disabled.
- Long labels now end in an ellipsis instead of overflowing the button.
- The loading spinner is now Astryx's small 14px ring, on web and native.
- On native, a loading button keeps its label in place underneath the spinner instead of being replaced by it, so its size and accessible name don't change. While busy it announces `accessibilityValue: "Loading"`.

### Loading buttons now report busy and keep their accessible name

A `Button` that is `isLoading` or has an in-flight `clickAction` on web now
exposes `aria-busy="true"`, stays disabled (unless `isInterruptible`), keeps
its label rendered — hidden beneath the spinner so width and accessible name
survive — and announces "Loading" through a visually hidden
`role="status"` live region.

```tsx
<Button label="Save" clickAction={save} />
// while pending: aria-busy="true", aria-disabled, live region reads "Loading"
```

Previously the loading swap replaced the content entirely, collapsing the
button's width and dropping its accessible name. See
[Button](https://octane-xplat.dev/app/components/).

### No more `title="undefined"` on untooled buttons

`web` escape props carrying `null` or `undefined` now remove the reflected
attribute instead of stringifying the value. A `Button` without `tooltip` no
longer exposes `title="undefined"`, which had leaked into its accessible
name on web.

```tsx
<Button label="Save" /> // renders without a title attribute
```

See [`web` escape props](https://octane-xplat.dev/app/styling/).

### Buttons paint the Astryx hover and pressed overlays on web

`Button` — and every component built on it, like `ToggleButton` and
`DropdownMenu` triggers — now answers pointer hover with the
`--color-overlay-hover` wash and a press with `--color-overlay-pressed`,
layered over the variant's own fill like upstream's interaction overlay.
Previously web buttons showed no hover or pressed feedback at all.
Disabled and aria-disabled buttons stay inert.

### Card matches Astryx's default padding and corner radius

`Card` now takes the theme's card padding — upstream's
`--astryx-card-padding` (12px in Neutral, 18px in Matcha and Y2K, 16px
elsewhere) with the 1px border inset — and rounds with the container radius
(`--radius-container`, overridable per theme via `--_card-radius`). Previously
cards rendered with no padding on the root and a fixed 8–10px radius; header,
body, and footer slots carried their own 12px padding.

```css
/* A named theme can retune card geometry by redeclaring the override vars: */
'--astryx-card-padding': '18px',
'--_card-radius': '42px',
```

Cards that relied on the old unpadded root may need an explicit
`padding` prop; `padding={n}` still overrides the theme default entirely.

### Hide inactive chat scroll buttons on web

`ChatLayoutScrollButton` now removes its button when `isVisible` is false,
so hidden controls cannot receive clicks or keyboard focus. This matches the
native component's behavior.

```tsx
import { ChatLayoutScrollButton } from '@octane-xplat/ui/chat'

<ChatLayoutScrollButton isVisible={false} onPress={() => {}} />
```

[Chat components](https://octane-xplat.goddardai.org/app/components#chat)

### Typecheck Vite configs with separate PostCSS patches

Importing the CLI's Vite helpers no longer pulls their PostCSS implementation
into your app's typecheck. This fixes excessive comparison stack errors when
Vite and the CLI resolve different compatible PostCSS 8 patches. Your existing
PostCSS options and plugins continue to work.

```ts
import { defineConfig } from 'vite'
import { xplatCss } from '@octane-xplat/cli/vite'

export default defineConfig({
  plugins: [xplatCss('web')],
  css: { postcss: { map: { inline: false }, plugins: [] } },
})
```

[Platform CSS documentation](https://octane-xplat.goddardai.org/styling#style-one-platform)

### Stop sending development actions to expired app instances

Apps leave the live action registry after 15 seconds without a heartbeat.
New actions cannot target an expired instance, and outstanding jobs report
`disconnected_runtime` instead of waiting for the action timeout. Check app
state before retrying an action whose outcome is unknown.

```sh
pnpm exec xplat actions list --json
```

[Development actions](https://octane-xplat.goddardai.org/testing/development-actions)

### Select development devices and boot iOS simulators reliably

`xplat dev` accepts `--device` to select an exact device, optionally alongside
`ios` or `android`. iOS development and owned session launches boot simulators
through `simctl`, including when the selected Xcode has no Simulator.app.

```sh
pnpm exec xplat dev ios --device DEVICE_UDID
```

Replace `DEVICE_UDID` with an identifier from `pnpm exec xplat targets --json`.
See the [development setup guide](https://octane-xplat.goddardai.org/start/toolchain).

### Keep the dictation stop button usable

`ChatDictationButton` now composes the shared icon-only Button at its requested
size. Starting dictation no longer collapses the web stop target when the
microphone icon disappears. Browser capability and OS speech support remain
separate requirements.

```tsx
import { ChatDictationButton, useChatDictation } from '@octane-xplat/ui/chat'

function DictationButton() {
	const dictation = useChatDictation()
	return <ChatDictationButton dictation={dictation} size="md" />
}
```

[Chat components and platform limits](https://octane-xplat.goddardai.org/app/components#chat)

### Labelled FormField no longer crashes on re-render

Fixed a web crash when a labelled `FormField` re-rendered, for example when the value of the input inside it changed.

### Headings render the Astryx type scale

`Heading` now applies the theme's `--text-heading-*` tokens — size, weight,
and line-height for levels 1–6 — on web, iOS/Android, and macOS. Previously
web fell back to browser defaults (32px bold h1, 24px bold h2) with no
line-height, and body text had no Astryx leading.

### Native dev boot in hoisted pnpm workspaces

Apps inside a `nodeLinker: hoisted` pnpm workspace (where the app's own
`node_modules` is empty and packages install at the workspace root) crashed
on iOS/Android dev boot with `TypeError: __octaneUniversalPlan is not a
function`. The dev server could not read the package's `package.json` at
`<app>/node_modules`, so a vendored package's deep `dist/` specifier never
folded back to its bare package id and the device vendor registry missed
it. The patch now resolves installed package metadata through Node's
ancestor `node_modules` chain, matching pnpm hoisted, npm, and Yarn classic
workspace layouts — no app changes needed.

```yaml
# pnpm-workspace.yaml at the workspace root
packages:
  - 'apps/*'
nodeLinker: hoisted
```

See the [toolchain guide](https://octane-xplat.goddardai.org/toolchain).

### Text fields get the Astryx hover and focus rings on web

`TextInput` and `TextArea` shells now match upstream's input chrome:
hover draws a 2px inset ring at 30% of the border color, and focusing
the field swaps the border to `--color-accent` with an inset
`--color-accent-muted` ring — including the status variants, which keep
their status border and answer hover with their own inset shadows. The
ring moves from the inner text leaf's 1px outline to the field's
bordered box, so the focus indicator frames the whole control. Bare
`TextInput` leaves outside a bordered shell (for example inside menus)
keep their thin focus outline.

### Keep layered screens responsive when text collapses

On iOS, measuring or requesting layout in a layered `Screen` containing
collapsed `Text` no longer causes a repeating layout loop. Timers continue
running as the text changes between collapsed, hidden, and visible states.

Rebuild the native app after upgrading to load the corrected engine.

[Screen layers](https://octane-xplat.goddardai.org/primitives#layer-a-screen-over-retained-content)

### Badge accepts plain text children on macOS

`<Badge>3</Badge>` no longer crashes on macOS with "cannot contain text-only
children" — the string renders inside a text label like it does on the web.
On iOS and Android, raw string children now render too; they were previously
dropped silently.

### Collapsible string triggers and `axis="both"` scroll views work on macOS

`Collapsible` no longer crashes on AppKit when its `trigger` is a plain
string — text triggers are wrapped in a text element instead of landing as
a raw text node inside a view container. `ScrollableArea` with
`axis="both"` no longer throws an orientation validation error; both scroll
axes are enabled as documented.

```tsx
<Collapsible trigger="Profile">…</Collapsible>
<ScrollableArea axis="both">…</ScrollableArea>
```

### Render the macOS command palette in its owning window

An open CommandPalette on macOS now mounts its content through its sheet target and retains its declaring component's context. BottomSheet also honors an explicit style width when opening its surface.

[Command palette](https://octane-xplat.goddardai.org/app/primitives)

### Keep macOS component layouts aligned with web

On macOS, Item rows now place leading content, the label and description, and trailing content in order across the row.

Button and Pressable now start without a border; authored border styles still apply.

Open drawers keep their content height, and Absolute overlays share the same top-left origin on macOS.

Checkboxes, radio indicators, Meter frames, and slider layers now follow their shared sizes and alignment on macOS.

Inactive Tabs panes collapse while their content stays mounted for later selection.

[Shared components](https://octane-xplat.goddardai.org/app/primitives)

### Wrap long text on macOS

Long labels now grow to fit their available width instead of keeping a
single-line height. An explicit height still controls the frame.

```tsx
/** @jsxImportSource @octane-xplat/macos-renderer */
export function Caption() {
	return <label text="A longer caption that can occupy several lines" style={{ width: 160 }} />
}
```

[AppKit label documentation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer)

### Packaged macOS apps lay out Mason content

Packaged macOS apps previously rendered `masonview` content empty: the Mason
layout engine library was not part of the published
`@octane-xplat/macos-renderer` package and never reached the app bundle.
The package now ships the engine prebuilt and `xplat build` copies it into
`Contents/Frameworks`, so packaged apps lay out without any extra setup.

[macOS native packages documentation](https://octane-xplat.goddardai.org/macos-native)

### Section stacks children vertically on macOS

On macOS, `Section` laid out its children in a row instead of stacking them
vertically like every other platform. It now defaults to a column layout;
pass `flexDirection: 'row'` in `style` to lay children out horizontally.

### Align macOS text entry with shared field metrics

TextInput and TextArea on macOS now use the shared content insets, placeholder colors, and line heights. TextArea includes padding when sizing rows and growing to its content. Styling a control's background or border preserves its native bezel and background settings.

[Text entry](https://octane-xplat.goddardai.org/app/primitives)

### setThemePreference drives the app appearance on macOS

On macOS, `setThemePreference('light' | 'dark')` now pins the application
appearance (`NSApp.appearance`), so CSS root classes, `prefers-color-scheme`
media queries, and native controls follow the preference instead of only the
OS setting. `setThemePreference('system')` clears the override and follows the
system again.

### Keep bracketed text separate from Markdown links

A closed bracket marker before a link no longer becomes part of the link's
label. This also keeps source citations independent of nearby links.

```tsx
import { Markdown } from '@octane-xplat/ui/markdown'

<Markdown text={'[note] Read the [guide](https://example.com/guide).'} />
```

[Markdown guide](https://octane-xplat.goddardai.org/app/content-display#markdown-documents)

### Keep image previews in their frame

Web `AspectRatio` now reserves its requested shape even when an image has a
different intrinsic size. Thumbnail preview and remove actions also work
independently with pointer and keyboard input. Dragging a zoomed Lightbox image
keeps the image zoomed after release.

```tsx
import { AspectRatio, Image } from '@octane-xplat/ui'

export function PhotoPreview() {
  return <AspectRatio ratio={16 / 9}><Image src="/photo.png" alt="Coastline" /></AspectRatio>
}
```

[Media components](https://octane-xplat.goddardai.org/app/components#content)

### Native CheckboxInput draws the Astryx check icon

On iOS and Android, a checked `CheckboxInput` now draws Astryx's check icon — the same mark web already rendered — instead of a ✓ text glyph. The check is a 14px drawn icon (12px at `size="sm"`), matching the 24px box on every platform.

### Start native dev sessions from a clean cache

The first development launch after clearing the dev-server cache could stop
before the app appeared. A native plugin failed with
`Class extends value undefined`, or the first screen stayed blank with
`<svgview> is not a registered element`. Plugin files now load in dependency
order, and each package runs only once, so the first launch boots like later
ones. Verified on an Android emulator.

[Run on iOS and Android](https://octane-xplat.dev/start/toolchain/#run-on-ios-and-android)

### Navigate when the root Frame is registered after the first render

On iOS and Android, an app that rendered its routes before registering the
root `Frame` could not navigate. Every push failed with
`Native Frame did not become ready`. The router now picks up the Frame when it
is registered, or at the next navigation, whichever comes first.

```ts
import { Application, Frame, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { registerStack } from '@octane-xplat/ui/routing'
import { App } from './App'

Application.run({
	create: () => {
		const frame = new Frame()
		const page = new Page()
		renderNativeScriptApp(page, App)
		frame.navigate({ create: () => page })
		registerStack('root', frame)
		return frame
	},
})
```

[Move between screens](https://octane-xplat.dev/app/navigation/)

### Native dev vendor bundle honors Vite resolve.alias

Native dev sessions (`xplat dev` on iOS/Android) could boot with stub
modules when a `resolve.alias` entry redirected a package that is not
installed — for example a renderer alias that maps full MasonKit imports to
Mason core. The vendored dependency bundle ignored the app's aliases and
bundled throw-on-evaluate stubs, so importing the package failed at startup.
The dev server now replays Vite `resolve.alias` inside its dependency and
vendor bundle passes: aliases for absent packages resolve to real files
while installed packages keep their default resolution. No app changes are
required beyond the aliases you already declare.

```ts
// vite.config.native.mts
export default {
	resolve: {
		alias: [{ find: '@octane-xplat/nativescript-masonkit', replacement: '/abs/path/to/mason-core/index.ios.js' }],
	},
}
```

See the [toolchain guide](https://octane-xplat.goddardai.org/toolchain).

### Fill native screen layers around intrinsic content

On iOS and Android, a nested `Screen` now fills the space assigned by its
parent instead of shrinking to its content's natural height. Its native shell
can also shrink with its parent without a fixed native height.

```tsx
import { Grid, Screen, Text, View } from '@octane-xplat/ui'

export function PlayerLayer() {
	return <Grid rows="*" columns="*" style={{ width: 300, height: 500 }}>
		<View row={0} col={0}><Text>Library</Text></View>
		<View row={0} col={0}>
			<Screen><Text>Player</Text></Screen>
		</View>
	</Grid>
}
```

[Screen layers](https://octane-xplat.goddardai.org/primitives#layer-a-screen-over-retained-content)

### Keep image grids within their available width

On iOS and Android, percentage-sized images now fit their share of a grid
instead of making its columns grow to the image's natural width. This also
works when an image sits inside a flex-growing tile.

```tsx
import { Grid, Image } from '@octane-xplat/ui'

export function ThumbnailPair({ src }: { src: string }) {
	return <Grid columns="*,*" style={{ width: 402 }}>
		<Image src={src} alt="" style={{ width: '100%', height: 402 }} />
		<Image src={src} alt="" style={{ width: '100%', height: 402 }} />
	</Grid>
}
```

Rebuild the native app after upgrading to load the corrected engine.

[Image sizing](https://octane-xplat.goddardai.org/primitives#fit-and-position-an-image)

### Route-change focus ring and stray toast-layer box removed

On web, navigating to a page moves focus to its heading for screen readers —
that scripted focus no longer paints a browser focus outline on the heading.
Keyboard focus rings on interactive elements are unchanged.

The empty toast layer no longer leaves a full-width strip at the top of the
page: its top-layer viewport now sits inside zero-footprint
`display: contents` wrappers and anchors to the configured edge, matching the
Astryx markup. Toast announcements flow through the shared document-level
live regions instead of per-viewport nodes.

### Build iOS apps with shared font support

iOS apps can use Mason core and `@nativescript/font-manager` together without
duplicate FontManager module errors. The app now links one native font library.
Upgrading also aligns an explicitly declared FontManager plugin with the
supported version. Rebuild the native app to receive the correction:

```sh
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm build:ios
```

[Upgrade framework packages](https://octane-xplat.goddardai.org/toolchain#upgrade-framework-packages)

### Show text-area field labels and status

Fixed `TextArea` differences from Astryx's default text area:

- A standalone `TextArea` now renders its `label`, `description`, `status`, and required/optional markers as visible field chrome on web and native, like `TextInput` already does — previously the field rendered the textarea alone.
- The textarea now sits inside Astryx's bordered box on web (8px radius, emphasized border), with the status icon pinned inside its top end.
- Text metrics now match Astryx: 14px/20px type, 4px block padding (8px at `size="lg"`), so a 3-row field measures 68px instead of 51px.
- The web field keeps Astryx's manual vertical resize handle; `autoGrow` still suppresses it since it owns the height.

[Input components](https://octane-xplat.goddardai.org/components#inputs)

### TextInput label focuses its input on web

Clicking a `TextInput` label on web now focuses the input.

### TextInput startIcon renders on native and spaces like Astryx

`TextInput`'s `startIcon` now renders on iOS and Android — it was silently
dropped before — and a registered icon name resolves to an `Icon` on web
instead of printing as text. On web, the icon sits 8px inside the field with
an 8px gap to the text, matching Astryx's input wrapper; the same 8px now
separates the field from its clear and status affordances.

```tsx
<TextInput label="Search" isLabelHidden placeholder="Search…" startIcon={<Icon name="xplat-search" size={16} />} />
```

### ToggleButtonGroup renders and matches Astryx's pill layout

`ToggleButtonGroup` produced an empty render — every platform variant
accessed `Context.Provider`, which Octane's `createContext` removed (the
context itself is the provider). The group now renders its
`ToggleButton` children on web, native, and macOS.

The web look now follows Astryx: the group is a row of separated ghost
pills on a `--spacing-1` gap rather than the segmented `ButtonGroup` strip,
the pressed fill is `--color-overlay-pressed`, and the pressed label goes
semibold with a hidden twin reserving the wider width so toggling doesn't
shift the row. Group members no longer run `pressedChangeAction` — inside
a group, selection belongs to `value`/`onChange`.

```tsx
<ToggleButtonGroup label="Filter" value={tab} onChange={setTab}>
	<ToggleButton value="all" label="All" size="lg" />
	<ToggleButton value="themes" label="Themes" size="lg" />
</ToggleButtonGroup>
```

See [the ToggleButton block templates](https://github.com/facebook/astryx/tree/main/packages/cli/assets/templates/blocks/components/ToggleButtonGroup) for the upstream contract.

### Web apps get the Astryx font smoothing

The shared web normalization now applies
`-webkit-font-smoothing: antialiased` and
`-moz-osx-font-smoothing: grayscale` to the document body, matching
upstream's `reset.css`. Text renders slightly lighter — the same weight
the Astryx themes are designed around — instead of the DOM's heavier
subpixel default.
