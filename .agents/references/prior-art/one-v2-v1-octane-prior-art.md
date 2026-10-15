# One v2.6.2 versus v1.27.1: prior art for Octane Xplat

One v2’s largest change is **owning native UI, services, and native-source interoperability inside the framework**. It adds SwiftUI/Compose hosts and Nitro/JSI services around React Native; it does not replace React Native with a new renderer. For Octane, the strongest research leads are typed native-source imports, SDK-derived bindings, and explicit synchronization between native controls and JavaScript. Its platform-authentic approach is useful precedent, but does not establish Octane’s shared pixel-parity contract.

This report compares the exact requested tags, using public source and official product material. It recommends areas to study, not implementation or dependency adoption.

## Identity and exact revisions

The requested product is **One**, the React Native/Vite framework at [onestack.dev](https://onestack.dev/), linked to [onejs/one](https://github.com/onejs/one). It is unrelated to the Unity product at onejs.com/Singtaa/OneJS.

| Revision | Resolved commit | Commit timestamp |
|---|---|---|
| [v1.27.1 release](https://github.com/onejs/one/releases/tag/v1.27.1) | [`6bb03aaa0106233a5dd3397895422ca67adff81d`](https://github.com/onejs/one/tree/6bb03aaa0106233a5dd3397895422ca67adff81d) | September 14, 2026 |
| [v2.6.2 release](https://github.com/onejs/one/releases/tag/v2.6.2) | [`f9cc3da0ed64675bd35e552d0d934a59ed9f1527`](https://github.com/onejs/one/tree/f9cc3da0ed64675bd35e552d0d934a59ed9f1527) | October 13, 2026, 01:39 UTC; October 12 in New York |

Both tags resolve directly to commits, and v1.27.1 is an ancestor of v2.6.2. [Exact endpoint comparison](https://github.com/onejs/one/compare/6bb03aaa0106233a5dd3397895422ca67adff81d...f9cc3da0ed64675bd35e552d0d934a59ed9f1527).

Announcement qualification: the [official v2 announcement source at the exact tag][announcement] is dated October 12 but marked `draft: true`. The live [blog index](https://onestack.dev/blog) exposed only the v1 post, and the v2 post URL was inaccessible during research. The live homepage and native docs advertise the new product; the release exists. Publication of a specific “announced today” post was not independently confirmed. v2.6.2’s own release notes mostly describe release automation, the homepage, templates, dependencies, and a Cloudflare range-request fix—not the whole v1-to-v2 transition.

## Compact comparison

| Area | v1.27.1 | v2.6.2 |
|---|---|---|
| Runtime/rendering | React 19.2.3; RN peer ^0.86.0; existing Vite/Rolldown native pipeline | React 19.2.3 retained; RN peer ^0.87.0; Fabric native hosts plus Nitro services |
| Native UI | RN/community components, separate optional native-tabs integration | `One.iOS`, `One.Android`, `One.UI`; SwiftUI and Compose embedded beside RN |
| Native source | No new v2 Swift/Kotlin import plugins | Typed `.swift`/`.kt` imports, generated glue, contract hashes and events |
| State/events | Existing React/RN state model | Native-owned scalar handles shared with UI worklets; revision/event-count acknowledgment |
| Native setup | Expo integrations; rudimentary non-Expo generator already exists | Typed `native.app` manifest, expanded generation/autolinking; Expo adapter remains |
| Distribution | Primarily JS framework; native features external | Same `one` package now ships Swift/Kotlin/C++/Nitrogen sources and native pod/module |
| Platform scope | Web, iOS, Android framework | Same core targets; OS-specific APIs and explicit web limitations, not desktop parity |

The package metadata and exports establish these dependency/distribution changes: [v1 package][pkg1], [v2 package][pkg2].

## Main changes, ranked by significance

**1. Native-source imports become a typed extension boundary.** Vite plugins parse Swift/Kotlin contracts, generate declarations and JS wrappers, and feed native project generation. Module calls use promises and JSON payloads through a Nitro object; view callbacks use generated event wiring. This removes app-side registration boilerplate, not serialization or native compilation. Native compares the wrapper’s contract hash with the linked dispatcher and rejects mismatches as `E_NATIVE_SOURCE_REBUILD`. Swift modules run through a main-actor dispatcher; this is not automatically background execution. [Swift plugin/wrapper][swift], [Kotlin wrapper][kotlin], [wire generation][wires], [native call transport][sourcecall], [native hash check][hashcheck].

A typed import is the new user-facing boundary; this example assumes the app’s Swift package defines the public module and method:

```ts
import { Device } from './native/Showcase/Device.swift'

export async function hashGreeting(): Promise<string> {
  return Device.sha256('hello')
}
```

The parser recognizes `PeachModule` in Swift and `OneModule` in Kotlin. Swift views have constrained public memberwise construction; Kotlin composables have constrained parameters/defaults. Unsupported signatures fail rather than silently becoming untyped calls. SwiftPM package dependencies are explicitly unsupported in the tagged guide. Native edits still require prebuild/rebuild; Expo users must enable the native-source adapter. [Contract parser][parser], [tagged source guide][sourceguide].

**2. Native UI becomes a framework-owned layer, with SDK generation on iOS.** `One` was previously exported as a router type namespace; the root now exports a runtime object and named hooks. Its iOS namespace aggregates SwiftUI components, Android aggregates Compose, and UI aggregates shared components. Fabric hosts embed native content inside RN’s tree, leaving React/RN responsible for surrounding navigation and layout. This is host integration, not a second general React reconciler. [Root exports][index], [namespace construction][one], [iOS host][ioshost], [Android host][androidhost].

SwiftUI generation extracts SDK declarations, derives representable signatures, and uses hand-authored overrides for bindings, child builders, generics, and layout semantics. Availability guards and a pinned SDK ceiling keep output reproducible. The tagged generator targets SDK 27 with an iOS deployment floor of 17. Compose has substantial authored adapters and Kotlin implementation; this inspection did not establish an equivalent general Compose SDK derivation pipeline. [Generator][generator], [derivation rules][derive], [Compose adapter][compose], [pod packaging][pod].

The announcement’s “100%” access claim includes the escape hatch of writing native source. It should not be read as every SDK overload being available as a built-in typed JSX component. The generator README reports **520/522 bound SwiftUI modifier names**, of which 517 are generated; it counts names, not overload equivalence. It also reports 34 mapped views, and the coverage code warns that its struct inventory is not a view-parity denominator. Those are upstream recorded results, not measurements rerun here. [Coverage explanation][genreadme], [coverage algorithm][coverage].

**3. Control synchronization is explicit and partly bypasses React rendering.** A new state handle uses native registry IDs and synchronous JSI reads/writes installed in RN and the Worklets UI runtime. SwiftUI/Compose can observe the same underlying value; React subscribes for rendering. Controlled components also carry a revision and monotonically increasing event count, discard old events, and acknowledge accepted edits. [State/store][store], [JSI installation][jsi], [controlled-event filter][controlled], [generated Toggle adapter][controls].

```tsx
// A v2 iOS component; use an iOS-specific file.
import { One, useNativeState } from 'one'

export function NotificationSetting() {
  const enabled = useNativeState(false)
  return (
    <One.iOS.Toggle
      label="Notifications"
      isOn={enabled}
      onIsOnChange={(next) => enabled.set(next)}
    />
  )
}
```

Important limitation: `useNativeState<T>` looks generic, but the inspected iOS JSI conversion accepts only strings, numbers, and booleans. Web uses an in-memory host. Release is manual: there is no hook unmount cleanup, deliberately avoiding StrictMode remount destruction. These are real lifecycle/type constraints to examine before borrowing the pattern. Avoiding some React round trips plausibly improves interactive latency, but no latency improvement was measured in this research. [Generic hook][statehook], [native scalar conversion][syncmodule], [ownership contract][syncnative], [web implementation][memoryhost].

**4. Setup and services move into One, reducing required Expo coupling.** The new typed `native.app` field describes identifiers, permissions and native capabilities; prebuild expands into native-source compilation and service configuration. The package adds native autolinking and owns a large native service collection, including updates, storage, haptics and streaming fetch. It removes direct `expo-linking`, `expo-modules-core`, and `babel-preset-expo` dependencies; native linking now uses RN Linking. Expo prebuild/modules remain a supported alternate path. [Typed options][options2], [native manifest][manifest], [prebuild][prebuild2], [linking change][linking], [haptics implementation][haptics], [updates implementation][updates].

For a v1 application already using Expo Clipboard, this is an optional provider migration—not a mandatory rename of an old One API:

```ts
// Before: the application's Expo provider.
import * as Clipboard from 'expo-clipboard'
export const copy = (text: string) => Clipboard.setStringAsync(text)
```

```ts
// After: One's new provider.
import { One } from 'one'
export const copy = (text: string) => One.Clipboard.setString(text)
```

The [official Expo migration guide](https://onestack.dev/native/migrating-to-one) lists differences and missing equivalents. The new fetch implementation is especially relevant to streamed AI responses: its native adapter exposes incremental response bodies and preserves native blob/form-data integration. Source inspection supports that mechanism, not throughput, memory, or device compatibility claims. [Fetch adapter][fetch], [iOS networking implementation][fetchswift].

**5. Navigation and layout ownership become more explicitly native.** The old optional `one/native-tabs` entry disappears. Native `Tabs` now integrates React Navigation 8 alpha bottom tabs and rejects `Tabs.Screen.options.href`, directing native users to route names and web-specific layouts. Stack toolbars get built-in compositional descriptors and hosting instead of the old registration subpath. Bottom Stack toolbars still render nothing outside iOS. [Old NativeTabs][tabs1], [new Tabs][tabs2], [href rejection][tabsoptions], [toolbar][toolbar].

Native content has separate layout/style contracts: RN `style` defines outer host bounds, while `swiftStyle`/`composeStyle` controls native content. Measured SwiftUI hosts push their natural height back into Yoga while retaining parent-owned width. Imported Compose content measures within outer constraints, reports changes, and drops callbacks from detached/replaced views. This is valuable evidence about the difficult seam between two layout engines. [Measured shadow node][measured], [Compose host][androidhost], [style transport][styles].

**6. The existing bundling pipeline is hardened, not newly invented here.** v1.27.1 already specified Vite/Rolldown native dev, Oxc/no-Babel defaults, Metro as an alternative, and Rolldown production. v2 adds native-source/background-computation plugins, Hermes compatibility transforms, and an iOS dev bytecode path resolved against the app’s actual pod compiler. Oxc is not the only compiler: SWC still lowers Hermes classes, and configured Babel transforms remain supported. [v1 options][options1], [v1 dev engine][engine1], [v2 engine][engine2], [class lowering][classes], [dev bytecode compiler][bytecode].

The new background computation layer uses a worker on web and a Worklets runtime on native, keeps one pending latest input, and suppresses stale results. Running work is not preemptively cancelled; native work is globally serialized and calculations must be synchronous. [Latest-result scheduler][latest], [native executor][executor], [web executor][webexecutor].

## Breaking changes and migration checks

| Check | Exact source finding |
|---|---|
| Dependencies | RN ^0.86 → ^0.87; React unchanged; navigation 7 → pinned 8 alpha peers; gesture-handler ≥2 → ≥3; Worklets ≥0.7 → ≥0.12.2. Read the actual tagged peers, not older beta prose. |
| Removed package exports | `one/expo-plugin`, `one/react-native-commands`, `one/native-tabs`, `one/stack-toolbar-implementation`. The Expo adapter remains under `vxrn/expo-plugin`; the new One config adapter is `one/react-native-config`. |
| Native tabs | Replace the removed separate NativeTabs entry with the routed Tabs layer as appropriate; native `href` options now throw. Verify changed native/tab-bar behavior. |
| Toolbar types/integration | Old implementation registration is gone; root `StackToolbarConfig` and `StackToolbarViewProps` exports disappear. Existing toolbar users need source/type review. |
| Safe areas | Root safe-area exports now come from One’s implementation; the separate `@vxrn/safe-area` workspace package is absorbed. Similar names do not prove identical provider identity or third-party context behavior. |
| Router typing | Root no longer re-exports the old `One` router type namespace; `OneRouter` remains. `NavigationRef` changes from augmented RootParamList to ParamListBase. Check consumers of these types. |
| Native binary | New components/services require a custom native build and New Architecture; Expo Go cannot supply missing code. New source/capabilities and mismatched OTA/native contracts require rebuilds. |

Evidence: [v1 exports/peers][pkg1], [v2 exports/peers][pkg2], [v2 root exports][index], [router interfaces][routertypes], [safe-area source][safearea], [current setup](https://onestack.dev/docs/native-setup).

## Surprising findings and evidence limits

- **The exact v1 baseline is more advanced than “v1 versus v2” marketing implies.** Rolldown, React 19, Vite 8 and a non-Expo generator predate this comparison. [v1 generator][prebuild1] is concrete evidence; v2 makes that workflow substantially more complete.
- **Native UI availability is not cross-platform equivalence.** Current official [platform notes](https://onestack.dev/docs/native-platforms) distinguish OS-only components, inert/null web implementations and throwing features. iOS 17 is the package floor; individual APIs require newer OS versions. One’s `OnePlatform` type covers web/iOS/Android, not macOS/Windows/Linux native renderers. [Tagged platform type][one].
- **Native-bound state has a narrower runtime domain than its TS generic suggests.** Its manual release policy is also consequential for ownership and long-lived screens. [Native conversion][syncmodule], [release contract][syncnative].
- **Raw churn is not architecture scale.** Endpoint diff: 5,601 files, +525,152/−18,210 lines. Coarse path classification identifies 1,412 Nitrogen-generated files (+119,242), 823 declaration files (+23,346), and 188 Swift/UI generated/schema files (+42,877). Another 1,117 files fall under tests/native fixtures/captures (+109,504). These categories account for roughly 56% of additions; remaining files include other generated content and must not all be called authored. Git warned that exhaustive rename detection was skipped. Vendor provenance for blur/edge fade is explicitly recorded separately. [Vendoring record][vendoring].
- **Performance claims remain upstream claims.** The live homepage advertises 5.4× Metro cold-bundle speed from 3.6s versus 19.5s on one production iOS app. No matched v1.27.1/v2.6.2 benchmark was run or established here. JSI synchronization, streaming fetch, incremental bundling and bytecode caching suggest mechanisms worth measuring, not demonstrated end-to-end gains.
- **Tests are evidence of intended contracts, not a fresh qualification.** The repository contains native conformance fixtures and recorded evidence; none were run, and no capture/image was inspected. [Runner contracts][runner].

## Strongest ideas for Octane, with tradeoffs

| Research lead | Why it fits Octane | Tradeoff / decision it informs |
|---|---|---|
| Typed native-source imports plus binary contract hashes | Could reduce boilerplate for leaf-owned native extensions and reject mismatched JavaScript/native deployments clearly | Requires parsers, wire contracts, host integration and rebuild tracking; One’s JSON/promise boundary is unsuitable for zero-copy/high-frequency work without a separate path |
| SDK derivation with semantic overrides and availability metadata | A promising way to expand platform-authentic entry points while preserving real SDK names and explicit availability | Signatures cannot infer ownership, child slots, layout or event meaning; generated name counts must never stand in for parity tests |
| Revision/event acknowledgments and native-owned state | Useful prior art for controlled inputs, delayed event delivery and gesture/native state synchronization | Does not transfer directly to Octane signals; lifecycle cleanup, scalar limits, concurrency and renderer subscriptions need independent proof |
| Explicit outer-layout versus native-content ownership | Relevant to NativeScript/AppKit hosting and any future SwiftUI/Compose leaf; measured-axis ownership avoids circular sizing | Two layout engines create timing, intrinsic-size and accessibility obligations; platform-authentic appearance still differs from shared pixel parity |
| Latest-input background work and stale-result rejection | Useful for search, filtering or other bursty computations across web/native | Native queue is serialized, active computations are not preempted, and worklet restrictions differ from a web worker |

Octane already separates shared normalized UI from OS-authentic subpaths, keeps platform divergence at file boundaries, and assigns native plugin/system costs to leaf packages. One’s monolithic native distribution is therefore a precedent to evaluate, not a packaging model to copy. Octane context came from the project’s repository orientation and implementation invariants; no unrelated code audit or architecture commitment was made.

## Method and scope

Public repo fetched into an isolated `/tmp` checkout; exact refs resolved with Git; endpoint tree diffs inspected; a focused sem diff identified changed entities in package exports, root exports, Stack and Tabs. Authored hosts, generators, native transport, state, compile paths and migration contracts were read directly. Official live homepage, release pages, blog index and native docs were checked separately because those can drift beyond the tag. Report examples passed TypeScript syntax/transpilation checks only; module resolution and runtime behavior were not tested. No dependency installation, native build, device run, screenshot/image analysis, vendoring, project source edit, or commit. No recipe is affected because this is research only.

[announcement]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/apps/onestack.dev/data/blog/version-two.mdx
[pkg1]: https://github.com/onejs/one/blob/6bb03aaa0106233a5dd3397895422ca67adff81d/packages/one/package.json
[pkg2]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/package.json
[swift]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/vite/plugins/swiftPackageModule.ts
[kotlin]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/vite/plugins/kotlinSourceModule.ts
[wires]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/vite/plugins/nativeSourceWires.ts
[sourcecall]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/native-source/index.native.ts
[hashcheck]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/ios/Nitro/HybridOneNativeModules.swift
[parser]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/vxrn/src/utils/nativeSourceContract.ts
[sourceguide]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/apps/onestack.dev/data/docs/native-source.mdx
[index]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/index.ts
[one]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/one.ts
[ioshost]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/ios/OneSwiftHostComponentView.mm
[androidhost]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/android/src/main/java/dev/onejs/one/OneKotlinHostView.kt
[generator]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/codegen/generate.ts
[derive]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/codegen/deriveSDK.ts
[compose]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/compose.android.tsx
[pod]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/One.podspec
[genreadme]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/codegen/README.md
[coverage]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/codegen/coverage.ts
[store]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/syncStore.ts
[jsi]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/cpp/OneNativeSyncHost.cpp
[controlled]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/controlled.ts
[controls]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/generated/Controls.native.tsx
[statehook]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/syncNativeState.ts
[syncmodule]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/ios/OneNativeSyncModule.mm
[syncnative]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/syncNative.ts
[memoryhost]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/syncMemoryHost.ts
[options2]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/vite/types.ts
[manifest]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/native/appManifest.ts
[prebuild2]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/vxrn/src/exports/prebuildWithoutExpo.ts
[linking]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/link/linking.native.ts
[haptics]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/haptics/index.native.ts
[updates]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/updates/index.native.ts
[fetch]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/fetch/index.native.ts
[fetchswift]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/ios/Nitro/HybridOneFetch.swift
[tabs1]: https://github.com/onejs/one/blob/6bb03aaa0106233a5dd3397895422ca67adff81d/packages/one/src/layouts/NativeTabs.tsx
[tabs2]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/layouts/Tabs.tsx
[tabsoptions]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/layouts/nativeTabsOptions.ts
[toolbar]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/layouts/stack-utils/StackToolbar.tsx
[measured]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/cpp/OneNativeMeasuredShadowNode.h
[styles]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/generated/swiftStyleNative.ts
[options1]: https://github.com/onejs/one/blob/6bb03aaa0106233a5dd3397895422ca67adff81d/packages/one/src/vite/types.ts
[engine1]: https://github.com/onejs/one/blob/6bb03aaa0106233a5dd3397895422ca67adff81d/packages/vxrn/src/utils/createNativeDevEngine.ts
[engine2]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/vxrn/src/utils/createNativeDevEngine.ts
[classes]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/compiler/src/transformHermesClasses.ts
[bytecode]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/vxrn/src/utils/compileNativeDevBytecode.ts
[latest]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/background/createLatestComputation.ts
[executor]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/background/executor.native.ts
[webexecutor]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/background/web.ts
[routertypes]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/interfaces/router.ts
[safearea]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/safe-area-context/SafeAreaContext.tsx
[prebuild1]: https://github.com/onejs/one/blob/6bb03aaa0106233a5dd3397895422ca67adff81d/packages/vxrn/src/exports/prebuildWithoutExpo.ts
[vendoring]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/packages/one/src/platform/VENDORING.md
[runner]: https://github.com/onejs/one/blob/f9cc3da0ed64675bd35e552d0d934a59ed9f1527/tests/native-features/scripts/README.md
