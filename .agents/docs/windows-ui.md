# Qualify Windows UI controls

Use the [Windows setup guide](../../docs/platform/windows-setup.md) and
[host runbook](windows-test-host.md) to prepare the experimental target. Component
dispositions, blockers, run histories, and inventories belong in Silo and local
files; keep this page focused on how to assess a control.

## Qualify a control

Inspect `windows_checks` before selecting work. An implemented declaration or a
reused native default is not full behavior, accessibility, layout, or production
qualification. Platform-authentic phone subpaths need a separate Windows scope.

```sh
silo table show windows_checks
silo sql "SELECT key, title, status, source_revision, evidence FROM windows_checks ORDER BY key"
```

Choose a bounded user flow, retain the exact source and packaged artifact, and
exercise actual OS input when that is the behavior being claimed. Keep handler
dispatch, native automation, keyboard/pointer input, geometry, Narrator, and
visual comparison as distinct evidence. A passing prerequisite does not qualify
every dependent control.

Check shared ownership seams before making per-control workarounds: pointer
subscriptions/capture, focus and keyboard routing, controlled rollback, layout
and percentage sizing, text hosting, locale formatting, and modal cleanup. Keep
upstream repair scope and removal conditions in the
[owning repair notes](parity/windows-support-progress.md).

Use `windows_recipe_checks` for per-criterion documentation and execution
assessments; do not relabel Windows evidence as a mobile or AppKit target.

## Find local evidence

The former UI register, lab report, and later qualification report are indexed
in `local_artifacts`. Use [operational evidence lookup](exploration.md#operational-evidence)
to retrieve their file paths and provenance. Historical parked/implemented
counts do not describe current source or close current qualification gates.
