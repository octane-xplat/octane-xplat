# create-octane-xplat

> Get a TypeScript app running, then build its first useful flow with your
> coding agent.

Xplat's target direction spans web, iOS, Android, macOS, Windows, and Linux.
This starter configures **web, iOS, and Android**. macOS, Windows, and Linux
are separate experiments — an AppKit host, a WinUI 3 scaffold with runtime
verification pending, and a WebKitGTK webview host. See
[target support](https://octane-xplat.goddardai.org/spec#choose-your-targets).
The framework is `0.x` and its API surface is still changing.

With Node.js and pnpm 11.24.0 installed:

```sh
pnpm create octane-xplat my-app
```

The creator copies the template, installs dependencies with pnpm, and starts
the web dev server. Open the printed URL and open `my-app` in your agent.
Ask it to read `AGENTS.md` and `.agents/skills/xplat/SKILL.md`, then build a
packing checklist with add, pack, and remove actions using in-memory state.
Check the result before asking for the next feature: add “Passport” and
“Charger,” pack Passport, and confirm that one item remains. Reloading should
clear the list in this in-memory version. The
[first-flow guide](https://octane-xplat.goddardai.org/toolchain#build-and-check-your-first-flow)
includes the full prompt and failure checks.

The generated app pins pnpm 11.24.0. Its `pnpm-workspace.yaml` loads
`@octane-xplat/patches` as a `configDependencies` package, making the
framework patches available during the first install.

Leave the server running while you edit. After stopping it, restart from the
app directory:

```sh
cd my-app
pnpm dev            # web
```

From that directory, these commands run other targets or check the app:

```sh
pnpm dev:ios        # needs macOS, Xcode, and NativeScript setup
pnpm dev:android    # needs Android SDK, compatible JDK, and NativeScript setup
pnpm lint
pnpm typecheck      # web + native tsconfigs
pnpm build          # web production bundle
```

[Get a working app and iterate](https://octane-xplat.goddardai.org/toolchain)
provides prerequisites, live-update boundaries, and version guidance. The
starter's Xplat skill is included; NativeScript's official skills are optional
and installed separately. Ask your agent to report checks and targets actually
run. [llms.txt](https://octane-xplat.goddardai.org/llms.txt) indexes the docs.
