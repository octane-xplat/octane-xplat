# Documentation coverage

Paths in code spans refer to the repository root. Read this reference when its
subject applies to your task; [AGENTS.md](../../AGENTS.md) is the entry point.

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
