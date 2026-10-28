# Package a Linux GTK4/GJS app

ID: linux-gtk-package
Targets: linux
Related APIs: xplat build, xplat dev, xplat doctor, xplat.targets.linux.runtime, xplat.targets.linux.package, @octane-xplat/cli/linux-gtk/vite, xplatLinuxGtk, @octane-xplat/linux-gtk/host, runGtkApp

## Starting point

An existing Octane consumer app that wants a native GTK4 window
on Linux instead of a WebKitGTK webview.

## Requirements

- Declare the linux target with the `gtk` runtime and an independent app
  identity.
- Bundle through the `xplatLinuxGtk` Vite preset and package a relocatable
  `gjs -m` app directory plus archive.
- Understand the artifact boundary: no desktop entry, installer, URI
  handling, or broad runtime qualification. Named widget/history checks do not
  establish packaging, OS input or visual parity.

## Acceptance criteria

- AC1: The reader can install matching published packages, choose the Box fallback
  or an explicit native Mason build, and declare `runtime: "gtk"`, the required package identity
  fields, and a `vite.gtk.config.ts` that applies the `xplatLinuxGtk` preset.
- AC2: `xplat build --targets linux` emits a relocatable directory holding the
  single-file ESM bundle, an executable `gjs -m` launcher, `app.json`, and a
  `README.txt`, plus a tar archive; a failed build preserves the prior app.
- AC3: The reader can tell which pieces are absent (installer, desktop entry,
  URI handling, device services) and distinguish actual GJS widget/history checks
  from unqualified packaging, OS input and layout behavior.

## Documentation

- AC1: [App configuration](../../../docs/platform/linux-gtk.md#configure-the-app)
  and [packaging tests](../../../packages/cli/test/linux-package.test.mjs).
- AC2: [Build output](../../../docs/platform/linux-gtk.md#develop-and-build)
  and [packaging tests](../../../packages/cli/test/linux-package.test.mjs).
- AC3: [Missing pieces and evidence boundary](../../../docs/platform/linux-gtk.md#what-this-target-does-not-have-yet).

The primitive and pointer fixtures qualify named Mason allocations and X11
Pressable input, independently of this packaging recipe. They do not qualify
the packaged consumer, broad keyboard/input behavior, Wayland, accessibility
or visual parity. See the [GTK UI qualification record](../notes/linux-gtk-ui-parity.md#primitive-and-layout-slice).
