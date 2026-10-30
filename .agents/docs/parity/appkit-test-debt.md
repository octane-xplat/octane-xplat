# Maintain AppKit test harnesses

Use this reference when a vm-slice or mock-host failure may come from the harness.
Run the maintained checks through Turbo; use [AppKit verification](../appkit-verification.md)
for runtime and packaged-consumer work. Suite totals, failures, branch checkpoints,
and pending runs belong in Silo and local reports.

## Maintain the harness

Keep vm slices in a separate realm. Switching to the main realm leaks top-level
declarations into shared globals and contaminates other tests. When asserting
plain foreign-realm values, compare fields or copy them into a local object
rather than relying on prototype identity.

A mock proxy must survive context construction: spreading it into a plain object
loses its fallback behavior. Keep framework globals, constructor behavior, and
feature-specific stubs explicit. Check missing helpers and stale expectations
before attributing every vm failure to cross-realm equality.

Packages whose typecheck reads their own generated declarations need their own
`typegen` dependency; `^typegen` orders only dependency packages. Validate ordering
with missing outputs instead of a warm generated-types directory.

## Find local evidence

The former checkpoint report is indexed in Silo's `local_artifacts` under this
file's repository-relative path. Follow [operational evidence lookup](../exploration.md#operational-evidence).
A unit result does not qualify native focus, OS input, geometry, or accessibility.
