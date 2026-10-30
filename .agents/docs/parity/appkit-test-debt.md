# AppKit test-debt cleanup

Branch `feat/appkit-test-debt`, sibling note to
[appkit-progress.md](appkit-progress.md). Tracks issue #78 section 1's
deferred unit verification: the 17 macos-renderer suite failures, the
unrun authored AppKit unit suites, and the keyboard typecheck ordering
gap. Source/unit-test evidence only; no runtime qualification claimed.

## macos-renderer suite: 17 failures -> 664/664 pass (2026-10-30)

The recorded "vm-slice realm" theory covered only a minority of the set.
Actual causes, all fixed on `feat/appkit-test-debt`:

- **Dead Proxy sandbox (7 tests, `event-prop-clears.test.ts`).** The tests
  passed `new Proxy(sandbox, {get: auto-spy})` as the `runSlice` context,
  but `runSlice` spreads the context into a plain object before
  `runInNewContext` — the trap could never fire, so every helper
  `applyProps` calls outside its slice range threw `ReferenceError`
  (`setPanAction`, `setScrollAction`, `setKeyActions`, `setFocusActions`,
  `queueLayoutReconcile`, `syncSecureTextField`). New
  `spySliceContext(target)` in `test/mock-globals.ts` installs a real vm
  global proxy: a `has` trap makes undeclared names resolve to recording
  `function` spies (kept `instanceof`-safe), while names owned by
  `CSS_SLICE_STUBS`, the target, or `globalThis` resolve normally so the
  `typeof` fallback guards still install functional stubs.
- **Foreign-realm objects (1 test).** `text-value.test.ts` compared a
  `{location,length}` range allocated inside the vm slice;
  `deepStrictEqual` rejected the foreign prototype. Fixed per-assertion
  with a spread copy — slices still run in a fresh realm.
- **Missing slice stubs/fakes (4 tests).** `shallowEqualStyle` (busy
  animations) joined `CSS_SLICE_STUBS`; `stickyPlacements` stub added to
  the second root-layout fixture; `view()` in `style-reconcile.test.ts`
  gained `invalidateIntrinsicContentSize` (called unconditionally by
  `syncLabelOverflow`); `labelNode()` in `text-styles.test.ts` gained
  `props: {}` (`setLabelText` reads `props.accessibilityRole`).
- **Stale expectations (4 tests).** `action-selectors` site count 12->11
  (legitimate `viewPressed:` dedup in `6ddf022f5`); `batch-recovery` now
  matches the shared inline-style `TypeError` instead of the retired
  "style to be an object" check; the picker fake records the
  `accessibilityLabel` property the source assigns (was a
  `setAccessibilityLabel` method spy).
- **Real product gap (1 test).** `template-props.ts` `common` lacked
  `onKeyDown`/`onKeyUp`, so string templates could not attach the AppKit
  hardware key handlers `CommonEvents` gained in `c913c8227`. Added;
  `list-template` inventory now matches `shared.d.ts`.

## Authored suite results (local, source-level)

| Suite | Command | Result |
| ----- | ------- | ------ |
| macos-renderer | `turbo run test --filter=@octane-xplat/macos-renderer` | 664/664 |
| platform | `turbo run test --filter=@octane-xplat/platform` | 212/212 after 3 stale-expectation fixes |
| image | `turbo run test --filter=@octane-xplat/image` | 9/9 |
| video | `turbo run test --filter=@octane-xplat/video` | 9/9 |
| gif | `turbo run test --filter=@octane-xplat/gif` | 6/6 |
| pager | `turbo run test:native --filter=@octane-xplat/pager` | 23/23 |
| sheet | `turbo run test --filter=@octane-xplat/sheet` | 7/7 |
| picker | `turbo run test --filter=@octane-xplat/picker` | 8/8 |
| ui native lane | `XPLAT_UI_TEST_TARGET=macos turbo run test:native --filter=@octane-xplat/ui` | green after path fixes |
| ui macos lane | `turbo run test:macos --filter=@octane-xplat/ui` | green; `APPKIT_THUMBHASH_RUNTIME_OK` (5 assertions, real AppKit decode) |

Failures found and fixed along the way, all stale-test fallout from landed
refactors:

- The `8c9e2f567` export-map collapse (platform conditions are now
  runtime-only strings; one shared `types` entry per subpath) invalidated
  `appkit-metadata`, `appkit-system-bars`, `packed-macos` (platform) and
  `packed-consumer.mjs` (ui). Tests updated to assert the contract
  TypeScript actually resolves — the shared `types/generated/*.d.ts`.
- The `8e53d479f` feature-directory move left `keyboard-types.test.mjs`
  and `keyboard-inset.test.mjs` reading deleted `src/use-keyboard*` and
  `src/keyboard-host-bounds*` paths; now point at
  `src/internal/keyboard/`.

## keyboard typecheck ordering gap: fixed

`tsconfig.envs.json`'s native env includes the package's own
`types/generated/index.d.ts`, but the shared `typecheck` task only
depended on `^typegen`. `packages/keyboard/turbo.json` (new, shortcuts
precedent) makes `typecheck` depend on `typegen`. Verified by deleting
`types/generated` and watching `keyboard#typegen` precede
`keyboard#typecheck`; green. Only keyboard is affected — the other
envs-config packages reference *dependency* generated types, already
ordered by `^typegen`.

## Repo checks

- `check:docs`: pass (165 files)
- `check:doc-examples`: pass after fixing two README snippets (bare JSX
  statement; adjacent JSX elements) — pre-existing on main
- `check:changelog`: pass (186 notes) after adding `### title` headers to
  30 AppKit-era notes and correcting one invalid release name
  (`@octane-xplat/*` -> `lockstep`) — all pre-existing on main
- `check:recipes`: **fails identically on main** — 149 findings, all
  AppKit recipe files missing `Requirements` sections or `ACn`
  documentation links (recipe coverage debt the audit left behind).
  Not made worse by this work; remains open.

## Deferred / not done

- `turbo run package --filter=@xplat/macos` and the maintained probes on a
  real Mac — not run; no resource reservation taken.
- Runtime/Intel verification via `ssh skymac.local` — not needed for the
  pure-JS fixes here; unrun.
- `check:recipes` AppKit recipe documentation links — standing debt,
  reported on #78 rather than bulk-written.
- Evidence-gated checkboxes in #78 stay open: all results above are
  source/unit evidence, not OS-level runtime qualification.
