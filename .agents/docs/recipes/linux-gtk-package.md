# Package a Linux GTK4 app

ID: linux-gtk-package
Targets: linux
Related APIs: xplat build, xplat dev, xplat doctor, xplat.targets.linux.runtime, xplat.targets.linux.package, @octane-xplat/build/linux-gtk/vite, linuxGtk, @octane-xplat/linux-gtk/host, runGtkApp

## Starting point

An existing Octane consumer app that wants a native GTK4 window
on Linux.

## Requirements

- Declare the linux target with the `gtk` runtime and an independent app
  identity.
- Bundle through the `linuxGtk` Vite preset and package a relocatable
  NativeScript app directory and archive.
- Understand the artifact boundary: the archive ships a desktop entry and install and uninstall scripts. URI handling and broad runtime qualification remain open. Named widget/history checks do not
  establish packaging, OS input or visual parity.

## Acceptance criteria

- AC1: The reader can install matching published packages with NativeScript and Mason
  payloads for x86_64 and aarch64 and declare `runtime: "gtk"`, the required package identity
  fields, and a `vite.gtk.config.ts` that applies the `linuxGtk` preset.
- AC2: `xplat build --targets linux` emits a relocatable directory holding the
  single-file ESM bundle, NativeScript launcher, both runtime payloads, app identity, README, desktop entry and install scripts, plus a tar archive. A failed build preserves the prior app.
- AC3: The reader can distinguish verified X11 and packaging behavior from Wayland, visual parity, assistive technology and URI handling.

## Documentation

- AC1: [App configuration](../../../docs/platform/linux-gtk.md#configure-the-app)
  and [packaging tests](../../../packages/cli/test/linux-package.test.mts).
- AC2: [Build output](../../../docs/platform/linux-gtk.md#develop-and-build)
  and [packaging tests](../../../packages/cli/test/linux-package.test.mts).
- AC3: [Missing pieces and evidence boundary](../../../docs/platform/linux-gtk.md#what-this-target-does-not-have-yet).

The [Core smoke](../../../packages/linux-gtk-renderer/test/core.test.mts)
and [packed consumer](../../../packages/linux-gtk-renderer/test/packed-core.mts)
cover the development bundle, Core lifecycle, native Mason sizing, and the
installed build worker. Run the Core fixture and the installed archive
on the Linux VM with the pinned NativeScript GTK runtime.

The primitive and pointer fixtures qualify named Mason allocations and X11
Pressable input, independently of this packaging recipe. They do not qualify
the packaged consumer, broad keyboard/input behavior, Wayland, accessibility
or visual parity. See the [GTK UI qualification record](../notes/linux-gtk-ui-parity.md#primitive-and-layout-slice).

The curated UI now also includes TextInput. Its
[text-entry checks](../../../packages/linux-gtk-renderer/test/ui-text-entry.test.mts)
cover named native text/style/handle behavior and actual X11 editing. This
extends widget evidence only; it does not establish AC2's packaged-consumer
journey or remove the broader input-method/assistive-technology/Wayland gaps.
