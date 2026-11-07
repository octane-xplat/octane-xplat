# @octane-xplat/workshop

> Component workshop for Octane Xplat — typed stories, metadata discovery, adaptive shell, lifecycle and warm reload

Develop a component on its own page, edit explicit inputs and Reset to a fresh
example. Start with the browser; macOS AppKit and Linux GTK4 have real launch
paths with separate host qualification limits. iOS, Android and Windows remain
unqualified. Authoring contract version: **1**.

Follow [Develop a component in the workshop](https://octane-xplat.goddardai.org/component-workshop)
for the complete story, state, fixture/provider lifecycle, reload and production
exclusion workflow.


[Generated API reference](https://octane-xplat.goddardai.org/api-workshop).

## Try it

New web-capable app and library starters include a ready-to-run example:

```sh
bun run workshop
```

Open **Gallery** to browse all story components, or [try our public workshop](https://octane-xplat.goddardai.org/workshop/).
Publish an explicit public catalog separately from the ordinary app build:

```sh
bun run xplat workshop build --target web --out-dir dist/workshop --base /workshop/
```


Inside a configured Xplat app, keep its existing matching compiler/runtime:

```sh
bun add -D @octane-xplat/workshop @octane-xplat/cli @octanejs/vite-plugin vite
bun run xplat workshop init
bun run xplat workshop doctor
bun run xplat workshop dev --target web
```

Open the printed URL and choose **Workshop / Counter**. Increment, edit step,
then Reset. Initialization preserves existing app entries; the workshop is a
separate development page. Keep stories out of the production import graph.

For a small first story, save this as `src/Welcome.stories.tsx`. Choose
**Examples / Welcome** and edit the message control to update the preview.
Reset restores “Hello”.

```tsx
import { Text } from '@octane-xplat/ui'
import { defineStory } from '@octane-xplat/workshop'

type Props = { message: string }
function Welcome(props: Props) {
  return <Text>{props.message}</Text>
}

export const Basic = defineStory<Props>({
  id: 'welcome/basic',
  title: 'Examples / Welcome',
  targets: ['web'],
  component: Welcome,
  args: { message: 'Hello' },
  controls: { message: { type: 'string' } },
})
```

## Continue the workflow

- [Declare a typed story](https://octane-xplat.goddardai.org/component-workshop#declaring-stories), then compare control edits with Reset.
- [Own fixtures and providers](https://octane-xplat.goddardai.org/component-workshop#owned-fixture-resources) so switching and reload release resources.
- [Check host support and evidence](https://octane-xplat.goddardai.org/component-workshop#platform-support-and-evidence) before choosing another target.
- [Keep the production build separate](https://octane-xplat.goddardai.org/component-workshop#production-exclusion) and verify no story/fixture code ships.
