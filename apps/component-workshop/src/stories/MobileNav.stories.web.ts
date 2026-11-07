// Uses the maintained MobileNavShowcase example; do not copy its implementation here.
import { MobileNavShowcase as Example } from '@xplat/astryx-sandbox/examples/mobilenav/MobileNavShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'mobilenav/basic',
  title: 'MobileNav / Basic',
  componentId: '@octane-xplat/ui#MobileNav',
  targets: ['web'],
  component: Example,
  args: {},
})
