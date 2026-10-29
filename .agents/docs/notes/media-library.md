# Media-library implementation and evidence

The package follows Expo MediaLibrary 58.0.13's modern Asset, Album and Query
surface. Public API exploration used exports-md on the npm declarations. The
deprecated function API is not reproduced. Photos/MediaStore own the library;
the existing media package owns picking and camera capture. No upstream source
blocks were copied into the implementation.

## Implemented boundary

The shared facade validates filters/creation input, snapshots query parameters,
keeps durable handles, and separates permission reads from requests. Native
adapters own metadata enumeration, file creation, album edits and observers.
Apple exports are package-owned temporary files; Android content URIs remain
library-owned. Export failure attempts to remove partial files and preserves
cleanup errors. Neither release method deletes an OS library record.

Apple uses PhotoKit on iOS and experimental AppKit. Android 10+ uses MediaStore
and an included Java ContentObserver. Android IDs stay strings through queries
to avoid losing 64-bit row identity. Native page enumeration bounds JavaScript
materialization; file copies still run on the calling thread. Android directory
albums cannot represent Apple membership-only removal, and the API rejects it.
Smart albums, collection type and location are unavailable on Android. Favorite
mutation/filtering requires Android 11+. Web, native GTK and native Windows have
no general device-library adapter here and report unavailable.

## Verification

- Nine shared tests pass: seven facade tests for query snapshots/validation,
  permission separation, fresh metadata, deletion scope, listener cleanup and
  absolute app-path encoding; two actual Octane/JSDOM hook tests cover stale
  read/request results, changed options and unmount cleanup. OS calls are mocked.
- Combined source typechecking passes for all package variants and the maintained
  attachment helper, including Android. This is source evidence, not native
  runtime qualification.
- Packed consumer checks pass with ambient-free native and web declarations,
  a web production bundle and an iOS PhotoKit module graph. The tarball includes
  the Android observer and manifest. This does not prove Android compilation or
  an installed AppKit consumer.
- On skymac.local, iOS 26.2 on the task-owned iPhone Air simulator passed 33
  assertions across undetermined, granted and denied access; nonprompting reads;
  actual permission requests; disposable still-image creation and source
  preservation; metadata and query paging; favorite edits; album creation,
  lookup, membership and deletion; current/original exports and release;
  invalidation events; and actual asset deletion with a stale-handle rejection.
  The final run includes the failure-cleanup export wrapper. Fixtures touch only
  records they create. Permission and deletion dialogs are accepted only after
  matching the owned fixture's identity and expected action.
- On skymac.local (checkout 1fcf6406f), the maintained AppKit feasibility case
  runs the actual PhotoKit source adapter in the prebuilt headless host. It
  passed availability, nonprompting undetermined authorization, unauthorized
  query rejection, missing-purpose-string rejection, observer registration and
  idempotent removal. It queried no assets or user media. The fixture supplies
  platform symbols through runtime globals; this is not packed module loading.
- Docs links/structure, code-fence parsing, recipes and compatibility checks pass.
  The maintained attachment helper is source-typechecked; parsing the remaining
  prose examples alone does not prove their execution.

Android runtime remains explicitly unverified at the user's request. iOS
limited-picker UI, video/cloud export paths and cancellation are implemented but
not runtime qualified. AppKit authorized data operations, entitlement behavior
and packaged-consumer qualification remain unverified. Native GTK and Windows
were not run because these exports deliberately have no device-library backend.

## Nonvisual iOS dialog fixture

[The iOS driver](../../../packages/media-library/tests/ios-runtime.mjs) uses
[an accessibility helper](../../../packages/media-library/tests/ios-dialogs.mjs)
pinned to Maestro CLI 2.11.0. Source review of that exact version established
that MCP inspect_screen opens the selected device using text accessibility
inspection; the helper then uses only the reviewed viewHierarchy and touch HTTP
endpoints. Standard Maestro flow/tap settling can capture screenshots and is
not used. The helper rejects occupied driver ports and image responses; dialog
polling begins only after the native fixture writes its expected step marker.
No screenshots or visual analysis are involved.

Native tests run only on skymac.local. The local resource broker reserves the
unique remote simulator and driver port while supervising SSH because that host
has no broker executable. The task-owned simulator is shut down in a trap.
The cached native app is reused for source changes; a native build is needed only
when native resources/dependencies change.

## PhotoKit framework loading

The prebuilt AppKit host exposes PhotoKit metadata but does not initially load
Photos.framework. Calling PHPhotoLibrary.authorizationStatusForAccessLevel
failed with “There was no native counterpart to the JavaScript object.” Loading
the public framework with NSBundle before resolving PhotoKit classes allowed
both the read and observer operations to pass. This is a host linking/loading
condition, not a confirmed defect in PhotoKit or NativeScript.

Both Apple adapters explicitly load the public framework before resolving its
classes. Keep that step until the supported host guarantees PhotoKit is linked
and loaded. The runtime namespace assertion is confined to this metadata
boundary. Silo feedback observation 0613179d-b55c-43ef-8e4d-4a9e8ba9eeb7 preserves
the original expectation.

The observer uses NSObject.extend behind one metadata assertion. An early probe
with a NativeClass decorator and a BigInt literal failed to parse; removing both
made it run. The trigger was not isolated, so this is not evidence of a specific
upstream decorator or BigInt defect. The maintained implementation uses neither.

The [AppKit feasibility script](../../../packages/media-library/tests/macos-feasibility.mjs)
and private Turbo driver provide the narrow host checks above. Runtime
qualification must stay separate from source and declaration success.


## Immediate permission actions

The final ten-package qualification found two hook races: get:false plus an
immediate explicit getter resolved without updating its reader, and the passive
mount read could overwrite an early explicit request. Commit d8833c51a moves
ownership to the commit layout effect and makes automatic work yield to manual
actions. Both regression cases failed before the change; all eleven package
tests and combined source checks pass after it. Existing option-change and
unmount guards remain covered. Native hook runtime qualification is unchanged.
