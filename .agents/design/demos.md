# Kitchen sink and sanity harness

The kitchen sink earns confidence by demonstrating difficult interactions in coherent working experiences. Basic counters, control inventories, import checks, and renderer probes belong in the sanity harness or component workshop. Preserve those tests without using them as the visitor's opening experience.

## Product showcase

A featured experience must resolve a meaningful doubt about building a serious app, produce an observable result, and offer something beyond a happy-path click. Prefer a small set of substantial experiences to an exhaustive component menu. A useful “Try this” challenge lets someone provoke failure, interrupt work, or revisit context and judge the result themselves.

The visitor entry is `packages/app/src/showcase/Showcase.tsrx`. It composes:

| Experience | Owning source | What to demonstrate |
| --- | --- | --- |
| Data workspace | `showcase/DataWorkspace.tsrx`, `showcase/workspace.ts` | Shared cached data, bulk edits, rollback, retained filters/selection/page, and protected detail drafts. |
| Document studio | `showcase/DocumentStudio.tsrx` | Real rich-text editing, undo/redo, local draft recovery, and a revision save that cannot replace newer edits. |
| Conversation | `showcase/Conversation.tsrx` | Long history, docked composition, mentions, incoming messages, failed delivery and retry without duplicates. |
| Fieldwork | `showcase/Fieldwork.tsrx` | Real image import/crop/encoding, separate source/output ownership, local note recovery, and truthful host export/share outcomes. |
| Motion | `packages/demos/src/MotionPatterns.tsrx` | Responsive, interruptible interaction and coherent reduced-motion behavior. |

Use deterministic public fixtures and the real framework packages. Clearly identify simulated transports and session-only confirmation; a mock server response must not be presented as actual network synchronization. A control that only changes a success label does not prove saving. Preserve work on failure, cancellation, navigation, and replacement. Performance claims require actual target measurements, not a row count or a successful build.

Do not feature unfinished experiences or silently substitute a basic screen for an unsupported capability. Report unavailable platform behavior in context. Shared source and web verification do not qualify native runtime, keyboard, accessibility, or pixels. Desktop targets remain experimental.

## Separate proving entry

`/harness` is the contract-driven sanity console. `packages/app/src/harness/core-cases.ts` owns executable case definitions; `catalog.ts` classifies retained fixtures and qualification workflows. The console provides Overview, Cases and Results, stable case links, fresh fixture ownership, truthful evidence labels and session JSON export. See [sanity console ownership and verification](../docs/sanity-harness.md).

`/harness-baseline` preserves the original Home / Apps / Test integration fixture and complete demo registry while focused contracts migrate. Browser `?selfdrive` / `?selfdrive-os` and direct named `@test` / `@demos` URLs select this baseline; `/?harness` selects the console. Preserve existing assertions until replacement cases cover their behavior. Neither the visitor shell nor the console schedules baseline self-drive effects.

The [component workshop](../../docs/testing/component-workshop.md) owns systematic component variants. Use [isolated probes](../docs/testing.md) for an individual investigation. Introductory documentation can continue using simple, bounded examples.

## Implementation constraints

- Keep the visitor screens shared and put platform differences at file boundaries. Scope browser layout overrides to `showcase.css` web-only blocks.
- The workspace uses `createQueryClient`, `defineQuery`, and `runOptimistic`. Preserve confirmed authority on rejected edits and prior results on failed refresh. Each module-store reader subscribes with `useStore`.
- Rich editing uses the real editor facade. Local recovery and simulated revision confirmation are separate states. A save acknowledges the submitted revision, not whatever text happens to exist when it settles.
- The document studio seeds the editor once and uses its handle for explicit document replacement. Feeding every emitted HTML serialization back through `value` stalled the web editing journey with repeated parsing, DOM replacement, and selection updates ([issue #266](https://github.com/octane-xplat/octane-xplat/issues/266)). The underlying cause is unconfirmed; do not reintroduce that feedback path without exercising actual typing, selection, formatting, and tab changes. The detail pane does not establish a BottomSheet focus defect: the stall also occurred without a sheet.
- An imported image, an immutable rendered image, and an encoded result have different owners. Release refs and results only after consumers stop using them; late async outputs must be released rather than published to retired components.
- Identity-stable standalone render functions are required for the tab specs: module-level JSX callbacks inside object literals do not receive native universal lowering.
- TSRX template children are compiled render bodies. Data-only consumers such as `ChatTokenizedText` receive a string through an explicit `children={message.text}` prop.
- Native retained children skip re-render when their props do not change. Do not depend on a parent render to refresh an unsubscribed module-store snapshot.

## Verification entry points

Run the visitor browser workflow through Turbo:

```sh
bun run turbo run smoke:showcase --filter=@octane-xplat/web
```

`XPLAT_WEB_BROWSER` chooses the installed Chromium, Firefox, or WebKit engine. The runner starts its own preview unless `XPLAT_SHOWCASE_URL` identifies an owned running server. Captures are opt-in through `XPLAT_SHOWCASE_EVIDENCE`; do not enable or inspect images without the task's visual authorization. Keep browser tasks outside the lightweight PR gate.

The original web smoke and navigation checks explicitly launch the retained baseline fixture. Query ownership/rollback tests live with the workspace model. Build/typecheck evidence and actual browser/device behavior remain separate; handler dispatch does not prove OS input or hit-testing.
