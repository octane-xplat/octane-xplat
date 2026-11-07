// Uses the maintained StackItemShowcase example; do not copy its implementation here.
import { StackItemShowcase as Example } from '@xplat/astryx-sandbox/examples/stackitem/StackItemShowcase.tsrx'
import { defineStory } from '@octane-xplat/workshop'

export const Basic = defineStory({
  id: 'stackitem/basic',
  title: 'StackItem / Basic',
  componentId: '@octane-xplat/ui#StackItem',
  targets: ['web'],
  component: Example,
  args: {},
})
