### Run the installed CLI directly

The `xplat` command supplied by `octane-xplat` now starts the native Go executable directly, without a Node launcher. Allow install scripts for both `octane-xplat` and `@octane-xplat/cli`; new starters and framework upgrades include these permissions.

```json
{ "trustedDependencies": ["octane-xplat", "@octane-xplat/cli"] }
```

[CLI installation and repair](https://octane-xplat.goddardai.org/packages/cli#native-executable)
