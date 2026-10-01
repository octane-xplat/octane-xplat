# Docs site

The site renders the Markdown files in `docs/`. From the repository root,
run `pnpm --filter @xplat/docs dev` to preview changes.

## Agent prompt card

The front page includes a themed `AgentPrompt` card after its opening
callout. It copies the full setup prompt, expands the faded preview, and offers
an action to open the prompt in ChatGPT. The prompt points to the existing
agent-readable guides; it does not introduce a separate setup workflow.
The card uses the docs' font families, surface colors, and squircle corners.

Reuse `AgentPrompt` from `src/AgentPrompt.web.tsrx` with a `prompt` string.
For a Markdown page, pass `agentPrompt` to `MdDoc` to insert it after the
opening H1 callout. Copy failures expand the text for manual selection.

## Highlight a phrase

Wrap a phrase in double equals signs to give it the green highlight from Sketch:

```md
Share ==one TypeScript codebase== across targets.
==[Prove the loop first](toolchain.md#create-and-run)==.
```

Highlights work in paragraphs, lists, quotes, callouts, and table cells.
They can contain bold, italic, inline code, and links. Inline code and fenced
code blocks keep `==` literal; headings do not render highlights.

The Xplat page (`docs/README.md`, served at `/`) includes both examples above.
Run `pnpm --filter @xplat/docs smoke` to build and check the rendered site.
