// Uses the maintained CenterShowcase example; do not copy its implementation here.
import { CenterShowcase as Example } from '@xplat/astryx-sandbox/examples/center/CenterShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'center/basic',
  title: 'Center / Basic',
  componentId: '@octane-xplat/ui#Center',
  targets: ['web'],
  component: Example,
  args: {},
})
