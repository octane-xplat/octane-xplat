# Native pre-render adoption boundaries

Read this when changing native adoption cleanup or upgrading its NativeScript,
Mason or Octane dependencies. The maintained
[qualification fixture](../../tools/platform-qualification/native-prerender/README.md)
owns the executable controls and their limits; Silo's
`native-prerender-adoption` topic owns current exploration state. These controls
are experimental host integration, not a public hydration API.

## Failed native insertion can escape ordinary tree cleanup

Verified with NativeScript Core9.1.3 and the qualification snapshot of
`@octane-xplat/nativescript-mason-core`1.0.0-beta.8 on Android: Mason's
`common.js` `insertChild` adds the child to its collection before calling Core's
`_addView`. If native attachment throws, its catch removes the collection entry
without clearing Core's parent/context state. Core establishes that state
during insertion; its separate `_removeView` operation clears the parent link.
See [Core's owning implementation](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/ui/core/view-base/index.ts).
The pinned Mason snapshot's implementation is authoritative for this control;
do not assume another checkout or beta has identical insertion semantics.

The actual nineteen-view Home fault control throws during its seventeenth
existing-child native attachment. Normal Octane unmount and host teardown can
leave seventeen claimed wrappers with Activity contexts/native handles even
when the host child count is zero. Core parent links can also survive. This is
runtime evidence of a partial-insertion cleanup gap, not a claim about ordinary
successful mounting or garbage collection.

The fixture keeps an explicit list of claimed wrappers. Its failure recovery
removes managed children normally and uses Core's internal `_removeView` seam
for a child whose parent still points into the failed scope but whose collection
entry is absent. It checks scope ownership first, unloads/tears down any residual
contexts, retires Mason native/style caches, and requires cleared parents,
contexts, handles and loaded state before ordinary rendering. It then empties
the discarded native/Mason tree. No dependency source is patched by this
control. Keep the internal removal seam version-pinned; it is not an app API.

Recheck this control when upgrading Mason insertion rollback, Core view
lifecycle or Octane host disposal. Remove the explicit orphan workaround only
when failed insertion clears Core ownership and the native fault control passes
without it. Empty child lists and cleared wrappers do not establish native or
Rust-object deallocation. General commit/application exceptions still fail;
the control recovers only from its distinct injected attachment error.
