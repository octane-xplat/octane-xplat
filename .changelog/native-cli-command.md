### Run the installed CLI directly

The installed `xplat` command now starts its native executable directly. Allow install scripts for both `octane-xplat` and `@octane-xplat/cli` so the packages can place the executable. New starters and framework upgrades set these permissions. In Bun, the entries go in `trustedDependencies`.

```json
{ "trustedDependencies": ["octane-xplat", "@octane-xplat/cli"] }
```

[CLI installation and repair](https://octane-xplat.goddardai.org/package-cli#native-executable)
