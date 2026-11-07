// Uses the maintained InputGroupBasic example; do not copy its implementation here.
import { InputGroupBasic as Example } from '@xplat/astryx-sandbox/examples/inputgroup/InputGroupBasic.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'inputgrouptext/basic',
  title: 'InputGroupText / Basic',
  componentId: '@octane-xplat/ui#InputGroupText',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
