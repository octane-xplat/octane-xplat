# Module resolution & file conventions

> How one source tree becomes two compilations. The resolver is the mechanism
> everything else hangs off: leaf splits, platform services, route tables,
> Platform.select.

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
| web | `.web.tsrx` → `.tsrx` |
| ios | `.ios.tsrx` → `.native.tsrx` → `.tsrx` |
| android | `.android.tsrx` → `.native.tsrx` → `.tsrx` |

Same order for `.tsx`, `.ts`, `.css`, `.json`, assets. Keep the chain short —
the shared file should be the norm; per-OS files are for genuinely divergent
behavior (SF Symbols vs font icons, safe-area quirks).

## Interactions to get right

1. **Resolver runs before the Octane compiler's renderer scoping.** The NS
   renderer owns files by include glob (`app/**/*.tsx` style); a resolved
   `Foo.native.tsrx` still lives under that glob, so ownership follows the
   *resolved* file. Ordering in the Vite plugin chain must reflect that.
   → [open question](open-questions.md): confirm `.tsrx` is coverable by the
   include glob (defaults shown are `.tsx`-only).
2. **NS's own suffixes already exist.** NativeScript tooling resolves
   `.ios.`/`.android.` natively. Ours is a superset (adds `.web.`/`.native.`).
   Align precedence so the two systems don't fight — prefer letting our
   resolver run first and treat NS's as fallback for non-bundled resources.
3. **`.tsrx` vs `.tsx`:** both are component files for us. Rule of thumb:
   `.tsrx` when using directives/`@{}`; `.tsx` for plain-JSX components and
   leaf impls where the dialect buys nothing. Both must be in the renderer
   include glob.
4. **Shared packages**: Octane's library model is "ship authored source; the
   app compiles it." Renderer include globs must span `packages/**` (or the
   publish boundary must precompile per-target — prefer spanning).

## The `Platform` module (value-level splits)

For props/values (not JSX vocabulary), avoid file splits:

```ts
// platform/index.ts — resolved per-target
export const OS: 'web' | 'ios' | 'android';
export const isNative: boolean;
export function select<T>(s: { web?; native?; ios?; android?; default? }): T;
```

Implement as `platform.web.ts` / `platform.native.ts` (with runtime OS check
inside the native impl). Because the module itself is platform-resolved, dead
branches eliminate cleanly at build time.

Rule: `Platform.select` is fine **inside** a shared file for values, prop
objects, class names — never for mixing intrinsics (`<div>` vs `<gridlayout>`)
in one file's JSX. That requires leaf splits.

## TypeScript

Two program configs over a shared base:

```jsonc
// tsconfig.base.json   — shared compilerOptions, paths
// tsconfig.web.json    — jsxImportSource: "octane"           (verify exact value)
// tsconfig.native.json — jsxImportSource: "@nativescript-community/octane"
```

- Shared files typecheck under **both** programs in CI — that's the point:
  they must compile against either intrinsic vocabulary (easy, since they only
  use our components).
- Leaf files typecheck under their own target's config only. Per-file
  `/** @jsxImportSource … */` pragmas are an alternative for leaf files if the
  two-tsconfig setup proves awkward — decide after the first prototype.
- Import specifier → file resolution: TS can't see our suffixes. Options:
  (a) always import the bare `./Foo` and declare types via a non-suffixed
  `Foo.d.ts` or the shared file's types; (b) per-target `paths` overrides in
  each tsconfig (`"./Foo"` → `./Foo.web.tsrx`). Expect to write a small
  declaration-generation step if (a) gets noisy — One's `routes.d.ts` codegen is
  the precedent for "generate the types you can't express."

## Build-time defines

`import.meta.env`-style defines per target: `__PLATFORM__`,
`__DEV__`/`__PROD__`. Set in each vite config; keep the set tiny and prefer the
`platform` module for branching so types stay honest.

## What this buys us

- `*.ios.tsrx` escapes are available but rarely needed (goal: <5% of files).
- Route files can split per platform — see [navigation](navigation.md).
- Test/typecheck matrix stays mechanical: same resolver logic feeds vite dev,
  vite build, vitest, and tsc. **One resolver implementation, consumed
  everywhere** — write it as a shared config module, not inline per config.
