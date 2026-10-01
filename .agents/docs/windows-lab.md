# Windows host lab log

Internal test record. Keep machine-specific setup and raw failure details here;
the public setup and support guidance lives in [`docs/windows-setup.md`](../../docs/windows-setup.md)
and [`docs/windows-notes.md`](../../docs/windows-notes.md).

## Host

- Run date: 2026-10-01.
- UTM 4.7.5 on an Intel Mac running macOS 15.7.7.
- Windows 11 Pro x64 VM, build 26200; 8 GB RAM, 4 virtual CPUs, 64 GB disk,
  TPM 2.0, and Secure Boot. Installed from a standard Windows 11 Pro x64 ISO.
- The guest used UTM shared/NAT networking. Its `10.0.2.x` address was not
  directly reachable from the development Mac; SSH worked through the Mac
  host's port forward and SSH jump. No usernames, hostnames, keys, or
  credentials belong in this log.

## Installed toolchain

- Node.js 24.19.0 x64 at `C:\Users\<user>\tools\node-v24.19.0-win-x64`.
- .NET SDK 10.0.401 at `C:\Users\<user>\tools\dotnet`; `DOTNET_ROOT` and
  `PATH` were set for the guest user.
- pnpm 11.24.0 via Corepack (`corepack enable` and
  `corepack prepare pnpm@11.24.0 --activate`).
- `@nativescript/windows` 0.1.0-alpha.144, selected by the workspace.
- Developer Mode enabled through the `AllowDevelopmentWithoutDevLicense`
  registry setting.
- The x64 Microsoft Visual C++ Redistributable was required on this clean VM:
  `workerd.exe` and `platforms/windows/tools/dotnet-tool.exe` initially exited
  with `0xc0000135`. After downloading Microsoft's official
  `https://aka.ms/vc14/vc_redist.x64.exe`, its signature was verified and it
  was installed with:

  ```powershell
  C:\OctaneSetup\vc_redist.x64.exe /install /quiet /norestart /log C:\OctaneSetup\vc-redist.log
  ```

  The registry then reported the x64 runtime installed (version
  `v14.51.36247.00`).

## Workspace and checks

The workspace was copied to `C:\Users\<user>\dev\octane-xplat`.

- `ns doctor windows` exited 0 with “No issues were detected.”
- `pnpm --filter @xplat/windows exec xplat doctor` passed the Windows host,
  NativeScript Windows package, .NET SDK, Developer Mode, and Node checks. The
  broader doctor also emitted non-Windows findings, including a false
  `pnpm — missing` result.
- `pnpm --filter @xplat/app gen` succeeded and generated route artifacts for
  Windows.
- `pnpm install` installed dependencies but exited non-zero during
  `@octane-xplat/auth` postinstall: tsrx-typegen reported that `src/index.ts`
  was outside its TypeScript project. A subsequent
  `pnpm install --ignore-scripts` exited 0 but skipped generators and is not a
  successful clean install.
- `pnpm run build:windows` (from `apps/windows`) reported 52 TypeScript errors,
  then Vite/xplat boundary validation failed because
  `packages/ui/src/native/index.ts` resolved to
  `packages/ui/src/root-layout.mobile.ts` in the Windows bundle. No app bundle
  launched.
- The generated native project built independently with:

  ```powershell
  dotnet build apps\windows\platforms\windows\windows\windows.csproj --verbosity minimal
  ```

  Result: 0 errors, 9 nullable/platform analyzer warnings. This validates the
  WinUI project compilation only; it does not validate app boot or rendering.

## Remaining work

Fix the auth type-generation project boundary and Windows bundle's native-entry
resolution, then rerun the normal install and Windows build before attempting
`ns run windows`. App boot, rendering, the demo sweep, and per-seam `.windows`
divergence checks remain unverified.
