# Editor capability declarations

> Compare each editor package and target against the ordinary rich-text contract before relying on cross-platform behavior.

These declarations describe the implementations on 2026-10-06 against the
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
The tables record actual behavior, including known silent no-ops, rather than
promising an error response that the current handles do not provide.

## Web

Tiptap mounts the web Tiptap editor with StarterKit and optional web
extensions ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)).
Lexical mounts LexicalComposer with its built-in nodes and plugins, plus
optional web nodes and plugins
([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). The web runtime
record below is a ProseMirror model probe, not a mounted Tiptap or Lexical UI.

| Contract row | Tiptap | Lexical |
| --- | --- | --- |
| Document | **Partial** — StarterKit supplies the baseline schema, but the 10/10 runtime probe exercised the ProseMirror model directly, not the Tiptap component or browser input ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx), [runtime scope](../verify/nested-tree-editor.md#what-ran), [raw results](../evidence/nested-tree-editor-model-web-2026-10-06.json)). | **Partial** — the source registers the baseline paragraph, heading, list, and link nodes; the available web runtime probe did not run Lexical ([source](../../packages/lexical/src/LexicalEditor.web.tsrx), [runtime scope](../verify/nested-tree-editor.md#what-ran)). |
| Storage | **Partial** — HTML and Tiptap JSON getters/setters exist; the model probe reopened its custom document, but the facade does not expose decision #101's versioned restricted format or strict pre-mutation validation ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx), [runtime results](../evidence/nested-tree-editor-model-web-2026-10-06.json)). | **Partial** — HTML and Lexical serialized state getters/setters exist, but this run did not qualify Lexical serialization or strict versioned validation ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Lifecycle | **Partial** — source wires editor creation, readiness, refs, and prop updates; mount/dispose/remount behavior has no linked web runtime qualification ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)). | **Partial** — source wires composer creation, readiness, refs, and prop updates; mount/dispose/remount behavior has no linked web runtime qualification ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Controlled updates | **Partial** — source suppresses echoed HTML/JSON and applies external replacements, but there are no revisions, stale-request checks, or qualified replacement history/selection semantics ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)). | **Partial** — source suppresses echoed HTML/JSON and applies external replacements, but there are no revisions, stale-request checks, or qualified replacement history/selection semantics ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Editing and history | **Partial** — source exposes engine history and edit commands; the model run proves bounded schema transactions only, not browser keyboard, IME, paste, or selection-restoring undo ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx), [runtime limits](../verify/nested-tree-editor.md)). | **Partial** — source installs the Lexical editor and history path; no Lexical web runtime evidence qualifies browser input, IME, paste, or selection-restoring undo ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Focus and selection | **Partial** — callbacks expose ProseMirror selection positions, but the contract's JSON paths, UTF-16 offsets, and directed selection get/set are not exposed or qualified ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)). | **Partial** — callbacks use best-effort flat text offsets that omit block separators; directed selection get/set and JSON-path positions are not exposed ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Events and results | **Partial** — readiness, change, selection, focus, and blur callbacks exist, but events have no origin/revision, commands have no committed-state acknowledgement, and capabilities are not discoverable by row ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)). | **Partial** — readiness, change, selection, focus, and blur callbacks exist, but events have no origin/revision, commands have no committed-state acknowledgement, and capabilities are not discoverable by row ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |
| Unsupported request today | Unsupported `apply(format)` values without a command mapping return without running; there is no shared error result ([source](../../packages/tiptap/src/TiptapEditor.web.tsrx)). | Unhandled `apply(format)` values fall through without an error; dispatch results for commands without a handler are not surfaced as capability errors ([source](../../packages/lexical/src/LexicalEditor.web.tsrx)). |

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
editing probe. The newer [nested-tree runtime report](../verify/nested-tree-editor.md)
and [raw Android results](../evidence/nested-tree-editor-android-2026-10-06.json)
exercise Aztec HTML directly; they do not exercise either package's JSON
facade.

| Contract row | Tiptap | Lexical |
| --- | --- | --- |
| Document | **Partial** — ordinary text input reached Aztec in the earlier runtime run. The leaf-only nested-tree run preserved wrappers, attributes, and order, but flattened paragraphs to `<br>` and accumulated `<br>` on reopen; it did not test the Tiptap JSON facade ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [nested-tree runtime](../evidence/nested-tree-editor-android-2026-10-06.json)). | **Partial** — the same Aztec runtime evidence applies to the editing leaf, not Lexical JSON semantics. Nested wrapper preservation does not qualify Lexical nodes or stable paragraph round-trips ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [nested-tree limits](../verify/nested-tree-editor.md#findings)). |
| Storage | **Partial** — Tiptap JSON↔HTML bridge conversion has native probe evidence, but Android treats HTML as canonical and JSON as best-effort; Aztec HTML also drifts on reopen, and the bridge is not a versioned restricted canonical format ([source](../../packages/tiptap/src/TiptapEditor.tsrx), [decision ledger](decisions.md), [nested-tree runtime](../evidence/nested-tree-editor-android-2026-10-06.json)). | **Partial** — Lexical serialized-state↔HTML conversion has native probe evidence, but Android treats HTML as canonical and JSON as best-effort through a fixed node set; this does not validate a versioned canonical format ([source](../../packages/lexical/src/LexicalEditor.tsrx), [decision ledger](decisions.md)). |
| Lifecycle | **Partial** — runtime evidence covers initial mount/readiness, but not component disposal/remount; the handler-level tree reopen is not a remount test ([source](../../packages/tiptap/src/TiptapEditor.tsrx), [ordinary runtime](../app/rich-text.md#baseline-verification-status), [probe report](../verify/nested-tree-editor.md)). | **Partial** — runtime evidence covers the shared leaf's initial mount/readiness, but not component disposal/remount or pending-request teardown ([source](../../packages/lexical/src/LexicalEditor.tsrx), [ordinary runtime](../app/rich-text.md#baseline-verification-status)). |
| Controlled updates | **Partial** — an earlier handler-dispatched replacement and echo suppression passed, but the facade has no revisions, stale-update rejection, or qualified selection/history reset semantics ([source](../../packages/tiptap/src/TiptapEditor.tsrx), [ordinary runtime](../app/rich-text.md#baseline-verification-status)). | **Partial** — native JSON replacement and duplicate suppression have bridge/fake-host coverage; this is not an Aztec OS-input test and does not supply revisions or stale-update rejection ([source](../../packages/lexical/src/LexicalEditor.tsrx), [ordinary runtime](../app/rich-text.md#baseline-verification-status)). |
| Editing and history | **Partial** — ADB keyboard text and keyboard undo passed in the earlier run. The nested-tree edits were synthetic; programmatic Aztec edits and `setHTML` are outside the exposed undo history, and IME/paste are unqualified ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [nested-tree report](../verify/nested-tree-editor.md), [leaf source](../../packages/richtext/src/RichTextEditor.android.tsrx)). | **Partial** — the same runtime evidence qualifies only Aztec keyboard editing and its keyboard history. Lexical plugins, transforms, and command history do not run on Android ([facade source](../../packages/lexical/src/LexicalEditor.tsrx), [ordinary runtime](../app/rich-text.md#baseline-verification-status)). |
| Focus and selection | **Partial** — ADB input produced focus and selection callbacks, but blur was not observed in the earlier run; the facade exposes no directed selection setter or JSON-path mapping ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [leaf source](../../packages/richtext/src/RichTextEditor.android.tsrx)). | **Partial** — the shared leaf has the same focus/selection evidence and limits; Lexical does not translate Aztec offsets into Lexical node paths ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [facade source](../../packages/lexical/src/LexicalEditor.tsrx)). |
| Events and results | **Partial** — `onReady`, `onChange`, focus, and selection passed in the earlier runtime run; blur did not complete, and events carry no origin/revision or command acknowledgement ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [facade source](../../packages/tiptap/src/TiptapEditor.tsrx)). | **Partial** — the shared leaf has the same event coverage; JSON readiness is reported separately, with no common unsupported-request error or committed-state acknowledgement ([ordinary runtime](../app/rich-text.md#baseline-verification-status), [facade source](../../packages/lexical/src/LexicalEditor.tsrx)). |
| Unsupported request today | `apply('link')` returns without action in the Aztec leaf. A failed/unavailable JSON bridge can report `onJSONReady(false)` or leave conversion unavailable; there is no general error event ([leaf source](../../packages/richtext/src/RichTextEditor.android.tsrx), [facade source](../../packages/tiptap/src/TiptapEditor.tsrx)). | `apply('link')` returns without action in the same leaf. A failed JSON conversion may produce no document update; there is no general error event ([leaf source](../../packages/richtext/src/RichTextEditor.android.tsrx), [facade source](../../packages/lexical/src/LexicalEditor.tsrx)). |

The Android nested-tree run is narrower than full recursive-document support:
it used Aztec `Editable.insert`, not OS input, and did not test split, merge,
indent, or outdent commands. The hierarchy survives that HTML path, but the
paragraph and repeated-reopen drift make it unsafe to claim stable structured
storage. See the [full runtime scope](../verify/nested-tree-editor.md).

## iOS

Neither package mounts an iOS editing engine. Both route through the leaf's
`supported = false` entry, which renders a visible placeholder. Their
headless JSON conversion modules may still load, but conversion readiness is
not editor readiness ([Tiptap facade](../../packages/tiptap/src/TiptapEditor.tsrx),
[Lexical facade](../../packages/lexical/src/LexicalEditor.tsrx),
[iOS leaf](../../packages/richtext/src/RichTextEditor.ios.tsrx)). A real
simulator run passed 2/2 assertions for the unsupported flag and placeholder;
it did not exercise editing ([runtime results](../evidence/nested-tree-editor-ios-2026-10-06.json),
[verification report](../verify/nested-tree-editor.md)).

| Contract row | Tiptap | Lexical |
| --- | --- | --- |
| Document | **Unsupported** — no iOS document editor ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). | **Unsupported** — no iOS document editor ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). |
| Storage | **Unsupported** — no editable document store; the Tiptap JSON converter may run without an editor ([facade source](../../packages/tiptap/src/TiptapEditor.tsrx), [decision ledger](decisions.md), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). | **Unsupported** — no editable document store; the Lexical JSON converter may run without an editor ([facade source](../../packages/lexical/src/LexicalEditor.tsrx), [decision ledger](decisions.md), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). |
| Lifecycle | **Unsupported** — only the placeholder mounts; there is no editor readiness or handle lifecycle. JSON bridge readiness is separate ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). | **Unsupported** — only the placeholder mounts; there is no editor readiness or handle lifecycle. JSON bridge readiness is separate ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). |
| Controlled updates | **Unsupported** — no editor receives `value` or `json` updates ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). | **Unsupported** — no editor receives `value` or `json` updates ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). |
| Editing and history | **Unsupported** — no editing engine or history ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). | **Unsupported** — no editing engine or history ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). |
| Focus and selection | **Unsupported** — no editable surface to focus or select ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). | **Unsupported** — no editable surface to focus or select ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). |
| Events and results | **Unsupported** — the placeholder reports no editor events or capability error result ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). | **Unsupported** — the placeholder reports no editor events or capability error result ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). |
| Unsupported request today | The package reports `supported = false` and renders the placeholder; there is no editor error result or editor `onReady` callback. `onJSONReady` may separately report conversion-module readiness ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [facade source](../../packages/tiptap/src/TiptapEditor.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). | The package reports `supported = false` and renders the placeholder; there is no editor error result or editor `onReady` callback. `onJSONReady` may separately report conversion-module readiness ([source](../../packages/richtext/src/RichTextEditor.ios.tsrx), [facade source](../../packages/lexical/src/LexicalEditor.tsrx), [runtime](../evidence/nested-tree-editor-ios-2026-10-06.json)). |

## Updating these declarations

Change a row to **Supported** only after a target runtime run covers every
requirement in that row. Keep source/build evidence separate from device or
browser behavior, and record unsupported requests with their actual result.
The qualification target remains in decision #101; this page records today's
implementation status and does not change that contract.
