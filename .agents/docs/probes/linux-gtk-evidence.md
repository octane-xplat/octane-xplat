# Linux GTK proof evidence harness

`linux-gtk-evidence.mjs` has two modes sharing one JSONL parser:

- **Default (`--retained`)** audits the archived Rosemary runs 12–16 reviewed
  by Rory. It never certifies anything and always exits nonzero.
- **`--contract`** assesses a new schema-2 proof run against the exact item-1
  contract and the declared [bounded run policy](./linux-gtk-run-policy.md),
  fail-closed. Its `pass` is a producer-side verdict only; the item-4
  independent review still decides the gate.

## Retained-evidence audit (default)

This contributor diagnostic reproduces the evidence gaps in the archived
Rosemary proof reviewed by Rory. It supports repair of plan item 3; it does
not implement a GTK backend or decide the independent item-4 gate.

Run it from the repository root against the original JSONL files retained in
Boss deliverable `21b03833-bda7-4b30-b053-65f5d7cfdb93`. The example assumes
you placed a read-only copy of those files in `research/linux-gtk-proof/evidence/`:

```sh
node scripts/probe/linux-gtk-evidence.ts \
  research/linux-gtk-proof/evidence/run16-proof-log.jsonl \
  research/linux-gtk-proof/evidence/run16-orchestrator.jsonl
```

Exit 1 and `status: "insufficient-evidence"` are expected for the retained
runs. Exit 2 means the inputs could not be read or parsed. There is no exit-0
certification path. The gap list includes source-review findings specific to
the archived proof; do not apply this tool to a strengthened proof as its
acceptance validator. A new run needs its own raw evidence and independent
review against the approved plan and original item-1 contract.

The tool reads the historical nested `kind` payload, reports sample counts
and recomputes p95 from the recorded values. Idle and resize arrays are rounded
in those logs, so their reported p95 is also rounded. It retains the known
16 ms idle, 100 ms resize-signal/reorder and [40,200] ms timer bounds and the
100-sample minimum; these figures do not replace the original contract.
Aggregate lifecycle counts and process exit 0 cannot establish a passing gate.

The tests cover malformed evidence, insufficient samples, duplicate phases,
rejection despite a successful process exit, and the schema-2 contract:
deterministic fixtures assert a passing shape plus a negative case per
criterion. They run on the host without GTK, a VM, screenshots or input
injection:

```sh
node --test scripts/probe/linux-gtk-evidence.test.mjs
```

Proof repairs must preserve the original evidence and selection-settle/echo
fixes. New evidence must include paired monotonic timings, direct scheduling
and stable-identity assertions, per-cycle lifetime ledgers, selection
interruption cases and retained cause/process/bounded-shutdown results for
deliberate load, handler and scheduled-work failures. A different employee
must review it before native implementation begins.

## Contract assessment (`--contract`)

A strengthened run emits schema-2 JSONL: the same `domain`/`phase`/`kind`
shape as the retained logs plus the record set declared by the
[bounded run policy](./linux-gtk-run-policy.md), anchored by a predeclared
`contract-header` and a terminal `run-status`. Assess it with:

```sh
node scripts/probe/linux-gtk-evidence.ts --contract PROOF_JSONL ORCHESTRATOR_JSONL
```

Exit 0 `pass`, exit 1 `fail`, exit 3 `blocked`, exit 2 unreadable input.
`blocked` is returned only for a declared missing-resource reason
(`missing-display-session`, `missing-input-tooling`,
`input-permission-denied`, `missing-environment`); a failed measurement is a
fail, and no evidence shape can upgrade itself to blocked. A `pass` certifies
producer-side completeness against the contract — nothing more. Wayland,
x86_64, assistive technology and the rest of the qualification matrix remain
separate gaps, and the Linux proof runtime is still held pending VM
admission, so no new run can exist yet.

## Orchestrator shutdown regression

`linux-gtk-orchestrate.sh` is the maintained derivative of the archived
`guest-orchestrate.sh` in Boss deliverable
`21b03833-bda7-4b30-b053-65f5d7cfdb93`. Its header records the archived
source SHA-256. Keep that evidence archive unchanged. The derivative preserves
the original 600-second run deadline and the policy's five-second shutdown
limit; `PROOF_TIMEOUT_SECONDS` may only tighten the run deadline for controlled
fixtures, and `PROOF_EXECUTABLE` selects a fixture executable in tests.

The maintained regression uses ordinary fake child processes and does not
launch GJS, GTK, a VM or OS input:

```sh
node --test scripts/probe/linux-gtk-orchestrate.test.mjs
```

It checks successful completion, error exit propagation, and timeout cleanup
when the child ignores `SIGTERM`. Timeout exits with status 124; normal child
exit status is preserved.
