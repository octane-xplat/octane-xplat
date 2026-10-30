# Routing architecture and evidence

Decision #118 separates immutable route definitions from instance-owned matches,
context, navigation attempts, subscriptions, and cleanup. Preparation resolves a
destination; platform adapters own committing it to browser history, native
Frames, or rendered panes.

```text
catalog + instance context -> match/validate/guard/load -> prepared outcome
prepared outcome -> platform adapter -> committed history and presentation
```

The 2026-10-19 hard cutover removed the old router stores, helpers, and
compatibility adapter. Their implementation sequence and compatibility examples
are historical, not supported workflows. Plans are now maintained elsewhere.

- [Declared and runtime contracts](routing-contracts.md) owns current internal
  invariants, catalog evidence, instance/context boundaries, history preparation,
  native handoff, and retirement.
- [Navigation guide](../../../docs/app/navigation.md) owns app-facing workflows.
- [Navigation checks](../navigation-checks.md) owns maintained verification
  commands and their evidence boundaries.
- [Native Frames](../../skills/octane-xplat/references/navigation/native-frames.md)
  explains when platform stack internals matter.

Preparation, handler dispatch, typechecking, native objects, and actual OS input
establish different things. Preserve each check's target and revision; a ready
preparation result does not prove presentation or hit testing. Keep upstream
limitations and remaining platform qualification in the owning contract section
rather than reintroducing migration history here.
