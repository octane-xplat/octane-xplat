# Layout space contracts: safe-area edges, keyboard offset, bounded grid tracks, measured bounds

`SafeArea` gained `edges` (`'top' | 'right' | 'bottom' | 'left'`, default
all four) and now consumes each inset once — a nested `SafeArea` pads only
the edges its ancestors left. `ignoreSafeArea` is deprecated in favor of
`edges={[]}`; `edges` wins when both are set. `KeyboardAvoiding` exposes
`enabled` and `keyboardVerticalOffset` (React Native names), subtracts a
consumed bottom inset from the keyboard inset so nesting inside `SafeArea`
never double-counts, and `useKeyboardInset({ enabled: false })` reads 0
without subscribing (no iOS frame observer or Android resize lease).

`Grid` `rows`/`columns` now have one bounded grammar on every platform —
`auto`, a fixed dip length, or a star weight (`*`/`2*`), comma- or
whitespace-separated as a string, or typed as a `GridTrack` array.
`'48px'`/`'2fr'` spellings normalize to the equivalent dip/star value.
CSS-only syntax (`minmax`, `repeat`, `%`, line names, `min-content`) now
logs a `[Grid]` warning and lays out as `auto` on every host — including
web, where those tokens previously passed through raw to CSS, and macOS,
where the renderer accepted a wider set. Child `row`/`col` are documented
as zero-based track indices (never CSS's one-based line numbers) and
`rowSpan`/`colSpan` as track counts.

`useMeasure()` bounds are now one coordinate space everywhere: dips from
the top-left of the app surface (web viewport, macOS window content area,
the app's root surface on iOS/Android). Previously the mobile leaf
reported raw screen coordinates, which differ under Android multi-window
or moved iPadOS windows. The `ref` attachment is typed and `bounds ===
null` is the documented readiness signal.

Migrating: replace `ignoreSafeArea` with `edges={[]}`; move any web-only
CSS track syntax out of `Grid` `rows`/`columns` (or keep it under the
`web` escape bag knowing it has no native equivalent); expect `useMeasure`
positions under split-screen/moved windows to describe the app surface
rather than the physical screen.
