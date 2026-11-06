# Set up and run an app

## Consumer apps

Use the [first-app guide](../../../../docs/start/toolchain.md) for prerequisites
and native tool setup. Run the creator from the parent directory; it prompts
for platforms, installs dependencies, and starts the development server.

```sh
bun create octane-xplat my-app
```

Starters install `octane-xplat` for the shared CLI/compiler toolchain and
import Vite helpers from `octane-xplat/vite`. Keep direct declarations for
packages named in app imports, ambient types, or compiler peer contracts;
do not rely on umbrella dependencies being hoisted. Runtime and target-specific
packages stay app-owned. See the [toolchain package](../../../../docs/packages/package-toolchain.md).

Run checks and subsequent dev sessions from the generated app directory. Only
use platform scripts enabled in that app's manifest.

```sh
cd my-app
bun run dev
# Run these checks in another terminal in my-app:
bun run lint
bun run typecheck
bun run build
bun run xplat doctor
```

Keep the framework/compiler/native versions and managed patches aligned.
Inspect an upgrade before applying it, preserve app-specific dependencies,
and resolve custom-patch conflicts. Do not copy version numbers from this skill.

```sh
bunx @octane-xplat/cli@latest upgrade --check
# Apply the selected compatible set when upgrading is part of the task:
bunx @octane-xplat/cli@latest upgrade
bun run xplat doctor
bun run typecheck
```

App starters carry their selected platforms' test scripts; follow
[testing](testing.md) rather than borrowing repository harness paths. Native
setup, device selection, signing, and experimental desktop hosts are covered
by the [toolchain guide](../../../../docs/start/toolchain.md).

For signed phone artifacts and store testing, follow the [native release
guide](../../../../docs/start/native-release.md). `xplat build` accepts
`--aab` and `--key-store-*` options for Android (passwords via `*-env`
environment references), `--for-device`/`--provision`/`--team-id` for iOS,
and `--copy-to` for the produced artifact.

```sh
bun run xplat build --targets android --release --aab \
  --key-store-path "$ANDROID_UPLOAD_KEYSTORE" --key-store-alias upload \
  --key-store-password-env ANDROID_KEYSTORE_PASSWORD \
  --key-store-alias-password-env ANDROID_KEY_PASSWORD \
  --copy-to dist/app-release.aab
```

## Framework repository

These commands are for this monorepo, not a generated consumer app. Run them
from its root. For a single investigation, prefer the isolated probe runner
before editing the self-driving app harness.

```sh
bun install
bun run probe doctor
bun run probe run examples/probes/counter.tsrx --target web --watch
```

Use app-owned scripts for harness work and scoped typechecking for
package changes. The leading `...` includes the touched package's dependents.
Replace the UI filter with each package actually changed.

```sh
bun run --filter @xplat/web dev
bun run turbo run typecheck --filter=@xplat/web
bun run turbo run typecheck --filter=@xplat/mobile
bun run turbo run typecheck --filter=...@octane-xplat/ui
bun run lint
```

Before building or installing native targets, read the repository
[toolchain reference](../../../docs/toolchain.md) and the target's setup notes.
Device ownership, local SDK versions, and one-off simulator workarounds belong
there, not in universal setup instructions.

## Repository orientation

- `packages/ui`: shared components and public `/data` and `/routing` APIs.
- `packages/platform`: platform service contracts and implementations.
- `packages/app`, `packages/demos`, `apps/web`, `apps/mobile`: framework harnesses.
- `docs/`: app-building guides; `.agents/docs/`: contributor guidance and notes;
  `.agents/design/`: decisions and proposals.

The [repository map](../../../docs/repository.md) owns the complete layout.
