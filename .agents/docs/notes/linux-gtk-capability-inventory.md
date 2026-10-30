# GTK capability classification

Use the [GTK renderer guide](../../../docs/platform/linux-gtk.md) and
[renderer implementation note](linux-gtk-renderer.md) for current setup and
architecture. Capability inventories and dispositions belong in Silo/local
reports, not a parallel support matrix in Git.

## Resolve the host first

`.linux` targets the Linux WebKit host; `.gtk` targets the native GTK4/GJS
renderer. Web leaves using DOM APIs or `__xplatBridge` cannot run in the GJS app
process. Native GTK services execute in that process through the host contract.
Do not silently fall back from GTK to web or NativeScript implementations.
Shared code must retain one element vocabulary and matching public types.

Classify each audited capability as native widget, self-drawn UI, explicitly
hosted web/media content, service, or runtime/toolchain infrastructure. The
classification identifies ownership, not qualification. A self-drawn control
still owns accessibility; a hosted surface is an explicit boundary, not a
substitute for ordinary native UI. Cover the intrinsics actually emitted by
shared GTK variants rather than copying another renderer's inventory.

## Audit evidence

Record source availability, runtime behavior, OS input, accessibility, packaging,
and presentation separately. An exported name or passing source/build check
proves neither GJS execution nor GTK behavior. Use Silo `gtk_ui_checks` and
`gtk_recipe_checks` for current state. Preserve recipe criteria when a capability
is missing; record the gap instead of weakening the requirement.

The original resolution survey is preserved in `local_artifacts` under key
`.agents/docs/notes/linux-gtk-capability-inventory.md`. Follow
[operational evidence](../exploration.md#operational-evidence) for lookup and
hash verification before using it as historical source evidence.
