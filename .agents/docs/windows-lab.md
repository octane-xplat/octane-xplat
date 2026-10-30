# Windows host integration constraints

Use the [test-host runbook](windows-test-host.md) for contributor setup and
[Windows setup](../../docs/platform/windows-setup.md) for consumer boundaries.
Match the workspace's pinned preview payload; a registry version with the same
version string need not contain the Windows files.

## Portable tooling

Use `node:path` for platform path operations, including entrypoint detection and
generated sibling imports. Splitting on `/` or checking POSIX path suffixes
breaks Windows paths. A successful install/typecheck/build, package registration,
desktop activation, native geometry, and OS input are separate evidence.
Noninteractive SSH launch does not establish desktop presentation.

## Page preparation split

Windows Page preparation is a `.windows` leaf that returns the same Page without
changing its properties, measurement, or content. The `abae298` preview uses a
WinUI Grid host with native panel positioning; it has no mobile safe-area
measurement override. Do not apply phone-specific properties or the UIKit bounds
workaround to that host. Preserve page identity/content and reject accidental
writes in regression fixtures. Source inspection is not on-device layout evidence.

## Evidence lookup

Use Silo `windows_checks` and `windows_recipe_checks` for current qualification.
Past host details and run records are indexed under `local_artifacts` key
`.agents/docs/windows-lab.md`; follow [operational evidence](exploration.md#operational-evidence).
Do not append machine inventories or build totals to this guide.
