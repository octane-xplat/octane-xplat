# Linux GTK renderer — v1 implementation status

> Status note for `packages/linux-gtk-renderer` (`@octane-xplat/linux-gtk`,
> private). Follows the feasibility review
> (`.agents/design/linux-gtk-feasibility-review.md`, gate verdict **fail** —
> production qualification remains gated) and the capability inventory
> (`linux-gtk-capability-inventory.md`). This note distinguishes what is
> proven at build level from what is proven at runtime; it authorizes no
> release and claims no production qualification.

## What landed

A first native slice of the GTK4/GJS renderer:

- **Driver** (`src/index.ts`): `UniversalHostDriver` implementation derived
  from the proven feasibility adapter, mapped onto the shared intrinsic
  vocabulary. `createGtkRoot(host)` mounts a universal root on any GTK
  container widget and installs the required `scheduleMicrotask` bridge
  (GJS has no `queueMicrotask`; the Promise bridge is the evidenced path).
  Handles `create`, `update`, `insert`/`move`, `remove`, `destroy`,
  `event`, `visibility`, `recreate`, `ensure-public-instance`. Rejects
  foreign-renderer batches before mutation.
- **Intrinsics implemented**: `stacklayout`/`stack`, `flexboxlayout`,
  `absolutelayout` (Gtk.Fixed + `x`/`y`/`left`/`top`), `gridlayout`
  (Gtk.Grid + `row`/`col`/`rowSpan`/`colSpan`), `label`, `button`,
  `scrollview`, `textfield`, `switch`, `slider`, `progress`,
  `activityindicator`; viewless `#text`, `span`, `formattedstring`,
  `contentview`, `proxyviewcontainer`, `rootlayout`. Unknown tags throw at
  create; unwired `on*` props warn once.
- **Events**: tap/click/press → `clicked` on buttons / `Gtk.GestureClick`
  released elsewhere; doubletap (n_press===2 filter), longpress
  (GestureLongPress), focus/blur (EventControllerFocus), loaded/unloaded
  (`map`/`unmap`), change (entry `changed`, switch `notify::active`, scale
  `value-changed`), submit (entry `activate`), scroll (scrolled-window
  adjustments).
- **Props**: `text`/`value`, `enabled`→sensitive, `width`/`height`→
  size-request, `style`→per-widget Gtk.CssProvider subset
  (color/background/font/padding/margin/border/min-size), `className`→
  `add_css_class`, `flexGrow`→expand along parent orientation, alignment
  props→`halign`/`valign`, `placeholder`/`secure`/`editable` on textfield,
  controlled entry writes with selection preservation + the bounded
  GLib settle (the X11 SelectionClear repair from the proof), `testID`/
  `automationText`/`id`→widget `name`. Prop drops restore documented
  defaults (complete-bag update contract).
- **Host** (`src/host.ts`, `./host` export): `runGtkApp(options, mount)` —
  GtkApplication + ApplicationWindow + vertical content box + mounted root.
- **JSX**: `src/intrinsics.d.ts` and `jsx-runtime`/`jsx-dev-runtime` are thin
  re-exports of `@octane-xplat/jsx/gtk` — the shared `NativeElements`
  contract bound to the GTK host element — so
  `/** @jsxImportSource @octane-xplat/linux-gtk */` resolves the identical
  membership, prop names, and event surface every platform shares. The
  driver accepts the contract names (`isEnabled`, `visibility`, `ClassValue`
  className, `style` string|object, `keyboardType`→`input_purpose`,
  `scrollBarIndicatorVisible`/`isScrollEnabled`, `maxValue` default 100,
  `alignSelf`) plus GTK extras not in the contract. Note: the same swap was
  tried on `macos-renderer` and reverted — `packages/ui`'s `.macos.tsrx`
  leaves pass web `CSSProperties`, `Ref<unknown>`, `'start'` aliases, and
  AppKit-specific event types that don't fit the shared contract; making
  `@octane-xplat/macos-renderer`'s pragma strict is a ui reconciliation
  workstream, not a types-only change.
- **Compat shims**: `compat/native-core`, `compat/escape-props`.

## The `.gtk` suffix (deviation from the task brief)

The brief asked for a `.linux` suffix seam. `.linux` is already claimed by
the WebKitGTK renderer — the existing chain resolves `.linux.*` → `.web.*`
→ unsuffixed, and `.linux` leaves carry DOM assumptions (see the capability
inventory's resolution-model section). Reusing it would let DOM leaves
resolve silently into a GJS bundle and would rewrite the meaning of every
existing `.linux` file. The renderer therefore registers a distinct **`.gtk`**
suffix:

- `tsconfig.base.json` `moduleSuffixes` (`.gtk` after `.linux`, before
  `.windows`)
- `packages/cli/src/tsconfig-envs.mjs`: `gtk` env — `jsxImportSource`
  `@octane-xplat/linux-gtk`, `moduleSuffixes ['.gtk','']`,
  `customConditions ['gtk']`, `lib ESNext` (no DOM lib), ambient
  `host-globals.d.ts`
- `packages/cli/src/vite.mjs`: `PLATFORM_TAG` + `boundaryAllowed.gtk =
  {'gtk'}` — `.linux` leaves are foreign in a GTK bundle (tested)
- `scripts/xplat-rules.mjs`: `.gtk` in the platform suffixes, `isNativeFile`,
  and the `.gtk.tsrx` pragma rule expecting
  `/** @jsxImportSource @octane-xplat/linux-gtk */`
- `packages/cli/src/linux-gtk/vite.mjs` (`@octane-xplat/cli/linux-gtk/vite`):
  `xplatLinuxGtk` preset — `gtk` renderer registry, `.gtk` extension chain,
  `gi://` externals, `octane` → `octane/universal/native` retarget, one
  resolved universal-native instance for app + renderer

`packages/lint/src/xplat-rules.mjs` (the published lint mirror) was NOT
updated — it is already a generation behind `scripts/xplat-rules.mjs`
(lacks the platform-subpath check and `.macos` in `isNativeFile`); the sync
belongs to a deliberate lint release.

## Evidence

**Runtime-proven (prior feasibility work, retained evidence):** Octane
universal runtime loads in GJS 1.82.3 + GTK 4.18.6 / GLib 2.84.4 on Debian 13
aarch64; Promise-based scheduling bridge ordering; reconciliation and
hit-testing via XTEST; controlled-entry selection semantics. The driver
adapter those runs proved is the direct ancestor of `src/index.ts`.

**Build-proven (this change):**

- `pnpm --filter @octane-xplat/linux-gtk typecheck` — clean
- `pnpm --filter @octane-xplat/jsx typecheck` — clean (`gtk.d.ts` compiles)
- `node --test test/build.test.mjs` (in the package) — 2 tests pass on macOS:
  1. `xplatLinuxGtk` compiles `test/fixtures` into one ESM bundle with
     `gi://` imports external, `universalPlan` emitted, no DOM globals;
  2. a `.linux.ts` leaf reachable in a GTK bundle fails with the
     `xplat boundary` error.
- `node --test packages/cli/test/tsconfig-envs.test.mjs` — 9 pass (suffix
  order invariant intact)
- `node --test scripts/xplat-rules.test.mjs` — 3 pass
- `scripts/lint-tsrx.mjs` — no new violations
- `pnpm probe doctor` — run on macOS; linux target correctly reports
  unavailable ("Run this command in a real Linux environment; no macOS
  stand-in is used")

**NOT proven:** nothing about this package was executed under GJS/GTK. No
Linux host was reachable (the brokered `linux:gtk-proof-vm` reservation was
granted but the VM was not contactable — OrbStack ssh helper absent). Driver
command handling, event wiring, widget mounting, and the smoke path below
are all **unverified at runtime**.

## Smoke path (unverified — run on a Linux host)

Prerequisites: GJS ≥ 1.80, GTK 4, a graphical session (X11 or Wayland —
both were exercised in feasibility work; Wayland + x86_64 remain
unqualified gaps).

1. Build the fixture bundle (any host):

   ```sh
   cd packages/linux-gtk-renderer/test/fixtures
   pnpm exec vite build -c vite.config.mjs
   ```

2. On the Linux host, run:

   ```sh
   gjs -m packages/linux-gtk-renderer/test/fixtures/dist/app.js
   ```

   Expected: a GTK window titled "Octane GTK smoke" with a counter label
   and an "Increment" button; pressing the button updates the label.
   `runGtkApp` returns `GtkApplication.run`'s exit status.

3. `pnpm probe run <case> --target linux` does not yet serve this renderer —
   the probe pipeline targets the WebKitGTK host. A native-GTK probe path
   is future work (out of scope: `scripts/probe/` is owned by the
   qualification workstream).

## Known limitations (build-level observations, not runtime findings)

- GJS 1.82.3 exposes no `queueMicrotask`, `process`, `performance`, or
  `fetch` (verified by the feasibility proof's globals inventory; upstream
  is GJS itself, not Octane). The driver bridges microtask scheduling via
  `Promise.resolve().then`; `xplatLinuxGtk` inlines
  `process.env.NODE_ENV` at build. These are load-bearing workarounds —
  do not remove them if a future GJS adds the globals without re-checking
  flush ordering.
- No `@girs/*` types — `src/gi.d.ts` is a hand-maintained member subset;
  members beyond it resolve as `any`. Generated GIR types are the upgrade
  path.
- `accessibilityLabel` is wired through a guarded `update_property` call —
  the GTK4 varargs entry point may not marshal from GJS; expect the
  once-per-label warning until the GtkAccessible row is qualified.
- `flexDirection` `*-reverse` renders unreversed (warns). Asymmetric
  `rowGap`/`columnGap` collapse to `spacing`. `justifyContent`/`alignItems`
  are typed but unimplemented. Gtk.Grid auto-placement appends downward —
  it is not the NS gridlayout algorithm.
- Text only folds into `label`/`button`; `#text` under other containers is
  dropped from the widget tree (logical node retained).
- `<scrollview>` mounts a single child — the shared scrollable contract
  needs a future viewport pass.
- Portals are unimplemented (`resolveParent` rejects non-null targets);
  templates/mount-template ops are unadvertised and unhandled.
- The `native` boundary set does not include `gtk` — `.gtk` leaves are
  foreign in generic native (NativeScript) bundles. Deliberate.
- Layout is GTK-native sizing (size-request/halign/expand/CSS), not the
  Mason workstream's engine — per the task constraint, layout stays behind
  the renderer seam.
