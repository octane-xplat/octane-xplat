# Checking an Xplat app

For repository investigation, use [single-case probing](probing.md): `pnpm probe doctor`
and `pnpm probe run examples/probes/counter.tsrx --target web --watch`.
Keep harness edits and catalog sweeps for broader regression coverage.

> Treat your agent's report as a claim to verify: catch shared-code mistakes
> quickly, then prove the behavior on the targets you ship.

An agent will call a task done on the strength of a typecheck and a passing
browser. For an app you intend to ship, require the evidence below — and
repeat the important flows yourself, because the agent's environment is not
your user's.

## The short feedback loop

1. Ask the agent to run `pnpm lint` and `pnpm typecheck` in the app.
2. Run the app’s configured logic and component tests without a device.
   The starter does not include a test runner or `test` script; configure one
   before treating this step as automated coverage.
3. Run `pnpm build` and check the interaction in the browser.
4. Run a native smoke test on a simulator, emulator, or device before release.

The first two steps are fast and should run on every change. Native builds
take longer, so run them before merging platform work and in release checks.

## Test behavior, not renderer markup

The browser and native targets intentionally produce different view trees.
Assert what the user can do: a press changes state, a route opens, a modal
closes, and an unavailable capability shows its fallback.

Add an item, mark it done, and check that the remaining count decreases.
Remove it and verify the empty state. The test helper can differ between
your web and native harness; the expected product behavior stays the same.

Ask the agent to report which commands passed and which targets it actually
ran — the gap between "the build passed" and "I ran it on a device" is where
cross-platform bugs live.

## Verify before you ship

A clean typecheck and a browser build say nothing about a device. Before a
release — or before you promise a capability — exercise the flows your app
depends on where they actually run:

- **On each target.** The same flow on web, iOS, and Android, not only the
  one that was convenient to test.
- **Through the failure paths.** Denied permissions, unavailable
  capabilities, cancelled pickers, failed requests. The capability and
  permission results in [platform services](platform-services.md) exist so
  your app can respond — check that it does.
- **As a release build.** `pnpm xplat build --release` produces
  signed-where-configured builds through a different pipeline than the dev
  server; current release-mode issues are tracked in
  [known limits](known-limits.md#same-edge-on-every-target).
- **Past the desk-read seams.** [Known limits](known-limits.md) marks rows
  `desk` when a claim was verified against source only. Re-verify on a real
  device anything your app depends on that carries that mark.

Keep pure calculations in hook-free modules so they can run in a normal unit
test. Add a device check when the behavior depends on native measurement,
focus, gestures, or OS permissions.

The [testing notes](testing-notes.md) contain the enforcement rules, mock-host
strategy, CI order, and known native-test limits.
