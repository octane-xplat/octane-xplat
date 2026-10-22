# NativeScript runtimes: V8 without ICU

The embedded V8 in both NativeScript runtimes is built without ICU. Every
`\p{…}`/`\P{…}` regex escape is a `SyntaxError`, `Intl` is undefined, and
`String.prototype.normalize` is a no-op.

- **Owner**: NativeScript runtimes — `@nativescript/ios@9.1.0` (v8ios engine),
  `@nativescript/android@9.1.1` (`version_info.v8` = `14.9.207.39`, stated in
  the package's own `package.json`).
- **Runtime evidence** (2026-10-21): `research/probes/no-icu-regex.ts`
  (gitignored) run on an Android OnePlus CPH2551 (`905d3a9e`) and an iPad Air
  13-inch (M4) simulator; results recorded in
  `research/probes/no-icu-regex.{android,ios}.json`. Measured, identical on
  both platforms:
  - `\p{XID_Start}`, `\p{XID_Continue}`, `\p{ID_Start}`, `\p{L}`,
    `\p{Script=Latin}` — all `SyntaxError: Invalid regular expression: …
    Invalid property name`.
  - A regex *literal* inside a never-called function still fails — the
    rejection happens at parse time, so one literal poisons its whole module.
  - `typeof Intl` → `undefined`; `'é'.normalize('NFD').length` → `1`.
  - ASCII classes, explicit astral ranges (`\u{…}`), and lookbehind work.
- **Consequence**: any dependency that declares a `\p{…}` regex literal at
  module scope kills the bundle at boot on iOS and Android. Rewriting to
  `\p{ID_Start}` or `\p{L}` does **not** help — every property escape is
  rejected, not just XID. Safe patterns: `new RegExp` built inside try/catch
  with an ASCII/explicit-range fallback, or explicit code-point ranges.

## Current local workarounds

| Surface                                                           | Workaround                                                                                                                                      | Status / removal condition                                                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `linkifyjs@4.3.3`                                                 | pnpm patch (`packages/cli/patches/linkifyjs@4.3.3.patch`): module-scope `/\p{L}/u`, `/\p{Emoji}/u` literals rebuilt as try/catch `new RegExp`     | Applied; upstream PR https://github.com/nfrasser/linkifyjs/pull/572 — drop when it ships or the leaf stops pulling it    |
| `@lexical/link@0.51.0`                                            | pnpm patch (`packages/cli/patches/@lexical__link@0.51.0.patch`): same fix for the `/\p{L}\p{N}/u` URL matcher (autolink-only on native)          | Applied; upstream PR https://github.com/facebook/lexical/pull/9334 — drop when upstream builds via `new RegExp` or ICU lands |
| `shaders@4.0.0`                                                   | pnpm patch (`packages/cli/patches/shaders@4.0.0.patch`): bundled TypeGPU `\p{XID_*}` literals in `dist/core/std-ClftfWpF.js` rebuilt with fallbacks | Applied; upstream TypeGPU PR https://github.com/software-mansion/TypeGPU/pull/3255 — drop when TypeGPU ships ICU-free identifier regexes and a `shaders` release bundles it, or NS ships ICU |
| Visual/workshop iOS bundles                                        | Babel `@babel/plugin-transform-unicode-property-regex` compiles the escapes away at bundle time (`apps/mobile/visual-regex.mjs`, `packages/workshop/src/build/mobile-regex.ts`) | Applied at build time; needed while any bundled dep ships `\p{…}` for those hosts                                       |
| `Intl` gap — `MotionPatterns` (`packages/demos/src/MotionPatterns.tsrx`) uses `Intl.NumberFormat` | None — `Intl` is absent                                                                                                                                                                                          | Unresolved; needs an NS runtime with ICU or an Intl polyfill in the demo                                                  |

## Notes

- `@nativescript/ios` 9.1.0 runs the same V8 engine (`v8ios.xcodeproj` in the
  package), which is why iOS measurements match Android exactly — do not
  assume JavaScriptCore semantics on iOS.
- The `shaders` guard lives in `packages/shaders/tests/no-property-escapes.test.mjs`:
  it walks the `shaders/js` static import graph and fails if any reachable
  file regains a `\p{…}` escape (`allowUnusedPatches` lets a version bump
  silently drop the exact-version patch).
