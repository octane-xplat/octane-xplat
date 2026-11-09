# Desktop-shell journey (macOS)

A reproducible end-to-end journey against an **installed packaged app** built
from packed tarballs in an external consumer — no workspace imports, no dev
server. Assertions use text, accessibility identifiers, focus, and lifecycle
markers printed on the app's stdout (`JOURNEY <marker>`). No screenshots, no
image capture.

## Layout

- `app/` — the reference app copied into the consumer's `src/`:
  - `journey.ts` — platform-agnostic stores and menu/tray/hotkey definitions.
  - `App.tsrx` — main window (TextInput `journey-name`, Button `journey-submit`,
    Text `journey-status`, `journey-count`, `journey-error`).
  - `Inspector.tsrx` — secondary window (`inspector-title`, `inspector-close`).
  - `main.macos.ts` — the AppKit entry: `runMacOSApp` +
    `setWindowContentResolver` (`@octane-xplat/macos-appkit/host`),
    `openWindow` (`@octane-xplat/ui`), `appMenu`, `createTray` +
    `keepAppResident`, `createGlobalShortcuts`, platform `storage`.
- `macos-input.c` — AX-tree queries and CGEvent posting at the HID tap,
  compiled by the runner with `xcrun clang`.
- `macos.mjs` — the runner (`--phase build|journey|all`).

## Running

Two resource reservations — the build phase must not hold desktop input:

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"desktop-shell build"}' \
  -- bunx turbo run test:desktop-shell:macos --filter=@xplat/verification -- --phase build

DESKTOP_SHELL_WORK=research/desktop-shell/<same-dir> \
goddard-agent resource run --json '{"resources":{"desktop_input":1},"purpose":"desktop-shell journey"}' \
  -- node tools/verification/desktop-shell/macos.mjs --phase journey
```

## What each input class proves

- **`os-input`** — a CGEvent posted at `kCGHIDEventTap` from a separate process
  reached the app: real clicks, typing, Tab/Space, menu accelerators, global
  hotkeys while another app is frontmost, Cmd+W/Cmd+Q window/app lifecycle.
- **`ax-action`** — `AXUIElementPerformAction(kAXPressAction)`: an accessibility
  fallback, explicitly labeled; it does *not* prove OS hit-testing. Used when
  MenuBarAgent hosting refuses a synthetic click on a status item.
- **`in-process`** — stdout markers and packaged-file assertions only.

## Limits

- If `macos-input trusted` reports no accessibility/post-event access, the
  journey lane records `blocked` in `evidence.json` and stops — it never
  simulates input.
- v2 installs over v1 to prove defaults persistence (`RESTORED name=Ada`);
  the test's own defaults domain is deleted at the end.
- Per-step results, artifact SHA-256s, and platform versions land in
  `<work>/evidence.json`.
