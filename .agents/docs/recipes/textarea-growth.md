# Grow a multiline input

ID: textarea-growth
Targets: web, ios, android, macos
Related APIs: TextArea, autoGrow, rows, maxRows, value, onChange

## Starting point

A working app with a multiline input. Choose whether the app or the field owns
its text.

## Requirements

- Fit the input to changing content in controlled or uncontrolled mode.
- Bound growth while keeping longer content accessible.

## Acceptance criteria

- AC1: Omitting value gives field-owned text; controlled value and onChange keep app-owned text synchronized, including external value updates.
- AC2: autoGrow grows and shrinks on edits in either mode, rows sets the starting height, and maxRows caps growth with internal scrolling.

- AC3: On AppKit, retain one current editor/viewport/clip/document observation lease, capture cleanup and returned handles, suppress setup/retired callbacks and retire before other destroy effects. Sizing stops after native layout/constraint effects retire or replace scope. Reconcile eleven authored models and human-operated width/cap/growth/removal controls without claiming actual native timing, scroll/input/IME/AX/memory/installed qualification or recovery of unreturned handles/failed removal.

- AC4: Register the existing native text-controls fixture as an uncached macOS-local Turbo task with dependency typegen/build and app generation prerequisites. Document its exact broker-wrapped command and retain explicit human authorization, native/runtime/OS-input and visual qualification boundaries; source registration is not an executed Turbo graph or native pass.

## Documentation

- AC1: [State ownership](../../../docs/app/primitives.md#grow-a-multiline-field) and maintained [input probes](../../../packages/app/src/Home.tsrx).
- AC2: [Growth and limits](../../../docs/app/primitives.md#grow-a-multiline-field); input-driven sizing regressions in `packages/ui/src/components/forms/TextArea.web.test.tsrx`.

- AC3: [Growth ownership guide](../../../docs/app/primitives.md#keep-appkit-growth-with-its-editor), [renderer contract](../../../packages/macos-renderer/README.md#own-multiline-resize-observation), [lease](../../../packages/macos-renderer/src/text-view-layout.ts), [seven observer models](../../../packages/macos-renderer/test/text-view-layout.test.ts), [three sizing models](../../../packages/macos-renderer/test/text-interaction.test.ts), [destroy integration model](../../../packages/macos-renderer/test/batch-recovery.test.ts), [manual fixture](../../../examples/probes/text-entry-ownership.macos.tsrx), [skill](../../skills/octane-xplat/references/primitives.md#appkit-multiline-sizing-ownership), [fix note](../../../.changelog/fixes/appkit-textarea-resize-ownership.md) and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-multiline-layout-observation-ownership). All cases/probes remain UNRUN.

- AC4: [macOS task](../../../apps/macos/turbo.json), [existing script](../../../apps/macos/test/verify-text-controls.mjs), the command below and the [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-multiline-layout-observation-ownership). Task/configuration metadata received source/JSON review only; Turbo graph, prerequisites and native execution remain unrun.

## macOS verification

The maintained [AppKit text fixture](../../../apps/macos/test/text-controls-fixture.macos.tsx)
is authored to exercise controlled/field-owned growth, cap changes, fixed rows,
explicit height and a scrollable document. It has not run for this task and uses
synthesized changes, which cannot qualify physical typing or scrolling. The
macOS-local Turbo task prepares dependency outputs and app generation, and is
uncached because the native fixture has side effects. After this task receives
explicit human verification authorization, the exact deferred command is:

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit text-controls fixture"}' -- pnpm exec turbo run test:text-controls --filter=@xplat/macos
```

This command remains UNRUN. Resource admission is not visual-analysis approval.
The [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-multiline-layout-observation-ownership)
records the other deferred source/packed/probe commands and remaining limits.
