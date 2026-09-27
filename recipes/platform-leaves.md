# Use platform-specific implementations from shared code

ID: platform-leaves
Targets: web, ios, android
Related APIs: xplat typecheck, moduleSuffixes, .web.tsrx, .native.tsrx, .ios.tsrx, .android.tsrx

## Starting point

A working scaffolded app and a component whose implementation needs browser or
native APIs. The reader knows basic component props. Package publication is
outside this recipe's scope.

## Requirements

- Preserve one shared caller and a compatible prop contract.
- Select the intended implementation for each target without runtime branching.
- Keep platform-only APIs inside their matching leaves.

## Acceptance criteria

- AC1: The same shared import reaches the browser implementation on web and the native implementation on iOS and Android.
- AC2: On iOS and Android, an OS-specific implementation takes precedence over a native fallback only on its own OS.
- AC3: The reader can typecheck the shared caller and its .tsrx leaves for each target using the documented import and shim conventions.

## Documentation

- AC1: [Suffix pattern](../docs/module-resolution.md#the-suffix-pattern) and [compatible contracts](../docs/module-resolution.md#what-belongs-in-each-file).
- AC2: [Resolution order](../docs/module-resolution-notes.md#suffix-convention).
- AC3: [TypeScript and .tsrx shims](../docs/module-resolution-notes.md#typescript).
