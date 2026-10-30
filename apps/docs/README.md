# Docs site

The site renders the Markdown files in `docs/`. From the repository root,
run the preview command:

```sh
bun run --filter @xplat/docs dev
```

Guides live in `docs/start/`, `docs/app/`, `docs/platform/`, and
`docs/testing/`. Internal implementation notes, design decisions, and workflow
recipes live under `.agents/` and are not part of the docs-site corpus. Page
URLs stay independent of guide folders, so moving a guide keeps its existing URL.

## Agent prompt card

The front page includes a themed `AgentPrompt` card after its opening
callout. It copies the full setup prompt, expands the faded preview, and offers
an action to open the prompt in ChatGPT. The prompt points to the existing
agent-readable guides; it does not introduce a separate setup workflow.
The card uses the docs' font families, surface colors, and squircle corners.

```tsx
// A docs-app component.
import { AgentPrompt } from './src/AgentPrompt.tsrx'

export function SetupPrompt() {
	return <AgentPrompt prompt="Read AGENTS.md, then add a packing checklist." />
}
```

Reuse `AgentPrompt` from `src/AgentPrompt.tsrx` with a `prompt` string.
For a Markdown page, pass `agentPrompt` to `MdDoc` to insert it after the
opening H1 callout. Set `dir` to the Markdown page's directory within `docs/`
(an empty string for `docs/README.md`) so relative links resolve correctly.
Copy failures expand the text for manual selection.

```tsx
import { MdDoc } from './src/MdDoc.tsrx'

export function GuidePrompt() {
	return (
		<MdDoc
			dir=""
			md="# Pack for your trip\n\n> Build a packing checklist."
			agentPrompt="Add a packing checklist."
		/>
	)
}
```

## Highlight a phrase

Wrap a phrase in double equals signs to give it the green highlight from Sketch.
For example, in `docs/README.md`:

```md
Share ==one TypeScript codebase== across targets.
Then ==[Create your first app](../../docs/start/toolchain.md#create-and-run)==.
```

Highlights work in paragraphs, lists, quotes, callouts, and table cells.
They can contain bold, italic, inline code, and links. Inline code and fenced
code blocks keep `==` literal; headings do not render highlights.

The front page (`docs/README.md`, served at `/`) uses highlights for key phrases
and its first-app link. Build and check the rendered site with:

```sh
bun run turbo run smoke --filter=@xplat/docs
```

## Shared UI and browser host

Author docs screens with `@octane-xplat/ui` components. For example, use
`Heading` for a Markdown heading and `NavLink` for a link to another guide.

```tsx
import { Heading, NavLink } from '@octane-xplat/ui'

export function GuideIntroduction() {
	return <>
		<Heading level={1}>Build your first app</Heading>
		<NavLink to="/:slug?" params={{ slug: 'toolchain' }}>Create and run</NavLink>
	</>
}
```

The site still runs in a browser. Browser integration stays in
`docs-host.web.tsrx`, `scroll.web.ts`, and the entry files; shared UI does not
by itself make the docs a native app. See the
[remaining integration gaps](../../.agents/docs/docs-site.md) before adding a
platform host or a new browser escape hatch.
