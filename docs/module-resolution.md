# Module resolution & file conventions

> How one source tree becomes two compilations. The resolver is the mechanism
> everything else hangs off: leaf splits, platform services, route tables,
> Platform.select.
>
> **Owns:** #3 resolution toolchain · **Status:** verified mechanics (substrate
> pass) · **Blocks on:** none — remaining risk is config-level (merge ordering,
> `tsrx-tsc` honoring `moduleSuffixes`) · **Decisions:** #2, #3, #18, #23 ·
> **Validated by:** a `.ios.tsrx` leaf that resolves correctly in both builds
> and typechecks under both tsconfigs. **Lab-verified on iOS sim (Exp 6)**:
> `PlatformBadge.ios.tsrx` wins over `.native.tsrx` — `[badge] ios variant
> evaluated` logged on device. `.android > .native` is the same
> `resolve.extensions` ordering (`.android.tsrx` precedes `.native.tsrx` in
> `apps/native/vite.config.mts`) — desk-verified, device-pending (no Android
> SDK). `PlatformBadge.android.tsrx` exists as the probe for that run.
> **Typecheck caveat (measured)**: `tsrx-tsc` does NOT follow extensionless
> imports to suffixed `.tsrx` despite `moduleSuffixes` — barrels must name
> the suffix explicitly (`export { X } from './X.native.tsrx'`).
> Suffixed `.ts` helpers DO resolve extensionless under `moduleSuffixes`
> (`./platform/nav` → `nav.native.ts`/`nav.web.ts` typecheck fine). Second
> caveat (Exp 9): a `.ts` file importing a `.tsrx` component gets
> `() => Element`, not `UniversalComponent` — passing it to
> `createNativeScriptRoot().render()` needs `as unknown as UniversalComponent`.

## Suffix convention

Adopt RN/One convention, extended with our shared default:

```
Foo.ios.tsrx      iOS only
Foo.android.tsrx  Android only
Foo.native.tsrx   both native platforms
Foo.web.tsrx      web only
Foo.tsrx          shared (compiles under BOTH renderers)
```

Resolution order per build target (first match wins):

| Build | Order |
|---|---|
| web | `.web` → (none) |
| ios | `.ios` → `.native` → (none) |
| android | `.android` → `.native` → (none) |

Same order across `.tsrx`, `.tsx`, `.ts`, `.css`, `.json`, assets. Keep the
chain short — the shared file is the norm; per-OS files are for genuinely
divergent behavior (SF Symbols vs font icons, safe-area quirks).

> [!NOTE]
> Lab-verified on iOS sim (Exp 6): `PlatformBadge.ios.tsrx` wins over
> `.native.tsrx` — `[badge] ios variant evaluated` logged on device.
> `.android > .native` is the same `resolve.extensions` ordering in
> `apps/native/vite.config.mts` — desk-verified; `PlatformBadge.android.tsrx`
> exists as the probe for that run.

## Mechanism (verified against octane 0.4.0 + vite-octane source)

Resolution and compilation are **decoupled phases**:

1. Vite resolves `import './Foo'` to a filename — octane's plugin only claims
   virtual/adapter ids in `resolveId`; its transform then sees the **resolved
   canonical filename**.
2. The compiler maps filename → renderer via `resolveRendererForFile` — first
   matching `include` glob wins (no extension restriction; `Foo.native.tsrx`
   under `src/**/*.{tsx,tsrx}` is nativescript-owned).

So suffix resolution only has to produce the right filename. Two options:

**Option A — ordered `resolve.extensions` (preferred, zero code).**
`resolve.extensions` is tried in array order for extensionless imports, so set
the full ordered list per app:

```ts
// apps/native/vite.config.ts
resolve: {
  extensions: [
    '.ios.tsrx', '.native.tsrx', '.tsrx',
    '.ios.tsx', '.native.tsx', '.tsx',
    '.ios.ts', '.native.ts', '.mjs', '.mts', '.ts',
    '.jsx', '.js', '.json',
  ],
}
```

(Octane's plugin already appends `.tsrx` to its own default list; verify our
list wins — if `mergeConfig` concatenates rather than replaces, our config
helper asserts the final array.)

**Option B — `resolveId` plugin (fallback).** A small `enforce: 'pre'` plugin
that maps specifier → suffixed file directly. More control (e.g. context-aware
resolution), same outcome. Write it only if Option A ordering proves fragile.

**TypeScript side**: `moduleSuffixes` in each tsconfig —
`[".ios", ".native", ""]` (native) / `[".web", ""]` (web) — resolves `./Foo` to
`Foo.ios.tsrx` etc. for typing, matching runtime. Verify `tsrx-tsc` honors it
(`.tsrx` is a patched extension; suffixes should compose — flagged for the
prototype checklist).

**NS's own suffixes**: NativeScript tooling already resolves `.ios.`/`.android.`
for bundled resources — ours is a superset adding `.native`/`.web`. Align by
keeping our resolution upstream (vite-level) and letting NS file-qualifier
resolution (orientation/size classes — `.land`, `.minWH600`) stay for assets.

## Ownership rules (now verified)

- **`.tsrx` is Octane-owned by extension** — no pragma needed. `.tsx`/`.ts`/
  `.js` need `/** @jsxImportSource … */` (value: `octane`, `octane/strong`, or
  a registered renderer's `intrinsics` id — i.e.
  `/** @jsxImportSource @nativescript-community/octane */` claims a file for
  the NS renderer).
- **Default dialect: `.tsrx` for all renderer-owned files** (decision #23) —
  shared, leaf, and route files. `.tsx` only for files that must not see
  directives. Non-component `.ts` helpers stay unowned (no hooks — the slotter
  emits `from 'octane'` literally, which resolves to the DOM runtime under
  native; see prior-art/octane.md).
- **`renderers.rules` owns components; `validation` owns `.ts` helpers**:
  universal rules validate matched `.ts`/`.js` modules
  (`forbiddenGlobals`/`forbiddenImports`) without compiling them — the seam
  enforcement layer (decision #20).
- **Shared packages**: Octane's model is "ship authored source; the app
  compiles it." Renderer include globs must span `packages/**` sources; NS-side
  `include` covers suffixed files the same way.

## The `Platform` module (value-level splits)

For props/values (not JSX vocabulary), avoid file splits:

```ts
// platform/index.ts — resolved per-target
export const OS: 'web' | 'ios' | 'android';
export const isNative: boolean;
export function select<T>(s: { web?; native?; ios?; android?; default? }): T;
```

`platform.web.ts` / `platform.native.ts` (runtime OS check inside native impl).
Platform-resolved, so dead branches eliminate at build time.

Rule: `Platform.select` is fine **inside** a shared file for values, prop
objects, class names — never for mixing intrinsics (`<div>` vs `<gridlayout>`)
in one file's JSX. That requires leaf splits.

## TypeScript

Two program configs over a shared base:

```jsonc
// tsconfig.base.json   — shared compilerOptions, paths
// tsconfig.web.json    — jsxImportSource: "octane", moduleSuffixes: [".web", ""]
// tsconfig.native.json — jsxImportSource: "@nativescript-community/octane",
//                        moduleSuffixes: [".ios", ".android", ".native", ""]
```

- Shared files typecheck under **both** programs in CI — that's the point:
  they must compile against either intrinsic vocabulary (easy, since they only
  use our components).
- Leaf files typecheck under their own target's config only.
- Typecheck `.tsrx` with `tsrx-tsc --noEmit` (per octane repo rules), not plain
  `tsc`.
- **`exports` wildcards don't extension-resolve** (lab, Exp 15): `"./\*":
  "./src/*"` maps `@xplat/app/platform/storage` to a literal extensionless
  path that neither tsc nor vite/rolldown can load. Deep platform imports must
  go through a barrel (`@xplat/app` re-exporting `./platform/storage`) or a
  `paths` pattern — the suffix chain runs on the barrel's internal relative
  specifier, not on the exports target.
- **`moduleSuffixes` only covers `.ts`/`.tsx`** (lab, Exp 18): an
  extensionless `./Link` won't resolve `Link.native.tsrx` — tsc's suffix
  search doesn't include `.tsrx`. Convention: leaf pairs that shared code
  imports bare get a same-name `.ts` shim per side (`Link.native.ts` →
  `export { Link } from './Link.native.tsrx'`) — the shim is suffix-
  resolvable, the component stays renderer-owned.

> [!WARNING]
> Suffixed `.ts` helpers DO resolve extensionless under `moduleSuffixes`
> (`./platform/nav` → `nav.native.ts`/`nav.web.ts` typecheck fine), but a
> `.ts` file importing a `.tsrx` component gets `() => Element`, not
> `UniversalComponent` — passing it to `createNativeScriptRoot().render()`
> needs `as unknown as UniversalComponent` (Exp 9).

## Build-time defines

`import.meta.env`-style defines per target: `__PLATFORM__`,
`__DEV__`/`__PROD__`. Set in each vite config; keep the set tiny and prefer the
`platform` module for branching so types stay honest.

## What this buys us

- `*.ios.tsrx` escapes are available but rarely needed (goal: <5% of files).
- Route files can split per platform — see [navigation](navigation.md).
- Same mechanism feeds vite dev, vite build, vitest, and the two tsconfigs —
  **one resolution table per target, consumed everywhere**.
