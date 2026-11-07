// Uses the maintained TooltipShowcase example; do not copy its implementation here.
import { TooltipShowcase as Example } from '@xplat/astryx-sandbox/examples/tooltip/TooltipShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tooltip/basic',
  title: 'Tooltip / Basic',
  componentId: '@octane-xplat/ui#Tooltip',
  targets: ['web'],
  component: Example,
  args: {},
})
