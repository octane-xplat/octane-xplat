// Uses the maintained LayoutPanelShowcase example; do not copy its implementation here.
import { LayoutPanelShowcase as Example } from '@xplat/astryx-sandbox/examples/layoutpanel/LayoutPanelShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'layoutpanel/basic',
  title: 'LayoutPanel / Basic',
  componentId: '@octane-xplat/ui#LayoutPanel',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
