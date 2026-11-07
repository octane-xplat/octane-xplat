// Uses the maintained LayoutContentShowcase example; do not copy its implementation here.
import { LayoutContentShowcase as Example } from '@xplat/astryx-sandbox/examples/layoutcontent/LayoutContentShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'layoutcontent/basic',
  title: 'LayoutContent / Basic',
  componentId: '@octane-xplat/ui#LayoutContent',
  targets: ['web'],
  component: Example,
  args: {},
})
