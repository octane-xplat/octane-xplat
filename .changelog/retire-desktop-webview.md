### Desktop apps now require native hosts

**Breaking change**

Desktop WebView app hosting and its native-service bridge are gone. Remove `@octane-xplat/desktop-webview`, `@octane-xplat/platform/host`, `/host/web`, `/host/services`, the macOS `"webview"` renderer, the Linux `"webkitgtk"` runtime, and the former `@octane-xplat/ui/linux` entry point (`LinuxWindowHandle`). Move desktop screens to native AppKit, GTK, or WinUI, or run DOM screens in a browser.

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

If you move a screen to a browser, it uses browser permissions and storage. The browser camera can’t reopen native files captured by the retired hosts. Embedded WebView widgets and the local WebViews used by RichText, Tiptap, and Lexical remain available.

[Native macOS setup](https://octane-xplat.goddardai.org/toolchain#experimental-appkit-target) · [Native Linux setup](https://octane-xplat.goddardai.org/linux-gtk) · [Rich text editing](https://octane-xplat.goddardai.org/rich-text#macos-appkit-editing)
