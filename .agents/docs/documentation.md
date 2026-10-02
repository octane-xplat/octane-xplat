# Documentation coverage

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

## Earn interest and keep momentum

Give people room to fall in love with the framework. Help them picture
something they want to build, see how Xplat makes it possible, and feel
confident taking the first step. Earning interest and sustaining excitement
are part of the docs' job and support the framework's growth. Apply this
mindset when writing new documentation and reviewing existing pages.

- Hook readers with an appealing possibility and a concrete, achievable
  result. Let them see the value before asking them to absorb optional
  complexity, setup costs, or an inventory of caveats.
- Be honest about costs and limitations when they affect the reader's next
  decision or action. Explain what they need for that next step and how to
  proceed. For example, introduce phone development tools when readers are
  ready to try their working browser app on a phone, and signing requirements
  when they are preparing to release it.
- Keep excitement grounded in real capabilities and useful examples. A
  reader's first success, growing understanding, and trust should reinforce
  their interest in the framework.
- Serve the page's job. Introductions inspire and orient; tutorials deliver
  a first success; task guides help readers build features; concept guides
  help them adapt; reference gives exact answers; troubleshooting helps them
  recover; maintenance and release guides help them keep and ship working
  apps; contributor notes explain how to extend the framework.
- Support humans and agents together. Humans need motivation, understanding,
  and confidence. Agents need precise APIs, constraints, supported patterns,
  and checks. Keep current instructions, known limitations, and historical
  experiments distinguishable so both can act with confidence.

When reviewing a page, ask whether it helps readers want to continue and
makes their next step feel achievable. Place detail according to the job
they came to complete, using progressive disclosure to preserve momentum.

## Audience and voice

Write the app-building docs for junior engineers and people building with a
coding agent who may have no programming experience (often called vibe coders).
Help them make something useful and understand what they are doing. Do not
assume they know React, TypeScript, terminal commands, or software-engineering
terms. Experienced readers can follow links to deeper material.

- Use a friendly, direct voice. Avoid corporate language, slogans, and
  abstractions such as "product behavior," "calibration task," or "prove the
  loop" when a concrete action says what to do.
- Introduce terms when readers need them: a component is a reusable piece of
  a screen; a terminal is where they type commands. Explain what commands do,
  where to run them, what to expect, and how to recognize success.
- Start with a small result readers can see. Put advanced architecture,
  framework internals, and release details after the first working app or in
  linked reference pages. State required setup and support limits plainly.
- Support both writing code and asking an agent to write it. Give concrete
  prompts, examples, and checks without making the reader responsible for
  knowing unexplained engineering concepts or treating agent use as mandatory.
- Be encouraging without overpromising or talking down to readers. Explain
  likely mistakes and fixes as a normal part of building. Keep technical names
  exact and preserve important limits; approachable does not mean imprecise.
- Review every changed guide from this starting point. Can someone new to
  programming understand the next action, why it matters, and what should
  happen? Technical reference and historical design notes can retain necessary
  detail, but label their purpose and keep them out of the beginner path.

## Progressive disclosure

Give readers the information they need for their current step. Introduce more
detail as their app and questions grow, rather than asking them to understand
the whole framework before they can start.

- Lead with one small, working path. Show alternatives when readers have a
  reason to choose between them.
- Explain a term at the step that uses it. Avoid front-loading a glossary,
  package inventory, or architecture overview.
- Link to optional features, platform setup, and deeper reference with labels
  that say when readers need them. Keep the first-app path focused on getting
  an app running and making one visible change.
- Keep required prerequisites, meaningful support limits, and warnings before
  the actions they affect. Progressive disclosure must not hide information
  readers need to succeed or make a decision.
- Review each section with: “Does the reader need this now, or can it wait
  until the step that uses it?” Move detail to its task guide or reference
  when it can wait. Shorter sentences alone do not reduce the number of ideas
  a reader has to learn at once.

For example, a first browser app needs Node.js, pnpm, the create command, and
a way to recognize success. Phone development tools belong at the point
where the reader chooses to run on a phone; signing belongs with release
instructions.

## Show every API capability in code

Every paragraph that explains an API capability must have an accompanying
fenced code snippet showing how to use that capability. Place the snippet
directly before or after the explanation. This applies to functions, hooks,
components, props, options, and events across new docs and reviews of existing
docs. A link to another example does not replace the paragraph's snippet.

- Show the capability the paragraph describes with the smallest useful
  example. Keep each explanation focused so readers can connect the prose
  to the code without absorbing unrelated features.
- Make every snippet syntactically valid in its stated language and context.
  Include needed imports and definitions, or clearly connect it to setup
  already shown on the page. Explain where the code belongs. Keep placeholders
  valid; avoid pseudocode or omitted code that makes the snippet invalid.
- Use actual supported APIs and idiomatic project patterns. Follow the
  relevant platform, renderer, styling, and state conventions. Prefer code
  readers should use in their own app over shortcuts that only illustrate
  a name or signature.
- Validate new or changed snippets with the appropriate parser, compiler,
  or typecheck in their intended context. Check the claimed behavior when
  it requires execution, and report the targets actually verified. Syntax
  highlighting alone is not validation.

Review API explanations paragraph by paragraph: is the usage shown, is the
code valid, and is this how we recommend writing it?

## Workflow coverage

[Recipes](../../recipes/README.md) define the non-trivial developer workflows that
need documentation and the criteria for complete coverage. Before changing
public behavior, setup, or a supported workflow, inspect recipes by outcome and
related API name. Add or update the affected recipe, supporting docs, and
maintained examples in the same change; pure refactors ordinarily need none.
Do not weaken criteria to hide an implementation limitation.

Record criterion coverage and verification evidence separately in Silo's
`recipe_audit` table, following the recipe guide. Run `pnpm check:recipes`.
At handoff, identify affected recipes and remaining gaps, or briefly explain
why no recipe is affected. A public workflow change is not finished until its
recipe and documentation are reconciled and any remaining gap is explicit.
