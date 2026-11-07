### Respect platform suffixes on TypeScript and JSX stories

Workshop discovery now recognizes platform suffixes on `.ts`, `.tsx`, `.js`, and `.jsx` stories as well as `.tsrx` stories. A browser-only story such as `button.stories.web.ts` stays out of native loaders even when its declared targets are `all`.

```ts
import { Button } from '@octane-xplat/ui'
import { defineStory } from '@octane-xplat/workshop'

// Save as button.stories.web.ts to limit this story to the browser.
export const Basic = defineStory({
  id: 'button/basic',
  title: 'Button / Basic',
  targets: 'all',
  component: Button,
  args: { label: 'Save' },
})
```

See [story authoring and platform applicability](https://octane-xplat.goddardai.org/component-workshop#declaring-stories).
