// Uses the maintained InputGroupShowcase example; do not copy its implementation here.
import { InputGroupShowcase as Example } from '@xplat/astryx-sandbox/examples/inputgroup/InputGroupShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'inputgroup/basic',
  title: 'InputGroup / Basic',
  componentId: '@octane-xplat/ui#InputGroup',
  targets: ['web'],
  component: Example,
  args: {},
})
