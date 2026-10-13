# Upstream provenance

`@octane-xplat/rolling-text` borrows two ideas, not codebases. Both projects
are MIT; their license texts ship alongside (`LICENSE.scritto`,
`LICENSE.slot-text`) because the matcher is a direct port.

## Scritto — `matchUnits` in `src/match.ts`

Source: `packages/core/src/helpers.ts` @
`5be617b69b931958a84b03f84d9542aff12aedee`
(<https://github.com/JaceThings/Scritto>).

What transfers verbatim in spirit: the bounded diff — common prefix, common
tail, then a ±`RUN_BAND` (2) alignment search for a floating run, gated by
`MIN_FLOAT_RUN` (2) and `earnsTravel` (run length + `GROUP_WIDTH` buys its
travel). `anchor` biases the travel budget (0 = start, 1 = end, 0.5 = middle).

Changes from upstream:

- Input is `string[]`/`string[]` instead of `HTMLElement[]` — the function
  returns an `Int32Array` of new-index → old-index pairs, no DOM.
- Upstream records the run as `[oldSuffix..end)` sharing the tail; here the
  mapping is exactly the `best`-length run (`[oldStart, oldStart+best)`), which
  is equivalent for the flush-suffix case and strictly narrower for floating
  runs.
- Not ported: grapheme `splitGraphemes` (ours lives in `src/segment.ts` with
  an `Intl.Segmenter`-missing fallback), `trendOf` numeric parsing (callers
  choose `direction`), character pooling, WAAPI playback, flow layout.

## slot-text — update policy in `src/use-rolling.tsrx`

Source: `src/slotText.ts` @ `daa93fd34d39db981c9ecd9dc48118b6ec5dbb9e`
(<https://github.com/danielwh2/slot-text>).

What transfers: the queue shape. `interrupt` cancels the running roll and
settles it to its target before starting the next; `latest` (non-interrupt)
lets the run finish, keeps only the newest pending value, and drops a pending
request that equals the active target. Run completion is a timer sized from
the slowest cell (`delay + duration + buffer`), mirroring
`completionDelayMs + lifecycle.completionBufferMs`.

Changes from upstream:

- Cells are keyed framework elements, not DOM slots; retained exits stay in
  flow until their tween ends instead of animating a measured width collapse.
- No `set`/snapshot API, no `flash`, no per-index stagger/bounce/tint — the
  approved first slice keeps y/opacity only.
- `reducedMotion` is a first-class prop here (`'user'` follows the platform
  preference live); slot-text's core has no reduced-motion branch.

## In-repo derivation

`src/host.ts`'s frame clock and `src/reduced-motion.ts`'s platform reads are
adapted from `packages/motion/src/clock.ts` and `packages/motion/src/
reduced-motion.ts` in this repository — kept local so the package's native
dependency graph never pulls `@nativescript-community/gesturehandler` (the
reason this is a standalone leaf rather than an addition to
`@octane-xplat/motion`).

## macOS qualification

Contributor evidence boundary: on a shared agent host, reserve exclusive
`macos:rolling-text-qualification` through the resource broker. This serializes
an isolated fixture using the prebuilt host; it performs JavaScript bundling
and no native compilation. From the repository root, run:

```sh
pnpm --filter @octane-xplat/rolling-text test:macos-runtime
```

The fixture mounts the public workspace import in a real
JavaScriptCore/AppKit host. It reads NSView bounds, CALayer translation,
alpha, clipping, label text, and accessibility properties; it checks observer
removal on the actual workspace notification center and repeated disposal.
It opens no window and changes no system preference.

`test:packed` checks source and publish export maps, Bundler/NodeNext public
typing, and an object-driver mount. That test supplies no AppKit layout and
does not establish native presentation. Public prop types stay shared across
web, native, and macOS; `tsconfig.envs.json` uses the shared environment presets.

Still required for N3 acceptance: toggle the real OS Reduce Motion setting
while a label has a queued destination, confirm it settles to the latest
value, restore the user's setting, and confirm the opposite transition and
cleanup. Posting a notification on the workspace center tests subscription
lifecycle only. It does not establish OS preference-change delivery.
Visual appearance, pixel clipping, screen-reader speech, and physical input
are unverified by these nonvisual checks.

## Human-operated live Reduce Motion gate

An employee must not change this system-wide setting without explicit human
authorization. This opt-in fixture only reads the setting and native
notifications. It does not open Settings, toggle controls, post notifications,
or write preferences. Do not launch this mode until an authorized human is
ready to operate the setting and restore it.

1. Record the current **Reduce motion** value in System Settings → Accessibility
   → Motion (or Display on versions that place it there). Keep this original
   value available after any timeout or interruption.
2. From the repository root, run the prebuilt-host fixture. On the shared agent
   host, reserve both `desktop_input:1` and exclusive
   `macos:rolling-text-qualification` through the resource broker.

   ```sh
   pnpm --filter @octane-xplat/rolling-text test:macos-runtime -- --human-reduced-motion
   ```

3. Confirm `ROLLING_TEXT_HUMAN_BASELINE` matches the recorded setting. If the
   initial value is ON, the first `ROLLING_TEXT_HUMAN_TOGGLE` asks for OFF.
   Change the actual checkbox yourself only when a marker asks for it.
4. At `ROLLING_TEXT_HUMAN_QUEUED`, turn ON within two minutes. The fixture holds
   a ten-minute roll with a newer destination queued. It requires the genuine
   OS notification and checks that the native text becomes `latest`, alpha
   becomes 1 and translation becomes 0 within two seconds.
5. At the next toggle marker, turn OFF. The fixture checks native interpolation
   resumes. If the original setting was ON, a final marker asks for ON and
   checks another immediate settle. These steps restore either starting value.
6. Require `ROLLING_TEXT_HUMAN_OK` with `restored` equal to the baseline and
   `subviews:0`, plus host exit 0. Verify the checkbox still matches your original
   value. On failure or Ctrl-C, restore it yourself before retrying; the fixture
   deliberately cannot restore a system-wide preference for you.

The output streams markers while the process runs. Each requested transition
times out after two minutes, and the runner stops only its own host after nine
minutes. Cleanup removes the fixture's tree and observer; earlier automatic
qualification covers cancellation and repeated unmounts. This human-operated
mode is prepared, but has not been executed or accepted.

To validate the live fixture's bundle without launching a host or waiting for
input, use:

```sh
pnpm --filter @octane-xplat/rolling-text test:macos-runtime -- --human-reduced-motion --build-only
```
