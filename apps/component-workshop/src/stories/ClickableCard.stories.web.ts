// Uses the maintained ClickableCardShowcase example; do not copy its implementation here.
import { ClickableCardShowcase as Example } from '@xplat/astryx-sandbox/examples/card/ClickableCardShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'clickablecard/basic',
  title: 'ClickableCard / Basic',
  componentId: '@octane-xplat/ui#ClickableCard',
  targets: ['web'],
  component: Example,
  args: {},
})
