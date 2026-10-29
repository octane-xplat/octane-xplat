# Set up and run an app

## Consumer apps

Use the [first-app guide](../../../../docs/start/toolchain.md) for prerequisites
and native tool setup. Run the creator from the parent directory; it prompts
for platforms, installs dependencies, and starts the development server.

```sh
pnpm create octane-xplat my-app
```

Run checks and subsequent dev sessions from the generated app directory. Only
use platform scripts enabled in that app's manifest.

```sh
cd my-app
pnpm dev
# Run these checks in another terminal in my-app:
pnpm lint
pnpm typecheck
pnpm build
pnpm xplat doctor
```

Keep the framework/compiler/native versions and managed patches aligned.
Inspect an upgrade before applying it, preserve app-specific dependencies,
and resolve custom-patch conflicts. Do not copy version numbers from this skill.

```sh
pnpm dlx @octane-xplat/cli@latest upgrade --check
# Apply the selected compatible set when upgrading is part of the task:
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm xplat doctor
pnpm typecheck
```

App starters carry their selected platforms' test scripts; follow
[testing](testing.md) rather than borrowing repository harness paths. Native
setup, device selection, signing, and experimental desktop hosts are covered
by the [toolchain guide](../../../../docs/start/toolchain.md).

For signed phone artifacts and store testing, follow the [native release
guide](../../../../docs/start/native-release.md). `xplat build` accepts target
selection and `--release`; artifact/signing/output options currently require
regenerating routes and invoking the app's NativeScript CLI directly.

```sh
pnpm exec xplat routes
pnpm exec xplat build --targets android --release
```

## Framework repository

These commands are for this monorepo, not a generated consumer app. Run them
from its root. For a single investigation, prefer the isolated probe runner
before editing the self-driving app harness.

```sh
pnpm install
pnpm probe doctor
pnpm probe run examples/probes/counter.tsrx --target web --watch
```

Use maintained root scripts for harness work and scoped typechecking for
package changes. The leading `...` includes the touched package's dependents.
Replace the UI filter with each package actually changed.

```sh
pnpm dev:web
pnpm typecheck:web
pnpm typecheck:mobile
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm lint
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
