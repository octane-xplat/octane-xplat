# Checking an xplat app

> Catch shared-code mistakes quickly, then verify the behavior that only a
> browser or device can prove.

## The short feedback loop

1. Run the typecheck for the web and native configurations.
2. Run logic and component tests without a device.
3. Build the web app.
4. Run a native smoke test on a simulator, emulator, or device before release.

The first two steps are fast and should run on every change. Native builds
take longer, so run them before merging platform work and in release checks.

## Test behavior, not renderer markup

The browser and native targets intentionally produce different view trees.
Assert what the user can do: a press changes state, a route opens, a modal
closes, and an unavailable capability shows its fallback.

For a counter, the observable check is simple: press **Increment**, then
assert that the screen says **Count: 1**. The exact test helper can differ
between your web and native harness; the behavior should not.

Keep pure calculations in hook-free modules so they can run in a normal unit
test. Add a device check when the behavior depends on native measurement,
focus, gestures, or OS permissions.

The [testing notes](testing-notes.md) contain the enforcement rules, mock-host
strategy, CI order, and known native-test limits.
