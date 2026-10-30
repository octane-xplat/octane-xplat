# Intel (x86_64) macOS build hosts — qualification log

Tracks [#80](https://github.com/octane-xplat/octane-xplat/issues/80): building
apps with native leaves on Intel Macs. Runtime-on-Intel evidence lives in
`appkit-progress.md` ("Intel x86_64 support"); this note covers the
build/toolchain side only.

## Findings

**The libclang boundary is Command Line Tools version, not host arch.** The
metadata generator links `-lclang` from
`/Library/Developer/CommandLineTools/usr/lib` (upstream
`metadata-generator/CMakeLists.txt`) and resolves `@rpath/libclang.dylib`
there via `INSTALL_RPATH`. Observed inventories:

| Host | Arch | macOS | Toolchain | `CLT/usr/lib/libclang.dylib` |
| --- | --- | --- | --- | --- |
| probe host (this Mac) | arm64 | — | Xcode 27.0, CLT 27.0 | arm64 only (127 MB) |
| skymac.local | arm64 | 26.6.2 | Xcode 27.1, CLT 26.6 | **x86_64 + arm64** (298 MB) |
| andromeda.local | x86_64 | 15.7.7 | CLT 15.3 only (clang 15.0.0, swiftc 5.10) | **x86_64 + arm64** (255 MB) |

CLT 27.0 dropped the x86_64 slice on Apple Silicon; CLT ≤26.6 ships a
universal libclang on both host types. On any Intel Mac the host CLT
necessarily carries x86_64, so the shipped universal generator always has a
loadable slice there. The 2026-10-29 probe's "arm64-only libclang" conclusion
was scoped to that host's CLT 27.0 — it does not generalize.

**Requirement that emerges:** each build host needs a CLT libclang containing
*that host's* arch. `--xplat-check` already loads it and reports the version;
the actionable diagnostic for a missing slice is the dyld error naming the
rpath (observed: `mach-o file, but is an incompatible architecture (have
'arm64', need 'x86_64')`).

**Upstream generator bug — CLT-layout SDKs crash the metadata sweep** (found
and patched here). `metadata-generator/src/Umbrella.cpp` gates its
usr/include allowlist (objc + dispatch only) and its `c++` exclusion on the
Xcode.app path layout `/MacOSX.platform/Developer/SDKs/`. Command Line Tools
SDKs live under `/Library/Developer/CommandLineTools/SDKs/` and never match —
on a CLT-only host the sweep descends into all of `usr/include`, parses
libc++'s `module.modulemap`, and calls `directory_iterator` on the *file*
`algorithm` → uncaught `filesystem_error` → SIGABRT. The `dir` strings also
arrive with `/./` segments that bypass the substring guards. Patch carried in
`patches/metadata-leaves.patch`: normalize `dir`, match `/SDKs/MacOSX` (both
layouts), and skip non-directory modulemap entries. This is an upstream
limitation; propose it to NativeScript/runtimes like the arm64 CMake fix
(#101). Not yet filed.

**Swift toolchain ↔ SDK skew is a second, orthogonal boundary.** Andromeda's
CLT swiftc is 5.10 while its newest installed SDK (MacOSX15.2) carries a
Swift 6.0.3 module — `this SDK is not supported by the compiler`. With the
version-matched MacOSX14.4 SDK, the Intel swiftc cross-compiles both
`arm64-apple-macos13.5` and `x86_64-apple-macos13.5` leaf dylibs cleanly.
`xcrun --sdk macosx` resolves the *newest* SDK regardless of the
`MacOSX.sdk` symlink; `XPLAT_MACOS_SDK` (path or `xcrun --sdk` name) pins a
compatible one. Documented in `docs/platform/macos-native.md`.

**Zig and CMake on Intel:** zig 0.17.0 `build-obj` cross-compiles both
`aarch64-macos.13.5` and `x86_64-macos.13.5` objects on andromeda (zig
tarball, official shasum verified). CMake is needed only to rebuild the
generator itself — app builds never touch it. Homebrew on andromeda is
deprecated-tier and failed to install; `~/dev/tools/` carries tarball cmake
4.4.5 + zig 0.17.0 (x86_64).

## Changes landed (main)

- `2cb8db4f5` feat(cli): universal `objc-metadata-generator`; native leaves
  build on x86_64 hosts; doctor/build-generator/docs updated. x86_64 slice
  built on skymac (arm64 + CLT 26.6 universal libclang), verified under
  Rosetta: `--xplat-check` prints clang 21.0.0 and real NSMD output is
  emitted for both targets.
- `318a7f69c` feat(cli): `XPLAT_MACOS_SDK` SDK pin for skewed toolchains.
- `9f855e26e` fix(cli): CLT-layout SDK sweep (Umbrella.cpp patch hunks +
  rebuilt universal generator).
- `ad3aaf615` fix(cli): generator rebuilt with both patches applied
  (dlfcn/sqlite umbrella imports restored — first rebuild dropped
  `nativescript-runtimes.patch`).
- `3ad705976`, `a4e3f7d76`, `5f9ce1e23` fix(cli): `verify-macos-native.mjs`
  repairs — arch-matched metadata path (`first.metadata` object stringified
  to `[object Object]`), and `__xplatStopHost` deferred through the runloop
  timer (`[NSApp run]` had no exit path; both pre-existing main breaks).

## Runtime/build evidence

| Check | Host | Result |
| --- | --- | --- |
| x86_64 generator slice compile + link | skymac (CLT 26.6 universal libclang) | PASS (ld warning only: libclang minos 14.0) |
| `arch -x86_64 gen --xplat-check` | skymac under Rosetta | PASS — clang 21.0.0 |
| x86_64 generator emits NSMD for arm64 + x86_64 targets | skymac under Rosetta | PASS — 6.2 MB files, `NSMD` magic, section stats |
| `macos-native.test.mjs` 15/15 | skymac arm64 | PASS |
| `verify-macos-native.mjs` | skymac arm64 | PASS (all four languages, cache, concurrency, invalidation) |
| `verify-macos-native.mjs` | **andromeda x86_64 bare metal** | **PASS** — leaves compiled per-arch, metadata generated by the x86_64 slice on real Intel, x86_64 host ran `MACOS_NATIVE_LANGUAGES_OK` |
| swiftc 5.10 `-target arm64` + `-target x86_64` leaf dylib | andromeda, SDK 14.4 | PASS both slices |
| swiftc 5.10 vs MacOSX15.2 SDK (Swift 6.0.3 module) | andromeda | FAIL — toolchain/SDK skew, not arch; `XPLAT_MACOS_SDK` works around |
| `build-generator.sh` on Intel (maintainer flow, `XPLAT_METADATA_BUILD_DIR` scratch) | andromeda | PASS — x86_64 slice built natively, `--xplat-check` reports clang 15.0.0 |
| Consumer `xplat build --targets macos` → universal app + DMG | andromeda | PASS — 4 leaves, universal `NativeFixture.app`, ad-hoc signed, `codesign --verify --deep --strict` OK |
| Relocated app run | andromeda (x86_64) + skymac (arm64) | PASS both — `NATIVE_VALUES c=40 objc=42 swift=43 zig=44`, exit 0 |
| `verify-macos-native-consumer.mjs` end-to-end | andromeda | BLOCKED at `xplat doctor` — fixture's non-macOS rows fail (`packageManager` missing, `@tsrx/oxc` peer; all macOS rows pass). Same gate documented on main; the build/run evidence above was gathered by running its steps directly. |
| `@xplat/macos` smoke | andromeda | BLOCKED — toolchain vintage, not arch: leaf builds now proceed (env passes through since `b6ac16e46`) but the vendored Lottie Swift leaf needs a newer `swiftc` than andromeda's CLT 5.10 (`extensions must not contain stored properties`). An Intel host with a current toolchain is the remaining qualification. |
| `apps/macos` universal package for an Intel sweep | skymac | BLOCKED — `rolldown` build errors in `apps/macos#build` on current main (unrelated to this change; 39/40 tasks ok) |

## What stays unverified / boundaries

- **Rosetta ≠ bare metal for the generator built on skymac**: the x86_64
  slice ran under translation on arm64 there; the andromeda runs use the
  same binary natively — the slice is proven on real Intel via the
  native-leaf verify.
- **Maintainer prebuilt scripts** (`build-runtime.sh`, `build-metadata.sh`)
  keep their arm64-only guards; their outputs ship universal in
  `prebuilt/macos/`, so Intel app builds never invoke them. Qualifying a
  maintainer rebuild on Intel is untested.
- **Newer Intel CLTs**: whether CLT 26.6+/27.x on Intel still ships a
  universal (or at least x86_64-containing) libclang is unverified —
  andromeda's CLT is 15.3. The claim needed for support is narrower: the
  host's own slice must exist, which holds for any CLT install.
- **Notarization** of universal builds remains open (#78).
- **Andromeda's toolchain vintage caps the smoke:** the dev sweep needs all 13
  `apps/macos` leaves, and vendored Lottie Swift sources exceed swiftc 5.10.
  A newer CLT/Xcode on Intel is the remaining requirement — no arch-specific
  blocker observed.
- `verify-macos-native-consumer.mjs`'s `xplat doctor` step fails on the
  fixture's non-macOS rows (`packageManager`, `@tsrx/oxc` peer) — pre-existing
  on main, unrelated to macOS; its build/package/run steps were exercised
  directly instead.
