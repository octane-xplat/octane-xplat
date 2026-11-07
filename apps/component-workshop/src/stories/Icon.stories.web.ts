// Uses the maintained IconShowcase example; do not copy its implementation here.
import { IconShowcase as Example } from '@xplat/astryx-sandbox/examples/icon/IconShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'icon/basic',
  title: 'Icon / Basic',
  componentId: '@octane-xplat/ui#Icon',
  targets: ['web'],
  component: Example,
  args: {},
})
