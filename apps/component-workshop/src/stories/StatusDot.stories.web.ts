// Uses the maintained StatusDotShowcase example; do not copy its implementation here.
import { StatusDotShowcase as Example } from '@xplat/astryx-sandbox/examples/statusdot/StatusDotShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'statusdot/basic',
  title: 'StatusDot / Basic',
  componentId: '@octane-xplat/ui#StatusDot',
  targets: ['web'],
  component: Example,
  args: {},
})
