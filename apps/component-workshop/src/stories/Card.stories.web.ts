// Uses the maintained CardShowcase example; do not copy its implementation here.
import { CardShowcase as Example } from '@xplat/astryx-sandbox/examples/card/CardShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'card/basic',
  title: 'Card / Basic',
  componentId: '@octane-xplat/ui#Card',
  targets: ['web'],
  component: Example,
  args: {},
})
