# Evaluate native recursive-document editing

Use this boundary when choosing an editor for an app-owned recursive schema.
HTML round-trip preservation and structural editing are different requirements;
compare with the [hosted-engine approach](hosted-engine-editor.md).

## Evidence boundaries

The Aztec investigation found that preserved hidden HTML wrappers did not imply
native operations could split, join, indent, or outdent those document nodes.
Its parser could flatten paragraphs and accumulate line breaks across reopen,
while programmatic edits did not necessarily participate in undo. Treat those as
constraints on that examined adapter, not a current verdict for every editor.

Require schema-level load/edit/undo/save/reopen assertions in addition to native
text operations. Test repeated serialization, attributes, child order, and
selection semantics. Handler calls alone do not qualify real Enter/Tab input,
IME, paste, accessibility, or hit testing.

## Find local evidence

The detailed Aztec report and target/model outputs are indexed in
`local_artifacts` with their original revisions and exact file hashes. Follow
[operational evidence lookup](../exploration.md#operational-evidence); preserve
the examined engine version and conditions when applying an upstream limitation.
