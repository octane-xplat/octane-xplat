// Uses the maintained TopNavMenuShowcase example; do not copy its implementation here.
import { TopNavMenuShowcase as Example } from '@xplat/astryx-sandbox/examples/topnavmenu/TopNavMenuShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'topnavmenu/basic',
  title: 'TopNavMenu / Basic',
  componentId: '@octane-xplat/ui#TopNavMenu',
  targets: ['web'],
  component: Example,
  args: {},
})
