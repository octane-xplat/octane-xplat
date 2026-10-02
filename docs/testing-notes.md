# Testing notes

> Detailed test and enforcement record. Three layers: logic, component, device. The asymmetry to accept early —
> native component verification is the weak leg.
>
> **Owns:** #4 seam enforcement · **Status:** mapped · **Blocks on:** none —
> rules are writable today · **Decisions:** #3, #4 (the invariants it enforces)
> · **Validated by:** an intentionally-violating file failing lint/typecheck.

Current checks are `pnpm lint`, `pnpm typecheck:web`,
`pnpm typecheck:mobile`, and `pnpm test` from the repository root. The lint
lane uses Oxlint plus the TSRX companion pass; the ESLint and `packages/core`
references below describe the original test plan. A fresh run is required
before treating any historical smoke count as evidence for this checkout.

## Layers

| Layer                              | Tool                                                      | Target                                                                                                                                                                                                                   |
| ---------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Logic (`packages/core`, hook-free) | vitest, plain node                                        | both — DOM-free by definition                                                                                                                                                                                            |
| Hook-containing shared modules     | vitest + octane runtime                                   | must be run inside a renderer-owned test env — verify how tests satisfy the ownership rule (open-questions)                                                                                                              |
| Components                         | vitest + DOM renderer (web leaf impls)                    | web leaf = real test; shared-file behavior tests run through web impls                                                                                                                                                   |
| Native leaf correctness            | vitest + **`createObjectDriver`/`createObjectContainer`** | universal-core ships a built-in object renderer — assert host-command streams (`create gridlayout`, `event tap`) with no device and no NS runtime. Stronger than a hand-rolled mock: same ABI the real driver implements |
| On-device                          | `ns debug` + manual / Appium later                        | the real rendering ground truth                                                                                                                                                                                          |

## Enforcement tests (the cheap wins)

Two layers — **compile-time first** (verified machinery), lint as backstop:

**Layer 0 — the compiler's own `renderers.*.validation`**.
The renderer config accepts `forbiddenGlobals`, `forbiddenImports`,
`textHosts`, `textParents`, `hostProps` — enforced at compile time on owned
files. Plain `.ts` helpers also need the lint/typecheck backstop described
below. The following is an early configuration sketch, not a complete preset.
Use `xplatNative` from `@octane-xplat/cli/vite` for app setup. Declare on the nativescript
registry entry (or wrap `nativeScriptRenderers` in our own config helper):

```ts
// Historical renderer-entry fragment, expressed as a complete value.
const validation = {
  forbiddenGlobals: ['document', 'window', 'localStorage', 'navigator'], // fetch is available on native
  forbiddenImports: ['octane', 'octane/hydration', /^octane\/react/],               // DOM runtime + react compat
  textHosts: ['label', 'button', 'formattedstring', 'span', 'textfield', 'textview'],
  textParents: [/* same set — text only inside text hosts */],
  hostProps: { /* allowlist per tag, if we want tighter than class-derived props */ },
}
```

Then lint-level rules for what validation can't express:

- **No DOM globals in shared files** — eslint `no-restricted-globals`
  (`document`, `window`, `localStorage`, …) scoped to shared globs. (The
  nativescript validation covers native-owned files; this covers shared +
  web-owned.)
- **No intrinsics in shared files** — custom rule or codemod check: lowercase
  JSX tags outside `*.web.*`/native-default and `.mobile.*` leaf files are an error (all shared
  JSX should be capitalized components). Note: `hostProps`/`textHosts`
  validation already constrains native-owned files — this rule targets the
  shared set.
- **Hooks only in owned extensions** — `.ts` files calling `use*` flagged
  (doubly important on native: `.ts` hook slotting emits `from 'octane'` →
  DOM runtime → dead dispatcher).
- **CSS property allowlist** — warn on properties outside the NS∩web support
  matrix (silent drops AND silent per-declaration partial application are the
  documented traps).
- Boundary lint: `packages/core` never imports `packages/ui`; UI leaf files
  are the only place `@nativescript/*` appears.

## Typecheck matrix

The starter runs `tsrx-tsc --noEmit` against `tsconfig.json` and
`tsconfig.native.json` via `pnpm typecheck` — shared
files must pass under both `jsxImportSource`s. This is the single most
valuable CI signal for "the seams held."

```sh
pnpm typecheck
```

## Component test strategy

- Write component tests against the **web leaf** impls (jsdom/happy-dom +
  octane test utils — check what `test-utils/` in octanejs/octane offers).
- A minimal fake-host-driver for universal-runtime tests lets us assert
  command streams (`create gridlayout`, `event tap`) without a device — steal
  the harness pattern from `nativescript-community/octane` `tests/`.
- Snapshot discipline: assert behavior/a11y, not emitted markup — the two
  renderers emit different trees by design.

### Retained-Suspense regression

The regression scenario to verify at the universal object-driver seam and
on the device probe is intentionally event-driven. This checklist alone is
not evidence that both target runs passed:

1. Commit a `@try` body.
2. Tap a control whose handler causes the boundary's resource to suspend.
3. Assert the committed arm remains mounted but hidden, and `@pending` is
   visible; the tap handler must have run.
4. Resolve the resource and assert the body is visible again.
5. Make the handler throw once and assert `onUncaughtError` receives the error;
   there must be no “dropped tap event” warning.

The object-driver test asserts the `visibility` command stream without a
device. The NativeScript probe invokes installed gesture observers and reads
native view identity and `visibility`; this exercises event batching and the
driver, but does not prove OS hit-testing or physical tap delivery. Browser
verification uses Playwright clicks and DOM visibility measurements.

### Data lifecycle regressions

The maintained [shared probe](../packages/app/src/data-probe.tsrx) uses a
controlled transport, so cancellation and stale-response checks are independent
of network timing. Its [trace](../packages/app/src/data-trace.ts) checks two
instances of the same component, independent selectors, pending/error/retry,
background refetch, reset, unmount cancellation, stale settlement, cross-root
module signals, and `skip`. The native entry stacks two NativeScript pages and
opens separate RootLayout and modal roots; the browser entry uses independent
DOM roots rather than actual sheets or modals.

The object-driver regressions additionally exercise a module query across
roots, subscription retirement, first-read suspension, caught-error retry,
retained host commands, and a child reading its parent's query. The driver test
imports the installed NativeScript driver and mocks only NativeScript host
classes. Neither test lane counts as an iOS or Android runtime pass.

Before the patch, parent and child reads started two requests for one declared
query, NativeScript lacked its implemented visibility capability flag, and an
uncaught universal event bypassed `onUncaughtError`. Each failed its regression
before the fix. Instance descriptors now keep their declaring component's
owner; the canonical Octane and NativeScript patches carry the fixes.

Run the component checks with:

```sh
pnpm --dir packages/ui test:native
pnpm --dir apps/web test
```

For a fresh browser runtime pass, start this worktree's server with
`pnpm --dir apps/web dev --host 127.0.0.1 --port 4327 --strictPort`, then run
`pnpm exec node apps/web/scripts/data-smoke.mjs http://127.0.0.1:4327`.
The dedicated HTML entry avoids changing the navigation harness. The intentional
throw is one expected browser `pageerror`; universal native roots instead
report it to `onUncaughtError` without a dropped-event warning.

For native builds, prepare a fresh directory for each target with
`pnpm exec node apps/mobile/scripts/prepare-data-probe.mjs research/data-probe-ios`
(use another directory for Android). It uses this worktree's installed modules
and app resources, declares only data-probe dependencies, and refuses to overwrite
an existing directory. From the repository root, build with
`pnpm -C /tmp exec ns build ios --path "$PWD/research/data-probe-ios" --for-device false --no-hmr`
or the corresponding Android command and directory; set
`JAVA_HOME=$(/usr/libexec/java_home -v 21)` for Android. Invoking the installed
NativeScript CLI from outside the workspace avoids pnpm treating the isolated
probe directory as an unregistered workspace package. Hold the shared advisory
lock at `/tmp/octane-xplat-ios.lock` or `/tmp/octane-xplat-android.lock` throughout
each build and device session. Install/launch `org.octanexplat.datareadiness`
with `simctl` on an existing booted iOS simulator or `adb` on Android. Do not
reset the shared harness or its data.

The native log should reach `[data] PASS 13 assertions`, `NATIVE PASS`, and
`READY_BACKGROUND`. Background and resume that app while still holding the
target lock, then check `RESUME PASS`: a module signal changed during suspension
must be visible on the surviving page. This does not claim automatic query
pause/refetch, which `query$` does not provide.

Fresh evidence (2026-09-30) is recorded per target in Silo; older readiness
assessments remain historical:

| Lane                       | Fresh result                                                  | Scope                                                               |
| -------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Native object/driver tests | 14 tests passed                                               | Node; no simulator or device                                        |
| Web component suite        | 64 tests passed                                               | Includes the shared lifecycle trace                                 |
| Chromium                   | 13 lifecycle assertions and retained-suspense checks passed   | DOM roots and Playwright clicks                                     |
| iOS 26.5 simulator         | 13 assertions and native retained-suspense checks passed      | Stacked pages, RootLayout overlay, modal; gesture-observer dispatch |
| Android API 35 emulator    | 13 assertions, retained-suspense and background/resume passed | Same native roots and dispatch; same process resumed                |

iOS app-switch attempts did not produce the expected NativeScript
`suspendEvent`/`resumeEvent` log pair; background/resume remains unverified on
that target. No physical device was connected for the final Android run.
Native OS hit-testing and physical tap delivery remain separate checks. The
transport is controlled in all lanes; these runs do not verify a real HTTP
server, streaming, mutations, or TanStack Query.

The full mobile typecheck currently reports
errors in other native packages/platform typings. The changed data files have
no typecheck diagnostics. Full lint also reports existing violations elsewhere;
the data files pass their scoped lint checks.

## e2e reality check

- Web: Playwright is straightforward. **Verified:** `pnpm smoke`
  in `apps/web` — builds dist, serves via `vite preview`, drives headless
  Chromium: App mounts, `onClick`→state, tab switch, chip→real-path
  route write, pane render, popstate restore, deep-link boot, sheet-stub
  call, zero pageerrors — 14/14. Runtime evidence for the web target —
  until now it was only proven to compile. Selector note: `Pressable`
  renders `div[role="button"]`.
- Native: weak ecosystem — Appium or `nativescript-dev-appium`-era tooling;
  plan manual smoke scripts + screenshot capture per release until this
  matures. Sameframe-style parity checking is web-only. The harness probe
  timeline (tap synthesis via gesture observers + view-tree text reads)
  covers this today on iOS.
- HMR confidence is manual: the ns-octane workflow (edit while streaming,
  watch in-place accept) is the bar.

> [!CAUTION]
> `tsrx-tsc` rejects literal non-ASCII characters in JSX text (e.g. `•`) —
> Vite tolerates them, typecheck doesn't. Emit them as expressions:
> `<Text>{'• '}</Text>`.

> [!NOTE]
> Passive effects don't reliably drain after events dispatched outside
> octane's batch — raw `<a>` clicks and `popstate` re-render but leave
> `useEffect` unflushed (observed in the docs app: sidebar `Pressable` nav
> flushed a slug-dep effect; an `<a>` nav did not). Assert post-nav state
> imperatively, or trigger an octane-handled event first.

## CI ordering

Lint seam-rules → typecheck both → vitest → web build → (gated) native builds.
Native build failures should never block logic iteration — run them nightly
or on-demand early, per-PR later.
