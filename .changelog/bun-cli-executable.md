### Run Xplat with Bun or a standalone executable

**Breaking change:** the npm `xplat` command now requires Bun 1.4.3 or later
on your PATH. Install Bun before running an existing app's CLI commands:

```sh
bun --version
pnpm xplat doctor
```

Standalone release executables include Bun and the CLI dependencies in one
file. They extract a cached payload on first launch. Node, pnpm, and platform
toolchains remain necessary for app builds.

[CLI setup and executables](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md#single-file-executable)
