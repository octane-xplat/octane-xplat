# Nested-tree editor device evidence

Runtime evidence for the Foxtrot recursive-document question: does the
current native editor surface preserve a nested task-item hierarchy —
task attributes, paragraph text, and child order — through load, edit,
undo, save, and reopen?

Evidence type: `lab-experiment`. Initial run 2026-10-05/06 (UTC) on macOS
arm64, worktree on `main` at `abef0329`. The structural-commands re-run on
2026-10-06 used the same case extended with real `split`/`join`/`indent`/
`outdent` calls, from a worktree at `a63a62f7`.

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
| Android (structural commands) | same AVD (`emulator-5556`) | PASS — 65/65 assertions | `748eec34-112a-4084-ad4d-20e0424b6816` |
| iOS | iPhone 17e simulator, iOS 27.0 (`CF4A9D5B-C905-4EB3-A3CE-EB6BAF30FC4B`) | PASS — 2/2 assertions (unsupported boundary) | `49021805-1f18-42d5-b862-459a9a7ae5f7` |
| Web (schema bound) | Chromium host | PASS — 10/10 assertions | `9ae31b5c-ef34-448c-a2c5-53de8092a265` |

Raw runner output: `docs/evidence/nested-tree-editor-android-2026-10-06.json`,
`docs/evidence/nested-tree-editor-android-structural-2026-10-06.json`,
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
- `<p>` flattening is global, not div-scoped: a top-level
  `<p>one</p><p>two</p>` load serializes back as `one<br><br>two`.
  Paragraph elements are not a storable boundary through this facade at
  all — fixing that requires an Aztec parser/plugin change upstream, not
  a leaf-level adjustment.

**Android — structural commands are now real on Aztec's own block model,
but toggle-item nodes stay opaque.** The extended run exercised
`split`/`join`/`indent`/`outdent`/`canIndent`/`canOutdent` through the
handle — real commands, not synthetic inserts:

- On a native `<ul>`: `indent()` demoted `Beta` under `Alpha` into a
  nested `<ul>` (`<li>Alpha<ul><li>Beta</li></ul></li>`), `outdent()`
  promoted it back to a flat sibling, `split()` mid-item produced
  sibling `<li>Be</li><li>ta</li>`, and `join()` at the new item's start
  merged them back. All are real Aztec `BlockFormatter`/`ListFormatter`
  operations over the selection.
- Inside the `data-type="toggle-item"` divs: `split()` inserts a line
  break (serializes as `Grandchild<br><br> 🚀`) and `join()` merges it
  back — line-level edits inside the hidden block, not new sibling
  nodes. `canIndent`/`canOutdent` return `false` there and
  `indent()`/`outdent()` refuse: Aztec's hidden-block markup has no
  demotable structure, so Foxtrot tree demote/promote on
  `toggle-item` divs cannot be implemented through this surface — the
  commands honestly report unavailability instead of mutating.
- `indent`/`outdent` route through `AztecText.indent()/outdent()`, whose
  upstream source wraps the mutation in `history.beforeTextChanged`
  (desk-source — undo of these commands was not exercised on device).
  `split`/`join` drive `Editable` newline insert/delete and stay outside
  undo batching — same boundary as the synthetic inserts above.

**iOS — no editing surface.** `supported` is `false` and the leaf renders
the placeholder label on a real simulator. No iOS editor behavior exists
to qualify.

**Schema bound (web).** The Foxtrot `toggleItem` grammar validates, edits
and node moves preserve attributes and descendants, and JSON
serialize/reopen is lossless under ProseMirror — so the model side is not
the constraint. StarterKit correctly rejects the custom nodes.

## Boundaries — what this does not prove

- Handler-level mechanism only: `Editable.insert`/delete,
  `AztecText.indent()/outdent()`, native `undo`, and
  `setHTML`/`getHTML`. No OS keyboard input, hit-testing, or IME — real
  Enter/Tab key handling is unverified.
- No live Tiptap/ProseMirror `EditorView` on either mobile target; the
  Aztec run exercises Aztec's own HTML parser, not the Foxtrot schema.
- The structural commands act on Aztec's block model (paragraphs,
  headings, quotes, lists). They do not reshape the Foxtrot
  `toggle-item` hierarchy — those divs are hidden-HTML spans Aztec
  serializes verbatim, so node-level demote/promote still needs a
  document-level transform the leaf does not provide.
- `<br>` drift on reopen means Aztec HTML is not yet a stable storage
  format for repeated save/load cycles even though the hierarchy itself
  survives.
