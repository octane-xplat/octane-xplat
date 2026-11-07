// Uses the maintained TabShowcase example; do not copy its implementation here.
import { TabShowcase as Example } from '@xplat/astryx-sandbox/examples/tab/TabShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'tab/basic',
  title: 'Tab / Basic',
  componentId: '@octane-xplat/ui#Tab',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
