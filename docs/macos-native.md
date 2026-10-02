# Ship native code in a macOS leaf

> Add a macOS feature written in C, Objective-C, Swift, or Zig and call it
> from your app's JavaScript code.

This is an advanced guide for authors of add-on packages, also called
**leaves**. It assumes you already have the experimental
[macOS AppKit app setup](toolchain.md#experimental-appkit-target) and know
the native language your feature uses. Most app screens can use shared
components and [device services](platform-services.md) instead.

macOS leaves can publish `platforms/macos/` alongside their platform-suffixed JS
sources. The CLI discovers native code through installed runtime dependencies,
compiles a dylib per leaf, and generates app metadata from public headers. The
prebuilt host loads those libraries before running application JS. App authors
do not need to rebuild NativeScript.framework or write `dlopen` glue.

This workflow targets Apple Silicon with an app deployment target of macOS
13.5 or later. The [AppKit renderer remains experimental](toolchain.md#experimental-appkit-target);
native source compilation does not expand its UI or service support.

## Prepare the app

Build on an Apple Silicon Mac with Xcode selected, Command Line Tools installed,
and Node 22.17 or later. Zig is needed only when a dependency ships `.zig`
sources; the maintained fixture uses Zig 0.16. The CLI ships its pinned metadata
generator, which loads Command Line Tools' `libclang`. App builds need neither
CMake nor an upstream runtime checkout. `pnpm xplat doctor` checks the native
packages and loads the generator to diagnose missing or incompatible tools.

For CLI-owned development, add the following to the app's existing
`xplat.targets.macos` configuration:

```json
{
	"dev": {
		"viteConfig": "vite.dev.config.mjs",
		"bundleFile": "dist/dev/main.cjs"
	}
}
```

The named Vite config must emit the CommonJS bundle at `bundleFile`. Packaging
continues to use the existing `xplat.targets.macos.package` contract. Paths are
relative to the app root. The two optional fields `shellViteConfig` and
`shellBundleFile` must be supplied together when a persistent AppKit shell owns
Octane HMR, as in `apps/macos`. Without a shell, a successful JS rebuild restarts
the host. An existing custom `scripts.dev` remains usable for apps with no
native leaves; native leaves require the CLI-owned `dev` configuration.

## Write and install a C leaf

Create a `native-math/` directory inside the app with these files. This example
ships source rather than a precompiled library:

```text
native-math/
  package.json
  src/index.macos.ts
  platforms/macos/include/XplatMath.h
  platforms/macos/src/XplatMath.c
```

`native-math/package.json`:

```json
{
	"name": "@example/native-math",
	"version": "1.0.0",
	"type": "module",
	"files": ["src", "platforms"],
	"exports": {
		".": {
			"types": "./src/index.macos.ts",
			"macos": "./src/index.macos.ts"
		}
	}
}
```

`platforms/macos/include/XplatMath.h`:

```c
#ifndef XPLAT_MATH_H
#define XPLAT_MATH_H
int xplat_math_add(int left, int right);
#endif
```

`platforms/macos/src/XplatMath.c`:

```c
#include "XplatMath.h"
int xplat_math_add(int left, int right) { return left + right; }
```

`src/index.macos.ts`:

```ts
declare const xplat_math_add: (left: number, right: number) => number

export function add(left: number, right: number) {
	return xplat_math_add(left, right)
}
```

Install it as a runtime dependency and start development:

```sh
pnpm add ./native-math
pnpm xplat doctor
pnpm xplat dev --targets macos
```

In the macOS entry, `import { add } from '@example/native-math'` followed by
`add(19, 23)` returns `42`. The header supplies the C signature; the TS
declaration supplies the JS caller's type. Keep them compatible. This package
defines only a macOS entry; a cross-target package must also provide the other
platform entries it supports.

## Choose a language and public boundary

| Sources     | Public API used for metadata                              | JS call in the maintained fixture |
| ----------- | --------------------------------------------------------- | --------------------------------- |
| `.c`        | Public `.h` declarations with C ABI signatures            | `xplat_c_value()`                 |
| `.m`, `.mm` | ObjC headers with exposed classes/selectors               | `XplatObjCProbe.value()`          |
| `.swift`    | Generated ObjC header for public `@objc` APIs             | `XplatSwiftProbe.value()`         |
| `.zig`      | `export fn` with C ABI types and a matching public header | `xplat_zig_value()`               |

For example, this Swift class needs no handwritten header:

```swift
import Foundation
@objc(XplatSwiftProbe)
public final class XplatSwiftProbe: NSObject {
    @objc public static func value() -> Int32 { return 43 }
}
```

The CLI compiles Swift together with the leaf's C/ObjC object files, creates a
bridging header from its public headers, and adds the generated Swift header to
metadata. Pure Swift generics and other APIs that are not ObjC-compatible are
not a JS interface. ObjC++ implementation files are supported, but exposed APIs
must use C/ObjC signatures, not C++ classes or templates.

A Zig boundary can be as small as
`export fn xplat_zig_value() c_int { return 44; }`, declared as
`int xplat_zig_value(void);` in its public header. Each selected Zig source is an
object-file entry point; imported Zig modules can remain unselected support
files by using an explicit `sources` list.

The JS namespace is process-wide. Prefix C symbols and ObjC class names to avoid
collisions with other leaves and SDK APIs. Duplicate exports across leaves and
native dependency cycles fail the build. Buffer ownership, callback lifetime,
and thread rules remain the leaf's responsibility; this build workflow does
not define a generic transport or async API. All code executes with the app's
permissions. `interop.FunctionReference` wraps JS callbacks; it does not turn
a raw `dlsym` pointer into a JS-callable function.

## Declare native build inputs

The default source selection is every `.c`, `.m`, `.mm`, `.swift`, and `.zig`
file below `platforms/macos/src/`. Every `.h` below
`platforms/macos/include/` is public. Swift-only leaves can omit handwritten
headers. Other leaves need at least one public header. Publish the native tree
in `package.json.files`.

An optional `xplat.macos` object customizes those conventions:

```json
{
	"xplat": {
		"macos": {
			"sources": ["platforms/macos/src/XplatMath.c"],
			"headers": ["platforms/macos/include/*.h"],
			"includePaths": ["platforms/macos/src"],
			"frameworks": ["Foundation"],
			"libraries": ["sqlite3"],
			"defines": ["XPLAT_FEATURE=1"]
		}
	}
}
```

| Field          | Meaning                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `sources`      | Package-relative file/glob list overriding default source selection. Empty or unmatched lists fail.                                     |
| `headers`      | Package-relative file/glob list overriding public header selection. Swift generated headers are still included.                         |
| `includePaths` | Additional package-relative directories for native compilation and metadata parsing.                                                    |
| `frameworks`   | System framework names passed to the linker.                                                                                            |
| `libraries`    | System library names passed as `-l`, without a `lib` prefix or extension.                                                               |
| `defines`      | C preprocessor definitions used by C/ObjC, Swift's C importer, Zig C imports, and metadata. Conflicting definitions across leaves fail. |

Files and include directories must remain inside `platforms/macos/`, including
symlink targets. Missing inputs and unknown fields fail with the package name.
All files in that tree, including private headers and imported support files,
participate in cache invalidation. Framework/library inputs here name system
SDK libraries; this interface does not install third-party native libraries,
run arbitrary package build scripts, or load Node-API addons.

Declare other leaf packages as real `dependencies`, as on mobile. The CLI walks
installed runtime dependencies and available peers/optional dependencies, with
support for pnpm's isolated layout and workspace links. Transitive native leaves
compile and load first; dependent dylibs link to them with relocatable install
names. Public headers must be self-contained with their imports and compatible
with the NativeScript C/ObjC metadata bridge.

## Rebuild, package, and diagnose

`pnpm xplat dev --targets macos` compiles native dependencies before launching.
Native source, header, and package configuration edits rebuild metadata and
libraries, then restart the host. Uncached metadata generation can take a few
minutes; unchanged builds reuse the artifact cache. A failed native rebuild reports the stage and
preserves the running app. Fixing the input triggers recovery. Restarting resets
process-local JS and native state; dylibs are not hot-swapped while JS retains
function pointers. The public `runMacOSDev(appRoot?)` export from
`@octane-xplat/cli/macos` starts the same runner from an existing Node script.

`pnpm xplat build --targets macos` compiles or reuses native artifacts, builds JS,
and copies the libraries into `Contents/Frameworks`. The bootstrap loads them
relative to the `.app`, so moving or renaming the bundle does not depend on
development paths. Libraries are signed before the containing app. Developer ID
and notarization use the existing `MACOS_SIGNING_IDENTITY`,
`MACOS_NOTARY_PROFILE`, and configured entitlements; see the
[packaging guide](toolchain.md#experimental-appkit-target).

Generated outputs live below `node_modules/.cache/xplat/`. The cache key includes
native contents/configuration, dependency inputs, compiler/SDK identity,
deployment target, and metadata tooling. Concurrent builds publish complete
artifacts atomically; failed builds do not replace valid outputs. Cached dylibs
and metadata are checked against their recorded hashes. Package-manager copies
of tools are verified and copied to the app cache before executable permissions
are set, preserving the shared package store.

Stop dev before running `pnpm xplat clean`. It removes generated caches and
build outputs while preserving authored `platforms/macos/` files. A corrupt
cache diagnostic identifies a specific generated directory; remove that
directory and rebuild. No-native-leaf apps continue using shipped metadata and
need no native compilation toolchain.

## Evidence and maintainer tooling

The maintained language fixtures live in
`packages/cli/test/fixtures/macos-native-leaves`; the independent app fixture is
`packages/cli/test/fixtures/macos-native-app`. From this repository:

```sh
node --test packages/cli/test/macos-native.test.mjs
node packages/cli/test/verify-macos-native.mjs
node packages/cli/test/verify-macos-native-consumer.mjs
```

These exercise source selection, input validation, all four languages in the
real host, transitive C/ObjC linkage, metadata SDK/sqlite compatibility, cache
reuse/invalidation, concurrent publication, public-header rejection, packed
package consumption, dev restarts/failure recovery, and a relocated ad-hoc
signed app. The consumer fixture packs the CLI and leaves, then installs them;
it needs registry access for ordinary JS dependencies when they are not cached.
Developer ID/notarization are external credential-dependent checks; the local
fixture does not claim notarization evidence.

Framework maintainers regenerate the shipped tool with:

```sh
bash packages/cli/src/macos/jsc-host/build-generator.sh --install
```

This maintenance command needs Git, CMake, Xcode, and Command Line Tools. It
builds the pinned runtime revision plus committed patches, installs the binary
and license, and refreshes its checksum. The generator appends leaf imports to
the existing SDK umbrella (including sqlite3/dlfcn) and strictly validates
leaf public headers separately. The broad SDK sweep retains upstream behavior
for unrelated SDK-private header diagnostics; it is not a syntax validation
pass over every Apple framework. App builds do not modify shipped host,
framework, or metadata artifacts.
