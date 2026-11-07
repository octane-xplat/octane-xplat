// Uses the maintained HoverCardShowcase example; do not copy its implementation here.
import { HoverCardShowcase as Example } from '@xplat/astryx-sandbox/examples/hovercard/HoverCardShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'hovercard/basic',
  title: 'HoverCard / Basic',
  componentId: '@octane-xplat/ui#HoverCard',
  targets: ['web'],
  component: Example,
  args: {},
})
