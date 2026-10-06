# Nested-tree editor device evidence

Runtime evidence for the Foxtrot recursive-document question: does the
current native editor surface preserve a nested task-item hierarchy —
task attributes, paragraph text, and child order — through load, edit,
undo, save, and reopen?

Evidence type: `lab-experiment`. Run 2026-10-05/06 (UTC) on macOS arm64,
worktree on `main` at `abef0329`.

## What ran

Three probe cases under `research/foxtrot-native-editor/` (temporary,
gitignored): a ProseMirror schema-model case (`model.ts`), the Android
Aztec case (`aztec.android.tsrx`), and the iOS boundary case
(`placeholder.ios.tsrx`). Fixture: a 3-level `toggle-item` tree —
task parent (state/priority/created-at attrs), checklist child
(checked), task grandchild — with non-ASCII text.

```sh
pnpm probe run research/foxtrot-native-editor/model.ts --target web \
	--deps @tiptap/core,@tiptap/pm,@tiptap/starter-kit
pnpm probe run research/foxtrot-native-editor/placeholder.ios.tsrx \
	--target ios --device CF4A9D5B-C905-4EB3-A3CE-EB6BAF30FC4B \
	--deps @octane-xplat/richtext
pnpm probe run research/foxtrot-native-editor/aztec.android.tsrx \
	--target android --device emulator-5556 \
	--deps @octane-xplat/richtext --timeout 60000
```

| Target | Device | Result | Run ID |
| --- | --- | --- | --- |
| Android | `octane-prime-larkspur` AVD, API 35 google_apis arm64 (`emulator-5556`) | PASS — 46/46 assertions | `6f025db1-7d86-43ac-8969-067f78ce95df` |
| iOS | iPhone 17e simulator, iOS 27.0 (`CF4A9D5B-C905-4EB3-A3CE-EB6BAF30FC4B`) | PASS — 2/2 assertions (unsupported boundary) | `49021805-1f18-42d5-b862-459a9a7ae5f7` |
| Web (schema bound) | Chromium host | PASS — 10/10 assertions | `9ae31b5c-ef34-448c-a2c5-53de8092a265` |

Raw runner output: `docs/evidence/nested-tree-editor-android-2026-10-06.json`,
`docs/evidence/nested-tree-editor-ios-2026-10-06.json`,
`docs/evidence/nested-tree-editor-model-web-2026-10-06.json`.

## Findings

**Android — hierarchy survives the HTML boundary (refutes the linear-model
assumption).** Aztec's `fromHtml`/`toPlainHtml` round-trip preserved all
three nested `data-type="toggle-item"` wrappers, every `data-*` task
attribute, and parent→child→grandchild order across load, three text
edits, undo, and a full `getHTML` → `setHTML` reopen. Native class
`org.wordpress.aztec.AztecText`.

**But serialization fidelity degrades per round-trip:**

- `<p>` paragraphs are flattened to text plus `<br>` separators on the
  first load.
- Reopen accumulates stray `<br>`s (`Grandchild edited 🚀<br><br></div>…`);
  repeated save/load cycles would drift the document.
- `undo()` did not revert programmatic `Editable.insert` edits — Aztec
  history batches keyboard input only, matching the documented handle
  contract.
- The facade exposes no split, merge, indent, or outdent command, so
  interactive hierarchy manipulation is not available and was not
  exercised; edits were synthetic `Editable.insert` calls, not OS input.

**iOS — no editing surface.** `supported` is `false` and the leaf renders
the placeholder label on a real simulator. No iOS editor behavior exists
to qualify.

**Schema bound (web).** The Foxtrot `toggleItem` grammar validates, edits
and node moves preserve attributes and descendants, and JSON
serialize/reopen is lossless under ProseMirror — so the model side is not
the constraint. StarterKit correctly rejects the custom nodes.

## Boundaries — what this does not prove

- Handler-level mechanism only: `Editable.insert`, native `undo`, and
  `setHTML`/`getHTML`. No OS keyboard input, hit-testing, or IME.
- No live Tiptap/ProseMirror `EditorView` on either mobile target; the
  Aztec run exercises Aztec's own HTML parser, not the Foxtrot schema.
- Interactive structure editing (Enter to split, Tab to indent) is
  unprobed — the handle has no such commands.
- `<br>` drift on reopen means Aztec HTML is not yet a stable storage
  format for repeated save/load cycles even though the hierarchy itself
  survives.
