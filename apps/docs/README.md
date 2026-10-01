# Docs site

The site renders the Markdown files in `docs/`. From the repository root,
run `pnpm --filter @xplat/docs dev` to preview changes.

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
