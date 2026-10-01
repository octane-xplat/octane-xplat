# Set up a Windows test host

Windows is an experimental target. These steps prepare a Windows host for the
workspace; they do not mean the harness app is ready to launch. See
[Windows target notes](windows-notes.md) for the current support status.

## Prepare Windows

Use a licensed Windows 11 x64 machine or VM. Allocate enough memory and disk
space for the workspace, dependencies, and a native build.

Install these Windows tools:

- Node.js 24.x x64 from the [official downloads](https://nodejs.org/en/download).
- The .NET 10 x64 SDK from Microsoft's [.NET 10 downloads](https://dotnet.microsoft.com/en-us/download/dotnet/10.0).
- The x64 Microsoft Visual C++ Redistributable. Use Microsoft's
  [latest supported downloads](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170).
- Enable Windows Developer Mode in Settings. NativeScript uses it for its
  development install flow.

Enable pnpm through Corepack using the version pinned in this workspace's
`package.json`:

```powershell
corepack enable
corepack prepare pnpm@11.24.0 --activate
```

Check that Node, pnpm, and .NET are available in the same PowerShell session:

```powershell
node --version
pnpm --version
dotnet --version
```

## Get the workspace onto the VM

Clone the repository on Windows, or copy it from your development machine using
your preferred secure file transfer.

From the repository root, the intended checks are:

```powershell
pnpm install
pnpm --filter @xplat/windows exec xplat doctor
pnpm --filter @xplat/app gen
pnpm --dir apps/windows run build:windows
```

The workspace pins the matching NativeScript Windows packages. Do not upgrade
`@nativescript/windows`, core, or Vite independently while testing this
experimental target.

## Current status

The Windows-specific NativeScript doctor checks and the generated WinUI
project build have passed on a Windows host. The app bundle still fails before
launch, so `ns run windows`, app rendering, and the UI sweep are unverified.
See [Windows target notes](windows-notes.md) for the current implementation
blockers.
