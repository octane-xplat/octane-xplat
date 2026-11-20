# Native pre-render implementation

This private workspace owns the reusable startup artifact contract, independent Swift/Java readers and native binding. The Node/Vite compiler belongs to the separate private [build worker](../native-prerender-build/README.md), keeping compiler dependencies out of this runtime package. An opted-in app calls the `renderWithStartup` entry below and installs the platform mount units from `platforms/`; the wiring remains pre-productization — no public API promise, no CLI hook and no published install path yet.

Prepare supported Octane commands into a logical tree, including each text slot. Derive the native visual tree separately; native Labels flatten text while Octane retains its logical ownership. Command IDs exist only in the returned maps and never enter artifact nodes.

```ts
import { projectPreparedTree, projectVisualTree } from '@octane-xplat/native-prerender'

const prepared = projectPreparedTree([
  { op: 'create', id: 8, type: 'label', props: { text: 'Welcome' } },
  { op: 'insert', id: 8, parent: null, before: null },
])
const visual = projectVisualTree(prepared.nodes)
// One logical node and one native Label. No native allocation occurs here.
```

`matchPreparedTree` compares the complete initial logical tree before native claims. Comparing only flattened Label text could miss changed text-slot ownership. The factory consumes `visualByCommandId` only for the current prepared batch.

```ts
import { matchPreparedTree } from '@octane-xplat/native-prerender'

const commands = [
  { op: 'create', id: 50, type: 'label', props: { text: 'Welcome' } },
  { op: 'insert', id: 50, parent: null, before: null },
]
const artifactNodes = [
  { index: 0, path: '0', parent: null, kind: 'label', props: { text: 'Welcome' } },
]
const claims = matchPreparedTree(commands, artifactNodes)
// claims.visualByCommandId.get(50) === 0
```

`prepareFirstFrame` wraps the live first `root.prepare` for artifact adoption. Refs and effects never run under `prepare`, so `@octane-xplat/motion` reads `globalThis.__xplatPrerenderFirstFrame === true` and bakes each motion host's mount-effect seed (`initial === false ? animate : initial`) into emitted `style` — the cold artifact bakes the same seed at produce. Channels outside the startup style bounds (`opacity` 0–1 today) throw identically on both sides. The flag exists only during this call.

```ts
import { prepareFirstFrame } from '@octane-xplat/native-prerender'

const prepared = prepareFirstFrame(root, StartupComponent, artifact.seed)
```

`createNativeClaims` coordinates initial wrapper claims through the existing root-local driver hook. Match the complete prepared logical tree before committing; the registry consumes each initial visual ID once, then ordinary later creation returns to the driver's registered constructors. The host still owns native binding, default restoration, Core/window lifecycle and disposal.

```ts
import { createNativeClaims, prepareFirstFrame } from '@octane-xplat/native-prerender'
import { createNativeScriptRoot } from '@octane-xplat/nativescript-octane'

const claims = createNativeClaims(artifact.nodes, wrappers)
const root = createNativeScriptRoot(host, { createView: claims.createView })
const prepared = prepareFirstFrame(root, StartupComponent, artifact.seed)
if (prepared.status === 'prepared') {
  try {
    claims.match(prepared.batch.commands)
  } catch (error) {
    prepared.abort()
    claims.retire()
    throw error
  }
  // Bind the validated native objects and restore native defaults first.
  claims.commit(() => { prepared.commit() })
}
```

A mismatch leaves the registry `rejected`; abort the prepared attempt and take ordinary-render recovery before claiming. An error during commit leaves it `failed`, even if every initial wrapper was claimed. Octane can publish logical state and callbacks after native apply fails, so an accepted commit cannot be treated as untouched or retried. Dispose that failed owner scope and native tree, then retire its claim registry. Retirement also releases claim maps and references when Core keeps logical owners for warm restoration.

```ts
// After host-owned cleanup of a failed or retired scope:
claims.retire()
```

## Android wrapper binding

The Android platform asset `platforms/android/mason-binding.android.js`, exported as `@octane-xplat/native-prerender/android/mason-binding`, binds an already-mounted, backend-validated Mason/Label tree. It checks native classes, distinct objects, parents and child order before allocating wrappers, then returns the host, visual wrappers and portable claim registry. Both platform files are thin validators over the shared `platforms/mason-binding-core.js`; this is an internal host integration source, not a normal-app hydration API. Its optional native peers do not enter the portable root or Node codec.

```js
import { bindAndroidMasonTree } from './platforms/android/mason-binding.android.js'

const binding = bindAndroidMasonTree(artifact.nodes, viewport, nativeViews)
const root = createNativeScriptRoot(binding.host, { createView: binding.claims.createView })
const prepared = prepareFirstFrame(root, StartupComponent, artifact.seed)
if (prepared.status !== 'prepared') throw new Error('Startup suspended')
binding.claims.match(prepared.batch.commands)
// The owning host establishes Core/window/loading state and restores native defaults.
binding.commit(() => { prepared.commit() })
```

The binding uses Mason's `@octane-xplat/nativescript-mason-core/adoption` API: `bindNativeView` associates each Mason `View` with its existing native layout view, and `expectAttachedNative` makes each wrapper's first native attach a one-shot adoption — Mason verifies the attached native parent and index, skips reinsertion and runs its foreign-child bookkeeping. Later attachments use ordinary Mason behavior, even if a callback moves a child before the initial commit returns. Commit requires every expectation consumed, then cancels any remainder and restores Label factories in the finally path. Failed accepted scopes still require disposal; canceling expectations does not undo their mutations. After Core teardown, retirement clears adopted Mason native/style caches through `releaseNativeView` and the claim registry. The owner may retain logical wrappers for ordinary warm restoration.

```js
// Only after the host has released Core contexts, native handles and loaded state:
binding.retire()
```

The adapter depends on the Mason adoption API, which no released Mason core ships yet: qualification uses a local `nativescript-mason` fork commit until a release includes it. The maintained Android controls supply exact Core9.1.3 snapshots and were last qualified on repaired Mason beta.8; they need requalification on the local beta.10 package; an npm version alone does not establish compatibility. Window/lifecycle ownership, launch checks, default journals and failure recovery remain with the host. The configured keyed-list control and Home control exercise the same binding through different native trees.

## iOS wrapper binding

The iOS platform asset `platforms/ios/mason-binding.ios.js`, exported as `@octane-xplat/native-prerender/ios/mason-binding`, mirrors the Android contract for an already-mounted, backend-validated Mason/Label tree. It checks the `MasonUIView`/`TNSLabel` classes, distinct objects, `superview` parents and `subviews` order before allocating wrappers, then returns the host, visual wrappers and the same portable claim registry.

```js
import { bindIOSMasonTree } from '@octane-xplat/native-prerender/ios/mason-binding'

// mount.views is an NSArray; the binding takes a JavaScript array.
const views = Array.from({ length: mount.views.count }, (_, index) => mount.views.objectAtIndex(index))
const binding = bindIOSMasonTree(artifact.nodes, viewport, views)
const root = createNativeScriptRoot(binding.host, { createView: binding.claims.createView })
const prepared = prepareFirstFrame(root, StartupComponent, artifact.seed)
if (prepared.status !== 'prepared') throw new Error('Startup suspended')
binding.claims.match(prepared.batch.commands)
// The owning host establishes Core/window/loading state and restores native defaults.
binding.commit(() => { prepared.commit() })
```

iOS Mason defers each native insert until the child loads and consumes the child's attached-native expectation at that deferred insert point: the pre-attached native object is verified against the parent's `subviews` order, `addViewAt` is skipped, and Mason's foreign-child adoption and measurement still run. Commit requires the host to be set up and loaded first, otherwise inserts stay queued and commit fails loudly. `releaseIOSMasonOwners` and `releaseIOSMasonTree` own the same teardown boundary as Android; the tree release also discards queued pending adds through `discardPendingNativeAdds` after a failed insertion. Expectation cleanup, failure handling and retire semantics match the Android contract.

The adapter depends on the same local-fork Mason adoption API as Android. The maintained iOS controls supply Core9.1.3 and the local beta.10 Mason package; an npm version alone does not establish compatibility. Window/lifecycle ownership, launch checks, the mount default journal and failure recovery remain with the host.

## App startup entry

`@octane-xplat/native-prerender/startup` exports `renderWithStartup(host, component, props?, startup?)`, the opt-in replacement for `renderNativeScriptApp` in a real app entry. `host` is the entry `Page` (a `ContentView`); `startup` carries the decoded `startup.json` artifact, the producer's stylesheet texts and an `onOutcome` sink. Platform file resolution picks `render.ios.js`/`render.android.js`; the shared transaction lives in `platforms/startup/shared.js`.

```ts
renderWithStartup(page, Screen, {}, {
  artifact: startup,   // parsed startup.json; revalidated at the entry
  sheets,              // producer-emitted stylesheet texts
  onOutcome: writeReceipt,
})
```

The entry owns preflight → one ownership transfer → fallback. When the installed mount unit already mounted a cold tree and every check passes — artifact schema and build identity, launch constraints, `selectLaunchTree` against the same persisted inputs and appearance read, a canonical sorted-key bind that must equal the native mount's published bind byte-for-byte, `bindIOSMasonTree`/`bindAndroidMasonTree` preflight, `prepareFirstFrame` + `claims.match` and the loaded-host commit — the live tree claims the mounted natives and `outcome` resolves `adopted: true` with the claims, wrappers, natives and selected tree. ANY rejection — absent artifact, native rejection, theme or bind divergence, unreadable handoff, prepared-tree mismatch or commit failure — detaches the cold mount and renders ordinarily through `renderNativeScriptApp`; `outcome` resolves `adopted: false` with a `reason`. The mount is claimed at most once per process, and calling without `startup` (or without a mount) is ordinary rendering at zero startup cost.

The installable mount units live under `platforms/` and are copied into the opting app's native sources; they are not a CocoaPods/Gradle dependency yet:

- iOS: copy `StartupBootstrap.swift` into `ios.NativeSource` as `main.swift`, plus `StartupArtifact.swift`, `MasonArtifact.swift`, `FontLowering.{h,m}`, `MasonMount.{h,m}` and `MountHost.{h,m}` with a modulemap; set `NS_SWIFTUI_BOOT = 1`, the `SWIFT_OBJC_BRIDGING_HEADER`, and the producer build hash as `XplatStartupBuildHash` in Info.plist. The scene mounts before `NativeScriptStart.setup()` and publishes window, theme, bind, mount, viewport and any rejection through `PrerenderMountHost`.
- Android: place `StartupArtifact.java`, `MasonArtifact.java`, `MasonMount.java`, `StartupApplication.java` and `StartupMountActivity.java` under `App_Resources/Android/src/main/java/org/octanexplat/prerender`, declare `StartupApplication` as `android:name` and `StartupMountActivity` as the launcher activity, and emit the producer build hash as the `xplat_startup_build` string resource. The activity defers `NativeScriptApplication.onCreate` until the cold mount draws, then the entry's bridge replays the Core lifecycle onto it.

The qualification [normal-app control](../../tools/platform-qualification/native-prerender/README.md#normal-app-startup-control) exercises this exact entry and these units in a real CLI-built app. A `startup.config.json` in the app directory is the producer opt-in; `produceNativeStartup` writes `startup.bin`/`startup.json`/`sheets.json` the app ships beside its bundle. No packaged artifact means the stock entry costs nothing and renders ordinarily.

## Candidate artifact contract

The owning declarations are [schema.ts](src/schema.ts). The candidate `mason-label-v1` contract supports Mason containers, Labels and their logical text children, placeholder boxes for bounded unsupported leaf hosts, one deterministic seed object, light/dark AOT styles and bounded launch constraints. A placeholder (`activityindicator` for `Spinner`, `svgview` for `Icon`, `image` for `Image`) must be a leaf with a bounded prop set and an authored numeric width and height in every theme; its visual record mounts an empty Mason box that the live host replaces at hydration — the claims adapter returns `undefined` for it and counts it under `replacedCount` instead of `claimedCount`. Other unsupported hosts still fail production until they get their own placeholder entry. Numeric style lengths use the native host's logical points/DIPs; style keys retain their property-specific units. A bounded grid subset admits the loading `Button` overlay cell: `display: grid`, single-`1fr` row/column templates, `gridRow`/`gridColumn: 1` and `justifySelf`/`alignSelf` limited to `stretch`/`center`; other grid and self-alignment values fail validation. The create-template starter adds the bounded text/border subset it resolves: `textAlign` limited to `left`/`center`/`right` (broader alignments such as `justify` reject), `borderWidth` any nonnegative finite number, and `borderColor`/`color`/`backgroundColor` as `#rrggbb` or `rgba(r, g, b, a)`. The IR carries border longhands only — no border style — so a Mason view paints an edge only where live's buffer also has a non-none style; foreign leaves paint their own border on the native label. Final native value/asset/font applicability must be checked by the owning backend before allocation. Structural validation alone does not qualify a native setter or CSS parity.

Each logical text slot stores the exact display string produced by JavaScript during preparation. Numbers, booleans and empty values are normalized there; native readers never reproduce JavaScript number formatting. The initial seed retains its original types, and matching still checks each text slot separately.

```ts
const text = projectPreparedTree([
  { op: 'create', id: 1, type: 'label', props: {} },
  { op: 'create', id: 2, type: '#text', props: { value: 1e21 } },
  { op: 'insert', id: 2, parent: 1, before: null },
  { op: 'insert', id: 1, parent: null, before: null },
])
// text.nodes[1].props.value === '1e+21'
```

```ts
import { validateArtifact } from '@octane-xplat/native-prerender'

const artifact = validateArtifact({
  version: 1,
  platform: 'android',
  hostContract: 'mason-label-v1',
  build: 'ab'.repeat(32),
  seed: { title: 'Welcome' },
  constraints: [{ input: 'fontScale', equals: 1 }],
  nodes: [
    { index: 0, path: '0', parent: null, kind: 'label', props: { text: 'Welcome' } },
  ],
  variants: {
    light: [{ node: 0, style: { color: '#172033' }, cssKeys: ['color'], inheritedKeys: [] }],
    dark: [{ node: 0, style: { color: '#ffffff' }, cssKeys: ['color'], inheritedKeys: [] }],
  },
})
```

Launch constraints are data evaluated by the native host before mounting: font scale1, reduced-motion equality and inclusive width/height intervals. Unsupported inputs select ordinary rendering. The mobile producer currently accepts only positive screen/all and light/dark color-scheme media queries, plus the exact positive `(hover: hover)` query fixed to false to match Core. It rejects dimension, orientation, reduced-motion and other media inputs: Core9.1.3 evaluates screen dimensions in physical pixels and omits reduced motion, while the portable resolver receives logical viewport dimensions. Exact logical guards alone cannot establish live CSS parity. Mason uses the actual native viewport for eligible artifacts. Unsupported computed style values still fail backend preflight. This does not yet generalize responsive CSS into wider intervals or a native expression program.

```ts
import { checkLaunchEnvironment } from '@octane-xplat/native-prerender'

const result = checkLaunchEnvironment(artifact, {
  platform: 'android', fontScale: 1.3, width: 402, height: 874, reducedMotion: false,
})
// { supported: false, input: 'fontScale' }
```

Declared `launchInputs` select the logical tree itself, beyond constraint predicates: each names a persisted `appSettings.string` read (the `ApplicationSettings`/`storage.getString` store) with up to four declared values and a `default` for absent keys. Every layered tree also binds the reserved implicit input `systemAppearance` — the OS appearance read (`light`/`dark`), never a persisted key, so a declared input may not use that name and it has no declared default. The producer renders one tree per point of the declared product — including the absent-key point when `default` is `null`, at most four declared binds — crossed with light/dark, at most eight trees, and the artifact carries `launchInputs` plus per-bind `{ bind, nodes, variant }` trees whose single `variant` holds the style records for `bind.systemAppearance`. `selectLaunchTree` (and the equivalent Swift/Java `selectIndex`) resolves the stored values and the appearance read through one resolver and returns the exact matching tree or `null`; a stored value outside the declared domain, or an absent/out-of-domain appearance, never selects another tree — callers must fall back to JavaScript boot. Appearance-dependent initial props or topology therefore emit scheme-split trees; artifacts without divergence and without declared inputs keep the flat `{ nodes, variants: { light, dark } }` shape byte-for-byte.

```ts
import { selectLaunchTree } from '@octane-xplat/native-prerender'

const tree = selectLaunchTree(artifact, (name) =>
  ApplicationSettings.hasKey(name) ? ApplicationSettings.getString(name) : null,
)
// tree === null → ordinary JavaScript boot; otherwise hydrate against tree.nodes
```

## Binary and development JSON

The Node-only `./codec` entry writes XPI1 and a readable JSON form using the same logical validation. Both require the installed app's exact build identity and platform when read. The checksum detects corruption; it does not authenticate a server response.

```ts
import {
  encodeStartupArtifact, decodeStartupArtifact, writeStartupJson, readStartupJson,
} from '@octane-xplat/native-prerender/codec'

const expected = { build: artifact.build, platform: artifact.platform }
const binary = encodeStartupArtifact(artifact)
const decoded = decodeStartupArtifact(binary, expected)
const debug = writeStartupJson(decoded)
const inspected = readStartupJson(debug, expected)
```

XPI1 has an 80-byte little-endian header: four magic bytes, a 16-bit version, 16-bit required flags (bit 0 marks a `launchInputs`/`trees` payload; flat artifacts keep zero), 32-bit total byte length, 32-bit logical node count (all trees' nodes when layered), 32-byte build identity and 32-byte payload SHA-256. Its payload is a tagged binary value tree, not JSON text or a native struct. Tags 0–6 encode null, false, true, finite float64, UTF-8 string, array and object. Strings/counts are 32-bit length-prefixed; object keys use sorted UTF-16 order and must be unique. Numbers normalize negative zero to zero.

Binary input is limited to 1MiB, 1024 logical nodes, 64 tree levels, 100000 binary values and 65536 UTF-8 bytes per string. Literal data has additional collection/depth bounds. Pretty JSON has a separate 8MiB byte limit to accommodate indentation and must still fit the binary limits. Unknown fields, flags, host kinds, properties, broken references, nonportable values and malformed bytes fail before mounting. `./codec` is for build/inspection hosts and must not be imported into the native app runtime.

The [platform qualification fixture](../../tools/platform-qualification/native-prerender/README.md) consumes XPI1 on iOS/Android and uses full logical matching before claims. The producer writes one wire format and its matching development JSON. These experimental hosts are separate from normal app startup wiring.

## Native readers

[Swift](platforms/ios/StartupArtifact.swift) and [Java](platforms/android/java/org/octanexplat/prerender/StartupArtifact.java) independently decode XPI1 without a JS runtime or UI engine. Each returns the complete logical snapshot, derives visual records and evaluates the launch constraints. Backend applicability checks remain separate and must finish before allocating native views. Swift uses `NSDictionary` for arbitrary seed objects so composed and decomposed Unicode keys retain their distinct JavaScript meanings.

```java
StartupArtifact.Snapshot snapshot = StartupArtifact.decode(bytes, installedBuild, "android");
if (snapshot.supports(fontScale, width, height, reducedMotion)) {
    List<Map<String, Object>> visual = snapshot.visualNodes();
    // Preflight backend values/fonts before mounting these records.
}
```

The adjacent `MasonArtifact` adapters preflight supported native setter values in both themes and retain the complete snapshot alongside its visual projection. They impose no Home seed or node-count contract. Owning-scale conversion, font availability and actual native allocation remain mounting responsibilities.

```java
MasonArtifact.Artifact artifact = MasonArtifact.decode(bytes, installedBuild);
// Native mount preflight must still check the owning device's density/fonts.
```

## Native Mason mounting

The platform `MasonMount` sources create the supported container/Label tree without a JS runtime. They contain no Home seed, node count or element-index policy. Hosts own the viewport, check launch constraints against its actual logical dimensions, and retain responsibility for window attachment, adoption and disposal. The current CSS/font subset remains deliberately bounded.

On Android, prepare checks both themes, supported system font stacks and density conversion before allocating artifact views. Mount synchronously into an empty caller-owned Mason viewport on the UI thread. The result exposes native views in visual-index order and the default-value journal needed before live wrappers capture native defaults.

```java
MasonMount.Prepared prepared = MasonMount.prepare(activity, artifact, theme);
MasonMount tree = prepared.mount(viewport);
// Before attaching live NativeScript wrappers:
tree.restoreDefaults();
```

The iOS mount consumes the projection from `XplatMasonArtifact.decode`, checks scaled lengths in both themes before allocation, and returns an `XplatMasonMount` instance. Its `views` array exposes every native view in visual-index order with `root` at index zero, and `restoreDefaults` replays the captured border-radius/font/text-color journal once. The host attaches `root` to its own viewport. The Home observation helpers are separate qualification code.

```swift
let decoded = try XplatMasonArtifact.decode(data, expectedBuildHash: installedBuild)
let mount = XplatMasonMount(decoded.value, theme: theme, scale: window.screen.scale)
viewport.addView(mount.root)
// Before attaching live NativeScript wrappers:
mount.restoreDefaults()
```

## Verification

```sh
bun turbo run typecheck test --filter=...@octane-xplat/native-prerender
bun turbo run probe:prerender:home:produce --filter=@xplat/platform-qualification

# Host-native parser checks, under the native build reservation:
XPLAT_PRERENDER_JAVA_HOME=/path/to/jdk17 \
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Native startup codec checks"}' -- \
bun turbo run test:codec:native --filter=@octane-xplat/native-prerender
```

The native task compiles both readers and runs the same interoperability/corruption corpus. Set `XPLAT_HOME_CODEC_PRODUCER` to a current Home producer output directory to include its actual JSX artifact. These are host-native decoding checks; mobile rendering, hydration, ownership, first display and first working input require their separate platform qualifications.
