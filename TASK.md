# Task: Remove the dead Grid `gap` prop

## Approved scope

This task is approved by the supervisor prompt. Remove `GridProps.gap` from the public UI contract because neither platform can implement it without changing grid child sizing and spans. Preserve each platform leaf's existing one-time warning for one release, reworded as a migration hint: `[Grid] gap was removed; use child margins`.

## Changes

- Remove `gap` from `GridProps` in `packages/ui/src/props.ts`.
- Update the Grid web and native leaves to warn once that `gap` was removed and recommend child margins.
- Update the `Grid gap` entry in `docs/known-limits.md` to say the prop was removed.
- Search `packages/demos` and `packages/app` for Grid `gap` usage and fix any call sites.
- Regenerate `packages/ui/types/props.d.ts` via `pnpm -F @octane-xplat/ui build`.
- Run `pnpm lint`, address only issues introduced by this task, and commit the scoped changes locally using a Conventional Commit.

## Constraints

Keep `FlexContainerProps.gap` intact. Do not edit `CHANGELOG.md` or `docs/status.md`. Use pnpm.

The `packages/demos` and `packages/app` scan found one Grid use and no Grid
`gap` call sites, so no call-site changes are needed.
