### `xplat` installs its native executable from npm

`@octane-xplat/cli` now installs the native Go `xplat` executable. A
postinstall step copies it from the optional payload package for your
machine: `@octane-xplat/cli-native-darwin-arm64`, `-darwin-x64`,
`-linux-x64`, `-linux-arm64` or `-win32-x64`. The `octane-xplat` package's
`xplat` command runs under plain Node again, without Bun.

**Breaking change:** the package manager must be allowed to run
`@octane-xplat/cli`'s install script. New starters list it already, and
`xplat upgrade` adds it for Bun projects:

```json
{ "trustedDependencies": ["@octane-xplat/cli"] }
```

If an install skipped the script, run `xplat` once. It prints the exact
command that finishes the installation:

```sh
node "/path/to/@octane-xplat/cli/install-native.mjs"
```

The separate `nim` CLI channel is
removed — the CLI publishes at the lockstep version like every other package.
