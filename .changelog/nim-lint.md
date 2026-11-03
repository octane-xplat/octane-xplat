### Run project lint checks with the experimental native CLI

The parallel Nim CLI can run the project's regular-source and TSRX lint checks
on macOS Apple Silicon. Install `@octane-xplat/lint` in the project and provide
Node >=22.22.2. The engine keeps its rules, ignores and safe fixes; the native CLI
owns its child processes. The native tarball includes neither Node nor lint tools.

```sh
bun add --dev @octane-xplat/lint
xplat lint src
xplat lint --fix src
```

This applies to the experimental `nim` channel. Native `fmt` remains pending.
See [native CLI setup](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable)
and [lint configuration](https://octane-xplat.goddardai.org/package-lint#project-configuration).
