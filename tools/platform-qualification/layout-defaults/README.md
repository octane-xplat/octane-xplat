# Layout default qualification

These private fixtures check geometry, live layout overrides, retained identity,
and programmatic scrolling. They do not establish painted pixel parity, OS input,
accessibility behavior, or a fresh installed consumer. Keep them outside PR CI.

The shared assertions belong to `packages/ui/tests/fixtures/page-layout/`.
Desktop qualification runs the block, neutral-container, content-slot, and page
fixtures separately so a failure in one does not hide the other results. Each
fixture emits a `[xplat-probe]` JSON record and fails on its first failed assertion.
A complete pass requires all four records to pass; partial assertion totals are
not a whole-suite pass. Native lifecycle/input and registered shaders have their
own mobile commands in the [testing reference](../../../.agents/docs/testing.md).

## Build desktop bundles

Use Bun 1.4.4 and an absolute output path in your task's disposable scratch folder:

```sh
bun run turbo run build:layout-desktop --filter=@xplat/platform-qualification -- gtk /absolute/owned/run/gtk
bun run turbo run build:layout-desktop --filter=@xplat/platform-qualification -- windows /absolute/owned/run/windows
```

The builder uses the checkout's installed toolchain and framework packages.
The Windows bundle uses a sibling `windows-consumer` directory and links the
existing app's dependencies and resources. It does not change that app's source.
These are source-checkout checks, not packed-consumer or frozen-install checks.
Keep the source revision, adapter hashes, bundle hashes, native library hashes,
commands, raw logs and actual exit statuses with retained evidence.

## Run GTK

Use the existing Linux VM through SSH to `andromeda.local`. Its OrbStack guest
is `octane-linux`. Preserve that shared VM; do not stop or recreate it. Reserve
`linux:octane-linux` and one resident-device slot before using its GTK session.
Stage the bundle in the task's scratch folder, then run inside the guest with
its matching XplatMason facade:

```sh
XPLAT_MASON_TYPELIB=/absolute/facade \
GI_TYPELIB_PATH=/absolute/facade LD_LIBRARY_PATH=/absolute/facade \
dbus-run-session -- xvfb-run -a env GTK_A11Y=none gjs -m /absolute/run/gtk/app.js
```

The adapter requires `XplatMasonView` for the block prerequisite. A Gtk.Box
fallback is a failure. Use the facade's manifest to establish which Mason archive
it contains; an old native artifact does not qualify a different engine version.
GJS freezes its console, so the desktop executor records fixture failures without
replacing `console.error`. Review native stderr too; uncaught native errors cannot
be dismissed because a fixture emitted a pass record. Xvfb is a private display;
this command takes no screenshots and does not use the shared desktop input.

## Run Windows

Connect to `windy` through SSH. Preserve its checkout and any local changes.
Stage the generated Windows bundle, current UI `platforms/windows/GestureInput.cs`,
`../desktop-gestures/CaptureActor.cs` and `windows-components-build.ps1` in a fresh
owned scratch run. Stage the bundle contents as `dist/`, not a nested directory.
Use the existing prepared native SDK as an input and compile a separate host:

```powershell
./windows-components-build.ps1 -RunRoot $runRoot -HostCheckout $checkout
```

Reserve `native_builds:1` and the host during compilation. The prepared host's
native inputs are reused; this does not qualify a new SDK/plugin installation.
The builder retains startup diagnostics and pumps NativeScript timers in WinUI.
End the build reservation before starting the desktop phase.

Stage `windows-layout-run.ps1`, `windows-layout-launch.ps1`, and the existing
`windows-components-identity.ps1` beside the run. In the signed-in desktop session,
under a separate host/desktop-input reservation, launch through SSH:

```powershell
./windows-layout-launch.ps1 -RunRoot $runRoot -TaskName 'my-unique-layout-qualification'
```

The launcher uses Task Scheduler at priority 4. The driver registers a uniquely
named loose package using the installed Windows App Runtime, activates its own
process, waits for four fixture records, then stops that process and removes its
package. It does not install runtimes or capture images. The launcher removes only
its own scheduled task. Keep both its status and `native-gate.log`; native build
success or scheduled-helper success alone does not establish a layout pass.
