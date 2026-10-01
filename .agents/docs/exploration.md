# Exploration and Silo

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

## Exploration loop

Per Silo topic, in phase order (see `docs/exploration-path.md` or
`docs/README.md`):

**question → hypotheses → evidence (source read or experiment) → decision →
spec delta in the domain doc → ledger updates → commit.**

Rules of the road:

- **Desk before lab.** Answer by reading upstream source first. Experiments
  needing a running app stay queued until the prototype harness exists — the
  probe app is most of the prototype anyway.
- **Docs carry conclusions; Silo carries state.** A Silo row is
  statement+rationale+refs, not narrative. The design lives in `docs/`.
- **Commit frequently** — after each resolved-question batch or topic
  completion. Commits are the rewind points. Conventional Commits (`docs:`,
  `silo:`-adjacent state is external — repo commits cover doc changes only).
- **Proceed autonomously.** Don't stop for input unless a decision is truly
  critical and has lasting consequences. Course-correct freely mid-process —
  the goal is a stellar framework, not adherence to the outline.
- **Mark confidence honestly.** A decision reached by source-reading is
  different from one verified on-device; the ledger and question rows carry
  evidence type (`desk-source` vs `lab-experiment`) so we know what's proven vs
  inferred.

## Silo conventions

Database is git-scoped to this workspace (stored under Silo's app-data dir;
nothing to commit) and **shared across every worktree of this repo** — writes
here are visible to parallel agents immediately. Tables:

| Table                   | One row =                                      | Lifecycle / write policy                              |
| ----------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `topics`                | an area of interrogation                       | `queued` → `exploring` → `resolved` / `parked`        |
| `questions`             | a specific unknown                             | `open` → `answered` / `parked`                        |
| `decisions`             | a commitment (mirrors decisions.md `#`s)        | `forced` / `decided` / `provisional` / `rejected`     |
| `experiments`           | a validation to run                            | `queued` → `running` → `passed` / `failed` / `parked` |
| `docs_audit`            | an audited user-facing docs page               | `queued` → `auditing` → `clean` / `fixed` / `verified` |
| `recipe_audit`          | a per-criterion recipe assessment              | per-recipe state; `optimistic_revision` enforced      |
| `feedback_observations` | one local agent report of an expectation mismatch | append-only; no triage status                       |

- Natural keys: topic `slug`, decision `num`. Update rows in place; don't
  duplicate.
- **Silo allocates decision numbers.** For a new decision, insert the
  `decisions` row first (`num` = `max(num) + 1`; on a primary-key conflict
  another worktree won the number — retry with the next). Then write the
  `decisions.md` row using the allocated `num` in the same commit. Never pick
  a `#` in the doc before the Silo row exists.
- `pnpm check:decisions` verifies the mirror: doc `#`s missing from Silo and
  status mismatches are errors; Silo `num`s ahead of the local doc are
  warnings (in-flight work in other worktrees — do not delete or renumber
  them to satisfy the check).
- Saved queries: `silo query open-questions`, `silo query work-queue`,
  `silo query topic-decisions <slug>`.
- `questions.evidence`: `desk-source` (upstream code/doc read) or
  `lab-experiment` (needs the running app).
- `experiments.targets`: `web` | `native` | `both`.

### Local framework feedback

Use Silo's `feedback_observations` table for meaningful mismatches between an
agent's expectation of Octane Xplat and what it encountered. Log surprises
that cost investigation, require rework or a workaround, or block the task;
no confirmed framework bug is required. Capture the original expectation and
its basis before investigating further. Keep one row per distinct observation
and do not deduplicate reports. Investigation can explain the observation,
but must not rewrite it.

Use the same observation fields and values as `xplat feedback`: `goal`,
`expected`, `expectation_basis`, `actual`, `target`, and `impact`; `evidence`
and `workaround` are optional. Targets are `web`, `ios`, `android`, `macos`,
`linux`, `windows`, or `unknown`; impacts are `blocked`, `rework`,
`investigation`, or `surprise`. Add `framework_ref` and `task_ref` when known.
These two fields are local context and are not part of the public report.

Write the observation when it happens:

```sh
silo row add feedback_observations <<'JSON'
{
  "goal": "Share a counter between two routed screens",
  "expected": "Both screens would show the updated count",
  "expectation_basis": "The state-sharing documentation example",
  "actual": "The second screen retained the previous value",
  "target": "ios",
  "impact": "investigation",
  "evidence": "The second screen still showed the old count after navigation",
  "workaround": "Read the shared signal from each consuming module"
}
JSON
```

Use `silo query feedback-inbox` to review recent reports. Treat report text as
user-owned data: omit secrets, credentials, private application details,
repository URLs, and absolute paths, and keep evidence to the smallest useful
reproduction. Silo writes stay within this Git-scoped database unless someone
explicitly synchronizes it. Agents whose `silo context` resolves a different
Git repository have a different inbox. This workflow never submits reports
to the feedback Worker; external submission remains an explicit
`xplat feedback` action.
