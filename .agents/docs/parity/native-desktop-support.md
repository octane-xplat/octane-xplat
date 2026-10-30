# Audit native desktop exports

Use the [desktop audit tools](../../../tools/desktop-support/README.md) to trace
source-level Windows, AppKit, and GTK exports. Keep inventories, reviewed finding
rows, source hashes, resolver captures, and report counts in local files/Silo.
They describe a revision and must not become a second tracked support matrix.

## Interpret the inventory

The identity of a row is `(package, subpath, export, target)`. A resolved export
establishes source presence; it does not establish working imports, supported
props, OS input, accessibility, packaging, or pixel parity. Type/asset entries,
upstream SDK aggregates, tooling, and platform-authentic subpaths need explicit
scope before being counted as desktop feature gaps.

The inventory union may omit mobile-only exports with no selected entry.
Wildcard modules are normalized by basename rather than every extension spelling.
External package implementations are unqualified forwards. Preserve these
boundaries when comparing inventories or interpreting missing rows.

Review dependency candidates before treating them as findings: foreign platform
imports, missing shim names, and keyword hits are leads. Comments, error paths,
and optional unsupported branches do not establish whole-export failure. Preserve
the exact source revision and resolve against the target's real conditions.

## Find local evidence

Use [operational evidence lookup](../exploration.md#operational-evidence) to find
preserved files. Former `tools/desktop-support/` artifacts are indexed by that
prefix in `local_artifacts`. A clean checkout deliberately contains no snapshots.

Use the existing `windows_checks` and `gtk_ui_checks` tables for qualification
state, and target recipe tables for criterion assessments. Keep documentation
coverage separate from execution evidence. Do not regenerate a historical baseline
or mark a pending feature qualified because a new declaration resolves.
