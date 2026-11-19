# Examples and diagnostic probes

Browse instructional examples by category, then choose the task you want to
build. Use each example alongside its guide for setup and platform limits.
Most source is intended to be adapted to an app. The web-rendering example
also includes a runnable build and server.

When adding an instructional example, put it in the relevant category folder
and use numbered comments to explain the steps in order. Show complete imports,
meaningful failure handling, and cleanup where the task needs them. Link the
example from its guide and list it here. Tests and diagnostic fixtures may live
with the code or runner they exercise; they are not instructional walkthroughs.

| Directory | Guide |
| --- | --- |
| [`accessibility/`](accessibility/) | [Accessible screens](../docs/app/accessibility.md) and [status announcements](../docs/platform/platform-services.md#announce-a-status) |
| [`auth/`](auth/) | [Authentication](../docs/app/authentication.md) and the [server verification boundary](auth/README.md) |
| [`automation/`](automation/) | [Argent checks](../.agents/docs/argent.md) |
| [`background-work/`](background-work/) | [Background work](../docs/platform/background-work.md) |
| [`chat/`](chat/) | [Chat components](../docs/app/components.md#chat) and [conversation keyboard behavior](../docs/app/software-keyboard.md#keep-a-conversation-steady) |
| [`clipboard/`](clipboard/) | [Keyboard and clipboard](../docs/app/keyboard-clipboard.md) |
| [`dev-actions/`](dev-actions/) | [Development actions](../docs/testing/development-actions.md) |
| [`device/`](device/) | [Screen orientation](../docs/packages/package-screen-orientation.md) |
| [`dictation/`](dictation/) | [Speech recognition](../docs/packages/package-speech-recognition.md) |
| [`drag-and-drop/`](drag-and-drop/) | [Drag and drop](../docs/packages/package-dnd-kit.md) |
| [`forms/`](forms/) | [Forms](../docs/packages/package-form.md) |
| [`keep-awake/`](keep-awake/) | [Keep a screen awake](../docs/platform/keep-awake.md) |
| [`keyboard-shortcuts/`](keyboard-shortcuts/) | [Keyboard shortcuts](../docs/app/keyboard-shortcuts.md) and [global shortcuts](../docs/packages/package-global-shortcuts.md) |
| [`keyboard/`](keyboard/) | [Hardware keyboard](../docs/app/keyboard-clipboard.md#handle-hardware-keys-on-web-and-linux), [software keyboard](../docs/app/software-keyboard.md), and [keyboard package](../docs/packages/package-keyboard.md) |
| [`media/`](media/) | [Platform services](../docs/platform/platform-services.md), [image cropping](../docs/packages/package-image-crop.md), [image manipulation](../docs/packages/package-image-manipulator.md), [media library](../docs/packages/package-media-library.md), [media conversion](../docs/packages/package-media-converter.md), and [view capture](../docs/packages/package-view-shot.md) |
| [`motion/`](motion/) | [Animation and gestures](../docs/app/animation-gestures.md), [animation values](../docs/app/animation-values.md), and [rolling text](../docs/packages/package-rolling-text.md) |
| [`notifications/`](notifications/) | [Local notifications](../docs/platform/local-notifications.md) |
| [`observability/`](observability/) | [Production errors](../docs/testing/production-errors.md) |
| [`overlays/`](overlays/) | [Overlays](../docs/app/components.md#overlays) and [scrolling](../docs/app/components.md#scrolling) |
| [`payments/`](payments/) | [In-app purchases](../docs/platform/in-app-purchases.md) and [Stripe checkout](../docs/packages/package-stripe.md) |
| [`printing/`](printing/) | [Print](../docs/packages/package-print.md) |
| [`privacy/`](privacy/) | [Tracking transparency](../docs/packages/package-tracking-transparency.md) |
| [`readiness/`](readiness/) | [Readiness scopes](../docs/app/readiness.md) |
| [`recorder/`](recorder/) | [Media services](../docs/platform/media-services.md) |
| [`security/`](security/) | [Crypto](../docs/packages/package-crypto.md) |
| [`search/`](search/) | [Structured search](../docs/app/power-search.md) |
| [`sharing/`](sharing/) | [Share text and URLs](../docs/platform/platform-services.md#share-text-and-urls) |
| [`startup/`](startup/) | [Splash screen](../docs/packages/package-splash-screen.md) |
| [`storage/`](storage/) | [Local storage](../docs/app/local-storage.md) |
| [`tables/`](tables/) | [Interactive tables](../docs/packages/package-table.md) |
| [`text/`](text/) | [Measure text with Pretext](../docs/packages/package-pretext.md) |
| [`updates/`](updates/) | [App updates](../docs/app/updates.md) |
| [`visibility/`](visibility/) | [Track visibility while scrolling](../docs/packages/package-intersection-observer.md) |
| [`web-rendering/`](web-rendering/) | [Render a Web page on the server](../docs/platform/web-rendering.md) |

`probes/` contains maintained diagnostic fixtures for the runner in
[`tools/probe/`](../tools/probe/). See [single-case probing](../.agents/docs/probing.md)
for prerequisites, targets, and commands. Keeping a probe here does not mean
that its behavior is covered by an automated regression test or qualified on
every platform. Put temporary investigation cases in gitignored `research/`;
retain fixtures here only for an ongoing diagnostic purpose with a clear owner.
