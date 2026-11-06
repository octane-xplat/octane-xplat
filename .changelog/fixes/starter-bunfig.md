### Bun starters include bunfig.toml

Bun apps created with 0.19.0 are missing the hoisted-linker setting.

The published 0.19.0 creator omitted `template/bunfig.toml` from its tarball,
so Bun apps created with it have no `bunfig.toml` and do not get the flat
dependency layout NativeScript expects. Add this file at the app root, then
reinstall:

```toml
[install]
linker = "hoisted"
exact = true
```

```sh
bun install
```
