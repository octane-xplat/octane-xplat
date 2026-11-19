# Package verification runners

Use this index when maintaining framework packages, not when testing an app.
Run commands from the framework repository root with Bun 1.4.4. Turbo prepares
workspace dependencies and declarations. The owning package manifest is the
source of task names and supported arguments; check it before running a lane.

Reserve native-build, device and shared desktop resources for the complete
phase. Use the configured existing devices; never create or clone a device to
run a fixture. Before running iOS or Android checks across worktrees, follow
the [shared-host native target lock setup](toolchain.md#shared-host-native-target-locks).
Capture and inspect images only when authorized for the task.
A successful source, packed or programmatic-dispatch check does not establish
OS input, visual parity, accessibility or physical hardware behavior. Store run
results and gaps in Silo, and raw evidence in local storage.

See [MCP consumer verification](mcp-verification.md),
[AppKit verification](appkit-verification.md),
[VirtualList runners](notes/primitive-notes.md#virtuallist-regression-runners),
[native-leaf toolchain maintenance](toolchain.md#macos-native-leaf-verification-and-metadata-generator),
and [single-case probing](probing.md) for their prerequisites and ownership.

## movie-capture

Consumer guidance: [movie-capture](../../docs/app/movie-capture.md).

```sh
bun run turbo run test --filter=@octane-xplat/camera
bun run turbo run test:web --filter=@octane-xplat/camera
bun run probe run packages/camera/tests/movie-capture.android.tsrx \
  --target android --device DEVICE_ID --deps @octane-xplat/camera --timeout 130000
bun run probe run packages/camera/tests/movie-capture.macos.tsrx \
  --target macos --deps @octane-xplat/camera --timeout 120000
```

## navigation-ui

Consumer guidance: [navigation-ui](../../docs/app/navigation-ui.md).

```sh
bun run probe run examples/probes/landmark.macos.tsrx --target macos --watch
```

## power-search

Consumer guidance: [power-search](../../docs/app/power-search.md).

```sh
bun run probe run examples/probes/power-search-range.macos.tsrx --target macos --watch
```

```sh
bun run probe run examples/probes/power-search-entities.macos.tsrx --target macos --watch
```

```sh
bun run probe run examples/probes/power-search-scalars.macos.tsrx --target macos --watch
```

## tables

Consumer guidance: [tables](../../docs/app/tables.md).

```sh
bun run probe run examples/probes/table-scroll.macos.tsrx --target macos --watch
```

## updates

Consumer guidance: [updates](../../docs/app/updates.md).

```sh
# From the framework repository, choose your own test device IDs:
node scripts/with-target-lock.ts ios -- \
  bun run turbo run test:native-lifecycle --filter=@octane-xplat/updates -- \
  --target ios --device SIMULATOR_UDID
node scripts/with-target-lock.ts android -- \
  bun run turbo run test:native-lifecycle --filter=@octane-xplat/updates -- \
  --target android --device EMULATOR_SERIAL
```

## app-menu

Consumer guidance: [app-menu](../../docs/packages/package-app-menu.md).

```sh
APP_MENU_WINDOWS_HOST=WINDOWS_HOST \
APP_MENU_WINDOWS_RUNTIME='C:\path\to\windows\bin' \
bun run turbo run test:windows-runtime --filter=@octane-xplat/app-menu
```

## audio

Consumer guidance: [audio](../../docs/packages/package-audio.md).

```sh
bun run turbo run test:browser --filter=@octane-xplat/audio -- --foreground-budgets
bun run turbo run test:runtime --filter=@octane-xplat/audio -- --foreground-budgets --target ios --device OWNED_UDID
bun run turbo run test:macos-budgets --filter=@octane-xplat/audio
```

## auth

Consumer guidance: [auth](../../docs/packages/package-auth.md).

```sh
bun run probe run examples/probes/auth-buttons.macos.tsrx --target macos --watch
```

```sh
bun run probe run examples/probes/apple-auth.macos.tsrx --target macos --watch
```

## cli

Consumer guidance: [cli](../../docs/packages/package-cli.md).

```sh
bun run turbo run build:go --filter=@octane-xplat/cli
bun run turbo run test:go-cli --filter=@octane-xplat/cli
```

```sh
turbo run build:go --filter=@octane-xplat/cli
bun run xplat catalog --json
```

## docs-search

Consumer guidance: [docs-search](../../docs/packages/package-docs-search.md).

```sh
bun run turbo run test --filter=@octane-xplat/docs-search
bun run turbo run test:model --filter=@octane-xplat/docs-search
```

## icons

Consumer guidance: [icons](../../docs/packages/package-icons.md).

```sh
bun run probe doctor
bun run probe run examples/probes/icons.macos.tsrx --target macos --deps @octane-xplat/icons
bun run probe run examples/probes/icons.tsrx --target web --deps @octane-xplat/icons
bun run probe run examples/probes/icons.tsrx --target ios --device SIMULATOR_UDID --deps @octane-xplat/icons
```

## image-crop

Consumer guidance: [image-crop](../../docs/packages/package-image-crop.md).

```sh
bun run turbo run test --filter=@octane-xplat/image-crop
bun run turbo run typecheck --filter=@octane-xplat/image-crop
bun run turbo run typegen --filter=@octane-xplat/image-crop
bun run probe doctor
bun run probe run examples/probes/image-crop-selection.tsrx --target web --deps @octane-xplat/image-crop
bun run probe run packages/image-crop/tests/selection.macos.tsrx --target macos --deps @octane-xplat/image-crop
```

## linux-gtk-renderer

Consumer guidance: [linux-gtk-renderer](../../docs/packages/package-linux-gtk-renderer.md).

```sh
xvfb-run -a bun run turbo run test:runtime --filter=@octane-xplat/linux-gtk -- test/ui-icon.test.mts
```

## nano-icons

Consumer guidance: [nano-icons](../../docs/packages/package-nano-icons.md).

```sh
bun run turbo run build --filter=@octane-xplat/nano-icons
bun run turbo run typecheck --filter=@octane-xplat/nano-icons
bun run turbo run test --filter=@octane-xplat/nano-icons
bun run turbo run pack:check --filter=@octane-xplat/nano-icons
```

```sh
bun run probe doctor
bun run probe run examples/probes/nano-icons.tsrx --target web --deps @octane-xplat/nano-icons
bun run probe run examples/probes/nano-icons.tsrx --target ios --device SIMULATOR_UDID --deps @octane-xplat/nano-icons
bun run probe run examples/probes/nano-icons.macos.tsrx --target macos --deps @octane-xplat/nano-icons
```

## network

Consumer guidance: [network](../../docs/packages/package-network.md).

```sh
bun run turbo run test typecheck --filter=@octane-xplat/network
bun run turbo run test:runtime --filter=@octane-xplat/network -- --target web
```

## secure-storage

Consumer guidance: [secure-storage](../../docs/packages/package-secure-storage.md).

```sh
bun run turbo run test:macos --filter=@octane-xplat/secure-storage
bun run turbo run test:packed --filter=@octane-xplat/secure-storage
bun run turbo run test:macos-runtime --filter=@octane-xplat/secure-storage
```

```sh
bun run turbo run test:windows --filter=@octane-xplat/secure-storage
```

## share

Consumer guidance: [share](../../docs/packages/package-share.md).

```sh
bun run probe run examples/probes/share.macos.tsrx --target macos --watch
```

## table

Consumer guidance: [table](../../docs/packages/package-table.md).

```sh
bun run probe run packages/table/tests/fixtures/probes/interactive.tsrx --target web --deps @octane-xplat/table
bun run probe run packages/table/tests/fixtures/probes/interactive.tsrx --target ios --device YOUR_BOOTED_SIMULATOR_UDID --deps @octane-xplat/table
bun run probe run packages/table/tests/fixtures/probes/geometry.tsrx --target macos --deps @octane-xplat/table
```

## tray

Consumer guidance: [tray](../../docs/packages/package-tray.md).

```sh
# Windows: signed-in host with the pinned NativeScript runtime built.
TRAY_WINDOWS_HOST=WINDOWS_HOST \
TRAY_WINDOWS_RUNTIME='C:\path\to\windows\bin' \
bun run turbo run test:windows-runtime --filter=@octane-xplat/tray

# Linux: a VM reachable over SSH with gjs, dbus-run-session, and xvfb.
TRAY_GTK_HOST=LINUX_HOST TRAY_GTK_DIRECT=1 \
bun run turbo run test:gtk-runtime --filter=@octane-xplat/tray

# macOS: packaged fixture app.
bun run turbo run test:macos-packaged --filter=@octane-xplat/tray
```

## context-menu

Consumer guidance: [context-menu](../../docs/platform/context-menu.md).

```sh
bun run probe run examples/probes/native-context-menu.macos.tsrx --target macos --watch
```

## date-picker

Consumer guidance: [date-picker](../../docs/platform/date-picker.md).

```sh
bun run probe run examples/probes/native-date-picker.macos.tsrx --target macos --watch
```

## linux-package

Consumer guidance: [native GTK packaging](../../docs/platform/linux-gtk.md).
The former WebView-host consumer verifier was removed. The native CLI
packaging gate verifies GTK archive construction, relocation and publication
ownership; it does not execute GTK or establish desktop input.

```sh
bun run turbo run test:go-linux-build --filter=@octane-xplat/cli
```

## local-notifications

Consumer guidance: [local-notifications](../../docs/platform/local-notifications.md).

```sh
bun run probe run examples/probes/notification-permissions.macos.tsrx --target macos --watch
```

## platform-services

Consumer guidance: [platform-services](../../docs/platform/platform-services.md).

```sh
bun run probe run examples/probes/auth-session.macos.tsrx --target macos --watch
```

## web-rendering

Consumer guidance: [web-rendering](../../docs/platform/web-rendering.md).

```sh
bun run turbo run test typecheck --filter=@octane-xplat/web-host
XPLAT_WEB_BROWSERS=chromium,firefox,webkit \
  bun run turbo run test:packed --filter=@octane-xplat/web-host
```

## component-workshop

Consumer guidance: [component-workshop](../../docs/testing/component-workshop.md).

```sh
bun run turbo run typegen --filter=@octane-xplat/lib
bun run turbo run typegen --filter=@octane-xplat/ui
bun run turbo run typegen --filter=@octane-xplat/workshop
bun run turbo run test --filter=@octane-xplat/workshop
bun run turbo run test:packed --filter=@octane-xplat/workshop
bun run turbo run test:packed:linux --filter=@octane-xplat/workshop
```

## Renderer and editor integration

Use an Apple Silicon Mac with Xcode command-line tools for the AppKit editor
lanes. Programmatic dispatch is separate from physical input and hit-testing.

```sh
bun run turbo run test:macos test:packed --filter=@octane-xplat/richtext
bun run turbo run test test:packed test:portals test:gestures --filter=@octane-xplat/macos-appkit
bun run turbo run typegen test test:native --filter=@octane-xplat/motion
```

## Drag-and-drop integration

Check geometry/core behavior separately from scroll arbitration and OS gesture
delivery. Android runtime and macOS WebView drag require their own evidence.

```sh
bun run turbo run typecheck test build pack:check --filter=@octane-xplat/dnd-kit
bun run turbo run test --filter=@octane-xplat/web
bun run probe run packages/dnd-kit/tests/appkit-scroll.macos.tsrx --target macos
```

## Text-entry readiness

Install the Playwright Chromium browser before the host readiness lane. The
check uses an OS-assigned port and captures no images. It does not establish
native IME, VoiceOver or TalkBack behavior.

```sh
bun run turbo run input:readiness --filter=@octane-xplat/web
```

## Scroll visibility

The maintained visibility probe exercises root binding, threshold updates,
imperative observation, and cleanup. A passing dispatch probe does not establish
OS input or accessibility behavior.

```sh
bun run probe run examples/probes/intersection-observer.tsrx --target web --deps @octane-xplat/intersection-observer
```

