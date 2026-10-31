# macOS Mason engine sourcing

The macOS renderer's Mason engine ships prebuilt as
`packages/macos-appkit/platforms/macos/prebuilt/libxplatmason.dylib` — the
ObjC facade (`native/xplatmason/XPLMason.m`) statically linked against
mason-c from `octane-xplat/nativescript-mason`.

## Pinned desktop archive (arm64)

The arm64 slice consumes the pinned desktop artifact contract produced in the
Mason checkout by `nx run nativescript-mason-core:build.native.desktop`:
`dist/native/mason-core/desktop/<triple>/libMasonCore.a` plus the generated
`include/mason_native.h` and `manifest.json`. The facade compiles against the
shipped header — no hand-declared externs — and `build.sh` verifies the
consumed archive/header bytes against `native/xplatmason/mason-core.pin.json`
(revision, toolchain, sha256s) before linking. To move the pin, update the
pin file with the new revision and the hashes from that revision's desktop
manifest, then rerun `build.sh`.

## Upstream limitation: no x86_64-apple-darwin desktop target

The desktop contract ships `aarch64-apple-darwin`,
`x86_64-unknown-linux-gnu`, and `x86_64-pc-windows-msvc` only (verified
2026-10-31 at nativescript-mason 0cdc3c80 and origin/main). Packaged macOS
apps require universal `prebuiltLibraries` (both arm64 and x86_64 slices,
since `feat(cli)!: package universal macOS apps`), so `build.sh` builds the
x86_64 slice from crate source at the pinned revision and lipos the slices
together. That slice is revision-pinned but not archive-hash-verified —
recorded as `source.engine.slices.x86_64` in the prebuilt manifest. When
upstream adds an `x86_64-apple-darwin` desktop target, extend the pin file
with its archive hash and link it the same way as arm64.
