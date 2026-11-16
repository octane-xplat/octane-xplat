### Use native desktop app hosts

**Breaking change:** Desktop WebView app hosting and the general native-service bridge have been removed. This removes `@octane-xplat/desktop-webview`, `@octane-xplat/platform/host`, `/host/web`, `/host/services`, the macOS `"webview"` renderer, the Linux `"webkitgtk"` runtime, and the former `@octane-xplat/ui/linux` entry point (`LinuxWindowHandle`). Move desktop screens to native AppKit, GTK, or WinUI, or run DOM screens in a browser. There is no compatibility layer.

For an AppKit app, keep the native Vite configuration and CommonJS bundle paths and remove `webViteConfig`, `hostViteConfig`, `hostBundleFile`, and `webOutDir`:

```json
{
  "xplat": {
    "targets": {
      "macos": {
        "runtime": "appkit-node-api",
        "renderer": "appkit",
        "dev": { "viteConfig": "vite.dev.config.mjs", "bundleFile": "dist/dev/main.cjs" }
      }
    }
  }
}
```

Browser services now use browser APIs and their permission/storage limits. Existing native-file camera outputs from retired hosts cannot be reopened through the browser camera backend. RichText, Tiptap, and Lexical retain their editor-owned local WebView transport; embedded WebView widgets are separate and remain available.

See [macOS setup](https://octane-xplat.goddardai.org/toolchain#experimental-appkit-target), [native Linux setup](https://octane-xplat.goddardai.org/linux-gtk), and [rich text editing](https://octane-xplat.goddardai.org/rich-text#macos-appkit-editing).
