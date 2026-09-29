# Checking an xplat app

> Catch shared-code mistakes quickly, then verify the behavior that only a
> browser or device can prove.

## The short feedback loop

1. Ask the agent to run `pnpm lint` and `pnpm typecheck` in the starter app.
2. Run logic and component tests without a device.
3. Build the web app.
4. Run a native smoke test on a simulator, emulator, or device before release.

The first two steps are fast and should run on every change. Native builds
take longer, so run them before merging platform work and in release checks.

## Test behavior, not renderer markup

The browser and native targets intentionally produce different view trees.
Assert what the user can do: a press changes state, a route opens, a modal
closes, and an unavailable capability shows its fallback.

For a packing checklist, add “Passport,” mark it packed, and check that the
remaining count decreases. Remove it and verify the empty state. The test
helper can differ between your web and native harness; the expected product
behavior stays the same.

Ask the agent to report which commands passed and which targets it actually
ran. Repeat the important flow yourself on the platforms you plan to ship,
including denied permissions and unavailable device capabilities. A web build
or a typecheck alone does not prove a native interaction works.

Keep pure calculations in hook-free modules so they can run in a normal unit
test. Add a device check when the behavior depends on native measurement,
focus, gestures, or OS permissions.

The [testing notes](testing-notes.md) contain the enforcement rules, mock-host
strategy, CI order, and known native-test limits.
