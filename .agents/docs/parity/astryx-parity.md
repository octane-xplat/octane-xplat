# Audit Astryx parity

Match Astryx naming and behavior where both Astryx and React Aria expose an API;
React Aria is the fallback reference. Use the version pinned by the
[browser harness](../../../tools/astryx-parity/package.json) for a new comparison.
Record the reference version and source revision with each finding rather than
assuming an older family audit uses today's harness pin.

## Compare contracts

A matching export name is an inventory observation. Audit props, defaults,
controlled state, async settlement, keyboard/IME, focus/layer ownership,
accessibility, and lifecycle for the actual workflow. Keep source comparison,
rendered geometry, pixels, synthetic events, OS input, and assistive technology
as separate evidence. Shared types do not establish native behavior.

Use the [parity harness](../../../tools/astryx-parity/README.md) for measured web
comparisons and the [family audits](README.md) for scoped contract findings.
Recheck a finding against its recorded version before treating it as current.
Update the owning public guide and skill when a supported contract changes.

## Store findings

Silo `react_aria_parity` carries the maintained equivalent/coverage inventory;
inspect its schema before writing. Its presence mapping does not stand in for a
per-prop behavioral audit. Keep detailed reports and comparison captures local,
and record recipe coverage separately from verification in the appropriate
Silo audit table. Do not append reconciliation runs or pass totals here.

Historical export inventories, reference pins, and reconciliation records are
indexed by `local_artifacts` key `.agents/docs/parity/astryx-parity.md`.
Use [operational evidence](../exploration.md#operational-evidence) to retrieve
an available exact file. A historical disposition is not a current verdict.
