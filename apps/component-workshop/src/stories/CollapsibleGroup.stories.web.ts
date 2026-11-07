// Uses the maintained CollapsibleGroupShowcase example; do not copy its implementation here.
import { CollapsibleGroupShowcase as Example } from '@xplat/astryx-sandbox/examples/collapsiblegroup/CollapsibleGroupShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'collapsiblegroup/basic',
  title: 'CollapsibleGroup / Basic',
  componentId: '@octane-xplat/ui#CollapsibleGroup',
  targets: ['web'],
  component: Example,
  args: {},
})
