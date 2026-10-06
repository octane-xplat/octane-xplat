# iOS editor backing surface

> Choose a native editor for the Tiptap and Lexical leaves without mistaking ordinary rich text for Foxtrot document compatibility.

Decision #101: **provisional**, 2026-10-05. Evidence: upstream source and documentation; a compile/link diagnostic is prepared but was not run in this spike. No iOS app, keyboard, selection, accessibility, or pixel-parity qualification is claimed.

## Recommendation

Use **Lexical iOS** as the first native backing surface to qualify for both `@octane-xplat/tiptap` and `@octane-xplat/lexical` on iOS. Keep its Swift node/editor APIs inside an Objective-C-visible adapter. Share that adapter in the editor leaf layer, with no new dependency in `packages/ui`. The iOS Tiptap entry would be a rich-text facade backed by Lexical iOS, **not a running Tiptap/ProseMirror editor**. Lexical iOS also does not execute JavaScript Lexical plugins.

This is a candidate selection, not a declaration that the iOS entries work. Retain the unsupported state until metadata and native runtime gates pass. Choose Lexical over a new TextKit editor because it already supplies a node tree, editor updates, command dispatch, selection, and history. Its maintenance and accessibility limitations warrant a pinned revision and a bounded qualification effort, not an unconditional architecture commitment.

Keep **WKWebView-hosted Tiptap/ProseMirror and Lexical JS** as separately named, application-selected fallback surfaces. For Foxtrot, hosting its existing ProseMirror engine is the lowest semantic-porting-risk fallback. It is a native host containing a browser editor; it does **not** satisfy the plan's intended native editing surface. Never silently switch to it after a native load error.

Foxtrot owns task nodes, stable IDs/state/custom attributes, split/join/indent/outdent policy, serialization and collaboration. Xplat owns surface lifecycle, commands/events, capability reporting, and preservation within the advertised subset. A native engine with a tree is necessary evidence for Foxtrot, but does not prove its custom editing semantics.

## Starting evidence

- [iOS rich-text entry](../../packages/richtext/src/RichTextEditor.ios.tsrx) exports `supported = false` and renders a label. Both [Tiptap](../../packages/tiptap/src/TiptapEditor.tsrx) and [Lexical](../../packages/lexical/src/LexicalEditor.tsrx) native facades route through that leaf; their JSON bridges convert through HTML. They need an iOS structured adapter, not just a different view beneath that conversion.
- [Coreframe boundary](../../.agents/docs/coreframe-role.md) assigns product engines to the app and reusable leaves to Xplat. [Foxtrot gaps](../../.agents/docs/foxtrot-migration-gaps.md) describe why the current facade cannot carry the task schema.
- The supervisor-supplied *Foxtrot migration: octane-xplat enablement* plan, revised 2026-10-05, reports standalone Aztec/Lexical and Objective-C-consumer compilation, Aztec's linear-model mismatch, and Foundation/UIKit metadata loss. Those are prior reports, not independently reproduced results from this spike.
- The existing desktop WKWebView transport is useful precedent ([decision #82](decisions.md)); it does not qualify mobile input, origin/session behavior, or the Coreframe shell. The plan's Coreframe desktop pattern is similarly a host precedent, not iOS editor evidence.

## Candidate comparison

“Present” below means a source-level mechanism exists. It does not mean Xplat integration or device behavior passed. Maintenance snapshots were checked through upstream GitHub on 2026-10-05.

| Candidate | Custom nodes and hierarchy | Updates and commands | Selection | Undo | Accessibility | License and maintenance | NativeScript fit and conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WKWebView + package's JS engine | ProseMirror schema/attributes and recursive content; Lexical JS custom elements. Existing Foxtrot schema can stay with ProseMirror | Real engine transactions/updates and commands remain in the browser document | Engine selections present; asynchronous host observations and native keyboard/touch fidelity need tests | Engine history present; co-locate history with edits, not host snapshots | DOM semantics and WebKit accessibility; custom controls/list/task announcements still need VoiceOver qualification | Tiptap core/ProseMirror and Lexical are MIT; commercial Tiptap extensions need separate review. WKWebView is an Apple SDK API. Maintained upstream engines | Lowest Foxtrot porting risk, but browser editor. Explicit fallback, not native requirement closure |
| UITextView + custom TextKit 2 rendering | TextKit lays out text/elements; task schema, IDs and structural constraints must be built and maintained by us | NSTextContentManager editing transactions are layout/content edits, not a supplied semantic command engine; app-level transformations and selection mapping are ours | Native UITextInput selection exists; semantic node/range mapping is ours | UIKit UndoManager exists; compound structural edits and selection restoration are ours | Native text accessibility is a foundation; outline semantics/custom renderers are ours | Apple SDK terms; system maintained. Our editor engine would carry long-term ownership | Native, but largest new implementation. Reject as first choice while a fitting reusable tree engine exists |
| **Lexical iOS** | Open ElementNode/DecoratorNode, registered types, Codable child trees and custom drawing. Foxtrot task fields and rules require Swift nodes | Editor.update, prioritized commands, listeners and node transforms. No ProseMirror Step compatibility | RangeSelection/NodeSelection and native TextView reconciliation | EditorHistoryPlugin tracks editor states and undo/redo commands | UITextView foundation; upstream issue #17 says editable lists lack semantic VoiceOver announcements; source sets staticText trait | MIT; upstream says pre-release/no support guarantee, used in Meta apps. Latest main commit `d871c0a`, 2026-09-04 | Swift package core has no dependencies; bridge Swift internals through a small ObjC facade. **Preferred native candidate, subject to gates** |
| Proton | Custom UIView attachments and nested EditorViews; nested views are not proof of a single semantic task tree | EditorCommand and TextProcessor extension points; global structural transaction layer is not established | EditorView selectedRange per nested editor; cross-editor selection needs custom work | UIKit foundation; unified structural history across attachments/editors is unproven | UIKit foundation; nested-content traversal and task semantics unqualified | Apache-2.0; pre-1.0 APIs warn of breakage. Latest main commit `30c0f87`, 2025-04-21 | Swift can be wrapped; greater tree/selection ownership than Lexical. Do not encode editable task hierarchy as opaque attachments |
| Software Mansion enriched-html | Fixed supported HTML tags backed by attributed text; custom tree schema not exposed | Formatting/set-value native commands, not general schema transactions | setSelection and change callbacks present | No native undo/redo facade found in inspected native command API; must qualify/extend rather than assume | Native text/system font scaling; semantic task accessibility unqualified | MIT; active, latest checked main `629120a`, 2026-10-05 | New Architecture/Fabric and generated RN headers are dependencies, not an NS plugin. Extracting iOS internals is a maintained fork. Useful ordinary-rich-text precedent, poor Foxtrot fit |
| Apollo native rich-text editor v2 | Rust core exposes schema content expressions, attributes and PM JSON; native roles constrain behavior; custom atoms are not arbitrary recursive task views | Native document handle, Rust operations and collaboration; extension framework/inline extensions remain roadmap items | Native adapter transports structured selection; offset conventions differ from UIKit UTF-16 | Engine history/undo commands; UITextView undoManager deliberately disabled | Source includes custom accessibility/input paths; device guarantees not established here | Apache-2.0; active development, main `74f3045`, 2026-09-28, package release 2.0.12 | Expo Modules/RN/Fabric wrapper is not NS-compatible. Promising cross-platform challenger if Lexical fails; requires a Rust FFI/native-host extraction probe before adoption |

The RN candidates show useful native techniques, but importing their JS component or compiling a React-dependent pod would not adapt them to NativeScript. Prefer a native engine with an independent entry point. Do not label Apollo “proven Foxtrot support” solely because its README advertises ProseMirror JSON.

## Evidence behind the native choice

The inspected Lexical iOS revision is `d871c0ad2f22e2ba19226fe8187e8f72f1e99ca4`. Its [Package.swift](https://github.com/facebook/lexical-ios/blob/d871c0ad2f22e2ba19226fe8187e8f72f1e99ca4/Package.swift) exports core, history, lists, links and HTML products. Core itself has no dependency; HTML adds SwiftSoup, while Markdown adds a branch-based swift-markdown dependency. The ordinary adapter should start with core/history/list/link and pin dependency resolution rather than inherit moving branches.

Source inspected: [Editor](https://github.com/facebook/lexical-ios/blob/d871c0ad2f22e2ba19226fe8187e8f72f1e99ca4/Lexical/Core/Editor.swift), [ElementNode](https://github.com/facebook/lexical-ios/blob/d871c0ad2f22e2ba19226fe8187e8f72f1e99ca4/Lexical/Core/Nodes/ElementNode.swift), [Node](https://github.com/facebook/lexical-ios/blob/d871c0ad2f22e2ba19226fe8187e8f72f1e99ca4/Lexical/Core/Nodes/Node.swift), [history plugin](https://github.com/facebook/lexical-ios/blob/d871c0ad2f22e2ba19226fe8187e8f72f1e99ca4/Plugins/EditorHistoryPlugin/EditorHistoryPlugin/EditorHistoryPlugin.swift) and [LexicalView](https://github.com/facebook/lexical-ios/blob/d871c0ad2f22e2ba19226fe8187e8f72f1e99ca4/Lexical/LexicalView/LexicalView.swift). ElementNode decoding catches errors and can continue; unknown types fall back to UnknownNode. Custom state must be copied in clone and encoded/decoded explicitly. Runtime-generated node keys are not Foxtrot's durable task IDs.

A strict adapter must validate schema/version/types/attributes before any mutation, then compare semantic save/reopen results. Successful JSON parsing alone is insufficient. Proposed input rejection keeps the previous document intact:

```json
{
  "ok": false,
  "error": "unsupported-node",
  "path": "root.children[0]",
  "type": "toggleItem",
  "documentChanged": false
}
```

[Accessibility issue #17](https://github.com/facebook/lexical-ios/issues/17) is open at inspection. The native adapter must qualify editable traits, focus, selection and list/task announcements; inheriting UITextView is not an accessibility pass. No evidence here establishes a Yjs binding for Lexical iOS or direct reuse of Foxtrot's JS extensions.

## Proposed ordinary rich-text contract

This is the shared **qualification target**, not today's API or support claim. Both packages expose the same meaning within this subset on Web/iOS/Android, while keeping engine-specific JSON formats. It deliberately excludes Foxtrot tasks and collaboration. Existing facade no-ops or permissive conversion do not satisfy it.

The current per-package, per-platform status against this target is recorded
in [Editor capability declarations](editor-capabilities.md).

| Boundary | Required matching behavior |
| --- | --- |
| Document | Paragraphs, hard breaks, headings 1–3, flat ordered/bullet lists; inline text with bold/italic/strikethrough and links. Preserve Unicode, marks, list ordering/start and href. Nested/custom/task nodes, embeds, tables, colors, alignment, code and additional marks are outside the baseline until separately declared and tested |
| Storage | Each package's versioned, restricted structured JSON is canonical. HTML is explicitly limited import/export. Unsupported nodes/attributes/marks fail before mutation; no silent dropping, flattening, or unknown-node substitution |
| Lifecycle | Initial content applied once after readiness; queued content survives host initialization; editable/read-only toggles do not reset content/history. Mount/dispose/remount releases listeners, views and pending requests; disposed handles fail explicitly |
| Controlled updates | Distinguish user edits from external replacement. Echoing the emitted revision does nothing. An intentional replacement validates first, resets undo and selection to a documented valid location, and emits one replacement event. Reject stale revisions. Never replace the whole document for each typed character |
| Editing/history | Native keyboard, IME composition, paste and baseline formatting edit the structured document. Undo/redo restore content and selection; read-only rejects mutation. Programmatic formatting is one history action; document replacement is a new history boundary |
| Focus/selection | Focus/blur events describe actual surface focus. Read and set directed text selections; report active formatting. Translate engine positions to paths into the package JSON plus UTF-16 text offsets; do not expose Aztec, PM and Lexical raw integers as interchangeable offsets |
| Events/results | Ordered ready/change/selection/focus/blur/error events carry origin and revision. Snapshot/commands acknowledge committed state. Capabilities are discoverable before mounting; unsupported requests return a reason |

A baseline Tiptap fixture makes supported meaning concrete; the Lexical fixture must encode the same paragraph and formatting using its own root/children representation. This is data for the proposed contract, not a new component API:

```json
{
  "type": "doc",
  "content": [{
    "type": "paragraph",
    "content": [
      {"type": "text", "text": "Ship ", "marks": [{"type": "bold"}]},
      {"type": "text", "text": "today", "marks": [{"type": "link", "attrs": {"href": "https://example.com"}}]},
      {"type": "hardBreak"},
      {"type": "text", "text": "Check again"}
    ]
  }]
}
```

For native commands and a future WK transport, prefer acknowledged asynchronous operations. Existing synchronous snapshot handles cannot guarantee a fresh WKWebView result; changing that public API needs a separate implementation/reconciliation slice. A proposed capability result names the running engine and prevents consumers inferring JS-extension support:

```json
{
  "platform": "ios",
  "surface": "native-textkit",
  "engine": "lexical-ios",
  "qualification": "unverified",
  "ordinaryRichText": false,
  "customNodes": "native-adapter-only",
  "javascriptExtensions": false,
  "foxtrotTaskTree": false,
  "collaboration": false
}
```

Web continues to run the package's actual engine; ordinary editing must be tested there too. Android currently runs Aztec and has no Foxtrot-tree claim. Qualify the baseline independently on all three targets; if Android cannot preserve any baseline feature, remove that feature from the common contract explicitly or choose another Android surface. Do not advertise the proposed contract as already available. Desktop targets are outside this spike.

## WKWebView fallback boundary and cost

Keep engine state, IME composition, selection, history and any future collaboration provider in the trusted browser document. Bridge explicit commands and versioned snapshots/events, not every keystroke to a host-controlled content replacement. The host pays serialization, scheduling and round-trip latency for toolbar state, autosave and commands. A cached synchronous getter can be stale; saving requires an acknowledged snapshot barrier.

A proposed wire request carries an instance and base revision so reloads and delayed commands cannot edit a newer document accidentally:

```json
{"instance":"editor-7","request":12,"baseRevision":41,"command":"snapshot"}
```

Bundle trusted editor assets locally; validate messages and navigation, reject stale replies, time out pending requests and remove message handlers on disposal. Do not expose arbitrary evaluation or transfer auth credentials into an untrusted document. Coreframe's fixed-origin cookie proxy is a separate contract, not supplied by a WK editor leaf.

Even with browser transactions, iOS composition, autocorrect, dictation, caret scrolling, selection handles, clipboard, hardware shortcuts, keyboard avoidance and VoiceOver remain device gates. Hosting preserves access to the original engine, not guaranteed browser/native input parity. Product copy and capabilities must call it a hosted browser editor.

## Metadata blocker

The supplied plan reports NativeScript metadata generation can exit successfully while dropping Foundation/UIKit declarations under the installed SDK/toolchain. **This blocks qualification of every NativeScript-hosted candidate**, including WKWebView. NativeScript core views themselves rely on those declarations; moving editor code to Swift does not fix a missing UIView/NSObject metadata base.

An ObjC wrapper reduces exposed surface and avoids exporting Swift generic/Codable APIs, but it still needs correct Foundation/UIKit and wrapper metadata. A native standalone compile can pass while the NS app cannot resolve the classes. Require an untouched-toolchain metadata check for NSObject, UIView, UITextView, WKWebView and the adapter class, then instantiate/mount through the actual NativeScript driver. A temporary SDK shim is diagnostic evidence, not a shipping fix. If the direct native host avoids NS entirely it has a different integration contract; that would be a separate design.

## Bounded spike and remaining gates

[Compile diagnostic](evidence/ios-editor-backing/compile.sh), [Swift facade](evidence/ios-editor-backing/SurfaceProbe.swift), [Objective-C consumer](evidence/ios-editor-backing/ObjCConsumer.m) and [execution record](evidence/ios-editor-backing/results.md) are retained for editor-package maintainers to rerun when the engine or Xcode changes. No engine implementation is vendored and no editor package behavior changes here. The diagnostic checks core/history/lists, custom ElementNode API availability, native view exposure and generated-header linking. It does not test custom attributes, JSON roundtrip, input or metadata.

1. Compile/link the pinned engine and bridge; verify real NativeScript metadata and mount with the unmodified supported toolchain. Stop if the required UIKit/wrapper declarations are absent.
2. On an owned iOS device/simulator, prove the baseline matrix: initial content, edits, mark/link/list changes, directed selection, IME, read-only, echo/replacement, undo/redo, save/reopen and mount/dispose/remount. Exercise real OS input; handler dispatch is insufficient. Qualify VoiceOver on a device separately.
3. Only then add a Foxtrot-owned three-level task fixture with ID/state/custom fields/marks. Assert load→edit→save→reopen semantic equality and split/join/indent/outdent, caret movement, clipboard and undo/redo. Persist task IDs independently of Lexical keys. Unknown data must be rejected without changing the document.
4. If native task semantics or accessibility cannot be made reliable within the agreed implementation budget, report the failed gate and choose the explicit ProseMirror WK fallback, or probe Apollo's independent Rust/native seam. Do not conceal failure with attachment rendering or HTML normalization. Collaboration starts after local fidelity passes.

## Risks and stop conditions

- **Toolchain:** metadata loss can block all NS surfaces. A standalone Swift build cannot retire this risk.
- **Native accessibility:** known list-announcement gap; fix/qualify before claiming the baseline or task support.
- **Pre-release engine:** pin source/dependencies, retain MIT notices, and budget upstream fixes. Recent commits do not constitute a support commitment.
- **Serialization:** decoder recovery and UnknownNode fallback can conceal loss. Strict validation and semantic equality checks must sit above the decoder.
- **Task semantics:** clone, split and join must preserve domain IDs/state deliberately; indentation styling alone is not hierarchy. No native Foxtrot compatibility is established.
- **Facade mismatch:** native Tiptap uses a different engine; unsupported JS extensions/React/DOM views must fail visibly. Exact JSON/selection conversion requires tests, not permissive HTML bridges.
- **Input and lifecycle:** UIKit/TextKit mechanisms reduce implementation work but do not establish correct IME, autocorrect, clipboard, focus, teardown or history boundaries.
- **Hosted fallback:** bridge latency, process termination/reload, stale state, security/origin boundary and WebKit interaction fidelity; retain recoverable structured snapshots outside the page.
- **Cross-platform:** iOS candidate selection does not solve Aztec's Android hierarchy mismatch or supply native collaboration.

## Other primary sources

- [ProseMirror guide](https://prosemirror.net/docs/guide/) and [reference](https://prosemirror.net/docs/ref/); [Tiptap license](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md); [Lexical JS](https://github.com/facebook/lexical).
- Apple [UITextView](https://developer.apple.com/documentation/uikit/uitextview), [TextKit](https://developer.apple.com/documentation/uikit/textkit), and [WKWebView](https://developer.apple.com/documentation/webkit/wkwebview).
- [Lexical iOS README/status/license](https://github.com/facebook/lexical-ios), including its explicit pre-release warning.
- [Proton README](https://github.com/rajdeep/proton), [license](https://github.com/rajdeep/proton/blob/main/LICENSE), [EditorCommand](https://github.com/rajdeep/proton/tree/main/Proton/Sources).
- [Enriched HTML concepts](https://docs.swmansion.com/react-native-enriched-html/fundamentals/core-concepts), [API](https://docs.swmansion.com/react-native-enriched-html/api-reference/enriched-text-input), [RN-dependent package](https://github.com/software-mansion/react-native-enriched-html/blob/main/Package.swift).
- [Apollo editor](https://github.com/apollohg/react-native-rich-text-editor), [schema roles and attributes](https://github.com/apollohg/react-native-rich-text-editor/blob/main/src/schemaDefinition.ts), [native input/history boundary](https://github.com/apollohg/react-native-rich-text-editor/blob/main/ios/EditorTextView.swift).

Coverage: design/qualification target only. No public workflow, API, recipe, or maintained example changed; no recipe criterion is closed by this record. Verification is separate from coverage and recorded in Silo. No visual analysis was performed.
