# Windows workshop setup status

The Windows workshop is incomplete. This package can report setup evidence and
block an unsafe launch; it cannot yet mount a workshop in WinUI. A browser or
WebView2 window does not qualify this target.

## Check your consumer

Run doctor inside your app. It reads installed dependencies and setup files.
On Windows only, it runs bounded, read-only .NET SDK and Developer Mode checks.
It does not install tools, launch a device, or change settings.

```sh
pnpm exec xplat workshop doctor --json
```

| Windows status | Meaning |
| --- | --- |
| `remote-host-required` | This checkout is running on another OS. Repeat the command in a Windows checkout. Windows machine checks were skipped. |
| `missing-prerequisites` | A Windows checkout is missing one or more reported development prerequisites. |
| `unqualified-backend` | Setup checks passed, but the workshop backend remains incomplete and unverified. |

The report names NativeScript configuration, Windows application resources,
installed NativeScript/compiler packages, an exact Windows runtime declaration,
and (on Windows) .NET SDK 10 or newer and Developer Mode. Passing these checks
does not establish compatible package versions or working rendering. The
[experimental Windows harness](../../apps/windows/README.md) describes the
current preview pins and host setup; it is not workshop qualification.

## Inspect story applicability

List Windows stories without mounting them. Platform suffixes and declared
targets determine applicability; capability requirements remain unknown until
qualified. An unsupported leaf stays visible with a reason rather than being
evaluated on the wrong host.

```sh
pnpm exec xplat workshop list --target windows --json
```

Launching Windows currently fails with a setup or qualification diagnostic,
before loading consumer configuration, importing stories, or starting a server.
There is no automatic web fallback.

```sh
pnpm exec xplat workshop dev --target windows
```

## Remaining delivery gates

Package D still requires the WinUI mounting adapter, accessible adaptive shell,
consumer launch integration and a NativeScript-qualified pre-update reload
boundary. Contract version 1 remains unchanged. The existing fixture/session
tests prove portable logic, not Windows execution.

An actual Windows consumer must demonstrate controls and optional Unset, fresh
nested reset, cancellation and late cleanup, partial setup unwind, cleanup
failure/timeouts, provider-backed secondary roots, source edit/error recovery,
layout changes without healthy-stage remount, OS input, keyboard/Narrator/IME,
production exclusion and installation from packed artifacts. Until those gates
pass, Windows and the six-platform workshop release remain incomplete.
