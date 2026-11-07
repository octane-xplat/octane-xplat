# Fixlog

Selected bug fixes, newest release first. Features and breaking changes appear
in the [changelog](CHANGELOG.md).

Earlier fixes remain in the original [combined changelog](CHANGELOG.md) and
[tsrx-typegen changelog](packages/tsrx-typegen/CHANGELOG.md).

## [Octane Xplat 0.20.0](https://github.com/octane-xplat/octane-xplat/releases/tag/v0.20.0) - 2026-11-07

### Lay out native fields as one unit

On iOS and Android — and on the new GTK target — field chrome fixes keep labels, width, state, and editors together:

- CheckboxList, RadioList, SegmentedControl, CheckboxInput, Switch, NumberInput, PinInput, SearchInput, and Rating now apply `width` and `status` to the complete field instead of the control alone.
- Field labels focus their associated input. InputGroup forwards width, read-only, loading, and status to member controls.
- FormLayout keeps each editor and its text when direction or label position changes. TextArea releases old row limits when `autoGrow`, `maxRows`, or an explicit height changes, and changing a SearchInput's leading icon keeps the editor's text and focus.

```tsx
import { FormLayout, TextInput, Switch } from '@octane-xplat/ui'

export function Settings({ direction }) {
  return (
    <FormLayout direction={direction} style={{ gap: 16 }}>
      <TextInput label="Name" width={320} />
      <Switch label="Enabled" width={320} />
    </FormLayout>
  )
}
```

### Keep native text editing predictable

On iOS and Android:

- Controlled TextArea and SearchInput restore the supplied value when the parent rejects an edit, matching the other controlled fields. Repeated rejected edits restore the last accepted value.
- TextArea forwards `maxLength` to the native editor — the prop was previously ignored. Setting it to zero blocks new text and removing it lifts the limit.
- TextArea now rejects `secure` before rendering instead of accepting and ignoring it. Use a secure TextInput for password entry.

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Bio({ value, onChange }) {
  return <TextArea value={value} onChange={onChange} maxLength={280} />
}
```

### Keep native dependencies out of web development

Web development now uses the configured platform extension order when Vite prepares dependencies. Packages with browser and native siblings, including SQLite, can stay optimized without pulling native imports into the browser. Existing optimizer extension overrides remain authoritative.

```ts
import { xplatBoundary } from 'octane-xplat/vite'

// In your existing Vite plugins array; the starter already includes this:
const platformResolver = xplatBoundary('web')
```

[Web configuration](https://octane-xplat.goddardai.org/package-toolchain#configure-a-web-app)

### Start iOS recordings without a brightness jump

On iOS, starting a recording restarted the camera pipeline, so the first fraction of a second of each movie came out dark and then brightened as exposure and white balance readjusted. The camera now prepares its recording connection for portrait (the default) when the preview starts, so a portrait recording keeps the exposure and white balance the preview already had. A take in a different orientation from the previous one can still readjust once when it starts. Rebuild your iOS app after upgrading so it includes the updated native recorder.

See [record a camera movie](https://octane-xplat.goddardai.org/movie-capture).

### Fix the Android native typecheck for prepared full-screen Pages

Android builds no longer fail the native TypeScript check inside
`prepareFullScreenPage`. The measurement override that keeps full-bleed Page
content correctly sized is iOS-only and now lives in the iOS platform leaf, so
Android compilation no longer reports the UIKit-only `bounds` property on the
Android Page view.

### Give a synchronously-decoded Android Image its intrinsic height

On Android, a width-only `Image` whose bitmap arrives inside the layout pass — a `data:` URI or a warm cache hit — stayed 0 pt high because nothing asked layout to re-measure it. The leaf now requests one deferred re-measure while an intrinsic axis is still 0, matching iOS sizing (`214` wide → `160.5` high for a 4:3 bitmap). Flex-grown and stretched heights are untouched.

```tsx
<Image src={dataUri} alt="Preview" style={{ width: 214 }} />
```

See [the Image component](https://octane-xplat.goddardai.org/package-ui#image).

### Keep macOS apps stable when views and event monitors retire

The AppKit renderer continues independent cleanup when a subscription, nested view, or native release throws. Retired controls ignore held callbacks, cleanup errors preserve the original construction error, and removed keyboard or pointer event monitors no longer crash the host during garbage collection.

Unmounting a root clears its inherited font and debug membership even when cleanup throws. A second live root on the same native view reports an error; reuse the existing root or unmount it before creating its replacement.

```ts
import { createMacOSRoot } from '@octane-xplat/macos-appkit'

const root = createMacOSRoot(host)
root.unmount()
const replacement = createMacOSRoot(host)
```

[Experimental macOS renderer](https://octane-xplat.goddardai.org/package-macos-appkit)

### Restore native macOS date-picker attachment

Native macOS date pickers no longer disappear when the AppKit host exposes native classes as object handles. Date, time and combined pickers can attach and receive selection and range updates through the renderer bridge.

```tsx
// Appointment.macos.tsx
import { AppKitDatePicker } from '@octane-xplat/date-picker/macos'

export function Appointment() {
  return <AppKitDatePicker components="dateAndTime" accessibilityLabel="Appointment" />
}
```

[Native macOS date pickers](https://octane-xplat.goddardai.org/date-picker#native-macos-selection-lifecycle)

### Keep macOS transforms and shadows aligned during layout

On the experimental AppKit host, transforms now survive initial layout and later frame updates. Percentage translations follow changes to the element's size, including animated translations. Pending frame repaints stop when the view is replaced or removed.

```tsx
<masonview style={{ width: 120, height: 80, translateX: '25%' }} />
```

Shadows now follow moving and resizing views during layout animations and return to their authored blur afterward. Previously, a shadow could stay at its original scale with an enlarged blur.

See [macOS renderer setup](https://octane-xplat.goddardai.org/package-macos-appkit) and [layout animations](https://octane-xplat.goddardai.org/animation-gestures#layout-animations).

### iOS background refresh honors outcomes, expiration and recurrence

On iOS, a background-task run now reports the executor's real result instead of always succeeding, completes exactly once when the OS expires the run, and submits the next refresh request after each run while the task stays enabled — so registered work actually recurs. `defineTask` registers Apple's required launch handler once at module scope, which makes `register()` pure scheduling that is safe to call from an enable action or at every launch.

```ts
backgroundTasks.defineTask('sync', async (context) => {
  const first = await fetchDelta()
  if (context.expired) {
    return 'failed' // OS reclaimed the run; stop promptly
  }
  return (await persist(first)) ? 'success' : 'failed'
})

// Idempotent scheduling — call on every launch or from an enable action.
await backgroundTasks.register('sync', { minimumInterval: 3600 })
```

Executors that can stop early should watch `context.expired`; a run the OS reclaims is completed as failed and a late result is discarded.

[Background work guide](https://octane-xplat.goddardai.org/background-work)

### Ignore cancelled native refresh gestures

An interrupted native pull-to-refresh gesture now returns the indicator to rest without calling onRefresh. A controlled refresh stays docked until refreshing becomes false. Refreshable Mason regions also honor their viewport dimensions and keep the indicator overlaid in the viewport's grid cell.

```tsx
import { ScrollableArea, Text } from '@octane-xplat/ui'

export function Feed(props: { loading: boolean; refresh: () => void }) {
  return (
    <ScrollableArea width={240} height={160} refreshing={props.loading} onRefresh={props.refresh}>
      <Text>Feed content</Text>
    </ScrollableArea>
  )
}
```

[ScrollableArea reference](https://octane-xplat.goddardai.org/app/components)

### Keep supplied slider values during rejected drags

Shared native and web sliders now keep the supplied value when a controlled parent rejects a drag, matching their keyboard editing behavior.

```tsx
import { useState } from 'octane'
import { Slider } from '@octane-xplat/ui'

export function LimitedVolume() {
  const [value, setValue] = useState(25)
  return <Slider value={value} onValueChange={(next) => {
    if (typeof next === 'number' && next <= 50) setValue(next)
  }} />
}
```

[Controlled sliders](https://octane-xplat.goddardai.org/linux-gtk#sliders)

### Keep iOS haptics silent in Debug builds

Advanced iOS haptics no longer synthesize audible thumps when using the prepared Pulsar package. Disabling simulation leaves another service's audio session active. Existing apps must replace the remote Pulsar Swift package with the prepared local package and rebuild their native binary.

```sh
bun run xplat-prepare-haptics-ios .xplat/pulsar-ios
```

Follow the [iOS haptics setup](https://octane-xplat.goddardai.org/package-haptics#set-up-ios) to update the NativeScript configuration.

### Resize nested screens with their parent on iOS

On iOS, a screen layered inside a Grid could keep its previous height after its parent shrank, leaving content outside the available area. Nested screens and their contents now follow the parent's new height.

See [layering a screen over retained content](https://octane-xplat.goddardai.org/app/primitives#layer-a-screen-over-retained-content).

### Keep iOS smooth corners through layout updates

SmoothCorners now gives its exact generated curve to Mason’s clipping system. Normal iOS layout no longer treats the smooth clip as an unrelated overflow mask and removes it. Background and border shapes remain independent of whether children use visible or hidden overflow.

[SmoothCorners documentation](https://octane-xplat.goddardai.org/package-smooth-corners).

### Draw SVGs revealed after a collapsed parent on iOS

On iOS, an SVG glyph (Icon, Image, Meter) mounted under a parent toggling `visibility: collapse` to `visible` stayed blank: the view gained valid bounds and kept its parsed paths, but its layer never received backing contents. The view now requests display when it gains positive bounds or its visibility is restored, so revealed SVGs render their artwork.

[Icon component](https://octane-xplat.goddardai.org/package-ui#icon)

### Paint iOS SVGs built from `<use>` icon references

On iOS, SVG artwork that stamps a shared shape with `<use>` (the defs-plus-use pattern common in exported icon sets) produced correctly sized views with parsed geometry but no paint — icons came out invisible while equivalent inline paths rendered. The SVG pipeline now expands `<use>` references into their generated content before the native renderer parses the markup, so use-based icons paint with their own fill, stroke, filter, transform, and x/y positioning on iOS.

[Image component](https://octane-xplat.goddardai.org/package-ui#image)

### Variable font weights in iOS text and editors

On iOS, variable fonts now use the requested weight in class-styled text, text inputs, and text areas. Normal text selects weight 400 even when the font file defaults to a lighter weight. Explicit variation settings keep precedence.

```tsx
<Text className="font-semibold">Semibold</Text>
<TextInput className="font-medium" defaultValue="Medium" />
```

See [custom fonts and weights](https://octane-xplat.goddardai.org/app/styling#font-family-tokens).

### Use bridged AppKit members without unexpected crashes

The macOS bridge no longer mislabels members as properties borrowed from subclasses. Members such as `NSView.autoscroll` now expose their declared methods instead of crashing on property access.

```js
const view = NSView.alloc().init()
typeof view.autoscroll // "function" — the real -[NSView autoscroll:]
```

When an object does not implement a bridged selector, the host now reports an ordinary JavaScript error that `try`/`catch` can handle instead of terminating the app with an uncaught native exception.

[macOS native leaves](https://octane-xplat.goddardai.org/macos-native)

### Receive macOS native callbacks reliably

AppKit callbacks from background queues now reach JavaScript on the main thread. Previously, URL-session completions could never arrive, and operation or dispatch queues could remain stuck.

```js
const task = NSURLSession.sharedSession.dataTaskWithURLCompletionHandler(url, (data, response, error) => {
  // Now fires — previously the request completed but this block never ran
  console.log(response.statusCode)
})
task.resume()
```

JavaScript-implemented delegate methods invoked from other threads now run on the JavaScript thread and return their result to the caller, instead of crashing the app.

```js
const Delegate = NSObject.extend(
  {
    didRun: function (success) {
      // Now runs on the main thread even when AppKit invokes it on the
      // spawned print thread — previously the process crashed here.
    },
  },
  { exposedMethods: { didRun: { returns: interop.types.void } } },
)
```

Completion or decision-handler blocks passed into delegates now remain callable while JavaScript holds them. Saving a WebKit decision handler and calling it after the delegate returns previously did nothing or crashed.

```js
const Delegate = NSObject.extend(
  {
    webViewDecidePolicyForNavigationActionDecisionHandler(wv, action, handler) {
      pending = handler // Now safe to call later — previously it dangled
    },
  },
  { protocols: [WKNavigationDelegate] },
)
```

[macOS native leaves](https://octane-xplat.goddardai.org/macos-native)

### xplat-mcp runs on the Go agent commands

`@octane-xplat/mcp` is a thin stdio transport again after the Go CLI cutover:
its tools call `xplat ... --json` for sessions, targets, diagnostics,
inspection, dev-actions and evidence — one implementation, two transports.
The contract modules moved back into the package; workspace selection,
permission grants and client elicitation stay server-side.

**Contract boundary:** the Go agent contract has no owned launch, build job,
session end, generic job cancel, or capture command. `xplat_launch`,
`xplat_build`, `xplat_session_end`, `xplat_job_cancel` and `xplat_screenshot`
keep their names and permission gates but report `unsupported_capability`/
`unavailable` with the supported path — run `xplat dev`, connect the app, and
use `xplat_attach`. `xplat_interact` now dispatches `handler-dispatch` only.

### iOS app builds include the GIF converter again

`ns build ios` no longer fails on the packaged converter engine: NativeScript app targets compile package Swift at Swift 4.2, where the engine's request decoding was rejected.

[GIF conversion guide](https://octane-xplat.goddardai.org/package-media-converter)

### Restore platform leaves for explicit `.tsrx` imports on native

On native targets, an unsuffixed import written with its extension —
`import { Card } from './Card.tsrx'`, the spelling the TSRX contract requires —
resolved the literal shared file and skipped `Card.windows.tsrx`,
`Card.ios.tsrx` and `Card.mobile.tsrx`. Windows apps lost every Pressable-based
accessibility peer (Button, Link, ListItem rows, Tab, Selector and menu
triggers had no focus, Invoke or accessible name for UI Automation), and
iOS/Android bundles missed `.mobile` variants such as Tooltip and HoverCard.
The native preset again treats the authored extension as the contract name and
probes the platform chain on its stem, matching
[platform files](https://octane-xplat.goddardai.org/module-resolution).

```ts
import { Card } from './Card.tsrx'
// The Windows build selects Card.windows.tsrx; the checker reads Card.tsrx.
```

### Refresh registered fonts when their source changes

Re-running font registration now refreshes an already registered font's bundled
file, web face, and referring tokens. Previously, it could report the new family
while keeping old font bytes. Conflicting files that were never registered are
preserved and produce an error instead of being overwritten.

```sh
bun run xplat fonts add ./downloads/AcmeSans-Variable.ttf
```

Fontsource registration also reports the imported CSS family as the web name,
while retaining the font's internal names for iOS.

```sh
bun run xplat fonts add @fontsource-variable/inter --install
```

See [font-family tokens](https://octane-xplat.goddardai.org/styling#font-family-tokens).

### Bun starters include bunfig.toml

Bun apps created with 0.19.0 are missing the hoisted-linker setting.

The published 0.19.0 creator omitted `template/bunfig.toml` from its tarball,
so Bun apps created with it have no `bunfig.toml` and do not get the flat
dependency layout NativeScript expects. Add this file at the app root, then
reinstall:

```toml
[install]
linker = "hoisted"
exact = true
```

```sh
bun install
```

### Preserve strings in typecheck configuration

`xplat typecheck` now preserves strings and object keys containing `,}` or `,]`
in `tsconfig.envs.json`. Comments and trailing commas remain supported; missing
values and adjacent tokens such as `[1/* gap */2]` are rejected instead of
silently changing the configuration.

See [TypeScript configuration](https://octane-xplat.goddardai.org/module-resolution#typescript)
and [TypeScript's tsconfig reference](https://www.typescriptlang.org/tsconfig/).

### Restore hook calls into HMR-wrapped universal components

Native hooks that return renderable values — `useOwnedContent` and the
imperative sheet/modal/list-cell hooks built on it — work again inside
development and test builds. The universal HMR wrapper added for hot-reload
remounting intercepted these calls during render and returned a keyed render
block instead of the hook's own result, so owned outlets mounted with an
undefined owner and every modal, sheet, and list-cell surface broke in the
native lane. The hook-call protocol now executes the component's current
revision directly; component invocation keeps its revision-keyed behavior.

### `captureScreen` works on iOS

`captureScreen` on iOS rejected every call with "View is detached": the detached check read `window` on the `UIWindow` itself, which is always nil — only a window's scene association marks it attached. Screen capture now succeeds and uses the display's native pixel scale.

```ts
import { captureScreen, releaseCapture } from '@octane-xplat/view-shot'

const uri = await captureScreen({ format: 'png' })
try {
  // Consume the temporary image.
} finally {
  releaseCapture(uri)
}
```

See [app-screen capture](https://octane-xplat.goddardai.org/package-view-shot#capture-an-existing-host).

### Load Windows avatar images and expose their names

Windows images using base64 data URIs now reach the native async decoder instead of remaining empty. Avatar initials fit inside their circle, and both the image and initials paths expose a named image peer.

```tsx
import { Avatar } from '@octane-xplat/ui'

export function Person() {
  return <Avatar name="Ada Lovelace" size="lg" />
}
```

[Windows image guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#avatars-and-raster-images-candidate)

### Stop `Unknown at rule: @platform` warnings in minified web builds

Web production builds using `xplatCss` and `xplatBamboo` logged
`[lightningcss minify] Unknown at rule: @platform` for every platform
condition in the generated sheet. The warnings were cosmetic — the emitted CSS
was already correct — but they buried real diagnostics. Deferred sheets now
carry platform conditions through minification as `@layer` wrappers, decoded
after Bamboo's stylesheet validation, so both esbuild and Lightning CSS minify
warning-free.

See [platform styling](https://octane-xplat.goddardai.org/app/styling#style-one-platform).

### Load every background image on macOS

Layered backgrounds now accept each image's completion independently. Replacing a background URL releases the previous request, and removed backgrounds ignore late image completions.

```tsx
<masonview style={{ backgroundImage: 'url(one.png), url(two.png)' }} />
```

See [macOS renderer setup](https://octane-xplat.goddardai.org/package-macos-appkit).

### Keep macOS layout observations tied to completed updates

The AppKit renderer no longer reports a successful layout change after a render or style update fails. Later updates can still open a new batch; changes already applied before the failure remain in place.

[Experimental macOS renderer](https://octane-xplat.goddardai.org/package-macos-appkit)

### Protect recordings from pending camera configuration

Camera configuration now rejects if recording starts or the session is disposed while camera discovery is pending. A rejected camera change leaves the existing take running. `configure` remains idle-only; choose the camera before arming automatic recording. For a supported camera switch during a take, use `switchCamera` instead.

```ts
// Before arming automatic recording:
await session.configure({ camera: 'front' })
```

```ts
// During a take, after preview activation and a support check:
if ((await session.capabilities()).cameraSwitchDuringRecording) {
  await session.switchCamera('front')
}
```

See [camera switching during a take](https://octane-xplat.goddardai.org/movie-capture#switch-cameras-during-a-take) and [camera selection and orientation](https://octane-xplat.goddardai.org/movie-capture#camera-selection-and-orientation).

### Require a request key for `xplat_interact`

The Go `interact` contract mandates `--request-key` for every dispatch — it is the dedupe and receipt identity for a mutation whose outcome can outlive the caller. The MCP tool schema marked `requestKey` optional, so a schema-valid call deterministically failed downstream. The schema now requires the key and says what it buys: reuse an identical key to read the same receipt without dispatching again.

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
