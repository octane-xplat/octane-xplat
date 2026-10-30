# Platform services

Shared platform capabilities live in `packages/platform/src/` as an
unsuffixed native default and optional `.web` browser override behind a package
barrel. Use `.mobile` or an OS suffix for narrower platform variants. App-specific navigation,
sheet, overlay, and demosweep seams live in `packages/app/src/platform/`.

Choose the page for the current task; load other pages only when their constraints apply.

| Task | Reference |
| --- | --- |
| Storage and credentials | [Read for this task](services/storage.md) |
| Screen, lifecycle, and host environment | [Read for this task](services/environment.md) |
| Connectivity and incremental HTTP | [Read for this task](services/networking.md) |
| Files, capture, and playback | [Read for this task](services/files-media.md) |
| Authentication and browser presenters | [Read for this task](services/authentication.md) |
| Notifications, clipboard, and sharing | [Read for this task](services/notifications-sharing.md) |
| Imperative animation and gestures | [Read for this task](services/motion.md) |
| Localization and Intl ownership | [Read for this task](services/localization.md) |
| Randomness and tracking consent | [Read for this task](services/privacy.md) |
| Choose optional capabilities | [Read for this task](services/capabilities.md) |

## Locate the owning package

Read [navigation](navigation.md) and [overlays](overlays.md) for UI ownership. App-owned twins include `nav`,
`sheet`, `overlay`, and `demosweep` (probe) under `packages/app`; capability
twins such as `storage`, connectivity, files, and system bars live under
`packages/platform`. In `packages/ui`, keep `stacks`, `route`, `anim`,
`colorScheme`, and component leaves aligned across targets.

## Adding a service

1. `packages/platform/src/foo.ts` (native default) +
   `foo.web.ts` (implementation or
   documented unsupported result) — same export names and public types.
   Silent no-ops are not a substitute for platform parity.
2. Export through the package barrel (deep specifiers don't
   extension-resolve).
3. If it touches a DOM global on web — fine, web leaf is DOM territory;
   the unsuffixed native implementation must stay DOM-free (xplat/no-dom-globals).
