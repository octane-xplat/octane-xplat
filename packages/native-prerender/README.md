# Native pre-render implementation

This private workspace owns the reusable startup artifact contract. Normal apps do not yet install or use it. The native readers, startup hosts and build preset must be connected and qualified before making it public.

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

## Candidate artifact contract

The owning declarations are [schema.ts](src/schema.ts). The candidate `mason-label-v1` contract supports Mason containers, Labels and their logical text children, one deterministic seed object, light/dark AOT styles and bounded launch constraints. Numeric style lengths use the native host's logical points/DIPs; style keys retain their property-specific units. Final native value/asset/font applicability must be checked by the owning backend before allocation. Structural validation alone does not qualify a native setter or CSS parity.

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

Launch constraints are data evaluated by the native host before mounting: font scale1, reduced-motion equality and inclusive width/height intervals. Unsupported inputs select ordinary rendering. The current qualification producer conservatively binds its exact CSS evaluation dimensions and motion setting; this does not yet generalize responsive CSS into wider intervals or a native expression program.

```ts
import { checkLaunchEnvironment } from '@octane-xplat/native-prerender'

const result = checkLaunchEnvironment(artifact, {
  platform: 'android', fontScale: 1.3, width: 402, height: 874, reducedMotion: false,
})
// { supported: false, input: 'fontScale' }
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

XPI1 has an 80-byte little-endian header: four magic bytes, a 16-bit version, 16-bit required flags (currently zero), 32-bit total byte length, 32-bit logical node count, 32-byte build identity and 32-byte payload SHA-256. Its payload is a tagged binary value tree, not JSON text or a native struct. Tags 0–6 encode null, false, true, finite float64, UTF-8 string, array and object. Strings/counts are 32-bit length-prefixed; object keys use sorted UTF-16 order and must be unique. Numbers normalize negative zero to zero.

Binary input is limited to 1MiB, 1024 logical nodes, 64 tree levels, 100000 binary values and 65536 UTF-8 bytes per string. Literal data has additional collection/depth bounds. Pretty JSON has a separate 8MiB byte limit to accommodate indentation and must still fit the binary limits. Unknown fields, flags, host kinds, properties, broken references, nonportable values and malformed bytes fail before mounting. `./codec` is for build/inspection hosts and must not be imported into the native app runtime.

The old XPH1 readers and physical-device fixture remain under [platform qualification](../../tools/platform-qualification/native-prerender/README.md). Its producer emits `startup.bin`/`startup.json` alongside its existing fixture output during the native-reader migration. XPI1 is not yet accepted by those native consumers.

## Verification

```sh
bun turbo run typecheck test --filter=...@octane-xplat/native-prerender
bun turbo run probe:prerender:home:produce --filter=@xplat/platform-qualification
```

These checks establish host-side structural/encoding behavior. Native decoding, rendering, hydration, ownership, first display and first working input require their separate platform qualifications.
