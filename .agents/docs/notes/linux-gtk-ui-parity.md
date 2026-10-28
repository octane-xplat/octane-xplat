# GTK UI parity work

The [export inventory](linux-gtk-ui-exports.json) lists every name reachable
from `packages/ui/src/index.mobile.ts` at `779d1047213df8664ffa42e527304c68ade6da62`:
357 runtime values and 764 type-only exports. It includes the shared barrel,
aliases, and the mobile `KeyboardAvoiding` override. The broader
[Linux capability inventory](linux-gtk-capability-inventory.md) also covers
services, leaf packages, packaging, and host infrastructure.

## Reading the inventory

Each module records its exported names, selected GTK/default source,
classification, and verification state. `findingSources` links to source
findings and line numbers in the same JSON file. Classification follows the
transitive relative runtime imports, excluding type-only imports and honoring
the GTK preset's escape-props alias. Cross-package runtime imports remain
explicit review items.

- `works-as-is`: source reuse candidate, or an erased type contract. This is
  **not** a runtime pass.
- `needs-renderer-or-prop`: the shared source requires an intrinsic, event,
  host method, or property binding that needs GTK implementation/qualification.
- `needs-gtk-leaf`: a NativeScript-only dependency, service stand-in, or explicit
  foreign platform import needs replacement at the GTK file boundary.
- `needs-review`: the source survey cannot settle a package boundary or parser
  result. Resolve these before promising support.
- `not-feasible`: reserved for a demonstrated platform limitation. No entry is
  assigned this classification from source inspection alone.

The inventory is a baseline survey, not a list of promised GTK exports.
`index.gtk.ts` remains the available root surface. Silo's `gtk_ui_checks` table
tracks each name individually, using the same Git origin identity across
worktrees. Source findings, compilation, runtime assertions, OS input and visual
qualification are separate evidence. Type-only exports need declaration
compatibility rather than widget execution.

## Implementation order

| Priority | Work | Required evidence |
| --- | --- | --- |
| 1. Primitives | View, Text, Pressable, gestures, ref/property semantics, icons/images | Mount/update/dispose; pointer press/cancel/drag; attributed text and image behavior |
| 2. Layout | Stack family, Grid, Layout regions, measurement, scrolling | XplatMason allocations, track/span changes, overflow, retained widget identity and cleanup |
| 3. Inputs | TextInput/TextArea, selection, checkbox/radio, slider, pickers | Controlled writes without feedback loops, selection, disabled/read-only behavior, keyboard/IME and OS input |
| 4. Overlays | Layer host, portals, menus, dialogs, sheets, tooltips, toast | Provider ownership, focus, outside dismissal, stacking, geometry and disposal |
| 5. Navigation | Root route outlet, app/navigation chrome, retained panes and windows | Push/Back retention, route lifetimes, modal behavior and actual input |
| 6. Theme | OS appearance, preference persistence, tokens, sizing, i18n | OS-change subscriptions, scoped updates, persistence and process restart |

Prefer renderer fixes to copies of reusable UI leaves. Add `.gtk` leaves where
the shared implementation depends on another host's APIs. Do not export a
component merely because tree-shaking makes its import compile. Preserve the
native names and prop contracts for every exported member. Reconcile generated
GTK declarations, public guidance, skill references and release notes as each
slice is qualified.

## Verification environment

The integration worktree is
`andromeda.local:/Users/alec/dev/alloc/worktrees/octane-xplat/gtk-ui-parity`,
based on `origin/main`. Runtime checks use a separate checkout at
`/home/alec/worktrees/gtk-ui-parity` inside that host's existing OrbStack
`octane-linux` guest: Ubuntu 24.04.5 x86_64, GJS 1.80.2, GTK 4.14.5. Headless
checks use Xvfb. No screenshots or visual analysis are part of this work.
The existing guest is shared infrastructure; do not shut it down as though it
were a disposable task-owned VM.

An initial frozen install on the clean base installed dependencies, then failed
its broad postinstall on a stale `store-review` renderer target (`octane`
versus `@octane-xplat/jsx`). Installing with `--ignore-scripts` and running the
focused Turbo tasks prepares only the required dependency graph. The existing
GTK test task passes on the Mac with its GJS-dependent cases skipped; that is
build evidence, not Linux runtime qualification.

## Mason test artifact prerequisite

The GTK binding on this base consumes a MasonCore archive from
`dist/native/mason-core/desktop/<triple>`. The public Mason fork at
`1f101ca` (`core-v1.0.0-beta.5`) has Apple-only `build-native.mjs` modes and no
`build.native.desktop` target. This is a build-tooling gap, not evidence that
Rust layout cannot execute on Linux.

For this investigation, a task-local Linux artifact is built with the pinned
fork's `cargo rustc -p mason-c --lib --release --locked --target
x86_64-unknown-linux-gnu --crate-type staticlib` and its exported
`prepareHeaders` helper. Its manifest records the source revision, toolchain,
Cargo.lock, header and archive hashes, and explicitly identifies this local
preparation. The GTK facade is then built by its maintained `build.sh`.
The task-local archive does not establish an upstream desktop build command or
packaged consumer support. The maintained upstream producer remains a follow-up.
