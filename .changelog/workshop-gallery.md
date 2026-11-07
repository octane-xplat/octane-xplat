### Browse and publish component workshops

New web-capable app and library starters include Workshop with a working example. The new Gallery shows story components on one page and loads interactive previews as you scroll. Give variants the same `componentId` to group them and set `gallery.primary` to choose the first preview.

```tsx
import { Button } from '@octane-xplat/ui'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'save/basic',
  title: 'Save button / Basic',
  componentId: 'app/SaveButton',
  gallery: { primary: true, height: 160 },
  targets: ['web'],
  component: Button,
  args: { label: 'Save' },
})
```

Publish a separate static workshop with `bun run xplat workshop build --target web --out-dir dist/workshop --base /workshop/`. Ordinary app builds continue excluding stories. See the [Workshop guide](https://octane-xplat.goddardai.org/component-workshop) and [interactive component gallery](https://octane-xplat.goddardai.org/workshop/).
