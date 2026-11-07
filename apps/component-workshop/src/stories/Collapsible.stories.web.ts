// Uses the maintained CollapsibleShowcase example; do not copy its implementation here.
import { CollapsibleShowcase as Example } from '@xplat/astryx-sandbox/examples/collapsible/CollapsibleShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'collapsible/basic',
  title: 'Collapsible / Basic',
  componentId: '@octane-xplat/ui#Collapsible',
  targets: ['web'],
  component: Example,
  args: {},
})
