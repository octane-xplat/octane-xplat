# AppKit input/focus/controls runtime qualification

Findings log for issue #78 section 1, rows **Text, keyboard and focus** and
**Controls**. Per the issue, a qualification row closes only with runtime
evidence from a real Mac; handler dispatch alone does not qualify it.

## Evidence tiers

| Tier | Mechanism | What it proves |
| ---- | --------- | -------------- |
| T0 | mount + metadata reads | component renders, props reached native views |
| T1 | `ctx.press` / `invokeAction` / `performClick` | handler wiring only — not OS input |
| T2 | `makeFirstResponder`, `insertText`, `setMarkedText`, `accessibilityPerform*` | real AppKit focus/text-system/AX entry points |
| T3 | `CGEventPostToPid` into the app's event queue | real `sendEvent` routing: local monitors, key equivalents, responder chain, field editor, key-view loop, hit-testing. Events are still flagged synthetic — hardware delivery (T4) is unproven |
| T4 | hardware keyboard/mouse | human only |

Helper: `scripts/probe/appkit-input.ts` — `postKey`, `postKeys`, `postClick`,
`postKeyEvent`, `screenPointOfViewCenter`, `focusedOwner`, `hasFocus`,
`axAttr`. All ambient bridge globals; no framework imports.

## Hosts

| Host | Arch | macOS | Role |
| ---- | ---- | ----- | ---- |
| local dev Mac | arm64 | Darwin 27.2.0 (macOS 27.x) | all results below unless noted |
| `skymac.local` | arm64 | 26.6.2 (25G83) | remote run attempted, blocked (see below) |

## Bugs fixed

- `scripts/probe/runner.ts` forwarded `artifact.metadata` (the whole
  per-arch map) to the probe host; `spawn` stringifies it to
  `[object Object]` so every AppKit probe exited `metadata.nsmd not found`
  before loading the case. Now passes `artifact.metadata[macOSHostArch()]`,
  matching `dev.ts` (`df2d9c7f3`).
- `packages/macos-renderer`: `setTextFieldPlaceholder` rewrote
  `placeholderAttributedString` on every commit, which ends a focused
  field's AppKit editing session — `controlTextDidEndEditing` → value
  commit → spurious `onBlur` — and the resulting nested render hit
  "universal transaction cannot be aborted after its host batch committed"
  (uncaught render error). Signature-deduped per field so unchanged
  placeholders no-op (`72def67ed`). This was user-visible: any state-driven
  re-render while editing a placeholder'd field tore down the edit.
- Probe fixtures read `accessibilityLabel`/`accessibilityValue`/
  `accessibilityRole` as properties; on bridged views those are methods —
  `String(view.accessibilityLabel)` returned the function source, and
  `Number(view.accessibilityValue)` was null. Added `axAttr` and fixed
  switch, toggle-button, slider, select-keyboard, segmented-control probes.

## T3 OS-input evidence (local arm64, macOS 27.x)

Posted CGEvents into the app's real event queue. **hardware-key.macos**
(`examples/probes/keyboard.macos.tsrx`) — 7/7:

- keydown 'a' reaches `useKeyboard` handler (`a/KeyA/false`) AND inserts
  through the real field editor (stringValue `'a'`)
- unmodified key propagates to the parent `useKeyboard` subscription
- `preventDefault` + `stopPropagation` on Cmd+K: text unchanged, parent
  count unchanged — the monitor's `nil` return suppresses the event
- posted Tab moves first responder through the real key-view loop
- unhandled key on the second field inserts and reaches the parent

**focus-modality.macos** — 5/5: posted key → modality `keyboard` and
focus ring `visible`; posted click → modality `pointer` and ring `hidden`
(real hit-testing via `CGEventCreateMouseEvent` + `PostToPid`); posted key
→ `keyboard`/`visible` again. `useFocusVisible` and `useFocusRing` are
qualified at T3; deactivation→`unknown` untested.

**focus-scope.macos** — pass: `makeFirstResponder` + real Tab sequence:
autoFocus lands on first field; Tab skips the disabled field and reaches
the last field; Shift+Tab at the first stop wraps backward to the nested
trigger (real containment, backward direction); nested scope autoFocuses
its first field; closing nested restores its trigger; closing the outer
scope restores the declaring trigger. Open point: posted Tab forward from
the last stop landed on an intermediate container view rather than the
first field within 2s — possibly a containment sentinel or a real
forward-wrap gap; needs a refined check before calling containment closed.

## As-authored probe results (T0–T2, local arm64)

Pass: focus-within (5/5 — boundary counts via real `makeFirstResponder`),
grid-list (2/2 — roving `canBecomeKeyView` flags, disabled exclusion,
programmatic focus), grid-cell-focus, text-limit (2/2 — real
`insertTextReplacementRange`, marked text not truncated, `unmarkText`
commit through the field editor), controlled-text, text-entry-ownership,
toolbar, tokenizer-keys, tokenizer-overflow, power-search-{focus,entities,
range,scalars}, button-actions, checkbox-list (1/1), radio-list (1/1),
select-keyboard, native-picker, native-date-picker, native-context-menu,
native-sheet, segmented-control (1/1 — AXRadioButton role after
action-dispatch press), switch (1/1), slider (2/2 — AX values 20/80),
toggle-button (1/1 — AXValue 1 after press).

Maintained scripts: `bun run --filter @octane-xplat/ui test:color:macos` PASS
(exit 0); `test:overlay-keyboard:macos` PASS (exit 0). These run the real
AppKit host; assertions within remain action-dispatch tier.

## Findings (not fixed)

- `select.macos.tsrx`: "Probe timed out" on first `waitFor` — mount never
  produced the expected view within 30s; needs a case-level look.
- `appkit-sheet-portal.macos.tsrx`: fails to build —
  `@octane-xplat/sheet/macos` unresolvable in the isolated project; rerun
  needs `--deps @octane-xplat/sheet`.
- Probe teardown: `root.unmount()` after the modality case threw
  "Universal transport rejected stale accepted batch version 6; current
  version is 7" — a dispose-time commit race in the renderer; nonfatal to
  the case but worth an owner.
- skymac remote run: self-contained probe package (build dir + prebuilt
  host + framework + Mason) transferred and launched; bootstrap `dlopen`
  of `__xplatNativeHandles` threw `TypeError: Expected an object` — all
  three dylibs load fine via `ctypes`, so the failure is inside the
  bridge's `dlopen`/`dlerror` path or arg handling; undiagnosed. Remote
  evidence therefore still pending.

## Not yet run / open

- macos-renderer `test:portals`, `test:overflow`, `test:gestures`;
  `@xplat/macos` smoke sweep.
- IME: marked-text paths proven only through direct `setMarkedText`/
  `unmarkText` calls (T2); a real input-method composition (T3/T4) is
  untested — CGEvent dead-key sequences are the next step.
- Toolbar roving focus + mixed Tab ownership (known implementation gap):
  probe is mount-only; no roving-arrow or editor-Tab evidence yet.
- Menu/dropdown keyboard, TabMenu, NumberInput, Calendar, date/time
  probes: batch still running at write time.
- VoiceOver adjust actions on color controls: color probe passes but its
  assertions are action-tier; `accessibilityPerformIncrement`/`Decrement`
  on ColorSlider/ColorArea not yet driven.
- T4 hardware input is out of automation scope throughout.
