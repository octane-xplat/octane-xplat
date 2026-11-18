# Native startup build worker

This private Node package compiles a configured Octane component into the [native startup artifact](../native-prerender/README.md). It is the compiler boundary for upcoming app integration. It does not install a native host, change an app's entry point or provide request-isolated SSR.

The selected project supplies Vite, Octane and the actual UI sources. Declare `@octane-xplat/ui`, `@octane-xplat/lib`, `@octane-xplat/icons`, `octane`, `@tsrx/oxc` and `vite` in that project, plus its native preset package: `@octane-xplat/build` or `@octane-xplat/cli`. The worker owns its portable IR and CSS-engine dependencies. A declared build package takes precedence over CLI; a broken declared package fails rather than falling back to another installation.

```js
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { produceNativeStartup } from '@octane-xplat/native-prerender-build'

const result = await produceNativeStartup({
  projectDir: process.cwd(),
  configurationFile: 'startup.json',
  outputDir: mkdtempSync(join(tmpdir(), 'native-startup-')),
  platform: 'android',
})
console.log(result.directory, result.manifest.buildHash)
```

The JSON configuration names the component export, deterministic initial data and explicit launch facts. The entry resolves relative to this configuration file. Select a component module that can prepare without native allocations or service access; do not select the app's boot entry.

```json
{
  "version": 1,
  "entry": "./src/Startup.tsrx",
  "exportName": "Startup",
  "seed": { "title": "Welcome" },
  "environment": { "width": 402, "height": 874, "reducedMotion": false }
}
```

```tsx
import { Text, VStack } from '@octane-xplat/ui'

export function Startup(props: { title: string }) {
  return <VStack><Text>{props.title}</Text></VStack>
}
```

The output directory must be new or empty. One producer reserves it before asynchronous work starts; another producer cannot overwrite it. Failures retain their partial output for diagnosis. Results include XPI1 `startup.bin`, development `startup.json`, visual/style projection `resolved.json`, normalized `sheets.json`, prepared logical trees and a source/bundle manifest. The identity covers normalized stylesheet bytes as well as source and bundle hashes. Native packaging must additionally bind the installed JS/native/SDK inputs and verify producer sources are still current.

```js
import { readFileSync } from 'node:fs'
import { decodeStartupArtifact } from '@octane-xplat/native-prerender/codec'

const artifact = decodeStartupArtifact(readFileSync(join(result.directory, 'startup.bin')), {
  platform: 'android', build: result.manifest.buildHash,
})
console.log(artifact.nodes.length)
```

The render host currently exposes the actual installed `Button`, `Pressable`, `View`, `Text`, `VStack`, `HStack`, `SafeArea`, `Screen`, `ScrollableArea`, `Spinner` and `Icon` implementations through an explicit build-only facade. It depends on their qualified source layout at UI0.20.0. It does not evaluate the full UI barrel or infer arbitrary component eligibility. App Vite configuration and environment files are not loaded. Refs/effects are not committed, native services fail if used, and theme-dependent initial topology is rejected. These boundaries remain separate from normal Vite preset/host installation.

Both light and dark variants use the portable cascade, with mobile media behavior explicitly bounded to the qualified Core9.1.3 inputs. Unsupported queries, values and host kinds fail rather than being silently omitted. See [adoption boundaries](../../.agents/docs/native-prerender-adoption.md) for units, native lifetime and the shared-module requirement.

Relative CSS side-effect imports use the selected native preset's platform sibling selection and `@platform` filtering before normalization. CSS `@import`, package CSS imports and query imports such as `./screen.css?inline` are rejected; import each local stylesheet from the component module instead. The manifest records both source hashes and absent platform-resolution candidates. Native packaging must reject an artifact if a recorded source changes or a previously absent candidate appears.

```js
import './screen.css'
// Android selects screen.android.css when present; iOS selects screen.ios.css.
```

Run package contracts and the outside-checkout packed consumer separately. The packed consumer uses actual package archives and the managed Octane patch, asserts that all recorded inputs belong to its installed tree, exercises both mobile leaves and rejects dimensional media queries. It establishes compiler packaging, not native runtime behavior or a release prepack of its unchanged peers.

```sh
bun turbo run typecheck test --filter=...@octane-xplat/native-prerender-build
bun turbo run test:prerender:packed --filter=@xplat/platform-qualification
```
