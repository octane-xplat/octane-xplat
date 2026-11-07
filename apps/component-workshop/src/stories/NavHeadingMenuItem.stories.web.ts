// Uses the maintained NavHeadingMenuShowcase example; do not copy its implementation here.
import { NavHeadingMenuShowcase as Example } from '@xplat/astryx-sandbox/examples/navheadingmenu/NavHeadingMenuShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'navheadingmenuitem/basic',
  title: 'NavHeadingMenuItem / Basic',
  componentId: '@octane-xplat/ui#NavHeadingMenuItem',
  targets: ['web'],
  component: Example,
  args: {},
})
