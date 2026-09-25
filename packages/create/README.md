# create-octane-xplat

> Scaffolds an Octane xplat app — one codebase targeting web, iOS, and
> Android via NativeScript.

```sh
pnpm create octane-xplat my-app
# or: npm create octane-xplat my-app
```

Copies the starter template (vite + nativescript configs, shared `src/`,
`App_Resources`, pinned workspace deps), installs dependencies with pnpm,
and starts the web dev server. From there:

```sh
pnpm dev            # web
pnpm dev:ios        # iOS simulator — needs the NativeScript toolchain
pnpm dev:android    # Android — needs the NativeScript toolchain
pnpm typecheck      # web + native tsconfigs
```

Docs: [Running and checking an app](https://octane-xplat.goddardai.org/toolchain)
