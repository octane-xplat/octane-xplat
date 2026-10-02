# Use platform-specific implementations from shared code

ID: platform-leaves
Targets: web, ios, android, macos, linux
Related APIs: xplat typecheck, moduleSuffixes, .web.tsrx, .mobile.tsrx, .ios.tsrx, .android.tsrx, .macos.tsrx, .windows.tsrx, .linux.tsrx

## Starting point

A working scaffolded app and a component whose implementation needs browser or
native APIs. The reader knows basic component props. Package publication is
outside this recipe's scope.

## Requirements

- Preserve one shared caller and a compatible prop contract.
- Select the intended implementation for each target without runtime branching.
- Keep platform-only APIs inside their matching leaves.

## Acceptance criteria

- AC1: The same import reaches `.web` in a browser or DOM webview; native targets select their most-specific implementation and fall back to the unsuffixed module.
- AC2: `.mobile` overrides the unsuffixed default on iOS and Android; `.ios` and `.android` override `.mobile` only on their matching OS, and `.macos` overrides the default on macOS.
- AC3: The reader can typecheck the shared caller and its .tsrx leaves on web, iOS, Android, and macOS using the documented import and shim conventions.
- AC4: Existing Linux WebKitGTK apps retain `.linux` precedence over `.web` during migration; new DOM webview frontends use `.web`.

## Documentation

- AC1: [File variants and resolution order](../docs/platform/module-resolution.md#file-variants) and [choosing a variant](../docs/platform/module-resolution.md#choosing-a-variant).
- AC2: [Resolution order](../docs/platform/module-resolution.md#file-variants).
- AC3: [TypeScript, .tsrx shims, and target commands](../docs/platform/module-resolution.md#typescript).
- AC4: [Linux compatibility resolution](../docs/platform/module-resolution.md#file-variants) and [experimental Linux target](../docs/start/toolchain.md#experimental-linux-target-webkitgtk-webview).
