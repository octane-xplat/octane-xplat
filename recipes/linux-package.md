# Package a Linux WebKitGTK app

ID: linux-package
Targets: linux
Related APIs: xplat build, xplat doctor, xplat.targets.linux.runtime, xplat.targets.linux.package, xplat.targets.linux.host.scheme, @octane-xplat/cli/linux, @octane-xplat/platform/host/web, desktopHost, @octane-xplat/platform/bridge.linux.ts

## Starting point

An existing Octane DOM frontend with a static Vite entry. The reader wants a
Linux desktop application and knows which application ID and URI scheme it owns.

## Requirements

- Configure an independent Linux app identity and its frontend build.
- Build and distribute the system WebKitGTK host with the frontend.
- Install, launch, and handle incoming links without the source checkout.
- Verify real Linux host services and understand the tested support boundary.

## Acceptance criteria

- AC1: The reader can configure the target, install its system prerequisites, and use doctor to detect invalid configuration or missing Linux runtime requirements.
- AC2: CLI packaging builds the frontend and ships the host, launcher, metadata, installer, and archive without calling the app's build script recursively; a failed frontend build preserves the prior app.
- AC3: The extracted archive and per-user installed app run after relocation without a source checkout or dev server; the desktop entry works with spaces in the installation path.
- AC4: The configured URI handler delivers cold-start and second-instance links to the app without loading incoming link URIs as frontend content.
- AC5: Each app ID owns its own persistent secret-storage schema and runtime instance; secrets survive restart and cannot be read by an app with a different ID.
- AC6: The reader can run automated bridge checks on Linux and distinguish verified behavior from visual, input, chooser, distro, and distribution-format limits.

## Documentation

- AC1: [App configuration](../docs/platform/linux-package.md#configure-the-app) and [runtime checks](../docs/platform/linux-package.md#check-the-runtime).
- AC2: [Build output and failure behavior](../docs/platform/linux-package.md#build-and-install) and [packaging tests](../packages/cli/test/linux-package.test.mjs).
- AC3: [Extraction and per-user installation](../docs/platform/linux-package.md#build-and-install) and [consumer verifier](../packages/cli/test/verify-linux-consumer.mjs).
- AC4: [URI registration and launch behavior](../docs/platform/linux-package.md#build-and-install) and [maintained consumer screen](../packages/cli/test/fixtures/linux-app/src/main.web.tsrx).
- AC5: [App identity](../docs/platform/linux-package.md#configure-the-app), [keyring ownership](../docs/platform/linux-package.md#check-the-runtime), and [consumer verifier](../packages/cli/test/verify-linux-consumer.mjs).
- AC6: [Automated verification and support limits](../docs/platform/linux-package.md#verify-before-distributing).
