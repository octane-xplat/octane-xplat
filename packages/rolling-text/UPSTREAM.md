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
