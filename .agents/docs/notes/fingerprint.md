# Native fingerprints and OTA compatibility

`@octane-xplat/fingerprint` is a Node build tool with Expo-shaped collection,
hash and diff APIs. It uses a NativeScript collector because Expo Fingerprint's
automatic sources describe React Native/Expo projects; extra sources augment
that collector rather than replacing its assumptions. The public workflow is
in the [package guide](../../../packages/fingerprint/README.md) and
[phone updates](../../../docs/app/updates.md).

## Input contract

The versioned contract is `octane-xplat.native-fingerprint.v1`, SHA-256 over
canonical, sorted source records. Absolute checkout locations are normalized;
public records expose identifiers, reasons and hashes, never raw contents or
resolved configuration values. NativeScript's trusted configuration is evaluated
as CommonJS, matching CLI 9.1.1's TypeScript transpilation. Relative helper modules
load afresh per call without changing Node's global module cache. A prepare hook
can supply NativeScript's already evaluated `projectData.nsConfig`.

Collected inputs include selected App_Resources, evaluated config, named
NativeSource globs, native plugin files/hooks/declarations, relevant Bun or pnpm
resolutions/patches and available Podfile.lock, Package.resolved and Gradle lock
records. `nativescript.platforms` compatibility alone does not make a pure JS
wrapper native. Native runtime/SDK inputs are explicit. Installed native copies
with conflicting bytes or absent/ambiguous lock metadata fail closed. Input
symlinks cannot escape the declared source root; extras declare custom costs.

Bun reads text `bun.lock` (JSONC) and root `package.json.patchedDependencies`.
The collector follows importer-specific package records into native dependencies;
registry versions must match the installed version. Local archive identities use
the lockfile integrity without absolute checkout paths. Workspace and directory
sources use logical identities plus the existing native source collection. pnpm
11 stores patch digests in its lockfile and patch paths in workspace YAML;
these remain supported as distinct inputs. File-directory resolutions are matched to installed
source roots but recorded as logical package identities, so identical checkouts
do not differ solely by path. Native lock records omit derived Podfile checksums
and Swift originHash, and sort Swift pins by identity. Local Pod source trees
are hashed; dependencies resolved by custom build logic still require explicit
extra sources/toolchain entries.

Source-only collection does not automatically inspect the current host's compiler.
The OTA prepare hook captures actual Xcode/SDK or Android/Java versions, release
mode and hashes of declared compiler environment/CLI overrides. Compiler values
and source records stay in ignored `.xplat/fingerprints/<platform>.json`; the
payload includes only format, platform, hash and release mode. A build record
lets the publisher recompute source inputs on another machine without pretending
that machine compiled the binary. Record custom inputs to any custom generator.
This is an input identity, not a compiled ABI or reproducible-build proof.

## OTA enforcement

The Node fingerprint package is a development dependency, outside the app's
runtime graph. The updated `xplat updates init` hook awaits preparation and
forwards resolved config, project paths and release mode. It preserves differing
existing hooks. Users must review/regenerate the old hook and rebuild binaries;
there is no compatibility alias for the previous minimum-version protocol.

On a first iOS build NativeScript resolves its runtime Swift package during
`buildProject`, after `after-prepare`. A post-build comparison exposed that
missing Package.resolved input. The hook resolves remote Swift packages through
Xcode before stamping and compiling the guard, rather than ignoring the lock.
Resolution errors fail preparation. It does not perform a second native build.

The publisher requires a prepared release payload, its matching private record
and a fresh source hash. It publishes one channel pointer per exact native
fingerprint. Client checks/install validate the manifest and payload stamp.
The native guard compares both against its baked literal before downloaded
JavaScript executes. The writable fingerprint journal supplies the client;
it is not the trust anchor. Native binary/fingerprint changes invalidate old
OTA state. Rollback only restores compatible payloads or the embedded app.
HTTPS/SHA-256 remain the integrity model; publisher signatures are unimplemented.

## Large iOS archive writes

On iOS26.2 with NativeScript iOS runtime 9.1.0/core 9.1.3, the 1.4 MiB bundle's
NSData factory result bridged as `OS_dispatch_data`, exposing only NSObject
methods. Calling `writeToFileAtomically` from JavaScript failed. Both
`dataWithBytesLength` and `dataWithData` showed this failure; small-data probes
exposed the NSData methods normally. This is observed bridge behavior, not an
absence of Foundation's file API. The test diagnostic recorded constructor,
length and prototype names without logging archive contents.

The updater now passes the data directly to Foundation's
`NSFileManager.createFileAtPathContentsAttributes`, checks its Boolean result,
and commits the complete staging directory by rename. No individual file is
written into running code. Keep this workaround until the runtime exposes
NSData methods for the large-data result or another qualified upstream path
replaces it. The maintained lifecycle exercises the real production archive,
so a Node mock cannot conceal failure at that boundary.

## Verification and limits

Eleven focused Node tests cover source/hash stability, JavaScript-only changes,
native invalidation, dynamic config/helpers, custom resources/source globs,
lock ambiguities, patches, directory dependencies, local Pods and Swift/Gradle
resolutions. The packed Node consumer installs emitted JS outside the workspace.
Updates declarations and maintained guide examples are checked across six target
conditions; this is source evidence rather than six-platform runtime evidence.

Publisher dry runs prove exact cohort routing, unchanged-native JavaScript
publishing, stale native-source rejection and debug-payload rejection without
R2/network writes. Worker tests use a fake bucket. No backend was deployed.
The Foundation guard regression runs only on skymac.local and proves manifest/
payload compatibility checks plus activation, confirmation and recovery. Its
Debug compile also records mode/fingerprint while refusing staged activation.
This is native guard logic evidence, not a macOS OTA backend.

On skymac.local, the maintained iOS26.2 unsigned release lifecycle passes:
stage/activate/confirm v2, stage an intentionally throwing v3, recover v2,
quarantine v3, and manually restore embedded v1 while preserving the fixture's
documented phase. Adding a native source produces another fingerprint; an
injected stage with that manifest and payload identity is discarded before its
throwing entry point executes. The installed binary's baked guard rejects it
and boots embedded v1. The final run reuses the compiled native executable and
refreshes release JS resources in a task-owned copy only after matching its
metadata to a fresh input hash. It is an unsigned simulator qualification;
no signed device or npm-installed native consumer is claimed.

The fixture records its local transport port with a reusable build, boots its
owned simulator before uninstalling its own previous installation, and removes
only the native source it creates for the incompatibility test. `--reuse-build`
avoids recompilation; `--refresh-js` additionally prepares release resources
and refuses to reuse a native executable when its fingerprint differs.

Android native code is implemented but compilation/runtime qualification is
explicitly deferred. Source diagnostics accept desktop targets; OTA activation
is unavailable for web/AppKit/GTK/Windows because their packaged startup formats
are not the NativeScript phone payload. No desktop native tests or claims are
needed for this Node tool. Apple runtime tests use skymac.local only; any GTK or
Windows runtime work belongs on andromeda.local or ssh windy respectively.

Historical OTA redirect/rollback evidence in [ota-updates](ota-updates.md) and
[ota-process](ota-process.md#release-lifecycle-evidence-2026-10-10) predates the
fingerprint guard. It does not qualify this Android guard. Signed physical iOS,
deployed Worker/TLS delivery and custom native startup integration remain gaps.
