# Windows experiment (WinUI 3 via `@nativescript/windows`)

Path A of the windows investigation ([docs/windows-notes.md](../../docs/windows-notes.md),
decision #65): this scaffold is intended to run the shared harness on upstream's in-flight
`@nativescript/core` windows platform ([NativeScript#11468](https://github.com/NativeScript/NativeScript/pull/11468)
preview builds) inside the `@nativescript/windows` WinUI 3 host. No custom
renderer — `@nativescript-community/octane` drives core views as on
iOS/Android, and `.windows.*` leaves sit ahead of the unsuffixed native default in
the suffix chain.

## Status

Scaffolded and bundle-verified on macOS (2026-09-28): `vite build` targeting
windows emits `.ns-vite-build/bundle.mjs` + `vendor.mjs`. Nothing has run on
a Windows host yet — the runtime is win32-only.

Pins, all deliberate:

- `@nativescript/core` / `@nativescript/vite` come from
  `pkg.pr.new/...@7d0adce` (the original revision of PR #11468, adding a
  percentage-size fix to `feat/windows`). Use the commit pin: the PR-number
  URL moves when upstream pushes, invalidating the lockfile checksums.
- `@nativescript/windows` is exact `0.1.0-alpha.144` — ranges match
  incompatible older prereleases.
- `nativescript` CLI is the dev tag `9.1.2-dev.2026-09-24-*`, which already
  carries the windows platform (`ns run windows`, `ns doctor windows`);
  released CLI waits on `nativescript-cli#6065`.
- The workspace carries preview-specific patches for `core@9.1.3-next.2`
  and `vite@8.0.13`; the commit pin preserves the versions they target.
- The app dedupes `@nativescript/core` to the PR build in vite config and
  tsconfig `paths`; workspace packages' devDeps would otherwise resolve
  `9.1.2` from inside `packages/*`.

## Running

Requires Windows 10 1809+ (the runtime ships arm64 DLLs; this harness has not
been verified in an arm64 VM),
.NET 10 SDK, Developer Mode enabled, and Node + pnpm. Then:

```sh
pnpm install          # in the repo root
pnpm --filter @xplat/app gen
pnpm -C apps/windows xplat dev --targets windows
# or: pnpm -C apps/windows windows
```

`pnpm -C apps/windows xplat doctor` checks the win32 host, exact
`@nativescript/windows` pin, .NET SDK ≥ 10, and the Developer Mode registry flag.
