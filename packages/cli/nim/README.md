# Parallel Nim CLI

This directory owns the native CLI implementation. The TypeScript entry and
package exports remain in place. The native command currently implements catalog
and clean; other agent commands provide help and schemas with execution marked
`pending`. Pending operations exit 3 and never invoke the old CLI.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim CLI"}' -- bun run turbo run test:nim --filter=@octane-xplat/cli
research/nim-cli/native/xplat catalog --json
```

`core.nim` contains discovery, platform detection and framework-binding routines
shared with the differential probe. `main.nim` owns the public command entry.
`metadata.json` is generated from the TypeScript descriptors and excluded from
Git. Build-time JavaScript is allowed; native startup does not require Node/Bun.
The production entry must only expose discovery routines after their remaining
package-manager semantics are reconciled with the reference.

```sh
research/nim-cli/native/xplat status --schema
research/nim-cli/native/xplat clean --help
```

The [evaluation tooling](../../../tools/cli-nim/README.md) owns compiler pins,
probe qualification and package staging. Clean only removes known generated
outputs, preserves macOS native sources and NativeScript plugin platform sources,
and prompts on a terminal. Human output styling differs from the TypeScript CLI.

## Parallel npm channel

The release workflow accepts track `nim` and an exact `x.y.z-nim.N` version.
All five native host jobs must pass before packaging/publishing. Publication
uses the existing `release.yml` npm trust binding and explicitly passes
`--tag nim`; stable and nightly paths still package the TypeScript CLI.
No native release is implied by the presence of this workflow.

```sh
# After the workflow changes land on main:
gh workflow run release.yml -f track=nim -f nim_version=0.19.0-nim.1
```

The generated npm tarball retains existing JS exports and dependencies for
project build tools. Its postinstall verifies the matching bundled binary's
checksum and copies it to `bin/xplat.exe`; npm links directly to that native
file on Unix and Windows. Node runs only the installer, never command startup.
The `.exe` suffix is also used on Unix so npm can use one bin path across OSes.
Disabling install scripts leaves a diagnostic placeholder; run
`node node_modules/@octane-xplat/cli/install-native.mjs` to select the executable.
No installation-time executable download is needed. The tarball contains all
five binaries; native per-host downloads can remain one file. The total npm
install also includes JS build dependencies, so it has a different size budget.

```sh
# Local host-only staging; this package is private and cannot be published:
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"Nim package check"}' -- bun run turbo run pack:nim --filter=@octane-xplat/cli -- --host-only
```

Linux/Windows build flags and native jobs are supplied but remain unqualified
until those jobs execute. TLS, full argument/error parity, runtime sessions,
project tool dispatch, updates, and most commands remain migration work. Do not
promote the `nim` tag to `latest` until command contracts, packed project exports,
real project journeys and native OS behavior have equivalent coverage.
