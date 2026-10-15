# Linux GTK feasibility gate review

**Gate verdict: fail — required evidence is incomplete.** Production GTK
implementation remains gated. This is an evidence rejection, not a finding
that Octane cannot run in GJS.

Rory independently reviewed Rosemary's item-3 proof on 2026-10-12. The reviewer
did not produce or modify that proof. No new Linux execution, OS input, native
build, screenshots or visual analysis occurred during this review.

## Scope and provenance

The [approved plan](goddard://task/c71a8676-f4a5-43c3-aadb-2c621208c9b0)
is plan `6b11d11f-f501-4e99-8f72-dd6f01fe976b`, approved revision
`cd4ac0e4-911f-4c16-a1f3-5fa9c74b0b19`, content digest
`b1ebab8855e9fd08ab96bcd0cebabcccda109ba31882d05d676a40753db5061a`.
Approval controls despite the stale heading. Full integrated implementation
remains required; qualification is separate.

Reviewed [Rosemary's handoff](goddard://task/0eeb7e3f-3a67-4d5a-ac01-c6466ba118cd),
the frozen plan, item-1 environment/evidence contract and item-2
[capability inventory](../docs/notes/linux-gtk-capability-inventory.md). Historical outcome
`7403c1f2-6235-4b2f-904e-2888142a6197` remains context; current continuation
outcome `bac7e453-9429-4346-88fb-9c613808a29a` carries the approved plan link.
Items 1, 2 and 6a are recorded done; items 3 and 4 remain to-do in the plan.

Reviewed source at Rosemary's reported revision
`d6f9f713967363c50e3aba57a06a870e99cb01ae`, plus retained source and raw runs
12–16. The final bundle MD5 independently matches
`e149a206095f8cc9226cf8d0d3526ca4`. Evidence is preserved as Boss deliverable
`21b03833-bda7-4b30-b053-65f5d7cfdb93`, including source, final bundle, raw logs,
selection repros, SHA-256 manifest and parsed audit. No credentials or VM disks
were copied. The review baseline is `2572b3c5`.

## Review against every proof area

- **Runtime loading:** real compiled Octane universal runtime loads and mounts
  GTK widgets. The report records Octane 0.11.0/patch dc0b2a2b, Debian 13 aarch64,
  GJS 1.82.3, GTK 4.18.6 and GLib 2.84.4. Selected globals are logged, but no
  exhaustive reachable-global inventory establishes every load/run assumption.
  Dependency floors remain candidates rather than qualified minimum versions.
- **Scheduling:** Promise-based microtask bridge and recorded ordering. Runs
  15/16 have 100 idle signal samples, p95 1.404/1.725 ms within 16 ms. All 40
  resize timers lie within 40–200 ms. Resize signal distributions contain only
  40 samples, below 100. The label check occurs later rather than directly in
  each same-turn timer/idle callback.
- **Reconciliation:** native universal operations and overlap hit-testing are
  evidenced; real XTEST click reaches the reordered top child. Only one timing
  sample per run (1.227/1.568 ms), below 100. Stable native identity across
  ordinary updates is not explicitly asserted.
- **Events:** XTEST activation gives one callback; replacement uses the latest
  handler; controlled writes produce zero synthetic changes. Input latency uses
  sparse wall-clock injection/callback correlation, not 100 paired monotonic
  OS-event/callback samples. Logging before window activation/movement does not
  independently observe the OS event.
- **Editing:** XTEST typing gives five changes and submit. Controlled value
  becomes world; selection is [0,5] at +150 ms, transiently null at +30 ms.
  Preserve the settle fix and add interruption cases before reuse. Guards
  observe text edits, not user caret/selection changes without text changes.
  IME remains separate qualification.
- **Lifecycle:** 20 cycles record no residual nodes; aggregate subscription and
  selection-source deltas are zero. Final connections/disconnections balance
  at 126; five-second drain reports zero late callbacks/nodes/sources. Missing:
  per-cycle subscription/controller/queued-callback baselines and complete
  controller/deferred-dispatch accounting. Aggregate balance cannot prove
  every-cycle baseline.
- **Failure:** handler throw logs cause/stack and execution reaches clean close
  and exit 0. No deliberately failing load exists. Rejection is marked sent,
  but cited run15 stderr is absent from retained host evidence. Each failure
  class needs retained cause, process state and bounded-shutdown assertions.

X11 XTEST is an accepted tier-B input mechanism; literal physical input is not
required for this proof. Wayland, x86_64, assistive technology, mixed-scale
monitors and hosted surfaces remain separately tracked qualification gaps.
Their absence did not cause this rejection.

## Required continuation

Strengthen the disposable proof without changing the predeclared bounds:
at least 100 samples per latency distribution, paired monotonic OS-event
timing, direct scheduling/identity assertions, per-cycle lifetime ledgers and
observable deliberate load/handler/scheduled-work failure cases. Retain raw
data, stderr, invocation, source/bundle hashes and a fail-closed verdict.
Preserve identical-text echo suppression and the bounded, cancelable,
user-edit-guarded selection settle. Keep existing evidence immutable.

A different employee must review the strengthened proof before native work
starts. Reviewer independence must be renewed if this reviewer changes the
proof. Items 5, 6b and 7a–7d remain gated; all 212 inventory rows remain required.

Guest work needs an owned reservation for `linux:gtk-proof-vm`, one resident
device and one native-build slot, with no host desktop input. Check existing QEMU/disk ownership before reuse; preserve other devices/state.

Thea's shared environment configuration commit `af78ee6a` is an ancestor of
the review baseline. It centralizes platform resolution and requires coverage
of platform barrels; it does not compare exported type shapes. That change
does not modify public barrels or shared props. GTK must preserve identical
public APIs and add its own environment rather than inherit DOM/WebKit types.
