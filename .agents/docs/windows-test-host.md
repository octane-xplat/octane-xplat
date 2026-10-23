# Windows test-host runbook

Internal framework-contributor instructions for testing the repository's
private Windows harness. This is not a downstream app setup guide. Windows is
experimental and UI support remains incomplete; see the
[Windows target notes](../design/windows-notes.md) for current evidence.

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
$env:NODE_OPTIONS = '--max-old-space-size=4096'
pnpm exec turbo run build:windows typecheck --filter=@xplat/windows --concurrency=1 --continue=dependencies-successful
```

Turbo generates the app before building. The 4 GB Node heap and sequential
tasks let the standalone Windows typecheck complete on the 8 GB test host;
the default heap exhausted memory. The native build is uncached and passes
the Windows program-directory variables needed by NativeScript startup checks.

The workspace pins the matching NativeScript Windows packages. Do not upgrade
`@nativescript/windows`, core, or Vite independently while testing this
experimental target.

## Current status

The Windows-specific NativeScript doctor checks, generated WinUI build, and
registered-package launch have passed. Native component and OS-input checks
have found substantial parity gaps; the full demo harness is not a supported
Windows application yet. Direct launch from a noninteractive SSH session does
not establish desktop rendering; activate the registered app from a signed-in
Windows desktop session.
See [Windows target notes](../design/windows-notes.md) for the current
implementation blockers.

## October 23 preview upgrade

The workspace now pins core and Vite to `abae298` from
[NativeScript#11272](https://github.com/NativeScript/NativeScript/pull/11272).
The preview identifies itself as core `9.1.4-next.0` and Vite `8.0.21`;
registry core `9.1.4-next.0` lacks the Windows files, so preserve the URL pin.
The Windows runtime and CLI pins remain unchanged.

The rebase removes the upstreamed nested tab/frame fixes and Vite vendor
routing/path decoding. Local CSS layers, flex alignment, Windows pointer/input
and percentage-layout lifecycle repairs, re-export handling, and `.mobile`
resolution remain. The gesture rebase preserves upstream transparent-background
hit testing and contact-only pointer movement alongside local event ownership.

Package comparison and patch application are host evidence. Earlier Windows
runtime results do not qualify this preview: rerun build, launch, pointer,
keyboard, and percentage-layout checks on a Windows host before claiming it.

The documented SSH route refused the forwarded connection during the initial
upgrade. A subsequent physical-host attempt installed this preview successfully
and passed the standalone Windows typecheck, but the kitchen sink bundle failed
because `full-screen-page.mobile.ts` is reachable from shared native routing.
No app launched in that attempt; see the [physical-host lab record](windows-lab.md#kitchen-sink-attempt-with-preview-abae298).

Host checks for this pin pass: installation with the frozen lockfile, patch and
compatibility synchronization, recipe structure, focused compatibility/upgrade
tests, touched-package and dependent typechecks (including Windows), and the
installed-package Windows pointer, input, and percentage-layout regressions. The pointer suite also covers preserved authored backgrounds and
contact-only touch movement from upstream. These exercise JavaScript with host
fixtures, not WinUI hit testing or OS input.
