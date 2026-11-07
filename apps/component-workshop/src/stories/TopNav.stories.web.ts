// Uses the maintained TopNavShowcase example; do not copy its implementation here.
import { TopNavShowcase as Example } from '@xplat/astryx-sandbox/examples/topnav/TopNavShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'topnav/basic',
  title: 'TopNav / Basic',
  componentId: '@octane-xplat/ui#TopNav',
  targets: ['web'],
  component: Example,
  args: {},
})
