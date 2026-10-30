# Find and resolve open questions

Silo owns question state. Use its saved query to find the current queue:

```sh
silo context
silo query open-questions
silo table show questions
silo sql "SELECT legacy_ref, body, evidence, status, answer FROM questions WHERE legacy_ref = 'Q15'"
```

Inspect the schema before updating a row. Preserve its topic and evidence type;
source reading and lab experiments answer different claims. Record the answer
and rationale on the existing question, then update the owning guidance or
[decision ledger](decisions.md) when the conclusion changes future work.
Follow the [exploration loop](../docs/exploration.md) and allocate a decision
number in Silo before writing the ledger.

Historical numbered questions and their original evidence are preserved under
`local_artifacts` key `.agents/design/open-questions.md`. Use
[operational evidence](../docs/exploration.md#operational-evidence) to retrieve
them. Do not reconstruct today's queue from that snapshot or overwrite shared
questions with an older status.
