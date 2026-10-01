# Set up a Windows test host

Windows is an experimental target. This guide records the first Windows 11
VM setup and the checks that currently work; it does not mean the harness app
is ready to launch on Windows. See [Windows target notes](windows-notes.md) for
the current implementation status.

## Prepare Windows

Use a Windows 11 x64 machine or VM. The first lab used UTM on an Intel Mac with
8 GB RAM, 4 CPU cores, a 64 GB disk, TPM 2.0, Secure Boot, and a standard
Windows 11 Pro x64 ISO. A VM needs a valid Windows license; this setup did not
use an evaluation image.

Install these Windows tools:

- Node.js x64 from the [official downloads](https://nodejs.org/en/download).
  The first lab used Node 24.19.0.
- The .NET 10 x64 SDK from Microsoft's [.NET 10 downloads](https://dotnet.microsoft.com/en-us/download/dotnet/10.0).
  The first lab used 10.0.401.
- The x64 Microsoft Visual C++ Redistributable. On the clean VM, the NativeScript
  `workerd.exe` and .NET tool initially failed to start until this was installed.
  Use Microsoft's [latest supported downloads](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170).
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
your preferred secure file transfer. A 64 GB VM disk was sufficient for the
workspace and dependencies. If you use SSH, the VM's `10.0.2.x` address under
UTM's shared/NAT networking is private to that virtual network; connect through
the Mac host's configured SSH port forward or configure a reachable network
mode. Keep SSH credentials out of the repository.

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

## Current result

On the first Windows 11 x64 VM (Windows build 26200), the Windows-specific
NativeScript doctor checks passed, and the generated Windows route files were
created. The generated WinUI project also compiled with:

```powershell
dotnet build apps\windows\platforms\windows\windows\windows.csproj --verbosity minimal
```

The full app build did not reach launch. `pnpm install` stopped in the auth
package's postinstall type generation (`src/index.ts` is outside its TypeScript
project). Re-running with `--ignore-scripts` allowed dependency installation
to finish, but should not be treated as a successful clean setup. The app
build then reported existing cross-target type errors and stopped at the
boundary check because `@octane-xplat/ui`'s native entry reaches
`root-layout.mobile.ts` in a Windows bundle. Therefore `ns run windows`, app
rendering, and the UI sweep remain unverified. See the notes for evidence and
follow-up questions.
