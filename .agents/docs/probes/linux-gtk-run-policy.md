# Linux GTK proof: bounded run policy

This document declares the bounded run policy every new item-3 proof run must
adopt **before** it executes. The item-1 contract
(`plans/linux-gtk-original-environment-contract.md`) fixes the latency, count
and drain criteria and requires bounds to be predeclared; it leaves the
failure-shutdown and whole-run bounds open. This policy fills those without
altering any contract criterion. It authorizes no runtime execution — Linux VM
admission is still externally blocked, so the run itself remains held.

The policy is also encoded in `scripts/probe/linux-gtk-evidence.mjs` as
`RUN_POLICY`, and `assessContractRun` evaluates evidence against it
fail-closed. A run may tighten a bound in its declared `contract-header`
policy but may never relax one.

## Declared bounds

| Criterion                                       | Bound                                                                               | Source          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- | --------------- |
| Samples per latency distribution                | >= 100 paired monotonic samples                                                     | Contract sec. 6 |
| Signal write to widget update, idle             | p95 <= 16 ms                                                                        | Contract sec. 6 |
| Signal write to widget update, sustained resize | p95 <= 100 ms                                                                       | Contract sec. 6 |
| OS input event to application callback          | p95 <= 150 ms                                                                       | Contract sec. 6 |
| Reorder commit to corrected hit-testing         | p95 <= 100 ms                                                                       | Contract sec. 6 |
| `setTimeout(50)` during sustained resize        | every sample within [40, 200] ms, >= 100 samples                                    | Contract sec. 6 |
| OS input during resize (no starvation)          | >= 1 injected input                                                                 | Contract sec. 6 |
| Mount/unmount cycles to baseline +/-0           | >= 20 cycles, per-cycle ledger                                                      | Contract sec. 6 |
| Close drain window                              | >= 5000 ms, zero late callbacks / disposed accesses / live sources / residual nodes | Contract sec. 6 |
| Failure-shutdown bound                          | <= 5000 ms per deliberate-failure case                                              | **This policy** |
| Whole-run wall time                             | <= 1200000 ms (20 min)                                                              | **This policy** |

Every latency distribution is measured with a monotonic clock as paired
start/end records — `signal-latency` uses `startMs`/`endMs`, `input-latency`
uses `injectMs`/`callbackMs`, `reorder` uses `commitMs`/`pickMs`, and `resize`
uses `signalPairs` of the same shape. Aggregate values (`samples`, `p95`,
`min`, `max`, `raw`) may be reported alongside the pairs but are recomputed by
the assessor; any mismatch is an integrity failure.

## What a run must declare and emit

- A `contract-header` record (`schema: 2`) carrying `caseId`, `revision`,
  `octaneVersion`, `octanePatch`, `bundleHash`, `invocation`, and the declared
  `policy` object. It must be the first measured-evidence-adjacent record in
  the proof log: emitted before `signal-latency`, `resize`, `input-latency`
  and `reorder`, so bounds are demonstrably predeclared.
- A terminal `run-status` record: `{status: 'complete', wallMs}` on a finished
  run, or `{status: 'blocked', reason}` where the reason is one of
  `missing-display-session`, `missing-input-tooling`,
  `input-permission-denied` or `missing-environment`. Nothing else is a
  blocked verdict; a failed measurement is a fail.
- Every OS-input claim carries `inputClass: 'os'` plus a mechanism mapping to
  contract tier A (`qemu-hid`, `qemu-monitor`, `qmp`) or tier B (`xtest`,
  `xdotool`, `python-xlib`, `xtest-fake`). Toolkit dispatch, GDK synthesis and
  headless backends never qualify. Activation and editing require OS input.
- The full schema-2 record set assessed by `assessContractRun`: `environment`,
  `globals` (exhaustive dereferenced-global inventory, zero unguarded
  forbidden dereferences), `load`, `mount`, `ordering`,
  `stable-identity`, `activation`, `callback-replacement`, `editing-user`,
  `editing-controlled` (including the caret/selection-only interruption case),
  `lifecycle` (per-cycle baseline ledger, not aggregates), `drain`, and the
  `failure-load` / `failure-handler` / `failure-rejection` matrix with
  retained cause, process state and bounded-shutdown evidence.

## Verdicts and review

`assessContractRun` returns `pass` only when every criterion is met, `blocked`
only for a declared missing-resource reason, and `fail` otherwise. Its exit
codes are 0, 3 and 1 respectively. A `pass` is a producer-side evidence
verdict only: the item-4 independent reviewer must still re-check every
criterion before native implementation unblocks, and reviewer independence is
forfeit if the reviewer touched the proof. Retained runs 12–16 stay immutable
under the schema-1 audit; this policy applies only to new runs.
