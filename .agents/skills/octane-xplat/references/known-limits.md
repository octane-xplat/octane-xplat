# Known limits — internal/probe state

Consumer-facing limits moved to `docs/known-limits.md` (a published guide,
re-verified each pre-release sweep — that file is canonical). This file
keeps only lab/probe state that shouldn't be reader-facing.

## Uncharacterized flakes (seen, not root-caused)

- list cell-restore on Android once
- `anim settled` timing variance
- one `modal texts` flake
- `getViewById` can return dead JS views (`loaded=false`) — `notify()`
  probes can silently pass against stale nodes
- gallery chips receive taps but `onPress` never fires — long-press also
  fails; hit-area mismatch suspected
- iOS sheet demo close path throws `View not added to this instance` in
  modal cleanup — filed under Silo `modal-overlay-boundary`

When a flake is root-caused it either gets fixed or graduates into
`docs/known-limits.md` — don't copy entries the other direction.
