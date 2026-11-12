# Edit running-app values and styles from devtools

ID: live-tweaks
Targets: web
Related APIs: useTweak, octane-xplat/tweaks, tweaks() vite plugin, xplat dev, xplat devtools, defineDevtoolsPanel, octaneXplat.devtoolsPanel

## Starting point

A consumer app built on the `octane-xplat` umbrella package. New apps
created with `bunx create-octane-xplat` already load `tweaks()` before the
Octane plugins in the generated Vite config and can import the runtime from
`octane-xplat/tweaks` without a separate package install.

## Requirements

Live editing applies only under `xplat dev`; `ns run` sessions and
production builds keep the source literals. The native devtools window is
macOS-only and requires the project's macOS host packages; the browser
`/devtools/app/` panel exposes no panel plugins. Save rewrites app source
files, so readers need an explicit write-back story and a revert path.
Bamboo style drafts preview on web only.

## Acceptance criteria

- AC1: Mark a source literal with `useTweak` from `octane-xplat/tweaks`,
  run `xplat dev`, and change the value live from the Tweaks tab without a
  rebuild.
- AC2: Add `tweaks()` before the Octane plugins in an existing app's Vite
  config; dev transforms inject tweak ids and the injected
  `@octane-xplat/tweaks/dev` import resolves in an umbrella-only install.
- AC3: Open `xplat devtools` against a running `xplat dev` server, reach
  the Tweaks and Styles tabs, select a backend when several exist, and read the empty
  state when none is running.
- AC4: Persist edits: Save writes source literals and style sites back to
  files for the selected editor only, including unmounted entries; Revert
  discards only that editor's drafts. Property/pick filters do not narrow Save.
  Production bundles contain no tweaks client or instrumentation.
- AC5: A package ships a devtools panel via `octaneXplat.devtoolsPanel`
  plus a `defineDevtoolsPanel` module (or several subpaths for several tabs); the desktop bundle discovers it from
  project or umbrella dependencies and skips invalid entries with a
  warning.

## Documentation

- AC1: [Tweaks guide](../../../docs/packages/package-tweaks.md), [transport e2e](../../../apps/tweaks-playground/test/e2e.mjs)
- AC2: [Setup](../../../docs/packages/package-tweaks.md#set-up-tweaks), [packed consumer regression](../../../packages/toolchain/test/packed.mjs)
- AC3: [Devtools guide](../../../docs/packages/package-devtools.md), [discovery regressions](../../../packages/devtools/tests/panels.test.mjs)
- AC4: [Save/Revert](../../../docs/packages/package-tweaks.md#edit-a-running-app), [packed consumer regression](../../../packages/toolchain/test/packed.mjs)
- AC5: [Panel plugin API](../../../docs/packages/package-devtools.md#add-a-panel-plugin), [discovery regressions](../../../packages/devtools/tests/panels.test.mjs)
