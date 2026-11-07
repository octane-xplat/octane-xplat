// Uses the maintained CodeShowcase example; do not copy its implementation here.
import { CodeShowcase as Example } from '@xplat/astryx-sandbox/examples/code/CodeShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'code/basic',
  title: 'Code / Basic',
  componentId: '@octane-xplat/ui#Code',
  gallery: { group: 'primitives' },
  targets: ['web'],
  component: Example,
  args: {},
})
