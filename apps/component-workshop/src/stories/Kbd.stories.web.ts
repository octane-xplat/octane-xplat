// Uses the maintained KbdShowcase example; do not copy its implementation here.
import { KbdShowcase as Example } from '@xplat/astryx-sandbox/examples/kbd/KbdShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'kbd/basic',
  title: 'Kbd / Basic',
  componentId: '@octane-xplat/ui#Kbd',
  targets: ['web'],
  component: Example,
  args: {},
})
