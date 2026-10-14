# Imperative overlays return typed handles

`showToast` and `useToast()` show calls now return a `ToastHandle` —
`{ id, dismiss(), update(options) }` — instead of a bare dismiss function, or
`null` when a `collisionBehavior: 'ignore'` duplicate suppresses the toast.
`openBottomSheet` and the platform `openModal` (`@octane-xplat/ui/ios`,
`@octane-xplat/ui/android`) return `BottomSheetHandle`/`ModalHandle`: the same
completion promise as before, plus `close(result)` scoped to that instance, so
concurrent sheets and modals dispose independently instead of competing for
`closeBottomSheet`'s most-recent target.

`openWindow` now returns a shared `WindowHandle | null` on every target —
`id`, a `closed` promise, `isClosed`, `close()`, plus optional
`setTitle`/`setSize`/`onCloseRequested` where the host supports them —
replacing `void` on native/macOS and `Window | null` on web. `null` means the
host refused the request synchronously (popup blocked, no AppKit window
service). `OpenWindowOptions` also gained `kind` ('regular' | 'dialog' |
'popup'), `title`, `size`, and `parent` hints, matching the desktop windowing
contract the macOS/Linux hosts already implement.

Migrating: call `toast?.dismiss()` instead of invoking the returned function
directly, and read `windowHandle.closed`/`windowHandle.close()` rather than a
raw `Window`. `await openBottomSheet(...)`/`await openModal(...)` call sites
are unchanged — the handle is still the result promise.
