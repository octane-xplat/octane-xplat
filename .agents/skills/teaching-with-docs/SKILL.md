---
name: teaching-with-docs
description: Write, review, or restructure documentation to teach readers how to complete a task, understand a concept, or make a decision, using progressive explanations and concrete examples. Applies to guides, tutorials, READMEs, and explanatory reference material across tools and domains.
---

# Teaching with Docs

Help readers reach a useful result and understand enough to adapt it. Ground
explanations in the subject's actual behavior, organize around reader needs,
and make important claims observable.

For Octane Xplat, follow the [documentation audience and voice](../../docs/documentation.md#audience-and-voice):
app-building guides must welcome junior engineers and
people using coding agents with no prior programming experience. Explain terms
and prerequisites as they become useful, lead with a small visible result,
and keep corporate language and advanced internals out of the beginner path.
Use [progressive disclosure](../../docs/documentation.md#progressive-disclosure):
give readers what they need for the current step and link to optional detail
when they have a reason to use it.
Follow [earn interest and keep momentum](../../docs/documentation.md#earn-interest-and-keep-momentum)
across new docs and reviews: help people picture what they want to build and
feel capable of starting. Introduce costs and limitations when they affect
the next decision, and serve each page's job for human readers and agents.

## Establish the Reader's Job

Before drafting, identify what readers are trying to accomplish, what they
already know, and what they should be able to do or decide afterward. Give each
page one durable job; a narrow correction does not require a docs redesign.

Read the relevant existing documentation and authoritative evidence for the
subject: source, tests, specifications, examples, or established procedures.
Use the project's vocabulary and supported boundaries. Distinguish verified
behavior from assumptions; do not fill gaps with plausible invented details.

Preserve the document's role and local conventions. A standalone README does
not need a docs-site page template. Navigation, callout syntax, branding,
diagram support, and generated reference depend on the publishing system;
inspect that system when those details matter rather than assuming a renderer.

## Build an Explanation Readers Can Follow

Lead with the idea that answers the reader's problem, then explain when it is
useful and what result it enables. Put prerequisites before dependent steps,
tradeoffs before the choices they affect, and warnings immediately before the
actions they can change.

For learning-oriented pages, a useful progression is orientation, a working
example, the mental model behind it, and deeper reference. Adapt this order to
the reader: lookup pages should lead with facts, and a concept needed to use an
example safely belongs before it.

Introduce unfamiliar ideas when readers need them. Explain the connection
between an action and its result instead of presenting disconnected facts or
commands. Keep advanced internals and optional workflows out of the required
beginner path. Include enough explanation for readers to adapt an example,
not merely repeat it.

Use plain language and stable terminology. Prefer observable outcomes over
claims such as "makes the workflow easier." State limits and failure cases
beside the benefits they qualify. Use specific, descriptive headings that let
readers predict a section's contents.

## Teach Through Examples

For Xplat, [show every API capability in code](../../docs/documentation.md#show-every-api-capability-in-code):
every paragraph explaining an API capability needs an adjacent fenced usage
snippet. Validate its syntax in the intended context and use idiomatic project
patterns; a reference link or syntax highlighting does not satisfy the rule.

Give unfamiliar mechanisms and consequential choices a nearby concrete
example. Choose the smallest realistic example that demonstrates the point,
with enough context to explain:

- the situation that makes it relevant;
- the input, prerequisites, or starting state;
- the action, configuration, or reasoning to apply;
- the observable result and how to check it.

For example, an explanation of configuration precedence can show a stored
value of `retries = 3`, a one-run override of `retries = 0`, and the result:
this run makes no retries while the stored default remains `3`. Use this
pattern only when the documented system actually has those semantics.

Use real names, paths, and supported operations for the project at hand.
Keep executable examples complete, internally consistent, and safe to copy.
Clearly distinguish placeholders and illustrative fragments from runnable
commands. Do not imply that comments are accepted by a format merely because
the syntax highlighter can display them.

Show expected output or another success check. When a likely failure changes
the reader's next action, show how to recognize it and what to check or fix.
For prose concepts, before/after examples or contrasting cases can make a
boundary clearer than another abstract definition. Keep essential explanation
in the surrounding text rather than hiding it in code comments.

## Organize for Learning and Lookup

When working across pages, organize around reader movement rather than
implementation ownership:

- **Overview:** what the subject is, when it fits, and the first meaningful decisions.
- **Task guide or tutorial:** a path from prerequisites to a verified result.
- **Concept guide:** a mental model, its boundaries, and relevant tradeoffs.
- **Reference:** complete, scannable facts within an explicit scope.
- **Troubleshooting:** symptoms, likely causes, verification, and focused fixes.

These are page purposes, not a requirement to create every kind of page.
Give shared concepts a canonical home and link to deeper explanations while
keeping enough local context to complete the current task. Preserve the
project's authoritative home for API facts or other generated reference;
teach usage and reasoning without copying facts into competing sources.

For reference material, include the facts needed to act correctly. Commands
may need arguments, defaults, side effects, and failure behavior; configuration
may need types, allowed values, and precedence. Keep comparisons parallel so
readers can scan differences. End a learning path with a relevant next step
when one is needed, rather than a generic list of links.

## Choose Representations Deliberately

Use a command, sample input and output, file tree, schema, or table when it
makes the next action or decision concrete. Use diagrams when relationships,
branching, ownership, states, or interactions would otherwise be difficult to
reconstruct from prose. Keep each diagram focused on one idea and explain what
the reader should notice. A short linear procedure usually needs a list;
comparable fields or options usually need a table.

Use callouts sparingly for information that changes how readers interpret or
perform the surrounding task. Keep ordinary explanation in the main flow and
follow the target renderer's supported syntax.

## Review the Reader's Path

Read changed material from the intended reader's starting knowledge. Check
that they can find their task, understand each prerequisite, follow the
example, recognize the result, and choose their next action without guessing.
Look for unexplained terms, hidden steps, unsupported claims, and duplicated
explanations that may drift.
For Xplat, also check whether the page preserves interest and makes the next
step feel achievable, with costs and limitations placed where they become
useful to the reader.
Check each paragraph explaining an API capability for its accompanying usage
snippet, syntactic validity, and idiomatic use.

Validate relevant commands, examples, links, anchors, and formatting using
existing project checks. For published-site changes, build the docs when a
build is available and check renderer-dependent features. Run code checks when
executable examples change. Report meaningful validation limits, including
examples that were inspected but could not be executed.
