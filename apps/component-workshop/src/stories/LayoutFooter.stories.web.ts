// Uses the maintained LayoutFooterShowcase example; do not copy its implementation here.
import { LayoutFooterShowcase as Example } from '@xplat/astryx-sandbox/examples/layoutfooter/LayoutFooterShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'layoutfooter/basic',
  title: 'LayoutFooter / Basic',
  componentId: '@octane-xplat/ui#LayoutFooter',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
