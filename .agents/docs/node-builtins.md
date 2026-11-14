# Experimental Node builtins

`packages/node` is a private, opt-in leaf package. Use it for framework
qualification of events, util, assert, buffer, querystring and stream. Do not
recommend installing it from npm or describe it as a full Node runtime.

## Choose the integration

Direct package imports and `requireNode` use the same cached module objects.
The registry accepts only the six exact bare names and their `node:` spellings.
Other names, including builtin subpaths, throw.

```ts
import { requireNode } from '@octane-xplat/node'
import { Buffer } from '@octane-xplat/node/buffer'

const bytes = Buffer.from('hello')
requireNode('node:buffer').Buffer === Buffer // true
```

Existing `node:*` imports and literal CJS dependency requires need the opt-in
Vite plugin. Select `native` for NativeScript, AppKit, GTK or WinUI app bundles;
the default targets web clients and leaves Node SSR on real Node builtins.
Put it alongside the host preset's plugins, not in the root build tool process.
It resolves only the six names and their `node:` spellings. `node:` subpaths
of claimed names and unported core subpaths (`assert/strict`, `stream/promises`,
`stream/web`, `stream/consumers`, `util/types`) throw; every other id falls
through to normal resolution.

```ts
import { nodeBuiltins } from '@octane-xplat/node/vite'

export default {
  plugins: [nodeBuiltins({ target: 'native' })],
}
```

Dynamic calls use the bounded registry explicitly. The optional `installNode`
adapter is limited to NativeScript hosts exposing `__nativeRequire`; it throws
elsewhere. Hook qualification is distinct from bundled-module qualification.
No Buffer/process globals are installed, and AppKit's existing Buffer/NSData
bridge is left under its current owner.

```ts
import { requireNode } from '@octane-xplat/node'

const name: string = 'node:events'
const builtin = requireNode(name) // throws if name is outside the six modules
```

## Maintain one implementation and identity

The untouched ns-node TS sources and tests are under `vendor/ns-node` with
hashes and revision provenance. The active four modules in `src/vendor` have
small ESM/scheduler adaptations. Buffer and streams use the selected upstream
dependencies; their original ns-node sources remain reference material.
The build does not use C++ raw-string generation or change runtime binaries.

`vite.engine.config.ts` bundles the runtime engine once. All facades and the
registry share its exports. Streams resolve their buffer/events imports to
the same implementations. The process scheduler is internal; it does not read
AppKit's throwing process proxy. Explicit abort-controller selection bundles
the fallback implementation instead of its browser-global-only entry.

The client resolver and Vite dependency optimizer both need the builtin map.
Keep the engine external to optimized CJS wrappers through its canonical Vite
file URL; otherwise a dependency can get empty builtin shims or a separate
constructor instance. The maintained browser check covers this through a real
CJS dependency, development serving and a production build. Preserve existing
host externalization for unclaimed modules such as AppKit's `node:fs`.

## Limits and publication gates

This is a shared experimental subset, not Node API conformance. Buffer 6.0.3
does not supply base64url encoding or all newer module-level helpers. The
vendored util/assert/querystring/events implementations retain exploration
limits; for example, querystring's `unescapeBuffer` returns a string and some
util type predicates are placeholders. The UTF-8 fallback is not a complete
streaming/invalid-input codec. Do not use the existence of an export as proof
that all Node semantics or options are supported.

Publication requires a deliberate API baseline, closing or explicitly removing
these gaps, complete source attribution, declaration review and actual host
qualification. The private package does not add globals to applications or
change the standard presets. Android, real Linux/GJS and Windows require
their own runtime checks; neither Node nor AppKit evidence qualifies them.

Keep operational results in Silo and local reports. The source comparison is
in the private prior-art study `browser-node-builtins.md` at research commit
`5ce4386a8327554c5adecc55343bf7d5415d090b`. The dependency implementations are
also directly documented by [buffer](https://github.com/feross/buffer),
[readable-stream](https://github.com/nodejs/readable-stream) and their source
licenses. This guide's integration rules do not require private research access.

## Run qualification

Run package checks through Turbo. Browser tests use installed Chromium and
capture no images; they remain outside the lightweight PR gate. The AppKit
runner uses the existing packaged JSC host and no shared desktop input.

```sh
bun run turbo run build typecheck test --filter=@octane-xplat/node
bun run turbo run test:web test:macos --filter=@octane-xplat/node
```

The iOS runner targets only the specified existing simulator, boots it if
needed, and shuts it down only if this invocation booted it. Reserve the device
and build capacity before running it; it never creates or clones a simulator.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1,"resident_devices":1,"exclusive":["ios:91D40099-A056-497D-A572-ADDDFD6A8F23"]},"purpose":"Node builtin qualification"}' -- bun run turbo run test:ios --filter=@octane-xplat/node
```
