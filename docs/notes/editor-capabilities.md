# Editor capability declarations

> Compare each editor package and target against the ordinary rich-text contract before relying on cross-platform behavior.

These declarations describe the implementations audited on 2026-10-08 against the
[ordinary rich-text contract in decision #101](ios-editor-backing-surface.md#proposed-ordinary-rich-text-contract).
That contract is a qualification target. A method in a type or a successful
package build does not, by itself, qualify the matching behavior at runtime.

**Supported** means runtime evidence covers the full contract row. **Partial**
means a mechanism exists or a narrower behavior passed, while at least one
required guarantee is missing or unverified. **Unsupported** means the target
has no editing surface for that row. Each cell labels its evidence as source
or runtime; runtime links state what the run did and did not exercise. No row
below is fully supported against the whole contract today.

Decision #101 requires unsupported requests to fail with a reason before they
change the document. That behavior is **not implemented uniformly today**.
Web and mobile `apply` now reject unsupported formats with `RangeError`;
links require `linkTo`. AppKit reports asynchronous engine errors through its
transport. Other gaps, including versioned storage and command acknowledgements,
remain explicit below.

## Web

Tiptap mounts the web Tiptap editor with StarterKit and optional web
extensions ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)).
Lexical mounts LexicalComposer with its built-in nodes and plugins, plus
optional web nodes and plugins
([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). The earlier web record below is a ProseMirror model probe. A newer
2026-10-08 Chromium facade smoke passed 22 assertions across both mounted
editors: HTML/JSON interchange, controlled JSON precedence, rejected link apply,
focus/blur, and remount. It used handle calls rather than keyboard/IME/paste
and does not qualify the complete contract rows. Run: `2f069287-1798-4450-8aef-973232fd6d25`. The maintained Lexical
Chromium smoke also passed keyboard edits, history, controlled updates,
read-only behavior, custom-node serialization, focus/blur, and remount.
IME, paste, and selection-restoring undo remain unqualified.

| Contract row | Tiptap | Lexical |
| --- | --- | --- |
| Document | **Partial** — StarterKit supplies the baseline schema, but the 10/10 runtime probe exercised the ProseMirror model directly, not the Tiptap component or browser input ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx), runtime scope (internal parity report), raw results (internal parity report)). | **Partial** — the source registers the baseline paragraph, heading, list, and link nodes; the facade smoke exercises mounted Lexical, but not the complete document contract ([source](../../packages/lexical/src/LexicalEditor.web.tsrx), runtime scope (internal parity report)). |
| Storage | **Partial** — HTML and Tiptap JSON getters/setters exist; the model probe reopened its custom document, but the facade does not expose decision #101's versioned restricted format or strict pre-mutation validation ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx), runtime results (internal parity report)). | **Partial** — HTML and Lexical serialized state getters/setters exist, but the mounted facade and custom-node smoke exercise serialization, but do not qualify strict versioned validation ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Lifecycle | **Partial** — source wires editor creation, readiness, refs, and prop updates; the facade smoke covers mount/remount, but not every contract lifecycle guarantee ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)). | **Partial** — source wires composer creation, readiness, refs, and prop updates; the facade smoke covers mount/remount, but not every contract lifecycle guarantee ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Controlled updates | **Partial** — source suppresses echoed HTML/JSON and applies external replacements, but there are no revisions, stale-request checks, or qualified replacement history/selection semantics ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)). | **Partial** — source suppresses echoed HTML/JSON and applies external replacements, but there are no revisions, stale-request checks, or qualified replacement history/selection semantics ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Editing and history | **Partial** — source exposes engine history and edit commands; the model run proves bounded schema transactions only, not browser keyboard, IME, paste, or selection-restoring undo ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx), runtime limits (internal parity report)). | **Partial** — source installs the Lexical editor and history path; Chromium smoke qualifies keyboard editing and undo/redo, but not IME, paste, or selection-restoring undo ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Focus and selection | **Partial** — callbacks expose ProseMirror selection positions, but the contract's JSON paths, UTF-16 offsets, and directed selection get/set are not exposed or qualified ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)). | **Partial** — callbacks use best-effort flat text offsets that omit block separators; directed selection get/set and JSON-path positions are not exposed ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Events and results | **Partial** — readiness, change, selection, focus, and blur callbacks exist, but events have no origin/revision, commands have no committed-state acknowledgement, and capabilities are not discoverable by row ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)). | **Partial** — readiness, change, selection, focus, and blur callbacks exist, but events have no origin/revision, commands have no committed-state acknowledgement, and capabilities are not discoverable by row ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Unsupported request today | Unsupported `apply(format)` values without a command mapping throw `RangeError` before running; use `linkTo` for links ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)). | Unhandled `apply(format)` values throw `RangeError`; horizontal-rule commands without a handler are rejected. Other plugin dispatch results still lack committed-state acknowledgements ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |

## Android

Both facades edit through the Aztec leaf, not a live Tiptap/ProseMirror or
Lexical editor. Tiptap uses a DOM-free Tiptap JSON/HTML bridge
([facade source](../../packages/tiptap/src/TiptapEditor.tsrx)); Lexical uses
Aztec for editing and a headless Lexical editor only for serialized-state
conversion ([facade source](../../packages/lexical/src/LexicalEditor.tsrx)).
The [native leaf source](../../packages/richtext/src/RichTextEditor.android.tsrx)
shows the editing methods and callbacks. The earlier
[Android baseline run](../app/rich-text.md#baseline-verification-status)
records ADB text input, focus, selection, undo, and the limits of the ordinary
editing probe. The newer nested-tree runtime report (internal parity report)
and raw Android results (internal parity report)
exercise Aztec HTML directly; they do not exercise either package's JSON
facade. The 2026-10-08 combined facade smoke passed 22 handle-call
assertions on Android (run `b4241241-0e2e-4539-8485-8fbf97a889e9`), including
JSON readback after inline Aztec HTML normalization, controlled precedence,
HTML replacement, focus/blur, and remount. It did not exercise OS input.

| Contract row | Tiptap | Lexical |
| --- | --- | --- |
| Document | **Partial** — ordinary text input reached Aztec in the earlier runtime run. The leaf-only nested-tree run preserved wrappers, attributes, and order, but flattened paragraphs to `<br>` and accumulated `<br>` on reopen; it did not test the Tiptap JSON facade ([ordinary runtime](../app/rich-text.md#baseline-verification-status), nested-tree runtime (internal parity report)). | **Partial** — the same Aztec runtime evidence applies to the editing leaf, not Lexical JSON semantics. Nested wrapper preservation does not qualify Lexical nodes or stable paragraph round-trips ([ordinary runtime](../app/rich-text.md#baseline-verification-status), nested-tree limits (internal parity report)). |
| Storage | **Partial** — Tiptap JSON↔HTML bridge conversion has native probe evidence, but Android treats HTML as canonical and JSON as best-effort; Aztec HTML also drifts on reopen, and the bridge is not a versioned restricted canonical format ([source](../../packages/tiptap/src/TiptapEditor.tsrx), [decision ledger](decisions.md), nested-tree runtime (internal parity report)). | **Partial** — Lexical serialized-state↔HTML conversion has native probe evidence, but Android treats HTML as canonical and JSON as best-effort through a fixed node set; this does not validate a versioned canonical format ([source](../../packages/lexical/src/LexicalEditor.tsrx), [decision ledger](decisions.md)). |
| Lifecycle | **Partial** — the combined facade smoke covers mount/readiness/remount, but not every disposal or pending-request guarantee ([source](../../packages/tiptap/src/TiptapEditor.tsrx), [ordinary runtime](../app/rich-text.md#baseline-verification-status), probe report (internal parity report)). | **Partial** — the combined facade smoke covers mount/readiness/remount; pending-request teardown has fake-host coverage rather than OS-input evidence ([source](../../packages/lexical/src/LexicalEditor.tsrx), [ordinary runtime](../app/rich-text.md#baseline-verification-status)). |
| Controlled updates | **Partial** — an earlier handler-dispatched replacement and echo suppression passed, but the facade has no revisions, stale-update rejection, or qualified selection/history reset semantics ([source](../../packages/tiptap/src/TiptapEditor.tsrx), [ordinary runtime](../app/rich-text.md#baseline-verification-status)). | **Partial** — native JSON replacement and duplicate suppression have bridge/fake-host coverage; this is not an Aztec OS-input test and does not supply revisions or stale-update rejection ([source](../../packages/lexical/src/LexicalEditor.tsrx), [ordinary runtime](../app/rich-text.md#baseline-verification-status)). |
| Editing and history | **Partial** — ADB keyboard text and keyboard undo passed in the earlier run. The nested-tree edits were synthetic; programmatic Aztec edits and `setHTML` are outside the exposed undo history, and IME/paste are unqualified ([ordinary runtime](../app/rich-text.md#baseline-verification-status), nested-tree report (internal parity report), [leaf source](../../packages/richtext/src/RichTextEditor.android.tsrx)). | **Partial** — the same runtime evidence qualifies only Aztec keyboard editing and its keyboard history. Lexical plugins, transforms, and command history do not run on Android ([facade source](../../packages/lexical/src/LexicalEditor.tsrx), [ordinary runtime](../app/rich-text.md#baseline-verification-status)). |
| Focus and selection | **Partial** — ADB input produced focus and selection callbacks, but blur was not observed in the earlier run; the facade exposes no directed selection setter or JSON-path mapping ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [leaf source](../../packages/richtext/src/RichTextEditor.android.tsrx)). | **Partial** — the shared leaf has the same focus/selection evidence and limits; Lexical does not translate Aztec offsets into Lexical node paths ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [facade source](../../packages/lexical/src/LexicalEditor.tsrx)). |
| Events and results | **Partial** — `onReady`, `onChange`, focus, and selection passed in the earlier runtime run; blur did not complete, and events carry no origin/revision or command acknowledgement ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [facade source](../../packages/tiptap/src/TiptapEditor.tsrx)). | **Partial** — the shared leaf has the same event coverage; JSON readiness is reported separately, with no common unsupported-request error or committed-state acknowledgement ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [facade source](../../packages/lexical/src/LexicalEditor.tsrx)). |
| Unsupported request today | `apply('link')` throws `RangeError` in the Aztec leaf; use `linkTo`. A failed/unavailable JSON bridge can report `onJSONReady(false)` or leave conversion unavailable; there is no general error event ([leaf source](../../packages/richtext/src/RichTextEditor.android.tsrx), [facade source](../../packages/tiptap/src/TiptapEditor.tsrx)). | `apply('link')` throws `RangeError` in the same leaf; use `linkTo`. A failed JSON conversion may produce no document update; there is no general error event ([leaf source](../../packages/richtext/src/RichTextEditor.android.tsrx), [facade source](../../packages/lexical/src/LexicalEditor.tsrx)). |

The Android nested-tree run is narrower than full recursive-document support:
it used handle commands and `Editable.insert` — not OS input. The follow-up
structural run proved `split`/`join`/`indent`/`outdent` on Aztec's own block
model (a real nested `<ul>` demote/promote and item split/merge on device),
while `indent`/`outdent` correctly refuse inside `toggle-item` divs, which
Aztec stores as opaque hidden-block markup — Foxtrot node demote/promote is
not implementable through this surface. The hierarchy survives the HTML path,
but the global `<p>`→`<br>` flattening and repeated-reopen `<br>` drift make
it unsafe to claim stable structured storage. See the
full runtime scope (internal parity report).

## iOS

The leaf now mounts AztecEditor-iOS (`Aztec.TextView`) through the
`XplatAztecEditorView` Swift facade in
[`platforms/ios/src`](../../packages/richtext/platforms/ios/src/XplatAztecEditor.swift),
wired as a pinned-revision Swift Package via the leaf's plugin-level
[`nativescript.config.ts`](../../packages/richtext/nativescript.config.ts)
([iOS leaf](../../packages/richtext/src/RichTextEditor.ios.tsrx)). A 2026-10-06
simulator probe (iPhone 17e, iOS 27.0, `research/aztec-ios` case, run
`e21e9b48-7df5-4bb3-98c4-cdcd84509067`) passed 14/14 assertions: the leaf
mounts the facade view, `onReady` fires, `getHTML`/`setHTML` round-trip,
`focus`/`blur` reach first responder, and unsupported formats report false.
That run exercised handle calls only — no OS input, IME, paste, toolbar
round-trip, or VoiceOver — so every row below stays **Partial** and mostly
source-marked. `taskList` and the `align*` formats are honestly
unavailable: `apply` throws `RangeError` before mutation, `isActive` returns
`false`.

Both facades route through this leaf ([Tiptap facade](../../packages/tiptap/src/TiptapEditor.tsrx),
[Lexical facade](../../packages/lexical/src/LexicalEditor.tsrx)). Their
headless JSON conversion modules plus the leaf's HTML interchange carry the
same caveats as on Android. Ordinary native coverage here uses Aztec;
decision #101's structured storage and engine-specific hosted work remain
unqualified.

| Contract row | Tiptap | Lexical |
| --- | --- | --- |
| Document | **Partial** — the Aztec surface parses and edits paragraphs, headings, lists, links, marks, sub/superscript; task nodes, alignment, and unknown markup are outside it. The probe verified HTML load/serialize round-trip on simulator; no editing input run yet ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [facade](../../packages/richtext/platforms/ios/src/XplatAztecEditor.swift)). | **Partial** — same leaf evidence; the Lexical serialized-state bridge converts through HTML, unverified on iOS ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). |
| Storage | **Partial** — HTML is canonical via `getHTML`/`setHTML`; JSON rides the facade's bridge. No versioned restricted format or pre-mutation validation ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). | **Partial** — same leaf evidence ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). |
| Lifecycle | **Partial** — initial mount, readiness, and handle binding are probe-verified on simulator; editable toggles and callback teardown exist in source but dispose/remount is unverified ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). | **Partial** — same leaf evidence ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). |
| Controlled updates | **Partial** — echo suppression and external `value` replacement exist in source; no revisions or stale-request checks ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). | **Partial** — same leaf evidence ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). |
| Editing and history | **Partial** — format toggles, structural commands, and `undoManager`-backed undo exist in source; keyboard, IME, paste, and history coverage are unqualified on iOS ([facade](../../packages/richtext/platforms/ios/src/XplatAztecEditor.swift)). | **Partial** — same leaf evidence ([facade](../../packages/richtext/platforms/ios/src/XplatAztecEditor.swift)). |
| Focus and selection | **Partial** — `focus()`/`blur()` reaching first responder is probe-verified on simulator; selection callbacks are wired in source over UITextViewDelegate; no directed selection setter or JSON-path positions ([facade](../../packages/richtext/platforms/ios/src/XplatAztecEditor.swift)). | **Partial** — same leaf evidence ([facade](../../packages/richtext/platforms/ios/src/XplatAztecEditor.swift)). |
| Events and results | **Partial** — ready/change/selection/focus/blur callbacks exist in source; events carry no origin/revision and commands have no committed-state acknowledgement ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). | **Partial** — same leaf evidence ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). |
| Unsupported request today | `apply('taskList'|'alignLeft'|'alignCenter'|'alignRight')` throws `RangeError` before mutation; `isActive` returns `false` for them; `apply('link')` also throws — use `linkTo` ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). | Same as Tiptap ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx)). |

## Updating these declarations

Change a row to **Supported** only after a target runtime run covers every
requirement in that row. Keep source/build evidence separate from device or
browser behavior, and record unsupported requests with their actual result.
The 2026-10-08 iOS facade smoke passed 30 handle-call assertions across both
packages (run `618c9446-004a-4c97-b524-045a5850fa6f`): mount, bridge readiness,
HTML/JSON, controlled JSON precedence, explicit format rejection, focus/blur,
and remount. The real-bridge host regression also covers Lexical conversion
after Tiptap initializes its parser. Keyboard input, IME, paste, history,
and accessibility remain unqualified by this run.

The qualification target remains in decision #101; this page records today's
implementation status and does not change that contract.
