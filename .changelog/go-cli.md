### Replace the CLI with a native Go executable

`xplat` is now a native Go executable. The TypeScript and Nim implementations
are removed; the same command surface — dev, build, doctor, typecheck, lint,
fmt, routes, clean, docs, code, actions, diagnostics, patches, updates,
upgrade, add, fonts, workshop — is covered by the Go implementation and its
checked-in command catalog.

**Breaking change:** the installed package resolves a platform binary
(darwin/linux/windows on arm64/amd64) instead of running JavaScript dispatch.
The download is much smaller: the npm tarball carries the native binary plus
the published Vite/plugin/worker exports, while heavy engine dependencies stay
optional peers resolved from the selected project.

```sh
bun add --dev @octane-xplat/cli
bun run xplat doctor
```

Project toolchain operations (formatting, route baking, packaging workers)
still run as explicit JavaScript workers from the selected project's installed
packages; the native executable never falls back to a JavaScript CLI.
