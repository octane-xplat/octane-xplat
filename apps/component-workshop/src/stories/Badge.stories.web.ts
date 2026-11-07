// Uses the maintained BadgeShowcase example; do not copy its implementation here.
import { BadgeShowcase as Example } from '@xplat/astryx-sandbox/examples/badge/BadgeShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'badge/basic',
  title: 'Badge / Basic',
  componentId: '@octane-xplat/ui#Badge',
  targets: ['web'],
  component: Example,
  args: {},
})
