### Open DevTools from a web-only project on macOS

The first run downloads the DevTools app from GitHub Releases. Later launches reuse the download, and the window includes the Tweaks and Styles tabs.

```sh
xplat devtools
```

**Breaking change** for project-contributed panels. Use `xplat devtools --web` to open them in the browser or build them into the native window with your project's macOS toolchain.

```sh
xplat devtools --build-panels
```

[DevTools guide](https://octane-xplat.goddardai.org/package-devtools)
