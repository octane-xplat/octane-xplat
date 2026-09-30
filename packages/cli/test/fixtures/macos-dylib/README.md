# Custom macOS dylib metadata proof

This experiment verifies that a leaf-owned C dylib can be called from JS in the
existing prebuilt macOS JSC host when its header is included in replacement
metadata. It is an investigation fixture, not a supported build command.

## Reproduce

On an Apple Silicon Mac, install Xcode, Command Line Tools (the generator links
their `libclang`), CMake, Node, and the `opensrc` CLI. From the repository root:

```sh
node packages/cli/test/verify-macos-dylib.mjs
```

The runner fetches the generator source at the same NativeScript revision used
by `build-metadata.sh`, copies it into the gitignored
`research/macos-dylib-probe/generator`, and builds it there. Subsequent runs reuse
that isolated source copy and build. Keep that copy unmodified when reproducing
this result. All libraries, metadata, generated declarations, and complete logs
remain under `research/macos-dylib-probe/`. Nothing is installed into `prebuilt/`.

Verified on 2026-09-30 with Xcode's macOS 26.5 SDK:

```text
[dylib-probe] compiled custom arm64 dylib
[dylib-probe] generated metadata from explicit imports
PASS shipped metadata: dylib export exists; JS declaration absent
PASS custom metadata: xplat_probe_add(19, 23) = 42; (-7, 2) = -5
[dylib-probe] PASS; artifacts and complete logs: research/macos-dylib-probe
```

The compiled dylib's `LC_BUILD_VERSION` reports `MACOS`, minimum OS `13.5`, SDK
`26.5`. The generator emits:

```ts
declare function xplat_probe_add(left: number, right: number): number
```

The runner requires explicit PASS markers as well as a successful process exit;
a host exit without the JS assertions does not count as success. Each host run
has a ten-second timeout. Failure stops the runner with the captured diagnostic.

## Minimum pipeline

The [runner](../../verify-macos-dylib.mjs) compiles
[xplat-probe.c](xplat-probe.c) as an arm64 dylib targeting macOS 13.5. It passes
three `import=` arguments to the pinned generator: Foundation, dlfcn, and the
absolute path of [xplat-probe.h](xplat-probe.h). Matching `include=` arguments
admit declarations from the custom header directory, SDK `usr/include`, and
Foundation framework. The generated umbrella is:

```objc
#import <Foundation/Foundation.h>
#import <dlfcn.h>
// The runner supplies the absolute path here.
#import ".../packages/cli/test/fixtures/macos-dylib/xplat-probe.h"
```

No generator patch or framework umbrella modification is necessary for this
manual-umbrella path. In the pinned generator's
[main.cpp](https://github.com/NativeScript/runtimes/blob/5b697b393152f973dd392851fd72dacf03a7a0c9/metadata-generator/src/main.cpp#L131),
`import=` accumulates header text and automatic umbrella generation runs only
when that text is empty. `include=` controls declaration admission in
[MetadataFactory](https://github.com/NativeScript/runtimes/blob/5b697b393152f973dd392851fd72dacf03a7a0c9/metadata-generator/src/IR/Factory.cpp#L104);
it is separate from Clang's header search paths. `headers=` or Clang `-I` can
supply search paths when relative imports need them.

The runner pre-creates the types and JSON output directories. It resolves
Xcode's compiler and SDK through `xcrun`: the first attempt with CMake's default
`/usr/bin/clang` failed because the Command Line Tools linker could not parse
the installed macOS 27 SDK's `.tbd` format.

The same prebuilt host and NativeScript framework run both controls. Only the
metadata path changes. JS uses `dlopen(path, RTLD_NOW | RTLD_GLOBAL)` before
calling the global. `dlsym` verifies the export independently in both cases;
its returned pointer is not the invocation mechanism. NativeScript's
[CFunction resolution](https://github.com/NativeScript/runtimes/blob/5b697b393152f973dd392851fd72dacf03a7a0c9/NativeScript/ffi/napi/CFunction.mm#L332)
looks up the metadata-declared name with `dlsym` on the process handle and
builds its call interface from metadata. Keep the library loaded while those
functions can be called.

## Consequences for the proposed leaf workflow

**Verified:** a new C symbol and signature can enter JS through generated
metadata and a separately compiled dylib, without rebuilding or relinking the
host/framework and without generating compiled signature bindings for this
function. Loading the dylib alone does not declare its API in JS.

This probe uses a small replacement metadata bundle. A production CLI would
need to generate one umbrella containing both the required SDK surface and
all discovered leaf headers. Supplying only leaf `import=` arguments bypasses
the current automatic SDK sweep; it would drop declarations existing apps
need. This experiment does not merge metadata binaries or verify a full
combined app bundle.

The natural ownership boundary remains leaf `platforms/macos/` sources and
public headers, with the CLI owning dependency discovery, compilation,
aggregate metadata generation, library loading order, and packaging/signing.
The existing `build-runtime.sh` remains a framework maintenance tool;
`build-metadata.sh` shows the generator seam, and `host.m` already accepts an
external metadata path. None of those production files changed in this proof.

**Inferred, unverified here:** ObjC classes would use public ObjC headers;
Swift would need an ObjC-compatible exposed API and compiler-generated header;
Zig would need C ABI exports and matching declarations. This proof establishes
only a synchronous C function with integer parameters and result, not buffers,
ownership rules, callbacks, native threading, or those language toolchains.
Putting native binaries in `Contents/Frameworks`, resolving their packaged
paths, and signing them before the containing app remain future CLI work.

The pinned
[FunctionReference constructor](https://github.com/NativeScript/runtimes/blob/5b697b393152f973dd392851fd72dacf03a7a0c9/NativeScript/ffi/napi/Interop.mm#L2048)
accepts one JS function and rejects other types. This source check confirms
the earlier raw-pointer constructor failure; FunctionReference is not the
pointer-plus-signature API needed to bypass metadata generation.

No recipe criteria change: the fixture adds evidence, not public behavior,
setup, or a supported workflow. Production leaf compilation remains outside
this experiment.
