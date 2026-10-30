# Intel macOS build-host constraints

Decision #135 requires Intel and Apple Silicon support. Read the
[public native-code guide](../../../docs/platform/macos-native.md) for build setup;
record host inventories, command output, artifact hashes, and qualification state
in Silo/local files rather than maintaining a checkpoint log here.

## Build-host constraints

The metadata generator needs a libclang slice matching the build host. Inspect
the installed Command Line Tools library; an arm64-only libclang on one Apple
Silicon host does not establish an Intel-host limitation. Rosetta execution and
native Intel execution are separate evidence.

Swift and the selected SDK must also be compatible. The default SDK selection
may choose a newer SDK than the compiler supports; use the guide's explicit SDK
selection when needed. On Command-Line-Tools-only hosts `xcrun` cannot
select a separately installed Swift toolchain; the guide's `XPLAT_MACOS_SWIFTC`
pins a swiftc by path. Universal app output requires both executable slices and
architecture-specific metadata, regardless of the build host.

Keep two upstream NativeScript constraints visible when updating the generator:

- The runtimes macOS CMake branch at pinned `5b697b39` forced arm64 despite a
  caller's architecture choice. The local runtimes patch respects an explicit
  choice; remove that hunk only after the adopted upstream supports it.
- The metadata generator's SDK sweep assumed Xcode.app paths and could descend
  into modulemap files under a CLT-only SDK. The local `metadata-leaves.patch`
  normalizes paths, supports both layouts, and skips non-directory entries.
  Check the adopted upstream before dropping those corrections.

Keep maintainer prebuilt rebuilds, app native-leaf compilation, universal
packaging, runtime execution, and notarization as separate qualification tasks.
A runtime result on an Intel Mac does not prove that Mac can rebuild every tool.

The former host qualification report is indexed in `local_artifacts` under this
file's repository-relative path. Use [operational evidence lookup](../exploration.md#operational-evidence)
for the local file and its exact revision/hash; check current Silo state before
repeating a historical failure or claiming support for another toolchain.
