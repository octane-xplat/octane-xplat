# AppKit verification scope

Absolute and grid panel placement has a maintained nonvisual AppKit regression.
It checks a 268×773pt panel with full-width rows and a 693pt growing scroll view,
then repeats solver passes and resizes without shrinking or repositioning the
host window. This qualifies the fixture's geometry on Apple Silicon macOS;
it does not establish OS input, visual parity, or every grid configuration.
Run the focused check from the repository root:

```sh
pnpm --filter @xplat/macos test:layout-placement
```

## Packed consumers and overlays

`@octane-xplat/macos-renderer` has independent packed-consumer coverage for
system fonts, rendering updates, and the CLI's AppKit packaging contract. This
coverage does not establish OS input delivery or general UI-package parity.

Shared AppKit dialogs, alert dialogs, bottom sheets, lightboxes, and toast
stacks have dedicated presentation and cleanup. The renderer's 88 native-state
tests pass, and the bounded packed overlay consumer typechecks JSX and
imperative declarations in Bundler and NodeNext modes. Those checks cover
source, handler dispatch, and declarations; they do not establish physical OS
input or VoiceOver behavior. Lightbox video playback, double-click zoom, and
touch swipe navigation remain unavailable on macOS; see
[shared presentations](../../docs/app/primitives.md#macos-shared-presentations).

The normal UI AppKit packed check builds the full macOS barrel and a packed
consumer in Bundler and NodeNext modes (`pnpm --filter @octane-xplat/ui
test:macos`), and the isolated AppKit overlay fixture passes its overlay
assertions (`pnpm --filter @xplat/macos test:overlays`). Both cover bundling,
declarations, and handler dispatch; neither establishes physical OS input. See the
[renderer setup and verification boundary](../../packages/macos-renderer/README.md).

The broader `@octane-xplat/ui` native suite is green: the universal entries
export `Children` again, and the focused imperative-sheet service tests pass
alongside the rest of the mobile and macOS cases.
