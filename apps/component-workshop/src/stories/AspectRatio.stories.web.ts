// Uses the maintained AspectRatioShowcase example; do not copy its implementation here.
import { AspectRatioShowcase as Example } from '@xplat/astryx-sandbox/examples/media/AspectRatioShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'aspectratio/basic',
  title: 'AspectRatio / Basic',
  componentId: '@octane-xplat/ui#AspectRatio',
  targets: ['web'],
  component: Example,
  args: {},
})
