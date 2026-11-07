// Uses the maintained MoreMenuShowcase example; do not copy its implementation here.
import { MoreMenuShowcase as Example } from '@xplat/astryx-sandbox/examples/menu/MoreMenuShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'moremenu/basic',
  title: 'MoreMenu / Basic',
  componentId: '@octane-xplat/ui#MoreMenu',
  targets: ['web'],
  component: Example,
  args: {},
})
