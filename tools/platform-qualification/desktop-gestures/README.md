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
