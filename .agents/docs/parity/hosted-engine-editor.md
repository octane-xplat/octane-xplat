# Evaluate a hosted document engine

A hosted editor keeps an app's document engine inside the platform WebView.
Use this approach when document-schema operations matter more than the native
text adapter's block model; compare the [native recursive-document boundary](nested-tree-editor.md).

## Evidence boundaries

Qualify engine mount, lossless schema round-trip, structural commands, undo/redo,
and editable state independently from the native-to-page bridge. Test each
message direction on each target: successful JavaScript evaluation does not
prove page-to-native delivery or presenter lifetime.

The earlier iOS probe's JavaScript-defined message-handler subclass failed
native dispatch. That result belongs to its eval/probe context; it does not
establish a limitation of every compiled bridge. A compiled facade needs its own
qualification rather than inheriting a probe's failure or apparent success.

Handler-level engine transactions do not qualify OS typing, IME, selection
handles, paste, scrolling, accessibility, collaboration, origin/session handling,
or memory/latency budgets. Use the maintained rich-text guidance and current
package APIs for application code rather than old diagnostic commands.

## Find local evidence

The historical ProseMirror-hosting report and raw target outputs are indexed in
`local_artifacts`. Use [operational evidence lookup](../exploration.md#operational-evidence)
for exact revisions, engines, and file hashes; keep run totals out of this guide.
