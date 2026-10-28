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
| All native apps (iOS/Android/Windows) via `xplatNative`            | Babel `@babel/plugin-transform-unicode-property-regex` + `unicode-sets` compiles the escapes away at bundle/transform time (`packages/cli/src/native-regex.ts`, registered in `xplatNative`): production `transform`, dev per-module `/ns/m` serving, and an `optimizeDeps.rolldownOptions` twin. Upstream `ns-vendor-unicode-regex` already covers node_modules `.js` inside the dev-server esbuild passes (core/deps/vendor bundles) — the dev pass was never the gap; the removed patches existed because production bundles had no coverage. Replaced the `linkifyjs`/`@lexical/link`/`shaders` patches and the workshop/visual copies | Applied at build/dev-transform time. Runtime-verified 2026-10-27: production `ns build ios` (bundles `linkifyjs`, `@lexical/link`, `shaders`) boots on the iPhone 18 Pro simulator (`@nativescript/ios` 9.1.0); Android not yet re-run. Limit: literals, constant-string `new RegExp`, and static escapes in `u`-flag template patterns are covered — runtime-built patterns still throw; needed while NS runtimes lack ICU |
| `Intl` gap — `MotionPatterns` (`packages/demos/src/MotionPatterns.tsrx`) formatted totals with a module-scope `Intl.NumberFormat`, which killed Android/iOS dev boot | Replaced with fixed en-US digit grouping (regex, no `Intl`), identical output on every platform | Applied; revisit locale-aware grouping only when NS runtimes ship ICU                                                     |
| `Intl` gap — table sorting (`packages/ui/src/table/use-table-sortable-state.ts`) built a module-scope `Intl.Collator`, which killed iOS boot for any app bundling `@octane-xplat/ui` | Collator is created lazily when `Intl` exists; without it, string sorting falls back to an ICU-free natural-order compare (digit runs compare numerically, other text case-insensitively with a lowercase-first tie-break) | Applied; native sort order is not locale-aware — drop the fallback when NS runtimes ship ICU |

## Notes

- `@nativescript/ios` 9.1.0 runs the same V8 engine (`v8ios.xcodeproj` in the
  package), which is why iOS measurements match Android exactly — do not
  assume JavaScriptCore semantics on iOS.
- The `xplatNative` transform compiles literals, constant-string
  `new RegExp(pattern, flags-with-u|v)` calls, and `\p{…}` escapes embedded in
  template-literal patterns. Truly dynamic patterns (e.g.
  `new RegExp(userInput)`) are not covered — they still throw on device.
