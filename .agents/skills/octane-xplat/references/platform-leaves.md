# Platform leaves — the file-boundary system

## Suffix chain

First match wins:

- **Web**: `.web.tsrx|.web.tsx|.web.ts` → unsuffixed → fallback
- **Native**: `.ios.*|.android.*` → `.native.*` → unsuffixed → fallback

Configured in each app's `vite.config` `resolve.extensions` + `resolve.conditions`
(`'web'`/`'native'`). The conditions also pick `package.json` exports entries
(`"web"`/`"native"` keys) for packages.

## Rules

1. A file speaks ONE element vocabulary — JSX in a `.native` file uses NS
   intrinsics (`<contentview>`, `<label>`, `<listview>`); `.web` uses DOM.
   Shared `.tsrx` compiles under whichever renderer owns the build.
2. **No DOM globals outside web leaves** — `scripts/check-no-dom.mjs`
   enforces on `.native`/shared files (bare identifiers `document`,
   `window`, `localStorage`, `HTMLElement`, `matchMedia`...). Compiler-side
   `forbiddenGlobals` only covers `.tsrx`/`.tsx` — helpers need the lint.
3. **Hooks only in `.tsx`/`.tsrx`.** Plain `.ts` files: no hook calls
   (universal hooks get slotted by the compiler only in component files).
   `.ts` platform twins are for stores/services — fine, they just can't
   call hooks.
4. **Twin files for import parity.** `foo.native.ts` needs `foo.web.ts`
   (real impl or no-op) so unsuffixed imports resolve on every target.
5. `.ios`/`.android` overrides sit ON TOP of `.native` — only split when
   the behavior genuinely differs (e.g. `PlatformBadge`).

## The barrel rule

`exports` wildcards (`"./*": "./src/*"`) do NOT extension-resolve — a deep
import like `@octane-xplat/ui/theme/tokens.css` works (exact file), but
`@xplat/app/platform/nav` fails at the bundler (tries `nav`, never
`nav.native.ts`). **Import platform services through the package barrel**
(`import { navigate } from '@xplat/app'`), which re-exports the suffixed
module — suffix resolution happens at the barrel's own specifier.

## tsconfigs

`tsconfig.base.json` + per-app variants: different `jsxImportSource`,
include globs, ambient types (`@nativescript/types` scoped to native).
`tsrx-tsc --noEmit` per target in CI — `.tsrx` typechecks as real TS.

## Platform constants

No `import.meta.env.PLATFORM`. On native, `__ANDROID__`/`__IOS__`/`__DEV__`
are compile-time literals (ns-vite `define`); declare them in
`apps/native/types/globals.d.ts` before use. `Application.android != null`
is the equivalent runtime check (what we currently use). Web has only
stock `import.meta.env`. Don't add a unified PLATFORM constant — inline
platform branches in shared files violate the boundary rule; use a leaf.
