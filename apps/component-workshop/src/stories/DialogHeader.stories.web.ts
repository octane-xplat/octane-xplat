// Uses the maintained DialogHeaderShowcase example; do not copy its implementation here.
import { DialogHeaderShowcase as Example } from '@xplat/astryx-sandbox/examples/dialog/DialogHeaderShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'dialogheader/basic',
  title: 'DialogHeader / Basic',
  componentId: '@octane-xplat/ui#DialogHeader',
  targets: ['web'],
  component: Example,
  args: {},
})
