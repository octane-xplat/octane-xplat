# Native platform qualification

These private gates run outside lightweight PR CI. Reserve the host with
`goddard-agent resource run` before native compilation or desktop input. They
use text logs and existing hosts; no screenshots or new devices are required.

## Windows shared mouse owner

Build the fixture with Bun 1.4.4 from the repository root:

```sh
bunx turbo run build:windows-gestures --filter=@xplat/platform-qualification
```

On the existing Windows host, choose an owned disposable scratch directory.
Copy the three PowerShell scripts beside this README, UI's
`platforms/windows/GestureInput.cs`, and the generated
`dist-windows-gestures/platform-qualification.iife.js` there. Build under a
native-build reservation:

```powershell
./windows-build.ps1 -RunRoot $runRoot -BridgeSource "$runRoot/GestureInput.cs" -BundleSource "$runRoot/owner.js"
```

The isolated fixture downloads the exact NativeScript Windows beta.24 package
into scratch and builds its host template with the installed .NET SDK. It adds
the MSIX build-tasks package required by that template on the qualified host;
it does not install a machine-wide toolchain. The retained build command uses
Windy's existing BuildTools location. A different host needs that build-path
qualification before its result can be compared.

End the build reservation. In an existing signed-in interactive desktop session,
run under a separate `desktop_input:1` reservation:

```powershell
./windows-launch.ps1 -RunRoot $runRoot -TaskName 'my-unique-gesture-gate'
```

This creates and removes only the named temporary scheduled task. The driver
finds its own process through UI Automation, clicks its button, drags 100
physical pixels, invokes the button through UIA while the drag is active,
releases, clicks again, sends Space and holds the pointer for a managed long press.
It invokes a separate native cleanup button to detach the owner, then invokes the
original button again and checks that retired callbacks stay silent. It retains
logs in scratch and closes the owned app. Copy stdout to a local log and verify it from the repository:

```sh
bunx turbo run verify:windows-gestures --filter=@xplat/platform-qualification -- /absolute/path/windows-gate.log
```

The gate checks logical-unit normalization using UIA physical bounds and native logical bounds,
button tail suppression, independent UIA invocation and keyboard provenance.
It exercises the native transport, semantic peer and shared owner directly.
It does **not** mount public NativeScript components, load Mason, stage a packed
UI plugin, or qualify a screen reader, native scrolling or Motion rendering.
Those remain separate gates. Preserve source identities and artifact hashes
beside retained logs; scratch alone is not evidence storage.

GTK's maintained public-component mouse gate belongs to
`packages/linux-gtk-renderer/test/shared-gestures.test.mjs` and the workspace's
`build:gestures`/`test:gestures` Turbo tasks. Run it in the existing Linux GJS/X11
environment with xdotool; it skips rather than claiming success on other hosts.
A Gtk.Box fallback pass does not qualify the pinned Mason native library.

## Packed public components

`build:desktop-components` extracts UI, Motion and their framework dependencies
from tarballs into a fresh, explicitly chosen consumer directory. It reuses the
contributor checkout's installed external compiler/runtime dependencies and
rejects imports from the tested libraries' source checkouts. This qualifies
packed contents; a frozen fresh dependency install is a separate gate.

```sh
bun run turbo run build:desktop-components --filter=@xplat/platform-qualification -- gtk /absolute/owned/consumer
```

Select `gtk`, `macos` or `windows`. The directory must not exist. Preserve its
`evidence.json`, which lists tarball hashes and the resolved packed modules.
The common scene combines a draggable Motion host under a scaled shared View,
a nested Pressable, a horizontal pan around ScrollableArea and a native text
field and Slider. Stable refs let the drivers observe actual hosts and geometry; they do
not dispatch framework handlers.

Use `--fixture-only` after the consumer path to rebuild observation/input code
against its existing tarballs. It does not repack producer changes. Create a new
consumer after changing framework code. Evidence includes tarball, fixture and
bundle hashes; preserve the exact evidence file used by each OS run.

On Linux, stage `dist/app.js` and `drive-gtk.py` on the existing host. Build the
GTK facade against the matching pinned Linux Mason archive before input. Set
`XPLAT_MASON_TYPELIB` and the loader library path to that facade directory.
Run the driver in an owned display and D-Bus session under a host reservation:

```sh
dbus-run-session -- xvfb-run -a env GTK_A11Y=atspi python3 drive-gtk.py /absolute/consumer/dist/app.js
```

The driver uses xdotool for OS input and an independent GIO D-Bus client for
AT-SPI tree and activation queries. It requires real Mason allocation and checks
rendered geometry, nested press suppression, independent pointer/Space actions,
editing/Slider priority, wheel scrolling around a horizontal claim, cancellation and
cleanup. `GTK_A11Y=test` cannot qualify the accessibility service. An AT-SPI
action pass does not establish an Orca journey or Wayland input.

On macOS, build the native host under a native-build reservation, end that
reservation, then run input under a desktop-input reservation:

```sh
bun run turbo run qualify:macos-components --filter=@xplat/platform-qualification -- build /absolute/owned/consumer
caffeinate -u -t 35 bun run turbo run qualify:macos-components --filter=@xplat/platform-qualification -- input /absolute/owned/consumer
```

The build creates an owned ad-hoc `.app` identity and a separate AX client. The
public AppKit host owns startup, with the normal external-run-loop contract.
Mouse events enter through `CGEventPostToPid`; wheel and Space use the HID queue.
The gate requires an active owned window, rendered scale and a native display
frame before input. A sleeping display can stop that frame source; wake it
temporarily rather than replacing the native clock. The scroll handle prepares
an interior offset; only subsequent OS wheel changes count as wheel evidence.
The separate client targets its parent app through the AX service and does not
request permissions. Missing existing accessibility trust fails the gate.
It also checks focus-loss cancellation and active unmount. This qualifies service
activation, not a VoiceOver journey, hardware input, or trackpad gestures.

On Windows, stage `dist/`, current UI `platforms/windows/GestureInput.cs` and
`windows-components-build.ps1` in an owned run directory. The builder takes
`-RunRoot` and `-HostCheckout`, reuses an existing prepared Windows SDK/project's
native inputs, and builds a separate scratch host without changing the shared
checkout. Stage `GestureInput.cs` from the extracted UI tarball and retain its
hash. This is not a fresh SDK/plugin installation check. Build under a
native-build reservation. Then stage `windows-components-run.ps1` as
`windows-run.ps1` beside `windows-launch.ps1` and invoke the existing launcher
under a separate desktop-input reservation. Stage
`windows-components-identity.ps1` beside it. The driver registers a unique owned
loose package layout using the installed Windows App Runtime and prepared WinRT
activation declarations, then removes that package. It never installs an OS
runtime or adopts an existing package identity. The unpackaged bootstrapper must
be disabled for this registered layout. Use a unique scheduled-task name; the
launcher removes only that task. The driver verifies physical owned-window hit
testing, uses the OS mouse movement helper rather than cursor repositioning,
and checks Motion geometry, nested activation, editing/Slider priority, native
wheel offsets, focus cancellation, active cleanup, Space and independent UIA
Invoke. Preserve startup diagnostics when public UI does not mount; native host
compilation alone does not qualify these interactions. UIA actions do not
qualify a Narrator journey.
