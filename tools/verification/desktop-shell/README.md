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

### Remote journey host (`DESKTOP_SHELL_MACOS_HOST`)

The journey phase can run against another Mac over SSH (passwordless,
`ssh -o BatchMode=yes`). The build phase always stays local; the journey
scp's the DMGs and the `macos-input` binary into
`~/agent-scratch/octane-xplat/hushed-dew/<run>/` on the host, runs every
host command (install, codesign, launch, `defaults`, input helper) over
ssh, and streams app markers back locally. The remote folder starts with
a README declaring everything in it disposable.

```sh
DESKTOP_SHELL_WORK=research/desktop-shell/<same-dir> \
DESKTOP_SHELL_MACOS_HOST=skymac.local \
goddard-agent resource run --json '{"resources":{"exclusive":["device:skymac"],"desktop_input":1},"purpose":"desktop-shell journey (skymac)"}' \
  -- node tools/verification/desktop-shell/macos.mjs --phase journey
```

On an SSH session host, `macos-input trusted` reports
`ax=false post=false` — the runner then records each `os-input`/`ax-action`
step as `blocked: skymac SSH session lacks Accessibility/PostEvent
permission` and still runs the in-process steps (install, launch, markers,
v2 restore, uninstall, defaults). It never falls back to local input, and
it never uses `osascript`/System Events on the remote host (that hangs on
a TCC prompt). Local execution remains the default when the env var is
unset.

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
  input-dependent steps record `blocked` in `evidence.json`; in-process
  steps still run. It never simulates input.
- v2 installs over v1 to prove defaults persistence (`RESTORED name=Ada`);
  the test's own defaults domain is deleted at the end.
- Per-step results, artifact SHA-256s, and platform versions land in
  `<work>/evidence.json`.

# Desktop-shell journey (Linux GTK)

Same observable contract from packed tarballs in an external consumer, on
GTK4 via `@octane-xplat/linux-gtk/host`. The build phase runs on the Mac
(`xplat build --targets linux` produces two `.tar.gz` app archives); the
journey phase runs in a disposable Docker container on `andromeda.local`
under `~/agent-scratch/octane-xplat/hushed-dew/linux-run-N/` (kept for
evidence; README declares it disposable — remove manually when done).

- `app/main.gtk.ts` — the GTK entry: `runGtkApp` + `setWindowContentResolver`
  (`@octane-xplat/linux-gtk/host`), `openWindow`, `appMenu`, `createTray` +
  `keepAppResident`, `createGlobalShortcuts({ appId })`, platform `storage`.
  `journey.ts`/`App.tsrx`/`Inspector.tsrx` are shared unchanged with macOS.
- `linux.mjs` — the runner (`--phase build|journey|all`).
- `linux/container/` — Dockerfile (Debian trixie: gjs, GTK4, Xvfb, openbox, xdotool,
  pyatspi, at-spi2, KDE portal + kglobalacceld), `run.sh` (emits
  `STEP|name|inputClass|result|detail`), `ax.py` (pyatspi helper),
  `watcher.js` (test-owned StatusNotifierWatcher — no Plasma shell exists).

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"desktop-shell linux build"}' \
  -- bunx turbo run test:desktop-shell:linux --filter=@xplat/verification -- --phase build

DESKTOP_SHELL_WORK=research/desktop-shell/<same-dir> \
goddard-agent resource run --json '{"resources":{"exclusive":["device:andromeda"]},"purpose":"desktop-shell linux journey"}' \
  -- node tools/verification/desktop-shell/linux.mjs --phase journey
```

## Linux input classes

- **`os-input-x11-xtest`** — `xdotool` against Xvfb + openbox: typing,
  Tab/Space, in-window menu accelerators, F10 menubar navigation, and clicks
  on the Submit and Inspector Close buttons. Click targets come from the app's
  `JOURNEY BOUNDS` markers (`compute_bounds`, re-emitted after the first
  frame) plus the client origin from `xwininfo`, never from AT-SPI extents —
  GTK 4 reports unreliable extents (`0,0`), and a click there lands on the
  first menubar item and opens a popover that takes all later input.
- **`x11-wm-delete-message`** — `xdotool windowclose` sends WM_DELETE to the
  Inspector during the v2 launch. GTK 4.18 under Xvfb + openbox crashes on
  this path even in a plain-GJS control (see
  `.agents/docs/upstream-limitations.md`), so the step runs last and does not
  gate other steps; it records `blocked` when no Inspector window opened.
- **`os-input-x11-xtest-via-portal`** — xdotool presses the portal-assigned
  trigger while a foreign X client (xeyes) is focused; proves the KDE
  portal + kglobalacceld delivered the global shortcut in the background.
- **`atspi`** — pyatspi reads/asserts roles, names, focused state and window
  presence; the `app menu: AT-SPI activation` step also invokes the menu
  item's AT-SPI action. Neither is counted as OS input.
- **`dbus-shell-protocol`** — a separate `gdbus` process drives the SNI /
  `com.canonical.dbusmenu` protocol surface (`GetLayout`, `Event clicked`,
  `NameHasOwner`). It exercises the real shell contract but is not OS input.
- **`in-process`** — install/uninstall/desktop-entry assertions and stdout
  markers only.

## Known capability differences vs macOS

- GTK has no global menubar — the app menu is in-window; both the accelerator
  path and the AT-SPI activation path are recorded separately.
- There is no system tray host in the container — `watcher.js` plays the
  StatusNotifierWatcher role so `createTray` exercises the real SNI/dbusmenu
  protocol surface.
- Global shortcuts go through the XDG portal + KDE backend; when the portal
  cannot bind non-interactively the step records `blocked` with the exact
  error, never an in-process fallback.
- Steps that depend on an earlier step record `blocked: <dependency>` so a
  single failure cannot mask independent results.

# Desktop-shell journey (Windows)

Windows has no downstream app workflow yet, so this lane cannot install packed
tarballs into an external consumer. It follows the packaged-runtime route of
the package runtime tests instead. The build phase stages `app/` under
`apps/windows/src/.desktop-shell-journey/` (ignored) and bundles v1 (0.1.0) and
v2 (0.2.0) with the harness Vite config (`XPLAT_WINDOWS_ENTRY` selects the
entry). The journey phase copies the packaged NativeScript Windows runtime on
`windy` into `%USERPROFILE%\agent-scratch\octane-xplat\hushed-dew\windows-<id>\`,
replaces its `app\` with each bundle, and registers it with
`Add-AppxPackage -Register`. A scheduled task then drives the app from the
interactive session.

- `app/main.windows.ts` — mounts through `renderNativeScriptApp`, supplies the
  Inspector through `Application.setWindowContentResolver`, and adds a
  Windows-only `Open Inspector` app-menu item.
- `windows.mjs` — the runner (`--phase build|journey|all`).
- `windows/driver.ps1` — the in-session driver: SendInput for keyboard and
  mouse, and UI Automation for names, control types, focus, and Invoke.

```sh
bunx turbo run test:desktop-shell:windows --filter=@xplat/verification -- --phase build

goddard-agent resource run --json '{"resources":{"exclusive":["device:windy"]},"purpose":"desktop-shell windows journey"}' \
  -- node tools/verification/desktop-shell/windows.mjs --phase journey
```

## Windows input classes

- **`os-input-sendinput`** — SendInput keyboard and mouse aimed at UIA
  bounding rectangles. Chords use right Ctrl unless Alt is held (left
  Ctrl+Alt), the path the app-menu runtime test pins for WinUI accelerators.
- **`os-input-sendinput-background`** — the global shortcut is pressed while
  Notepad is the foreground process. The step records `blocked` if Notepad
  never became foreground.
- **`uia`** / **`uia-pattern`** — UIA reads, and UIA `Invoke`. These are not OS
  input. The Inspector open step falls back to `Invoke` when the mouse click
  misses the flyout item, and is labeled `uia-pattern` when it does.
- **`in-process`** — package registration, markers, and LocalState checks.

## Known capability differences vs macOS and Linux

- The UIA tree exposes no AutomationId for `testID`, so the driver matches
  controls by control type and visible name.
- Removing an MSIX package deletes its LocalState, so settings do not
  survive uninstall. The step expects that.
- The tray icon has no aimed OS-input path: managed UIA sees no notification
  area buttons in the Windows 11 XAML taskbar. The step records `blocked`.
