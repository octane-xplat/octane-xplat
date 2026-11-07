// Uses the maintained TabMenuShowcase example; do not copy its implementation here.
import { TabMenuShowcase as Example } from '@xplat/astryx-sandbox/examples/tabmenu/TabMenuShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tabmenu/basic',
  title: 'TabMenu / Basic',
  componentId: '@octane-xplat/ui#TabMenu',
  targets: ['web'],
  component: Example,
  args: {},
})
