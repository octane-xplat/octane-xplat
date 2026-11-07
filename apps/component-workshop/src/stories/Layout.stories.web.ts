// Uses the maintained LayoutShowcase example; do not copy its implementation here.
import { LayoutShowcase as Example } from '@xplat/astryx-sandbox/examples/layout/LayoutShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'layout/basic',
  title: 'Layout / Basic',
  componentId: '@octane-xplat/ui#Layout',
  targets: ['web'],
  component: Example,
  args: {},
})
