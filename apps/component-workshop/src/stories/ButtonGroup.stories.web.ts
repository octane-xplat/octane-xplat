// Uses the maintained ButtonGroupShowcase example; do not copy its implementation here.
import { ButtonGroupShowcase as Example } from '@xplat/astryx-sandbox/examples/buttongroup/ButtonGroupShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'buttongroup/basic',
  title: 'ButtonGroup / Basic',
  componentId: '@octane-xplat/ui#ButtonGroup',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
