---
name: teaching-with-docs
description: Write, review, or restructure documentation to teach readers how to complete a task, understand a concept, or make a decision, using progressive explanations and concrete examples. Applies to guides, tutorials, READMEs, and explanatory reference material across tools and domains.
---

# Teaching with Docs

Help readers complete a task or make a decision, with enough understanding to
adapt the result. Give each page one reader job; a narrow correction need not
redesign the docs set.

## Choose the explanation

Ground technical claims in authoritative source, tests, specifications, or
established procedures. Preserve the document's role and renderer conventions;
a README does not need a docs-site template. State material uncertainty rather
than inventing plausible setup or behavior.

Learning paths usually move from a useful result to its mental model and deeper
reference. Lookup pages lead with exact answers; prerequisites and consequential
choices belong before dependent actions. Introduce unfamiliar terms where used.
Use a command, example payload, table, or diagram only when it makes the decision
or mechanism clearer.

Examples should connect a realistic starting state, supported action, and an
observable result. Include failure/recovery and cleanup when they change the
reader's next action. Keep explanation in prose, not only comments. Test whether
someone at the stated starting point can follow and adapt the example without
hidden knowledge.

## Apply the project contracts

For Octane Xplat, read the relevant [documentation contracts](../../docs/documentation.md):

- Audience, voice, momentum, and progressive disclosure for public explanations.
- Adjacent valid code snippets for every paragraph explaining an API capability.
- Canonical terminology, declaration comments, workflow coverage, and skill
  maintenance when those surfaces change.

Use the [quality system](../../docs/documentation-quality.md) for page ownership,
review, and validation commands. Reconcile the owning guide rather than copying
setup or API facts into another source. Report what was actually checked and any
material gap; store audit/execution state in Silo and local reports.
