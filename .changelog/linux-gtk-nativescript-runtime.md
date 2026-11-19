### Package native Linux GTK apps with NativeScript

**Breaking change.** Linux apps configured with `"runtime": "gtk"` now ship NativeScript, Mason, and the native bindings for x86_64 and ARM64. Update the CLI and GTK renderer together. Replace any custom `gjs -m` launch script with the generated app launcher.

```sh
bun run xplat build --targets linux
./dist/linux/my-app/my-app
```

See the [Linux GTK app guide](https://octane-xplat.goddardai.org/linux-gtk) for the system libraries to install.
