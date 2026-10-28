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

## Direct FormatJS imports still require global Intl

The proposed direct-import integration is blocked with the versions below.
Importing a constructor instead of its `polyfill` entry does not make it
independent of global `Intl`. Do not add these dependencies to UI on the
assumption that regular imports alone solve the NativeScript gap without
mutating globals.

On 2026-10-28, an isolated Node 26.12.0 probe deleted `globalThis.Intl` before
importing each package in a fresh process. Imports completed, but constructor
use failed as follows:

| Package (`@formatjs/` prefix) | Version | Result |
| --- | --- | --- |
| `intl-locale` | 5.3.12 | `ReferenceError: Intl is not defined` |
| `intl-pluralrules` | 6.3.16 | Same |
| `intl-numberformat` | 9.4.3 | Same |
| `intl-datetimeformat` | 7.8.2 | Same |
| `intl-relativetimeformat` | 12.3.16 | Same |
| `intl-listformat` | 8.3.15 | Same |
| `intl-segmenter` | 12.2.15 | Same |
| `intl-collator` | 0.2.9 | Creates global `Intl`, then throws `TypeError: Intl.getCanonicalLocales is not a function` |

Minimal reproduction in an isolated process with NumberFormat 9.4.3 installed:

```js
Reflect.deleteProperty(globalThis, 'Intl')
const { NumberFormat } = await import('@formatjs/intl-numberformat')
new NumberFormat('en').format(1234.5)
// ReferenceError: Intl is not defined (CanonicalizeLocaleList)
```

Upstream's [CanonicalizeLocaleList implementation](https://github.com/formatjs/formatjs/blob/main/packages/ecma402-abstract/CanonicalizeLocaleList.ts)
calls global `Intl.getCanonicalLocales`. Collator's
[core module](https://github.com/formatjs/formatjs/blob/main/packages/intl-collator/core.ts)
calls `ensureIntl()` at module scope, including through its regular export.
Locale data was not installed in this probe: the observed global prerequisite
failure precedes successful formatting, and is sufficient to reject the
unmodified direct-import design. This does not establish that supplying only
`getCanonicalLocales` would be sufficient.

Local evidence: `research/formatjs-direct/probe.mjs`, its pinned package/lock
files, and `results.log` (temporary, gitignored). Run from that directory with
`turbo run probe --filter=//`. The diagnostic task catches and prints each
constructor error; its exit status means the diagnostic ran, not that FormatJS
works. This is Node runtime evidence with the global removed, not a device
runtime test or a full emulation of NativeScript's ICU-free engine. No iOS,
Android, or macOS runtime qualification or consumer bundle measurements were
performed for this proposal.

No production dependency or formatting behavior changed. Revisit when the
selected implementations can receive their prerequisites and locale data
without global registration, or when the integration constraints change.
